import os
import uuid
import json
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query, Request
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import Optional, List
from datetime import date
from database import get_db
from models.user import User
from models.marketplace import CropListing, Transaction
from routers.auth import get_current_user
from services.razorpay_service import create_order, verify_payment
from config import settings

router = APIRouter()

ALLOWED_MIMES = {"image/jpeg", "image/png"}


@router.post("/list")
async def create_listing(
    crop_name: str = Form(...),
    quantity_kg: float = Form(...),
    price_per_kg: float = Form(...),
    description: Optional[str] = Form(None),
    harvest_date: Optional[str] = Form(None),
    state: Optional[str] = Form(None),
    district: Optional[str] = Form(None),
    images: List[UploadFile] = File(default=[]),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != "farmer":
        raise HTTPException(status_code=403, detail="Only farmers can create listings")

    for img in images[:4]:
        if img.content_type not in ALLOWED_MIMES:
            raise HTTPException(status_code=422, detail=f"Invalid image type: {img.content_type}")

    h_date = None
    if harvest_date:
        try:
            h_date = date.fromisoformat(harvest_date)
        except ValueError:
            h_date = None

    listing = CropListing(
        farmer_id=current_user.id,
        crop_name=crop_name,
        quantity_kg=quantity_kg,
        price_per_kg=price_per_kg,
        description=description,
        harvest_date=h_date,
        state=state or current_user.state,
        district=district or current_user.district,
        images=[],
    )
    db.add(listing)
    db.flush()

    image_paths = []
    listing_dir = os.path.join("uploads", "listings", str(listing.id))
    os.makedirs(listing_dir, exist_ok=True)

    for img in images[:4]:
        filename = f"{uuid.uuid4().hex}.jpg"
        filepath = os.path.join(listing_dir, filename)
        content = await img.read()
        with open(filepath, "wb") as f:
            f.write(content)
        image_paths.append(f"/uploads/listings/{listing.id}/{filename}")

    listing.images = image_paths
    db.commit()
    db.refresh(listing)

    return {
        "id": listing.id,
        "farmer_id": listing.farmer_id,
        "crop_name": listing.crop_name,
        "quantity_kg": listing.quantity_kg,
        "price_per_kg": listing.price_per_kg,
        "description": listing.description,
        "images": listing.images,
        "state": listing.state,
        "district": listing.district,
        "harvest_date": str(listing.harvest_date) if listing.harvest_date else None,
        "status": listing.status,
        "views": listing.views,
        "created_at": str(listing.created_at),
    }


@router.get("/listings")
def get_listings(
    crop: Optional[str] = Query(None),
    state: Optional[str] = Query(None),
    min_price: Optional[float] = Query(None),
    max_price: Optional[float] = Query(None),
    sort: str = Query("newest"),
    page: int = Query(1, ge=1),
    limit: int = Query(12, ge=1, le=50),
    db: Session = Depends(get_db),
):
    query = db.query(CropListing, User).join(User, CropListing.farmer_id == User.id)
    query = query.filter(CropListing.status == "active")

    if crop:
        query = query.filter(CropListing.crop_name.ilike(f"%{crop}%"))
    if state:
        query = query.filter(CropListing.state == state)
    if min_price is not None:
        query = query.filter(CropListing.price_per_kg >= min_price)
    if max_price is not None:
        query = query.filter(CropListing.price_per_kg <= max_price)

    if sort == "price_low":
        query = query.order_by(CropListing.price_per_kg.asc())
    elif sort == "price_high":
        query = query.order_by(CropListing.price_per_kg.desc())
    else:
        query = query.order_by(CropListing.created_at.desc())

    total = query.count()
    results = query.offset((page - 1) * limit).limit(limit).all()

    items = []
    for listing, farmer in results:
        listing.views = (listing.views or 0) + 1
        items.append({
            "id": listing.id,
            "farmer_id": listing.farmer_id,
            "farmer_name": farmer.name,
            "farmer_state": farmer.state,
            "crop_name": listing.crop_name,
            "quantity_kg": listing.quantity_kg,
            "price_per_kg": listing.price_per_kg,
            "description": listing.description,
            "images": listing.images or [],
            "state": listing.state,
            "district": listing.district,
            "harvest_date": str(listing.harvest_date) if listing.harvest_date else None,
            "status": listing.status,
            "views": listing.views,
            "created_at": str(listing.created_at),
        })

    db.commit()

    return {
        "items": items,
        "total": total,
        "page": page,
        "pages": max(1, (total + limit - 1) // limit),
    }


@router.get("/my-listings")
def get_my_listings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    listings = (
        db.query(CropListing)
        .filter(CropListing.farmer_id == current_user.id)
        .order_by(CropListing.created_at.desc())
        .all()
    )

    return [
        {
            "id": l.id,
            "crop_name": l.crop_name,
            "quantity_kg": l.quantity_kg,
            "price_per_kg": l.price_per_kg,
            "description": l.description,
            "images": l.images or [],
            "state": l.state,
            "district": l.district,
            "harvest_date": str(l.harvest_date) if l.harvest_date else None,
            "status": l.status,
            "views": l.views,
            "created_at": str(l.created_at),
        }
        for l in listings
    ]


@router.put("/listing/{listing_id}")
def update_listing(
    listing_id: int,
    crop_name: Optional[str] = Form(None),
    quantity_kg: Optional[float] = Form(None),
    price_per_kg: Optional[float] = Form(None),
    description: Optional[str] = Form(None),
    harvest_date: Optional[str] = Form(None),
    state: Optional[str] = Form(None),
    district: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    listing = db.query(CropListing).filter(CropListing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    if listing.farmer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to edit this listing")

    if crop_name is not None:
        listing.crop_name = crop_name
    if quantity_kg is not None:
        listing.quantity_kg = quantity_kg
    if price_per_kg is not None:
        listing.price_per_kg = price_per_kg
    if description is not None:
        listing.description = description
    if harvest_date is not None:
        try:
            listing.harvest_date = date.fromisoformat(harvest_date)
        except ValueError:
            pass
    if state is not None:
        listing.state = state
    if district is not None:
        listing.district = district

    db.commit()
    db.refresh(listing)

    return {
        "id": listing.id,
        "crop_name": listing.crop_name,
        "quantity_kg": listing.quantity_kg,
        "price_per_kg": listing.price_per_kg,
        "status": listing.status,
        "message": "Listing updated successfully",
    }


@router.delete("/listing/{listing_id}")
def delete_listing(
    listing_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    listing = db.query(CropListing).filter(CropListing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    if listing.farmer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this listing")

    listing.status = "cancelled"
    db.commit()

    return {"message": "Listing cancelled successfully"}


@router.post("/create-order")
def marketplace_create_order(
    request: Request,
    listing_id: int = Form(...),
    quantity_kg: float = Form(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    listing = db.query(CropListing).filter(CropListing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    if listing.status != "active":
        raise HTTPException(status_code=400, detail="Listing is not active")
    if quantity_kg > listing.quantity_kg:
        raise HTTPException(status_code=400, detail="Requested quantity exceeds available stock")

    amount = quantity_kg * listing.price_per_kg
    order = create_order(amount, listing.id, current_user.id)

    txn = Transaction(
        listing_id=listing.id,
        buyer_id=current_user.id,
        farmer_id=listing.farmer_id,
        quantity_kg=quantity_kg,
        amount=amount,
        razorpay_order_id=order["id"],
        status="pending",
    )
    db.add(txn)
    db.commit()

    return {
        "razorpay_order_id": order["id"],
        "amount": amount,
        "key": settings.RAZORPAY_KEY_ID,
        "currency": "INR",
    }


@router.post("/verify-payment")
def marketplace_verify_payment(
    order_id: str = Form(...),
    payment_id: str = Form(...),
    signature: str = Form(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not verify_payment(order_id, payment_id, signature):
        raise HTTPException(status_code=400, detail="Payment verification failed")

    txn = db.query(Transaction).filter(Transaction.razorpay_order_id == order_id).first()
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")

    txn.status = "paid"
    txn.razorpay_payment_id = payment_id
    txn.razorpay_signature = signature

    listing = db.query(CropListing).filter(CropListing.id == txn.listing_id).first()
    if listing:
        listing.quantity_kg -= txn.quantity_kg
        if listing.quantity_kg <= 0:
            listing.status = "sold"

    db.commit()

    return {
        "success": True,
        "transaction_id": txn.id,
        "amount": txn.amount,
    }


@router.get("/transactions/{user_id}")
def get_transactions(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    txns = (
        db.query(Transaction, CropListing, User)
        .join(CropListing, Transaction.listing_id == CropListing.id)
        .join(User, Transaction.buyer_id == User.id)
        .filter((Transaction.buyer_id == user_id) | (Transaction.farmer_id == user_id))
        .order_by(Transaction.created_at.desc())
        .all()
    )

    return [
        {
            "id": txn.id,
            "listing_id": txn.listing_id,
            "crop_name": listing.crop_name,
            "buyer_name": buyer.name,
            "farmer_id": txn.farmer_id,
            "quantity_kg": txn.quantity_kg,
            "amount": txn.amount,
            "status": txn.status,
            "created_at": str(txn.created_at),
        }
        for txn, listing, buyer in txns
    ]

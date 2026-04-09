import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from database import get_db
from models.user import User
from models.soil import SoilAnalysis
from models.crop import CropRecommendation
from models.marketplace import CropListing, Transaction
from models.disease import DiseaseDetection
from routers.auth import get_current_user

router = APIRouter()


@router.get("/summary/{user_id}")
def get_profile_summary(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    total_recommendations = db.query(func.count(CropRecommendation.id)).filter(
        CropRecommendation.user_id == user_id
    ).scalar() or 0

    total_listings = db.query(func.count(CropListing.id)).filter(
        CropListing.farmer_id == user_id
    ).scalar() or 0

    total_earnings = db.query(func.coalesce(func.sum(Transaction.amount), 0)).filter(
        Transaction.farmer_id == user_id,
        Transaction.status == "paid",
    ).scalar() or 0

    total_kg_sold = db.query(func.coalesce(func.sum(Transaction.quantity_kg), 0)).filter(
        Transaction.farmer_id == user_id,
        Transaction.status == "paid",
    ).scalar() or 0

    most_recommended = (
        db.query(CropRecommendation.top_crop, func.count(CropRecommendation.id).label("cnt"))
        .filter(CropRecommendation.user_id == user_id)
        .group_by(CropRecommendation.top_crop)
        .order_by(func.count(CropRecommendation.id).desc())
        .first()
    )
    most_recommended_crop = most_recommended[0] if most_recommended else None

    diseases_detected = db.query(func.count(DiseaseDetection.id)).filter(
        DiseaseDetection.user_id == user_id
    ).scalar() or 0

    return {
        "total_recommendations": total_recommendations,
        "total_listings": total_listings,
        "total_earnings": float(total_earnings),
        "total_kg_sold": float(total_kg_sold),
        "most_recommended_crop": most_recommended_crop,
        "diseases_detected": diseases_detected,
    }


@router.get("/activity-feed/{user_id}")
def get_activity_feed(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    events = []

    soil_analyses = (
        db.query(SoilAnalysis)
        .filter(SoilAnalysis.user_id == user_id)
        .order_by(SoilAnalysis.created_at.desc())
        .limit(10)
        .all()
    )
    for sa in soil_analyses:
        events.append({
            "event_type": "soil_analysis",
            "title": f"Soil Analysis ({sa.input_type})",
            "description": f"pH: {sa.ph_value}, Soil: {sa.soil_type or 'N/A'}, State: {sa.state or 'N/A'}",
            "created_at": str(sa.created_at),
            "icon": "🌱",
        })

    crop_recs = (
        db.query(CropRecommendation)
        .filter(CropRecommendation.user_id == user_id)
        .order_by(CropRecommendation.created_at.desc())
        .limit(10)
        .all()
    )
    for cr in crop_recs:
        events.append({
            "event_type": "crop_recommendation",
            "title": f"Crop Recommended: {cr.top_crop}",
            "description": f"Confidence: {cr.confidence_1}% | Also: {cr.second_crop}, {cr.third_crop}",
            "created_at": str(cr.created_at),
            "icon": "🌾",
        })

    listings = (
        db.query(CropListing)
        .filter(CropListing.farmer_id == user_id)
        .order_by(CropListing.created_at.desc())
        .limit(10)
        .all()
    )
    for l in listings:
        events.append({
            "event_type": "listing_created",
            "title": f"Listed {l.crop_name} for sale",
            "description": f"{l.quantity_kg} kg at ₹{l.price_per_kg}/kg — Status: {l.status}",
            "created_at": str(l.created_at),
            "icon": "🏪",
        })

    sales = (
        db.query(Transaction)
        .filter(Transaction.farmer_id == user_id, Transaction.status == "paid")
        .order_by(Transaction.created_at.desc())
        .limit(10)
        .all()
    )
    for s in sales:
        events.append({
            "event_type": "sale",
            "title": f"Sale completed — ₹{s.amount}",
            "description": f"{s.quantity_kg} kg sold",
            "created_at": str(s.created_at),
            "icon": "💰",
        })

    events.sort(key=lambda e: e["created_at"] or "", reverse=True)
    return events[:20]


@router.put("/update")
async def update_profile(
    name: Optional[str] = Form(None),
    phone: Optional[str] = Form(None),
    state: Optional[str] = Form(None),
    district: Optional[str] = Form(None),
    village: Optional[str] = Form(None),
    profile_image: Optional[UploadFile] = File(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if name is not None:
        current_user.name = name
    if phone is not None:
        current_user.phone = phone
    if state is not None:
        current_user.state = state
    if district is not None:
        current_user.district = district
    if village is not None:
        current_user.village = village

    if profile_image:
        filename = f"{uuid.uuid4().hex}.jpg"
        os.makedirs("uploads/profiles", exist_ok=True)
        filepath = os.path.join("uploads", "profiles", filename)
        content = await profile_image.read()
        with open(filepath, "wb") as f:
            f.write(content)
        current_user.profile_image = f"/uploads/profiles/{filename}"

    db.commit()
    db.refresh(current_user)

    return {
        "id": current_user.id,
        "name": current_user.name,
        "phone": current_user.phone,
        "email": current_user.email,
        "role": current_user.role,
        "state": current_user.state,
        "district": current_user.district,
        "village": current_user.village,
        "profile_image": current_user.profile_image,
    }

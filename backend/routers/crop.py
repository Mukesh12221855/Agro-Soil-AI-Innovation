from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.crop import MarketPrice
from services.ml_service import CROP_INFO
from routers.auth import get_current_user

router = APIRouter()


@router.get("/info/{crop_name}")
def get_crop_info(crop_name: str):
    info = CROP_INFO.get(crop_name.lower())
    if not info:
        raise HTTPException(status_code=404, detail=f"Crop '{crop_name}' not found in database")

    return {
        "crop_name": crop_name.capitalize(),
        "sowing_months": info["sowing_months"],
        "harvest_duration_days": info["harvest_duration_days"],
        "avg_yield_per_acre": info["avg_yield_per_acre"],
        "ideal_ph_min": info["ideal_ph_min"],
        "ideal_ph_max": info["ideal_ph_max"],
        "water_need_mm": info["water_need_mm"],
        "states_grown": info["states_grown"],
        "image_url": info["image_url"],
    }


@router.get("/market-price/{crop_name}/{state}")
def get_crop_market_price(crop_name: str, state: str, db: Session = Depends(get_db)):
    prices = (
        db.query(MarketPrice)
        .filter(MarketPrice.crop_name == crop_name, MarketPrice.state == state)
        .order_by(MarketPrice.date.desc())
        .limit(7)
        .all()
    )

    return [
        {
            "date": str(p.date),
            "price_modal": p.price_modal,
            "price_min": p.price_min,
            "price_max": p.price_max,
            "market_name": p.market_name,
        }
        for p in prices
    ]

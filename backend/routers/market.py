from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from datetime import date, timedelta
from database import get_db
from models.crop import MarketPrice

router = APIRouter()


@router.get("/prices")
def get_market_prices(
    crop: str = Query(None),
    state: str = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    query = db.query(MarketPrice)

    if crop:
        query = query.filter(MarketPrice.crop_name == crop)
    if state:
        query = query.filter(MarketPrice.state == state)

    latest_date = db.query(func.max(MarketPrice.date)).scalar()
    if latest_date:
        query = query.filter(MarketPrice.date == latest_date)

    total = query.count()
    items = query.order_by(MarketPrice.crop_name).offset((page - 1) * limit).limit(limit).all()

    return {
        "items": [
            {
                "id": p.id,
                "crop_name": p.crop_name,
                "state": p.state,
                "district": p.district,
                "market_name": p.market_name,
                "price_min": p.price_min,
                "price_max": p.price_max,
                "price_modal": p.price_modal,
                "date": str(p.date),
            }
            for p in items
        ],
        "total": total,
        "page": page,
        "pages": (total + limit - 1) // limit,
    }


@router.get("/trend/{crop_name}")
def get_market_trend(crop_name: str, db: Session = Depends(get_db)):
    results = (
        db.query(
            MarketPrice.date,
            func.avg(MarketPrice.price_modal).label("avg_price"),
        )
        .filter(MarketPrice.crop_name == crop_name)
        .group_by(MarketPrice.date)
        .order_by(desc(MarketPrice.date))
        .limit(30)
        .all()
    )

    return [
        {"date": str(r.date), "avg_price": round(float(r.avg_price), 2)}
        for r in results
    ]


@router.get("/top-crops/{state}")
def get_top_crops(state: str, db: Session = Depends(get_db)):
    week_ago = date.today() - timedelta(days=7)

    results = (
        db.query(
            MarketPrice.crop_name,
            func.max(MarketPrice.price_modal).label("max_price"),
        )
        .filter(MarketPrice.state == state, MarketPrice.date >= week_ago)
        .group_by(MarketPrice.crop_name)
        .order_by(desc("max_price"))
        .limit(5)
        .all()
    )

    return [
        {"crop_name": r.crop_name, "max_price": round(float(r.max_price), 2)}
        for r in results
    ]

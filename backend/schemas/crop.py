from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date


class CropInfoResponse(BaseModel):
    crop_name: str
    sowing_months: str
    harvest_duration_days: int
    avg_yield_per_acre: str
    ideal_ph_min: float
    ideal_ph_max: float
    water_need_mm: str
    states_grown: List[str]
    image_url: str


class CropRecommendationResponse(BaseModel):
    crop: str
    confidence: float
    sowing_season: Optional[str] = None
    water_requirement: Optional[str] = None
    expected_yield_per_acre: Optional[str] = None


class FertilizerResponse(BaseModel):
    fertilizer_name: str
    npk_ratio: str
    dosage_per_acre: str
    pre_sowing: str
    top_dressing: str
    organic_alternative: str
    estimated_cost_inr: int


class MarketPriceItem(BaseModel):
    date: date
    price_modal: Optional[float] = None
    price_min: Optional[float] = None
    price_max: Optional[float] = None
    market_name: Optional[str] = None

    class Config:
        from_attributes = True

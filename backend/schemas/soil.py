from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class SoilImageResponse(BaseModel):
    soil_type: str
    estimated_ph_min: float
    estimated_ph_max: float
    color_hex: str
    suggested_correction: str
    image_url: str
    recommended_crops: List[str] = []
    soil_description: str = ""
    ideal_for: str = ""
    nutrients: dict = {}


class SoilManualRequest(BaseModel):
    ph: float = Field(..., ge=0, le=14)
    nitrogen: int = Field(..., ge=0, le=200)
    phosphorus: int = Field(..., ge=0, le=200)
    potassium: int = Field(..., ge=0, le=300)
    state: str
    district: str
    season: str
    latitude: float
    longitude: float


class CropPrediction(BaseModel):
    crop: str
    confidence: float
    expected_yield_per_acre: Optional[str] = None
    sowing_season: Optional[str] = None
    water_requirement: Optional[str] = None


class FertilizerDetail(BaseModel):
    fertilizer_name: str
    npk_ratio: str
    dosage_per_acre: str
    pre_sowing: str
    top_dressing: str
    organic_alternative: str
    estimated_cost_inr: int


class WeatherData(BaseModel):
    temperature: float
    humidity: float
    rainfall: float
    description: str = ""
    city: str = ""


class MarketPriceData(BaseModel):
    crop_name: str
    price_modal: Optional[float] = None
    price_min: Optional[float] = None
    price_max: Optional[float] = None
    market_name: Optional[str] = None
    date: Optional[str] = None


class SoilManualResponse(BaseModel):
    soil_analysis_id: int
    recommendations: List[CropPrediction]
    fertilizer: Optional[FertilizerDetail] = None
    market_price: Optional[MarketPriceData] = None
    weather: Optional[WeatherData] = None


class SoilHistoryItem(BaseModel):
    id: int
    input_type: str
    ph_value: Optional[float] = None
    nitrogen: Optional[int] = None
    phosphorus: Optional[int] = None
    potassium: Optional[int] = None
    soil_type: Optional[str] = None
    state: Optional[str] = None
    season: Optional[str] = None
    top_crop: Optional[str] = None
    confidence_1: Optional[float] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

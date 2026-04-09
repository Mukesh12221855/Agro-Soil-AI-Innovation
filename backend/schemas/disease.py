from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class DiseaseResult(BaseModel):
    crop: str
    disease: str
    confidence: float
    severity: Optional[str] = None
    symptoms: Optional[str] = None
    organic_treatment: Optional[str] = None
    chemical_treatment: Optional[str] = None
    prevention: Optional[str] = None


class DiseaseResultResponse(BaseModel):
    top_result: DiseaseResult
    top3: List[DiseaseResult]


class DiseaseHistoryItem(BaseModel):
    id: int
    crop_name: Optional[str] = None
    image_path: Optional[str] = None
    disease_name: Optional[str] = None
    confidence: Optional[float] = None
    severity: Optional[str] = None
    organic_treatment: Optional[str] = None
    chemical_treatment: Optional[str] = None
    prevention_tips: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

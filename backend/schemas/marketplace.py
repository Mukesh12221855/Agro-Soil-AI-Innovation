from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, date


class ListingCreateResponse(BaseModel):
    id: int
    farmer_id: int
    crop_name: str
    quantity_kg: float
    price_per_kg: float
    description: Optional[str] = None
    images: Optional[List[str]] = None
    state: Optional[str] = None
    district: Optional[str] = None
    harvest_date: Optional[date] = None
    status: str = "active"
    views: int = 0
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ListingItem(BaseModel):
    id: int
    farmer_id: int
    farmer_name: Optional[str] = None
    farmer_state: Optional[str] = None
    crop_name: str
    quantity_kg: float
    price_per_kg: float
    description: Optional[str] = None
    images: Optional[List[str]] = None
    state: Optional[str] = None
    district: Optional[str] = None
    harvest_date: Optional[date] = None
    status: str
    views: int = 0
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ListingUpdateRequest(BaseModel):
    crop_name: Optional[str] = None
    quantity_kg: Optional[float] = None
    price_per_kg: Optional[float] = None
    description: Optional[str] = None
    harvest_date: Optional[date] = None
    state: Optional[str] = None
    district: Optional[str] = None


class CreateOrderRequest(BaseModel):
    listing_id: int
    quantity_kg: float = Field(..., gt=0)


class CreateOrderResponse(BaseModel):
    razorpay_order_id: str
    amount: float
    key: str
    currency: str = "INR"


class VerifyPaymentRequest(BaseModel):
    order_id: str
    payment_id: str
    signature: str


class VerifyPaymentResponse(BaseModel):
    success: bool
    transaction_id: int
    amount: float


class TransactionItem(BaseModel):
    id: int
    listing_id: int
    crop_name: Optional[str] = None
    buyer_name: Optional[str] = None
    farmer_name: Optional[str] = None
    quantity_kg: float
    amount: float
    status: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

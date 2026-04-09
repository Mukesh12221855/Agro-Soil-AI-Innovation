from sqlalchemy import Column, Integer, String, Float, DateTime, Date, ForeignKey, JSON, Text, Index, Enum as SAEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


class CropListing(Base):
    __tablename__ = "crop_listings"

    id = Column(Integer, primary_key=True, autoincrement=True)
    farmer_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    crop_name = Column(String(100), nullable=False)
    quantity_kg = Column(Float, nullable=False)
    price_per_kg = Column(Float, nullable=False)
    description = Column(Text)
    images = Column(JSON)
    state = Column(String(50))
    district = Column(String(50))
    harvest_date = Column(Date)
    status = Column(SAEnum("active", "sold", "pending", "cancelled", name="listing_status"), default="active")
    views = Column(Integer, default=0)
    created_at = Column(DateTime, server_default=func.now())

    farmer = relationship("User", back_populates="listings")
    transactions = relationship("Transaction", back_populates="listing")

    __table_args__ = (
        Index("ix_listing_crop_state_status", "crop_name", "state", "status"),
    )


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    listing_id = Column(Integer, ForeignKey("crop_listings.id"), nullable=False)
    buyer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    farmer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    quantity_kg = Column(Float)
    amount = Column(Float)
    razorpay_order_id = Column(String(100), unique=True)
    razorpay_payment_id = Column(String(100))
    razorpay_signature = Column(String(255))
    status = Column(SAEnum("pending", "paid", "failed", "refunded", name="txn_status"), default="pending")
    created_at = Column(DateTime, server_default=func.now())

    listing = relationship("CropListing", back_populates="transactions")
    buyer = relationship("User", foreign_keys=[buyer_id])
    farmer = relationship("User", foreign_keys=[farmer_id])

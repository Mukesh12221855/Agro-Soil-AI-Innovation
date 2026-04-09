from sqlalchemy import Column, Integer, String, Float, DateTime, Date, ForeignKey, JSON, Index, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


class CropRecommendation(Base):
    __tablename__ = "crop_recommendations"

    id = Column(Integer, primary_key=True, autoincrement=True)
    soil_analysis_id = Column(Integer, ForeignKey("soil_analyses.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    top_crop = Column(String(100))
    second_crop = Column(String(100))
    third_crop = Column(String(100))
    confidence_1 = Column(Float)
    confidence_2 = Column(Float)
    confidence_3 = Column(Float)
    weather_snapshot = Column(JSON)
    expected_yield_per_acre = Column(String(50))
    sowing_season = Column(String(50))
    water_requirement = Column(String(50))
    created_at = Column(DateTime, server_default=func.now())

    soil_analysis = relationship("SoilAnalysis", back_populates="crop_recommendations")
    user = relationship("User", back_populates="crop_recommendations")
    fertilizer_recommendations = relationship("FertilizerRecommendation", back_populates="crop_recommendation", cascade="all, delete-orphan")


class FertilizerRecommendation(Base):
    __tablename__ = "fertilizer_recommendations"

    id = Column(Integer, primary_key=True, autoincrement=True)
    crop_recommendation_id = Column(Integer, ForeignKey("crop_recommendations.id"), nullable=False)
    crop_name = Column(String(100))
    fertilizer_name = Column(String(150))
    npk_ratio = Column(String(20))
    dosage_per_acre = Column(String(100))
    pre_sowing = Column(String(200))
    top_dressing = Column(String(200))
    organic_alternative = Column(String(200))
    estimated_cost_inr = Column(Integer)
    created_at = Column(DateTime, server_default=func.now())

    crop_recommendation = relationship("CropRecommendation", back_populates="fertilizer_recommendations")


class MarketPrice(Base):
    __tablename__ = "market_prices"

    id = Column(Integer, primary_key=True, autoincrement=True)
    crop_name = Column(String(100), nullable=False)
    state = Column(String(50), nullable=False)
    district = Column(String(50))
    market_name = Column(String(150))
    price_min = Column(Float)
    price_max = Column(Float)
    price_modal = Column(Float)
    date = Column(Date, nullable=False)
    source = Column(String(100))

    __table_args__ = (
        UniqueConstraint("crop_name", "market_name", "date", name="uq_crop_market_date"),
        Index("ix_crop_state_date", "crop_name", "state", "date"),
    )

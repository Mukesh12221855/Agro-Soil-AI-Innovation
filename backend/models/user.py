from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Enum as SAEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    phone = Column(String(15), unique=True, nullable=False)
    email = Column(String(150), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(SAEnum("farmer", "buyer", name="user_role"), default="farmer")
    state = Column(String(50))
    district = Column(String(50))
    village = Column(String(100))
    latitude = Column(Float)
    longitude = Column(Float)
    profile_image = Column(String(255))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())

    soil_analyses = relationship("SoilAnalysis", back_populates="user", cascade="all, delete-orphan")
    crop_recommendations = relationship("CropRecommendation", back_populates="user")
    listings = relationship("CropListing", back_populates="farmer", cascade="all, delete-orphan")
    disease_detections = relationship("DiseaseDetection", back_populates="user", cascade="all, delete-orphan")

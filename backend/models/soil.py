from sqlalchemy import Column, Integer, String, Float, DateTime, Enum as SAEnum, ForeignKey, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


class SoilAnalysis(Base):
    __tablename__ = "soil_analyses"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    input_type = Column(SAEnum("image", "manual", name="input_type_enum"), nullable=False)
    ph_value = Column(Float)
    nitrogen = Column(Integer)
    phosphorus = Column(Integer)
    potassium = Column(Integer)
    soil_type = Column(SAEnum("sandy", "loamy", "clay", "black", "red", "alluvial", name="soil_type_enum"))
    image_path = Column(String(255))
    state = Column(String(50))
    district = Column(String(50))
    season = Column(SAEnum("Kharif", "Rabi", "Zaid", name="season_enum"))
    temperature = Column(Float)
    humidity = Column(Float)
    rainfall = Column(Float)
    created_at = Column(DateTime, server_default=func.now())

    user = relationship("User", back_populates="soil_analyses")
    crop_recommendations = relationship("CropRecommendation", back_populates="soil_analysis", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_soil_user_date", "user_id", "created_at"),
    )

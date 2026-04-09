from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


class DiseaseDetection(Base):
    __tablename__ = "disease_detections"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    crop_name = Column(String(100))
    image_path = Column(String(255))
    disease_name = Column(String(150))
    confidence = Column(Float)
    severity = Column(SAEnum("low", "medium", "high", name="severity_enum"))
    organic_treatment = Column(Text)
    chemical_treatment = Column(Text)
    prevention_tips = Column(Text)
    created_at = Column(DateTime, server_default=func.now())

    user = relationship("User", back_populates="disease_detections")

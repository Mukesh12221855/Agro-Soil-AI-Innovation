import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Request
from sqlalchemy.orm import Session
from database import get_db
from models.user import User
from models.disease import DiseaseDetection
from routers.auth import get_current_user
from services.ml_service import predict_disease

router = APIRouter()

ALLOWED_MIMES = {"image/jpeg", "image/png"}


@router.post("/detect")
async def detect_disease(
    request: Request,
    file: UploadFile = File(...),
    crop_name: str = "Unknown",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if file.content_type not in ALLOWED_MIMES:
        raise HTTPException(status_code=422, detail="Only JPEG and PNG images are allowed")

    filename = f"{uuid.uuid4().hex}.jpg"
    filepath = os.path.join("uploads", "disease", filename)
    content = await file.read()
    with open(filepath, "wb") as f:
        f.write(content)

    results = predict_disease(request.app.state, filepath)
    if results is None:
        raise HTTPException(status_code=422, detail="Could not process image")

    top = results[0] if results else {}

    detection = DiseaseDetection(
        user_id=current_user.id,
        crop_name=top.get("crop", crop_name),
        image_path=f"/uploads/disease/{filename}",
        disease_name=top.get("disease", "Unknown"),
        confidence=top.get("confidence", 0),
        severity=top.get("severity", "medium"),
        organic_treatment=top.get("organic_treatment", ""),
        chemical_treatment=top.get("chemical_treatment", ""),
        prevention_tips=top.get("prevention", ""),
    )
    db.add(detection)
    db.commit()

    return {
        "top_result": top,
        "top3": results[:3],
    }


@router.get("/history")
def get_disease_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    detections = (
        db.query(DiseaseDetection)
        .filter(DiseaseDetection.user_id == current_user.id)
        .order_by(DiseaseDetection.created_at.desc())
        .limit(15)
        .all()
    )

    return [
        {
            "id": d.id,
            "crop_name": d.crop_name,
            "image_path": d.image_path,
            "disease_name": d.disease_name,
            "confidence": d.confidence,
            "severity": d.severity,
            "organic_treatment": d.organic_treatment,
            "chemical_treatment": d.chemical_treatment,
            "prevention_tips": d.prevention_tips,
            "created_at": str(d.created_at),
        }
        for d in detections
    ]

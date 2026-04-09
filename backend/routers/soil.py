import os
import uuid
import cv2
import numpy as np
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Request
from sqlalchemy.orm import Session
from database import get_db
from models.user import User
from models.soil import SoilAnalysis
from models.crop import CropRecommendation, FertilizerRecommendation, MarketPrice
from schemas.soil import SoilImageResponse, SoilManualRequest, SoilManualResponse, SoilHistoryItem
from routers.auth import get_current_user
from services.weather_service import get_weather
from services.ml_service import predict_crop, predict_fertilizer, CROP_INFO

router = APIRouter()

ALLOWED_MIMES = {"image/jpeg", "image/png"}


# Crop recommendations by soil type for image-based analysis
SOIL_CROP_MAP = {
    "black": {
        "crops": ["Cotton", "Sugarcane", "Wheat", "Soybean", "Chickpea"],
        "description": "Black cotton soil (Regur) — extremely fertile, rich in calcium, magnesium & iron. Best for moisture-loving crops.",
        "ideal_for": "Kharif and Rabi season crops",
        "nutrients": {"nitrogen": "Medium", "phosphorus": "Low-Medium", "potassium": "High", "organic_matter": "High"},
    },
    "red": {
        "crops": ["Groundnut", "Potato", "Rice", "Maize", "Mango"],
        "description": "Red laterite soil — rich in iron oxide, well-drained. Needs lime and organic matter for best results.",
        "ideal_for": "Crops that tolerate slightly acidic conditions",
        "nutrients": {"nitrogen": "Low", "phosphorus": "Low", "potassium": "Medium", "organic_matter": "Low"},
    },
    "sandy": {
        "crops": ["Watermelon", "Groundnut", "Potato", "Coconut", "Muskmelon"],
        "description": "Sandy soil — light, well-drained, warms quickly. Needs frequent watering and organic amendments.",
        "ideal_for": "Root vegetables and drought-tolerant crops",
        "nutrients": {"nitrogen": "Low", "phosphorus": "Low", "potassium": "Low", "organic_matter": "Very Low"},
    },
    "alluvial": {
        "crops": ["Rice", "Wheat", "Sugarcane", "Maize", "Banana"],
        "description": "Alluvial soil — extremely fertile, deposited by rivers. Ideal for intensive agriculture across Indo-Gangetic plains.",
        "ideal_for": "Almost all major crops",
        "nutrients": {"nitrogen": "High", "phosphorus": "Medium", "potassium": "High", "organic_matter": "High"},
    },
    "clay": {
        "crops": ["Rice", "Wheat", "Lentil", "Chickpea", "Sugarcane"],
        "description": "Clay soil — heavy, nutrient-rich but poor drainage. Add sand and organic matter to improve structure.",
        "ideal_for": "Crops that prefer waterlogged or moist conditions",
        "nutrients": {"nitrogen": "Medium-High", "phosphorus": "Medium", "potassium": "High", "organic_matter": "Medium"},
    },
    "loamy": {
        "crops": ["Tomato", "Wheat", "Cotton", "Sugarcane", "Maize"],
        "description": "Loamy soil — perfect balance of sand, silt & clay. The ideal soil type for most crops.",
        "ideal_for": "Nearly all crops — the gold standard of agricultural soil",
        "nutrients": {"nitrogen": "Medium-High", "phosphorus": "Medium", "potassium": "Medium-High", "organic_matter": "Medium-High"},
    },
}


def analyze_soil_color(image_path: str) -> dict:
    """Analyze dominant color in HSV to estimate soil type."""
    img = cv2.imread(image_path)
    if img is None:
        soil_type = "loamy"
        return {
            "soil_type": soil_type,
            "estimated_ph_min": 6.0, "estimated_ph_max": 7.0,
            "color_hex": "#8B6914",
            "suggested_correction": "Use balanced NPK fertilizer",
            **SOIL_CROP_MAP.get(soil_type, SOIL_CROP_MAP["loamy"]),
        }

    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    avg_h = np.mean(hsv[:, :, 0])
    avg_s = np.mean(hsv[:, :, 1])
    avg_v = np.mean(hsv[:, :, 2])

    b, g, r = [int(x) for x in cv2.mean(img)[:3]]
    color_hex = f"#{r:02x}{g:02x}{b:02x}"

    if avg_v < 60:
        soil_type, ph_min, ph_max = "black", 6.5, 8.5
        correction = "Add gypsum to improve drainage. Black cotton soil retains moisture well."
    elif avg_h < 15 and avg_s > 80:
        soil_type, ph_min, ph_max = "red", 5.0, 6.5
        correction = "Add lime to increase pH. Red soil is rich in iron but low in nitrogen."
    elif avg_v > 170 and avg_s < 60:
        soil_type, ph_min, ph_max = "sandy", 5.5, 7.0
        correction = "Add organic compost to improve water retention. Sandy soil drains quickly."
    elif avg_v > 120 and avg_s < 100:
        soil_type, ph_min, ph_max = "alluvial", 6.0, 8.0
        correction = "Very fertile alluvial soil. Maintain with balanced organic matter inputs."
    elif avg_s < 40 and avg_v < 130:
        soil_type, ph_min, ph_max = "clay", 6.0, 8.0
        correction = "Add organic matter and sand to improve aeration. Clay soil is nutrient-rich but heavy."
    else:
        soil_type, ph_min, ph_max = "loamy", 6.0, 7.5
        correction = "Ideal loamy soil. Maintain organic matter content with regular composting."

    soil_info = SOIL_CROP_MAP.get(soil_type, SOIL_CROP_MAP["loamy"])

    return {
        "soil_type": soil_type,
        "estimated_ph_min": ph_min,
        "estimated_ph_max": ph_max,
        "color_hex": color_hex,
        "suggested_correction": correction,
        "crops": soil_info["crops"],
        "description": soil_info["description"],
        "ideal_for": soil_info["ideal_for"],
        "nutrients": soil_info["nutrients"],
    }


@router.post("/upload-image", response_model=SoilImageResponse)
async def upload_soil_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if file.content_type not in ALLOWED_MIMES:
        raise HTTPException(status_code=422, detail="Only JPEG and PNG images are allowed")

    filename = f"{uuid.uuid4().hex}.jpg"
    filepath = os.path.join("uploads", "soil", filename)
    content = await file.read()
    with open(filepath, "wb") as f:
        f.write(content)

    result = analyze_soil_color(filepath)
    image_url = f"/uploads/soil/{filename}"

    soil = SoilAnalysis(
        user_id=current_user.id,
        input_type="image",
        soil_type=result["soil_type"],
        ph_value=(result["estimated_ph_min"] + result["estimated_ph_max"]) / 2,
        image_path=filepath,
    )
    db.add(soil)
    db.commit()

    return SoilImageResponse(
        soil_type=result["soil_type"],
        estimated_ph_min=result["estimated_ph_min"],
        estimated_ph_max=result["estimated_ph_max"],
        color_hex=result["color_hex"],
        suggested_correction=result["suggested_correction"],
        image_url=image_url,
        recommended_crops=result.get("crops", []),
        soil_description=result.get("description", ""),
        ideal_for=result.get("ideal_for", ""),
        nutrients=result.get("nutrients", {}),
    )


@router.post("/submit-manual", response_model=SoilManualResponse)
async def submit_manual(
    request: Request,
    data: SoilManualRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    weather = await get_weather(data.latitude, data.longitude)

    crop_results = predict_crop(
        request.app.state,
        data.nitrogen, data.phosphorus, data.potassium,
        weather["temperature"], weather["humidity"], data.ph, weather["rainfall"],
    )

    top_crop = crop_results[0]["crop"] if crop_results else "Rice"

    soil_type_map = {
        (0, 5.5): "sandy",
        (5.5, 6.5): "loamy",
        (6.5, 7.5): "alluvial",
        (7.5, 8.5): "clay",
        (8.5, 14): "black",
    }
    soil_type = "loamy"
    for (lo, hi), st in soil_type_map.items():
        if lo <= data.ph < hi:
            soil_type = st
            break

    fert_result = predict_fertilizer(
        request.app.state,
        weather["temperature"], weather["humidity"], 50,
        soil_type, top_crop.lower(),
        data.nitrogen, data.potassium, data.phosphorus,
    )

    soil_analysis = SoilAnalysis(
        user_id=current_user.id,
        input_type="manual",
        ph_value=data.ph,
        nitrogen=data.nitrogen,
        phosphorus=data.phosphorus,
        potassium=data.potassium,
        soil_type=soil_type,
        state=data.state,
        district=data.district,
        season=data.season,
        temperature=weather["temperature"],
        humidity=weather["humidity"],
        rainfall=weather["rainfall"],
    )
    db.add(soil_analysis)
    db.flush()

    crop_rec = CropRecommendation(
        soil_analysis_id=soil_analysis.id,
        user_id=current_user.id,
        top_crop=crop_results[0]["crop"] if len(crop_results) > 0 else None,
        second_crop=crop_results[1]["crop"] if len(crop_results) > 1 else None,
        third_crop=crop_results[2]["crop"] if len(crop_results) > 2 else None,
        confidence_1=crop_results[0]["confidence"] if len(crop_results) > 0 else None,
        confidence_2=crop_results[1]["confidence"] if len(crop_results) > 1 else None,
        confidence_3=crop_results[2]["confidence"] if len(crop_results) > 2 else None,
        weather_snapshot=weather,
        expected_yield_per_acre=crop_results[0].get("expected_yield_per_acre") if crop_results else None,
        sowing_season=crop_results[0].get("sowing_season") if crop_results else None,
        water_requirement=crop_results[0].get("water_requirement") if crop_results else None,
    )
    db.add(crop_rec)
    db.flush()

    fert_rec = FertilizerRecommendation(
        crop_recommendation_id=crop_rec.id,
        crop_name=top_crop,
        fertilizer_name=fert_result["fertilizer_name"],
        npk_ratio=fert_result["npk_ratio"],
        dosage_per_acre=fert_result["dosage_per_acre"],
        pre_sowing=fert_result["pre_sowing"],
        top_dressing=fert_result["top_dressing"],
        organic_alternative=fert_result["organic_alternative"],
        estimated_cost_inr=fert_result["estimated_cost_inr"],
    )
    db.add(fert_rec)
    db.commit()

    market_price_row = db.query(MarketPrice).filter(
        MarketPrice.crop_name == top_crop,
        MarketPrice.state == data.state,
    ).order_by(MarketPrice.date.desc()).first()

    market_price = None
    if market_price_row:
        market_price = {
            "crop_name": market_price_row.crop_name,
            "price_modal": market_price_row.price_modal,
            "price_min": market_price_row.price_min,
            "price_max": market_price_row.price_max,
            "market_name": market_price_row.market_name,
            "date": str(market_price_row.date),
        }

    return SoilManualResponse(
        soil_analysis_id=soil_analysis.id,
        recommendations=crop_results,
        fertilizer=fert_result,
        market_price=market_price,
        weather=weather,
    )


@router.get("/history")
def get_soil_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    results = (
        db.query(SoilAnalysis, CropRecommendation)
        .outerjoin(CropRecommendation, CropRecommendation.soil_analysis_id == SoilAnalysis.id)
        .filter(SoilAnalysis.user_id == current_user.id)
        .order_by(SoilAnalysis.created_at.desc())
        .limit(20)
        .all()
    )

    history = []
    for soil, crop_rec in results:
        history.append({
            "id": soil.id,
            "input_type": soil.input_type,
            "ph_value": soil.ph_value,
            "nitrogen": soil.nitrogen,
            "phosphorus": soil.phosphorus,
            "potassium": soil.potassium,
            "soil_type": soil.soil_type,
            "state": soil.state,
            "season": soil.season,
            "top_crop": crop_rec.top_crop if crop_rec else None,
            "confidence_1": crop_rec.confidence_1 if crop_rec else None,
            "created_at": str(soil.created_at) if soil.created_at else None,
        })

    return history

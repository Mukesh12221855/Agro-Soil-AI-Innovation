import os
import json
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from database import engine, Base, SessionLocal
from routers import auth, soil, crop, market, marketplace, disease, profile
from services.market_service import seed_market_prices, fetch_market_prices_from_gov, seed_marketplace_listings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # === STARTUP ===
    logger.info("Starting Agro-Soil AI...")

    # Create upload directories
    for folder in ["uploads/soil", "uploads/listings", "uploads/disease", "uploads/profiles"]:
        os.makedirs(folder, exist_ok=True)

    # Create database tables
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables created.")

    # Seed market prices
    db = SessionLocal()
    try:
        seed_market_prices(db)
        logger.info("Market prices seeded.")
        seed_marketplace_listings(db)
        logger.info("Marketplace listings seeded.")
    finally:
        db.close()

    # Load ML models
    try:
        import joblib
        import numpy as np

        models_dir = os.path.join(os.path.dirname(__file__), "trained_models")

        crop_model_path = os.path.join(models_dir, "crop_rf_model.pkl")
        if os.path.exists(crop_model_path):
            app.state.crop_model = joblib.load(crop_model_path)
            app.state.crop_scaler = joblib.load(os.path.join(models_dir, "crop_scaler.pkl"))
            app.state.crop_le = joblib.load(os.path.join(models_dir, "crop_label_encoder.pkl"))
            logger.info("Crop model loaded.")
        else:
            app.state.crop_model = None
            app.state.crop_scaler = None
            app.state.crop_le = None
            logger.warning("Crop model not found — using fallback predictions.")

        fert_model_path = os.path.join(models_dir, "fertilizer_rf_model.pkl")
        if os.path.exists(fert_model_path):
            app.state.fert_model = joblib.load(fert_model_path)
            app.state.fert_cols = joblib.load(os.path.join(models_dir, "fertilizer_feature_cols.pkl"))
            app.state.fert_le = joblib.load(os.path.join(models_dir, "fertilizer_label_encoder.pkl"))
            logger.info("Fertilizer model loaded.")
        else:
            app.state.fert_model = None
            app.state.fert_cols = None
            app.state.fert_le = None
            logger.warning("Fertilizer model not found — using fallback.")

        disease_model_path = os.path.join(models_dir, "disease_rf_model.pkl")
        if os.path.exists(disease_model_path):
            app.state.disease_model = joblib.load(disease_model_path)
            app.state.disease_le = joblib.load(os.path.join(models_dir, "disease_label_encoder.pkl"))
            logger.info("Disease model loaded.")
        else:
            app.state.disease_model = None
            app.state.disease_le = None
            logger.warning("Disease model not found — using fallback.")

        treatments_path = os.path.join(models_dir, "disease_treatments.json")
        if os.path.exists(treatments_path):
            with open(treatments_path, "r") as f:
                app.state.treatments = json.load(f)
            logger.info("Disease treatments loaded.")
        else:
            app.state.treatments = {}
            logger.warning("Disease treatments not found.")

    except Exception as e:
        logger.error(f"Error loading ML models: {e}")
        app.state.crop_model = None
        app.state.crop_scaler = None
        app.state.crop_le = None
        app.state.fert_model = None
        app.state.fert_cols = None
        app.state.fert_le = None
        app.state.disease_model = None
        app.state.disease_le = None
        app.state.treatments = {}

    # Start APScheduler for daily market price refresh
    try:
        from apscheduler.schedulers.asyncio import AsyncIOScheduler
        from apscheduler.triggers.cron import CronTrigger

        scheduler = AsyncIOScheduler()

        async def daily_market_refresh():
            db = SessionLocal()
            try:
                await fetch_market_prices_from_gov(db)
                logger.info("Daily market prices refreshed.")
            finally:
                db.close()

        scheduler.add_job(
            daily_market_refresh,
            CronTrigger(hour=0, minute=30),  # 6:00 IST = 00:30 UTC
            id="market_refresh",
            replace_existing=True,
        )
        scheduler.start()
        app.state.scheduler = scheduler
        logger.info("APScheduler started for daily market refresh.")
    except Exception as e:
        logger.warning(f"APScheduler not started: {e}")

    logger.info("Agro-Soil AI is ready!")

    yield

    # === SHUTDOWN ===
    if hasattr(app.state, "scheduler"):
        app.state.scheduler.shutdown()
        logger.info("APScheduler stopped.")
    logger.info("Agro-Soil AI stopped.")


# Create upload directories at module level (before StaticFiles mount)
for _folder in ["uploads/soil", "uploads/listings", "uploads/disease", "uploads/profiles"]:
    os.makedirs(_folder, exist_ok=True)

app = FastAPI(
    title="Agro-Soil AI",
    version="1.0.0",
    description="Intelligent Farming Platform for India",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(soil.router, prefix="/api/soil", tags=["Soil"])
app.include_router(crop.router, prefix="/api/crop", tags=["Crop"])
app.include_router(market.router, prefix="/api/market", tags=["Market"])
app.include_router(marketplace.router, prefix="/api/marketplace", tags=["Marketplace"])
app.include_router(disease.router, prefix="/api/disease", tags=["Disease"])
app.include_router(profile.router, prefix="/api/profile", tags=["Profile"])


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error. Please try again later."},
    )


@app.get("/api/health")
def health_check():
    return {"status": "healthy", "version": "1.0.0"}


@app.get("/api/weather")
async def get_weather_api(lat: float, lon: float):
    from services.weather_service import get_weather
    return await get_weather(lat, lon)

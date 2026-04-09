import httpx
import random
from datetime import date, timedelta
from sqlalchemy.orm import Session
from sqlalchemy.dialects.mysql import insert as mysql_insert
from models.crop import MarketPrice
from models.user import User
from models.marketplace import CropListing
from config import settings
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

CROPS = ["Rice", "Wheat", "Cotton", "Sugarcane", "Maize", "Tomato", "Onion", "Potato", "Soybean", "Groundnut"]
STATES = ["Punjab", "Maharashtra", "Uttar Pradesh", "Karnataka", "Gujarat"]

MARKET_MAP = {
    "Punjab": ["Amritsar Mandi", "Ludhiana Mandi"],
    "Maharashtra": ["Pune Market Yard", "Nashik Mandi"],
    "Uttar Pradesh": ["Lucknow Mandi", "Agra Mandi"],
    "Karnataka": ["Bangalore APMC", "Hubli Mandi"],
    "Gujarat": ["Ahmedabad APMC", "Rajkot Mandi"],
}

BASE_PRICES = {
    "Rice": 2200, "Wheat": 2100, "Cotton": 6500, "Sugarcane": 350,
    "Maize": 1950, "Tomato": 2500, "Onion": 1800, "Potato": 1200,
    "Soybean": 4200, "Groundnut": 5500,
}


def seed_market_prices(db: Session):
    """Seed 30 days of sample market prices for 10 crops × 5 states."""
    existing = db.query(MarketPrice).first()
    if existing:
        return

    today = date.today()
    rows = []
    for crop in CROPS:
        base = BASE_PRICES[crop]
        for state in STATES:
            markets = MARKET_MAP[state]
            for market_name in markets:
                for day_offset in range(30):
                    d = today - timedelta(days=day_offset)
                    variation = random.uniform(-0.12, 0.12)
                    modal = round(base * (1 + variation), 2)
                    price_min = round(modal * random.uniform(0.85, 0.95), 2)
                    price_max = round(modal * random.uniform(1.05, 1.15), 2)
                    rows.append(MarketPrice(
                        crop_name=crop,
                        state=state,
                        district=market_name.split()[0],
                        market_name=market_name,
                        price_min=price_min,
                        price_max=price_max,
                        price_modal=modal,
                        date=d,
                        source="seed_data",
                    ))

    db.bulk_save_objects(rows)
    db.commit()


async def fetch_market_prices_from_gov(db: Session):
    """Fetch latest market prices from data.gov.in API and upsert into DB."""
    url = "https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070"
    params = {
        "api-key": settings.DATA_GOV_API_KEY,
        "format": "json",
        "limit": 100,
    }
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(url, params=params)
            if response.status_code != 200:
                return

            data = response.json()
            records = data.get("records", [])
            for record in records:
                crop_name = record.get("commodity", "").strip()
                state = record.get("state", "").strip()
                market_name = record.get("market", "").strip()
                district = record.get("district", "").strip()

                try:
                    price_min = float(record.get("min_price", 0))
                    price_max = float(record.get("max_price", 0))
                    price_modal = float(record.get("modal_price", 0))
                    arrival_date = record.get("arrival_date", "")
                    from datetime import datetime
                    d = datetime.strptime(arrival_date, "%d/%m/%Y").date() if arrival_date else date.today()
                except (ValueError, TypeError):
                    continue

                existing = db.query(MarketPrice).filter(
                    MarketPrice.crop_name == crop_name,
                    MarketPrice.market_name == market_name,
                    MarketPrice.date == d,
                ).first()

                if existing:
                    existing.price_min = price_min
                    existing.price_max = price_max
                    existing.price_modal = price_modal
                    existing.source = "data.gov.in"
                else:
                    db.add(MarketPrice(
                        crop_name=crop_name,
                        state=state,
                        district=district,
                        market_name=market_name,
                        price_min=price_min,
                        price_max=price_max,
                        price_modal=price_modal,
                        date=d,
                        source="data.gov.in",
                    ))

            db.commit()
    except Exception:
        pass


DEMO_FARMERS = [
    {"name": "Ravi Kumar", "phone": "9000000001", "email": "ravi.demo@agroai.in", "state": "Punjab", "district": "Amritsar"},
    {"name": "Priya Devi", "phone": "9000000002", "email": "priya.demo@agroai.in", "state": "Maharashtra", "district": "Nashik"},
    {"name": "Suresh Reddy", "phone": "9000000003", "email": "suresh.demo@agroai.in", "state": "Andhra Pradesh", "district": "Guntur"},
    {"name": "Lakshmi Bai", "phone": "9000000004", "email": "lakshmi.demo@agroai.in", "state": "Karnataka", "district": "Belgaum"},
    {"name": "Arun Singh", "phone": "9000000005", "email": "arun.demo@agroai.in", "state": "Uttar Pradesh", "district": "Lucknow"},
]

DEMO_LISTINGS = [
    {"crop_name": "Rice", "quantity_kg": 500, "price_per_kg": 28, "description": "Premium Basmati rice, freshly harvested from Punjab. Organically grown with no pesticides.", "state": "Punjab", "district": "Amritsar"},
    {"crop_name": "Wheat", "quantity_kg": 1000, "price_per_kg": 24, "description": "High-quality Sharbati wheat, ideal for making chapati and bread. Fresh Rabi harvest.", "state": "Punjab", "district": "Ludhiana"},
    {"crop_name": "Cotton", "quantity_kg": 300, "price_per_kg": 65, "description": "Long-staple cotton, handpicked and cleaned. Excellent fiber quality for textile use.", "state": "Maharashtra", "district": "Nagpur"},
    {"crop_name": "Tomato", "quantity_kg": 200, "price_per_kg": 18, "description": "Fresh organic tomatoes, vine-ripened. Perfect for cooking and salads.", "state": "Karnataka", "district": "Kolar"},
    {"crop_name": "Onion", "quantity_kg": 800, "price_per_kg": 22, "description": "Nashik red onions, known for their pungency and long shelf life. Bulk available.", "state": "Maharashtra", "district": "Nashik"},
    {"crop_name": "Potato", "quantity_kg": 600, "price_per_kg": 15, "description": "Farm-fresh potatoes from the Indo-Gangetic plains. Medium size, clean and sorted.", "state": "Uttar Pradesh", "district": "Agra"},
    {"crop_name": "Sugarcane", "quantity_kg": 2000, "price_per_kg": 3.5, "description": "High-sucrose sugarcane variety, ideal for jaggery and sugar mills.", "state": "Uttar Pradesh", "district": "Lucknow"},
    {"crop_name": "Soybean", "quantity_kg": 400, "price_per_kg": 45, "description": "Non-GMO soybean, clean and sorted. High protein content for oil extraction.", "state": "Madhya Pradesh", "district": "Indore"},
    {"crop_name": "Maize", "quantity_kg": 350, "price_per_kg": 20, "description": "Yellow corn maize, sun-dried and ready for processing. Animal feed grade.", "state": "Karnataka", "district": "Davangere"},
    {"crop_name": "Groundnut", "quantity_kg": 250, "price_per_kg": 55, "description": "Bold variety groundnuts from Gujarat. Raw, shelled, and hygienically packed.", "state": "Gujarat", "district": "Junagadh"},
    {"crop_name": "Mango", "quantity_kg": 150, "price_per_kg": 80, "description": "Alphonso mangoes from Ratnagiri. A-grade, naturally ripened. Sweet and aromatic.", "state": "Maharashtra", "district": "Ratnagiri"},
    {"crop_name": "Banana", "quantity_kg": 300, "price_per_kg": 25, "description": "Robusta variety bananas, ready for wholesale. Fresh and unbruised.", "state": "Tamil Nadu", "district": "Trichy"},
    {"crop_name": "Coffee", "quantity_kg": 100, "price_per_kg": 350, "description": "Arabica coffee beans from Coorg estates. Medium roast, specialty grade.", "state": "Karnataka", "district": "Kodagu"},
    {"crop_name": "Coconut", "quantity_kg": 500, "price_per_kg": 30, "description": "Mature coconuts with thick white meat. Ideal for oil extraction and cooking.", "state": "Kerala", "district": "Thrissur"},
    {"crop_name": "Lentil", "quantity_kg": 200, "price_per_kg": 85, "description": "Masoor dal (red lentil), machine-cleaned and polished. Premium cooking quality.", "state": "Madhya Pradesh", "district": "Rewa"},
    {"crop_name": "Chickpea", "quantity_kg": 300, "price_per_kg": 65, "description": "Desi chana, bold size, sorted and cleaned. Fresh from Rabi harvest.", "state": "Rajasthan", "district": "Jodhpur"},
    {"crop_name": "Apple", "quantity_kg": 200, "price_per_kg": 120, "description": "Royal Delicious apples from Shimla orchards. Fresh, crisp, and naturally grown.", "state": "Himachal Pradesh", "district": "Shimla"},
    {"crop_name": "Grapes", "quantity_kg": 150, "price_per_kg": 70, "description": "Thompson Seedless grapes from Nashik vineyards. Sweet, juicy, and export quality.", "state": "Maharashtra", "district": "Nashik"},
    {"crop_name": "Watermelon", "quantity_kg": 500, "price_per_kg": 10, "description": "Large Kiran variety watermelons. Sweet and refreshing, direct from the field.", "state": "Andhra Pradesh", "district": "Anantapur"},
    {"crop_name": "Papaya", "quantity_kg": 250, "price_per_kg": 20, "description": "Red Lady papaya, fully organic. Rich in vitamins and ready for market.", "state": "Gujarat", "district": "Anand"},
]


def seed_marketplace_listings(db: Session):
    """Seed demo farmer accounts and crop listings for the marketplace."""
    existing = db.query(CropListing).first()
    if existing:
        return

    # Create demo farmer accounts
    farmer_ids = []
    for f in DEMO_FARMERS:
        existing_user = db.query(User).filter(User.email == f["email"]).first()
        if existing_user:
            farmer_ids.append(existing_user.id)
        else:
            user = User(
                name=f["name"],
                phone=f["phone"],
                email=f["email"],
                password_hash=pwd_context.hash("demo1234"),
                role="farmer",
                state=f["state"],
                district=f["district"],
            )
            db.add(user)
            db.flush()
            farmer_ids.append(user.id)

    # Create listings
    for i, listing_data in enumerate(DEMO_LISTINGS):
        farmer_id = farmer_ids[i % len(farmer_ids)]
        harvest_days = random.randint(5, 30)
        listing = CropListing(
            farmer_id=farmer_id,
            crop_name=listing_data["crop_name"],
            quantity_kg=listing_data["quantity_kg"],
            price_per_kg=listing_data["price_per_kg"],
            description=listing_data["description"],
            state=listing_data["state"],
            district=listing_data["district"],
            harvest_date=date.today() - timedelta(days=harvest_days),
            status="active",
            views=random.randint(10, 200),
            images=[],
        )
        db.add(listing)

    db.commit()

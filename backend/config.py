from pydantic_settings import BaseSettings
from functools import lru_cache
import os


class Settings(BaseSettings):
    DATABASE_URL: str = "mysql+pymysql://root:password@localhost:3306/agrosoilai"
    SECRET_KEY: str = "change-this-to-a-random-minimum-32-char-string"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    OPENWEATHERMAP_API_KEY: str = "your_openweathermap_key_here"
    RAZORPAY_KEY_ID: str = "rzp_test_xxxxxxxxxxxxxxxx"
    RAZORPAY_KEY_SECRET: str = "your_razorpay_key_secret_here"
    DATA_GOV_API_KEY: str = "your_data_gov_in_api_key_here"
    UPLOAD_DIR: str = "uploads"

    class Config:
        env_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()

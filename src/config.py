import os
from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    app_name: str = "Receipts API"
    secret_key: str = os.getenv("APP_KEY", "your-secret-key-here")
    jwt_secret_key: str = os.getenv("JWT_KEY", "your-jwt-secret-here")
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 1440  # 24 hours
    jwt_refresh_token_expire_days: int = 30
    
    # Database settings
    database_url: str = os.getenv("DATABASE_URL", "postgresql://localhost/receipts")
    
    # OpenAI settings
    openai_api_key: str = os.getenv("OPENAI_API_KEY", "")
    
    class Config:
        env_file = ".env"
        extra = "allow"  # Allow extra fields from .env

@lru_cache()
def get_settings():
    return Settings()

# For backward compatibility with existing code
class Config:
    SECRET_KEY = os.getenv("APP_KEY")
    JWT_SECRET_KEY = os.getenv("JWT_KEY")
    JWT_TOKEN_LOCATION = ['headers']  # Changed from cookies to headers
    JWT_COOKIE_CSRF_PROTECT = False

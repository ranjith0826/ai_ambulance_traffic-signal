import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PORT: int = int(os.getenv("PORT", 8000))
    MONGODB_URI: str = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
    DATABASE_NAME: str = os.getenv("DATABASE_NAME", "lifelane_ai")
    JWT_SECRET: str = os.getenv("JWT_SECRET", "lifelane_super_secret_jwt_key_2026_modern_cream")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 1440))
    CORS_ORIGINS: str = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173")
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    
    # Priority Engine Weights
    WEIGHT_SEVERITY: float = 0.40
    WEIGHT_ETA: float = 0.30
    WEIGHT_DISTANCE: float = 0.20
    WEIGHT_HOSPITAL: float = 0.10
    
    # Corridor and Conflict Settings
    CONFLICT_WINDOW_SECONDS: int = 30
    GREEN_CORRIDOR_DISTANCE_METERS: float = 500.0

    # Maps & External Services API Keys
    MAPBOX_API_KEY: str = os.getenv("MAPBOX_API_KEY", "")
    GOOGLE_MAPS_API_KEY: str = os.getenv("GOOGLE_MAPS_API_KEY", "")
    OPENROUTESERVICE_API_KEY: str = os.getenv("OPENROUTESERVICE_API_KEY", "")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    OPENWEATHER_API_KEY: str = os.getenv("OPENWEATHER_API_KEY", "")

    # AWS Cloud Services Configuration (Bedrock & S3)
    AWS_ACCESS_KEY_ID: str = os.getenv("AWS_ACCESS_KEY_ID", "")
    AWS_SECRET_ACCESS_KEY: str = os.getenv("AWS_SECRET_ACCESS_KEY", "")
    AWS_REGION: str = os.getenv("AWS_REGION", "us-east-1")
    AWS_S3_BUCKET_NAME: str = os.getenv("AWS_S3_BUCKET_NAME", "lifelane-ambulance-reports")
    AWS_BEDROCK_MODEL_ID: str = os.getenv("AWS_BEDROCK_MODEL_ID", "anthropic.claude-3-5-sonnet-20240620-v1:0")

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()

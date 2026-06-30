import os
from typing import Optional, Union, List
from pydantic_settings import BaseSettings
from pydantic import validator, Field

class Settings(BaseSettings):
    # App
    APP_NAME: str = "DataChart SaaS Dashboard"
    VERSION: str = "1.0.0"
    DEBUG: bool = False
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-change-in-production-please")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # Database
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "sqlite:///./DataChart_dashboard.db"
    )
    
    # Redis
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    
    # Email
    SMTP_HOST: Optional[str] = None
    SMTP_PORT: int = 587
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    EMAILS_FROM_EMAIL: Optional[str] = None
    EMAILS_FROM_NAME: str = "DataChart"
    
    # Storage
    AWS_ACCESS_KEY_ID: Optional[str] = None
    AWS_SECRET_ACCESS_KEY: Optional[str] = None
    AWS_S3_BUCKET: Optional[str] = None
    AWS_REGION: str = "us-east-1"
    
    # External APIs
    OPENAI_API_KEY: Optional[str] = None
    STRIPE_API_KEY: Optional[str] = None
    STRIPE_WEBHOOK_SECRET: Optional[str] = None
    
    # Monitoring
    SENTRY_DSN: Optional[str] = None
    
    # CORS
    CORS_ORIGINS: Union[str, List[str]] = Field(
        default=[
            "http://localhost:3000",
            "http://localhost:3001", 
            "http://localhost:8080",
            "http://206.189.178.211",
            "http://206.189.178.211:3000",
            "http://206.189.178.211:8000",
            "https://app.datachart.app",
            "https://dashboard.datachart.app"
        ]
    )
    
    # Rate Limiting
    RATE_LIMIT_REQUESTS: int = 100
    RATE_LIMIT_WINDOW: int = 3600  # 1 hour in seconds
    
    # File Upload
    MAX_FILE_SIZE: int = 10 * 1024 * 1024  # 10MB
    ALLOWED_FILE_TYPES: list = [".csv", ".xlsx", ".xls", ".json"]
    
    # Cache
    CACHE_TTL: int = 300  # 5 minutes
    QUERY_CACHE_TTL: int = 900  # 15 minutes
    
    # Pagination
    DEFAULT_PAGE_SIZE: int = 20
    MAX_PAGE_SIZE: int = 100
    
    @validator("CORS_ORIGINS", pre=True, always=True)
    def assemble_cors_origins(cls, v):
        if isinstance(v, str):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, list):
            return v
        raise ValueError("CORS_ORIGINS must be a list or comma-separated string")
    
    # Additional fields from .env
    PROJECT_NAME: str = "DataChart SaaS"
    APP_ENV: str = "development"
    DEMO_MODE: bool = False
    RATE_LIMIT_PER_MINUTE: int = 100
    LOG_LEVEL: str = "INFO"
    UPLOAD_FOLDER: str = "./uploads"
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"  # Ignore extra fields in .env

settings = Settings()
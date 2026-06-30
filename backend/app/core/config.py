"""
Configuration settings for DataChart SaaS

Handles all environment variables and application configuration.
"""

from typing import List, Optional, Union
from pydantic import validator
try:
    from pydantic_settings import BaseSettings
except ImportError:
    from pydantic import BaseSettings
import secrets

class Settings(BaseSettings):
    """Application settings"""
    
    # API Configuration
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = secrets.token_urlsafe(32)
    
    # CORS origins
    CORS_ORIGINS: Union[str, List[str]] = [
        "http://localhost:3000",
        "http://localhost:3001", 
        "http://localhost:8080",
        "https://localhost:3000",
        "https://localhost:3001",
        "https://localhost:8080"
    ]
    BACKEND_CORS_ORIGINS: Optional[List[str]] = None  # Alias for compatibility

    @validator("CORS_ORIGINS", pre=True)
    def assemble_cors_origins(cls, v: str | List[str]) -> List[str] | str:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)
    
    @validator("BACKEND_CORS_ORIGINS", pre=True, always=True)
    def set_backend_cors(cls, v, values):
        """Set BACKEND_CORS_ORIGINS from CORS_ORIGINS for compatibility"""
        if v is None and 'CORS_ORIGINS' in values:
            return values['CORS_ORIGINS']
        return v

    # Database
    DATABASE_URL: str = "sqlite:///./datachart.db"
    
    # Redis (for caching and background tasks)  
    REDIS_URL: str = "redis://localhost:6379"
    
    # JWT Settings
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    ALGORITHM: str = "HS256"
    
    # External APIs
    SNOWFLAKE_ACCOUNT: Optional[str] = None
    SNOWFLAKE_USER: Optional[str] = None
    SNOWFLAKE_PASSWORD: Optional[str] = None
    SNOWFLAKE_WAREHOUSE: Optional[str] = None
    SNOWFLAKE_DATABASE: Optional[str] = None
    SNOWFLAKE_SCHEMA: Optional[str] = None
    
    # Azure Configuration
    AZURE_TENANT_ID: Optional[str] = None
    AZURE_CLIENT_ID: Optional[str] = None
    AZURE_CLIENT_SECRET: Optional[str] = None
    
    # ServiceNow Configuration
    SERVICENOW_INSTANCE: Optional[str] = None
    SERVICENOW_USERNAME: Optional[str] = None
    SERVICENOW_PASSWORD: Optional[str] = None
    
    # Intune Configuration
    INTUNE_TENANT_ID: Optional[str] = None
    INTUNE_CLIENT_ID: Optional[str] = None
    INTUNE_CLIENT_SECRET: Optional[str] = None
    
    # Monitoring
    ENABLE_METRICS: bool = True
    PROMETHEUS_PORT: int = 9090
    
    # Logging
    LOG_LEVEL: str = "INFO"
    
    # Application
    PROJECT_NAME: str = "DataChart SaaS"
    VERSION: str = "1.0.0"
    DESCRIPTION: str = "WordPress for Dashboards - Enterprise Dashboard Builder"
    APP_NAME: str = "DataChart SaaS"
    APP_ENV: str = "development"
    DEBUG: bool = False
    
    # Email configuration (for notifications)
    SMTP_TLS: bool = True
    SMTP_PORT: Optional[int] = None
    SMTP_HOST: Optional[str] = None
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    EMAILS_FROM_EMAIL: Optional[str] = None
    EMAILS_FROM_NAME: Optional[str] = None
    
    # Stripe (for billing)
    STRIPE_PUBLISHABLE_KEY: Optional[str] = None
    STRIPE_SECRET_KEY: Optional[str] = None
    STRIPE_WEBHOOK_SECRET: Optional[str] = None
    
    # File storage
    UPLOAD_FOLDER: str = "./uploads"
    MAX_FILE_SIZE: int = 10 * 1024 * 1024  # 10MB
    
    # Rate limiting
    RATE_LIMIT_PER_MINUTE: int = 100
    
    # Demo mode
    DEMO_MODE: bool = False
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"  # Ignore extra fields in .env

# Global settings instance
settings = Settings()
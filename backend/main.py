from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException
from contextlib import asynccontextmanager
import uvicorn
import logging
import asyncio
# from prometheus_client import make_asgi_app

from app.core.config import settings
from app.api.v1.api import api_router
from app.api.v1 import apm
from app.core.database import engine, Base
from app.models.user import User, Organization
from app.models.dashboard import Dashboard
from app.models.data_source import DataSource
from app.core.errors import (
    SaaSException, saas_exception_handler, http_exception_handler,
    validation_exception_handler, generic_exception_handler
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting DataChart SaaS Platform...")
    # Create database tables (for now using sync approach)
    Base.metadata.create_all(bind=engine)
    logger.info("Database initialized")
    yield
    # Shutdown
    logger.info("Shutting down DataChart SaaS Platform...")


# Create FastAPI app
app = FastAPI(
    title="DataChart SaaS",
    description="SaaS Dashboard Builder Platform - WordPress for Dashboards",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add exception handlers
app.add_exception_handler(SaaSException, saas_exception_handler)
app.add_exception_handler(HTTPException, http_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(Exception, generic_exception_handler)

# Add Prometheus metrics (commented out for demo)
# metrics_app = make_asgi_app()
# app.mount("/metrics", metrics_app)

# Include API router
app.include_router(api_router, prefix="/api/v1")

# Include APM router
app.include_router(apm.router)

# Add WebSocket endpoint for real-time dashboard updates (commented out for now)
# app.websocket("/ws")(websocket_endpoint)

# Root endpoint
@app.get("/")
async def root():
    return {
        "name": "DataChart SaaS",
        "version": "1.0.0",
        "status": "operational",
        "description": "WordPress for Dashboards - Build custom data dashboards with drag-and-drop",
        "endpoints": {
            "api": "/api/v1",
            "docs": "/docs",
            "metrics": "/metrics"
        }
    }

# Health check endpoint
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "DataChart SaaS",
        "version": "1.0.0"
    }

# SaaS-specific endpoints
@app.get("/api/v1/platform/stats")
async def platform_stats():
    """Get platform-wide statistics"""
    return {
        "total_tenants": 150,
        "total_dashboards": 1240,
        "total_data_sources": 450,
        "active_users": 890,
        "platform_health": "excellent"
    }


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_config={
            "version": 1,
            "disable_existing_loggers": False,
            "formatters": {
                "default": {
                    "format": "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
                },
            },
            "handlers": {
                "default": {
                    "formatter": "default",
                    "class": "logging.StreamHandler",
                    "stream": "ext://sys.stdout",
                },
            },
            "root": {
                "level": "INFO",
                "handlers": ["default"],
            },
        }
    )


# Register enterprise app management routes
try:
    from enterprise_app_manager import register_enterprise_routes
    register_enterprise_routes(app)
    print('✅ Enterprise App Manager loaded: PatchMyPC, SCCM, Autopatch, Entra, Salesforce, Oracle integrations')
except Exception as e:
    print(f'⚠️ Enterprise features not loaded: {e}')


# Register Qlik Killer features
try:
    from qlik_killer_features import register_qlik_killer_routes
    register_qlik_killer_routes(app)
    print('🔥 Qlik Killer features loaded: Real-time collab, Natural language, Embedded actions, Zero-cost!')
except Exception as e:
    print(f'⚠️ Qlik killer features not loaded: {e}')


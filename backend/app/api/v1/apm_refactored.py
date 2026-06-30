"""
Refactored APM API Router - Aggregates all APM endpoints
"""
from fastapi import APIRouter
from app.api.v1.endpoints import apm_dashboard, apm_applications, apm_cache

# Create main APM router
router = APIRouter(prefix="/api/v1/apm", tags=["APM"])

# Include sub-routers
router.include_router(apm_dashboard.router)
router.include_router(apm_applications.router)
router.include_router(apm_cache.router)

# Additional metadata endpoint
@router.get("/")
async def apm_info():
    """Get APM API information and available endpoints"""
    return {
        "name": "Application Portfolio Management API",
        "version": "2.0.0",
        "description": "Refactored and optimized APM API with modular architecture",
        "endpoints": {
            "dashboard": {
                "path": "/api/v1/apm/dashboard",
                "description": "Dashboard metrics and KPIs"
            },
            "applications": {
                "path": "/api/v1/apm/applications",
                "description": "Application management and search"
            }
        },
        "features": [
            "Pydantic validation",
            "Service layer architecture",
            "Caching support",
            "Comprehensive filtering",
            "Type safety"
        ]
    }
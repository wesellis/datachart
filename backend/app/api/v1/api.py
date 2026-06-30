"""
Main API Router

Consolidates all API endpoints for version 1 of the DataChart SaaS API.
"""

from fastapi import APIRouter

# Import routers with error handling for missing dependencies
try:
    from .data_sources import router as data_sources_router
    DATA_SOURCES_AVAILABLE = True
except Exception:
    data_sources_router = None
    DATA_SOURCES_AVAILABLE = False

try:
    from .dashboards import router as dashboards_router
    DASHBOARDS_AVAILABLE = True
except Exception:
    dashboards_router = None  
    DASHBOARDS_AVAILABLE = False

try:
    from .onboarding import router as onboarding_router
    ONBOARDING_AVAILABLE = True
except Exception:
    onboarding_router = None
    ONBOARDING_AVAILABLE = False

try:
    from .monitoring import router as monitoring_router
    MONITORING_AVAILABLE = True
except Exception:
    monitoring_router = None
    MONITORING_AVAILABLE = False

try:
    from .comparison import router as comparison_router
    COMPARISON_AVAILABLE = True
except Exception:
    comparison_router = None
    COMPARISON_AVAILABLE = False

# Create main API router
api_router = APIRouter()

# Include sub-routers only if they loaded successfully
if DATA_SOURCES_AVAILABLE and data_sources_router:
    api_router.include_router(
        data_sources_router,
        prefix="/data-sources",
        tags=["Data Sources"]
    )

if DASHBOARDS_AVAILABLE and dashboards_router:
    api_router.include_router(
        dashboards_router,
        prefix="/dashboards", 
        tags=["Dashboards"]
    )

if ONBOARDING_AVAILABLE and onboarding_router:
    api_router.include_router(
        onboarding_router,
        prefix="/onboarding",
        tags=["Customer Onboarding"]
    )

if MONITORING_AVAILABLE and monitoring_router:
    api_router.include_router(
        monitoring_router,
        prefix="/monitoring",
        tags=["Monitoring & Analytics"]
    )

if COMPARISON_AVAILABLE and comparison_router:
    api_router.include_router(
        comparison_router,
        prefix="/comparison",
        tags=["Comparison & ROI"]
    )

# Health check endpoint
@api_router.get("/health")
async def health_check():
    """Health check endpoint for API v1"""
    return {
        "status": "healthy",
        "version": "1.0.0",
        "service": "DataChart API v1"
    }
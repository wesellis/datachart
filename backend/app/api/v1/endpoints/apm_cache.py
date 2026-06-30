"""
APM Cache Management endpoints
"""
from fastapi import APIRouter, HTTPException, Query
from typing import Dict, Any, Optional
from app.services.apm_service import apm_service
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/cache", tags=["APM Cache"])


@router.get("/stats")
async def get_cache_stats() -> Dict[str, Any]:
    """
    Get cache statistics including hit rate, memory usage, and entry count.
    """
    try:
        stats = apm_service.get_cache_stats()
        return {
            "status": "success",
            "cache": stats
        }
    except Exception as e:
        logger.error(f"Error fetching cache stats: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/clear")
async def clear_cache(
    pattern: Optional[str] = Query(None, description="Optional pattern to match keys for deletion")
) -> Dict[str, Any]:
    """
    Clear cache entries.
    
    - **pattern**: Optional pattern to match specific keys (e.g., "dashboard:*")
    - If no pattern is provided, clears all cache entries
    """
    try:
        if pattern:
            cleared = apm_service.clear_cache(pattern=pattern)
            message = f"Cleared cache entries matching pattern: {pattern}"
        else:
            cleared = apm_service.clear_cache()
            message = "Cleared all cache entries"
        
        logger.info(message)
        
        return {
            "status": "success",
            "message": message,
            "cleared": cleared
        }
    except Exception as e:
        logger.error(f"Error clearing cache: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/refresh")
async def refresh_cache() -> Dict[str, Any]:
    """
    Refresh cache by clearing all entries and pre-populating with fresh data.
    """
    try:
        # Clear all cache
        apm_service.clear_cache()
        
        # Pre-populate critical cache entries
        from app.schemas.apm_schemas import ViewType
        
        # Pre-cache dashboard metrics for all views
        for view in ViewType:
            apm_service.get_dashboard_metrics(view_type=view)
        
        # Pre-cache applications
        apm_service.get_applications(limit=50)
        
        logger.info("Cache refreshed successfully")
        
        return {
            "status": "success",
            "message": "Cache refreshed and pre-populated"
        }
    except Exception as e:
        logger.error(f"Error refreshing cache: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
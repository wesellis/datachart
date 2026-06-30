"""
APM Applications endpoints
"""
from fastapi import APIRouter, HTTPException, Query, Body
from typing import List, Optional
from app.schemas.apm_schemas import Application, ApplicationFilter, RiskLevel, PatchStatus, ComplianceStatus
from app.services.apm_service import apm_service
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/applications", tags=["APM Applications"])


@router.get("", response_model=List[Application])
async def get_applications(
    limit: int = Query(50, ge=1, le=500, description="Number of applications to return"),
    offset: int = Query(0, ge=0, description="Number of applications to skip"),
    vendor: Optional[str] = Query(None, description="Filter by vendor name"),
    department: Optional[str] = Query(None, description="Filter by department"),
    risk_level: Optional[RiskLevel] = Query(None, description="Filter by risk level"),
    patch_status: Optional[PatchStatus] = Query(None, description="Filter by patch status"),
    compliance_status: Optional[ComplianceStatus] = Query(None, description="Filter by compliance status"),
    min_cost: Optional[float] = Query(None, ge=0, description="Minimum cost filter"),
    max_cost: Optional[float] = Query(None, ge=0, description="Maximum cost filter")
) -> List[Application]:
    """
    Get paginated list of applications with optional filters.
    
    Query parameters allow filtering by:
    - Vendor name (partial match)
    - Department
    - Risk level (high/medium/low)
    - Patch status
    - Compliance status
    - Cost range
    """
    try:
        filters = ApplicationFilter(
            vendor=vendor,
            department=department,
            risk_level=risk_level,
            patch_status=patch_status,
            compliance_status=compliance_status,
            min_cost=min_cost,
            max_cost=max_cost
        )
        
        applications = apm_service.get_applications(
            limit=limit,
            offset=offset,
            filters=filters
        )
        
        return applications
    except Exception as e:
        logger.error(f"Error fetching applications: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/search")
async def search_applications(
    q: str = Query(..., min_length=2, description="Search query"),
    limit: int = Query(20, ge=1, le=100)
) -> List[Application]:
    """
    Search applications by name or vendor.
    """
    try:
        all_apps = apm_service.get_applications(limit=500)
        
        # Filter by search query
        query_lower = q.lower()
        filtered = [
            app for app in all_apps
            if query_lower in app.name.lower() or query_lower in app.vendor.lower()
        ]
        
        return filtered[:limit]
    except Exception as e:
        logger.error(f"Error searching applications: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/statistics")
async def get_application_statistics():
    """
    Get statistical summary of all applications.
    """
    try:
        all_apps = apm_service.get_applications(limit=1000)
        
        # Calculate statistics
        total_apps = len(all_apps)
        total_cost = sum(app.cost_2025 for app in all_apps)
        avg_cost = total_cost / total_apps if total_apps > 0 else 0
        avg_utilization = sum(app.utilization for app in all_apps) / total_apps if total_apps > 0 else 0
        
        # Group by categories
        by_vendor = {}
        by_department = {}
        by_risk = {"high": 0, "medium": 0, "low": 0}
        by_compliance = {"Compliant": 0, "Non-Compliant": 0, "Partially Compliant": 0}
        
        for app in all_apps:
            # Vendor grouping
            if app.vendor not in by_vendor:
                by_vendor[app.vendor] = {"count": 0, "total_cost": 0}
            by_vendor[app.vendor]["count"] += 1
            by_vendor[app.vendor]["total_cost"] += app.cost_2025
            
            # Department grouping
            if app.department not in by_department:
                by_department[app.department] = {"count": 0, "total_cost": 0}
            by_department[app.department]["count"] += 1
            by_department[app.department]["total_cost"] += app.cost_2025
            
            # Risk grouping
            by_risk[app.risk_level] += 1
            
            # Compliance grouping
            by_compliance[app.compliance] += 1
        
        return {
            "total_applications": total_apps,
            "total_annual_cost": round(total_cost, 2),
            "average_cost_per_app": round(avg_cost, 2),
            "average_utilization": round(avg_utilization, 2),
            "by_vendor": by_vendor,
            "by_department": by_department,
            "by_risk_level": by_risk,
            "by_compliance_status": by_compliance,
            "top_5_expensive": [
                {"name": app.name, "vendor": app.vendor, "cost": app.cost_2025}
                for app in sorted(all_apps, key=lambda x: x.cost_2025, reverse=True)[:5]
            ],
            "underutilized_apps": [
                {"name": app.name, "utilization": app.utilization, "cost": app.cost_2025}
                for app in all_apps if app.utilization < 50
            ][:10]
        }
    except Exception as e:
        logger.error(f"Error calculating statistics: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{app_id}", response_model=Application)
async def get_application_by_id(app_id: str) -> Application:
    """
    Get detailed information for a specific application.
    """
    try:
        all_apps = apm_service.get_applications(limit=1000)
        
        for app in all_apps:
            if app.id == app_id:
                return app
        
        raise HTTPException(status_code=404, detail=f"Application {app_id} not found")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching application {app_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
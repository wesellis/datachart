"""
APM Dashboard endpoints
"""
from fastapi import APIRouter, HTTPException, Query, Depends
from typing import Dict, Any
from app.schemas.apm_schemas import DashboardMetrics, ViewType
from app.services.apm_service import apm_service
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/dashboard", tags=["APM Dashboard"])


@router.get("", response_model=DashboardMetrics)
async def get_dashboard_metrics(
    view: ViewType = Query(ViewType.OVERVIEW, description="Dashboard view type")
) -> DashboardMetrics:
    """
    Get dashboard metrics for the specified view type.
    
    - **view**: Type of dashboard view (overview, optimization, compliance, planning, operations)
    
    Returns comprehensive metrics including:
    - Application counts and statistics
    - Spending analysis for 2024/2025
    - Compliance and risk metrics
    - Vendor breakdown
    - Monthly spending trends
    """
    try:
        logger.info(f"Fetching dashboard metrics for view: {view}")
        metrics = apm_service.get_dashboard_metrics(view_type=view)
        return metrics
    except Exception as e:
        logger.error(f"Error fetching dashboard metrics: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch dashboard metrics: {str(e)}")


@router.get("/summary")
async def get_dashboard_summary(
    view: ViewType = Query(ViewType.OVERVIEW)
) -> Dict[str, Any]:
    """
    Get a simplified dashboard summary for quick overview.
    """
    try:
        metrics = apm_service.get_dashboard_metrics(view_type=view)
        
        return {
            "view_type": view,
            "total_applications": metrics.total_applications,
            "active_applications": metrics.active_applications,
            "total_spend_current": metrics.total_spend_2025,
            "savings_percentage": metrics.savings_percentage,
            "compliance_rate": metrics.compliance_average,
            "high_risk_count": metrics.high_risk_apps,
            "upcoming_renewals": metrics.renewals_next_30_days
        }
    except Exception as e:
        logger.error(f"Error fetching dashboard summary: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/kpis")
async def get_key_performance_indicators() -> Dict[str, Any]:
    """
    Get key performance indicators for executive dashboard.
    """
    try:
        metrics = apm_service.get_dashboard_metrics(view_type=ViewType.OVERVIEW)
        
        return {
            "cost_optimization": {
                "total_savings": metrics.savings_amount,
                "savings_percentage": metrics.savings_percentage,
                "cost_per_employee": metrics.cost_per_employee,
                "utilization_rate": metrics.average_utilization
            },
            "risk_compliance": {
                "compliance_rate": metrics.compliance_average,
                "patch_compliance": metrics.patch_compliance_rate,
                "high_risk_apps": metrics.high_risk_apps,
                "total_risk_score": (metrics.high_risk_apps * 3 + metrics.medium_risk_apps * 2 + metrics.low_risk_apps)
            },
            "operational": {
                "active_applications": metrics.active_applications,
                "vendor_count": metrics.vendor_count,
                "upcoming_renewals": metrics.renewals_next_30_days,
                "renewal_value": metrics.renewal_cost_30_days
            }
        }
    except Exception as e:
        logger.error(f"Error fetching KPIs: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
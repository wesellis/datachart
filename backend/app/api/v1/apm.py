from fastapi import APIRouter, HTTPException, Query
from typing import Dict, Any, List, Optional
from app.services.apm_mock_service import APMMockDataService
import asyncio
from datetime import datetime

router = APIRouter(prefix="/api/v1/apm", tags=["APM"])
mock_service = APMMockDataService()

# Cache for dashboard data to improve performance
dashboard_cache = {"data": None, "timestamp": None}
CACHE_DURATION = 30  # seconds

@router.get("/dashboard")
async def get_dashboard_data(view: str = Query("overview", description="View type: overview, optimization, compliance, planning, operations")) -> Dict[str, Any]:
    """Get main dashboard metrics and data filtered by view type"""
    try:
        # Use view-specific cache key
        cache_key = f"{view}_data"
        
        # Generate new data with view filter
        data = mock_service.get_dashboard_metrics(view_type=view)
        
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/applications")
async def get_applications(
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    vendor: Optional[str] = None,
    department: Optional[str] = None,
    risk_level: Optional[str] = None,
    patch_status: Optional[str] = None
) -> List[Dict[str, Any]]:
    """Get paginated list of applications with filters"""
    try:
        apps = mock_service.generate_applications(500)
        
        # Apply filters
        if vendor:
            apps = [a for a in apps if vendor.lower() in a["vendor_name"].lower()]
        if department:
            apps = [a for a in apps if department.lower() in a["department"].lower()]
        if risk_level:
            apps = [a for a in apps if a["risk_level"].lower() == risk_level.lower()]
        if patch_status:
            apps = [a for a in apps if a["patch_status"].lower() == patch_status.lower()]
        
        # Sort by cost (highest first)
        apps.sort(key=lambda x: x["cost_2025"], reverse=True)
        
        return apps[offset:offset + limit]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/spending/{year}")
async def get_spending_by_year(year: int) -> Dict[str, Any]:
    """Get spending details for a specific year"""
    try:
        if year not in [2024, 2025]:
            raise HTTPException(status_code=400, detail="Year must be 2024 or 2025")
        
        apps = mock_service.generate_applications(500)
        field = f"cost_{year}"
        
        total = sum(app[field] for app in apps)
        
        # Group by vendor
        vendor_spend = {}
        for app in apps:
            vendor = app["vendor_name"]
            if vendor not in vendor_spend:
                vendor_spend[vendor] = {
                    "vendor_name": vendor,
                    "total_spend": 0,
                    "app_count": 0,
                    "applications": []
                }
            vendor_spend[vendor]["total_spend"] += app[field]
            vendor_spend[vendor]["app_count"] += 1
            vendor_spend[vendor]["applications"].append({
                "name": app["name"],
                "cost": app[field],
                "department": app["department"]
            })
        
        # Sort vendors by spend
        sorted_vendors = sorted(vendor_spend.values(), key=lambda x: x["total_spend"], reverse=True)
        
        # Department breakdown
        dept_spend = {}
        for app in apps:
            dept = app["department"]
            if dept not in dept_spend:
                dept_spend[dept] = 0
            dept_spend[dept] += app[field]
        
        return {
            "year": year,
            "total_spend": round(total, 2),
            "vendor_breakdown": [{
                "vendor_name": v["vendor_name"],
                "total_spend": round(v["total_spend"], 2),
                "app_count": v["app_count"],
                "percentage": round(v["total_spend"] / total * 100, 2)
            } for v in sorted_vendors[:10]],
            "department_breakdown": {k: round(v, 2) for k, v in dept_spend.items()},
            "monthly_average": round(total / 12, 2),
            "quarterly_breakdown": {
                "Q1": round(total * 0.23, 2),
                "Q2": round(total * 0.26, 2),
                "Q3": round(total * 0.24, 2),
                "Q4": round(total * 0.27, 2)
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/renewals")
async def get_upcoming_renewals(
    days: int = Query(90, ge=1, le=365)
) -> Dict[str, Any]:
    """Get applications with upcoming renewals"""
    try:
        apps = mock_service.generate_applications(500)
        
        renewals = []
        for app in apps:
            if 0 <= app["days_until_renewal"] <= days:
                renewals.append(app)
        
        # Sort by renewal date
        renewals.sort(key=lambda x: x["days_until_renewal"])
        
        # Group by time periods
        periods = {
            "next_7_days": [],
            "next_30_days": [],
            "next_60_days": [],
            "next_90_days": [],
            "beyond_90_days": []
        }
        
        for app in renewals:
            days_until = app["days_until_renewal"]
            if days_until <= 7:
                periods["next_7_days"].append(app)
            elif days_until <= 30:
                periods["next_30_days"].append(app)
            elif days_until <= 60:
                periods["next_60_days"].append(app)
            elif days_until <= 90:
                periods["next_90_days"].append(app)
            else:
                periods["beyond_90_days"].append(app)
        
        return {
            "total_renewals": len(renewals),
            "total_renewal_cost": round(sum(a["cost_2025"] for a in renewals), 2),
            "periods": {
                key: {
                    "count": len(apps),
                    "total_cost": round(sum(a["cost_2025"] for a in apps), 2),
                    "applications": apps[:10]  # Limit to 10 per period
                }
                for key, apps in periods.items()
            },
            "high_value_renewals": [a for a in renewals if a["cost_2025"] > 100000][:10],
            "auto_renewals": len([a for a in renewals if a["auto_renewal"]])
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/compliance")
async def get_compliance_metrics() -> Dict[str, Any]:
    """Get compliance and patching metrics"""
    try:
        apps = mock_service.generate_applications(500)
        
        current = [a for a in apps if a["patch_status"] == "current"]
        pending = [a for a in apps if a["patch_status"] == "pending"]
        overdue = [a for a in apps if a["patch_status"] == "overdue"]
        
        # Calculate compliance by department
        dept_compliance = {}
        for app in apps:
            dept = app["department"]
            if dept not in dept_compliance:
                dept_compliance[dept] = {"total": 0, "compliant": 0}
            dept_compliance[dept]["total"] += 1
            if app["patch_status"] == "current":
                dept_compliance[dept]["compliant"] += 1
        
        dept_scores = {
            dept: round(data["compliant"] / data["total"] * 100, 2)
            for dept, data in dept_compliance.items()
        }
        
        return {
            "total_applications": len(apps),
            "patch_current": len(current),
            "patch_pending": len(pending),
            "patch_overdue": len(overdue),
            "compliance_percentage": round(len(current) / len(apps) * 100, 2),
            "average_compliance_score": round(sum(app["compliance_score"] for app in apps) / len(apps), 2),
            "average_security_score": round(sum(app["security_score"] for app in apps) / len(apps), 2),
            "critical_issues": sorted([a for a in apps if a["compliance_score"] < 75], 
                                     key=lambda x: x["compliance_score"])[:10],
            "department_compliance": dept_scores,
            "high_risk_apps": [a for a in apps if a["risk_level"] == "High"][:10],
            "recent_updates": sorted([a for a in current], 
                                    key=lambda x: x["last_update"], 
                                    reverse=True)[:10]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/vendors")
async def get_vendor_analysis() -> Dict[str, Any]:
    """Get vendor spending analysis"""
    try:
        apps = mock_service.generate_applications(500)
        
        vendors = {}
        for app in apps:
            vendor = app["vendor_name"]
            if vendor not in vendors:
                vendors[vendor] = {
                    "name": vendor,
                    "total_spend_2024": 0,
                    "total_spend_2025": 0,
                    "application_count": 0,
                    "licenses_total": 0,
                    "licenses_used": 0,
                    "departments": set(),
                    "risk_levels": {"High": 0, "Medium": 0, "Low": 0},
                    "applications": []
                }
            
            vendors[vendor]["total_spend_2024"] += app["cost_2024"]
            vendors[vendor]["total_spend_2025"] += app["cost_2025"]
            vendors[vendor]["application_count"] += 1
            vendors[vendor]["licenses_total"] += app["total_licenses"]
            vendors[vendor]["licenses_used"] += app["used_licenses"]
            vendors[vendor]["departments"].add(app["department"])
            vendors[vendor]["risk_levels"][app["risk_level"]] += 1
            vendors[vendor]["applications"].append({
                "name": app["name"],
                "cost_2025": app["cost_2025"],
                "utilization": app["utilization_rate"]
            })
        
        # Calculate savings and utilization
        for vendor in vendors.values():
            vendor["savings"] = round(vendor["total_spend_2024"] - vendor["total_spend_2025"], 2)
            vendor["savings_percentage"] = round(
                vendor["savings"] / vendor["total_spend_2024"] * 100 if vendor["total_spend_2024"] > 0 else 0, 2
            )
            vendor["license_utilization"] = round(
                vendor["licenses_used"] / vendor["licenses_total"] * 100 if vendor["licenses_total"] > 0 else 0, 2
            )
            vendor["total_spend_2024"] = round(vendor["total_spend_2024"], 2)
            vendor["total_spend_2025"] = round(vendor["total_spend_2025"], 2)
            vendor["department_count"] = len(vendor["departments"])
            vendor["departments"] = list(vendor["departments"])
            
            # Sort applications by cost
            vendor["applications"] = sorted(vendor["applications"], 
                                           key=lambda x: x["cost_2025"], 
                                           reverse=True)[:5]
        
        # Sort by total spend
        sorted_vendors = sorted(vendors.values(), key=lambda x: x["total_spend_2025"], reverse=True)
        
        # Calculate optimization opportunities
        optimization_opportunities = []
        for vendor in sorted_vendors:
            if vendor["license_utilization"] < 70:
                optimization_opportunities.append({
                    "vendor": vendor["name"],
                    "opportunity": "License Optimization",
                    "current_utilization": vendor["license_utilization"],
                    "potential_savings": round(vendor["total_spend_2025"] * 0.15, 2),
                    "recommendation": f"Review unused licenses - currently at {vendor['license_utilization']}% utilization"
                })
            if vendor["savings_percentage"] < 10:
                optimization_opportunities.append({
                    "vendor": vendor["name"],
                    "opportunity": "Contract Renegotiation",
                    "current_savings": vendor["savings_percentage"],
                    "potential_savings": round(vendor["total_spend_2025"] * 0.20, 2),
                    "recommendation": "Consider renegotiating contract terms for better rates"
                })
        
        return {
            "top_vendors": sorted_vendors[:15],
            "total_vendors": len(vendors),
            "total_savings": round(sum(v["savings"] for v in vendors.values()), 2),
            "average_savings_percentage": round(
                sum(v["savings_percentage"] for v in vendors.values()) / len(vendors), 2
            ),
            "optimization_opportunities": optimization_opportunities[:10],
            "vendor_risk_summary": {
                vendor["name"]: vendor["risk_levels"]
                for vendor in sorted_vendors[:10]
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/metrics/live")
async def get_live_metrics() -> Dict[str, Any]:
    """Get live updating metrics for real-time dashboard feel"""
    try:
        # Simulate live data with small variations
        import random
        
        base_metrics = mock_service.get_dashboard_metrics()
        
        # Add small random variations to make it feel alive
        live_adjustments = {
            "active_sessions": random.randint(15, 45),
            "data_refresh_timestamp": datetime.now().isoformat(),
            "pending_approvals": random.randint(3, 12),
            "recent_changes": random.randint(1, 5),
            "system_health": random.randint(95, 100),
            "api_response_time": random.randint(50, 200),  # milliseconds
        }
        
        return {**base_metrics, **live_adjustments}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
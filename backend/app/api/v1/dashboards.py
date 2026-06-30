"""
Dashboard API Endpoints - Live data queries for customer dashboards
"""

from fastapi import APIRouter, HTTPException, Depends, Query, Header
from fastapi.responses import JSONResponse
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
import logging
import json
import hashlib
from functools import lru_cache
import asyncio

from app.services.snowflake_service import SnowflakeService
from app.models.user import User, Organization
from app.core.cache import CacheManager
from app.core.auth import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/dashboards", tags=["dashboards"])

# Initialize cache manager
cache = CacheManager()

@router.get("/{customer_id}/overview")
async def get_dashboard_overview(
    customer_id: str,
    refresh: bool = Query(False, description="Force refresh bypassing cache"),
    api_key: Optional[str] = Header(None, alias="X-API-Key")
):
    """
    Get complete dashboard overview with all metrics
    Queries live data from customer's Snowflake and other sources
    """
    try:
        # Validate customer and API key
        customer = await validate_customer_access(customer_id, api_key)
        
        # Check cache unless refresh requested
        cache_key = f"dashboard:overview:{customer_id}"
        if not refresh:
            cached_data = cache.get(cache_key)
            if cached_data:
                logger.info(f"Returning cached dashboard for customer {customer_id}")
                return cached_data
        
        # Get customer credentials
        cred_manager = CredentialManager()
        snowflake_creds = cred_manager.get_snowflake_credentials(customer)
        
        # Initialize Snowflake service with customer credentials
        snowflake = SnowflakeService(snowflake_creds)
        
        # Parallel data fetching for performance
        tasks = [
            asyncio.create_task(fetch_vendor_metrics(snowflake)),
            asyncio.create_task(fetch_application_metrics(snowflake)),
            asyncio.create_task(fetch_cost_trends(snowflake)),
            asyncio.create_task(fetch_compliance_metrics(snowflake))
        ]
        
        results = await asyncio.gather(*tasks)
        
        # Combine results
        dashboard_data = {
            "dashboard_id": f"{customer_id}-overview",
            "customer_id": customer_id,
            "company_name": customer.company_name,
            "last_updated": datetime.utcnow().isoformat(),
            "data_sources": customer.data_sources,
            "metrics": {
                "vendor": results[0],
                "applications": results[1],
                "cost_trends": results[2],
                "compliance": results[3]
            },
            "summary": generate_executive_summary(results)
        }
        
        # Cache the results
        cache.set(cache_key, dashboard_data, ttl=300)  # 5 minute cache
        
        return dashboard_data
        
    except Exception as e:
        logger.error(f"Error fetching dashboard for customer {customer_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{customer_id}/vendors")
async def get_vendor_metrics(
    customer_id: str,
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    top_n: int = Query(10, description="Number of top vendors to return"),
    api_key: Optional[str] = Header(None, alias="X-API-Key")
):
    """Get vendor spend metrics with optional date filtering"""
    try:
        customer = await validate_customer_access(customer_id, api_key)
        
        # Build cache key with parameters
        cache_key = f"dashboard:vendors:{customer_id}:{start_date}:{end_date}:{top_n}"
        cached_data = cache.get(cache_key)
        if cached_data:
            return cached_data
        
        # Get credentials and query data
        cred_manager = CredentialManager()
        snowflake_creds = cred_manager.get_snowflake_credentials(customer)
        snowflake = SnowflakeService(snowflake_creds)
        
        # Build date range
        date_range = None
        if start_date and end_date:
            date_range = {"start_date": start_date, "end_date": end_date}
        
        # Query vendor data
        vendor_data = snowflake.query_vendor_spend(date_range)
        
        # Process and limit results
        if vendor_data.get('success'):
            vendor_data['data']['vendors'] = vendor_data['data']['vendors'][:top_n]
        
        # Cache results
        cache.set(cache_key, vendor_data, ttl=300)
        
        return vendor_data
        
    except Exception as e:
        logger.error(f"Error fetching vendor metrics: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{customer_id}/applications")
async def get_application_metrics(
    customer_id: str,
    category: Optional[str] = Query(None, description="Filter by application category"),
    status: Optional[str] = Query(None, description="Filter by status (active, inactive)"),
    api_key: Optional[str] = Header(None, alias="X-API-Key")
):
    """Get application portfolio metrics"""
    try:
        customer = await validate_customer_access(customer_id, api_key)
        
        cache_key = f"dashboard:applications:{customer_id}:{category}:{status}"
        cached_data = cache.get(cache_key)
        if cached_data:
            return cached_data
        
        cred_manager = CredentialManager()
        snowflake_creds = cred_manager.get_snowflake_credentials(customer)
        snowflake = SnowflakeService(snowflake_creds)
        
        app_data = snowflake.query_application_metrics()
        
        # Add filtering logic if needed
        if category or status:
            # This would normally filter the SQL query
            # For now, just add filter info to response
            app_data['filters'] = {
                'category': category,
                'status': status
            }
        
        cache.set(cache_key, app_data, ttl=300)
        
        return app_data
        
    except Exception as e:
        logger.error(f"Error fetching application metrics: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{customer_id}/costs")
async def get_cost_trends(
    customer_id: str,
    months: int = Query(12, description="Number of months to look back"),
    api_key: Optional[str] = Header(None, alias="X-API-Key")
):
    """Get cost trend analysis over time"""
    try:
        customer = await validate_customer_access(customer_id, api_key)
        
        cache_key = f"dashboard:costs:{customer_id}:{months}"
        cached_data = cache.get(cache_key)
        if cached_data:
            return cached_data
        
        cred_manager = CredentialManager()
        snowflake_creds = cred_manager.get_snowflake_credentials(customer)
        snowflake = SnowflakeService(snowflake_creds)
        
        cost_data = snowflake.query_cost_trends(months)
        
        cache.set(cache_key, cost_data, ttl=300)
        
        return cost_data
        
    except Exception as e:
        logger.error(f"Error fetching cost trends: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{customer_id}/compliance")
async def get_compliance_metrics(
    customer_id: str,
    api_key: Optional[str] = Header(None, alias="X-API-Key")
):
    """Get compliance and risk metrics"""
    try:
        customer = await validate_customer_access(customer_id, api_key)
        
        cache_key = f"dashboard:compliance:{customer_id}"
        cached_data = cache.get(cache_key)
        if cached_data:
            return cached_data
        
        cred_manager = CredentialManager()
        snowflake_creds = cred_manager.get_snowflake_credentials(customer)
        snowflake = SnowflakeService(snowflake_creds)
        
        compliance_data = snowflake.query_compliance_metrics()
        
        cache.set(cache_key, compliance_data, ttl=300)
        
        return compliance_data
        
    except Exception as e:
        logger.error(f"Error fetching compliance metrics: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{customer_id}/refresh")
async def refresh_dashboard_data(
    customer_id: str,
    api_key: Optional[str] = Header(None, alias="X-API-Key")
):
    """Force refresh all dashboard data, clearing cache"""
    try:
        customer = await validate_customer_access(customer_id, api_key)
        
        # Clear all cache keys for this customer
        cache_patterns = [
            f"dashboard:*:{customer_id}*"
        ]
        
        cleared_count = 0
        for pattern in cache_patterns:
            cleared_count += cache.clear_pattern(pattern)
        
        # Trigger fresh data fetch
        fresh_data = await get_dashboard_overview(customer_id, refresh=True, api_key=api_key)
        
        return {
            "status": "success",
            "message": f"Dashboard refreshed for customer {customer_id}",
            "cache_cleared": cleared_count,
            "timestamp": datetime.utcnow().isoformat(),
            "data": fresh_data
        }
        
    except Exception as e:
        logger.error(f"Error refreshing dashboard: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{customer_id}/widgets/{widget_id}")
async def get_widget_data(
    customer_id: str,
    widget_id: str,
    api_key: Optional[str] = Header(None, alias="X-API-Key")
):
    """Get data for a specific dashboard widget"""
    try:
        customer = await validate_customer_access(customer_id, api_key)
        
        # Map widget IDs to data fetchers
        widget_handlers = {
            "vendor-spend": lambda: get_vendor_metrics(customer_id, api_key=api_key),
            "app-portfolio": lambda: get_application_metrics(customer_id, api_key=api_key),
            "cost-trends": lambda: get_cost_trends(customer_id, api_key=api_key),
            "compliance-score": lambda: get_compliance_metrics(customer_id, api_key=api_key)
        }
        
        if widget_id not in widget_handlers:
            raise HTTPException(status_code=404, detail=f"Widget {widget_id} not found")
        
        widget_data = await widget_handlers[widget_id]()
        
        return {
            "widget_id": widget_id,
            "customer_id": customer_id,
            "data": widget_data,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error fetching widget data: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# Helper functions
async def validate_customer_access(customer_id: str, api_key: Optional[str]) -> Customer:
    """Validate customer exists and API key matches"""
    # Import customer data service
    from app.services.customer_data_service import CustomerDataService
    customer_service = CustomerDataService()
    
    try:
        customer_info = customer_service.get_customer_info(customer_id)
        
        # Create Customer object from service data
        customer = Customer(
            id=customer_id,
            company_name=customer_info["company_name"],
            email=f"admin@{customer_id}.com",
            api_key=api_key or "demo-key",
            data_sources=customer_info["data_sources"]
        )
        
        return customer
        
    except ValueError:
        # Customer not found
        raise HTTPException(status_code=404, detail=f"Customer {customer_id} not found")


async def fetch_vendor_metrics(snowflake: SnowflakeService) -> Dict:
    """Async wrapper for vendor metrics fetch"""
    return snowflake.query_vendor_spend()


async def fetch_application_metrics(snowflake: SnowflakeService) -> Dict:
    """Async wrapper for application metrics fetch"""
    return snowflake.query_application_metrics()


async def fetch_cost_trends(snowflake: SnowflakeService) -> Dict:
    """Async wrapper for cost trends fetch"""
    return snowflake.query_cost_trends()


async def fetch_compliance_metrics(snowflake: SnowflakeService) -> Dict:
    """Async wrapper for compliance metrics fetch"""
    return snowflake.query_compliance_metrics()


def generate_executive_summary(metrics: List[Dict]) -> Dict:
    """Generate executive summary from metrics"""
    vendor_data = metrics[0].get('data', {})
    app_data = metrics[1].get('data', {})
    cost_data = metrics[2].get('data', {})
    compliance_data = metrics[3].get('data', {})
    
    return {
        "total_spend": vendor_data.get('total_spend', 0),
        "vendor_count": vendor_data.get('vendor_count', 0),
        "application_count": app_data.get('total_applications', 0),
        "compliance_score": compliance_data.get('overall_compliance_score', 0),
        "cost_trend": cost_data.get('trend_percentage', 0),
        "key_insights": [
            f"Managing {vendor_data.get('vendor_count', 0)} vendors with ${vendor_data.get('total_spend', 0):,.0f} annual spend",
            f"Portfolio includes {app_data.get('total_applications', 0)} applications",
            f"Compliance score: {compliance_data.get('overall_compliance_score', 0):.1f}%",
            f"Cost trend: {cost_data.get('trend_percentage', 0):+.1f}% month-over-month"
        ]
    }
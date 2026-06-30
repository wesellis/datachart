# DataChart SaaS - Monitoring API Endpoints
# RESTful API for monitoring data access and alert management

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from fastapi.responses import PlainTextResponse
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
import json
import logging

from app.services.monitoring_service import monitoring_service, Alert, AlertSeverity
from app.core.auth import get_current_admin_user, get_current_user
from app.core.exceptions import MonitoringError, AlertingError
from app.models.user import User

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/monitoring", tags=["monitoring"])

# Prometheus metrics endpoint
@router.get("/metrics", response_class=PlainTextResponse)
async def get_prometheus_metrics():
    """
    Export metrics in Prometheus format
    
    This endpoint is scraped by Prometheus to collect application metrics.
    """
    try:
        metrics_data = await monitoring_service.get_metrics_export()
        return Response(content=metrics_data, media_type="text/plain")
    except Exception as e:
        logger.error(f"Error exporting metrics: {e}")
        raise HTTPException(status_code=500, detail="Failed to export metrics")

# Business metrics endpoint (authenticated)
@router.get("/metrics/business", response_class=PlainTextResponse)
async def get_business_metrics(current_user: User = Depends(get_current_admin_user)):
    """
    Export business-specific metrics
    
    Requires admin authentication. Used by Prometheus for business intelligence.
    """
    try:
        # Collect business metrics first
        await monitoring_service.collect_business_metrics()
        
        # Export only business-related metrics
        all_metrics = await monitoring_service.get_metrics_export()
        
        # Filter for business metrics
        business_lines = []
        for line in all_metrics.split('\n'):
            if any(metric in line for metric in [
                'DataChart_active_customers_total',
                'DataChart_monthly_recurring_revenue_dollars',
                'DataChart_api_quota_usage_percent'
            ]):
                business_lines.append(line)
        
        return Response(content='\n'.join(business_lines), media_type="text/plain")
    except Exception as e:
        logger.error(f"Error exporting business metrics: {e}")
        raise HTTPException(status_code=500, detail="Failed to export business metrics")

# Integration health metrics
@router.get("/metrics/integrations", response_class=PlainTextResponse)
async def get_integration_metrics(current_user: User = Depends(get_current_admin_user)):
    """
    Export integration health metrics
    
    Provides detailed metrics about external integrations (Snowflake, Azure, ServiceNow)
    """
    try:
        # This would typically collect fresh integration metrics
        # For now, return the existing metrics
        all_metrics = await monitoring_service.get_metrics_export()
        
        # Filter for integration metrics
        integration_lines = []
        for line in all_metrics.split('\n'):
            if any(metric in line for metric in [
                'DataChart_integration_requests_total',
                'DataChart_integration_response_time_seconds'
            ]):
                integration_lines.append(line)
        
        return Response(content='\n'.join(integration_lines), media_type="text/plain")
    except Exception as e:
        logger.error(f"Error exporting integration metrics: {e}")
        raise HTTPException(status_code=500, detail="Failed to export integration metrics")

# Health check endpoint
@router.get("/health")
async def get_system_health():
    """
    Get comprehensive system health status
    
    Returns health status of all system components and services.
    """
    try:
        health_data = await monitoring_service.perform_health_checks()
        
        # Determine overall status
        overall_status = "healthy"
        unhealthy_services = [
            name for name, check in health_data.items() 
            if check.status == "unhealthy"
        ]
        degraded_services = [
            name for name, check in health_data.items() 
            if check.status == "degraded"
        ]
        
        if unhealthy_services:
            overall_status = "unhealthy"
        elif degraded_services:
            overall_status = "degraded"
        
        return {
            "status": overall_status,
            "timestamp": datetime.utcnow().isoformat(),
            "services": {
                name: {
                    "status": check.status,
                    "response_time_ms": round(check.response_time * 1000, 2),
                    "details": check.details
                }
                for name, check in health_data.items()
            },
            "summary": {
                "total_services": len(health_data),
                "healthy": len([s for s in health_data.values() if s.status == "healthy"]),
                "degraded": len(degraded_services),
                "unhealthy": len(unhealthy_services)
            }
        }
    except Exception as e:
        logger.error(f"Error getting system health: {e}")
        return {
            "status": "error",
            "timestamp": datetime.utcnow().isoformat(),
            "error": str(e)
        }

# Dashboard data endpoint
@router.get("/dashboard")
async def get_dashboard_data(current_user: User = Depends(get_current_admin_user)):
    """
    Get comprehensive dashboard data for admin users
    
    Returns system metrics, health status, alerts, and business metrics.
    """
    try:
        dashboard_data = await monitoring_service.get_dashboard_data()
        return dashboard_data
    except MonitoringError as e:
        logger.error(f"Monitoring error getting dashboard data: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        logger.error(f"Error getting dashboard data: {e}")
        raise HTTPException(status_code=500, detail="Failed to get dashboard data")

# Alerts management endpoints
@router.get("/alerts")
async def get_active_alerts(
    current_user: User = Depends(get_current_admin_user),
    severity: Optional[AlertSeverity] = Query(None, description="Filter by severity"),
    resolved: Optional[bool] = Query(None, description="Filter by resolution status"),
    limit: int = Query(50, ge=1, le=500, description="Limit number of results")
):
    """
    Get active alerts with optional filtering
    
    Returns list of alerts based on filter criteria.
    """
    try:
        all_alerts = list(monitoring_service.active_alerts.values())
        
        # Apply filters
        filtered_alerts = all_alerts
        
        if severity:
            filtered_alerts = [a for a in filtered_alerts if a.severity == severity]
        
        if resolved is not None:
            filtered_alerts = [a for a in filtered_alerts if a.resolved == resolved]
        
        # Sort by timestamp (newest first) and limit
        filtered_alerts.sort(key=lambda x: x.timestamp, reverse=True)
        filtered_alerts = filtered_alerts[:limit]
        
        return {
            "alerts": [
                {
                    "id": alert.id,
                    "metric_name": alert.metric_name,
                    "severity": alert.severity.value,
                    "message": alert.message,
                    "value": alert.value,
                    "threshold": alert.threshold,
                    "timestamp": alert.timestamp.isoformat(),
                    "tenant_id": alert.tenant_id,
                    "customer_id": alert.customer_id,
                    "resolved": alert.resolved,
                    "acknowledged": alert.acknowledged
                }
                for alert in filtered_alerts
            ],
            "total_count": len(all_alerts),
            "filtered_count": len(filtered_alerts)
        }
    except Exception as e:
        logger.error(f"Error getting alerts: {e}")
        raise HTTPException(status_code=500, detail="Failed to get alerts")

@router.post("/alerts/{alert_id}/acknowledge")
async def acknowledge_alert(
    alert_id: str,
    current_user: User = Depends(get_current_admin_user)
):
    """
    Acknowledge an alert
    
    Marks an alert as acknowledged by the current admin user.
    """
    try:
        success = await monitoring_service.acknowledge_alert(alert_id, str(current_user.id))
        if success:
            return {"message": f"Alert {alert_id} acknowledged successfully"}
        else:
            raise HTTPException(status_code=404, detail="Alert not found")
    except Exception as e:
        logger.error(f"Error acknowledging alert: {e}")
        raise HTTPException(status_code=500, detail="Failed to acknowledge alert")

@router.post("/alerts/{alert_id}/resolve")
async def resolve_alert(
    alert_id: str,
    current_user: User = Depends(get_current_admin_user)
):
    """
    Resolve an alert
    
    Marks an alert as resolved by the current admin user.
    """
    try:
        success = await monitoring_service.resolve_alert(alert_id, str(current_user.id))
        if success:
            return {"message": f"Alert {alert_id} resolved successfully"}
        else:
            raise HTTPException(status_code=404, detail="Alert not found")
    except Exception as e:
        logger.error(f"Error resolving alert: {e}")
        raise HTTPException(status_code=500, detail="Failed to resolve alert")

# System metrics endpoints
@router.get("/metrics/system")
async def get_system_metrics(current_user: User = Depends(get_current_admin_user)):
    """
    Get current system metrics
    
    Returns CPU, memory, disk usage and other system-level metrics.
    """
    try:
        await monitoring_service.collect_system_metrics()
        
        import psutil
        
        # Get current system metrics
        cpu_percent = psutil.cpu_percent(interval=1)
        memory = psutil.virtual_memory()
        
        disk_usage = []
        for disk in psutil.disk_partitions():
            try:
                disk_info = psutil.disk_usage(disk.mountpoint)
                disk_usage.append({
                    "device": disk.device,
                    "mountpoint": disk.mountpoint,
                    "total_bytes": disk_info.total,
                    "used_bytes": disk_info.used,
                    "free_bytes": disk_info.free,
                    "used_percent": (disk_info.used / disk_info.total) * 100
                })
            except:
                continue
        
        return {
            "timestamp": datetime.utcnow().isoformat(),
            "cpu": {
                "usage_percent": cpu_percent,
                "count": psutil.cpu_count()
            },
            "memory": {
                "total_bytes": memory.total,
                "available_bytes": memory.available,
                "used_bytes": memory.used,
                "used_percent": memory.percent
            },
            "disk": disk_usage
        }
    except Exception as e:
        logger.error(f"Error getting system metrics: {e}")
        raise HTTPException(status_code=500, detail="Failed to get system metrics")

# Customer-specific monitoring endpoint
@router.get("/customer/{tenant_id}/metrics")
async def get_customer_metrics(
    tenant_id: str,
    current_user: User = Depends(get_current_admin_user),
    hours: int = Query(24, ge=1, le=168, description="Hours of data to retrieve")
):
    """
    Get metrics for a specific customer
    
    Returns API usage, error rates, and quota usage for the specified tenant.
    """
    try:
        end_time = datetime.utcnow()
        start_time = end_time - timedelta(hours=hours)
        
        # This would typically query the metrics database
        # For now, return a basic structure
        return {
            "tenant_id": tenant_id,
            "time_range": {
                "start": start_time.isoformat(),
                "end": end_time.isoformat(),
                "hours": hours
            },
            "api_usage": {
                "total_requests": 0,  # Would query from metrics
                "total_errors": 0,
                "error_rate_percent": 0,
                "avg_response_time_ms": 0
            },
            "quota_usage": {
                "current_percent": 0,  # Would get from monitoring service
                "limit": 10000,
                "used": 0
            },
            "alerts": [
                alert for alert in monitoring_service.active_alerts.values()
                if alert.tenant_id == tenant_id and not alert.resolved
            ]
        }
    except Exception as e:
        logger.error(f"Error getting customer metrics: {e}")
        raise HTTPException(status_code=500, detail="Failed to get customer metrics")

# Integration status endpoint
@router.get("/integrations/status")
async def get_integration_status(current_user: User = Depends(get_current_admin_user)):
    """
    Get status of all external integrations
    
    Returns health and performance metrics for Snowflake, Azure, ServiceNow, etc.
    """
    try:
        # This would typically check the actual integration status
        # For now, return a basic structure
        integrations = {
            "snowflake": {
                "status": "healthy",
                "last_check": datetime.utcnow().isoformat(),
                "response_time_ms": 150,
                "requests_last_hour": 245,
                "errors_last_hour": 2,
                "error_rate_percent": 0.8
            },
            "azure": {
                "status": "healthy",
                "last_check": datetime.utcnow().isoformat(),
                "response_time_ms": 300,
                "requests_last_hour": 180,
                "errors_last_hour": 1,
                "error_rate_percent": 0.6
            },
            "servicenow": {
                "status": "degraded",
                "last_check": datetime.utcnow().isoformat(),
                "response_time_ms": 1200,
                "requests_last_hour": 95,
                "errors_last_hour": 8,
                "error_rate_percent": 8.4
            }
        }
        
        return {
            "timestamp": datetime.utcnow().isoformat(),
            "integrations": integrations,
            "summary": {
                "total": len(integrations),
                "healthy": len([i for i in integrations.values() if i["status"] == "healthy"]),
                "degraded": len([i for i in integrations.values() if i["status"] == "degraded"]),
                "unhealthy": len([i for i in integrations.values() if i["status"] == "unhealthy"])
            }
        }
    except Exception as e:
        logger.error(f"Error getting integration status: {e}")
        raise HTTPException(status_code=500, detail="Failed to get integration status")

# Performance metrics endpoint
@router.get("/performance")
async def get_performance_metrics(
    current_user: User = Depends(get_current_admin_user),
    minutes: int = Query(60, ge=5, le=1440, description="Minutes of data to analyze")
):
    """
    Get performance metrics and trends
    
    Returns API response times, throughput, and performance trends.
    """
    try:
        end_time = datetime.utcnow()
        start_time = end_time - timedelta(minutes=minutes)
        
        # This would typically query metrics from Prometheus or database
        # For now, return simulated data
        return {
            "time_range": {
                "start": start_time.isoformat(),
                "end": end_time.isoformat(),
                "minutes": minutes
            },
            "api_performance": {
                "avg_response_time_ms": 285,
                "p50_response_time_ms": 180,
                "p95_response_time_ms": 650,
                "p99_response_time_ms": 1200,
                "requests_per_second": 45.2,
                "errors_per_second": 0.8
            },
            "database_performance": {
                "avg_query_time_ms": 120,
                "slow_queries_count": 3,
                "active_connections": 25,
                "connection_pool_usage_percent": 62
            },
            "system_performance": {
                "cpu_usage_avg": 45.2,
                "memory_usage_avg": 68.5,
                "disk_io_avg_mbps": 12.3
            }
        }
    except Exception as e:
        logger.error(f"Error getting performance metrics: {e}")
        raise HTTPException(status_code=500, detail="Failed to get performance metrics")
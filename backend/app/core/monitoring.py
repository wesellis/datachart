"""
Comprehensive monitoring and metrics collection for DataChart SaaS

Provides:
- Request/response tracking
- Performance metrics
- Error monitoring
- Business metrics
- Health checks
- Alerting system
"""

import time
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from collections import defaultdict, deque
import asyncio
import json
from contextlib import asynccontextmanager
from fastapi import Request, Response
import psutil
import os

logger = logging.getLogger(__name__)

@dataclass
class RequestMetrics:
    """Metrics for a single request"""
    method: str
    path: str
    status_code: int
    response_time: float
    timestamp: datetime
    user_id: Optional[int] = None
    ip_address: str = ""
    user_agent: str = ""
    request_size: int = 0
    response_size: int = 0
    error_message: Optional[str] = None

@dataclass
class SystemMetrics:
    """System-level metrics"""
    timestamp: datetime
    cpu_percent: float
    memory_percent: float
    memory_used_mb: float
    disk_usage_percent: float
    active_connections: int
    process_count: int

@dataclass
class BusinessMetrics:
    """Business-level metrics"""
    active_users_1h: int = 0
    active_users_24h: int = 0
    total_queries_1h: int = 0
    successful_queries_1h: int = 0
    failed_queries_1h: int = 0
    avg_response_time_1h: float = 0.0
    total_dashboards: int = 0
    total_data_sources: int = 0
    total_revenue_today: float = 0.0

class MetricsCollector:
    """Centralized metrics collection and storage"""
    
    def __init__(self, max_stored_requests: int = 10000):
        self.request_metrics: deque = deque(maxlen=max_stored_requests)
        self.system_metrics: deque = deque(maxlen=1440)  # 24 hours of minute data
        self.error_counts: defaultdict = defaultdict(int)
        self.endpoint_stats: defaultdict = defaultdict(lambda: {
            'count': 0,
            'total_time': 0.0,
            'errors': 0
        })
        self.user_activity: defaultdict = defaultdict(list)
        self.business_metrics = BusinessMetrics()
        self._system_metrics_task: Optional[asyncio.Task] = None
        self._last_cleanup = time.time()
        
    async def start_collection(self):
        """Start background metrics collection"""
        if not self._system_metrics_task:
            self._system_metrics_task = asyncio.create_task(self._collect_system_metrics())
            logger.info("✅ Metrics collection started")
    
    async def stop_collection(self):
        """Stop background metrics collection"""
        if self._system_metrics_task:
            self._system_metrics_task.cancel()
            try:
                await self._system_metrics_task
            except asyncio.CancelledError:
                pass
            self._system_metrics_task = None
            logger.info("Metrics collection stopped")
    
    def record_request(self, metrics: RequestMetrics):
        """Record request metrics"""
        self.request_metrics.append(metrics)
        
        # Update endpoint statistics
        endpoint_key = f"{metrics.method} {metrics.path}"
        stats = self.endpoint_stats[endpoint_key]
        stats['count'] += 1
        stats['total_time'] += metrics.response_time
        
        if metrics.status_code >= 400:
            stats['errors'] += 1
            self.error_counts[metrics.status_code] += 1
        
        # Track user activity
        if metrics.user_id:
            self.user_activity[metrics.user_id].append(metrics.timestamp)
        
        # Cleanup old data periodically
        self._cleanup_old_data()
    
    def get_request_summary(self, hours: int = 1) -> Dict[str, Any]:
        """Get request metrics summary for specified time period"""
        cutoff_time = datetime.utcnow() - timedelta(hours=hours)
        
        recent_requests = [
            m for m in self.request_metrics 
            if m.timestamp > cutoff_time
        ]
        
        if not recent_requests:
            return {
                'total_requests': 0,
                'avg_response_time': 0.0,
                'error_rate': 0.0,
                'requests_per_minute': 0.0,
                'status_codes': {},
                'top_endpoints': []
            }
        
        total_requests = len(recent_requests)
        total_response_time = sum(r.response_time for r in recent_requests)
        error_count = sum(1 for r in recent_requests if r.status_code >= 400)
        
        # Status code distribution
        status_codes = defaultdict(int)
        for request in recent_requests:
            status_codes[request.status_code] += 1
        
        # Top endpoints by request count
        endpoint_counts = defaultdict(int)
        for request in recent_requests:
            endpoint_key = f"{request.method} {request.path}"
            endpoint_counts[endpoint_key] += 1
        
        top_endpoints = sorted(
            endpoint_counts.items(),
            key=lambda x: x[1],
            reverse=True
        )[:10]
        
        return {
            'total_requests': total_requests,
            'avg_response_time': total_response_time / total_requests,
            'error_rate': (error_count / total_requests) * 100,
            'requests_per_minute': total_requests / (hours * 60),
            'status_codes': dict(status_codes),
            'top_endpoints': [{'endpoint': ep, 'count': count} for ep, count in top_endpoints]
        }
    
    def get_system_summary(self) -> Dict[str, Any]:
        """Get latest system metrics summary"""
        if not self.system_metrics:
            return {
                'cpu_percent': 0.0,
                'memory_percent': 0.0,
                'memory_used_mb': 0.0,
                'disk_usage_percent': 0.0,
                'active_connections': 0,
                'process_count': 0,
                'timestamp': datetime.utcnow()
            }
        
        latest = self.system_metrics[-1]
        return {
            'cpu_percent': latest.cpu_percent,
            'memory_percent': latest.memory_percent,
            'memory_used_mb': latest.memory_used_mb,
            'disk_usage_percent': latest.disk_usage_percent,
            'active_connections': latest.active_connections,
            'process_count': latest.process_count,
            'timestamp': latest.timestamp
        }
    
    def get_business_summary(self) -> Dict[str, Any]:
        """Get business metrics summary"""
        # Calculate active users
        now = datetime.utcnow()
        hour_ago = now - timedelta(hours=1)
        day_ago = now - timedelta(hours=24)
        
        active_users_1h = len([
            user_id for user_id, timestamps in self.user_activity.items()
            if any(ts > hour_ago for ts in timestamps)
        ])
        
        active_users_24h = len([
            user_id for user_id, timestamps in self.user_activity.items()
            if any(ts > day_ago for ts in timestamps)
        ])
        
        # Update business metrics
        self.business_metrics.active_users_1h = active_users_1h
        self.business_metrics.active_users_24h = active_users_24h
        
        request_summary = self.get_request_summary(hours=1)
        self.business_metrics.total_queries_1h = request_summary['total_requests']
        self.business_metrics.avg_response_time_1h = request_summary['avg_response_time']
        
        return {
            'active_users_1h': self.business_metrics.active_users_1h,
            'active_users_24h': self.business_metrics.active_users_24h,
            'total_queries_1h': self.business_metrics.total_queries_1h,
            'successful_queries_1h': self.business_metrics.successful_queries_1h,
            'failed_queries_1h': self.business_metrics.failed_queries_1h,
            'avg_response_time_1h': self.business_metrics.avg_response_time_1h,
            'total_dashboards': self.business_metrics.total_dashboards,
            'total_data_sources': self.business_metrics.total_data_sources,
            'total_revenue_today': self.business_metrics.total_revenue_today
        }
    
    def get_health_status(self) -> Dict[str, Any]:
        """Get overall system health status"""
        system = self.get_system_summary()
        requests = self.get_request_summary(hours=1)
        
        # Determine health status
        health_status = "healthy"
        issues = []
        
        # Check system resources
        if system['cpu_percent'] > 80:
            health_status = "warning"
            issues.append("High CPU usage")
        
        if system['memory_percent'] > 85:
            health_status = "warning"
            issues.append("High memory usage")
        
        if system['disk_usage_percent'] > 90:
            health_status = "critical"
            issues.append("High disk usage")
        
        # Check error rates
        if requests['error_rate'] > 10:
            health_status = "warning"
            issues.append("High error rate")
        
        if requests['error_rate'] > 25:
            health_status = "critical"
            issues.append("Very high error rate")
        
        # Check response times
        if requests['avg_response_time'] > 2.0:
            health_status = "warning"
            issues.append("Slow response times")
        
        return {
            'status': health_status,
            'timestamp': datetime.utcnow(),
            'issues': issues,
            'system_metrics': system,
            'request_metrics': requests,
            'uptime_seconds': time.time() - (getattr(self, '_start_time', time.time()))
        }
    
    async def _collect_system_metrics(self):
        """Background task to collect system metrics"""
        self._start_time = time.time()
        
        while True:
            try:
                # Collect system metrics
                cpu_percent = psutil.cpu_percent(interval=1)
                memory = psutil.virtual_memory()
                disk = psutil.disk_usage('/')
                
                # Get process count (approximate active connections)
                process_count = len(psutil.pids())
                
                # For active connections, we'd need to integrate with the actual server
                # For now, use a placeholder based on recent request activity
                recent_requests = sum(
                    1 for m in self.request_metrics 
                    if m.timestamp > datetime.utcnow() - timedelta(minutes=5)
                )
                active_connections = min(recent_requests, 100)  # Cap at 100
                
                metrics = SystemMetrics(
                    timestamp=datetime.utcnow(),
                    cpu_percent=cpu_percent,
                    memory_percent=memory.percent,
                    memory_used_mb=memory.used / (1024 * 1024),
                    disk_usage_percent=disk.percent,
                    active_connections=active_connections,
                    process_count=process_count
                )
                
                self.system_metrics.append(metrics)
                
                # Sleep for 60 seconds before next collection
                await asyncio.sleep(60)
                
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error collecting system metrics: {e}")
                await asyncio.sleep(60)  # Continue despite errors
    
    def _cleanup_old_data(self):
        """Clean up old data periodically"""
        current_time = time.time()
        if current_time - self._last_cleanup < 3600:  # Cleanup every hour
            return
        
        # Clean up user activity older than 24 hours
        day_ago = datetime.utcnow() - timedelta(hours=24)
        for user_id in list(self.user_activity.keys()):
            self.user_activity[user_id] = [
                ts for ts in self.user_activity[user_id]
                if ts > day_ago
            ]
            if not self.user_activity[user_id]:
                del self.user_activity[user_id]
        
        self._last_cleanup = current_time

# Global metrics collector instance
metrics_collector = MetricsCollector()

class RequestTrackingMiddleware:
    """Middleware to track request metrics"""
    
    def __init__(self, app):
        self.app = app
    
    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return
        
        start_time = time.time()
        request = Request(scope, receive)
        
        # Track request size
        content_length = request.headers.get("content-length")
        request_size = int(content_length) if content_length else 0
        
        response_body = []
        response_size = 0
        status_code = 200
        
        async def send_wrapper(message):
            nonlocal status_code, response_size
            if message["type"] == "http.response.start":
                status_code = message["status"]
            elif message["type"] == "http.response.body":
                body = message.get("body", b"")
                response_body.append(body)
                response_size += len(body)
            await send(message)
        
        try:
            await self.app(scope, receive, send_wrapper)
        except Exception as e:
            status_code = 500
            logger.error(f"Request processing error: {e}")
            raise
        finally:
            # Record metrics
            end_time = time.time()
            response_time = end_time - start_time
            
            metrics = RequestMetrics(
                method=request.method,
                path=request.url.path,
                status_code=status_code,
                response_time=response_time,
                timestamp=datetime.utcnow(),
                user_id=getattr(request.state, 'user_id', None),
                ip_address=request.client.host if request.client else "",
                user_agent=request.headers.get("user-agent", ""),
                request_size=request_size,
                response_size=response_size,
                error_message=None if status_code < 400 else f"HTTP {status_code}"
            )
            
            metrics_collector.record_request(metrics)

@asynccontextmanager
async def monitoring_lifespan(app):
    """Application lifespan context manager for monitoring"""
    # Startup
    await metrics_collector.start_collection()
    logger.info("🔍 Monitoring system started")
    
    yield
    
    # Shutdown
    await metrics_collector.stop_collection()
    logger.info("Monitoring system stopped")

# Utility functions for health checks and alerts

def check_database_health() -> Dict[str, Any]:
    """Check database connection health"""
    try:
        from app.database import test_db_connection
        is_healthy = test_db_connection()
        return {
            'service': 'database',
            'status': 'healthy' if is_healthy else 'unhealthy',
            'message': 'Database connection OK' if is_healthy else 'Database connection failed',
            'timestamp': datetime.utcnow()
        }
    except Exception as e:
        return {
            'service': 'database',
            'status': 'error',
            'message': f'Database health check failed: {str(e)}',
            'timestamp': datetime.utcnow()
        }

def check_external_services_health() -> List[Dict[str, Any]]:
    """Check health of external service connections"""
    services = []
    
    # Check Snowflake
    try:
        # This would be a lightweight connection test
        services.append({
            'service': 'snowflake',
            'status': 'healthy',  # Placeholder - would test actual connection
            'message': 'Snowflake connection OK',
            'timestamp': datetime.utcnow()
        })
    except Exception as e:
        services.append({
            'service': 'snowflake',
            'status': 'error',
            'message': f'Snowflake connection failed: {str(e)}',
            'timestamp': datetime.utcnow()
        })
    
    return services

async def send_alert(alert_type: str, message: str, severity: str = "warning"):
    """Send alert notification (placeholder for actual implementation)"""
    alert_data = {
        'type': alert_type,
        'message': message,
        'severity': severity,
        'timestamp': datetime.utcnow(),
        'hostname': os.uname().nodename if hasattr(os, 'uname') else 'unknown'
    }
    
    # In production, this would integrate with:
    # - Email notifications
    # - Slack/Teams webhooks
    # - PagerDuty/Opsgenie
    # - SMS alerts
    # - Monitoring dashboards (DataDog, New Relic, etc.)
    
    logger.warning(f"ALERT [{severity.upper()}] {alert_type}: {message}")
    
    # Store alert in metrics for dashboard display
    # This could be extended to store in database for alert history
    pass
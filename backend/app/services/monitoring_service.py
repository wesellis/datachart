# DataChart SaaS - Monitoring Service
# Enterprise monitoring and alerting system with metrics collection

import asyncio
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Union
import logging
from dataclasses import dataclass
from enum import Enum
import json
import aiohttp
import psutil
import platform
from prometheus_client import Counter, Histogram, Gauge, CollectorRegistry, generate_latest
from sqlalchemy import func, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_async_session
from app.models.customer import Customer
from app.models.api_usage import APIUsage
from app.core.security import encrypt_data, decrypt_data
from app.core.exceptions import MonitoringError, AlertingError

logger = logging.getLogger(__name__)

class AlertSeverity(Enum):
    """Alert severity levels"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class MetricType(Enum):
    """Types of metrics we collect"""
    COUNTER = "counter"
    GAUGE = "gauge"
    HISTOGRAM = "histogram"
    SUMMARY = "summary"

@dataclass
class Alert:
    """Alert data structure"""
    id: str
    metric_name: str
    severity: AlertSeverity
    message: str
    value: float
    threshold: float
    timestamp: datetime
    tenant_id: Optional[str] = None
    customer_id: Optional[str] = None
    resolved: bool = False
    acknowledged: bool = False

@dataclass
class HealthCheck:
    """Health check result"""
    service: str
    status: str  # healthy, unhealthy, degraded
    response_time: float
    details: Dict[str, Any]
    timestamp: datetime

@dataclass
class MetricDefinition:
    """Metric definition"""
    name: str
    type: MetricType
    description: str
    labels: List[str]
    thresholds: Dict[AlertSeverity, float]

class MonitoringService:
    """
    Enterprise monitoring service with metrics collection, alerting, and health checks
    """
    
    def __init__(self):
        self.registry = CollectorRegistry()
        self.metrics = {}
        self.active_alerts = {}
        self.health_checks = {}
        self.alert_handlers = []
        
        # Initialize core metrics
        self._initialize_metrics()
        
        # Health check URLs
        self.health_endpoints = {
            'database': 'postgresql://localhost:5432',
            'redis': 'redis://localhost:6379',
            'elasticsearch': 'http://localhost:9200/_cluster/health',
            'backend_api': 'http://localhost:8000/health',
            'frontend': 'http://localhost:80/health'
        }
        
        # Alert thresholds
        self.alert_thresholds = {
            'api_response_time': {
                AlertSeverity.MEDIUM: 2.0,
                AlertSeverity.HIGH: 5.0,
                AlertSeverity.CRITICAL: 10.0
            },
            'error_rate': {
                AlertSeverity.MEDIUM: 0.05,  # 5%
                AlertSeverity.HIGH: 0.10,   # 10%
                AlertSeverity.CRITICAL: 0.20  # 20%
            },
            'cpu_usage': {
                AlertSeverity.MEDIUM: 70.0,
                AlertSeverity.HIGH: 85.0,
                AlertSeverity.CRITICAL: 95.0
            },
            'memory_usage': {
                AlertSeverity.MEDIUM: 75.0,
                AlertSeverity.HIGH: 85.0,
                AlertSeverity.CRITICAL: 95.0
            },
            'disk_usage': {
                AlertSeverity.MEDIUM: 80.0,
                AlertSeverity.HIGH: 90.0,
                AlertSeverity.CRITICAL: 95.0
            }
        }
    
    def _initialize_metrics(self):
        """Initialize Prometheus metrics"""
        
        # API Metrics
        self.metrics['api_requests_total'] = Counter(
            'DataChart_api_requests_total',
            'Total API requests',
            ['method', 'endpoint', 'status_code', 'tenant_id'],
            registry=self.registry
        )
        
        self.metrics['api_request_duration'] = Histogram(
            'DataChart_api_request_duration_seconds',
            'API request duration',
            ['method', 'endpoint', 'tenant_id'],
            registry=self.registry
        )
        
        self.metrics['api_errors_total'] = Counter(
            'DataChart_api_errors_total',
            'Total API errors',
            ['method', 'endpoint', 'error_type', 'tenant_id'],
            registry=self.registry
        )
        
        # System Metrics
        self.metrics['cpu_usage'] = Gauge(
            'DataChart_cpu_usage_percent',
            'CPU usage percentage',
            registry=self.registry
        )
        
        self.metrics['memory_usage'] = Gauge(
            'DataChart_memory_usage_percent',
            'Memory usage percentage',
            registry=self.registry
        )
        
        self.metrics['disk_usage'] = Gauge(
            'DataChart_disk_usage_percent',
            'Disk usage percentage',
            ['device'],
            registry=self.registry
        )
        
        # Database Metrics
        self.metrics['db_connections_active'] = Gauge(
            'DataChart_db_connections_active',
            'Active database connections',
            registry=self.registry
        )
        
        self.metrics['db_query_duration'] = Histogram(
            'DataChart_db_query_duration_seconds',
            'Database query duration',
            ['operation', 'table'],
            registry=self.registry
        )
        
        # Business Metrics
        self.metrics['active_customers'] = Gauge(
            'DataChart_active_customers_total',
            'Total active customers',
            registry=self.registry
        )
        
        self.metrics['monthly_recurring_revenue'] = Gauge(
            'DataChart_monthly_recurring_revenue_dollars',
            'Monthly recurring revenue in dollars',
            registry=self.registry
        )
        
        self.metrics['api_quota_usage'] = Gauge(
            'DataChart_api_quota_usage_percent',
            'API quota usage percentage',
            ['tenant_id', 'endpoint'],
            registry=self.registry
        )
        
        # Integration Metrics
        self.metrics['integration_requests'] = Counter(
            'DataChart_integration_requests_total',
            'Total integration requests',
            ['integration', 'operation', 'status'],
            registry=self.registry
        )
        
        self.metrics['integration_response_time'] = Histogram(
            'DataChart_integration_response_time_seconds',
            'Integration response time',
            ['integration', 'operation'],
            registry=self.registry
        )
    
    async def record_api_request(self, method: str, endpoint: str, status_code: int, 
                               duration: float, tenant_id: str = None, error_type: str = None):
        """Record API request metrics"""
        try:
            tenant_label = tenant_id or 'unknown'
            
            # Record request count
            self.metrics['api_requests_total'].labels(
                method=method,
                endpoint=endpoint,
                status_code=str(status_code),
                tenant_id=tenant_label
            ).inc()
            
            # Record duration
            self.metrics['api_request_duration'].labels(
                method=method,
                endpoint=endpoint,
                tenant_id=tenant_label
            ).observe(duration)
            
            # Record errors if applicable
            if status_code >= 400:
                self.metrics['api_errors_total'].labels(
                    method=method,
                    endpoint=endpoint,
                    error_type=error_type or 'unknown',
                    tenant_id=tenant_label
                ).inc()
                
                # Check for error rate alert
                await self._check_error_rate_alert(endpoint, tenant_id)
            
            # Check for response time alert
            if duration > self.alert_thresholds['api_response_time'][AlertSeverity.MEDIUM]:
                await self._create_alert(
                    'api_response_time',
                    f'High API response time for {endpoint}',
                    duration,
                    self.alert_thresholds['api_response_time'],
                    tenant_id=tenant_id
                )
                
        except Exception as e:
            logger.error(f"Error recording API metrics: {e}")
    
    async def record_integration_request(self, integration: str, operation: str, 
                                       status: str, duration: float):
        """Record integration request metrics"""
        try:
            # Record request count
            self.metrics['integration_requests'].labels(
                integration=integration,
                operation=operation,
                status=status
            ).inc()
            
            # Record response time
            self.metrics['integration_response_time'].labels(
                integration=integration,
                operation=operation
            ).observe(duration)
            
        except Exception as e:
            logger.error(f"Error recording integration metrics: {e}")
    
    async def collect_system_metrics(self):
        """Collect system-level metrics"""
        try:
            # CPU Usage
            cpu_percent = psutil.cpu_percent(interval=1)
            self.metrics['cpu_usage'].set(cpu_percent)
            
            # Check CPU alert
            if cpu_percent > self.alert_thresholds['cpu_usage'][AlertSeverity.MEDIUM]:
                await self._create_alert(
                    'cpu_usage',
                    f'High CPU usage: {cpu_percent:.1f}%',
                    cpu_percent,
                    self.alert_thresholds['cpu_usage']
                )
            
            # Memory Usage
            memory = psutil.virtual_memory()
            memory_percent = memory.percent
            self.metrics['memory_usage'].set(memory_percent)
            
            # Check memory alert
            if memory_percent > self.alert_thresholds['memory_usage'][AlertSeverity.MEDIUM]:
                await self._create_alert(
                    'memory_usage',
                    f'High memory usage: {memory_percent:.1f}%',
                    memory_percent,
                    self.alert_thresholds['memory_usage']
                )
            
            # Disk Usage
            for disk in psutil.disk_partitions():
                try:
                    disk_usage = psutil.disk_usage(disk.mountpoint)
                    disk_percent = (disk_usage.used / disk_usage.total) * 100
                    self.metrics['disk_usage'].labels(device=disk.device).set(disk_percent)
                    
                    # Check disk alert
                    if disk_percent > self.alert_thresholds['disk_usage'][AlertSeverity.MEDIUM]:
                        await self._create_alert(
                            'disk_usage',
                            f'High disk usage on {disk.device}: {disk_percent:.1f}%',
                            disk_percent,
                            self.alert_thresholds['disk_usage']
                        )
                except:
                    continue
            
        except Exception as e:
            logger.error(f"Error collecting system metrics: {e}")
    
    async def collect_database_metrics(self):
        """Collect database metrics"""
        try:
            async with get_async_session() as session:
                # Active connections
                result = await session.execute(
                    text("SELECT count(*) FROM pg_stat_activity WHERE state = 'active'")
                )
                active_connections = result.scalar()
                self.metrics['db_connections_active'].set(active_connections)
                
                # Active customers
                result = await session.execute(
                    text("SELECT count(*) FROM customers WHERE is_active = true")
                )
                active_customers = result.scalar()
                self.metrics['active_customers'].set(active_customers)
                
        except Exception as e:
            logger.error(f"Error collecting database metrics: {e}")
    
    async def collect_business_metrics(self):
        """Collect business metrics"""
        try:
            async with get_async_session() as session:
                # Monthly Recurring Revenue
                result = await session.execute(
                    text("""
                        SELECT COALESCE(SUM(
                            CASE 
                                WHEN billing_cycle = 'monthly' THEN subscription_amount
                                WHEN billing_cycle = 'annually' THEN subscription_amount / 12
                            END
                        ), 0) as mrr
                        FROM customers 
                        WHERE is_active = true AND subscription_status = 'active'
                    """)
                )
                mrr = float(result.scalar() or 0)
                self.metrics['monthly_recurring_revenue'].set(mrr)
                
        except Exception as e:
            logger.error(f"Error collecting business metrics: {e}")
    
    async def perform_health_checks(self) -> Dict[str, HealthCheck]:
        """Perform health checks on all services"""
        health_results = {}
        
        for service, endpoint in self.health_endpoints.items():
            try:
                start_time = time.time()
                
                if service == 'database':
                    health_result = await self._check_database_health()
                elif service == 'redis':
                    health_result = await self._check_redis_health()
                else:
                    health_result = await self._check_http_health(endpoint)
                
                response_time = time.time() - start_time
                
                health_check = HealthCheck(
                    service=service,
                    status=health_result['status'],
                    response_time=response_time,
                    details=health_result.get('details', {}),
                    timestamp=datetime.utcnow()
                )
                
                health_results[service] = health_check
                self.health_checks[service] = health_check
                
                # Create alerts for unhealthy services
                if health_result['status'] != 'healthy':
                    await self._create_alert(
                        f'{service}_health',
                        f'Service {service} is {health_result["status"]}',
                        0,
                        {AlertSeverity.CRITICAL: 0},
                        severity=AlertSeverity.CRITICAL if health_result['status'] == 'unhealthy' else AlertSeverity.HIGH
                    )
                
            except Exception as e:
                logger.error(f"Health check failed for {service}: {e}")
                health_check = HealthCheck(
                    service=service,
                    status='unhealthy',
                    response_time=0,
                    details={'error': str(e)},
                    timestamp=datetime.utcnow()
                )
                health_results[service] = health_check
                self.health_checks[service] = health_check
        
        return health_results
    
    async def _check_database_health(self) -> Dict[str, Any]:
        """Check database health"""
        try:
            async with get_async_session() as session:
                result = await session.execute(text("SELECT 1"))
                if result.scalar() == 1:
                    # Check for slow queries
                    slow_queries = await session.execute(
                        text("SELECT count(*) FROM pg_stat_activity WHERE state = 'active' AND query_start < NOW() - INTERVAL '30 seconds'")
                    )
                    slow_count = slow_queries.scalar()
                    
                    return {
                        'status': 'healthy' if slow_count < 5 else 'degraded',
                        'details': {'slow_queries': slow_count}
                    }
        except Exception as e:
            return {'status': 'unhealthy', 'details': {'error': str(e)}}
    
    async def _check_redis_health(self) -> Dict[str, Any]:
        """Check Redis health"""
        try:
            import aioredis
            redis = aioredis.from_url("redis://localhost:6379")
            await redis.ping()
            info = await redis.info()
            await redis.close()
            
            return {
                'status': 'healthy',
                'details': {
                    'connected_clients': info.get('connected_clients', 0),
                    'used_memory_human': info.get('used_memory_human', '0B')
                }
            }
        except Exception as e:
            return {'status': 'unhealthy', 'details': {'error': str(e)}}
    
    async def _check_http_health(self, url: str) -> Dict[str, Any]:
        """Check HTTP endpoint health"""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(url, timeout=aiohttp.ClientTimeout(total=10)) as response:
                    if response.status == 200:
                        return {'status': 'healthy', 'details': {'status_code': response.status}}
                    else:
                        return {'status': 'degraded', 'details': {'status_code': response.status}}
        except Exception as e:
            return {'status': 'unhealthy', 'details': {'error': str(e)}}
    
    async def _create_alert(self, metric_name: str, message: str, value: float, 
                          thresholds: Dict[AlertSeverity, float], 
                          tenant_id: str = None, customer_id: str = None,
                          severity: AlertSeverity = None):
        """Create an alert"""
        try:
            # Determine severity if not provided
            if severity is None:
                severity = AlertSeverity.LOW
                for sev, threshold in thresholds.items():
                    if value >= threshold:
                        severity = sev
            
            alert_id = f"{metric_name}_{int(time.time())}"
            
            # Check if similar alert already exists and is not resolved
            existing_alert_key = f"{metric_name}_{tenant_id or 'global'}"
            if existing_alert_key in self.active_alerts:
                existing = self.active_alerts[existing_alert_key]
                if not existing.resolved and existing.severity == severity:
                    return  # Don't create duplicate alerts
            
            alert = Alert(
                id=alert_id,
                metric_name=metric_name,
                severity=severity,
                message=message,
                value=value,
                threshold=thresholds.get(severity, 0),
                timestamp=datetime.utcnow(),
                tenant_id=tenant_id,
                customer_id=customer_id
            )
            
            self.active_alerts[existing_alert_key] = alert
            
            # Send alert notifications
            await self._send_alert_notifications(alert)
            
            logger.warning(f"Alert created: {alert.message}")
            
        except Exception as e:
            logger.error(f"Error creating alert: {e}")
    
    async def _check_error_rate_alert(self, endpoint: str, tenant_id: str = None):
        """Check if error rate exceeds threshold"""
        try:
            # This would typically query metrics from the last 5 minutes
            # For now, we'll implement a basic version
            current_time = datetime.utcnow()
            five_minutes_ago = current_time - timedelta(minutes=5)
            
            async with get_async_session() as session:
                # Count total requests and errors in the last 5 minutes
                total_requests = await session.execute(
                    text("""
                        SELECT count(*) FROM api_usage 
                        WHERE endpoint = :endpoint 
                        AND (:tenant_id IS NULL OR tenant_id = :tenant_id)
                        AND created_at >= :start_time
                    """),
                    {
                        'endpoint': endpoint,
                        'tenant_id': tenant_id,
                        'start_time': five_minutes_ago
                    }
                )
                total = total_requests.scalar() or 0
                
                error_requests = await session.execute(
                    text("""
                        SELECT count(*) FROM api_usage 
                        WHERE endpoint = :endpoint 
                        AND (:tenant_id IS NULL OR tenant_id = :tenant_id)
                        AND created_at >= :start_time
                        AND status_code >= 400
                    """),
                    {
                        'endpoint': endpoint,
                        'tenant_id': tenant_id,
                        'start_time': five_minutes_ago
                    }
                )
                errors = error_requests.scalar() or 0
                
                if total > 0:
                    error_rate = errors / total
                    if error_rate > self.alert_thresholds['error_rate'][AlertSeverity.MEDIUM]:
                        await self._create_alert(
                            'error_rate',
                            f'High error rate for {endpoint}: {error_rate:.2%}',
                            error_rate,
                            self.alert_thresholds['error_rate'],
                            tenant_id=tenant_id
                        )
                        
        except Exception as e:
            logger.error(f"Error checking error rate: {e}")
    
    async def _send_alert_notifications(self, alert: Alert):
        """Send alert notifications via configured channels"""
        try:
            # Slack notification
            await self._send_slack_notification(alert)
            
            # Email notification for high/critical alerts
            if alert.severity in [AlertSeverity.HIGH, AlertSeverity.CRITICAL]:
                await self._send_email_notification(alert)
            
            # PagerDuty for critical alerts
            if alert.severity == AlertSeverity.CRITICAL:
                await self._send_pagerduty_notification(alert)
                
        except Exception as e:
            logger.error(f"Error sending alert notifications: {e}")
    
    async def _send_slack_notification(self, alert: Alert):
        """Send Slack notification"""
        try:
            webhook_url = "https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK"  # From config
            
            color_map = {
                AlertSeverity.LOW: "#36a64f",
                AlertSeverity.MEDIUM: "#ff9500",
                AlertSeverity.HIGH: "#ff4500",
                AlertSeverity.CRITICAL: "#ff0000"
            }
            
            payload = {
                "username": "DataChart Monitoring",
                "icon_emoji": ":warning:",
                "attachments": [{
                    "color": color_map[alert.severity],
                    "title": f"[{alert.severity.value.upper()}] DataChart Alert",
                    "text": alert.message,
                    "fields": [
                        {"title": "Metric", "value": alert.metric_name, "short": True},
                        {"title": "Value", "value": str(alert.value), "short": True},
                        {"title": "Threshold", "value": str(alert.threshold), "short": True},
                        {"title": "Time", "value": alert.timestamp.strftime("%Y-%m-%d %H:%M:%S UTC"), "short": True}
                    ]
                }]
            }
            
            if alert.tenant_id:
                payload["attachments"][0]["fields"].append({
                    "title": "Tenant", "value": alert.tenant_id, "short": True
                })
            
            async with aiohttp.ClientSession() as session:
                await session.post(webhook_url, json=payload)
                
        except Exception as e:
            logger.error(f"Error sending Slack notification: {e}")
    
    async def _send_email_notification(self, alert: Alert):
        """Send email notification"""
        try:
            # Implementation would use SendGrid or similar
            logger.info(f"Would send email notification for alert: {alert.message}")
        except Exception as e:
            logger.error(f"Error sending email notification: {e}")
    
    async def _send_pagerduty_notification(self, alert: Alert):
        """Send PagerDuty notification"""
        try:
            # Implementation would use PagerDuty API
            logger.info(f"Would send PagerDuty notification for alert: {alert.message}")
        except Exception as e:
            logger.error(f"Error sending PagerDuty notification: {e}")
    
    async def get_metrics_export(self) -> str:
        """Export metrics in Prometheus format"""
        try:
            # Collect latest metrics
            await self.collect_system_metrics()
            await self.collect_database_metrics()
            await self.collect_business_metrics()
            
            # Generate Prometheus format
            return generate_latest(self.registry).decode('utf-8')
        except Exception as e:
            logger.error(f"Error exporting metrics: {e}")
            return ""
    
    async def get_dashboard_data(self) -> Dict[str, Any]:
        """Get comprehensive dashboard data"""
        try:
            # Collect latest data
            health_checks = await self.perform_health_checks()
            
            # System metrics
            cpu_percent = psutil.cpu_percent()
            memory = psutil.virtual_memory()
            
            # Active alerts
            active_alerts = [
                alert for alert in self.active_alerts.values()
                if not alert.resolved
            ]
            
            # API usage stats (last 24 hours)
            async with get_async_session() as session:
                yesterday = datetime.utcnow() - timedelta(days=1)
                
                api_requests = await session.execute(
                    text("SELECT count(*) FROM api_usage WHERE created_at >= :start_time"),
                    {'start_time': yesterday}
                )
                total_requests = api_requests.scalar() or 0
                
                api_errors = await session.execute(
                    text("SELECT count(*) FROM api_usage WHERE created_at >= :start_time AND status_code >= 400"),
                    {'start_time': yesterday}
                )
                total_errors = api_errors.scalar() or 0
                
                error_rate = (total_errors / total_requests * 100) if total_requests > 0 else 0
            
            return {
                'timestamp': datetime.utcnow().isoformat(),
                'health_checks': {
                    service: {
                        'status': check.status,
                        'response_time': check.response_time,
                        'details': check.details
                    }
                    for service, check in health_checks.items()
                },
                'system_metrics': {
                    'cpu_usage': cpu_percent,
                    'memory_usage': memory.percent,
                    'memory_available': memory.available,
                    'disk_usage': psutil.disk_usage('/').percent
                },
                'api_metrics': {
                    'total_requests_24h': total_requests,
                    'total_errors_24h': total_errors,
                    'error_rate_24h': round(error_rate, 2)
                },
                'active_alerts': [
                    {
                        'id': alert.id,
                        'metric': alert.metric_name,
                        'severity': alert.severity.value,
                        'message': alert.message,
                        'timestamp': alert.timestamp.isoformat(),
                        'tenant_id': alert.tenant_id
                    }
                    for alert in active_alerts
                ],
                'alert_summary': {
                    'total': len(active_alerts),
                    'critical': len([a for a in active_alerts if a.severity == AlertSeverity.CRITICAL]),
                    'high': len([a for a in active_alerts if a.severity == AlertSeverity.HIGH]),
                    'medium': len([a for a in active_alerts if a.severity == AlertSeverity.MEDIUM]),
                    'low': len([a for a in active_alerts if a.severity == AlertSeverity.LOW])
                }
            }
            
        except Exception as e:
            logger.error(f"Error getting dashboard data: {e}")
            raise MonitoringError(f"Failed to get dashboard data: {e}")
    
    async def acknowledge_alert(self, alert_id: str, user_id: str) -> bool:
        """Acknowledge an alert"""
        try:
            for alert in self.active_alerts.values():
                if alert.id == alert_id:
                    alert.acknowledged = True
                    logger.info(f"Alert {alert_id} acknowledged by user {user_id}")
                    return True
            return False
        except Exception as e:
            logger.error(f"Error acknowledging alert: {e}")
            return False
    
    async def resolve_alert(self, alert_id: str, user_id: str) -> bool:
        """Resolve an alert"""
        try:
            for key, alert in self.active_alerts.items():
                if alert.id == alert_id:
                    alert.resolved = True
                    logger.info(f"Alert {alert_id} resolved by user {user_id}")
                    return True
            return False
        except Exception as e:
            logger.error(f"Error resolving alert: {e}")
            return False
    
    async def start_monitoring_loop(self):
        """Start the continuous monitoring loop"""
        logger.info("Starting monitoring loop...")
        
        while True:
            try:
                # Collect metrics every 30 seconds
                await self.collect_system_metrics()
                await self.collect_database_metrics()
                await self.collect_business_metrics()
                
                # Health checks every 5 minutes
                if int(time.time()) % 300 == 0:  # Every 5 minutes
                    await self.perform_health_checks()
                
                await asyncio.sleep(30)
                
            except Exception as e:
                logger.error(f"Error in monitoring loop: {e}")
                await asyncio.sleep(60)  # Wait longer on error

# Global monitoring instance
monitoring_service = MonitoringService()

# Middleware for automatic request tracking
class MonitoringMiddleware:
    """Middleware to automatically track API requests"""
    
    def __init__(self, app):
        self.app = app
    
    async def __call__(self, scope, receive, send):
        if scope["type"] == "http":
            start_time = time.time()
            
            # Extract request info
            method = scope.get("method", "")
            path = scope.get("path", "")
            
            # Create a wrapper to capture response
            async def send_wrapper(message):
                if message["type"] == "http.response.start":
                    status_code = message.get("status", 0)
                    duration = time.time() - start_time
                    
                    # Extract tenant ID from headers if available
                    tenant_id = None
                    for name, value in scope.get("headers", []):
                        if name.lower() == b"x-tenant-id":
                            tenant_id = value.decode()
                            break
                    
                    # Record metrics
                    await monitoring_service.record_api_request(
                        method=method,
                        endpoint=path,
                        status_code=status_code,
                        duration=duration,
                        tenant_id=tenant_id
                    )
                
                await send(message)
            
            await self.app(scope, receive, send_wrapper)
        else:
            await self.app(scope, receive, send)
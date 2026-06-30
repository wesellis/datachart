"""
Multi-Tenant Middleware for DataChart
Handles tenant isolation, API key validation, and request routing
"""

import json
import logging
import hashlib
from typing import Optional, Dict, Any, Callable
from datetime import datetime, timedelta
import asyncio
from functools import wraps

from fastapi import Request, Response, HTTPException, status
from fastapi.security import APIKeyHeader, HTTPBearer
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp
from sqlalchemy.orm import Session
from jose import jwt, JWTError
import redis

from app.core.config import settings
from app.core.database import get_db
from app.models.customers import Customer, CustomerCredential, AuditLog, User
from app.core.cache import CacheManager

logger = logging.getLogger(__name__)

# Security schemes
api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)
bearer_scheme = HTTPBearer(auto_error=False)


class MultiTenantMiddleware(BaseHTTPMiddleware):
    """
    Multi-tenant middleware that handles:
    - Tenant identification and isolation
    - API key validation
    - Rate limiting per tenant
    - Request auditing
    - Tenant context injection
    """
    
    def __init__(self, app: ASGIApp):
        super().__init__(app)
        self.cache = CacheManager()
        self.redis_client = redis.Redis(
            host=settings.REDIS_HOST,
            port=settings.REDIS_PORT,
            db=0,
            decode_responses=True
        )
        
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """
        Process each request for multi-tenant context
        """
        start_time = datetime.utcnow()
        
        try:
            # Skip middleware for public endpoints
            if self._is_public_endpoint(request.url.path):
                return await call_next(request)
            
            # Extract tenant information
            tenant_info = await self._extract_tenant_info(request)
            
            if not tenant_info:
                return Response(
                    content=json.dumps({"error": "Tenant identification failed"}),
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    media_type="application/json"
                )
            
            # Validate tenant and permissions
            tenant = await self._validate_tenant(tenant_info)
            
            if not tenant:
                return Response(
                    content=json.dumps({"error": "Invalid tenant or credentials"}),
                    status_code=status.HTTP_403_FORBIDDEN,
                    media_type="application/json"
                )
            
            # Check rate limits
            if not await self._check_rate_limit(tenant):
                return Response(
                    content=json.dumps({"error": "Rate limit exceeded"}),
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    media_type="application/json",
                    headers={"Retry-After": "60"}
                )
            
            # Check tenant resource limits
            if not await self._check_resource_limits(tenant, request):
                return Response(
                    content=json.dumps({"error": "Resource limit exceeded for your subscription tier"}),
                    status_code=status.HTTP_402_PAYMENT_REQUIRED,
                    media_type="application/json"
                )
            
            # Inject tenant context into request
            request.state.tenant = tenant
            request.state.tenant_id = tenant.id
            request.state.user = tenant_info.get('user')
            request.state.auth_method = tenant_info.get('auth_method')
            
            # Add tenant headers to response
            response = await call_next(request)
            response.headers["X-Tenant-ID"] = str(tenant.id)
            response.headers["X-Rate-Limit-Remaining"] = str(await self._get_remaining_rate_limit(tenant))
            
            # Audit the request
            await self._audit_request(
                tenant=tenant,
                request=request,
                response=response,
                duration=(datetime.utcnow() - start_time).total_seconds()
            )
            
            return response
            
        except Exception as e:
            logger.error(f"Multi-tenant middleware error: {str(e)}")
            return Response(
                content=json.dumps({"error": "Internal server error"}),
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                media_type="application/json"
            )
    
    def _is_public_endpoint(self, path: str) -> bool:
        """Check if endpoint is public (no auth required)"""
        public_paths = [
            "/",
            "/health",
            "/docs",
            "/openapi.json",
            "/api/v1/auth/login",
            "/api/v1/auth/register",
            "/api/v1/auth/forgot-password",
            "/api/v1/marketing",
            "/api/v1/pricing"
        ]
        
        return any(path.startswith(p) for p in public_paths)
    
    async def _extract_tenant_info(self, request: Request) -> Optional[Dict[str, Any]]:
        """
        Extract tenant information from request
        Supports multiple authentication methods
        """
        tenant_info = {}
        
        # 1. Check for API Key in header
        api_key = request.headers.get("X-API-Key")
        if api_key:
            tenant_info['api_key'] = api_key
            tenant_info['auth_method'] = 'api_key'
            return tenant_info
        
        # 2. Check for Bearer token (JWT)
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
            try:
                payload = jwt.decode(
                    token,
                    settings.SECRET_KEY,
                    algorithms=["HS256"]
                )
                tenant_info['tenant_id'] = payload.get('tenant_id')
                tenant_info['user_id'] = payload.get('user_id')
                tenant_info['auth_method'] = 'jwt'
                return tenant_info
            except JWTError:
                logger.warning("Invalid JWT token")
                return None
        
        # 3. Check for tenant ID in subdomain
        host = request.headers.get("Host", "")
        if "." in host:
            subdomain = host.split(".")[0]
            if subdomain not in ["www", "api", "app"]:
                tenant_info['subdomain'] = subdomain
                tenant_info['auth_method'] = 'subdomain'
                # Still need additional auth
                return None
        
        # 4. Check for tenant ID in path
        if "/tenant/" in request.url.path:
            parts = request.url.path.split("/tenant/")
            if len(parts) > 1:
                tenant_id = parts[1].split("/")[0]
                tenant_info['tenant_id'] = tenant_id
                tenant_info['auth_method'] = 'path'
                # Still need additional auth
                return None
        
        return None
    
    async def _validate_tenant(self, tenant_info: Dict[str, Any]) -> Optional[Customer]:
        """
        Validate tenant credentials and return tenant object
        """
        db = next(get_db())
        
        try:
            # Validate by API key
            if tenant_info.get('auth_method') == 'api_key':
                api_key = tenant_info.get('api_key')
                
                # Check cache first
                cache_key = f"tenant:api_key:{hashlib.md5(api_key.encode()).hexdigest()}"
                cached_tenant = self.cache.get(cache_key)
                if cached_tenant:
                    return cached_tenant
                
                # Query database
                customers = db.query(Customer).filter(
                    Customer.subscription_status == 'active'
                ).all()
                
                for customer in customers:
                    if customer.verify_api_key(api_key):
                        # Cache for 5 minutes
                        self.cache.set(cache_key, customer, ttl=300)
                        return customer
                
                return None
            
            # Validate by tenant ID (from JWT)
            if tenant_info.get('auth_method') == 'jwt':
                tenant_id = tenant_info.get('tenant_id')
                user_id = tenant_info.get('user_id')
                
                customer = db.query(Customer).filter(
                    Customer.id == tenant_id,
                    Customer.subscription_status == 'active'
                ).first()
                
                if customer:
                    # Verify user belongs to tenant
                    user = db.query(User).filter(
                        User.id == user_id,
                        User.is_active == True
                    ).first()
                    
                    if user and customer in user.customers:
                        tenant_info['user'] = user
                        return customer
                
                return None
            
            return None
            
        finally:
            db.close()
    
    async def _check_rate_limit(self, tenant: Customer) -> bool:
        """
        Check if tenant has exceeded rate limits
        Uses sliding window algorithm
        """
        # Get rate limit based on tier
        rate_limits = {
            'trial': 100,      # 100 requests per minute
            'starter': 500,    # 500 requests per minute
            'professional': 2000,  # 2000 requests per minute
            'enterprise': 10000   # 10000 requests per minute
        }
        
        limit = rate_limits.get(tenant.tier, 100)
        
        # Use Redis for distributed rate limiting
        key = f"rate_limit:{tenant.id}:{datetime.utcnow().minute}"
        
        try:
            current = self.redis_client.incr(key)
            if current == 1:
                self.redis_client.expire(key, 60)  # Expire after 1 minute
            
            return current <= limit
            
        except Exception as e:
            logger.error(f"Rate limit check failed: {str(e)}")
            # Fail open - allow request if Redis is down
            return True
    
    async def _get_remaining_rate_limit(self, tenant: Customer) -> int:
        """Get remaining rate limit for tenant"""
        rate_limits = {
            'trial': 100,
            'starter': 500,
            'professional': 2000,
            'enterprise': 10000
        }
        
        limit = rate_limits.get(tenant.tier, 100)
        key = f"rate_limit:{tenant.id}:{datetime.utcnow().minute}"
        
        try:
            current = self.redis_client.get(key)
            if current:
                return max(0, limit - int(current))
            return limit
        except:
            return limit
    
    async def _check_resource_limits(self, tenant: Customer, request: Request) -> bool:
        """
        Check if tenant has exceeded resource limits
        """
        # Check API calls per month
        if tenant.api_calls_this_month >= tenant.max_api_calls_per_month:
            # Check if we need to reset monthly counter
            if datetime.utcnow() > tenant.api_calls_reset_date + timedelta(days=30):
                tenant.reset_monthly_usage()
                db = next(get_db())
                db.commit()
                db.close()
            else:
                return False
        
        # Check concurrent dashboards
        if "/dashboards" in request.url.path and request.method == "POST":
            if tenant.current_dashboards >= tenant.max_dashboards:
                return False
        
        # Check data sources
        if "/data-sources" in request.url.path and request.method == "POST":
            if tenant.current_data_sources >= tenant.max_data_sources:
                return False
        
        return True
    
    async def _audit_request(self, tenant: Customer, request: Request, response: Response, duration: float):
        """
        Audit log the request for compliance and debugging
        """
        # Don't audit health checks or static files
        if request.url.path in ["/health", "/"] or request.url.path.startswith("/static"):
            return
        
        db = next(get_db())
        
        try:
            # Extract relevant information
            user_id = request.state.user.id if hasattr(request.state, 'user') and request.state.user else None
            
            # Parse response for data access patterns
            query_type = None
            rows_returned = None
            
            if "vendor" in request.url.path:
                query_type = "vendor_metrics"
            elif "application" in request.url.path:
                query_type = "application_metrics"
            elif "cost" in request.url.path:
                query_type = "cost_analysis"
            elif "compliance" in request.url.path:
                query_type = "compliance_metrics"
            
            # Create audit log entry
            audit_log = AuditLog(
                customer_id=tenant.id,
                user_id=user_id,
                action=f"{request.method} {request.url.path}",
                resource_type=self._get_resource_type(request.url.path),
                resource_id=request.path_params.get('id') if hasattr(request, 'path_params') else None,
                query_type=query_type,
                query_time_ms=int(duration * 1000),
                rows_returned=rows_returned,
                ip_address=request.client.host if request.client else None,
                user_agent=request.headers.get("User-Agent", "")[:500],
                request_method=request.method,
                request_path=str(request.url.path)[:500],
                response_status=response.status_code,
                error_message=None if response.status_code < 400 else f"HTTP {response.status_code}"
            )
            
            db.add(audit_log)
            
            # Update tenant usage metrics
            tenant.api_calls_this_month += 1
            
            db.commit()
            
        except Exception as e:
            logger.error(f"Failed to create audit log: {str(e)}")
            db.rollback()
        finally:
            db.close()
    
    def _get_resource_type(self, path: str) -> str:
        """Extract resource type from path"""
        if "/dashboards" in path:
            return "dashboard"
        elif "/data-sources" in path:
            return "data_source"
        elif "/users" in path:
            return "user"
        elif "/credentials" in path:
            return "credential"
        elif "/reports" in path:
            return "report"
        else:
            return "api"


class TenantContextManager:
    """
    Context manager for tenant-specific operations
    Ensures data isolation and proper cleanup
    """
    
    def __init__(self, tenant_id: str):
        self.tenant_id = tenant_id
        self.original_schema = None
        self.db = None
    
    async def __aenter__(self):
        """Enter tenant context"""
        self.db = next(get_db())
        
        # For PostgreSQL with schemas per tenant
        if settings.USE_SCHEMA_ISOLATION:
            self.original_schema = await self._get_current_schema()
            await self._set_schema(f"tenant_{self.tenant_id}")
        
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Exit tenant context"""
        try:
            # Restore original schema
            if settings.USE_SCHEMA_ISOLATION and self.original_schema:
                await self._set_schema(self.original_schema)
        finally:
            if self.db:
                self.db.close()
    
    async def _get_current_schema(self) -> str:
        """Get current PostgreSQL schema"""
        result = self.db.execute("SELECT current_schema()").fetchone()
        return result[0] if result else "public"
    
    async def _set_schema(self, schema_name: str):
        """Set PostgreSQL schema for tenant isolation"""
        self.db.execute(f"SET search_path TO {schema_name}, public")
        self.db.commit()


def require_tenant(tier: Optional[str] = None):
    """
    Decorator to require tenant authentication
    Optionally specify minimum tier required
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(request: Request, *args, **kwargs):
            # Check if tenant is set by middleware
            if not hasattr(request.state, 'tenant'):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Tenant authentication required"
                )
            
            tenant = request.state.tenant
            
            # Check tier requirement
            if tier:
                tier_hierarchy = {
                    'trial': 0,
                    'starter': 1,
                    'professional': 2,
                    'enterprise': 3
                }
                
                required_level = tier_hierarchy.get(tier, 0)
                tenant_level = tier_hierarchy.get(tenant.tier, 0)
                
                if tenant_level < required_level:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail=f"This feature requires {tier} tier or higher"
                    )
            
            # Add tenant to function kwargs
            kwargs['tenant'] = tenant
            
            return await func(request, *args, **kwargs)
        
        return wrapper
    return decorator


def track_usage(metric_name: str, increment: int = 1):
    """
    Decorator to track API usage metrics
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(request: Request, *args, **kwargs):
            result = await func(request, *args, **kwargs)
            
            # Track usage if tenant is available
            if hasattr(request.state, 'tenant'):
                tenant = request.state.tenant
                
                # Update metrics in Redis for real-time tracking
                redis_client = redis.Redis(
                    host=settings.REDIS_HOST,
                    port=settings.REDIS_PORT,
                    db=0
                )
                
                # Daily metric
                daily_key = f"usage:{tenant.id}:{metric_name}:{datetime.utcnow().date()}"
                redis_client.incrby(daily_key, increment)
                redis_client.expire(daily_key, 86400 * 30)  # Keep for 30 days
                
                # Monthly metric
                monthly_key = f"usage:{tenant.id}:{metric_name}:{datetime.utcnow().strftime('%Y-%m')}"
                redis_client.incrby(monthly_key, increment)
                redis_client.expire(monthly_key, 86400 * 90)  # Keep for 90 days
            
            return result
        
        return wrapper
    return decorator


class TenantIsolationService:
    """
    Service for managing tenant data isolation
    """
    
    @staticmethod
    async def create_tenant_schema(tenant_id: str, db: Session):
        """Create isolated schema for new tenant"""
        if not settings.USE_SCHEMA_ISOLATION:
            return
        
        schema_name = f"tenant_{tenant_id}"
        
        try:
            # Create schema
            db.execute(f"CREATE SCHEMA IF NOT EXISTS {schema_name}")
            
            # Grant permissions
            db.execute(f"GRANT ALL ON SCHEMA {schema_name} TO {settings.DB_USER}")
            
            # Create tables in tenant schema
            # This would copy the table structure from public schema
            tables = [
                'dashboards', 'widgets', 'data_sources', 
                'reports', 'alerts', 'preferences'
            ]
            
            for table in tables:
                db.execute(f"""
                    CREATE TABLE IF NOT EXISTS {schema_name}.{table} 
                    (LIKE public.{table} INCLUDING ALL)
                """)
            
            db.commit()
            logger.info(f"Created schema for tenant {tenant_id}")
            
        except Exception as e:
            logger.error(f"Failed to create tenant schema: {str(e)}")
            db.rollback()
            raise
    
    @staticmethod
    async def delete_tenant_schema(tenant_id: str, db: Session):
        """Delete tenant schema (use with caution)"""
        if not settings.USE_SCHEMA_ISOLATION:
            return
        
        schema_name = f"tenant_{tenant_id}"
        
        try:
            # Drop schema cascade (removes all objects)
            db.execute(f"DROP SCHEMA IF EXISTS {schema_name} CASCADE")
            db.commit()
            logger.info(f"Deleted schema for tenant {tenant_id}")
            
        except Exception as e:
            logger.error(f"Failed to delete tenant schema: {str(e)}")
            db.rollback()
            raise
    
    @staticmethod
    async def backup_tenant_data(tenant_id: str) -> str:
        """Backup tenant data to S3 or filesystem"""
        # Implementation would backup tenant-specific data
        # Return backup location/ID
        pass
    
    @staticmethod
    async def restore_tenant_data(tenant_id: str, backup_id: str):
        """Restore tenant data from backup"""
        # Implementation would restore tenant-specific data
        pass


class TenantRateLimiter:
    """
    Advanced rate limiting for multi-tenant environment
    """
    
    def __init__(self):
        self.redis_client = redis.Redis(
            host=settings.REDIS_HOST,
            port=settings.REDIS_PORT,
            db=0,
            decode_responses=True
        )
    
    async def check_limit(self, 
                         tenant_id: str, 
                         resource: str, 
                         limit: int, 
                         window: int = 60) -> bool:
        """
        Check rate limit for specific resource
        
        Args:
            tenant_id: Tenant identifier
            resource: Resource being accessed
            limit: Maximum requests allowed
            window: Time window in seconds
        
        Returns:
            True if within limit, False otherwise
        """
        key = f"rate:{tenant_id}:{resource}:{int(datetime.utcnow().timestamp() / window)}"
        
        try:
            current = self.redis_client.incr(key)
            if current == 1:
                self.redis_client.expire(key, window)
            
            return current <= limit
            
        except Exception as e:
            logger.error(f"Rate limit check failed: {str(e)}")
            return True  # Fail open
    
    async def get_usage(self, tenant_id: str, resource: str, window: int = 60) -> Dict:
        """Get current usage statistics"""
        key = f"rate:{tenant_id}:{resource}:{int(datetime.utcnow().timestamp() / window)}"
        
        try:
            current = self.redis_client.get(key)
            return {
                'current': int(current) if current else 0,
                'window': window,
                'reset_at': datetime.utcnow() + timedelta(seconds=window)
            }
        except:
            return {'current': 0, 'window': window}
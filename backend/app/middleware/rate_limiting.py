"""
Rate Limiting Middleware for DataChart SaaS

Provides comprehensive rate limiting with:
- IP-based rate limiting
- User-based rate limiting 
- Endpoint-specific limits
- Tiered rate limits based on subscription
- Redis-backed storage for distributed systems
"""

import time
from typing import Dict, Optional, Tuple
from fastapi import Request, Response, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
import logging
import asyncio
from datetime import datetime, timedelta
import hashlib
import json

logger = logging.getLogger(__name__)

# Default rate limits (requests per minute)
DEFAULT_LIMITS = {
    "guest": 10,        # Unauthenticated users
    "basic": 60,        # Basic subscription
    "professional": 300, # Professional subscription
    "enterprise": 1000,  # Enterprise subscription
    "admin": 10000      # Admin users
}

# Endpoint-specific overrides
ENDPOINT_LIMITS = {
    "/api/v1/auth/login": {"guest": 5},
    "/api/v1/auth/register": {"guest": 3}, 
    "/api/v1/dashboards/data": {"guest": 20, "basic": 100},
    "/api/v1/query": {"basic": 30, "professional": 150, "enterprise": 500},
    "/health": {"guest": 100}  # Health checks get higher limits
}

class InMemoryRateLimiter:
    """In-memory rate limiter for development/testing"""
    
    def __init__(self):
        self.requests: Dict[str, list] = {}
        self.cleanup_interval = 60  # seconds
        self.last_cleanup = time.time()
    
    def _cleanup_old_requests(self):
        """Remove old request timestamps"""
        current_time = time.time()
        if current_time - self.last_cleanup < self.cleanup_interval:
            return
            
        cutoff_time = current_time - 60  # Keep last minute
        for key in list(self.requests.keys()):
            self.requests[key] = [
                req_time for req_time in self.requests[key] 
                if req_time > cutoff_time
            ]
            if not self.requests[key]:
                del self.requests[key]
        
        self.last_cleanup = current_time
    
    async def is_allowed(self, key: str, limit: int, window: int = 60) -> Tuple[bool, Dict]:
        """Check if request is allowed within rate limit"""
        current_time = time.time()
        self._cleanup_old_requests()
        
        # Get or initialize request history for this key
        if key not in self.requests:
            self.requests[key] = []
        
        # Count requests in current window
        window_start = current_time - window
        recent_requests = [
            req_time for req_time in self.requests[key]
            if req_time > window_start
        ]
        
        # Update the list with only recent requests
        self.requests[key] = recent_requests
        
        # Check if under limit
        current_count = len(recent_requests)
        is_allowed = current_count < limit
        
        if is_allowed:
            # Add current request
            self.requests[key].append(current_time)
        
        # Calculate reset time
        if recent_requests:
            oldest_request = min(recent_requests)
            reset_time = int(oldest_request + window)
        else:
            reset_time = int(current_time + window)
        
        return is_allowed, {
            "limit": limit,
            "remaining": max(0, limit - current_count - (1 if is_allowed else 0)),
            "reset": reset_time,
            "current": current_count
        }

class RateLimitMiddleware(BaseHTTPMiddleware):
    """Rate limiting middleware with comprehensive controls"""
    
    def __init__(self, app, redis_client=None):
        super().__init__(app)
        self.redis = redis_client
        self.memory_limiter = InMemoryRateLimiter()
        self.enabled = True
    
    def _get_client_identifier(self, request: Request) -> str:
        """Get unique client identifier for rate limiting"""
        # Try to get user ID from JWT token
        user_id = getattr(request.state, "user_id", None)
        if user_id:
            return f"user:{user_id}"
        
        # Fall back to IP address
        client_ip = request.client.host
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            client_ip = forwarded_for.split(",")[0].strip()
        
        return f"ip:{client_ip}"
    
    def _get_user_tier(self, request: Request) -> str:
        """Determine user's subscription tier for rate limiting"""
        # Check if user is authenticated
        user_tier = getattr(request.state, "user_tier", None)
        if user_tier:
            return user_tier
        
        # Check for admin privileges
        is_admin = getattr(request.state, "is_admin", False)
        if is_admin:
            return "admin"
        
        # Default to guest for unauthenticated users
        return "guest"
    
    def _get_rate_limit(self, request: Request, tier: str) -> int:
        """Get rate limit for specific endpoint and tier"""
        path = request.url.path
        
        # Check for endpoint-specific limits
        if path in ENDPOINT_LIMITS:
            endpoint_limits = ENDPOINT_LIMITS[path]
            if tier in endpoint_limits:
                return endpoint_limits[tier]
        
        # Fall back to default limits
        return DEFAULT_LIMITS.get(tier, DEFAULT_LIMITS["guest"])
    
    def _should_skip_rate_limiting(self, request: Request) -> bool:
        """Check if request should skip rate limiting"""
        # Skip for health checks from internal sources
        if request.url.path == "/health":
            client_ip = request.client.host
            if client_ip in ["127.0.0.1", "localhost", "::1"]:
                return True
        
        # Skip for development environment
        if hasattr(request.app.state, "environment") and request.app.state.environment == "development":
            return True
        
        return False
    
    async def dispatch(self, request: Request, call_next):
        """Process request with rate limiting"""
        if not self.enabled or self._should_skip_rate_limiting(request):
            return await call_next(request)
        
        try:
            # Get client information
            client_id = self._get_client_identifier(request)
            tier = self._get_user_tier(request)
            limit = self._get_rate_limit(request, tier)
            
            # Check rate limit
            rate_limit_key = f"rate_limit:{client_id}:{request.url.path}"
            
            # Use Redis if available, otherwise use in-memory limiter
            if self.redis:
                is_allowed, info = await self._check_redis_rate_limit(
                    rate_limit_key, limit
                )
            else:
                is_allowed, info = await self.memory_limiter.is_allowed(
                    rate_limit_key, limit
                )
            
            # Add rate limit headers
            response_headers = {
                "X-RateLimit-Limit": str(info["limit"]),
                "X-RateLimit-Remaining": str(info["remaining"]),
                "X-RateLimit-Reset": str(info["reset"]),
            }
            
            # Check if request is allowed
            if not is_allowed:
                logger.warning(f"Rate limit exceeded for {client_id} on {request.url.path}")
                
                return JSONResponse(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    content={
                        "error": {
                            "type": "RateLimitError",
                            "message": "Rate limit exceeded",
                            "details": {
                                "limit": info["limit"],
                                "reset_time": info["reset"],
                                "tier": tier
                            },
                            "status_code": 429
                        }
                    },
                    headers=response_headers
                )
            
            # Process the request
            response = await call_next(request)
            
            # Add rate limit headers to response
            for header, value in response_headers.items():
                response.headers[header] = value
            
            return response
            
        except Exception as e:
            logger.error(f"Rate limiting error: {str(e)}")
            # Don't block requests if rate limiting fails
            return await call_next(request)
    
    async def _check_redis_rate_limit(self, key: str, limit: int, window: int = 60) -> Tuple[bool, Dict]:
        """Redis-based rate limiting for production"""
        try:
            current_time = int(time.time())
            
            # Use Redis pipeline for atomic operations
            pipe = self.redis.pipeline()
            
            # Remove expired entries
            pipe.zremrangebyscore(key, 0, current_time - window)
            
            # Count current requests
            pipe.zcard(key)
            
            # Add current request
            pipe.zadd(key, {str(current_time): current_time})
            
            # Set expiration
            pipe.expire(key, window)
            
            results = await pipe.execute()
            current_count = results[1]
            
            is_allowed = current_count < limit
            
            if not is_allowed:
                # Remove the request we just added since it's not allowed
                await self.redis.zrem(key, str(current_time))
            
            return is_allowed, {
                "limit": limit,
                "remaining": max(0, limit - current_count - (1 if is_allowed else 0)),
                "reset": current_time + window,
                "current": current_count
            }
            
        except Exception as e:
            logger.error(f"Redis rate limiting error: {str(e)}")
            # Fall back to allowing the request if Redis fails
            return True, {
                "limit": limit,
                "remaining": limit - 1,
                "reset": int(time.time()) + window,
                "current": 0
            }

# Rate limiting decorator for specific endpoints
def rate_limit(requests_per_minute: int = None, per_user: bool = False):
    """Decorator for endpoint-specific rate limiting"""
    def decorator(func):
        func._rate_limit = requests_per_minute
        func._rate_limit_per_user = per_user
        return func
    return decorator
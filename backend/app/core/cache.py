"""
Cache Manager - Redis-based caching for dashboard data
"""

import redis
import json
import os
import logging
from typing import Any, Optional
from datetime import timedelta
import hashlib

logger = logging.getLogger(__name__)

class CacheManager:
    """
    Manages caching of dashboard data using Redis
    Falls back to in-memory cache if Redis unavailable
    """
    
    def __init__(self):
        """Initialize cache manager"""
        self.redis_client = None
        self.memory_cache = {}  # Fallback in-memory cache
        self.ttl_default = int(os.getenv('CACHE_TTL_SECONDS', 300))  # 5 minutes default
        
        # Try to connect to Redis
        try:
            redis_url = os.getenv('REDIS_URL', 'redis://localhost:6379/0')
            self.redis_client = redis.from_url(redis_url, decode_responses=True)
            self.redis_client.ping()
            logger.info("Connected to Redis cache")
        except Exception as e:
            logger.warning(f"Redis not available, using in-memory cache: {str(e)}")
            self.redis_client = None
    
    def _make_key(self, key: str) -> str:
        """Create a namespaced cache key"""
        return f"DataChart:cache:{key}"
    
    def get(self, key: str) -> Optional[Any]:
        """
        Get value from cache
        
        Args:
            key: Cache key
        
        Returns:
            Cached value or None if not found
        """
        try:
            if self.redis_client:
                cached = self.redis_client.get(self._make_key(key))
                if cached:
                    return json.loads(cached)
            else:
                # Use in-memory cache
                if key in self.memory_cache:
                    return self.memory_cache[key]
        except Exception as e:
            logger.error(f"Cache get error: {str(e)}")
        
        return None
    
    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> bool:
        """
        Set value in cache
        
        Args:
            key: Cache key
            value: Value to cache
            ttl: Time to live in seconds (optional)
        
        Returns:
            True if successful
        """
        try:
            ttl = ttl or self.ttl_default
            serialized = json.dumps(value)
            
            if self.redis_client:
                self.redis_client.setex(
                    self._make_key(key),
                    timedelta(seconds=ttl),
                    serialized
                )
            else:
                # Use in-memory cache
                self.memory_cache[key] = value
                # Simple TTL implementation for memory cache
                # In production, would use a more sophisticated approach
            
            return True
        except Exception as e:
            logger.error(f"Cache set error: {str(e)}")
            return False
    
    def delete(self, key: str) -> bool:
        """
        Delete value from cache
        
        Args:
            key: Cache key
        
        Returns:
            True if successful
        """
        try:
            if self.redis_client:
                self.redis_client.delete(self._make_key(key))
            else:
                self.memory_cache.pop(key, None)
            return True
        except Exception as e:
            logger.error(f"Cache delete error: {str(e)}")
            return False
    
    def clear_pattern(self, pattern: str) -> int:
        """
        Clear all keys matching pattern
        
        Args:
            pattern: Key pattern (supports wildcards)
        
        Returns:
            Number of keys cleared
        """
        try:
            if self.redis_client:
                keys = self.redis_client.keys(self._make_key(pattern))
                if keys:
                    return self.redis_client.delete(*keys)
            else:
                # Simple pattern matching for in-memory cache
                cleared = 0
                pattern_base = pattern.replace('*', '')
                keys_to_delete = [k for k in self.memory_cache.keys() if pattern_base in k]
                for key in keys_to_delete:
                    del self.memory_cache[key]
                    cleared += 1
                return cleared
        except Exception as e:
            logger.error(f"Cache clear pattern error: {str(e)}")
        
        return 0
    
    def exists(self, key: str) -> bool:
        """
        Check if key exists in cache
        
        Args:
            key: Cache key
        
        Returns:
            True if key exists
        """
        try:
            if self.redis_client:
                return bool(self.redis_client.exists(self._make_key(key)))
            else:
                return key in self.memory_cache
        except Exception as e:
            logger.error(f"Cache exists error: {str(e)}")
            return False
    
    def get_ttl(self, key: str) -> int:
        """
        Get remaining TTL for a key
        
        Args:
            key: Cache key
        
        Returns:
            TTL in seconds, -1 if no TTL, -2 if key doesn't exist
        """
        try:
            if self.redis_client:
                return self.redis_client.ttl(self._make_key(key))
            else:
                # Simplified for in-memory cache
                return -1 if key in self.memory_cache else -2
        except Exception as e:
            logger.error(f"Cache TTL error: {str(e)}")
            return -2
    
    def flush_all(self) -> bool:
        """
        Clear entire cache (use with caution)
        
        Returns:
            True if successful
        """
        try:
            if self.redis_client:
                # Only flush our namespace
                keys = self.redis_client.keys("DataChart:cache:*")
                if keys:
                    self.redis_client.delete(*keys)
            else:
                self.memory_cache.clear()
            
            logger.info("Cache flushed")
            return True
        except Exception as e:
            logger.error(f"Cache flush error: {str(e)}")
            return False
    
    def get_stats(self) -> dict:
        """
        Get cache statistics
        
        Returns:
            Dictionary with cache stats
        """
        try:
            if self.redis_client:
                info = self.redis_client.info()
                return {
                    "type": "redis",
                    "connected": True,
                    "keys": self.redis_client.dbsize(),
                    "memory_used": info.get('used_memory_human', 'unknown'),
                    "hits": info.get('keyspace_hits', 0),
                    "misses": info.get('keyspace_misses', 0)
                }
            else:
                return {
                    "type": "memory",
                    "connected": True,
                    "keys": len(self.memory_cache),
                    "memory_used": "N/A",
                    "hits": 0,
                    "misses": 0
                }
        except Exception as e:
            logger.error(f"Cache stats error: {str(e)}")
            return {
                "type": "unknown",
                "connected": False,
                "error": str(e)
            }
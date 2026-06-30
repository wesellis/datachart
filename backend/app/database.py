from sqlalchemy import create_engine, MetaData
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
import redis
from app.config import settings

# Create SQLAlchemy engine
if settings.DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        settings.DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
        echo=settings.DEBUG
    )
else:
    engine = create_engine(
        settings.DATABASE_URL,
        pool_pre_ping=True,
        pool_recycle=300,
        echo=settings.DEBUG
    )

# Create SessionLocal
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create Base for models
Base = declarative_base()
metadata = MetaData()

# Redis connection
try:
    redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)
    # Test connection
    redis_client.ping()
    print("✅ Redis connected successfully")
except Exception as e:
    print(f"⚠️ Redis connection failed: {e}")
    redis_client = None

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Dependency to get Redis client
def get_redis():
    if redis_client is None:
        raise Exception("Redis is not available")
    return redis_client

# Database initialization
def init_db():
    """Initialize database tables"""
    try:
        # Import all models to register them with Base
        from app.models import user, dashboard, data_source  # noqa
        
        # Create all tables
        Base.metadata.create_all(bind=engine)
        print("✅ Database initialized successfully")
        
        # Create default admin user if none exists
        from app.models.user import User
        from app.api.auth import get_password_hash
        import uuid
        
        db = SessionLocal()
        try:
            admin_exists = db.query(User).filter(User.email == "admin@datachart.app").first()
            if not admin_exists:
                admin_user = User(
                    email="admin@datachart.app",
                    username="admin",
                    full_name="System Administrator",
                    hashed_password=get_password_hash("admin123"),
                    is_active=True,
                    is_super_admin=True,
                    is_verified=True
                )
                db.add(admin_user)
                db.commit()
                print("✅ Default admin user created (admin@datachart.app / admin123)")
        except Exception as e:
            print(f"⚠️ Error creating admin user: {e}")
        finally:
            db.close()
            
    except Exception as e:
        print(f"❌ Database initialization failed: {e}")
        raise

def test_db_connection():
    """Test database connection"""
    try:
        db = SessionLocal()
        # Execute a simple query
        result = db.execute("SELECT 1").fetchone()
        db.close()
        return result is not None
    except Exception as e:
        print(f"Database connection test failed: {e}")
        return False

# Cache utilities
class Cache:
    @staticmethod
    def get(key: str):
        """Get value from cache"""
        if not redis_client:
            return None
        try:
            return redis_client.get(key)
        except Exception:
            return None
    
    @staticmethod
    def set(key: str, value: str, ttl: int = settings.CACHE_TTL):
        """Set value in cache with TTL"""
        if not redis_client:
            return False
        try:
            return redis_client.setex(key, ttl, value)
        except Exception:
            return False
    
    @staticmethod
    def delete(key: str):
        """Delete key from cache"""
        if not redis_client:
            return False
        try:
            return redis_client.delete(key) > 0
        except Exception:
            return False
    
    @staticmethod
    def exists(key: str):
        """Check if key exists in cache"""
        if not redis_client:
            return False
        try:
            return redis_client.exists(key) > 0
        except Exception:
            return False
    
    @staticmethod
    def flush():
        """Clear all cache"""
        if not redis_client:
            return False
        try:
            return redis_client.flushdb()
        except Exception:
            return False
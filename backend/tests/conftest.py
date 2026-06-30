# Test configuration and fixtures
import pytest
import asyncio
from typing import AsyncGenerator
from httpx import AsyncClient
from sqlalchemy import create_engine, pool
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.pool import StaticPool
import redis
import fakeredis

from app.main import app
from app.database import get_db, get_redis
from app.models.base import Base
from app.models.user import User, Organization
from app.config import settings

# Test database URL (SQLite in-memory)
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture(scope="session")
async def test_engine():
    """Create test database engine."""
    engine = create_async_engine(
        TEST_DATABASE_URL,
        poolclass=StaticPool,
        connect_args={"check_same_thread": False},
        echo=False
    )
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    yield engine
    await engine.dispose()

@pytest.fixture
async def test_db_session(test_engine):
    """Create a test database session."""
    async_session = async_sessionmaker(
        test_engine, class_=AsyncSession, expire_on_commit=False
    )
    
    async with async_session() as session:
        yield session
        await session.rollback()

@pytest.fixture
def test_redis():
    """Create a fake Redis instance for testing."""
    fake_redis = fakeredis.FakeStrictRedis()
    return fake_redis

@pytest.fixture
async def client(test_db_session, test_redis):
    """Create test HTTP client with overridden dependencies."""
    
    def override_get_db():
        return test_db_session
    
    def override_get_redis():
        return test_redis
    
    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_redis] = override_get_redis
    
    async with AsyncClient(app=app, base_url="http://test") as client:
        yield client
    
    app.dependency_overrides.clear()

@pytest.fixture
async def test_user(test_db_session):
    """Create a test user."""
    user = User(
        email="test@example.com",
        hashed_password="$2b$12$dummy_hash",  # This should be a real bcrypt hash
        first_name="Test",
        last_name="User",
        is_active=True,
        is_verified=True
    )
    test_db_session.add(user)
    await test_db_session.commit()
    await test_db_session.refresh(user)
    return user

@pytest.fixture
async def test_organization(test_db_session, test_user):
    """Create a test organization."""
    org = Organization(
        name="Test Organization",
        plan_type="pro",
        is_active=True
    )
    test_db_session.add(org)
    await test_db_session.commit()
    await test_db_session.refresh(org)
    
    # Add user to organization
    test_user.organizations.append(org)
    await test_db_session.commit()
    
    return org

@pytest.fixture
def auth_headers(test_user):
    """Create authentication headers for testing."""
    # This would typically create a JWT token
    # For testing purposes, we'll mock this
    from app.api.auth import create_access_token
    
    token_data = {"sub": test_user.email, "user_id": test_user.id}
    access_token = create_access_token(data=token_data)
    
    return {"Authorization": f"Bearer {access_token}"}

# Test data fixtures
@pytest.fixture
def sample_dashboard_data():
    """Sample dashboard data for testing."""
    return {
        "name": "Test Dashboard",
        "description": "A test dashboard",
        "layout": "grid",
        "theme": "light",
        "is_public": False,
        "tags": ["test", "sample"]
    }

@pytest.fixture
def sample_widget_data():
    """Sample widget data for testing."""
    return {
        "type": "chart",
        "title": "Test Chart",
        "position": {"x": 0, "y": 0, "width": 4, "height": 3},
        "config": {
            "chart_type": "bar",
            "x_axis": "category",
            "y_axis": "value"
        }
    }

@pytest.fixture
def sample_data_source_data():
    """Sample data source data for testing."""
    return {
        "name": "Test PostgreSQL",
        "type": "postgresql",
        "description": "Test database connection",
        "connection_config": {
            "host": "localhost",
            "port": 5432,
            "database": "test_db",
            "username": "test_user",
            "password": "test_password"
        }
    }

# Async test utilities
class AsyncMock:
    """Mock class for async functions."""
    def __init__(self, return_value=None, side_effect=None):
        self.return_value = return_value
        self.side_effect = side_effect
        self.call_count = 0
        self.call_args_list = []
    
    async def __call__(self, *args, **kwargs):
        self.call_count += 1
        self.call_args_list.append((args, kwargs))
        
        if self.side_effect:
            if isinstance(self.side_effect, Exception):
                raise self.side_effect
            return self.side_effect(*args, **kwargs)
        
        return self.return_value
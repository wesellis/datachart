"""
Comprehensive test suite for DataChart API
"""

import pytest
import asyncio
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from datetime import datetime, timedelta
import json
from unittest.mock import Mock, patch, AsyncMock

from app.main import app
from app.database import Base, get_db
from app.models.user import User
from app.models.organization import Organization
from app.models.dashboard import Dashboard
from app.core.security import create_access_token, get_password_hash

# Test database setup
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base.metadata.create_all(bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)

# Fixtures
@pytest.fixture
def test_user():
    """Create a test user"""
    return {
        "email": "test@example.com",
        "password": "testpass123",
        "full_name": "Test User"
    }

@pytest.fixture
def auth_headers(test_user):
    """Generate authentication headers"""
    access_token = create_access_token(data={"sub": test_user["email"]})
    return {"Authorization": f"Bearer {access_token}"}

@pytest.fixture
def test_dashboard():
    """Create a test dashboard"""
    return {
        "name": "Test Dashboard",
        "description": "Test dashboard description",
        "config": {
            "theme": "dark",
            "refresh_interval": 300
        }
    }

@pytest.fixture
def test_data_source():
    """Create a test data source"""
    return {
        "name": "Test PostgreSQL",
        "type": "postgresql",
        "connection_config": {
            "host": "localhost",
            "port": 5432,
            "database": "testdb",
            "username": "testuser",
            "password": "testpass"
        }
    }

# Authentication Tests
class TestAuthentication:
    def test_register_user(self, test_user):
        """Test user registration"""
        response = client.post("/api/v1/auth/register", json=test_user)
        assert response.status_code == 201
        data = response.json()
        assert data["email"] == test_user["email"]
        assert "id" in data
        
    def test_login(self, test_user):
        """Test user login"""
        # First register
        client.post("/api/v1/auth/register", json=test_user)
        
        # Then login
        response = client.post("/api/v1/auth/login", data={
            "username": test_user["email"],
            "password": test_user["password"]
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        
    def test_invalid_login(self):
        """Test login with invalid credentials"""
        response = client.post("/api/v1/auth/login", data={
            "username": "invalid@example.com",
            "password": "wrongpass"
        })
        assert response.status_code == 401
        
    def test_refresh_token(self, test_user):
        """Test token refresh"""
        client.post("/api/v1/auth/register", json=test_user)
        login_response = client.post("/api/v1/auth/login", data={
            "username": test_user["email"],
            "password": test_user["password"]
        })
        refresh_token = login_response.json()["refresh_token"]
        
        response = client.post("/api/v1/auth/refresh", json={
            "refresh_token": refresh_token
        })
        assert response.status_code == 200
        assert "access_token" in response.json()

# Dashboard Tests
class TestDashboards:
    def test_create_dashboard(self, auth_headers, test_dashboard):
        """Test dashboard creation"""
        response = client.post(
            "/api/v1/dashboards",
            json=test_dashboard,
            headers=auth_headers
        )
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == test_dashboard["name"]
        assert "id" in data
        
    def test_list_dashboards(self, auth_headers):
        """Test listing dashboards"""
        response = client.get("/api/v1/dashboards", headers=auth_headers)
        assert response.status_code == 200
        assert isinstance(response.json(), list)
        
    def test_get_dashboard(self, auth_headers, test_dashboard):
        """Test getting a specific dashboard"""
        # Create dashboard
        create_response = client.post(
            "/api/v1/dashboards",
            json=test_dashboard,
            headers=auth_headers
        )
        dashboard_id = create_response.json()["id"]
        
        # Get dashboard
        response = client.get(f"/api/v1/dashboards/{dashboard_id}", headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["id"] == dashboard_id
        
    def test_update_dashboard(self, auth_headers, test_dashboard):
        """Test updating a dashboard"""
        # Create dashboard
        create_response = client.post(
            "/api/v1/dashboards",
            json=test_dashboard,
            headers=auth_headers
        )
        dashboard_id = create_response.json()["id"]
        
        # Update dashboard
        updated_data = {"name": "Updated Dashboard"}
        response = client.patch(
            f"/api/v1/dashboards/{dashboard_id}",
            json=updated_data,
            headers=auth_headers
        )
        assert response.status_code == 200
        assert response.json()["name"] == "Updated Dashboard"
        
    def test_delete_dashboard(self, auth_headers, test_dashboard):
        """Test deleting a dashboard"""
        # Create dashboard
        create_response = client.post(
            "/api/v1/dashboards",
            json=test_dashboard,
            headers=auth_headers
        )
        dashboard_id = create_response.json()["id"]
        
        # Delete dashboard
        response = client.delete(f"/api/v1/dashboards/{dashboard_id}", headers=auth_headers)
        assert response.status_code == 204
        
        # Verify deletion
        get_response = client.get(f"/api/v1/dashboards/{dashboard_id}", headers=auth_headers)
        assert get_response.status_code == 404

# Data Source Tests
class TestDataSources:
    def test_create_data_source(self, auth_headers, test_data_source):
        """Test data source creation"""
        response = client.post(
            "/api/v1/data-sources",
            json=test_data_source,
            headers=auth_headers
        )
        assert response.status_code in [200, 201]
        data = response.json()
        assert data["name"] == test_data_source["name"]
        
    @patch('app.services.data_connection_service.DataConnectionService.test_connection')
    async def test_test_connection(self, mock_test, auth_headers, test_data_source):
        """Test data source connection testing"""
        mock_test.return_value = {"success": True, "message": "Connection successful"}
        
        # Create data source
        create_response = client.post(
            "/api/v1/data-sources",
            json=test_data_source,
            headers=auth_headers
        )
        data_source_id = create_response.json()["id"]
        
        # Test connection
        response = client.get(
            f"/api/v1/data-sources/{data_source_id}/test",
            headers=auth_headers
        )
        assert response.status_code == 200
        assert response.json()["success"] == True

# Analytics Tests
class TestAnalytics:
    def test_statistical_analysis(self, auth_headers):
        """Test statistical analysis"""
        test_data = {
            "data": [
                {"value": 10, "category": "A"},
                {"value": 20, "category": "B"},
                {"value": 15, "category": "A"},
                {"value": 25, "category": "B"}
            ]
        }
        
        response = client.post(
            "/api/v1/analytics/analyze?analysis_type=statistical",
            json=test_data,
            headers=auth_headers
        )
        assert response.status_code == 200
        result = response.json()
        assert "results" in result
        assert result["analysis_type"] == "statistical"
        
    def test_trend_analysis(self, auth_headers):
        """Test trend analysis"""
        test_data = {
            "data": [
                {"date": "2024-01-01", "value": 100},
                {"date": "2024-01-02", "value": 110},
                {"date": "2024-01-03", "value": 120},
                {"date": "2024-01-04", "value": 115}
            ]
        }
        
        response = client.post(
            "/api/v1/analytics/analyze?analysis_type=trend",
            json=test_data,
            headers=auth_headers
        )
        assert response.status_code == 200
        result = response.json()
        assert result["analysis_type"] == "trend"

# WebSocket Tests
class TestWebSocket:
    def test_websocket_connection(self):
        """Test WebSocket connection"""
        with client.websocket_connect("/ws/dashboard-123?token=test-token") as websocket:
            # Send ping
            websocket.send_json({"type": "ping"})
            
            # Receive pong
            data = websocket.receive_json()
            assert data["type"] == "pong"

# Marketplace Tests
class TestMarketplace:
    def test_search_widgets(self, auth_headers):
        """Test marketplace widget search"""
        response = client.get(
            "/api/v1/marketplace/widgets?category=Analytics",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "widgets" in data
        assert isinstance(data["widgets"], list)
        
    def test_get_widget_details(self, auth_headers):
        """Test getting widget details"""
        response = client.get(
            "/api/v1/marketplace/widgets/widget-1",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert "name" in data
        
    def test_trending_widgets(self, auth_headers):
        """Test getting trending widgets"""
        response = client.get(
            "/api/v1/marketplace/trending",
            headers=auth_headers
        )
        assert response.status_code == 200
        assert isinstance(response.json(), list)

# Collaboration Tests
class TestCollaboration:
    def test_join_session(self, auth_headers):
        """Test joining collaboration session"""
        response = client.post(
            "/api/v1/collaboration/session/join/dashboard-123",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "session_id" in data
        assert "color" in data
        
    def test_add_comment(self, auth_headers):
        """Test adding a comment"""
        response = client.post(
            "/api/v1/collaboration/comment/add/dashboard-123",
            json={"comment_text": "Test comment"},
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "comment_id" in data

# Export/Import Tests
class TestExportImport:
    def test_export_dashboard_json(self, auth_headers):
        """Test exporting dashboard as JSON"""
        response = client.get(
            "/api/v1/export/dashboard/dashboard-123?format=json",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["format"] == "json"
        assert "content" in data
        
    def test_export_data_csv(self, auth_headers):
        """Test exporting data as CSV"""
        test_data = [
            {"name": "Item 1", "value": 100},
            {"name": "Item 2", "value": 200}
        ]
        
        response = client.post(
            "/api/v1/export/data?format=csv",
            json=test_data,
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["format"] == "csv"
        assert "content" in data

# Notification Tests
class TestNotifications:
    def test_get_notifications(self, auth_headers):
        """Test getting notifications"""
        response = client.get(
            "/api/v1/notifications",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "notifications" in data
        assert "unread_count" in data

# Performance Tests
class TestPerformance:
    def test_dashboard_list_performance(self, auth_headers):
        """Test dashboard list endpoint performance"""
        import time
        start = time.time()
        response = client.get("/api/v1/dashboards", headers=auth_headers)
        end = time.time()
        
        assert response.status_code == 200
        assert (end - start) < 1.0  # Should respond in under 1 second
        
    def test_concurrent_requests(self, auth_headers):
        """Test handling concurrent requests"""
        import concurrent.futures
        
        def make_request():
            return client.get("/api/v1/dashboards", headers=auth_headers)
        
        with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
            futures = [executor.submit(make_request) for _ in range(10)]
            results = [f.result() for f in concurrent.futures.as_completed(futures)]
            
        assert all(r.status_code == 200 for r in results)

# Security Tests
class TestSecurity:
    def test_unauthorized_access(self):
        """Test accessing protected endpoints without auth"""
        response = client.get("/api/v1/dashboards")
        assert response.status_code == 401
        
    def test_sql_injection_protection(self, auth_headers):
        """Test SQL injection protection"""
        malicious_input = "'; DROP TABLE users; --"
        response = client.get(
            f"/api/v1/dashboards?search={malicious_input}",
            headers=auth_headers
        )
        # Should handle gracefully without executing injection
        assert response.status_code in [200, 400]
        
    def test_xss_protection(self, auth_headers):
        """Test XSS protection"""
        xss_payload = "<script>alert('XSS')</script>"
        response = client.post(
            "/api/v1/dashboards",
            json={"name": xss_payload, "description": "Test"},
            headers=auth_headers
        )
        # Should sanitize or reject malicious input
        if response.status_code == 201:
            data = response.json()
            assert "<script>" not in data["name"]

# Integration Tests
class TestIntegration:
    def test_full_dashboard_workflow(self, auth_headers, test_dashboard):
        """Test complete dashboard workflow"""
        # Create dashboard
        create_response = client.post(
            "/api/v1/dashboards",
            json=test_dashboard,
            headers=auth_headers
        )
        assert create_response.status_code == 201
        dashboard_id = create_response.json()["id"]
        
        # Add widget
        widget_data = {
            "dashboard_id": dashboard_id,
            "type": "bar-chart",
            "config": {"title": "Test Widget"}
        }
        widget_response = client.post(
            f"/api/v1/dashboards/{dashboard_id}/widgets",
            json=widget_data,
            headers=auth_headers
        )
        assert widget_response.status_code in [200, 201]
        
        # Export dashboard
        export_response = client.get(
            f"/api/v1/export/dashboard/{dashboard_id}?format=json",
            headers=auth_headers
        )
        assert export_response.status_code == 200
        
        # Delete dashboard
        delete_response = client.delete(
            f"/api/v1/dashboards/{dashboard_id}",
            headers=auth_headers
        )
        assert delete_response.status_code == 204

if __name__ == "__main__":
    pytest.main([__file__, "-v"])
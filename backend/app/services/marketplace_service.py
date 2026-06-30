"""
Widget Marketplace Service for sharing and discovering widgets
"""

from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
import json
import uuid
from app.models.user import User
from app.models.organization import Organization

class MarketplaceService:
    """Service for managing the widget marketplace"""
    
    def __init__(self, db: Session):
        self.db = db
        
    async def publish_widget(
        self,
        widget_data: Dict[str, Any],
        user_id: str,
        organization_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Publish a widget to the marketplace
        
        Args:
            widget_data: Widget configuration and metadata
            user_id: ID of the publishing user
            organization_id: Optional organization ID for private widgets
        """
        widget_id = str(uuid.uuid4())
        
        marketplace_widget = {
            "id": widget_id,
            "name": widget_data.get("name"),
            "description": widget_data.get("description"),
            "category": widget_data.get("category", "Custom"),
            "type": widget_data.get("type"),
            "config": widget_data.get("config", {}),
            "preview_image": widget_data.get("preview_image"),
            "tags": widget_data.get("tags", []),
            "author_id": user_id,
            "organization_id": organization_id,
            "is_public": widget_data.get("is_public", True),
            "is_premium": widget_data.get("is_premium", False),
            "price": widget_data.get("price", 0),
            "version": widget_data.get("version", "1.0.0"),
            "compatibility": widget_data.get("compatibility", ["all"]),
            "dependencies": widget_data.get("dependencies", []),
            "downloads": 0,
            "rating": 0,
            "rating_count": 0,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
            "status": "published"
        }
        
        # Store in database (simplified - would use proper model)
        # self.db.add(MarketplaceWidget(**marketplace_widget))
        # self.db.commit()
        
        return {
            "success": True,
            "widget_id": widget_id,
            "message": "Widget published successfully",
            "marketplace_url": f"/marketplace/widgets/{widget_id}"
        }
        
    async def search_widgets(
        self,
        query: Optional[str] = None,
        category: Optional[str] = None,
        tags: Optional[List[str]] = None,
        sort_by: str = "popularity",
        limit: int = 50,
        offset: int = 0
    ) -> Dict[str, Any]:
        """
        Search for widgets in the marketplace
        
        Args:
            query: Search query string
            category: Filter by category
            tags: Filter by tags
            sort_by: Sort criteria (popularity, rating, newest, downloads)
            limit: Maximum number of results
            offset: Pagination offset
        """
        # Mock data for demonstration
        widgets = [
            {
                "id": "widget-1",
                "name": "Advanced Sales Dashboard",
                "description": "Comprehensive sales analytics with real-time updates",
                "category": "Analytics",
                "type": "dashboard",
                "author": "DataChart Team",
                "downloads": 15234,
                "rating": 4.8,
                "price": 0,
                "is_premium": False,
                "preview_image": "/images/sales-dashboard.png",
                "tags": ["sales", "analytics", "real-time"]
            },
            {
                "id": "widget-2",
                "name": "Customer Sentiment Analyzer",
                "description": "AI-powered sentiment analysis for customer feedback",
                "category": "AI/ML",
                "type": "analyzer",
                "author": "AI Labs",
                "downloads": 8921,
                "rating": 4.6,
                "price": 49.99,
                "is_premium": True,
                "preview_image": "/images/sentiment-analyzer.png",
                "tags": ["ai", "sentiment", "customer", "nlp"]
            },
            {
                "id": "widget-3",
                "name": "Financial KPI Tracker",
                "description": "Track key financial metrics with customizable alerts",
                "category": "Finance",
                "type": "kpi",
                "author": "FinTech Solutions",
                "downloads": 12456,
                "rating": 4.9,
                "price": 29.99,
                "is_premium": True,
                "preview_image": "/images/financial-kpi.png",
                "tags": ["finance", "kpi", "metrics", "alerts"]
            },
            {
                "id": "widget-4",
                "name": "Inventory Management Grid",
                "description": "Real-time inventory tracking with predictive analytics",
                "category": "Operations",
                "type": "grid",
                "author": "Supply Chain Pro",
                "downloads": 6789,
                "rating": 4.5,
                "price": 0,
                "is_premium": False,
                "preview_image": "/images/inventory-grid.png",
                "tags": ["inventory", "supply-chain", "operations"]
            },
            {
                "id": "widget-5",
                "name": "Team Performance Heatmap",
                "description": "Visualize team productivity and performance metrics",
                "category": "HR",
                "type": "heatmap",
                "author": "HR Analytics",
                "downloads": 9234,
                "rating": 4.7,
                "price": 19.99,
                "is_premium": True,
                "preview_image": "/images/team-heatmap.png",
                "tags": ["hr", "performance", "team", "productivity"]
            }
        ]
        
        # Filter by category
        if category:
            widgets = [w for w in widgets if w["category"].lower() == category.lower()]
            
        # Filter by tags
        if tags:
            widgets = [w for w in widgets if any(tag in w["tags"] for tag in tags)]
            
        # Search in name and description
        if query:
            query_lower = query.lower()
            widgets = [
                w for w in widgets 
                if query_lower in w["name"].lower() or query_lower in w["description"].lower()
            ]
            
        # Sort
        if sort_by == "downloads":
            widgets.sort(key=lambda x: x["downloads"], reverse=True)
        elif sort_by == "rating":
            widgets.sort(key=lambda x: x["rating"], reverse=True)
        elif sort_by == "price":
            widgets.sort(key=lambda x: x["price"])
            
        # Paginate
        total = len(widgets)
        widgets = widgets[offset:offset + limit]
        
        return {
            "widgets": widgets,
            "total": total,
            "limit": limit,
            "offset": offset,
            "has_more": offset + limit < total
        }
        
    async def get_widget_details(self, widget_id: str) -> Dict[str, Any]:
        """Get detailed information about a widget"""
        # Mock detailed widget data
        return {
            "id": widget_id,
            "name": "Advanced Sales Dashboard",
            "description": "Comprehensive sales analytics with real-time updates",
            "long_description": """
            This advanced sales dashboard provides comprehensive insights into your sales performance.
            Features include:
            - Real-time sales tracking
            - Revenue forecasting
            - Customer segmentation
            - Product performance analysis
            - Team performance metrics
            - Customizable date ranges
            - Export capabilities
            """,
            "category": "Analytics",
            "type": "dashboard",
            "author": {
                "id": "author-123",
                "name": "DataChart Team",
                "verified": True,
                "widgets_published": 15
            },
            "version": "2.3.1",
            "last_updated": datetime.utcnow().isoformat(),
            "downloads": 15234,
            "rating": 4.8,
            "rating_count": 342,
            "reviews": [
                {
                    "user": "John D.",
                    "rating": 5,
                    "comment": "Excellent dashboard! Exactly what we needed.",
                    "date": "2024-01-15"
                },
                {
                    "user": "Sarah M.",
                    "rating": 4,
                    "comment": "Great features, could use more customization options.",
                    "date": "2024-01-10"
                }
            ],
            "screenshots": [
                "/images/sales-dashboard-1.png",
                "/images/sales-dashboard-2.png",
                "/images/sales-dashboard-3.png"
            ],
            "requirements": {
                "min_version": "1.0.0",
                "data_sources": ["postgresql", "mysql", "api"],
                "dependencies": ["chart.js", "d3.js"]
            },
            "pricing": {
                "model": "free",
                "price": 0,
                "license": "MIT"
            },
            "installation_guide": """
            1. Click 'Install Widget'
            2. Select target dashboard
            3. Configure data source
            4. Customize appearance
            5. Save and deploy
            """,
            "changelog": [
                {
                    "version": "2.3.1",
                    "date": "2024-01-20",
                    "changes": ["Fixed date range selector", "Improved performance"]
                },
                {
                    "version": "2.3.0",
                    "date": "2024-01-10",
                    "changes": ["Added export to PDF", "New color schemes"]
                }
            ]
        }
        
    async def install_widget(
        self,
        widget_id: str,
        user_id: str,
        dashboard_id: str,
        config: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Install a widget from the marketplace
        
        Args:
            widget_id: ID of the widget to install
            user_id: ID of the installing user
            dashboard_id: Target dashboard ID
            config: Optional configuration overrides
        """
        # Get widget details
        widget = await self.get_widget_details(widget_id)
        
        # Check permissions and licensing
        # ... validation logic ...
        
        # Create widget instance
        instance_id = str(uuid.uuid4())
        widget_instance = {
            "id": instance_id,
            "marketplace_widget_id": widget_id,
            "dashboard_id": dashboard_id,
            "user_id": user_id,
            "config": config or widget.get("default_config", {}),
            "installed_at": datetime.utcnow().isoformat(),
            "status": "active"
        }
        
        # Update download count
        # ... update logic ...
        
        return {
            "success": True,
            "instance_id": instance_id,
            "message": "Widget installed successfully",
            "dashboard_url": f"/dashboards/{dashboard_id}"
        }
        
    async def rate_widget(
        self,
        widget_id: str,
        user_id: str,
        rating: int,
        review: Optional[str] = None
    ) -> Dict[str, Any]:
        """Rate and review a widget"""
        if rating < 1 or rating > 5:
            return {
                "success": False,
                "error": "Rating must be between 1 and 5"
            }
            
        # Store rating
        rating_id = str(uuid.uuid4())
        widget_rating = {
            "id": rating_id,
            "widget_id": widget_id,
            "user_id": user_id,
            "rating": rating,
            "review": review,
            "created_at": datetime.utcnow().isoformat()
        }
        
        # Update widget average rating
        # ... calculation logic ...
        
        return {
            "success": True,
            "rating_id": rating_id,
            "message": "Rating submitted successfully"
        }
        
    async def get_trending_widgets(self, period: str = "week") -> List[Dict[str, Any]]:
        """Get trending widgets for a specific period"""
        # Calculate trending based on downloads, ratings, and recency
        trending = [
            {
                "id": "widget-1",
                "name": "AI Sales Predictor",
                "category": "AI/ML",
                "trend_score": 95,
                "downloads_increase": "+45%",
                "position_change": 3
            },
            {
                "id": "widget-2",
                "name": "Real-time Analytics",
                "category": "Analytics",
                "trend_score": 89,
                "downloads_increase": "+32%",
                "position_change": 1
            },
            {
                "id": "widget-3",
                "name": "Customer Journey Map",
                "category": "Marketing",
                "trend_score": 87,
                "downloads_increase": "+28%",
                "position_change": 5
            }
        ]
        
        return trending
        
    async def get_recommendations(
        self,
        user_id: str,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """Get personalized widget recommendations for a user"""
        # Based on user's history, similar users, and popular widgets
        recommendations = [
            {
                "id": "widget-rec-1",
                "name": "Supply Chain Optimizer",
                "reason": "Based on your interest in operations",
                "match_score": 92
            },
            {
                "id": "widget-rec-2",
                "name": "Employee Engagement Tracker",
                "reason": "Popular in your industry",
                "match_score": 88
            },
            {
                "id": "widget-rec-3",
                "name": "Budget Forecaster",
                "reason": "Complements your Financial KPI Tracker",
                "match_score": 85
            }
        ]
        
        return recommendations[:limit]
        
    async def get_developer_stats(self, developer_id: str) -> Dict[str, Any]:
        """Get statistics for a widget developer"""
        return {
            "developer_id": developer_id,
            "total_widgets": 15,
            "total_downloads": 145678,
            "total_revenue": 12456.78,
            "average_rating": 4.6,
            "top_widgets": [
                {"name": "Sales Dashboard", "downloads": 45234},
                {"name": "Analytics Suite", "downloads": 32145},
                {"name": "KPI Tracker", "downloads": 28976}
            ],
            "monthly_stats": [
                {"month": "Jan 2024", "downloads": 12345, "revenue": 2345.67},
                {"month": "Dec 2023", "downloads": 11234, "revenue": 2123.45},
                {"month": "Nov 2023", "downloads": 10987, "revenue": 1987.65}
            ],
            "categories": {
                "Analytics": 6,
                "Finance": 4,
                "Operations": 3,
                "HR": 2
            }
        }

class NotificationService:
    """Service for managing notifications"""
    
    def __init__(self, db: Session):
        self.db = db
        self.notification_queue = []
        
    async def create_notification(
        self,
        user_id: Optional[str] = None,
        organization_id: Optional[str] = None,
        type: str = "info",
        title: str = "",
        message: str = "",
        data: Optional[Dict[str, Any]] = None,
        priority: str = "normal",
        expires_at: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """Create a new notification"""
        notification_id = str(uuid.uuid4())
        
        notification = {
            "id": notification_id,
            "user_id": user_id,
            "organization_id": organization_id,
            "type": type,  # info, warning, error, success, alert
            "title": title,
            "message": message,
            "data": data or {},
            "priority": priority,  # low, normal, high, urgent
            "status": "unread",
            "created_at": datetime.utcnow().isoformat(),
            "expires_at": expires_at.isoformat() if expires_at else None,
            "read_at": None,
            "dismissed_at": None
        }
        
        # Store notification
        self.notification_queue.append(notification)
        
        # Send real-time notification via WebSocket
        from app.services.websocket_service import WebSocketEventHandler
        asyncio.create_task(
            WebSocketEventHandler.handle_notification(
                user_id=user_id,
                organization_id=organization_id,
                notification=notification
            )
        )
        
        return {
            "success": True,
            "notification_id": notification_id,
            "message": "Notification created"
        }
        
    async def get_notifications(
        self,
        user_id: str,
        status: Optional[str] = None,
        limit: int = 50,
        offset: int = 0
    ) -> Dict[str, Any]:
        """Get notifications for a user"""
        # Filter notifications
        notifications = [
            n for n in self.notification_queue
            if n["user_id"] == user_id
        ]
        
        if status:
            notifications = [n for n in notifications if n["status"] == status]
            
        # Sort by creation date (newest first)
        notifications.sort(key=lambda x: x["created_at"], reverse=True)
        
        # Paginate
        total = len(notifications)
        notifications = notifications[offset:offset + limit]
        
        return {
            "notifications": notifications,
            "total": total,
            "unread_count": sum(1 for n in self.notification_queue 
                              if n["user_id"] == user_id and n["status"] == "unread"),
            "limit": limit,
            "offset": offset
        }
        
    async def mark_as_read(
        self,
        notification_id: str,
        user_id: str
    ) -> Dict[str, Any]:
        """Mark a notification as read"""
        for notification in self.notification_queue:
            if notification["id"] == notification_id and notification["user_id"] == user_id:
                notification["status"] = "read"
                notification["read_at"] = datetime.utcnow().isoformat()
                return {"success": True, "message": "Notification marked as read"}
                
        return {"success": False, "error": "Notification not found"}
        
    async def mark_all_as_read(self, user_id: str) -> Dict[str, Any]:
        """Mark all notifications as read for a user"""
        count = 0
        for notification in self.notification_queue:
            if notification["user_id"] == user_id and notification["status"] == "unread":
                notification["status"] = "read"
                notification["read_at"] = datetime.utcnow().isoformat()
                count += 1
                
        return {
            "success": True,
            "message": f"Marked {count} notifications as read"
        }
        
    async def delete_notification(
        self,
        notification_id: str,
        user_id: str
    ) -> Dict[str, Any]:
        """Delete a notification"""
        self.notification_queue = [
            n for n in self.notification_queue
            if not (n["id"] == notification_id and n["user_id"] == user_id)
        ]
        
        return {"success": True, "message": "Notification deleted"}
        
    async def send_system_notification(
        self,
        title: str,
        message: str,
        type: str = "info"
    ) -> Dict[str, Any]:
        """Send a system-wide notification to all users"""
        # Create notification for all users
        # In production, this would query all active users
        
        notification = {
            "id": str(uuid.uuid4()),
            "type": type,
            "title": title,
            "message": message,
            "priority": "high",
            "created_at": datetime.utcnow().isoformat()
        }
        
        # Broadcast via WebSocket
        from app.services.websocket_service import WebSocketEventHandler
        asyncio.create_task(
            WebSocketEventHandler.handle_system_alert(notification)
        )
        
        return {
            "success": True,
            "message": "System notification sent"
        }

import asyncio
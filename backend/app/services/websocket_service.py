"""
WebSocket Service for Real-time Updates
"""

from typing import Dict, List, Set, Any, Optional
from fastapi import WebSocket, WebSocketDisconnect
from datetime import datetime
import json
import asyncio
from collections import defaultdict
import logging

logger = logging.getLogger(__name__)

class ConnectionManager:
    """Manages WebSocket connections for real-time updates"""
    
    def __init__(self):
        # Store active connections by user ID
        self.active_connections: Dict[str, List[WebSocket]] = defaultdict(list)
        # Store connections by dashboard ID for dashboard-specific updates
        self.dashboard_connections: Dict[str, Set[WebSocket]] = defaultdict(set)
        # Store connections by organization for org-wide updates
        self.org_connections: Dict[str, Set[WebSocket]] = defaultdict(set)
        # Connection metadata
        self.connection_info: Dict[WebSocket, Dict[str, Any]] = {}
        
    async def connect(
        self, 
        websocket: WebSocket, 
        user_id: str,
        organization_id: Optional[str] = None,
        dashboard_id: Optional[str] = None
    ):
        """Accept and register a new WebSocket connection"""
        await websocket.accept()
        
        # Store connection
        self.active_connections[user_id].append(websocket)
        
        # Store metadata
        self.connection_info[websocket] = {
            "user_id": user_id,
            "organization_id": organization_id,
            "dashboard_id": dashboard_id,
            "connected_at": datetime.utcnow().isoformat(),
            "last_ping": datetime.utcnow().isoformat()
        }
        
        # Add to dashboard connections if applicable
        if dashboard_id:
            self.dashboard_connections[dashboard_id].add(websocket)
            
        # Add to org connections if applicable
        if organization_id:
            self.org_connections[organization_id].add(websocket)
            
        # Send connection confirmation
        await self.send_personal_message(
            websocket,
            {
                "type": "connection",
                "status": "connected",
                "timestamp": datetime.utcnow().isoformat()
            }
        )
        
        logger.info(f"WebSocket connected: User {user_id}, Dashboard {dashboard_id}")
        
    def disconnect(self, websocket: WebSocket):
        """Remove a WebSocket connection"""
        info = self.connection_info.get(websocket)
        
        if info:
            user_id = info["user_id"]
            dashboard_id = info.get("dashboard_id")
            organization_id = info.get("organization_id")
            
            # Remove from active connections
            if user_id in self.active_connections:
                if websocket in self.active_connections[user_id]:
                    self.active_connections[user_id].remove(websocket)
                if not self.active_connections[user_id]:
                    del self.active_connections[user_id]
                    
            # Remove from dashboard connections
            if dashboard_id and dashboard_id in self.dashboard_connections:
                self.dashboard_connections[dashboard_id].discard(websocket)
                if not self.dashboard_connections[dashboard_id]:
                    del self.dashboard_connections[dashboard_id]
                    
            # Remove from org connections
            if organization_id and organization_id in self.org_connections:
                self.org_connections[organization_id].discard(websocket)
                if not self.org_connections[organization_id]:
                    del self.org_connections[organization_id]
                    
            # Remove metadata
            del self.connection_info[websocket]
            
            logger.info(f"WebSocket disconnected: User {user_id}")
            
    async def send_personal_message(self, websocket: WebSocket, message: Dict[str, Any]):
        """Send a message to a specific connection"""
        try:
            await websocket.send_json(message)
        except Exception as e:
            logger.error(f"Error sending message: {e}")
            self.disconnect(websocket)
            
    async def send_user_message(self, user_id: str, message: Dict[str, Any]):
        """Send a message to all connections for a specific user"""
        if user_id in self.active_connections:
            disconnected = []
            for connection in self.active_connections[user_id]:
                try:
                    await connection.send_json(message)
                except:
                    disconnected.append(connection)
                    
            # Clean up disconnected connections
            for conn in disconnected:
                self.disconnect(conn)
                
    async def broadcast_dashboard(self, dashboard_id: str, message: Dict[str, Any]):
        """Broadcast a message to all users viewing a specific dashboard"""
        if dashboard_id in self.dashboard_connections:
            disconnected = []
            for connection in self.dashboard_connections[dashboard_id].copy():
                try:
                    await connection.send_json(message)
                except:
                    disconnected.append(connection)
                    
            # Clean up disconnected connections
            for conn in disconnected:
                self.disconnect(conn)
                
    async def broadcast_organization(self, organization_id: str, message: Dict[str, Any]):
        """Broadcast a message to all users in an organization"""
        if organization_id in self.org_connections:
            disconnected = []
            for connection in self.org_connections[organization_id].copy():
                try:
                    await connection.send_json(message)
                except:
                    disconnected.append(connection)
                    
            # Clean up disconnected connections
            for conn in disconnected:
                self.disconnect(conn)
                
    async def broadcast_all(self, message: Dict[str, Any]):
        """Broadcast a message to all connected clients"""
        all_connections = set()
        for connections in self.active_connections.values():
            all_connections.update(connections)
            
        disconnected = []
        for connection in all_connections:
            try:
                await connection.send_json(message)
            except:
                disconnected.append(connection)
                
        # Clean up disconnected connections
        for conn in disconnected:
            self.disconnect(conn)
            
    async def handle_ping(self, websocket: WebSocket):
        """Handle ping message to keep connection alive"""
        if websocket in self.connection_info:
            self.connection_info[websocket]["last_ping"] = datetime.utcnow().isoformat()
            await self.send_personal_message(websocket, {"type": "pong"})
            
    def get_connection_stats(self) -> Dict[str, Any]:
        """Get statistics about current connections"""
        total_connections = sum(len(conns) for conns in self.active_connections.values())
        return {
            "total_connections": total_connections,
            "unique_users": len(self.active_connections),
            "active_dashboards": len(self.dashboard_connections),
            "organizations": len(self.org_connections),
            "connections_by_user": {
                user_id: len(conns) 
                for user_id, conns in self.active_connections.items()
            }
        }

# Global connection manager instance
manager = ConnectionManager()

class WebSocketEventHandler:
    """Handles different types of WebSocket events"""
    
    @staticmethod
    async def handle_dashboard_update(dashboard_id: str, update_data: Dict[str, Any]):
        """Handle dashboard update events"""
        message = {
            "type": "dashboard_update",
            "dashboard_id": dashboard_id,
            "data": update_data,
            "timestamp": datetime.utcnow().isoformat()
        }
        await manager.broadcast_dashboard(dashboard_id, message)
        
    @staticmethod
    async def handle_widget_update(dashboard_id: str, widget_id: str, update_data: Dict[str, Any]):
        """Handle widget update events"""
        message = {
            "type": "widget_update",
            "dashboard_id": dashboard_id,
            "widget_id": widget_id,
            "data": update_data,
            "timestamp": datetime.utcnow().isoformat()
        }
        await manager.broadcast_dashboard(dashboard_id, message)
        
    @staticmethod
    async def handle_data_refresh(dashboard_id: str, data_source_id: str, new_data: Any):
        """Handle data refresh events"""
        message = {
            "type": "data_refresh",
            "dashboard_id": dashboard_id,
            "data_source_id": data_source_id,
            "data": new_data,
            "timestamp": datetime.utcnow().isoformat()
        }
        await manager.broadcast_dashboard(dashboard_id, message)
        
    @staticmethod
    async def handle_collaboration_event(
        dashboard_id: str, 
        user_id: str, 
        event_type: str, 
        data: Any
    ):
        """Handle collaboration events (cursor position, selections, etc.)"""
        message = {
            "type": "collaboration",
            "event_type": event_type,
            "dashboard_id": dashboard_id,
            "user_id": user_id,
            "data": data,
            "timestamp": datetime.utcnow().isoformat()
        }
        await manager.broadcast_dashboard(dashboard_id, message)
        
    @staticmethod
    async def handle_notification(
        user_id: Optional[str] = None,
        organization_id: Optional[str] = None,
        notification: Dict[str, Any] = None
    ):
        """Handle notification events"""
        message = {
            "type": "notification",
            "notification": notification,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        if user_id:
            await manager.send_user_message(user_id, message)
        elif organization_id:
            await manager.broadcast_organization(organization_id, message)
        else:
            await manager.broadcast_all(message)
            
    @staticmethod
    async def handle_system_alert(alert_data: Dict[str, Any]):
        """Handle system-wide alerts"""
        message = {
            "type": "system_alert",
            "alert": alert_data,
            "timestamp": datetime.utcnow().isoformat()
        }
        await manager.broadcast_all(message)

class RealtimeDataService:
    """Service for managing real-time data updates"""
    
    def __init__(self):
        self.update_intervals: Dict[str, int] = {}  # Dashboard ID to update interval
        self.update_tasks: Dict[str, asyncio.Task] = {}  # Active update tasks
        
    async def start_data_stream(
        self, 
        dashboard_id: str, 
        data_sources: List[str], 
        interval: int = 5
    ):
        """Start streaming data updates for a dashboard"""
        if dashboard_id in self.update_tasks:
            self.update_tasks[dashboard_id].cancel()
            
        self.update_intervals[dashboard_id] = interval
        
        async def update_loop():
            while True:
                try:
                    # Fetch latest data for each data source
                    for data_source_id in data_sources:
                        # Simulate data fetch (replace with actual data fetching)
                        new_data = await self.fetch_latest_data(data_source_id)
                        await WebSocketEventHandler.handle_data_refresh(
                            dashboard_id, 
                            data_source_id, 
                            new_data
                        )
                    await asyncio.sleep(interval)
                except asyncio.CancelledError:
                    break
                except Exception as e:
                    logger.error(f"Error in data stream for dashboard {dashboard_id}: {e}")
                    await asyncio.sleep(interval)
                    
        self.update_tasks[dashboard_id] = asyncio.create_task(update_loop())
        
    async def stop_data_stream(self, dashboard_id: str):
        """Stop streaming data updates for a dashboard"""
        if dashboard_id in self.update_tasks:
            self.update_tasks[dashboard_id].cancel()
            del self.update_tasks[dashboard_id]
            del self.update_intervals[dashboard_id]
            
    async def fetch_latest_data(self, data_source_id: str) -> Any:
        """Fetch latest data from a data source"""
        # This would connect to actual data sources
        # For now, return mock data
        import random
        return {
            "value": random.randint(100, 1000),
            "trend": random.choice(["up", "down", "stable"]),
            "change": round(random.uniform(-10, 10), 2)
        }
        
    def get_active_streams(self) -> Dict[str, Any]:
        """Get information about active data streams"""
        return {
            "active_streams": len(self.update_tasks),
            "dashboards": list(self.update_tasks.keys()),
            "intervals": self.update_intervals
        }

# Global realtime data service instance
realtime_service = RealtimeDataService()
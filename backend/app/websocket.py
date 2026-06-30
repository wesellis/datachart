from fastapi import WebSocket, WebSocketDisconnect
from typing import Dict, List
import json
import uuid
from datetime import datetime
import asyncio

class ConnectionManager:
    """Manages WebSocket connections for real-time collaboration"""
    
    def __init__(self):
        # Dictionary to store active connections by dashboard_id
        self.active_connections: Dict[str, List[WebSocket]] = {}
        # Dictionary to store user info for each connection
        self.connection_info: Dict[WebSocket, dict] = {}
        # Dictionary to store dashboard cursors/selections
        self.dashboard_state: Dict[str, dict] = {}
    
    async def connect(self, websocket: WebSocket, dashboard_id: str, user_id: str, user_name: str):
        """Accept a new WebSocket connection"""
        await websocket.accept()
        
        # Add to connections
        if dashboard_id not in self.active_connections:
            self.active_connections[dashboard_id] = []
        
        self.active_connections[dashboard_id].append(websocket)
        
        # Store user info
        self.connection_info[websocket] = {
            "user_id": user_id,
            "user_name": user_name,
            "dashboard_id": dashboard_id,
            "connected_at": datetime.utcnow().isoformat(),
            "cursor": None,
            "selection": None
        }
        
        # Initialize dashboard state if needed
        if dashboard_id not in self.dashboard_state:
            self.dashboard_state[dashboard_id] = {
                "users": {},
                "widgets": {},
                "changes": []
            }
        
        # Add user to dashboard state
        self.dashboard_state[dashboard_id]["users"][user_id] = {
            "name": user_name,
            "connected_at": datetime.utcnow().isoformat(),
            "cursor": None,
            "selection": None
        }
        
        # Notify other users about new connection
        await self.broadcast_to_dashboard(dashboard_id, {
            "type": "user_joined",
            "user_id": user_id,
            "user_name": user_name,
            "timestamp": datetime.utcnow().isoformat()
        }, exclude=websocket)
        
        # Send current state to new user
        await self.send_personal_message(websocket, {
            "type": "initial_state",
            "dashboard_state": self.dashboard_state[dashboard_id],
            "connected_users": list(self.dashboard_state[dashboard_id]["users"].keys())
        })
    
    def disconnect(self, websocket: WebSocket):
        """Handle WebSocket disconnection"""
        if websocket in self.connection_info:
            user_info = self.connection_info[websocket]
            dashboard_id = user_info["dashboard_id"]
            user_id = user_info["user_id"]
            
            # Remove from connections
            if dashboard_id in self.active_connections:
                if websocket in self.active_connections[dashboard_id]:
                    self.active_connections[dashboard_id].remove(websocket)
                
                # Clean up empty dashboard connections
                if not self.active_connections[dashboard_id]:
                    del self.active_connections[dashboard_id]
            
            # Remove from dashboard state
            if dashboard_id in self.dashboard_state:
                if user_id in self.dashboard_state[dashboard_id]["users"]:
                    del self.dashboard_state[dashboard_id]["users"][user_id]
                
                # Notify other users about disconnection
                asyncio.create_task(self.broadcast_to_dashboard(dashboard_id, {
                    "type": "user_left",
                    "user_id": user_id,
                    "user_name": user_info["user_name"],
                    "timestamp": datetime.utcnow().isoformat()
                }))
            
            # Remove connection info
            del self.connection_info[websocket]
    
    async def send_personal_message(self, websocket: WebSocket, message: dict):
        """Send message to specific connection"""
        try:
            await websocket.send_text(json.dumps(message))
        except Exception as e:
            print(f"Error sending message: {e}")
    
    async def broadcast_to_dashboard(self, dashboard_id: str, message: dict, exclude: WebSocket = None):
        """Broadcast message to all connections for a dashboard"""
        if dashboard_id not in self.active_connections:
            return
        
        # Add timestamp if not present
        if "timestamp" not in message:
            message["timestamp"] = datetime.utcnow().isoformat()
        
        disconnected = []
        for connection in self.active_connections[dashboard_id]:
            if connection == exclude:
                continue
            try:
                await connection.send_text(json.dumps(message))
            except WebSocketDisconnect:
                disconnected.append(connection)
            except Exception as e:
                print(f"Error broadcasting to connection: {e}")
                disconnected.append(connection)
        
        # Clean up disconnected connections
        for connection in disconnected:
            self.disconnect(connection)
    
    async def handle_message(self, websocket: WebSocket, message: dict):
        """Handle incoming WebSocket messages"""
        if websocket not in self.connection_info:
            return
        
        user_info = self.connection_info[websocket]
        dashboard_id = user_info["dashboard_id"]
        user_id = user_info["user_id"]
        
        message_type = message.get("type")
        
        if message_type == "cursor_move":
            # Update cursor position
            cursor = message.get("cursor", {})
            self.dashboard_state[dashboard_id]["users"][user_id]["cursor"] = cursor
            
            # Broadcast cursor position to other users
            await self.broadcast_to_dashboard(dashboard_id, {
                "type": "cursor_update",
                "user_id": user_id,
                "cursor": cursor
            }, exclude=websocket)
        
        elif message_type == "widget_select":
            # Update selection
            widget_id = message.get("widget_id")
            self.dashboard_state[dashboard_id]["users"][user_id]["selection"] = widget_id
            
            # Broadcast selection to other users
            await self.broadcast_to_dashboard(dashboard_id, {
                "type": "selection_update",
                "user_id": user_id,
                "user_name": user_info["user_name"],
                "widget_id": widget_id
            }, exclude=websocket)
        
        elif message_type == "widget_change":
            # Handle widget modifications
            widget_id = message.get("widget_id")
            changes = message.get("changes", {})
            
            # Store change in dashboard state
            change_id = str(uuid.uuid4())
            change_record = {
                "id": change_id,
                "widget_id": widget_id,
                "changes": changes,
                "user_id": user_id,
                "user_name": user_info["user_name"],
                "timestamp": datetime.utcnow().isoformat()
            }
            
            self.dashboard_state[dashboard_id]["changes"].append(change_record)
            
            # Broadcast change to other users
            await self.broadcast_to_dashboard(dashboard_id, {
                "type": "widget_updated",
                "widget_id": widget_id,
                "changes": changes,
                "change_id": change_id,
                "user_id": user_id,
                "user_name": user_info["user_name"]
            }, exclude=websocket)
        
        elif message_type == "widget_add":
            # Handle widget additions
            widget_data = message.get("widget", {})
            
            # Store widget in dashboard state
            widget_id = widget_data.get("id", str(uuid.uuid4()))
            self.dashboard_state[dashboard_id]["widgets"][widget_id] = widget_data
            
            # Broadcast new widget to other users
            await self.broadcast_to_dashboard(dashboard_id, {
                "type": "widget_added",
                "widget": widget_data,
                "user_id": user_id,
                "user_name": user_info["user_name"]
            }, exclude=websocket)
        
        elif message_type == "widget_delete":
            # Handle widget deletions
            widget_id = message.get("widget_id")
            
            # Remove widget from dashboard state
            if widget_id in self.dashboard_state[dashboard_id]["widgets"]:
                del self.dashboard_state[dashboard_id]["widgets"][widget_id]
            
            # Broadcast deletion to other users
            await self.broadcast_to_dashboard(dashboard_id, {
                "type": "widget_deleted",
                "widget_id": widget_id,
                "user_id": user_id,
                "user_name": user_info["user_name"]
            }, exclude=websocket)
        
        elif message_type == "chat_message":
            # Handle chat messages
            chat_message = message.get("message", "")
            
            # Broadcast chat to all users
            await self.broadcast_to_dashboard(dashboard_id, {
                "type": "chat_message",
                "message": chat_message,
                "user_id": user_id,
                "user_name": user_info["user_name"],
                "timestamp": datetime.utcnow().isoformat()
            })
        
        elif message_type == "ping":
            # Respond to ping with pong
            await self.send_personal_message(websocket, {
                "type": "pong",
                "timestamp": datetime.utcnow().isoformat()
            })
    
    def get_dashboard_users(self, dashboard_id: str) -> List[dict]:
        """Get list of users currently connected to a dashboard"""
        if dashboard_id not in self.dashboard_state:
            return []
        
        return [
            {
                "user_id": user_id,
                "user_name": user_info["name"],
                "connected_at": user_info["connected_at"],
                "cursor": user_info.get("cursor"),
                "selection": user_info.get("selection")
            }
            for user_id, user_info in self.dashboard_state[dashboard_id]["users"].items()
        ]
    
    def get_connection_count(self) -> int:
        """Get total number of active connections"""
        return sum(len(connections) for connections in self.active_connections.values())
    
    def get_dashboard_count(self) -> int:
        """Get number of dashboards with active connections"""
        return len(self.active_connections)

# Global connection manager instance
manager = ConnectionManager()
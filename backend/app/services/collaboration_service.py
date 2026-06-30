"""
Team Collaboration Service for real-time collaboration features
"""

from typing import Dict, List, Optional, Any, Set
from datetime import datetime, timedelta
from dataclasses import dataclass
import json
import uuid
from collections import defaultdict
import asyncio

@dataclass
class CollaboratorSession:
    """Represents an active collaborator session"""
    user_id: str
    user_name: str
    user_email: str
    dashboard_id: str
    session_id: str
    cursor_position: Optional[Dict[str, float]] = None
    selected_widget: Optional[str] = None
    color: str = "#3b82f6"
    is_active: bool = True
    last_activity: datetime = None
    permissions: List[str] = None

class CollaborationService:
    """Service for managing real-time collaboration"""
    
    def __init__(self):
        # Active sessions by dashboard
        self.active_sessions: Dict[str, Dict[str, CollaboratorSession]] = defaultdict(dict)
        # Collaboration history
        self.history: List[Dict[str, Any]] = []
        # Locks for widgets
        self.widget_locks: Dict[str, str] = {}  # widget_id -> user_id
        # Comments
        self.comments: Dict[str, List[Dict[str, Any]]] = defaultdict(list)
        # Presence tracking
        self.user_presence: Dict[str, str] = {}  # user_id -> status
        
    async def join_session(
        self,
        dashboard_id: str,
        user_id: str,
        user_name: str,
        user_email: str,
        permissions: List[str] = None
    ) -> Dict[str, Any]:
        """Join a collaborative editing session"""
        session_id = str(uuid.uuid4())
        
        # Assign a unique color for the user
        colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"]
        existing_colors = [s.color for s in self.active_sessions[dashboard_id].values()]
        available_colors = [c for c in colors if c not in existing_colors]
        user_color = available_colors[0] if available_colors else colors[0]
        
        session = CollaboratorSession(
            user_id=user_id,
            user_name=user_name,
            user_email=user_email,
            dashboard_id=dashboard_id,
            session_id=session_id,
            color=user_color,
            last_activity=datetime.utcnow(),
            permissions=permissions or ["view", "edit"]
        )
        
        self.active_sessions[dashboard_id][user_id] = session
        self.user_presence[user_id] = "active"
        
        # Notify other collaborators
        await self.broadcast_presence_update(dashboard_id, user_id, "joined")
        
        # Add to history
        self.add_to_history({
            "type": "session_join",
            "dashboard_id": dashboard_id,
            "user_id": user_id,
            "user_name": user_name,
            "timestamp": datetime.utcnow().isoformat()
        })
        
        return {
            "session_id": session_id,
            "color": user_color,
            "active_collaborators": self.get_active_collaborators(dashboard_id),
            "permissions": session.permissions
        }
        
    async def leave_session(self, dashboard_id: str, user_id: str) -> Dict[str, Any]:
        """Leave a collaborative editing session"""
        if dashboard_id in self.active_sessions:
            if user_id in self.active_sessions[dashboard_id]:
                session = self.active_sessions[dashboard_id][user_id]
                del self.active_sessions[dashboard_id][user_id]
                
                # Release any locks held by this user
                locks_released = []
                for widget_id, lock_user_id in list(self.widget_locks.items()):
                    if lock_user_id == user_id:
                        del self.widget_locks[widget_id]
                        locks_released.append(widget_id)
                        
                # Update presence
                self.user_presence[user_id] = "offline"
                
                # Notify other collaborators
                await self.broadcast_presence_update(dashboard_id, user_id, "left")
                
                # Add to history
                self.add_to_history({
                    "type": "session_leave",
                    "dashboard_id": dashboard_id,
                    "user_id": user_id,
                    "user_name": session.user_name,
                    "timestamp": datetime.utcnow().isoformat()
                })
                
                return {
                    "success": True,
                    "locks_released": locks_released,
                    "message": "Left collaboration session"
                }
                
        return {"success": False, "error": "Session not found"}
        
    async def update_cursor(
        self,
        dashboard_id: str,
        user_id: str,
        x: float,
        y: float
    ) -> None:
        """Update user's cursor position"""
        if dashboard_id in self.active_sessions:
            if user_id in self.active_sessions[dashboard_id]:
                session = self.active_sessions[dashboard_id][user_id]
                session.cursor_position = {"x": x, "y": y}
                session.last_activity = datetime.utcnow()
                
                # Broadcast cursor update to other users
                await self.broadcast_cursor_update(dashboard_id, user_id, x, y)
                
    async def select_widget(
        self,
        dashboard_id: str,
        user_id: str,
        widget_id: str
    ) -> Dict[str, Any]:
        """Select a widget for editing"""
        if dashboard_id in self.active_sessions:
            if user_id in self.active_sessions[dashboard_id]:
                session = self.active_sessions[dashboard_id][user_id]
                
                # Check if widget is locked by another user
                if widget_id in self.widget_locks:
                    if self.widget_locks[widget_id] != user_id:
                        locker_id = self.widget_locks[widget_id]
                        locker = self.active_sessions[dashboard_id].get(locker_id)
                        return {
                            "success": False,
                            "error": f"Widget is locked by {locker.user_name if locker else 'another user'}"
                        }
                        
                # Update selection
                session.selected_widget = widget_id
                session.last_activity = datetime.utcnow()
                
                # Broadcast selection update
                await self.broadcast_selection_update(dashboard_id, user_id, widget_id)
                
                return {"success": True, "widget_id": widget_id}
                
        return {"success": False, "error": "Session not found"}
        
    async def lock_widget(
        self,
        dashboard_id: str,
        user_id: str,
        widget_id: str
    ) -> Dict[str, Any]:
        """Lock a widget for exclusive editing"""
        if widget_id in self.widget_locks:
            if self.widget_locks[widget_id] != user_id:
                return {
                    "success": False,
                    "error": "Widget is already locked",
                    "locked_by": self.widget_locks[widget_id]
                }
                
        self.widget_locks[widget_id] = user_id
        
        # Broadcast lock update
        await self.broadcast_lock_update(dashboard_id, widget_id, user_id, True)
        
        # Add to history
        self.add_to_history({
            "type": "widget_lock",
            "dashboard_id": dashboard_id,
            "user_id": user_id,
            "widget_id": widget_id,
            "timestamp": datetime.utcnow().isoformat()
        })
        
        return {"success": True, "widget_id": widget_id, "locked": True}
        
    async def unlock_widget(
        self,
        dashboard_id: str,
        user_id: str,
        widget_id: str
    ) -> Dict[str, Any]:
        """Unlock a widget"""
        if widget_id in self.widget_locks:
            if self.widget_locks[widget_id] == user_id:
                del self.widget_locks[widget_id]
                
                # Broadcast unlock update
                await self.broadcast_lock_update(dashboard_id, widget_id, user_id, False)
                
                # Add to history
                self.add_to_history({
                    "type": "widget_unlock",
                    "dashboard_id": dashboard_id,
                    "user_id": user_id,
                    "widget_id": widget_id,
                    "timestamp": datetime.utcnow().isoformat()
                })
                
                return {"success": True, "widget_id": widget_id, "locked": False}
            else:
                return {"success": False, "error": "You don't have the lock for this widget"}
                
        return {"success": False, "error": "Widget is not locked"}
        
    async def add_comment(
        self,
        dashboard_id: str,
        user_id: str,
        user_name: str,
        comment_text: str,
        widget_id: Optional[str] = None,
        parent_id: Optional[str] = None,
        mentions: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """Add a comment to a dashboard or widget"""
        comment_id = str(uuid.uuid4())
        
        comment = {
            "id": comment_id,
            "dashboard_id": dashboard_id,
            "widget_id": widget_id,
            "user_id": user_id,
            "user_name": user_name,
            "text": comment_text,
            "parent_id": parent_id,
            "mentions": mentions or [],
            "created_at": datetime.utcnow().isoformat(),
            "edited_at": None,
            "resolved": False,
            "reactions": {}
        }
        
        self.comments[dashboard_id].append(comment)
        
        # Notify mentioned users
        if mentions:
            await self.notify_mentions(dashboard_id, user_name, comment_text, mentions)
            
        # Broadcast comment update
        await self.broadcast_comment_update(dashboard_id, comment)
        
        # Add to history
        self.add_to_history({
            "type": "comment_added",
            "dashboard_id": dashboard_id,
            "user_id": user_id,
            "comment_id": comment_id,
            "timestamp": datetime.utcnow().isoformat()
        })
        
        return {"success": True, "comment_id": comment_id, "comment": comment}
        
    async def resolve_comment(
        self,
        dashboard_id: str,
        comment_id: str,
        user_id: str
    ) -> Dict[str, Any]:
        """Mark a comment as resolved"""
        for comment in self.comments[dashboard_id]:
            if comment["id"] == comment_id:
                comment["resolved"] = True
                comment["resolved_by"] = user_id
                comment["resolved_at"] = datetime.utcnow().isoformat()
                
                # Broadcast update
                await self.broadcast_comment_update(dashboard_id, comment)
                
                return {"success": True, "comment_id": comment_id}
                
        return {"success": False, "error": "Comment not found"}
        
    async def add_reaction(
        self,
        dashboard_id: str,
        comment_id: str,
        user_id: str,
        reaction: str
    ) -> Dict[str, Any]:
        """Add a reaction to a comment"""
        for comment in self.comments[dashboard_id]:
            if comment["id"] == comment_id:
                if reaction not in comment["reactions"]:
                    comment["reactions"][reaction] = []
                    
                if user_id not in comment["reactions"][reaction]:
                    comment["reactions"][reaction].append(user_id)
                    
                    # Broadcast update
                    await self.broadcast_comment_update(dashboard_id, comment)
                    
                    return {"success": True, "comment_id": comment_id, "reaction": reaction}
                    
        return {"success": False, "error": "Comment not found"}
        
    def get_active_collaborators(self, dashboard_id: str) -> List[Dict[str, Any]]:
        """Get list of active collaborators for a dashboard"""
        collaborators = []
        
        if dashboard_id in self.active_sessions:
            for session in self.active_sessions[dashboard_id].values():
                collaborators.append({
                    "user_id": session.user_id,
                    "user_name": session.user_name,
                    "color": session.color,
                    "cursor_position": session.cursor_position,
                    "selected_widget": session.selected_widget,
                    "last_activity": session.last_activity.isoformat() if session.last_activity else None,
                    "is_active": session.is_active
                })
                
        return collaborators
        
    def get_comments(
        self,
        dashboard_id: str,
        widget_id: Optional[str] = None,
        resolved: Optional[bool] = None
    ) -> List[Dict[str, Any]]:
        """Get comments for a dashboard or widget"""
        comments = self.comments.get(dashboard_id, [])
        
        # Filter by widget if specified
        if widget_id:
            comments = [c for c in comments if c.get("widget_id") == widget_id]
            
        # Filter by resolved status if specified
        if resolved is not None:
            comments = [c for c in comments if c.get("resolved") == resolved]
            
        # Sort by creation date
        comments.sort(key=lambda x: x["created_at"], reverse=True)
        
        return comments
        
    def get_collaboration_history(
        self,
        dashboard_id: str,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """Get collaboration history for a dashboard"""
        history = [h for h in self.history if h.get("dashboard_id") == dashboard_id]
        history.sort(key=lambda x: x["timestamp"], reverse=True)
        return history[:limit]
        
    def add_to_history(self, event: Dict[str, Any]):
        """Add an event to collaboration history"""
        self.history.append(event)
        # Keep only last 1000 events
        if len(self.history) > 1000:
            self.history = self.history[-1000:]
            
    async def broadcast_presence_update(self, dashboard_id: str, user_id: str, action: str):
        """Broadcast presence update to all collaborators"""
        from app.services.websocket_service import WebSocketEventHandler
        
        session = self.active_sessions[dashboard_id].get(user_id)
        if session:
            await WebSocketEventHandler.handle_collaboration_event(
                dashboard_id=dashboard_id,
                user_id=user_id,
                event_type="presence",
                data={
                    "action": action,
                    "user_name": session.user_name,
                    "color": session.color
                }
            )
            
    async def broadcast_cursor_update(self, dashboard_id: str, user_id: str, x: float, y: float):
        """Broadcast cursor position update"""
        from app.services.websocket_service import WebSocketEventHandler
        
        await WebSocketEventHandler.handle_collaboration_event(
            dashboard_id=dashboard_id,
            user_id=user_id,
            event_type="cursor",
            data={"x": x, "y": y}
        )
        
    async def broadcast_selection_update(self, dashboard_id: str, user_id: str, widget_id: str):
        """Broadcast widget selection update"""
        from app.services.websocket_service import WebSocketEventHandler
        
        session = self.active_sessions[dashboard_id].get(user_id)
        if session:
            await WebSocketEventHandler.handle_collaboration_event(
                dashboard_id=dashboard_id,
                user_id=user_id,
                event_type="selection",
                data={
                    "widget_id": widget_id,
                    "user_name": session.user_name,
                    "color": session.color
                }
            )
            
    async def broadcast_lock_update(
        self,
        dashboard_id: str,
        widget_id: str,
        user_id: str,
        locked: bool
    ):
        """Broadcast widget lock update"""
        from app.services.websocket_service import WebSocketEventHandler
        
        await WebSocketEventHandler.handle_collaboration_event(
            dashboard_id=dashboard_id,
            user_id=user_id,
            event_type="lock",
            data={
                "widget_id": widget_id,
                "locked": locked,
                "locked_by": user_id if locked else None
            }
        )
        
    async def broadcast_comment_update(self, dashboard_id: str, comment: Dict[str, Any]):
        """Broadcast comment update"""
        from app.services.websocket_service import WebSocketEventHandler
        
        await WebSocketEventHandler.handle_collaboration_event(
            dashboard_id=dashboard_id,
            user_id=comment["user_id"],
            event_type="comment",
            data=comment
        )
        
    async def notify_mentions(
        self,
        dashboard_id: str,
        author_name: str,
        comment_text: str,
        mentioned_users: List[str]
    ):
        """Notify mentioned users"""
        from app.services.marketplace_service import NotificationService
        from app.database import get_db
        
        db = next(get_db())
        notification_service = NotificationService(db)
        
        for user_id in mentioned_users:
            await notification_service.create_notification(
                user_id=user_id,
                type="mention",
                title=f"{author_name} mentioned you",
                message=comment_text[:100] + "..." if len(comment_text) > 100 else comment_text,
                data={
                    "dashboard_id": dashboard_id,
                    "author": author_name
                },
                priority="normal"
            )

# Global collaboration service instance
collaboration_service = CollaborationService()

class VersionControlService:
    """Service for version control and change tracking"""
    
    def __init__(self):
        self.versions: Dict[str, List[Dict[str, Any]]] = defaultdict(list)
        self.current_versions: Dict[str, str] = {}  # dashboard_id -> version_id
        
    async def create_version(
        self,
        dashboard_id: str,
        user_id: str,
        user_name: str,
        changes: Dict[str, Any],
        message: Optional[str] = None
    ) -> Dict[str, Any]:
        """Create a new version of a dashboard"""
        version_id = str(uuid.uuid4())
        version_number = len(self.versions[dashboard_id]) + 1
        
        version = {
            "id": version_id,
            "dashboard_id": dashboard_id,
            "version_number": version_number,
            "created_by": user_id,
            "created_by_name": user_name,
            "created_at": datetime.utcnow().isoformat(),
            "message": message or f"Version {version_number}",
            "changes": changes,
            "parent_version": self.current_versions.get(dashboard_id)
        }
        
        self.versions[dashboard_id].append(version)
        self.current_versions[dashboard_id] = version_id
        
        return {
            "success": True,
            "version_id": version_id,
            "version_number": version_number
        }
        
    async def get_versions(
        self,
        dashboard_id: str,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """Get version history for a dashboard"""
        versions = self.versions.get(dashboard_id, [])
        versions.sort(key=lambda x: x["created_at"], reverse=True)
        return versions[:limit]
        
    async def restore_version(
        self,
        dashboard_id: str,
        version_id: str,
        user_id: str
    ) -> Dict[str, Any]:
        """Restore a previous version of a dashboard"""
        versions = self.versions.get(dashboard_id, [])
        
        for version in versions:
            if version["id"] == version_id:
                # Create a new version that restores the old one
                restore_version = await self.create_version(
                    dashboard_id=dashboard_id,
                    user_id=user_id,
                    user_name="System",
                    changes=version["changes"],
                    message=f"Restored version {version['version_number']}"
                )
                
                return {
                    "success": True,
                    "restored_version": version_id,
                    "new_version": restore_version["version_id"]
                }
                
        return {"success": False, "error": "Version not found"}
        
    async def compare_versions(
        self,
        dashboard_id: str,
        version1_id: str,
        version2_id: str
    ) -> Dict[str, Any]:
        """Compare two versions of a dashboard"""
        versions = self.versions.get(dashboard_id, [])
        
        version1 = next((v for v in versions if v["id"] == version1_id), None)
        version2 = next((v for v in versions if v["id"] == version2_id), None)
        
        if not version1 or not version2:
            return {"success": False, "error": "Version not found"}
            
        # Simple diff (in production, use proper diff algorithm)
        diff = {
            "version1": {
                "id": version1["id"],
                "number": version1["version_number"],
                "created_at": version1["created_at"]
            },
            "version2": {
                "id": version2["id"],
                "number": version2["version_number"],
                "created_at": version2["created_at"]
            },
            "changes": {
                "added": [],
                "removed": [],
                "modified": []
            }
        }
        
        return diff

# Global version control service instance
version_control_service = VersionControlService()
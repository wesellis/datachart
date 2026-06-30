from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
import json
from app.websocket import manager
from app.database import get_db
from app.models.user import User
from app.models.dashboard import Dashboard
from app.api.auth import get_current_user

router = APIRouter(prefix="/ws", tags=["websocket"])

@router.websocket("/dashboard/{dashboard_id}")
async def websocket_dashboard_endpoint(
    websocket: WebSocket,
    dashboard_id: str,
    token: str = Query(...),
    db: Session = Depends(get_db)
):
    """WebSocket endpoint for real-time dashboard collaboration"""
    
    # Authenticate user from token
    try:
        # This is a simplified token validation - in production, use proper JWT validation
        user = None  # TODO: Implement proper token validation
        if not user:
            # For now, create a mock user for testing
            user_id = "demo-user"
            user_name = "Demo User"
        else:
            user_id = user.id
            user_name = user.full_name or user.email
    except Exception as e:
        await websocket.close(code=1008, reason="Authentication failed")
        return
    
    # Check if dashboard exists and user has access
    dashboard = db.query(Dashboard).filter(Dashboard.id == dashboard_id).first()
    if not dashboard:
        await websocket.close(code=1008, reason="Dashboard not found")
        return
    
    # Check permissions (simplified - in production, implement proper authorization)
    # if not dashboard.is_public and dashboard.owner_id != user_id:
    #     await websocket.close(code=1008, reason="Access denied")
    #     return
    
    try:
        # Connect to the WebSocket manager
        await manager.connect(websocket, dashboard_id, user_id, user_name)
        
        while True:
            # Receive message from client
            data = await websocket.receive_text()
            message = json.loads(data)
            
            # Handle the message
            await manager.handle_message(websocket, message)
            
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        print(f"WebSocket error: {e}")
        manager.disconnect(websocket)

@router.get("/dashboard/{dashboard_id}/users")
async def get_dashboard_users(dashboard_id: str):
    """Get list of users currently connected to a dashboard"""
    users = manager.get_dashboard_users(dashboard_id)
    return {"dashboard_id": dashboard_id, "users": users}

@router.get("/stats")
async def get_websocket_stats():
    """Get WebSocket connection statistics"""
    return {
        "active_connections": manager.get_connection_count(),
        "active_dashboards": manager.get_dashboard_count()
    }
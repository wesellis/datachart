"""
API endpoints for advanced features - analytics, marketplace, collaboration, export/import
"""

from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, UploadFile, File, BackgroundTasks
from fastapi.responses import StreamingResponse, FileResponse
from sqlalchemy.orm import Session
import json
import io
from datetime import datetime

from app.database import get_db
from app.models.user import User
from app.api.auth import get_current_active_user
from app.services.analytics_engine import analytics_engine
from app.services.websocket_service import manager, WebSocketEventHandler, realtime_service
from app.services.marketplace_service import MarketplaceService, NotificationService
from app.services.collaboration_service import collaboration_service, version_control_service
from app.services.export_import_service import export_import_service

# Create routers
analytics_router = APIRouter(prefix="/api/v1/analytics", tags=["analytics"])
websocket_router = APIRouter(tags=["websocket"])
marketplace_router = APIRouter(prefix="/api/v1/marketplace", tags=["marketplace"])
collaboration_router = APIRouter(prefix="/api/v1/collaboration", tags=["collaboration"])
export_router = APIRouter(prefix="/api/v1/export", tags=["export"])
notification_router = APIRouter(prefix="/api/v1/notifications", tags=["notifications"])

# Analytics endpoints
@analytics_router.post("/analyze")
async def analyze_data(
    data: Dict[str, Any],
    analysis_type: str,
    config: Optional[Dict[str, Any]] = None,
    current_user: User = Depends(get_current_active_user)
):
    """Perform advanced analytics on data"""
    try:
        result = await analytics_engine.analyze_data(
            data=data.get("data"),
            analysis_type=analysis_type,
            config=config or {}
        )
        return {
            "success": True,
            "analysis_type": analysis_type,
            "results": result,
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@analytics_router.get("/types")
async def get_analysis_types():
    """Get available analysis types"""
    return {
        "types": [
            {"id": "statistical", "name": "Statistical Analysis", "description": "Comprehensive statistical metrics"},
            {"id": "trend", "name": "Trend Analysis", "description": "Identify trends and patterns"},
            {"id": "anomaly", "name": "Anomaly Detection", "description": "Detect outliers and anomalies"},
            {"id": "forecast", "name": "Time Series Forecast", "description": "Predict future values"},
            {"id": "correlation", "name": "Correlation Analysis", "description": "Find relationships between variables"},
            {"id": "clustering", "name": "Clustering", "description": "Group similar data points"},
            {"id": "dimension_reduction", "name": "Dimension Reduction", "description": "Reduce data complexity"},
            {"id": "pattern", "name": "Pattern Recognition", "description": "Identify recurring patterns"},
            {"id": "sentiment", "name": "Sentiment Analysis", "description": "Analyze text sentiment"},
            {"id": "predictive", "name": "Predictive Modeling", "description": "Build predictive models"}
        ]
    }

# WebSocket endpoints
@websocket_router.websocket("/ws/{dashboard_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    dashboard_id: str,
    token: str
):
    """WebSocket endpoint for real-time updates"""
    # Validate token and get user
    # In production, properly validate the token
    user_id = "user-123"  # Mock user ID
    organization_id = "org-456"  # Mock org ID
    
    await manager.connect(websocket, user_id, organization_id, dashboard_id)
    
    try:
        while True:
            # Receive message from client
            data = await websocket.receive_json()
            
            # Handle different message types
            if data.get("type") == "ping":
                await manager.handle_ping(websocket)
            elif data.get("type") == "widget_update":
                await WebSocketEventHandler.handle_widget_update(
                    dashboard_id, 
                    data.get("widget_id"),
                    data.get("data")
                )
            elif data.get("type") == "data_refresh":
                await WebSocketEventHandler.handle_data_refresh(
                    dashboard_id,
                    data.get("data_source_id"),
                    data.get("data")
                )
            elif data.get("type") == "collaboration":
                await WebSocketEventHandler.handle_collaboration_event(
                    dashboard_id,
                    user_id,
                    data.get("event_type"),
                    data.get("data")
                )
                
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@websocket_router.post("/stream/start/{dashboard_id}")
async def start_data_stream(
    dashboard_id: str,
    data_sources: List[str],
    interval: int = 5,
    current_user: User = Depends(get_current_active_user)
):
    """Start real-time data streaming for a dashboard"""
    await realtime_service.start_data_stream(dashboard_id, data_sources, interval)
    return {
        "success": True,
        "message": "Data stream started",
        "dashboard_id": dashboard_id,
        "interval": interval
    }

@websocket_router.post("/stream/stop/{dashboard_id}")
async def stop_data_stream(
    dashboard_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """Stop real-time data streaming for a dashboard"""
    await realtime_service.stop_data_stream(dashboard_id)
    return {
        "success": True,
        "message": "Data stream stopped",
        "dashboard_id": dashboard_id
    }

# Marketplace endpoints
@marketplace_router.get("/widgets")
async def search_marketplace_widgets(
    query: Optional[str] = None,
    category: Optional[str] = None,
    tags: Optional[List[str]] = None,
    sort_by: str = "popularity",
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    """Search widgets in the marketplace"""
    service = MarketplaceService(db)
    return await service.search_widgets(query, category, tags, sort_by, limit, offset)

@marketplace_router.get("/widgets/{widget_id}")
async def get_widget_details(
    widget_id: str,
    db: Session = Depends(get_db)
):
    """Get detailed information about a marketplace widget"""
    service = MarketplaceService(db)
    return await service.get_widget_details(widget_id)

@marketplace_router.post("/widgets/publish")
async def publish_widget(
    widget_data: Dict[str, Any],
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Publish a widget to the marketplace"""
    service = MarketplaceService(db)
    return await service.publish_widget(
        widget_data,
        current_user.id,
        current_user.organizations[0].id if current_user.organizations else None
    )

@marketplace_router.post("/widgets/{widget_id}/install")
async def install_widget(
    widget_id: str,
    dashboard_id: str,
    config: Optional[Dict[str, Any]] = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Install a widget from the marketplace"""
    service = MarketplaceService(db)
    return await service.install_widget(widget_id, current_user.id, dashboard_id, config)

@marketplace_router.post("/widgets/{widget_id}/rate")
async def rate_widget(
    widget_id: str,
    rating: int,
    review: Optional[str] = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Rate and review a marketplace widget"""
    service = MarketplaceService(db)
    return await service.rate_widget(widget_id, current_user.id, rating, review)

@marketplace_router.get("/trending")
async def get_trending_widgets(
    period: str = "week",
    db: Session = Depends(get_db)
):
    """Get trending widgets"""
    service = MarketplaceService(db)
    return await service.get_trending_widgets(period)

@marketplace_router.get("/recommendations")
async def get_widget_recommendations(
    limit: int = 10,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get personalized widget recommendations"""
    service = MarketplaceService(db)
    return await service.get_recommendations(current_user.id, limit)

# Collaboration endpoints
@collaboration_router.post("/session/join/{dashboard_id}")
async def join_collaboration_session(
    dashboard_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """Join a collaborative editing session"""
    return await collaboration_service.join_session(
        dashboard_id,
        current_user.id,
        current_user.full_name or current_user.email,
        current_user.email,
        ["view", "edit"]
    )

@collaboration_router.post("/session/leave/{dashboard_id}")
async def leave_collaboration_session(
    dashboard_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """Leave a collaborative editing session"""
    return await collaboration_service.leave_session(dashboard_id, current_user.id)

@collaboration_router.post("/cursor/update/{dashboard_id}")
async def update_cursor_position(
    dashboard_id: str,
    x: float,
    y: float,
    current_user: User = Depends(get_current_active_user)
):
    """Update cursor position in collaboration"""
    await collaboration_service.update_cursor(dashboard_id, current_user.id, x, y)
    return {"success": True}

@collaboration_router.post("/widget/lock/{dashboard_id}/{widget_id}")
async def lock_widget(
    dashboard_id: str,
    widget_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """Lock a widget for exclusive editing"""
    return await collaboration_service.lock_widget(dashboard_id, current_user.id, widget_id)

@collaboration_router.post("/widget/unlock/{dashboard_id}/{widget_id}")
async def unlock_widget(
    dashboard_id: str,
    widget_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """Unlock a widget"""
    return await collaboration_service.unlock_widget(dashboard_id, current_user.id, widget_id)

@collaboration_router.post("/comment/add/{dashboard_id}")
async def add_comment(
    dashboard_id: str,
    comment_text: str,
    widget_id: Optional[str] = None,
    parent_id: Optional[str] = None,
    mentions: Optional[List[str]] = None,
    current_user: User = Depends(get_current_active_user)
):
    """Add a comment to a dashboard or widget"""
    return await collaboration_service.add_comment(
        dashboard_id,
        current_user.id,
        current_user.full_name or current_user.email,
        comment_text,
        widget_id,
        parent_id,
        mentions
    )

@collaboration_router.get("/comments/{dashboard_id}")
async def get_comments(
    dashboard_id: str,
    widget_id: Optional[str] = None,
    resolved: Optional[bool] = None,
    current_user: User = Depends(get_current_active_user)
):
    """Get comments for a dashboard or widget"""
    return collaboration_service.get_comments(dashboard_id, widget_id, resolved)

@collaboration_router.get("/collaborators/{dashboard_id}")
async def get_active_collaborators(
    dashboard_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """Get list of active collaborators"""
    return collaboration_service.get_active_collaborators(dashboard_id)

@collaboration_router.get("/history/{dashboard_id}")
async def get_collaboration_history(
    dashboard_id: str,
    limit: int = 100,
    current_user: User = Depends(get_current_active_user)
):
    """Get collaboration history"""
    return collaboration_service.get_collaboration_history(dashboard_id, limit)

# Version control endpoints
@collaboration_router.post("/version/create/{dashboard_id}")
async def create_version(
    dashboard_id: str,
    changes: Dict[str, Any],
    message: Optional[str] = None,
    current_user: User = Depends(get_current_active_user)
):
    """Create a new version of a dashboard"""
    return await version_control_service.create_version(
        dashboard_id,
        current_user.id,
        current_user.full_name or current_user.email,
        changes,
        message
    )

@collaboration_router.get("/versions/{dashboard_id}")
async def get_versions(
    dashboard_id: str,
    limit: int = 50,
    current_user: User = Depends(get_current_active_user)
):
    """Get version history"""
    return await version_control_service.get_versions(dashboard_id, limit)

@collaboration_router.post("/version/restore/{dashboard_id}/{version_id}")
async def restore_version(
    dashboard_id: str,
    version_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """Restore a previous version"""
    return await version_control_service.restore_version(dashboard_id, version_id, current_user.id)

# Export endpoints
@export_router.get("/dashboard/{dashboard_id}")
async def export_dashboard(
    dashboard_id: str,
    format: str = "json",
    include_data: bool = False,
    include_config: bool = True,
    include_widgets: bool = True,
    current_user: User = Depends(get_current_active_user)
):
    """Export a dashboard"""
    result = await export_import_service.export_dashboard(
        dashboard_id, format, include_data, include_config, include_widgets
    )
    
    if format in ["zip", "xlsx", "pdf"]:
        # Binary formats - return as download
        import base64
        content = base64.b64decode(result["content"])
        return StreamingResponse(
            io.BytesIO(content),
            media_type=result["mime_type"],
            headers={
                "Content-Disposition": f"attachment; filename=dashboard_{dashboard_id}{result['file_extension']}"
            }
        )
    else:
        # Text formats - return as JSON
        return result

@export_router.post("/data")
async def export_data(
    data: List[Dict[str, Any]],
    format: str = "csv",
    columns: Optional[List[str]] = None,
    current_user: User = Depends(get_current_active_user)
):
    """Export data in various formats"""
    result = await export_import_service.export_data(data, format, columns)
    
    if format in ["xlsx", "pdf", "parquet"]:
        # Binary formats
        import base64
        content = base64.b64decode(result["content"])
        return StreamingResponse(
            io.BytesIO(content),
            media_type=result["mime_type"],
            headers={
                "Content-Disposition": f"attachment; filename=data_export{result['file_extension']}"
            }
        )
    else:
        return result

@export_router.post("/import/dashboard")
async def import_dashboard(
    file: UploadFile = File(...),
    format: str = "json",
    validate: bool = True,
    current_user: User = Depends(get_current_active_user)
):
    """Import a dashboard"""
    content = await file.read()
    
    return await export_import_service.import_dashboard(
        content.decode('utf-8') if isinstance(content, bytes) else content,
        format,
        current_user.id,
        current_user.organizations[0].id if current_user.organizations else None,
        validate
    )

@export_router.post("/backup")
async def create_backup(
    include_dashboards: bool = True,
    include_data: bool = True,
    include_users: bool = False,
    current_user: User = Depends(get_current_active_user)
):
    """Create a full backup"""
    organization_id = current_user.organizations[0].id if current_user.organizations else None
    
    result = await export_import_service.create_backup(
        organization_id,
        include_dashboards,
        include_data,
        include_users
    )
    
    # Return as download
    import base64
    content = base64.b64decode(result["content"])
    return StreamingResponse(
        io.BytesIO(content),
        media_type=result["mime_type"],
        headers={
            "Content-Disposition": f"attachment; filename={result['file_name']}"
        }
    )

@export_router.post("/restore")
async def restore_backup(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user)
):
    """Restore from a backup"""
    content = await file.read()
    organization_id = current_user.organizations[0].id if current_user.organizations else None
    
    import base64
    backup_content = base64.b64encode(content).decode('utf-8')
    
    return await export_import_service.restore_backup(
        backup_content,
        organization_id,
        current_user.id
    )

# Notification endpoints
@notification_router.get("/")
async def get_notifications(
    status: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get notifications for the current user"""
    service = NotificationService(db)
    return await service.get_notifications(current_user.id, status, limit, offset)

@notification_router.post("/mark-read/{notification_id}")
async def mark_notification_as_read(
    notification_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Mark a notification as read"""
    service = NotificationService(db)
    return await service.mark_as_read(notification_id, current_user.id)

@notification_router.post("/mark-all-read")
async def mark_all_notifications_as_read(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Mark all notifications as read"""
    service = NotificationService(db)
    return await service.mark_all_as_read(current_user.id)

@notification_router.delete("/{notification_id}")
async def delete_notification(
    notification_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete a notification"""
    service = NotificationService(db)
    return await service.delete_notification(notification_id, current_user.id)

@notification_router.post("/send")
async def send_notification(
    user_id: Optional[str] = None,
    organization_id: Optional[str] = None,
    type: str = "info",
    title: str = "",
    message: str = "",
    data: Optional[Dict[str, Any]] = None,
    priority: str = "normal",
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Send a notification (admin only)"""
    # Check admin permission
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    service = NotificationService(db)
    return await service.create_notification(
        user_id, organization_id, type, title, message, data, priority
    )
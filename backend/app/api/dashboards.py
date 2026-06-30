from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from pydantic import BaseModel
import json
import uuid
import secrets

from app.database import get_db
from app.models.dashboard import Dashboard, Widget, DashboardVersion, DashboardShare
from app.models.user import User
from app.api.auth import get_current_active_user

router = APIRouter(prefix="/api/v1/dashboards", tags=["dashboards"])

# Mock endpoint for demo dashboard (backward compatibility)
@router.get("/{tenant_id}/overview")
async def get_tenant_overview(tenant_id: str):
    """Get demo dashboard data for immediate display"""
    
    # Mock data for Hubbell dashboard demo
    mock_data = {
        "tenant_id": tenant_id,
        "timestamp": datetime.utcnow().isoformat(),
        "metrics": {
            "total_devices": 2847,
            "active_devices": 2691,
            "compliance_score": 94.2,
            "security_score": 87.5,
            "cost_savings": 125000,
            "threats_blocked": 342,
            "patches_applied": 1847,
            "uptime": 99.7
        },
        "charts": {
            "device_health": [
                {"name": "Healthy", "value": 2401, "color": "#10b981"},
                {"name": "Warning", "value": 290, "color": "#f59e0b"},
                {"name": "Critical", "value": 156, "color": "#ef4444"}
            ],
            "monthly_costs": [
                {"month": "Jan", "cost": 42000, "savings": 8000},
                {"month": "Feb", "cost": 38000, "savings": 12000},
                {"month": "Mar", "cost": 35000, "savings": 15000},
                {"month": "Apr", "cost": 33000, "savings": 17000},
                {"month": "May", "cost": 31000, "savings": 19000},
                {"month": "Jun", "cost": 29000, "savings": 21000}
            ],
            "security_events": [
                {"time": "00:00", "threats": 12, "blocked": 12},
                {"time": "04:00", "threats": 8, "blocked": 8},
                {"time": "08:00", "threats": 25, "blocked": 24},
                {"time": "12:00", "threats": 31, "blocked": 29},
                {"time": "16:00", "threats": 18, "blocked": 18},
                {"time": "20:00", "threats": 14, "blocked": 14}
            ],
            "compliance_trends": [
                {"date": "2024-01-01", "score": 85.2},
                {"date": "2024-02-01", "score": 87.1},
                {"date": "2024-03-01", "score": 89.3},
                {"date": "2024-04-01", "score": 91.2},
                {"date": "2024-05-01", "score": 92.8},
                {"date": "2024-06-01", "score": 94.2}
            ]
        },
        "alerts": [
            {
                "id": "1",
                "type": "critical",
                "message": "3 servers require immediate patching",
                "timestamp": datetime.utcnow().isoformat()
            },
            {
                "id": "2", 
                "type": "warning",
                "message": "License renewal due in 15 days",
                "timestamp": datetime.utcnow().isoformat()
            }
        ],
        "status": "active",
        "last_updated": datetime.utcnow().isoformat()
    }
    
    return mock_data

# Pydantic models
class WidgetCreate(BaseModel):
    type: str
    title: str
    position: dict  # {x, y, w, h}
    config: Optional[dict] = {}
    data_source_id: Optional[str] = None
    query: Optional[str] = None
    refresh_interval: Optional[int] = 300

class DashboardCreate(BaseModel):
    name: str
    description: Optional[str] = None
    widgets: List[WidgetCreate] = []
    theme: Optional[str] = "dark"
    is_public: Optional[bool] = False
    tags: Optional[List[str]] = []
    category: Optional[str] = None

class DashboardUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    theme: Optional[str] = None
    is_public: Optional[bool] = None
    tags: Optional[List[str]] = None
    category: Optional[str] = None

class DashboardResponse(BaseModel):
    id: str
    name: str
    description: Optional[str]
    owner_id: str
    organization_id: Optional[str]
    theme: str
    is_public: bool
    share_token: Optional[str]
    tags: List[str]
    category: Optional[str]
    view_count: int
    created_at: datetime
    updated_at: Optional[datetime]
    widgets: List[dict]

class DashboardShareCreate(BaseModel):
    share_type: str  # public, restricted, password
    can_edit: bool = False
    can_duplicate: bool = True
    can_export: bool = True
    password: Optional[str] = None
    allowed_emails: Optional[List[str]] = []
    expires_at: Optional[datetime] = None

# Public demo endpoints (no authentication required)
@router.get("/demo")
async def get_demo_dashboards():
    """Get demo dashboards without authentication"""
    return [
        {
            "id": "demo-1",
            "name": "Sales Dashboard",
            "description": "Track sales metrics and KPIs",
            "widgets": [],
            "is_public": True,
            "created_at": datetime.utcnow().isoformat()
        },
        {
            "id": "demo-2", 
            "name": "Analytics Dashboard",
            "description": "Website analytics and user behavior",
            "widgets": [],
            "is_public": True,
            "created_at": datetime.utcnow().isoformat()
        }
    ]

@router.post("/demo", status_code=201)
async def create_demo_dashboard(dashboard_data: DashboardCreate):
    """Create a demo dashboard without authentication"""
    dashboard_id = str(uuid.uuid4())
    
    return {
        "id": dashboard_id,
        "name": dashboard_data.name,
        "description": dashboard_data.description,
        "owner_id": "demo-user",
        "organization_id": "demo-org",
        "theme": dashboard_data.theme or "dark",
        "is_public": dashboard_data.is_public or False,
        "share_token": None,
        "tags": dashboard_data.tags or [],
        "category": dashboard_data.category,
        "view_count": 0,
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": None,
        "widgets": []
    }

# Dashboard CRUD operations
@router.post("/", response_model=DashboardResponse)
async def create_dashboard(
    dashboard_data: DashboardCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a new dashboard"""
    
    # Create dashboard
    dashboard = Dashboard(
        id=str(uuid.uuid4()),
        name=dashboard_data.name,
        description=dashboard_data.description,
        owner_id=current_user.id,
        organization_id=getattr(current_user, 'organization_id', None),
        theme=dashboard_data.theme,
        is_public=dashboard_data.is_public,
        tags=json.dumps(dashboard_data.tags) if dashboard_data.tags else "[]",
        category=dashboard_data.category,
        created_at=datetime.utcnow()
    )
    
    db.add(dashboard)
    
    # Add widgets
    for widget_data in dashboard_data.widgets:
        widget = Widget(
            id=str(uuid.uuid4()),
            dashboard_id=dashboard.id,
            type=widget_data.type,
            title=widget_data.title,
            position_x=widget_data.position.get("x", 0),
            position_y=widget_data.position.get("y", 0),
            width=widget_data.position.get("w", 3),
            height=widget_data.position.get("h", 2),
            config=json.dumps(widget_data.config),
            data_source_id=widget_data.data_source_id,
            query=widget_data.query,
            refresh_interval=widget_data.refresh_interval
        )
        db.add(widget)
    
    # Create initial version
    version = DashboardVersion(
        id=str(uuid.uuid4()),
        dashboard_id=dashboard.id,
        version_number=1,
        config_snapshot=json.dumps({
            "name": dashboard.name,
            "theme": dashboard.theme,
            "widgets": [w.dict() for w in dashboard_data.widgets]
        }),
        change_description="Initial creation",
        created_by_id=current_user.id,
        created_at=datetime.utcnow()
    )
    db.add(version)
    
    db.commit()
    db.refresh(dashboard)
    
    # Prepare response
    widgets = db.query(Widget).filter(Widget.dashboard_id == dashboard.id).all()
    
    return DashboardResponse(
        id=dashboard.id,
        name=dashboard.name,
        description=dashboard.description,
        owner_id=dashboard.owner_id,
        organization_id=dashboard.organization_id,
        theme=dashboard.theme,
        is_public=dashboard.is_public,
        share_token=dashboard.share_token,
        tags=json.loads(dashboard.tags) if dashboard.tags else [],
        category=dashboard.category,
        view_count=dashboard.view_count,
        created_at=dashboard.created_at,
        updated_at=dashboard.updated_at,
        widgets=[{
            "id": w.id,
            "type": w.type,
            "title": w.title,
            "position": {"x": w.position_x, "y": w.position_y, "w": w.width, "h": w.height},
            "config": json.loads(w.config) if w.config else {}
        } for w in widgets]
    )

@router.get("/{dashboard_id}")
async def get_dashboard_by_id(dashboard_id: str):
    """Get a specific dashboard by ID (including hubbell-001 demo)"""
    
    # Special handling for demo dashboard
    if dashboard_id == "hubbell-001":
        return {
            "id": "hubbell-001",
            "name": "APM Command Center",
            "description": "Hubbell Enterprise Dashboard",
            "widgets": [
                {
                    "id": "w1",
                    "type": "metric",
                    "name": "Total Spend",
                    "config": {
                        "title": "Total Spend",
                        "value": "$18.5M",
                        "change": 3.2,
                        "subtitle": "Budget: $20M • 92.5% utilized",
                        "icon": "dollar-sign",
                        "color": "#3b82f6"
                    }
                },
                {
                    "id": "w2",
                    "type": "metric",
                    "name": "Risk Score",
                    "config": {
                        "title": "Risk Score",
                        "value": "40/100",
                        "change": -2.1,
                        "subtitle": "3 critical issues detected",
                        "icon": "shield",
                        "color": "#f59e0b"
                    }
                },
                {
                    "id": "w3",
                    "type": "metric",
                    "name": "Compliance",
                    "config": {
                        "title": "Compliance",
                        "value": "87.4%",
                        "change": 2.1,
                        "subtitle": "Target: 90% • 29 gaps",
                        "icon": "check-circle",
                        "color": "#10b981"
                    }
                },
                {
                    "id": "w4",
                    "type": "metric",
                    "name": "Applications",
                    "config": {
                        "title": "Applications",
                        "value": "235",
                        "change": 8.1,
                        "subtitle": "218 active • 17 sunset",
                        "icon": "layers",
                        "color": "#8b5cf6"
                    }
                },
                {
                    "id": "w5",
                    "type": "metric",
                    "name": "Optimization",
                    "config": {
                        "title": "Optimization",
                        "value": "$285K",
                        "change": 0,
                        "subtitle": "Potential annual savings",
                        "icon": "target",
                        "color": "#ec4899"
                    }
                }
            ],
            "layout": [],
            "theme": "dark",
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
    
    # For other dashboards, query the database
    # (implement database query logic here when needed)
    raise HTTPException(status_code=404, detail=f"Dashboard {dashboard_id} not found")

@router.get("/", response_model=List[DashboardResponse])
async def list_dashboards(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    category: Optional[str] = None,
    is_public: Optional[bool] = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """List dashboards accessible to the current user"""
    
    query = db.query(Dashboard)
    
    # Filter by ownership or public
    query = query.filter(
        or_(
            Dashboard.owner_id == current_user.id,
            Dashboard.organization_id == getattr(current_user, 'organization_id', None),
            Dashboard.is_public == True
        )
    )
    
    # Apply filters
    if search:
        query = query.filter(
            or_(
                Dashboard.name.ilike(f"%{search}%"),
                Dashboard.description.ilike(f"%{search}%")
            )
        )
    
    if category:
        query = query.filter(Dashboard.category == category)
    
    if is_public is not None:
        query = query.filter(Dashboard.is_public == is_public)
    
    # Get dashboards
    dashboards = query.offset(skip).limit(limit).all()
    
    # Prepare response
    result = []
    for dashboard in dashboards:
        widgets = db.query(Widget).filter(Widget.dashboard_id == dashboard.id).all()
        result.append(DashboardResponse(
            id=dashboard.id,
            name=dashboard.name,
            description=dashboard.description,
            owner_id=dashboard.owner_id,
            organization_id=dashboard.organization_id,
            theme=dashboard.theme,
            is_public=dashboard.is_public,
            share_token=dashboard.share_token,
            tags=json.loads(dashboard.tags) if dashboard.tags else [],
            category=dashboard.category,
            view_count=dashboard.view_count,
            created_at=dashboard.created_at,
            updated_at=dashboard.updated_at,
            widgets=[{
                "id": w.id,
                "type": w.type,
                "title": w.title,
                "position": {"x": w.position_x, "y": w.position_y, "w": w.width, "h": w.height},
                "config": json.loads(w.config) if w.config else {}
            } for w in widgets]
        ))
    
    return result

@router.get("/{dashboard_id}", response_model=DashboardResponse)
async def get_dashboard(
    dashboard_id: str,
    current_user: Optional[User] = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get a specific dashboard"""
    
    dashboard = db.query(Dashboard).filter(Dashboard.id == dashboard_id).first()
    
    if not dashboard:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dashboard not found"
        )
    
    # Check permissions
    if not dashboard.is_public:
        if not current_user or (
            dashboard.owner_id != current_user.id and
            dashboard.organization_id not in [org.id for org in current_user.organizations]
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
    
    # Increment view count
    dashboard.view_count += 1
    dashboard.last_accessed_at = datetime.utcnow()
    db.commit()
    
    # Get widgets
    widgets = db.query(Widget).filter(Widget.dashboard_id == dashboard.id).all()
    
    return DashboardResponse(
        id=dashboard.id,
        name=dashboard.name,
        description=dashboard.description,
        owner_id=dashboard.owner_id,
        organization_id=dashboard.organization_id,
        theme=dashboard.theme,
        is_public=dashboard.is_public,
        share_token=dashboard.share_token,
        tags=json.loads(dashboard.tags) if dashboard.tags else [],
        category=dashboard.category,
        view_count=dashboard.view_count,
        created_at=dashboard.created_at,
        updated_at=dashboard.updated_at,
        widgets=[{
            "id": w.id,
            "type": w.type,
            "title": w.title,
            "position": {"x": w.position_x, "y": w.position_y, "w": w.width, "h": w.height},
            "config": json.loads(w.config) if w.config else {},
            "data_source_id": w.data_source_id,
            "query": w.query,
            "refresh_interval": w.refresh_interval
        } for w in widgets]
    )

@router.put("/{dashboard_id}", response_model=DashboardResponse)
async def update_dashboard(
    dashboard_id: str,
    dashboard_update: DashboardUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update a dashboard"""
    
    dashboard = db.query(Dashboard).filter(Dashboard.id == dashboard_id).first()
    
    if not dashboard:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dashboard not found"
        )
    
    # Check permissions
    if dashboard.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the owner can update this dashboard"
        )
    
    # Update fields
    if dashboard_update.name is not None:
        dashboard.name = dashboard_update.name
    if dashboard_update.description is not None:
        dashboard.description = dashboard_update.description
    if dashboard_update.theme is not None:
        dashboard.theme = dashboard_update.theme
    if dashboard_update.is_public is not None:
        dashboard.is_public = dashboard_update.is_public
    if dashboard_update.tags is not None:
        dashboard.tags = json.dumps(dashboard_update.tags)
    if dashboard_update.category is not None:
        dashboard.category = dashboard_update.category
    
    dashboard.updated_at = datetime.utcnow()
    dashboard.version += 1
    
    # Create version snapshot
    widgets = db.query(Widget).filter(Widget.dashboard_id == dashboard.id).all()
    version = DashboardVersion(
        id=str(uuid.uuid4()),
        dashboard_id=dashboard.id,
        version_number=dashboard.version,
        config_snapshot=json.dumps({
            "name": dashboard.name,
            "theme": dashboard.theme,
            "widgets": [{
                "type": w.type,
                "title": w.title,
                "position": {"x": w.position_x, "y": w.position_y, "w": w.width, "h": w.height},
                "config": w.config
            } for w in widgets]
        }),
        change_description="Dashboard updated",
        created_by_id=current_user.id,
        created_at=datetime.utcnow()
    )
    db.add(version)
    
    db.commit()
    db.refresh(dashboard)
    
    return DashboardResponse(
        id=dashboard.id,
        name=dashboard.name,
        description=dashboard.description,
        owner_id=dashboard.owner_id,
        organization_id=dashboard.organization_id,
        theme=dashboard.theme,
        is_public=dashboard.is_public,
        share_token=dashboard.share_token,
        tags=json.loads(dashboard.tags) if dashboard.tags else [],
        category=dashboard.category,
        view_count=dashboard.view_count,
        created_at=dashboard.created_at,
        updated_at=dashboard.updated_at,
        widgets=[{
            "id": w.id,
            "type": w.type,
            "title": w.title,
            "position": {"x": w.position_x, "y": w.position_y, "w": w.width, "h": w.height},
            "config": json.loads(w.config) if w.config else {}
        } for w in widgets]
    )

@router.delete("/{dashboard_id}")
async def delete_dashboard(
    dashboard_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete a dashboard"""
    
    dashboard = db.query(Dashboard).filter(Dashboard.id == dashboard_id).first()
    
    if not dashboard:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dashboard not found"
        )
    
    # Check permissions
    if dashboard.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the owner can delete this dashboard"
        )
    
    db.delete(dashboard)
    db.commit()
    
    return {"message": "Dashboard deleted successfully"}

@router.post("/{dashboard_id}/duplicate", response_model=DashboardResponse)
async def duplicate_dashboard(
    dashboard_id: str,
    new_name: Optional[str] = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Duplicate a dashboard"""
    
    original = db.query(Dashboard).filter(Dashboard.id == dashboard_id).first()
    
    if not original:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dashboard not found"
        )
    
    # Check permissions
    if not original.is_public and original.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # Create duplicate
    duplicate = Dashboard(
        id=str(uuid.uuid4()),
        name=new_name or f"{original.name} (Copy)",
        description=original.description,
        owner_id=current_user.id,
        organization_id=getattr(current_user, 'organization_id', None),
        theme=original.theme,
        is_public=False,
        tags=original.tags,
        category=original.category,
        parent_id=original.id,
        created_at=datetime.utcnow()
    )
    
    db.add(duplicate)
    
    # Duplicate widgets
    original_widgets = db.query(Widget).filter(Widget.dashboard_id == original.id).all()
    for w in original_widgets:
        widget_copy = Widget(
            id=str(uuid.uuid4()),
            dashboard_id=duplicate.id,
            type=w.type,
            title=w.title,
            position_x=w.position_x,
            position_y=w.position_y,
            width=w.width,
            height=w.height,
            config=w.config,
            data_source_id=w.data_source_id,
            query=w.query,
            refresh_interval=w.refresh_interval
        )
        db.add(widget_copy)
    
    # Update fork count
    original.fork_count += 1
    
    db.commit()
    db.refresh(duplicate)
    
    widgets = db.query(Widget).filter(Widget.dashboard_id == duplicate.id).all()
    
    return DashboardResponse(
        id=duplicate.id,
        name=duplicate.name,
        description=duplicate.description,
        owner_id=duplicate.owner_id,
        organization_id=duplicate.organization_id,
        theme=duplicate.theme,
        is_public=duplicate.is_public,
        share_token=duplicate.share_token,
        tags=json.loads(duplicate.tags) if duplicate.tags else [],
        category=duplicate.category,
        view_count=duplicate.view_count,
        created_at=duplicate.created_at,
        updated_at=duplicate.updated_at,
        widgets=[{
            "id": w.id,
            "type": w.type,
            "title": w.title,
            "position": {"x": w.position_x, "y": w.position_y, "w": w.width, "h": w.height},
            "config": json.loads(w.config) if w.config else {}
        } for w in widgets]
    )

@router.post("/{dashboard_id}/share")
async def create_share_link(
    dashboard_id: str,
    share_config: DashboardShareCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a share link for a dashboard"""
    
    dashboard = db.query(Dashboard).filter(Dashboard.id == dashboard_id).first()
    
    if not dashboard:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dashboard not found"
        )
    
    # Check permissions
    if dashboard.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the owner can share this dashboard"
        )
    
    # Create share record
    share_token = secrets.token_urlsafe(16)
    
    share = DashboardShare(
        id=str(uuid.uuid4()),
        dashboard_id=dashboard.id,
        share_type=share_config.share_type,
        share_token=share_token,
        can_edit=share_config.can_edit,
        can_duplicate=share_config.can_duplicate,
        can_export=share_config.can_export,
        allowed_emails=json.dumps(share_config.allowed_emails) if share_config.allowed_emails else None,
        expires_at=share_config.expires_at,
        created_by_id=current_user.id,
        created_at=datetime.utcnow()
    )
    
    # Set password if provided
    if share_config.password:
        from app.api.auth import get_password_hash
        share.password_hash = get_password_hash(share_config.password)
    
    db.add(share)
    db.commit()
    
    return {
        "share_token": share_token,
        "share_url": f"/app/shared/{dashboard_id}?token={share_token}",
        "expires_at": share_config.expires_at
    }

@router.get("/shared/{share_token}")
async def get_shared_dashboard(
    share_token: str,
    password: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Access a shared dashboard"""
    
    share = db.query(DashboardShare).filter(DashboardShare.share_token == share_token).first()
    
    if not share:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invalid share link"
        )
    
    # Check expiration
    if share.expires_at and share.expires_at < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="Share link has expired"
        )
    
    # Check password if required
    if share.password_hash:
        if not password:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Password required"
            )
        from app.api.auth import verify_password
        if not verify_password(password, share.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid password"
            )
    
    # Update access stats
    share.current_views += 1
    share.last_accessed_at = datetime.utcnow()
    
    # Check max views
    if share.max_views and share.current_views > share.max_views:
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="Maximum views exceeded"
        )
    
    db.commit()
    
    # Get dashboard
    dashboard = db.query(Dashboard).filter(Dashboard.id == share.dashboard_id).first()
    widgets = db.query(Widget).filter(Widget.dashboard_id == dashboard.id).all()
    
    return {
        "dashboard": {
            "id": dashboard.id,
            "name": dashboard.name,
            "description": dashboard.description,
            "theme": dashboard.theme,
            "widgets": [{
                "id": w.id,
                "type": w.type,
                "title": w.title,
                "position": {"x": w.position_x, "y": w.position_y, "w": w.width, "h": w.height},
                "config": json.loads(w.config) if w.config else {}
            } for w in widgets]
        },
        "permissions": {
            "can_edit": share.can_edit,
            "can_duplicate": share.can_duplicate,
            "can_export": share.can_export
        }
    }
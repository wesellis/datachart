"""
Dashboard Management API - CRUD operations for user dashboards
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional, Dict, Any
from datetime import datetime
import json
import uuid

from app.database import get_db
from app.models.dashboard import Dashboard, Widget, DashboardVersion, DashboardShare
from app.models.user import User
from app.api.auth import get_current_active_user
from pydantic import BaseModel, Field

router = APIRouter(prefix="/api/v1/dashboards", tags=["dashboard-management"])

# Pydantic Models
class DashboardCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    category: Optional[str] = None
    is_public: bool = False
    theme: str = "dark"
    tags: Optional[List[str]] = None

class DashboardUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    category: Optional[str] = None
    is_public: Optional[bool] = None
    theme: Optional[str] = None
    tags: Optional[List[str]] = None
    config: Optional[Dict[str, Any]] = None
    layout: Optional[Dict[str, Any]] = None

class DashboardResponse(BaseModel):
    id: str
    name: str
    description: Optional[str]
    category: Optional[str]
    is_public: bool
    theme: str
    view_count: int
    star_count: int
    created_at: datetime
    updated_at: Optional[datetime]
    owner: Dict[str, Any]
    widget_count: int
    tags: List[str]

class WidgetCreate(BaseModel):
    type: str = Field(..., min_length=1)
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    position_x: int = 0
    position_y: int = 0
    width: int = 4
    height: int = 3
    data_source_id: Optional[str] = None
    query: Optional[str] = None
    config: Optional[Dict[str, Any]] = None
    style: Optional[Dict[str, Any]] = None

class WidgetUpdate(BaseModel):
    type: Optional[str] = None
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    position_x: Optional[int] = None
    position_y: Optional[int] = None
    width: Optional[int] = None
    height: Optional[int] = None
    data_source_id: Optional[str] = None
    query: Optional[str] = None
    config: Optional[Dict[str, Any]] = None
    style: Optional[Dict[str, Any]] = None

# Dashboard CRUD Operations
@router.post("/", response_model=DashboardResponse)
async def create_dashboard(
    dashboard_data: DashboardCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a new dashboard for the current user"""
    
    # Create dashboard
    new_dashboard = Dashboard(
        id=str(uuid.uuid4()),
        name=dashboard_data.name,
        description=dashboard_data.description,
        category=dashboard_data.category,
        owner_id=current_user.id,
        organization_id=getattr(current_user, 'organization_id', None),
        is_public=dashboard_data.is_public,
        theme=dashboard_data.theme,
        tags=json.dumps(dashboard_data.tags or []),
        config=json.dumps({}),
        layout=json.dumps({}),
        version=1
    )
    
    db.add(new_dashboard)
    db.commit()
    db.refresh(new_dashboard)
    
    return format_dashboard_response(new_dashboard, current_user)

@router.get("/", response_model=List[DashboardResponse])
async def list_dashboards(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    category: Optional[str] = None,
    search: Optional[str] = None,
    is_public: Optional[bool] = None
):
    """List dashboards accessible to the current user"""
    
    query = db.query(Dashboard).options(joinedload(Dashboard.owner))
    
    # Filter by user's dashboards or public dashboards
    if is_public is True:
        query = query.filter(Dashboard.is_public == True)
    elif is_public is False:
        query = query.filter(Dashboard.owner_id == current_user.id)
    else:
        # Show user's dashboards and public ones
        query = query.filter(
            (Dashboard.owner_id == current_user.id) | 
            (Dashboard.is_public == True)
        )
    
    # Apply filters
    if category:
        query = query.filter(Dashboard.category == category)
    
    if search:
        query = query.filter(
            (Dashboard.name.ilike(f"%{search}%")) |
            (Dashboard.description.ilike(f"%{search}%"))
        )
    
    # Get results with pagination
    dashboards = query.offset(skip).limit(limit).all()
    
    return [format_dashboard_response(d, d.owner) for d in dashboards]

@router.get("/{dashboard_id}", response_model=DashboardResponse)
async def get_dashboard(
    dashboard_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get a specific dashboard by ID"""
    
    dashboard = db.query(Dashboard).options(
        joinedload(Dashboard.owner),
        joinedload(Dashboard.widgets)
    ).filter(Dashboard.id == dashboard_id).first()
    
    if not dashboard:
        raise HTTPException(status_code=404, detail="Dashboard not found")
    
    # Check access permissions
    if not dashboard.is_public and dashboard.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Increment view count
    dashboard.view_count += 1
    dashboard.last_accessed_at = datetime.utcnow()
    db.commit()
    
    return format_dashboard_response(dashboard, dashboard.owner)

@router.put("/{dashboard_id}", response_model=DashboardResponse)
async def update_dashboard(
    dashboard_id: str,
    dashboard_data: DashboardUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update a dashboard (owner only)"""
    
    dashboard = db.query(Dashboard).filter(Dashboard.id == dashboard_id).first()
    
    if not dashboard:
        raise HTTPException(status_code=404, detail="Dashboard not found")
    
    if dashboard.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only dashboard owner can update")
    
    # Update fields
    update_data = dashboard_data.dict(exclude_unset=True)
    
    for field, value in update_data.items():
        if field == "tags" and value is not None:
            setattr(dashboard, field, json.dumps(value))
        elif field in ("config", "layout") and value is not None:
            setattr(dashboard, field, json.dumps(value))
        else:
            setattr(dashboard, field, value)
    
    dashboard.updated_at = datetime.utcnow()
    dashboard.version += 1
    
    db.commit()
    db.refresh(dashboard)
    
    return format_dashboard_response(dashboard, current_user)

@router.delete("/{dashboard_id}")
async def delete_dashboard(
    dashboard_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete a dashboard (owner only)"""
    
    dashboard = db.query(Dashboard).filter(Dashboard.id == dashboard_id).first()
    
    if not dashboard:
        raise HTTPException(status_code=404, detail="Dashboard not found")
    
    if dashboard.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only dashboard owner can delete")
    
    db.delete(dashboard)
    db.commit()
    
    return {"message": "Dashboard deleted successfully"}

@router.post("/{dashboard_id}/duplicate", response_model=DashboardResponse)
async def duplicate_dashboard(
    dashboard_id: str,
    name: Optional[str] = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Duplicate a dashboard"""
    
    original_dashboard = db.query(Dashboard).options(
        joinedload(Dashboard.widgets)
    ).filter(Dashboard.id == dashboard_id).first()
    
    if not original_dashboard:
        raise HTTPException(status_code=404, detail="Dashboard not found")
    
    # Check access permissions
    if not original_dashboard.is_public and original_dashboard.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Create duplicate
    new_dashboard = Dashboard(
        id=str(uuid.uuid4()),
        name=name or f"{original_dashboard.name} (Copy)",
        description=original_dashboard.description,
        category=original_dashboard.category,
        owner_id=current_user.id,
        organization_id=getattr(current_user, 'organization_id', None),
        is_public=False,  # Copies are private by default
        theme=original_dashboard.theme,
        config=original_dashboard.config,
        layout=original_dashboard.layout,
        tags=original_dashboard.tags,
        version=1,
        parent_id=dashboard_id
    )
    
    db.add(new_dashboard)
    db.flush()  # Get the new dashboard ID
    
    # Duplicate widgets
    for widget in original_dashboard.widgets:
        new_widget = Widget(
            id=str(uuid.uuid4()),
            dashboard_id=new_dashboard.id,
            type=widget.type,
            title=widget.title,
            description=widget.description,
            position_x=widget.position_x,
            position_y=widget.position_y,
            width=widget.width,
            height=widget.height,
            data_source_id=widget.data_source_id,
            query=widget.query,
            config=widget.config,
            style=widget.style
        )
        db.add(new_widget)
    
    # Update fork count on original
    original_dashboard.fork_count += 1
    
    db.commit()
    db.refresh(new_dashboard)
    
    return format_dashboard_response(new_dashboard, current_user)

# Widget Operations
@router.post("/{dashboard_id}/widgets")
async def create_widget(
    dashboard_id: str,
    widget_data: WidgetCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Add a widget to a dashboard"""
    
    dashboard = db.query(Dashboard).filter(Dashboard.id == dashboard_id).first()
    
    if not dashboard:
        raise HTTPException(status_code=404, detail="Dashboard not found")
    
    if dashboard.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only dashboard owner can add widgets")
    
    # Create widget
    new_widget = Widget(
        id=str(uuid.uuid4()),
        dashboard_id=dashboard_id,
        type=widget_data.type,
        title=widget_data.title,
        description=widget_data.description,
        position_x=widget_data.position_x,
        position_y=widget_data.position_y,
        width=widget_data.width,
        height=widget_data.height,
        data_source_id=widget_data.data_source_id,
        query=widget_data.query,
        config=json.dumps(widget_data.config or {}),
        style=json.dumps(widget_data.style or {})
    )
    
    db.add(new_widget)
    
    # Update dashboard version
    dashboard.updated_at = datetime.utcnow()
    dashboard.version += 1
    
    db.commit()
    db.refresh(new_widget)
    
    return {
        "id": new_widget.id,
        "dashboard_id": dashboard_id,
        "message": "Widget created successfully"
    }

@router.put("/{dashboard_id}/widgets/{widget_id}")
async def update_widget(
    dashboard_id: str,
    widget_id: str,
    widget_data: WidgetUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update a widget"""
    
    widget = db.query(Widget).join(Dashboard).filter(
        Widget.id == widget_id,
        Widget.dashboard_id == dashboard_id,
        Dashboard.owner_id == current_user.id
    ).first()
    
    if not widget:
        raise HTTPException(status_code=404, detail="Widget not found or access denied")
    
    # Update fields
    update_data = widget_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        if field in ("config", "style") and value is not None:
            setattr(widget, field, json.dumps(value))
        else:
            setattr(widget, field, value)
    
    # Update dashboard version
    dashboard = db.query(Dashboard).filter(Dashboard.id == dashboard_id).first()
    dashboard.updated_at = datetime.utcnow()
    dashboard.version += 1
    
    db.commit()
    
    return {"message": "Widget updated successfully"}

@router.delete("/{dashboard_id}/widgets/{widget_id}")
async def delete_widget(
    dashboard_id: str,
    widget_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete a widget"""
    
    widget = db.query(Widget).join(Dashboard).filter(
        Widget.id == widget_id,
        Widget.dashboard_id == dashboard_id,
        Dashboard.owner_id == current_user.id
    ).first()
    
    if not widget:
        raise HTTPException(status_code=404, detail="Widget not found or access denied")
    
    db.delete(widget)
    
    # Update dashboard version
    dashboard = db.query(Dashboard).filter(Dashboard.id == dashboard_id).first()
    dashboard.updated_at = datetime.utcnow()
    dashboard.version += 1
    
    db.commit()
    
    return {"message": "Widget deleted successfully"}

# Helper Functions
def format_dashboard_response(dashboard: Dashboard, owner: User) -> DashboardResponse:
    """Format dashboard for API response"""
    
    # Parse JSON fields safely
    try:
        tags = json.loads(dashboard.tags) if dashboard.tags else []
    except json.JSONDecodeError:
        tags = []
    
    return DashboardResponse(
        id=dashboard.id,
        name=dashboard.name,
        description=dashboard.description,
        category=dashboard.category,
        is_public=dashboard.is_public,
        theme=dashboard.theme,
        view_count=dashboard.view_count or 0,
        star_count=dashboard.star_count or 0,
        created_at=dashboard.created_at,
        updated_at=dashboard.updated_at,
        owner={
            "id": owner.id,
            "name": owner.display_name,
            "email": owner.email
        },
        widget_count=len(dashboard.widgets) if dashboard.widgets else 0,
        tags=tags
    )
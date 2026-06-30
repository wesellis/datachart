"""
Dashboard schemas for request/response validation
"""

from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any, Union
from datetime import datetime
from enum import Enum
from .common import ValidationMixin, TimestampMixin, PaginationParams, FilterParams

class ChartType(str, Enum):
    """Chart type options"""
    BAR = "bar"
    LINE = "line" 
    PIE = "pie"
    AREA = "area"
    SCATTER = "scatter"
    GAUGE = "gauge"
    TABLE = "table"
    METRIC = "metric"

class RefreshInterval(str, Enum):
    """Dashboard refresh interval options"""
    MANUAL = "manual"
    MINUTES_1 = "1m"
    MINUTES_5 = "5m"
    MINUTES_15 = "15m"
    MINUTES_30 = "30m"
    HOUR_1 = "1h"
    HOURS_4 = "4h"
    HOURS_12 = "12h"
    DAILY = "24h"

class WidgetSize(str, Enum):
    """Widget size options"""
    SMALL = "small"     # 1x1
    MEDIUM = "medium"   # 2x1
    LARGE = "large"     # 2x2
    XLARGE = "xlarge"   # 3x2

class DashboardVisibility(str, Enum):
    """Dashboard visibility options"""
    PRIVATE = "private"
    SHARED = "shared"
    PUBLIC = "public"

class WidgetPosition(BaseModel):
    """Widget position on dashboard grid"""
    x: int = Field(..., ge=0, le=24, description="X position on grid")
    y: int = Field(..., ge=0, le=100, description="Y position on grid")
    width: int = Field(..., ge=1, le=24, description="Widget width")
    height: int = Field(..., ge=1, le=20, description="Widget height")

class WidgetConfig(BaseModel):
    """Widget configuration options"""
    chart_type: ChartType = Field(..., description="Type of chart to display")
    data_source: str = Field(..., min_length=1, max_length=100, description="Data source identifier")
    query: Optional[str] = Field(None, max_length=2000, description="Custom query for data")
    filters: Optional[Dict[str, Any]] = Field(default={}, description="Widget-specific filters")
    color_scheme: Optional[str] = Field("default", description="Color scheme for charts")
    show_legend: bool = Field(True, description="Show chart legend")
    show_grid: bool = Field(True, description="Show chart grid")
    animation_enabled: bool = Field(True, description="Enable chart animations")
    
    @validator('filters')
    def validate_filters(cls, v):
        if v and len(str(v)) > 5000:
            raise ValueError('Filters configuration too large')
        return v

class Widget(TimestampMixin, BaseModel):
    """Widget schema"""
    id: int = Field(..., description="Widget ID")
    title: str = Field(..., min_length=1, max_length=100, description="Widget title")
    description: Optional[str] = Field(None, max_length=500, description="Widget description")
    position: WidgetPosition = Field(..., description="Widget position")
    config: WidgetConfig = Field(..., description="Widget configuration")
    is_active: bool = Field(True, description="Widget active status")
    
    class Config:
        from_attributes = True

class WidgetCreate(ValidationMixin, BaseModel):
    """Widget creation request schema"""
    title: str = Field(..., min_length=1, max_length=100, description="Widget title")
    description: Optional[str] = Field(None, max_length=500, description="Widget description")
    position: WidgetPosition = Field(..., description="Widget position")
    config: WidgetConfig = Field(..., description="Widget configuration")

class WidgetUpdate(ValidationMixin, BaseModel):
    """Widget update request schema"""
    title: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    position: Optional[WidgetPosition] = None
    config: Optional[WidgetConfig] = None
    is_active: Optional[bool] = None

class Dashboard(TimestampMixin, BaseModel):
    """Dashboard schema"""
    id: int = Field(..., description="Dashboard ID")
    title: str = Field(..., min_length=1, max_length=100, description="Dashboard title")
    description: Optional[str] = Field(None, max_length=1000, description="Dashboard description")
    visibility: DashboardVisibility = Field(DashboardVisibility.PRIVATE, description="Dashboard visibility")
    refresh_interval: RefreshInterval = Field(RefreshInterval.MANUAL, description="Auto-refresh interval")
    is_favorite: bool = Field(False, description="User favorite status")
    is_active: bool = Field(True, description="Dashboard active status")
    owner_id: int = Field(..., description="Dashboard owner ID")
    widgets: List[Widget] = Field(default=[], description="Dashboard widgets")
    tags: List[str] = Field(default=[], description="Dashboard tags")
    
    class Config:
        from_attributes = True

class DashboardCreate(ValidationMixin, BaseModel):
    """Dashboard creation request schema"""
    title: str = Field(..., min_length=1, max_length=100, description="Dashboard title")
    description: Optional[str] = Field(None, max_length=1000, description="Dashboard description")
    visibility: DashboardVisibility = Field(DashboardVisibility.PRIVATE, description="Dashboard visibility")
    refresh_interval: RefreshInterval = Field(RefreshInterval.MANUAL, description="Auto-refresh interval")
    tags: Optional[List[str]] = Field(default=[], description="Dashboard tags")
    
    @validator('tags')
    def validate_tags(cls, v):
        if v:
            if len(v) > 10:
                raise ValueError('Maximum 10 tags allowed')
            for tag in v:
                if not isinstance(tag, str) or len(tag) > 30:
                    raise ValueError('Tags must be strings with max 30 characters')
        return v or []

class DashboardUpdate(ValidationMixin, BaseModel):
    """Dashboard update request schema"""
    title: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=1000)
    visibility: Optional[DashboardVisibility] = None
    refresh_interval: Optional[RefreshInterval] = None
    is_favorite: Optional[bool] = None
    is_active: Optional[bool] = None
    tags: Optional[List[str]] = None
    
    @validator('tags')
    def validate_tags(cls, v):
        if v is not None:
            if len(v) > 10:
                raise ValueError('Maximum 10 tags allowed')
            for tag in v:
                if not isinstance(tag, str) or len(tag) > 30:
                    raise ValueError('Tags must be strings with max 30 characters')
        return v

class DashboardFilters(FilterParams):
    """Dashboard filtering parameters"""
    owner_id: Optional[int] = Field(None, description="Filter by owner ID")
    visibility: Optional[DashboardVisibility] = None
    tags: Optional[List[str]] = Field(None, description="Filter by tags")
    is_favorite: Optional[bool] = None
    is_active: Optional[bool] = None

class DashboardData(BaseModel):
    """Dashboard data response schema"""
    dashboard_id: int = Field(..., description="Dashboard ID")
    title: str = Field(..., description="Dashboard title")
    last_updated: datetime = Field(..., description="Last update timestamp")
    data: Dict[str, Any] = Field(..., description="Dashboard data")
    widgets_data: Dict[int, Dict[str, Any]] = Field(default={}, description="Widget-specific data")
    metadata: Optional[Dict[str, Any]] = Field(default={}, description="Additional metadata")

class DashboardExport(BaseModel):
    """Dashboard export configuration"""
    format: str = Field("json", pattern="^(json|pdf|png|xlsx)$", description="Export format")
    include_data: bool = Field(True, description="Include current data in export")
    date_range: Optional[Dict[str, str]] = Field(None, description="Date range for data export")
    
class DashboardShare(BaseModel):
    """Dashboard sharing configuration"""
    emails: List[str] = Field(..., min_items=1, max_items=50, description="Email addresses to share with")
    permission: str = Field("view", pattern="^(view|edit)$", description="Permission level")
    expires_at: Optional[datetime] = Field(None, description="Share expiration")
    message: Optional[str] = Field(None, max_length=500, description="Optional message")
    
    @validator('emails')
    def validate_emails(cls, v):
        for email in v:
            if not isinstance(email, str) or '@' not in email:
                raise ValueError(f'Invalid email format: {email}')
        return v

class DashboardTemplate(TimestampMixin, BaseModel):
    """Dashboard template schema"""
    id: int = Field(..., description="Template ID")
    name: str = Field(..., min_length=1, max_length=100, description="Template name")
    description: Optional[str] = Field(None, max_length=1000, description="Template description")
    category: str = Field(..., min_length=1, max_length=50, description="Template category")
    preview_image: Optional[str] = Field(None, description="Preview image URL")
    config: Dict[str, Any] = Field(..., description="Template configuration")
    is_featured: bool = Field(False, description="Featured template status")
    
    class Config:
        from_attributes = True
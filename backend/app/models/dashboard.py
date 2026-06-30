from sqlalchemy import Column, String, DateTime, Boolean, ForeignKey, Integer, Text, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import uuid

class Dashboard(Base):
    __tablename__ = "dashboards"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    slug = Column(String, index=True)
    description = Column(Text)
    
    # Ownership
    owner_id = Column(String, ForeignKey("users.id"))
    organization_id = Column(String, ForeignKey("organizations.id"))
    
    # Configuration
    config = Column(Text)  # JSON string for dashboard config
    layout = Column(Text)  # JSON string for layout config
    theme = Column(String, default='dark')
    
    # Visibility & Sharing
    is_public = Column(Boolean, default=False)
    is_template = Column(Boolean, default=False)
    share_token = Column(String, unique=True)
    password_hash = Column(String)  # Optional password protection
    
    # Metadata
    tags = Column(Text)  # JSON array of tags
    category = Column(String)
    icon = Column(String)
    thumbnail_url = Column(String)
    
    # Statistics
    view_count = Column(Integer, default=0)
    star_count = Column(Integer, default=0)
    fork_count = Column(Integer, default=0)
    
    # Version control
    version = Column(Integer, default=1)
    parent_id = Column(String, ForeignKey("dashboards.id"))  # For forked dashboards
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    published_at = Column(DateTime(timezone=True))
    last_accessed_at = Column(DateTime(timezone=True))
    
    # Relationships
    owner = relationship("User", back_populates="dashboards")
    organization = relationship("Organization", back_populates="dashboards")
    widgets = relationship("Widget", back_populates="dashboard", cascade="all, delete-orphan")
    data_sources = relationship("DashboardDataSource", back_populates="dashboard")
    versions = relationship("DashboardVersion", back_populates="dashboard")
    shares = relationship("DashboardShare", back_populates="dashboard")

class Widget(Base):
    __tablename__ = "widgets"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    dashboard_id = Column(String, ForeignKey("dashboards.id"))
    
    # Widget configuration
    type = Column(String, nullable=False)  # metric, chart, table, text, etc.
    title = Column(String)
    description = Column(Text)
    
    # Position and size
    position_x = Column(Integer, default=0)
    position_y = Column(Integer, default=0)
    width = Column(Integer, default=3)
    height = Column(Integer, default=2)
    z_index = Column(Integer, default=0)
    
    # Data configuration
    data_source_id = Column(String, ForeignKey("data_sources.id"))
    query = Column(Text)  # SQL query or API endpoint
    filters = Column(Text)  # JSON string for filters
    aggregation = Column(String)  # sum, avg, min, max, count
    group_by = Column(String)
    
    # Visualization settings
    config = Column(Text)  # JSON string for widget-specific config
    style = Column(Text)  # JSON string for styling
    color_scheme = Column(String)
    
    # Behavior
    refresh_interval = Column(Integer, default=300)  # seconds
    is_interactive = Column(Boolean, default=True)
    is_locked = Column(Boolean, default=False)
    
    # Thresholds and alerts
    warning_threshold = Column(Float)
    critical_threshold = Column(Float)
    alert_enabled = Column(Boolean, default=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    dashboard = relationship("Dashboard", back_populates="widgets")
    data_source = relationship("DataSource", back_populates="widgets")

class DashboardDataSource(Base):
    __tablename__ = "dashboard_data_sources"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    dashboard_id = Column(String, ForeignKey("dashboards.id"))
    data_source_id = Column(String, ForeignKey("data_sources.id"))
    alias = Column(String)  # Optional alias for this data source in this dashboard
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    dashboard = relationship("Dashboard", back_populates="data_sources")
    data_source = relationship("DataSource")

class DashboardVersion(Base):
    __tablename__ = "dashboard_versions"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    dashboard_id = Column(String, ForeignKey("dashboards.id"))
    version_number = Column(Integer, nullable=False)
    
    # Snapshot of dashboard state
    config_snapshot = Column(Text)  # JSON string of complete dashboard config
    widgets_snapshot = Column(Text)  # JSON string of all widgets
    
    # Version metadata
    change_description = Column(Text)
    created_by_id = Column(String, ForeignKey("users.id"))
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    dashboard = relationship("Dashboard", back_populates="versions")
    created_by = relationship("User")

class DashboardShare(Base):
    __tablename__ = "dashboard_shares"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    dashboard_id = Column(String, ForeignKey("dashboards.id"))
    
    # Share settings
    share_type = Column(String)  # public, restricted, password
    share_token = Column(String, unique=True, index=True)
    password_hash = Column(String)
    
    # Permissions
    can_edit = Column(Boolean, default=False)
    can_duplicate = Column(Boolean, default=True)
    can_export = Column(Boolean, default=True)
    
    # Access control
    allowed_emails = Column(Text)  # JSON array of allowed email addresses
    allowed_domains = Column(Text)  # JSON array of allowed email domains
    
    # Expiration
    expires_at = Column(DateTime(timezone=True))
    max_views = Column(Integer)
    current_views = Column(Integer, default=0)
    
    # Metadata
    created_by_id = Column(String, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    last_accessed_at = Column(DateTime(timezone=True))
    
    # Relationships
    dashboard = relationship("Dashboard", back_populates="shares")
    created_by = relationship("User")
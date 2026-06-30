from sqlalchemy import Column, String, DateTime, Boolean, ForeignKey, Integer, Text, JSON, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base
import uuid
from datetime import datetime

class DataSource(Base):
    __tablename__ = "data_sources"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    organization_id = Column(String, ForeignKey("organizations.id"))
    
    # Basic info
    name = Column(String, nullable=False)
    description = Column(Text)
    type = Column(String, nullable=False)  # snowflake, postgres, mysql, oracle, api, csv, etc.
    
    # Connection configuration (encrypted JSON with all connection details)
    connection_config = Column(JSON, nullable=False)
    
    # Scheduling configuration  
    schedule_enabled = Column(Boolean, default=False)
    schedule_frequency = Column(String(20), default='daily')  # 'realtime', 'hourly', '6hours', 'daily', 'weekly'
    next_scheduled_run = Column(DateTime(timezone=True))
    
    # Validation rules
    validation_row_count_min = Column(Integer)
    validation_row_count_max = Column(Integer)
    validation_required_columns = Column(JSON)  # List of required column names
    validation_quality_checks = Column(JSON)    # Data quality check configurations
    
    # Configuration
    ssl_enabled = Column(Boolean, default=True)
    connection_timeout = Column(Integer, default=30)
    query_timeout = Column(Integer, default=120)
    max_rows = Column(Integer, default=10000)
    
    # Data discovery cache
    discovered_tables = Column(JSON)  # Cache of discovered table metadata
    last_discovery_scan = Column(DateTime(timezone=True))
    
    # Status
    is_active = Column(Boolean, default=True)
    last_connection_test = Column(DateTime(timezone=True))
    last_sync = Column(DateTime(timezone=True))
    connection_status = Column(String, default='unknown')  # connected, failed, unknown
    error_message = Column(Text)
    
    # Metadata discovery
    tables_metadata = Column(Text)  # JSON string of available tables/collections
    columns_metadata = Column(Text)  # JSON string of columns per table
    
    # Caching
    cache_enabled = Column(Boolean, default=True)
    cache_ttl = Column(Integer, default=300)  # seconds
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    organization = relationship("Organization", back_populates="data_sources")
    widgets = relationship("Widget", back_populates="data_source")
    queries = relationship("DataQuery", back_populates="data_source", cascade="all, delete-orphan")
    parameters = relationship("QueryParameter", back_populates="data_source", cascade="all, delete-orphan")
    executions = relationship("QueryExecution", back_populates="data_source", cascade="all, delete-orphan")
    
    def to_dict(self):
        return {
            "id": str(self.id),
            "organization_id": str(self.organization_id),
            "name": self.name,
            "description": self.description,
            "type": self.type,
            "connection_config": self.connection_config,
            "schedule_enabled": self.schedule_enabled,
            "schedule_frequency": self.schedule_frequency,
            "next_scheduled_run": self.next_scheduled_run.isoformat() if self.next_scheduled_run else None,
            "validation_row_count_min": self.validation_row_count_min,
            "validation_row_count_max": self.validation_row_count_max,
            "validation_required_columns": self.validation_required_columns,
            "validation_quality_checks": self.validation_quality_checks,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }

class DataQuery(Base):
    __tablename__ = "data_queries"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    data_source_id = Column(String, ForeignKey("data_sources.id"))
    
    # Query details
    name = Column(String(255), nullable=False)
    description = Column(Text)
    sql = Column(Text, nullable=False)
    query_type = Column(String)  # select, aggregate, timeseries, custom
    
    # Parameters and metadata
    parameters = Column(JSON, default=list)  # List of parameter names used in query
    estimated_rows = Column(Integer, default=0)
    status = Column(String(20), default='draft')  # 'draft', 'validated', 'active', 'error'
    
    # Preview data cache
    preview_data = Column(JSON)
    columns = Column(JSON)
    
    # Performance tracking
    last_executed = Column(DateTime(timezone=True))
    execution_time_ms = Column(Float)
    execution_count = Column(Integer, default=0)
    
    # Status and validation
    is_active = Column(Boolean, default=True)
    created_by = Column(String, ForeignKey("users.id"))
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    data_source = relationship("DataSource", back_populates="queries")
    executions = relationship("QueryExecution", back_populates="query", cascade="all, delete-orphan")
    creator = relationship("User")
    
    def to_dict(self):
        return {
            "id": str(self.id),
            "data_source_id": str(self.data_source_id),
            "name": self.name,
            "description": self.description,
            "sql": self.sql,
            "parameters": self.parameters,
            "estimated_rows": self.estimated_rows,
            "last_executed": self.last_executed.isoformat() if self.last_executed else None,
            "execution_time": self.execution_time_ms,
            "status": self.status,
            "preview_data": self.preview_data,
            "columns": self.columns,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "created_by": str(self.created_by)
        }

class QueryParameter(Base):
    """Parameters for dynamic queries"""
    __tablename__ = "query_parameters"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    data_source_id = Column(String, ForeignKey("data_sources.id"), nullable=False)
    name = Column(String(255), nullable=False)
    type = Column(String(50), nullable=False)  # 'string', 'number', 'date', 'boolean', 'array'
    default_value = Column(Text)
    description = Column(Text)
    required = Column(Boolean, default=False)
    
    # Parameter options and validation
    options = Column(JSON)  # Available options for the parameter
    validation_config = Column(JSON)  # Validation rules (min, max, pattern, etc.)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    created_by = Column(String, ForeignKey("users.id"))
    
    # Relationships
    data_source = relationship("DataSource", back_populates="parameters")
    creator = relationship("User")
    
    def to_dict(self):
        return {
            "name": self.name,
            "type": self.type,
            "default_value": self.default_value,
            "description": self.description,
            "required": self.required,
            "options": self.options,
            "validation": self.validation_config
        }

class QueryExecution(Base):
    """Query execution history and tracking"""
    __tablename__ = "query_executions"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    data_source_id = Column(String, ForeignKey("data_sources.id"), nullable=False)
    query_id = Column(String, ForeignKey("data_queries.id"), nullable=False)
    executed_by = Column(String, ForeignKey("users.id"), nullable=False)
    
    # Execution details
    executed_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    execution_time_ms = Column(Float, nullable=False)
    row_count = Column(Integer, nullable=False)
    status = Column(String(20), nullable=False)  # 'success', 'error'
    error = Column(Text)
    
    # Parameters used in execution
    parameters = Column(JSON, default=dict)
    
    # Result metadata
    result_columns = Column(JSON)
    result_size_bytes = Column(Integer)
    
    # Relationships
    data_source = relationship("DataSource", back_populates="executions")
    query = relationship("DataQuery", back_populates="executions")
    executor = relationship("User")

class TableDiscovery(Base):
    """Cache of discovered tables and their metadata"""
    __tablename__ = "table_discovery"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    data_source_id = Column(String, ForeignKey("data_sources.id"), nullable=False)
    
    # Table identification
    schema_name = Column(String(255), nullable=False)
    table_name = Column(String(255), nullable=False)
    table_type = Column(String(50), nullable=False)  # 'table', 'view', 'materialized_view'
    
    # Table metadata
    row_count = Column(Integer)
    column_count = Column(Integer)
    table_size_bytes = Column(Integer)
    last_updated = Column(DateTime(timezone=True))
    description = Column(Text)
    
    # Column information
    columns = Column(JSON, default=list)  # List of column metadata
    
    # Discovery metadata
    discovered_at = Column(DateTime(timezone=True), server_default=func.now())
    last_scanned = Column(DateTime(timezone=True), server_default=func.now())
    is_accessible = Column(Boolean, default=True)
    
    # Relationships
    data_source = relationship("DataSource")
    
    def to_dict(self):
        return {
            "schema": self.schema_name,
            "table": self.table_name,
            "type": self.table_type,
            "row_count": self.row_count or 0,
            "column_count": self.column_count or 0,
            "table_size_bytes": self.table_size_bytes,
            "last_updated": self.last_updated.isoformat() if self.last_updated else None,
            "description": self.description,
            "columns": self.columns or [],
            "discovered_at": self.discovered_at.isoformat(),
            "last_scanned": self.last_scanned.isoformat(),
            "is_accessible": self.is_accessible
        }

class DataQualityCheck(Base):
    """Data quality check results"""
    __tablename__ = "data_quality_checks"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    data_source_id = Column(String, ForeignKey("data_sources.id"), nullable=False)
    check_name = Column(String(255), nullable=False)
    check_type = Column(String(50), nullable=False)  # 'not_null', 'unique', 'range', 'format', 'custom'
    target_column = Column(String(255))
    target_table = Column(String(255))
    
    # Check configuration
    check_rule = Column(Text, nullable=False)
    check_config = Column(JSON, default=dict)
    
    # Results
    executed_at = Column(DateTime(timezone=True), server_default=func.now())
    status = Column(String(20), nullable=False)  # 'passed', 'failed', 'warning'
    score = Column(Float)  # Quality score 0-100
    details = Column(Text)
    
    # Statistics
    total_records = Column(Integer)
    passed_records = Column(Integer)
    failed_records = Column(Integer)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    created_by = Column(String, ForeignKey("users.id"))
    
    # Relationships
    data_source = relationship("DataSource")
    creator = relationship("User")
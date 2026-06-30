"""
Data source schemas for request/response validation
"""

from pydantic import BaseModel, Field, validator, SecretStr
from typing import Optional, List, Dict, Any, Union
from datetime import datetime
from enum import Enum
from .common import ValidationMixin, TimestampMixin

class DataSourceType(str, Enum):
    """Supported data source types"""
    SNOWFLAKE = "snowflake"
    AZURE = "azure"
    SERVICENOW = "servicenow"
    POSTGRESQL = "postgresql"
    MYSQL = "mysql"
    MSSQL = "mssql"
    ORACLE = "oracle"
    MONGODB = "mongodb"
    REST_API = "rest_api"
    CSV_FILE = "csv_file"
    EXCEL_FILE = "excel_file"

class ConnectionStatus(str, Enum):
    """Data source connection status"""
    CONNECTED = "connected"
    DISCONNECTED = "disconnected"
    ERROR = "error"
    TESTING = "testing"
    PENDING = "pending"

class AuthenticationType(str, Enum):
    """Authentication method options"""
    USERNAME_PASSWORD = "username_password"
    API_KEY = "api_key"
    OAUTH2 = "oauth2"
    SERVICE_ACCOUNT = "service_account"
    CONNECTION_STRING = "connection_string"
    CERTIFICATE = "certificate"

class DataSourceConfig(ValidationMixin):
    """Base data source configuration"""
    host: Optional[str] = Field(None, max_length=255, description="Database/API host")
    port: Optional[int] = Field(None, ge=1, le=65535, description="Connection port")
    database: Optional[str] = Field(None, max_length=100, description="Database name")
    schema_name: Optional[str] = Field(None, max_length=100, description="Schema name")
    
    # Authentication
    username: Optional[str] = Field(None, max_length=100, description="Username")
    password: Optional[SecretStr] = Field(None, description="Password (encrypted)")
    api_key: Optional[SecretStr] = Field(None, description="API key (encrypted)")
    api_secret: Optional[SecretStr] = Field(None, description="API secret (encrypted)")
    
    # Connection options
    ssl_enabled: bool = Field(True, description="Enable SSL/TLS")
    timeout: int = Field(30, ge=5, le=300, description="Connection timeout in seconds")
    max_connections: int = Field(5, ge=1, le=50, description="Max concurrent connections")
    
    # Additional configuration
    connection_params: Optional[Dict[str, Any]] = Field(default={}, description="Additional connection parameters")
    
    @validator('connection_params')
    def validate_connection_params(cls, v):
        if v and len(str(v)) > 10000:
            raise ValueError('Connection parameters too large')
        return v

class SnowflakeConfig(DataSourceConfig):
    """Snowflake-specific configuration"""
    account: str = Field(..., min_length=1, max_length=100, description="Snowflake account identifier")
    warehouse: Optional[str] = Field(None, max_length=100, description="Snowflake warehouse")
    role: Optional[str] = Field(None, max_length=100, description="Snowflake role")
    
class AzureConfig(DataSourceConfig):
    """Azure-specific configuration"""
    tenant_id: str = Field(..., min_length=1, description="Azure tenant ID")
    client_id: str = Field(..., min_length=1, description="Azure client ID")
    resource: Optional[str] = Field(None, description="Azure resource URL")
    
class ServiceNowConfig(DataSourceConfig):
    """ServiceNow-specific configuration"""
    instance: str = Field(..., min_length=1, max_length=100, description="ServiceNow instance name")
    api_version: str = Field("v1", description="API version")

class RestApiConfig(DataSourceConfig):
    """REST API configuration"""
    base_url: str = Field(..., min_length=1, description="Base API URL")
    headers: Optional[Dict[str, str]] = Field(default={}, description="Default headers")
    auth_type: AuthenticationType = Field(AuthenticationType.API_KEY, description="Authentication type")

class DataSource(TimestampMixin):
    """Data source schema"""
    id: int = Field(..., description="Data source ID")
    name: str = Field(..., min_length=1, max_length=100, description="Data source name")
    description: Optional[str] = Field(None, max_length=500, description="Data source description")
    type: DataSourceType = Field(..., description="Data source type")
    config: Dict[str, Any] = Field(..., description="Type-specific configuration")
    status: ConnectionStatus = Field(ConnectionStatus.PENDING, description="Connection status")
    last_tested: Optional[datetime] = Field(None, description="Last connection test")
    last_sync: Optional[datetime] = Field(None, description="Last successful sync")
    is_active: bool = Field(True, description="Data source active status")
    owner_id: int = Field(..., description="Data source owner ID")
    tags: List[str] = Field(default=[], description="Data source tags")
    
    class Config:
        from_attributes = True

class DataSourceCreate(ValidationMixin):
    """Data source creation request schema"""
    name: str = Field(..., min_length=1, max_length=100, description="Data source name")
    description: Optional[str] = Field(None, max_length=500, description="Data source description")
    type: DataSourceType = Field(..., description="Data source type")
    config: Dict[str, Any] = Field(..., description="Type-specific configuration")
    tags: Optional[List[str]] = Field(default=[], description="Data source tags")
    test_connection: bool = Field(True, description="Test connection after creation")
    
    @validator('config')
    def validate_config_size(cls, v):
        if len(str(v)) > 50000:
            raise ValueError('Configuration too large')
        return v
    
    @validator('tags')
    def validate_tags(cls, v):
        if v:
            if len(v) > 10:
                raise ValueError('Maximum 10 tags allowed')
            for tag in v:
                if not isinstance(tag, str) or len(tag) > 30:
                    raise ValueError('Tags must be strings with max 30 characters')
        return v or []

class DataSourceUpdate(ValidationMixin):
    """Data source update request schema"""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    config: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None
    tags: Optional[List[str]] = None
    
    @validator('config')
    def validate_config_size(cls, v):
        if v and len(str(v)) > 50000:
            raise ValueError('Configuration too large')
        return v
    
    @validator('tags')
    def validate_tags(cls, v):
        if v is not None:
            if len(v) > 10:
                raise ValueError('Maximum 10 tags allowed')
            for tag in v:
                if not isinstance(tag, str) or len(tag) > 30:
                    raise ValueError('Tags must be strings with max 30 characters')
        return v

class DataSourceTest(BaseModel):
    """Data source connection test request"""
    config: Dict[str, Any] = Field(..., description="Configuration to test")
    timeout: int = Field(30, ge=5, le=300, description="Test timeout in seconds")

class DataSourceTestResult(BaseModel):
    """Data source connection test result"""
    success: bool = Field(..., description="Test success status")
    message: str = Field(..., description="Test result message")
    details: Optional[Dict[str, Any]] = Field(default={}, description="Additional test details")
    response_time: Optional[float] = Field(None, description="Connection response time in seconds")
    tested_at: datetime = Field(default_factory=datetime.utcnow, description="Test timestamp")

class QueryRequest(ValidationMixin):
    """Data source query request"""
    query: str = Field(..., min_length=1, max_length=10000, description="SQL query or API endpoint")
    parameters: Optional[Dict[str, Any]] = Field(default={}, description="Query parameters")
    limit: int = Field(1000, ge=1, le=10000, description="Result limit")
    timeout: int = Field(60, ge=5, le=600, description="Query timeout in seconds")
    format: str = Field("json", pattern="^(json|csv|xlsx)$", description="Response format")
    
    @validator('query')
    def validate_query_content(cls, v):
        # Basic SQL injection protection
        dangerous_keywords = ['DROP', 'DELETE', 'TRUNCATE', 'ALTER', 'CREATE', 'INSERT', 'UPDATE']
        query_upper = v.upper()
        for keyword in dangerous_keywords:
            if keyword in query_upper:
                raise ValueError(f'Dangerous SQL keyword detected: {keyword}')
        return v

class QueryResult(BaseModel):
    """Data source query result"""
    success: bool = Field(..., description="Query success status")
    data: List[Dict[str, Any]] = Field(default=[], description="Query result data")
    columns: List[str] = Field(default=[], description="Result column names")
    row_count: int = Field(0, description="Number of rows returned")
    execution_time: float = Field(..., description="Query execution time in seconds")
    query: str = Field(..., description="Executed query")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Query timestamp")
    metadata: Optional[Dict[str, Any]] = Field(default={}, description="Additional metadata")

class DataSourceMetrics(BaseModel):
    """Data source usage metrics"""
    total_queries: int = Field(0, description="Total queries executed")
    successful_queries: int = Field(0, description="Successful queries")
    failed_queries: int = Field(0, description="Failed queries")
    avg_response_time: float = Field(0.0, description="Average response time in seconds")
    data_volume: int = Field(0, description="Total data volume in bytes")
    last_activity: Optional[datetime] = Field(None, description="Last query timestamp")
    uptime_percentage: float = Field(0.0, ge=0, le=100, description="Uptime percentage")

class DataSourceSync(BaseModel):
    """Data source sync configuration"""
    enabled: bool = Field(False, description="Enable automatic sync")
    interval_minutes: int = Field(60, ge=1, le=10080, description="Sync interval in minutes")
    tables: Optional[List[str]] = Field(default=[], description="Tables to sync")
    incremental: bool = Field(True, description="Use incremental sync")
    last_sync_key: Optional[str] = Field(None, description="Last sync key for incremental sync")
    
class DataSourceUsage(BaseModel):
    """Data source usage tracking"""
    date: datetime = Field(..., description="Usage date")
    queries_count: int = Field(0, description="Number of queries")
    data_transferred: int = Field(0, description="Data transferred in bytes")
    unique_users: int = Field(0, description="Number of unique users")
    avg_response_time: float = Field(0.0, description="Average response time")
    error_rate: float = Field(0.0, ge=0, le=100, description="Error rate percentage")
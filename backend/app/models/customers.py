"""
Customer Model and Credential Management for DataChart
Handles multi-tenant customer data and encrypted API credentials
"""

import json
import uuid
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from enum import Enum

from sqlalchemy import (
    Column, String, Integer, Boolean, DateTime, JSON, Text, 
    ForeignKey, Index, UniqueConstraint, Float, Table
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship, Session
from sqlalchemy.dialects.postgresql import UUID
from cryptography.fernet import Fernet
from pydantic import BaseModel, Field, EmailStr, SecretStr, validator
import bcrypt

Base = declarative_base()

# Association tables for many-to-many relationships
customer_users = Table(
    'customer_users',
    Base.metadata,
    Column('customer_id', UUID(as_uuid=True), ForeignKey('customers.id')),
    Column('user_id', UUID(as_uuid=True), ForeignKey('users.id')),
    Column('role', String(50), default='viewer'),
    Column('added_at', DateTime, default=datetime.utcnow)
)

class CustomerTier(str, Enum):
    """Customer subscription tiers"""
    TRIAL = "trial"
    STARTER = "starter"  # $3K/month
    PROFESSIONAL = "professional"  # $7K/month
    ENTERPRISE = "enterprise"  # $15K/month


class Customer(Base):
    """
    Customer model for multi-tenant architecture
    Represents a DataChart customer organization
    """
    __tablename__ = 'customers'
    
    # Primary fields
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_name = Column(String(255), nullable=False)
    company_domain = Column(String(255), unique=True, nullable=False)
    
    # Subscription details
    tier = Column(String(50), default=CustomerTier.TRIAL.value)
    subscription_status = Column(String(50), default='active')
    trial_ends_at = Column(DateTime)
    subscription_started_at = Column(DateTime, default=datetime.utcnow)
    subscription_renewed_at = Column(DateTime)
    next_billing_date = Column(DateTime)
    
    # Usage limits based on tier
    max_users = Column(Integer, default=3)
    max_dashboards = Column(Integer, default=5)
    max_data_sources = Column(Integer, default=2)
    max_api_calls_per_month = Column(Integer, default=10000)
    
    # Current usage tracking
    current_users = Column(Integer, default=0)
    current_dashboards = Column(Integer, default=0)
    current_data_sources = Column(Integer, default=0)
    api_calls_this_month = Column(Integer, default=0)
    api_calls_reset_date = Column(DateTime, default=datetime.utcnow)
    
    # Contact information
    primary_contact_name = Column(String(255))
    primary_contact_email = Column(String(255))
    primary_contact_phone = Column(String(50))
    billing_email = Column(String(255))
    
    # Company details
    employee_count = Column(Integer)
    industry = Column(String(100))
    annual_it_spend = Column(Float)
    country = Column(String(100))
    timezone = Column(String(50), default='UTC')
    
    # Security settings
    ip_whitelist = Column(JSON, default=list)
    mfa_required = Column(Boolean, default=False)
    sso_enabled = Column(Boolean, default=False)
    sso_provider = Column(String(50))  # azure_ad, okta, etc.
    api_key = Column(String(255))  # Hashed API key for programmatic access
    api_key_created_at = Column(DateTime)
    
    # Audit fields
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = Column(String(255))
    onboarding_completed = Column(Boolean, default=False)
    onboarding_completed_at = Column(DateTime)
    
    # Relationships
    users = relationship("User", secondary=customer_users, back_populates="customers")
    credentials = relationship("CustomerCredential", back_populates="customer", cascade="all, delete-orphan")
    dashboards = relationship("Dashboard", back_populates="customer", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="customer", cascade="all, delete-orphan")
    
    # Indexes
    __table_args__ = (
        Index('idx_customer_domain', 'company_domain'),
        Index('idx_customer_tier', 'tier'),
        Index('idx_customer_status', 'subscription_status'),
    )
    
    def generate_api_key(self) -> str:
        """Generate a new API key for the customer"""
        raw_key = f"ck_{uuid.uuid4().hex}"
        self.api_key = bcrypt.hashpw(raw_key.encode(), bcrypt.gensalt()).decode()
        self.api_key_created_at = datetime.utcnow()
        return raw_key
    
    def verify_api_key(self, api_key: str) -> bool:
        """Verify an API key against the stored hash"""
        if not self.api_key:
            return False
        return bcrypt.checkpw(api_key.encode(), self.api_key.encode())
    
    def is_within_limits(self, resource: str) -> bool:
        """Check if customer is within usage limits"""
        limits = {
            'users': self.current_users < self.max_users,
            'dashboards': self.current_dashboards < self.max_dashboards,
            'data_sources': self.current_data_sources < self.max_data_sources,
            'api_calls': self.api_calls_this_month < self.max_api_calls_per_month,
        }
        return limits.get(resource, True)
    
    def reset_monthly_usage(self):
        """Reset monthly usage counters"""
        self.api_calls_this_month = 0
        self.api_calls_reset_date = datetime.utcnow()


class CredentialType(str, Enum):
    """Types of data source credentials"""
    SNOWFLAKE = "snowflake"
    AZURE = "azure"
    SERVICENOW = "servicenow"
    SALESFORCE = "salesforce"
    ORACLE = "oracle"
    POSTGRES = "postgres"
    API_KEY = "api_key"
    OAUTH = "oauth"


class CustomerCredential(Base):
    """
    Encrypted credentials storage for customer data sources
    Each customer can have multiple credentials for different systems
    """
    __tablename__ = 'customer_credentials'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    customer_id = Column(UUID(as_uuid=True), ForeignKey('customers.id'), nullable=False)
    
    # Credential identification
    name = Column(String(255), nullable=False)  # e.g., "Production Snowflake"
    credential_type = Column(String(50), nullable=False)
    is_active = Column(Boolean, default=True)
    is_default = Column(Boolean, default=False)  # Default credential for this type
    
    # Encrypted credential data
    encrypted_credentials = Column(Text, nullable=False)  # JSON string, encrypted
    encryption_key_id = Column(String(100))  # Reference to key management system
    
    # Connection validation
    last_validated_at = Column(DateTime)
    validation_status = Column(String(50))  # valid, invalid, untested
    validation_error = Column(Text)
    connection_test_passed = Column(Boolean, default=False)
    
    # Usage tracking
    last_used_at = Column(DateTime)
    usage_count = Column(Integer, default=0)
    
    # Audit fields
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = Column(String(255))
    expires_at = Column(DateTime)  # For rotating credentials
    
    # Relationships
    customer = relationship("Customer", back_populates="credentials")
    
    # Indexes
    __table_args__ = (
        UniqueConstraint('customer_id', 'name', name='_customer_credential_name_uc'),
        Index('idx_credential_type', 'credential_type'),
        Index('idx_credential_customer', 'customer_id'),
    )
    
    def encrypt_credentials(self, credentials_dict: Dict, encryption_key: bytes) -> None:
        """Encrypt and store credentials"""
        fernet = Fernet(encryption_key)
        json_str = json.dumps(credentials_dict)
        self.encrypted_credentials = fernet.encrypt(json_str.encode()).decode()
    
    def decrypt_credentials(self, encryption_key: bytes) -> Dict:
        """Decrypt and return credentials"""
        if not self.encrypted_credentials:
            return {}
        fernet = Fernet(encryption_key)
        decrypted = fernet.decrypt(self.encrypted_credentials.encode())
        return json.loads(decrypted.decode())


class User(Base):
    """
    User model for customer team members
    """
    __tablename__ = 'users'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False)
    full_name = Column(String(255))
    password_hash = Column(String(255))  # Bcrypt hash
    
    # User status
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    verification_token = Column(String(255))
    verification_sent_at = Column(DateTime)
    
    # Authentication
    last_login_at = Column(DateTime)
    last_login_ip = Column(String(50))
    failed_login_attempts = Column(Integer, default=0)
    account_locked_until = Column(DateTime)
    
    # MFA settings
    mfa_enabled = Column(Boolean, default=False)
    mfa_secret = Column(String(255))
    
    # Password reset
    reset_token = Column(String(255))
    reset_token_expires = Column(DateTime)
    
    # Audit fields
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    customers = relationship("Customer", secondary=customer_users, back_populates="users")
    created_dashboards = relationship("Dashboard", back_populates="created_by_user")
    
    def set_password(self, password: str) -> None:
        """Hash and set user password"""
        self.password_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
    
    def verify_password(self, password: str) -> bool:
        """Verify password against hash"""
        if not self.password_hash:
            return False
        return bcrypt.checkpw(password.encode(), self.password_hash.encode())
    
    def generate_reset_token(self) -> str:
        """Generate password reset token"""
        token = uuid.uuid4().hex
        self.reset_token = bcrypt.hashpw(token.encode(), bcrypt.gensalt()).decode()
        self.reset_token_expires = datetime.utcnow() + timedelta(hours=24)
        return token


class Dashboard(Base):
    """
    Dashboard configuration model
    """
    __tablename__ = 'dashboards'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    customer_id = Column(UUID(as_uuid=True), ForeignKey('customers.id'), nullable=False)
    created_by_user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'))
    
    # Dashboard details
    name = Column(String(255), nullable=False)
    description = Column(Text)
    slug = Column(String(255))  # URL-friendly name
    
    # Configuration
    layout_config = Column(JSON)  # Grid layout, widget positions
    widgets_config = Column(JSON)  # Widget types, data sources, settings
    filters_config = Column(JSON)  # Global filters
    theme_config = Column(JSON)  # Custom theme overrides
    
    # Settings
    is_public = Column(Boolean, default=False)
    is_template = Column(Boolean, default=False)
    refresh_interval = Column(Integer, default=300)  # Seconds
    
    # Usage tracking
    view_count = Column(Integer, default=0)
    last_viewed_at = Column(DateTime)
    
    # Audit fields
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    customer = relationship("Customer", back_populates="dashboards")
    created_by_user = relationship("User", back_populates="created_dashboards")
    
    __table_args__ = (
        UniqueConstraint('customer_id', 'slug', name='_customer_dashboard_slug_uc'),
        Index('idx_dashboard_customer', 'customer_id'),
    )


class AuditLog(Base):
    """
    Audit log for tracking all customer data access
    """
    __tablename__ = 'audit_logs'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    customer_id = Column(UUID(as_uuid=True), ForeignKey('customers.id'), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'))
    
    # Action details
    action = Column(String(100), nullable=False)  # query_data, update_credential, etc.
    resource_type = Column(String(50))  # dashboard, credential, data_source
    resource_id = Column(String(255))
    
    # Query details (for data access)
    query_type = Column(String(100))  # vendor_spend, application_metrics, etc.
    query_hash = Column(String(255))  # Hash of the query for deduplication
    query_time_ms = Column(Integer)  # Query execution time
    rows_returned = Column(Integer)
    
    # Request details
    ip_address = Column(String(50))
    user_agent = Column(String(500))
    request_method = Column(String(10))
    request_path = Column(String(500))
    
    # Response
    response_status = Column(Integer)
    error_message = Column(Text)
    
    # Timestamp
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    customer = relationship("Customer", back_populates="audit_logs")
    
    # Indexes
    __table_args__ = (
        Index('idx_audit_customer_timestamp', 'customer_id', 'timestamp'),
        Index('idx_audit_action', 'action'),
        Index('idx_audit_user', 'user_id'),
    )


# Pydantic models for API validation
class CustomerCreate(BaseModel):
    """Schema for creating a new customer"""
    company_name: str = Field(..., min_length=1, max_length=255)
    company_domain: str = Field(..., min_length=1, max_length=255)
    primary_contact_name: str
    primary_contact_email: EmailStr
    primary_contact_phone: Optional[str] = None
    employee_count: Optional[int] = None
    industry: Optional[str] = None
    country: str = "USA"
    timezone: str = "America/New_York"
    tier: CustomerTier = CustomerTier.TRIAL
    

class CustomerUpdate(BaseModel):
    """Schema for updating customer details"""
    company_name: Optional[str] = None
    primary_contact_name: Optional[str] = None
    primary_contact_email: Optional[EmailStr] = None
    primary_contact_phone: Optional[str] = None
    billing_email: Optional[EmailStr] = None
    employee_count: Optional[int] = None
    industry: Optional[str] = None
    annual_it_spend: Optional[float] = None
    country: Optional[str] = None
    timezone: Optional[str] = None
    ip_whitelist: Optional[List[str]] = None
    mfa_required: Optional[bool] = None
    

class CredentialCreate(BaseModel):
    """Schema for creating new credentials"""
    name: str = Field(..., min_length=1, max_length=255)
    credential_type: CredentialType
    credentials: Dict[str, Any]  # Will be encrypted
    is_default: bool = False
    
    @validator('credentials')
    def validate_credentials(cls, v, values):
        """Validate required fields based on credential type"""
        cred_type = values.get('credential_type')
        
        if cred_type == CredentialType.SNOWFLAKE:
            required = ['account', 'username', 'password', 'warehouse', 'database']
            if not all(field in v for field in required):
                raise ValueError(f"Snowflake credentials require: {required}")
        
        elif cred_type == CredentialType.AZURE:
            required = ['tenant_id', 'client_id', 'client_secret', 'subscription_id']
            if not all(field in v for field in required):
                raise ValueError(f"Azure credentials require: {required}")
        
        elif cred_type == CredentialType.SERVICENOW:
            required = ['instance_url', 'username', 'password']
            if not all(field in v for field in required):
                raise ValueError(f"ServiceNow credentials require: {required}")
        
        return v


class UserCreate(BaseModel):
    """Schema for creating a new user"""
    email: EmailStr
    full_name: str
    password: SecretStr = Field(..., min_length=8)
    customer_id: Optional[str] = None
    role: str = "viewer"  # viewer, editor, admin
    

class UserLogin(BaseModel):
    """Schema for user login"""
    email: EmailStr
    password: SecretStr
    

class DashboardCreate(BaseModel):
    """Schema for creating a dashboard"""
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    layout_config: Optional[Dict] = None
    widgets_config: Optional[Dict] = None
    filters_config: Optional[Dict] = None
    theme_config: Optional[Dict] = None
    is_public: bool = False
    refresh_interval: int = 300
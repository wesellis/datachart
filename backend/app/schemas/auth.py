"""
Authentication schemas for request/response validation
"""

from pydantic import BaseModel, Field, validator, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime
from .common import ValidationMixin, TimestampMixin

class UserRegistration(ValidationMixin):
    """User registration request schema"""
    email: EmailStr = Field(..., description="User's email address")
    password: str = Field(..., min_length=8, max_length=128, description="User's password")
    first_name: str = Field(..., min_length=1, max_length=50, description="User's first name")
    last_name: str = Field(..., min_length=1, max_length=50, description="User's last name")
    company_name: Optional[str] = Field(None, max_length=100, description="Company name")
    phone: Optional[str] = Field(None, description="Phone number")
    
    @validator('email')
    def validate_email_format(cls, v):
        return cls.validate_email(v)
    
    @validator('password')
    def validate_password(cls, v):
        return cls.validate_password_strength(v)
    
    @validator('phone')
    def validate_phone_format(cls, v):
        if v:
            return cls.validate_phone(v)
        return v
    
    @validator('first_name', 'last_name')
    def validate_names(cls, v):
        if not v.replace(' ', '').isalpha():
            raise ValueError('Names must contain only letters and spaces')
        return v.strip().title()

class UserCreate(UserRegistration):
    """Alias for UserRegistration for compatibility"""
    pass

class UserLogin(BaseModel):
    """User login request schema"""
    email: EmailStr = Field(..., description="User's email address")
    password: str = Field(..., min_length=1, max_length=128, description="User's password")
    remember_me: bool = Field(False, description="Remember login session")

class PasswordReset(BaseModel):
    """Password reset request schema"""
    email: EmailStr = Field(..., description="User's email address")

class PasswordResetConfirm(ValidationMixin):
    """Password reset confirmation schema"""
    token: str = Field(..., min_length=32, max_length=128, description="Reset token")
    password: str = Field(..., min_length=8, max_length=128, description="New password")
    
    @validator('password')
    def validate_password(cls, v):
        return cls.validate_password_strength(v)

class PasswordChange(ValidationMixin):
    """Password change request schema"""
    current_password: str = Field(..., min_length=1, max_length=128)
    new_password: str = Field(..., min_length=8, max_length=128)
    
    @validator('new_password')
    def validate_new_password(cls, v):
        return cls.validate_password_strength(v)

class TokenRefresh(BaseModel):
    """Token refresh request schema"""
    refresh_token: str = Field(..., description="Valid refresh token")

class UserProfile(TimestampMixin):
    """User profile response schema"""
    id: int = Field(..., description="User ID")
    email: str = Field(..., description="User's email address")
    first_name: str = Field(..., description="User's first name")
    last_name: str = Field(..., description="User's last name")
    company_name: Optional[str] = Field(None, description="Company name")
    phone: Optional[str] = Field(None, description="Phone number")
    is_active: bool = Field(True, description="User account status")
    is_admin: bool = Field(False, description="Admin privileges")
    subscription_tier: str = Field("basic", description="Subscription tier")
    last_login: Optional[datetime] = Field(None, description="Last login timestamp")
    
    class Config:
        from_attributes = True

class UserProfileUpdate(ValidationMixin):
    """User profile update request schema"""
    first_name: Optional[str] = Field(None, min_length=1, max_length=50)
    last_name: Optional[str] = Field(None, min_length=1, max_length=50)  
    company_name: Optional[str] = Field(None, max_length=100)
    phone: Optional[str] = Field(None)
    
    @validator('phone')
    def validate_phone_format(cls, v):
        if v:
            return cls.validate_phone(v)
        return v
    
    @validator('first_name', 'last_name')
    def validate_names(cls, v):
        if v and not v.replace(' ', '').isalpha():
            raise ValueError('Names must contain only letters and spaces')
        return v.strip().title() if v else v

class AuthTokens(BaseModel):
    """Authentication tokens response schema"""
    access_token: str = Field(..., description="JWT access token")
    refresh_token: str = Field(..., description="JWT refresh token")  
    token_type: str = Field("bearer", description="Token type")
    expires_in: int = Field(..., description="Token expiration time in seconds")

class AuthResponse(BaseModel):
    """Complete authentication response schema"""
    user: UserProfile = Field(..., description="User profile information")
    tokens: AuthTokens = Field(..., description="Authentication tokens")
    message: str = Field("Authentication successful", description="Success message")

class LoginAttempt(TimestampMixin, BaseModel):
    """Login attempt tracking schema"""
    id: int
    user_id: Optional[int] = None
    email: str
    ip_address: str
    user_agent: Optional[str] = None
    success: bool
    failure_reason: Optional[str] = None
    
    class Config:
        from_attributes = True

class SecuritySettings(BaseModel):
    """User security settings schema"""
    two_factor_enabled: bool = Field(False, description="Two-factor authentication status")
    login_notifications: bool = Field(True, description="Email notifications for logins")
    session_timeout: int = Field(30, ge=5, le=1440, description="Session timeout in minutes")
    allowed_ip_ranges: Optional[List[str]] = Field(None, description="Allowed IP ranges")

class APIKey(TimestampMixin, BaseModel):
    """API key schema"""
    id: int
    name: str = Field(..., min_length=1, max_length=50, description="API key name")
    key_preview: str = Field(..., description="First 8 characters of API key")
    permissions: List[str] = Field(default=[], description="API key permissions")
    last_used: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    is_active: bool = True
    
    class Config:
        from_attributes = True

class APIKeyCreate(BaseModel):
    """API key creation request schema"""
    name: str = Field(..., min_length=1, max_length=50, description="API key name")
    permissions: List[str] = Field(default=[], description="API key permissions")
    expires_days: Optional[int] = Field(None, ge=1, le=365, description="Expiration in days")

class UserCreate(ValidationMixin, BaseModel):
    """User creation request schema (admin only)"""
    email: EmailStr = Field(..., description="User's email address")
    password: Optional[str] = Field(None, min_length=8, max_length=128, description="User's password")
    first_name: str = Field(..., min_length=1, max_length=50, description="User's first name")
    last_name: str = Field(..., min_length=1, max_length=50, description="User's last name")
    company_name: Optional[str] = Field(None, max_length=100, description="Company name")
    phone: Optional[str] = Field(None, description="Phone number")
    organization_id: Optional[int] = Field(None, description="Organization ID")
    
    @validator('email')
    def validate_email_format(cls, v):
        return cls.validate_email(v)
    
    @validator('password')
    def validate_password_strength_if_provided(cls, v):
        if v:
            return cls.validate_password_strength(v)
        return v
    
    @validator('phone')
    def validate_phone_format(cls, v):
        if v:
            return cls.validate_phone(v)
        return v

class UserUpdate(BaseModel):
    """User update request schema (admin only)"""
    first_name: Optional[str] = Field(None, min_length=1, max_length=50)
    last_name: Optional[str] = Field(None, min_length=1, max_length=50)
    company_name: Optional[str] = Field(None, max_length=100)
    phone: Optional[str] = Field(None)
    password: Optional[str] = Field(None, min_length=8, max_length=128)
    is_active: Optional[bool] = None
    organization_id: Optional[int] = None

class OrganizationCreate(BaseModel):
    """Organization creation request schema"""
    name: str = Field(..., min_length=1, max_length=100, description="Organization name")
    domain: Optional[str] = Field(None, max_length=100, description="Organization domain")
    subscription_tier: str = Field("basic", description="Subscription tier")
    max_users: int = Field(10, ge=1, le=10000, description="Maximum users allowed")

class OrganizationUpdate(BaseModel):
    """Organization update request schema"""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    domain: Optional[str] = Field(None, max_length=100)
    subscription_tier: Optional[str] = None
    max_users: Optional[int] = Field(None, ge=1, le=10000)
    is_active: Optional[bool] = None

class Organization(TimestampMixin, BaseModel):
    """Organization response schema"""
    id: int
    name: str
    domain: Optional[str] = None
    subscription_tier: str
    max_users: int
    is_active: bool
    
    class Config:
        from_attributes = True

class UserRole(BaseModel):
    """User role schema"""
    id: int
    name: str
    description: Optional[str] = None
    permissions: List[str] = Field(default=[])
    
    class Config:
        from_attributes = True
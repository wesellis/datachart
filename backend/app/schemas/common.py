"""
Common schemas and validation utilities
"""

from pydantic import BaseModel, Field, validator
from typing import Optional, Dict, Any, List
from datetime import datetime
from enum import Enum
import re

class SuccessResponse(BaseModel):
    """Standard success response format"""
    success: bool = True
    message: str = "Operation completed successfully"
    data: Optional[Dict[str, Any]] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class ErrorResponse(BaseModel):
    """Standard error response format"""
    success: bool = False
    error: Dict[str, Any]
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class PaginationParams(BaseModel):
    """Pagination parameters"""
    page: int = Field(1, ge=1, le=1000, description="Page number (1-based)")
    limit: int = Field(10, ge=1, le=100, description="Items per page")
    sort_by: Optional[str] = Field(None, description="Field to sort by")
    sort_order: str = Field("asc", pattern="^(asc|desc)$", description="Sort order")

class FilterParams(BaseModel):
    """Common filtering parameters"""
    search: Optional[str] = Field(None, min_length=1, max_length=255)
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    
    @validator('date_to')
    def validate_date_range(cls, v, values):
        if v and 'date_from' in values and values['date_from']:
            if v < values['date_from']:
                raise ValueError('date_to must be after date_from')
        return v

class SortOrder(str, Enum):
    """Sort order options"""
    ASC = "asc"
    DESC = "desc"

class ValidationMixin(BaseModel):
    """Common validation methods"""
    
    @validator('*', pre=True)
    def empty_str_to_none(cls, v):
        """Convert empty strings to None"""
        if isinstance(v, str) and v.strip() == '':
            return None
        return v
    
    @staticmethod
    def validate_email(email: str) -> str:
        """Validate email format"""
        email_regex = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_regex, email):
            raise ValueError('Invalid email format')
        return email.lower()
    
    @staticmethod  
    def validate_phone(phone: str) -> str:
        """Validate phone number format"""
        phone_cleaned = re.sub(r'[^\d+]', '', phone)
        if len(phone_cleaned) < 10 or len(phone_cleaned) > 15:
            raise ValueError('Phone number must be 10-15 digits')
        return phone_cleaned
    
    @staticmethod
    def validate_password_strength(password: str) -> str:
        """Validate password meets security requirements"""
        if len(password) < 8:
            raise ValueError('Password must be at least 8 characters long')
        
        if not re.search(r'[A-Z]', password):
            raise ValueError('Password must contain at least one uppercase letter')
        
        if not re.search(r'[a-z]', password):
            raise ValueError('Password must contain at least one lowercase letter')
        
        if not re.search(r'\d', password):
            raise ValueError('Password must contain at least one digit')
        
        if not re.search(r'[!@#$%^&*()_+\-=\[\]{};\':"\\|,.<>?]', password):
            raise ValueError('Password must contain at least one special character')
        
        return password

class MetadataSchema(BaseModel):
    """Metadata for API responses"""
    total_count: Optional[int] = None
    page: Optional[int] = None
    limit: Optional[int] = None
    total_pages: Optional[int] = None
    has_next: Optional[bool] = None
    has_prev: Optional[bool] = None

class TimestampMixin(BaseModel):
    """Mixin for timestamp fields"""
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
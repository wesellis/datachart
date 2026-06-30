from sqlalchemy import Column, String, DateTime, Boolean, ForeignKey, Table, Integer
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
from passlib.context import CryptContext
import uuid
import secrets
import string

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Association table for many-to-many relationship between users and organizations
user_organizations = Table(
    'user_organizations',
    Base.metadata,
    Column('user_id', String, ForeignKey('users.id')),
    Column('organization_id', String, ForeignKey('organizations.id')),
    Column('role', String, default='viewer'),  # admin, editor, viewer
    Column('joined_at', DateTime(timezone=True), server_default=func.now())
)

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True)
    first_name = Column(String)
    last_name = Column(String)
    full_name = Column(String)  # Keep for compatibility
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    is_super_admin = Column(Boolean, default=False)
    is_verified = Column(Boolean, default=False)
    avatar_url = Column(String)
    phone_number = Column(String)
    timezone = Column(String, default='UTC')
    language = Column(String, default='en')
    
    # User management fields
    organization_id = Column(Integer, ForeignKey("organizations.id"))
    role_id = Column(Integer, ForeignKey("user_roles.id"))
    password_reset_required = Column(Boolean, default=False)
    created_by = Column(Integer, ForeignKey("users.id"))
    updated_by = Column(Integer, ForeignKey("users.id"))
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_login = Column(DateTime(timezone=True))
    email_verified_at = Column(DateTime(timezone=True))
    
    # Relationships
    organization = relationship("Organization", back_populates="users", foreign_keys=[organization_id])
    role = relationship("UserRole", back_populates="users")
    dashboards = relationship("Dashboard", back_populates="owner")
    api_keys = relationship("APIKey", back_populates="user")
    
    # Self-referential relationships for created_by/updated_by
    creator = relationship("User", remote_side=[id], foreign_keys=[created_by])
    updater = relationship("User", remote_side=[id], foreign_keys=[updated_by])
    
    def set_password(self, password: str):
        """Set password hash"""
        self.hashed_password = pwd_context.hash(password)
    
    def verify_password(self, password: str) -> bool:
        """Verify password against hash"""
        return pwd_context.verify(password, self.hashed_password)
    
    def generate_temp_password(self) -> str:
        """Generate temporary password"""
        chars = string.ascii_letters + string.digits + "!@#$%^&*"
        return ''.join(secrets.choice(chars) for _ in range(12))
    
    @property
    def display_name(self) -> str:
        """Get display name"""
        if self.first_name and self.last_name:
            return f"{self.first_name} {self.last_name}"
        return self.full_name or self.username or self.email
    
class UserRole(Base):
    __tablename__ = "user_roles"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, unique=True, nullable=False)  # admin, editor, viewer, etc.
    description = Column(String)
    permissions = Column(String)  # JSON string of permissions
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    users = relationship("User", back_populates="role")

class Permission(Base):
    __tablename__ = "permissions"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, unique=True, nullable=False)
    resource = Column(String, nullable=False)  # users, dashboards, etc.
    action = Column(String, nullable=False)  # create, read, update, delete
    description = Column(String)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Organization(Base):
    __tablename__ = "organizations"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False)
    slug = Column(String, unique=True, index=True)
    domain = Column(String, unique=True)
    logo_url = Column(String)
    description = Column(String)
    industry = Column(String)
    size = Column(String)  # small, medium, large, enterprise
    
    # Settings
    settings = Column(String)  # JSON string for org settings
    subscription_tier = Column(String, default='free')  # free, starter, professional, enterprise
    subscription_status = Column(String, default='active')  # active, suspended, cancelled, cancel_at_period_end
    trial_ends_at = Column(DateTime(timezone=True))
    
    # Stripe integration
    stripe_customer_id = Column(String, unique=True, index=True)
    stripe_subscription_id = Column(String, unique=True, index=True)
    
    # Limits
    max_users = Column(Integer, default=5)
    max_dashboards = Column(Integer, default=10)
    max_data_sources = Column(Integer, default=3)
    max_widgets_per_dashboard = Column(Integer, default=20)
    
    # Audit fields
    created_by = Column(Integer, ForeignKey("users.id"))
    updated_by = Column(Integer, ForeignKey("users.id"))
    is_active = Column(Boolean, default=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    users = relationship("User", back_populates="organization", foreign_keys="User.organization_id")
    dashboards = relationship("Dashboard", back_populates="organization")
    data_sources = relationship("DataSource", back_populates="organization")
    
class APIKey(Base):
    __tablename__ = "api_keys"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"))
    name = Column(String, nullable=False)
    key_hash = Column(String, nullable=False, unique=True)
    last_used_at = Column(DateTime(timezone=True))
    expires_at = Column(DateTime(timezone=True))
    is_active = Column(Boolean, default=True)
    permissions = Column(String)  # JSON string for API permissions
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="api_keys")
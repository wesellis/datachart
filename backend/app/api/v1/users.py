"""
User Management API Routes
Handles user CRUD, profile management, permissions, and organization management
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from datetime import datetime

from app.core.database import get_db
from app.core.auth import get_current_user
from app.models.user import User, Organization, UserRole, Permission

# Create a temporary admin check function
async def get_current_admin_user(current_user: User = Depends(get_current_user)) -> User:
    """Verify current user has admin privileges"""
    if not current_user.is_superuser and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    return current_user
from app.schemas.auth import (
    UserProfile, UserProfileUpdate, UserCreate, UserUpdate,
    OrganizationCreate, OrganizationUpdate, Organization as OrganizationSchema,
    UserRole as UserRoleSchema
)
from app.schemas.common import SuccessResponse, PaginationParams, MetadataSchema
from app.services.email_service import send_user_invitation, send_password_reset
from app.core.errors import NotFoundError, AuthorizationError, ValidationError

router = APIRouter()

@router.get("/me", response_model=UserProfile)
async def get_current_user_profile(
    current_user: User = Depends(get_current_user)
):
    """Get current user's profile information"""
    return UserProfile.from_orm(current_user)

@router.put("/me", response_model=UserProfile)
async def update_current_user_profile(
    user_update: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update current user's profile"""
    try:
        # Update user fields
        for field, value in user_update.dict(exclude_unset=True).items():
            if hasattr(current_user, field):
                setattr(current_user, field, value)
        
        current_user.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(current_user)
        
        return UserProfile.from_orm(current_user)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to update profile: {str(e)}"
        )

@router.get("/", response_model=List[UserProfile])
async def list_users(
    pagination: PaginationParams = Depends(),
    organization_id: Optional[int] = Query(None),
    role: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """List users (admin only)"""
    query = db.query(User)
    
    # Filter by organization if specified
    if organization_id:
        query = query.filter(User.organization_id == organization_id)
    
    # Filter by role if specified
    if role:
        query = query.join(UserRole).filter(UserRole.name == role)
    
    # Filter by active status
    if is_active is not None:
        query = query.filter(User.is_active == is_active)
    
    # Apply pagination
    total_count = query.count()
    users = query.offset((pagination.page - 1) * pagination.limit).limit(pagination.limit).all()
    
    return [UserProfile.from_orm(user) for user in users]

@router.get("/{user_id}", response_model=UserProfile)
async def get_user(
    user_id: int,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Get user by ID (admin only)"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise NotFoundError("User not found")
    
    return UserProfile.from_orm(user)

@router.post("/", response_model=UserProfile)
async def create_user(
    user_create: UserCreate,
    send_invitation: bool = Query(True, description="Send email invitation to user"),
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Create a new user (admin only)"""
    try:
        # Check if email already exists
        existing_user = db.query(User).filter(User.email == user_create.email).first()
        if existing_user:
            raise ValidationError("Email already registered")
        
        # Create user
        user = User(
            email=user_create.email,
            first_name=user_create.first_name,
            last_name=user_create.last_name,
            organization_id=user_create.organization_id or current_user.organization_id,
            is_active=True,
            created_by=current_user.id
        )
        
        # Set temporary password if provided, otherwise generate one
        if user_create.password:
            user.set_password(user_create.password)
        else:
            temp_password = user.generate_temp_password()
            user.set_password(temp_password)
        
        db.add(user)
        db.commit()
        db.refresh(user)
        
        # Send invitation email
        if send_invitation:
            try:
                await send_user_invitation(
                    email=user.email,
                    name=f"{user.first_name} {user.last_name}",
                    temp_password=temp_password if not user_create.password else None,
                    invited_by=f"{current_user.first_name} {current_user.last_name}"
                )
            except Exception as e:
                # Log email error but don't fail user creation
                print(f"Failed to send invitation email: {e}")
        
        return UserProfile.from_orm(user)
        
    except Exception as e:
        db.rollback()
        if isinstance(e, (ValidationError, NotFoundError)):
            raise
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create user: {str(e)}"
        )

@router.put("/{user_id}", response_model=UserProfile)
async def update_user(
    user_id: int,
    user_update: UserUpdate,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Update user (admin only)"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise NotFoundError("User not found")
    
    try:
        # Update user fields
        for field, value in user_update.dict(exclude_unset=True).items():
            if field == "password" and value:
                user.set_password(value)
            elif hasattr(user, field):
                setattr(user, field, value)
        
        user.updated_at = datetime.utcnow()
        user.updated_by = current_user.id
        
        db.commit()
        db.refresh(user)
        
        return UserProfile.from_orm(user)
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to update user: {str(e)}"
        )

@router.delete("/{user_id}")
async def delete_user(
    user_id: int,
    soft_delete: bool = Query(True, description="Soft delete (deactivate) instead of hard delete"),
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Delete or deactivate user (admin only)"""
    if user_id == current_user.id:
        raise ValidationError("Cannot delete your own account")
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise NotFoundError("User not found")
    
    try:
        if soft_delete:
            user.is_active = False
            user.updated_at = datetime.utcnow()
            user.updated_by = current_user.id
            db.commit()
            return {"message": "User deactivated successfully"}
        else:
            db.delete(user)
            db.commit()
            return {"message": "User deleted successfully"}
            
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to delete user: {str(e)}"
        )

@router.post("/{user_id}/reset-password")
async def reset_user_password(
    user_id: int,
    send_email: bool = Query(True, description="Send reset instructions via email"),
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Reset user password (admin only)"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise NotFoundError("User not found")
    
    try:
        # Generate temporary password
        temp_password = user.generate_temp_password()
        user.set_password(temp_password)
        user.password_reset_required = True
        user.updated_at = datetime.utcnow()
        
        db.commit()
        
        # Send reset email
        if send_email:
            try:
                await send_password_reset(
                    email=user.email,
                    name=f"{user.first_name} {user.last_name}",
                    temp_password=temp_password
                )
            except Exception as e:
                print(f"Failed to send password reset email: {e}")
        
        return {
            "message": "Password reset successfully",
            "temp_password": temp_password if not send_email else None
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to reset password: {str(e)}"
        )

@router.put("/{user_id}/role")
async def update_user_role(
    user_id: int,
    role_name: str,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Update user role (admin only)"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise NotFoundError("User not found")
    
    role = db.query(UserRole).filter(UserRole.name == role_name).first()
    if not role:
        raise NotFoundError(f"Role '{role_name}' not found")
    
    try:
        user.role_id = role.id
        user.updated_at = datetime.utcnow()
        user.updated_by = current_user.id
        
        db.commit()
        db.refresh(user)
        
        return {"message": f"User role updated to {role_name}"}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to update role: {str(e)}"
        )

# Organization Management Routes
@router.get("/organizations/", response_model=List[OrganizationSchema])
async def list_organizations(
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """List all organizations (super admin only)"""
    if not current_user.is_super_admin:
        raise AuthorizationError("Super admin access required")
    
    organizations = db.query(Organization).all()
    return [OrganizationSchema.from_orm(org) for org in organizations]

@router.post("/organizations/", response_model=OrganizationSchema)
async def create_organization(
    org_create: OrganizationCreate,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Create new organization (super admin only)"""
    if not current_user.is_super_admin:
        raise AuthorizationError("Super admin access required")
    
    try:
        organization = Organization(
            name=org_create.name,
            domain=org_create.domain,
            subscription_tier=org_create.subscription_tier,
            max_users=org_create.max_users,
            is_active=True,
            created_by=current_user.id
        )
        
        db.add(organization)
        db.commit()
        db.refresh(organization)
        
        return OrganizationSchema.from_orm(organization)
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create organization: {str(e)}"
        )

# Bulk Operations
@router.post("/bulk/invite")
async def bulk_invite_users(
    invitations: List[UserCreate],
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Bulk invite users (admin only)"""
    results = []
    
    for user_data in invitations:
        try:
            # Create user
            user = User(
                email=user_data.email,
                first_name=user_data.first_name,
                last_name=user_data.last_name,
                organization_id=user_data.organization_id or current_user.organization_id,
                is_active=True,
                created_by=current_user.id
            )
            
            temp_password = user.generate_temp_password()
            user.set_password(temp_password)
            
            db.add(user)
            db.flush()  # Get the user ID without committing
            
            # Send invitation
            await send_user_invitation(
                email=user.email,
                name=f"{user.first_name} {user.last_name}",
                temp_password=temp_password,
                invited_by=f"{current_user.first_name} {current_user.last_name}"
            )
            
            results.append({
                "email": user.email,
                "status": "success",
                "message": "User created and invited successfully"
            })
            
        except Exception as e:
            results.append({
                "email": user_data.email,
                "status": "error",
                "message": str(e)
            })
    
    try:
        db.commit()
    except Exception as e:
        db.rollback()
        return {"message": "Bulk operation failed", "details": str(e)}
    
    return {
        "message": "Bulk invitation completed",
        "results": results,
        "success_count": len([r for r in results if r["status"] == "success"]),
        "error_count": len([r for r in results if r["status"] == "error"])
    }
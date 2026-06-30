"""
Billing API Routes
Handles subscription management, payments, and billing operations
"""

from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Request, Header
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core.database import get_db
from app.core.auth import get_current_user
from app.models.user import User, Organization

# Create a temporary admin check function
async def get_current_admin_user(current_user: User = Depends(get_current_user)) -> User:
    """Verify current user has admin privileges"""
    if not current_user.is_superuser and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    return current_user
from app.services.stripe_service import stripe_service
from app.core.errors import NotFoundError, ValidationError, AuthorizationError

router = APIRouter()

class CreateCustomerRequest(BaseModel):
    organization_id: int

class CreateSubscriptionRequest(BaseModel):
    plan: str
    payment_method_id: str

class UpdateSubscriptionRequest(BaseModel):
    plan: str

class CreateCheckoutRequest(BaseModel):
    plan: str
    success_url: str
    cancel_url: str

@router.get("/plans")
async def get_subscription_plans():
    """Get available subscription plans"""
    return {
        "plans": stripe_service.get_plans(),
        "message": "Available subscription plans"
    }

@router.get("/usage")
async def get_usage_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current usage statistics for user's organization"""
    if not current_user.organization_id:
        raise ValidationError("User is not associated with an organization")
    
    try:
        usage_stats = stripe_service.get_usage_stats(current_user.organization_id, db)
        return usage_stats
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to get usage stats: {str(e)}"
        )

@router.post("/customer")
async def create_customer(
    request: CreateCustomerRequest,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Create a Stripe customer (admin only)"""
    
    # Get organization
    organization = db.query(Organization).filter(Organization.id == request.organization_id).first()
    if not organization:
        raise NotFoundError("Organization not found")
    
    # Check if organization already has a customer
    if hasattr(organization, 'stripe_customer_id') and organization.stripe_customer_id:
        raise ValidationError("Organization already has a Stripe customer")
    
    try:
        result = stripe_service.create_customer(current_user, organization)
        
        # Update organization with customer ID
        organization.stripe_customer_id = result["customer_id"]
        db.commit()
        
        return {
            "customer_id": result["customer_id"],
            "message": "Customer created successfully"
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create customer: {str(e)}"
        )

@router.post("/subscription")
async def create_subscription(
    request: CreateSubscriptionRequest,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Create a subscription (admin only)"""
    
    if not current_user.organization_id:
        raise ValidationError("User is not associated with an organization")
    
    organization = db.query(Organization).filter(Organization.id == current_user.organization_id).first()
    if not organization:
        raise NotFoundError("Organization not found")
    
    if not hasattr(organization, 'stripe_customer_id') or not organization.stripe_customer_id:
        raise ValidationError("Organization does not have a Stripe customer")
    
    try:
        result = stripe_service.create_subscription(
            organization.stripe_customer_id,
            request.plan,
            request.payment_method_id,
            organization
        )
        
        # Update organization with subscription details
        organization.stripe_subscription_id = result["subscription_id"]
        organization.subscription_tier = request.plan
        organization.subscription_status = result["status"]
        
        db.commit()
        
        return {
            "subscription_id": result["subscription_id"],
            "status": result["status"],
            "current_period_end": result["current_period_end"],
            "message": "Subscription created successfully"
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create subscription: {str(e)}"
        )

@router.put("/subscription")
async def update_subscription(
    request: UpdateSubscriptionRequest,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Update subscription plan (admin only)"""
    
    if not current_user.organization_id:
        raise ValidationError("User is not associated with an organization")
    
    organization = db.query(Organization).filter(Organization.id == current_user.organization_id).first()
    if not organization:
        raise NotFoundError("Organization not found")
    
    if not hasattr(organization, 'stripe_subscription_id') or not organization.stripe_subscription_id:
        raise ValidationError("Organization does not have an active subscription")
    
    try:
        result = stripe_service.update_subscription(
            organization.stripe_subscription_id,
            request.plan
        )
        
        # Update organization
        organization.subscription_tier = request.plan
        db.commit()
        
        return {
            "message": f"Subscription updated to {request.plan}",
            "subscription": result["subscription"]
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to update subscription: {str(e)}"
        )

@router.delete("/subscription")
async def cancel_subscription(
    at_period_end: bool = True,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Cancel subscription (admin only)"""
    
    if not current_user.organization_id:
        raise ValidationError("User is not associated with an organization")
    
    organization = db.query(Organization).filter(Organization.id == current_user.organization_id).first()
    if not organization:
        raise NotFoundError("Organization not found")
    
    if not hasattr(organization, 'stripe_subscription_id') or not organization.stripe_subscription_id:
        raise ValidationError("Organization does not have an active subscription")
    
    try:
        result = stripe_service.cancel_subscription(
            organization.stripe_subscription_id,
            at_period_end
        )
        
        if not at_period_end:
            # Immediately downgrade to free
            organization.subscription_tier = "free"
            organization.subscription_status = "cancelled"
        else:
            # Will be cancelled at period end
            organization.subscription_status = "cancel_at_period_end"
        
        db.commit()
        
        return {
            "message": "Subscription cancelled successfully" if not at_period_end else "Subscription will be cancelled at period end",
            "cancelled": result["cancelled"]
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to cancel subscription: {str(e)}"
        )

@router.get("/subscription")
async def get_subscription(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current subscription details"""
    
    if not current_user.organization_id:
        raise ValidationError("User is not associated with an organization")
    
    organization = db.query(Organization).filter(Organization.id == current_user.organization_id).first()
    if not organization:
        raise NotFoundError("Organization not found")
    
    if not hasattr(organization, 'stripe_subscription_id') or not organization.stripe_subscription_id:
        return {
            "subscription": None,
            "plan": organization.subscription_tier or "free",
            "status": "free"
        }
    
    try:
        result = stripe_service.get_subscription(organization.stripe_subscription_id)
        
        return {
            "subscription": result["subscription"],
            "plan": organization.subscription_tier,
            "status": organization.subscription_status
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to get subscription: {str(e)}"
        )

@router.post("/checkout")
async def create_checkout_session(
    request: CreateCheckoutRequest,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Create a Stripe Checkout session"""
    
    if not current_user.organization_id:
        raise ValidationError("User is not associated with an organization")
    
    organization = db.query(Organization).filter(Organization.id == current_user.organization_id).first()
    if not organization:
        raise NotFoundError("Organization not found")
    
    # Create customer if needed
    if not hasattr(organization, 'stripe_customer_id') or not organization.stripe_customer_id:
        try:
            customer_result = stripe_service.create_customer(current_user, organization)
            organization.stripe_customer_id = customer_result["customer_id"]
            db.commit()
        except Exception as e:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to create customer: {str(e)}"
            )
    
    try:
        result = stripe_service.create_checkout_session(
            organization.stripe_customer_id,
            request.plan,
            request.success_url,
            request.cancel_url
        )
        
        return {
            "checkout_url": result["checkout_url"],
            "session_id": result["session"].id
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create checkout session: {str(e)}"
        )

@router.post("/portal")
async def create_billing_portal(
    return_url: str,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Create a billing portal session"""
    
    if not current_user.organization_id:
        raise ValidationError("User is not associated with an organization")
    
    organization = db.query(Organization).filter(Organization.id == current_user.organization_id).first()
    if not organization:
        raise NotFoundError("Organization not found")
    
    if not hasattr(organization, 'stripe_customer_id') or not organization.stripe_customer_id:
        raise ValidationError("Organization does not have a Stripe customer")
    
    try:
        result = stripe_service.create_billing_portal_session(
            organization.stripe_customer_id,
            return_url
        )
        
        return {
            "portal_url": result["url"]
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create billing portal: {str(e)}"
        )

@router.post("/webhook")
async def stripe_webhook(
    request: Request,
    stripe_signature: str = Header(None, alias="stripe-signature")
):
    """Handle Stripe webhook events"""
    
    if not stripe_signature:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing Stripe signature"
        )
    
    try:
        payload = await request.body()
        result = stripe_service.handle_webhook(payload.decode(), stripe_signature)
        
        return {
            "received": True,
            "handled": result.get("handled", False),
            "event_type": result.get("event_type", "unknown")
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Webhook processing failed: {str(e)}"
        )

# Organization billing overview (admin only)
@router.get("/organizations/{org_id}/billing")
async def get_organization_billing(
    org_id: int,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Get billing information for an organization (super admin only)"""
    
    if not current_user.is_super_admin:
        raise AuthorizationError("Super admin access required")
    
    organization = db.query(Organization).filter(Organization.id == org_id).first()
    if not organization:
        raise NotFoundError("Organization not found")
    
    try:
        usage_stats = stripe_service.get_usage_stats(org_id, db)
        
        subscription_info = None
        if hasattr(organization, 'stripe_subscription_id') and organization.stripe_subscription_id:
            try:
                sub_result = stripe_service.get_subscription(organization.stripe_subscription_id)
                subscription_info = sub_result["subscription"]
            except:
                pass
        
        return {
            "organization": {
                "id": organization.id,
                "name": organization.name,
                "subscription_tier": organization.subscription_tier,
                "subscription_status": organization.subscription_status
            },
            "usage": usage_stats,
            "subscription": subscription_info
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to get billing information: {str(e)}"
        )
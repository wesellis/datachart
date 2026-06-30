# DataChart SaaS - Customer Onboarding API
# RESTful API for managing customer onboarding flow

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict, List, Optional, Any
from datetime import datetime
import json
import logging

from app.core.database import get_async_session
from app.core.auth import get_current_user, get_current_admin_user
from app.models.user import User
from app.models.customer import Customer, CustomerTier, BillingCycle
from app.services.snowflake_service import SnowflakeService
from app.services.azure_service import AzureService
from app.services.servicenow_service import ServiceNowService
from app.services.email_service import send_welcome_email, send_team_invitations
from app.core.security import encrypt_data
from pydantic import BaseModel, EmailStr

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/onboarding", tags=["onboarding"])

# Pydantic models for request/response
class CompanyInfo(BaseModel):
    name: str
    industry: str
    size: str
    use_case: str
    timezone: str

class SnowflakeCredentials(BaseModel):
    account: str
    username: str
    password: str
    warehouse: str
    database: str
    role: Optional[str] = None

class AzureCredentials(BaseModel):
    tenant_id: str
    client_id: str
    client_secret: str
    subscription_id: str

class ServiceNowCredentials(BaseModel):
    instance: str
    username: str
    password: str
    api_version: Optional[str] = "v1"

class Preferences(BaseModel):
    dashboard_layout: str = "executive"
    notification_frequency: str = "daily"
    alert_threshold: str = "medium"
    data_retention: str = "90d"

class TeamMember(BaseModel):
    name: str
    email: EmailStr
    role: str

class OnboardingProgress(BaseModel):
    current_step: int
    data: Dict[str, Any]
    completed_steps: List[str]

class IntegrationTest(BaseModel):
    integration_type: str
    credentials: Dict[str, Any]

@router.get("/status")
async def get_onboarding_status(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_session)
):
    """
    Get current onboarding status for the user
    """
    try:
        # Check if customer record exists and is complete
        customer = await db.get(Customer, current_user.customer_id)
        if not customer:
            raise HTTPException(status_code=404, detail="Customer record not found")
        
        # Determine onboarding completion status
        onboarding_complete = all([
            customer.company_name,
            customer.industry,
            customer.company_size,
            len(customer.integrations or {}) > 0  # At least one integration
        ])
        
        # Get completed steps from customer preferences
        completed_steps = customer.onboarding_data.get("completed_steps", []) if customer.onboarding_data else []
        current_step = customer.onboarding_data.get("current_step", 0) if customer.onboarding_data else 0
        
        return {
            "onboarding_complete": onboarding_complete,
            "current_step": current_step,
            "completed_steps": completed_steps,
            "total_steps": 8,
            "company_info": {
                "name": customer.company_name,
                "industry": customer.industry,
                "size": customer.company_size,
                "timezone": customer.timezone
            },
            "integrations": {
                "snowflake": "snowflake" in (customer.integrations or {}),
                "azure": "azure" in (customer.integrations or {}),
                "servicenow": "servicenow" in (customer.integrations or {})
            },
            "team_size": len(customer.users) if hasattr(customer, 'users') else 1
        }
        
    except Exception as e:
        logger.error(f"Error getting onboarding status: {e}")
        raise HTTPException(status_code=500, detail="Failed to get onboarding status")

@router.post("/progress")
async def save_onboarding_progress(
    progress: OnboardingProgress,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_session)
):
    """
    Save onboarding progress
    """
    try:
        customer = await db.get(Customer, current_user.customer_id)
        if not customer:
            raise HTTPException(status_code=404, detail="Customer record not found")
        
        # Update customer record with onboarding data
        customer.onboarding_data = {
            "current_step": progress.current_step,
            "completed_steps": progress.completed_steps,
            "data": progress.data,
            "last_updated": datetime.utcnow().isoformat()
        }
        
        # Update company info if provided
        if "company_info" in progress.data:
            company_info = progress.data["company_info"]
            customer.company_name = company_info.get("name", customer.company_name)
            customer.industry = company_info.get("industry", customer.industry)
            customer.company_size = company_info.get("size", customer.company_size)
            customer.timezone = company_info.get("timezone", customer.timezone)
            customer.use_case = company_info.get("use_case", customer.use_case)
        
        # Update preferences if provided
        if "preferences" in progress.data:
            customer.preferences = {
                **(customer.preferences or {}),
                **progress.data["preferences"]
            }
        
        await db.commit()
        await db.refresh(customer)
        
        return {
            "success": True,
            "message": "Onboarding progress saved successfully",
            "current_step": progress.current_step,
            "completed_steps": progress.completed_steps
        }
        
    except Exception as e:
        logger.error(f"Error saving onboarding progress: {e}")
        await db.rollback()
        raise HTTPException(status_code=500, detail="Failed to save onboarding progress")

@router.post("/integrations/{integration_type}/test")
async def test_integration(
    integration_type: str,
    credentials: Dict[str, Any],
    current_user: User = Depends(get_current_user)
):
    """
    Test integration credentials
    """
    try:
        if integration_type == "snowflake":
            service = SnowflakeService(credentials)
            result = await service.test_connection()
            
        elif integration_type == "azure":
            service = AzureService(credentials)
            result = await service.test_connection()
            
        elif integration_type == "servicenow":
            service = ServiceNowService(credentials)
            result = await service.test_connection()
            
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported integration type: {integration_type}")
        
        return {
            "success": result.get("success", False),
            "message": result.get("message", "Connection test completed"),
            "details": result.get("details", {}),
            "response_time_ms": result.get("response_time_ms", 0)
        }
        
    except Exception as e:
        logger.error(f"Error testing {integration_type} integration: {e}")
        return {
            "success": False,
            "message": f"Connection test failed: {str(e)}",
            "details": {},
            "response_time_ms": 0
        }

@router.post("/integrations/{integration_type}/save")
async def save_integration_credentials(
    integration_type: str,
    credentials: Dict[str, Any],
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_session)
):
    """
    Save integration credentials after successful test
    """
    try:
        customer = await db.get(Customer, current_user.customer_id)
        if not customer:
            raise HTTPException(status_code=404, detail="Customer record not found")
        
        # Encrypt credentials before storage
        encrypted_credentials = encrypt_data(json.dumps(credentials), customer.encryption_key)
        
        # Update customer integrations
        integrations = customer.integrations or {}
        integrations[integration_type] = {
            "credentials": encrypted_credentials,
            "status": "active",
            "created_at": datetime.utcnow().isoformat(),
            "last_test": datetime.utcnow().isoformat()
        }
        customer.integrations = integrations
        
        await db.commit()
        await db.refresh(customer)
        
        return {
            "success": True,
            "message": f"{integration_type.title()} integration saved successfully",
            "integration": {
                "type": integration_type,
                "status": "active",
                "created_at": integrations[integration_type]["created_at"]
            }
        }
        
    except Exception as e:
        logger.error(f"Error saving {integration_type} credentials: {e}")
        await db.rollback()
        raise HTTPException(status_code=500, detail="Failed to save integration credentials")

@router.post("/team/invite")
async def invite_team_members(
    team_members: List[TeamMember],
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_session)
):
    """
    Send team member invitations
    """
    try:
        customer = await db.get(Customer, current_user.customer_id)
        if not customer:
            raise HTTPException(status_code=404, detail="Customer record not found")
        
        # Store pending invitations
        pending_invitations = customer.pending_invitations or []
        
        for member in team_members:
            invitation = {
                "name": member.name,
                "email": member.email,
                "role": member.role,
                "invited_by": current_user.email,
                "invited_at": datetime.utcnow().isoformat(),
                "status": "pending"
            }
            pending_invitations.append(invitation)
        
        customer.pending_invitations = pending_invitations
        await db.commit()
        
        # Send invitation emails in background
        background_tasks.add_task(
            send_team_invitations,
            team_members,
            customer.company_name,
            current_user.email
        )
        
        return {
            "success": True,
            "message": f"Invitations sent to {len(team_members)} team members",
            "invitations": [
                {
                    "name": member.name,
                    "email": member.email,
                    "role": member.role,
                    "status": "pending"
                }
                for member in team_members
            ]
        }
        
    except Exception as e:
        logger.error(f"Error inviting team members: {e}")
        await db.rollback()
        raise HTTPException(status_code=500, detail="Failed to send team invitations")

@router.post("/complete")
async def complete_onboarding(
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_session)
):
    """
    Mark onboarding as complete and trigger welcome processes
    """
    try:
        customer = await db.get(Customer, current_user.customer_id)
        if not customer:
            raise HTTPException(status_code=404, detail="Customer record not found")
        
        # Mark onboarding as complete
        customer.onboarding_completed = True
        customer.onboarding_completed_at = datetime.utcnow()
        
        # Update onboarding data
        onboarding_data = customer.onboarding_data or {}
        onboarding_data.update({
            "completed": True,
            "completed_at": datetime.utcnow().isoformat(),
            "completed_steps": ["welcome", "company_info", "snowflake_integration", "azure_integration", 
                              "servicenow_integration", "preferences", "team_setup", "complete"]
        })
        customer.onboarding_data = onboarding_data
        
        await db.commit()
        await db.refresh(customer)
        
        # Send welcome email and setup notifications
        background_tasks.add_task(
            send_welcome_email,
            current_user.email,
            customer.company_name,
            customer.subscription_tier.value
        )
        
        # Create initial demo data if no real data is available
        background_tasks.add_task(
            create_initial_demo_data,
            customer.id
        )
        
        return {
            "success": True,
            "message": "Onboarding completed successfully",
            "customer": {
                "id": customer.id,
                "name": customer.company_name,
                "onboarding_completed": True,
                "subscription_tier": customer.subscription_tier.value,
                "integrations": list((customer.integrations or {}).keys())
            },
            "next_steps": [
                "Access your dashboard at /dashboard",
                "Configure alert preferences in Settings",
                "Invite additional team members",
                "Set up custom dashboard views"
            ]
        }
        
    except Exception as e:
        logger.error(f"Error completing onboarding: {e}")
        await db.rollback()
        raise HTTPException(status_code=500, detail="Failed to complete onboarding")

@router.get("/checklist")
async def get_onboarding_checklist(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_session)
):
    """
    Get onboarding checklist with completion status
    """
    try:
        customer = await db.get(Customer, current_user.customer_id)
        if not customer:
            raise HTTPException(status_code=404, detail="Customer record not found")
        
        completed_steps = []
        if customer.onboarding_data:
            completed_steps = customer.onboarding_data.get("completed_steps", [])
        
        checklist_items = [
            {
                "id": "company_info",
                "title": "Company Information",
                "description": "Basic company details and use case",
                "required": True,
                "completed": bool(customer.company_name and customer.industry),
                "weight": 15
            },
            {
                "id": "snowflake_integration",
                "title": "Snowflake Integration",
                "description": "Connect your primary data warehouse",
                "required": True,
                "completed": "snowflake" in (customer.integrations or {}),
                "weight": 30
            },
            {
                "id": "azure_integration",
                "title": "Azure Integration",
                "description": "Connect Azure cost and resource data",
                "required": False,
                "completed": "azure" in (customer.integrations or {}),
                "weight": 20
            },
            {
                "id": "servicenow_integration", 
                "title": "ServiceNow Integration",
                "description": "Connect ITSM and incident data",
                "required": False,
                "completed": "servicenow" in (customer.integrations or {}),
                "weight": 15
            },
            {
                "id": "preferences",
                "title": "Dashboard Preferences",
                "description": "Customize alerts and display options",
                "required": True,
                "completed": bool(customer.preferences),
                "weight": 10
            },
            {
                "id": "team_setup",
                "title": "Team Members",
                "description": "Invite team members and set roles",
                "required": False,
                "completed": len(customer.pending_invitations or []) > 0,
                "weight": 10
            }
        ]
        
        # Calculate completion percentage
        total_weight = sum(item["weight"] for item in checklist_items)
        completed_weight = sum(item["weight"] for item in checklist_items if item["completed"])
        completion_percentage = (completed_weight / total_weight) * 100
        
        # Required items completion
        required_items = [item for item in checklist_items if item["required"]]
        required_completed = sum(1 for item in required_items if item["completed"])
        can_complete_onboarding = required_completed == len(required_items)
        
        return {
            "checklist": checklist_items,
            "summary": {
                "total_items": len(checklist_items),
                "completed_items": sum(1 for item in checklist_items if item["completed"]),
                "required_items": len(required_items),
                "required_completed": required_completed,
                "completion_percentage": round(completion_percentage, 1),
                "can_complete": can_complete_onboarding
            }
        }
        
    except Exception as e:
        logger.error(f"Error getting onboarding checklist: {e}")
        raise HTTPException(status_code=500, detail="Failed to get onboarding checklist")

@router.get("/recommendations")
async def get_onboarding_recommendations(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_session)
):
    """
    Get personalized onboarding recommendations based on company info and industry
    """
    try:
        customer = await db.get(Customer, current_user.customer_id)
        if not customer:
            raise HTTPException(status_code=404, detail="Customer record not found")
        
        recommendations = []
        
        # Industry-specific recommendations
        if customer.industry == "technology":
            recommendations.extend([
                {
                    "type": "integration",
                    "title": "Connect Development Tools",
                    "description": "Consider integrating with GitHub, Jira, or Jenkins for DevOps monitoring",
                    "priority": "medium"
                },
                {
                    "type": "dashboard",
                    "title": "Technical Dashboard Layout",
                    "description": "Use detailed technical views with code deployment metrics",
                    "priority": "low"
                }
            ])
        elif customer.industry == "financial_services":
            recommendations.extend([
                {
                    "type": "security",
                    "title": "Enhanced Security Monitoring",
                    "description": "Enable advanced security alerts and compliance reporting",
                    "priority": "high"
                },
                {
                    "type": "compliance",
                    "title": "SOX Compliance Features",
                    "description": "Configure audit trails and financial data governance",
                    "priority": "high"
                }
            ])
        elif customer.industry == "healthcare":
            recommendations.extend([
                {
                    "type": "compliance",
                    "title": "HIPAA Compliance",
                    "description": "Enable HIPAA-specific data governance and encryption features",
                    "priority": "critical"
                }
            ])
        
        # Size-based recommendations
        if customer.company_size == "large":
            recommendations.append({
                "type": "team",
                "title": "Department-based Access Control",
                "description": "Set up role-based access for different departments",
                "priority": "medium"
            })
        elif customer.company_size == "startup":
            recommendations.append({
                "type": "cost",
                "title": "Cost Optimization Focus",
                "description": "Enable aggressive cost monitoring and optimization alerts",
                "priority": "high"
            })
        
        # Integration-based recommendations
        integrations = customer.integrations or {}
        if "snowflake" not in integrations:
            recommendations.append({
                "type": "integration",
                "title": "Primary Data Source Required",
                "description": "Connect Snowflake to access your monitoring data",
                "priority": "critical"
            })
        
        if "azure" not in integrations and "aws" not in integrations:
            recommendations.append({
                "type": "integration", 
                "title": "Cloud Provider Integration",
                "description": "Connect Azure or AWS for comprehensive cloud monitoring",
                "priority": "high"
            })
        
        return {
            "recommendations": sorted(recommendations, 
                                   key=lambda x: {"critical": 0, "high": 1, "medium": 2, "low": 3}[x["priority"]]),
            "total_count": len(recommendations)
        }
        
    except Exception as e:
        logger.error(f"Error getting onboarding recommendations: {e}")
        raise HTTPException(status_code=500, detail="Failed to get recommendations")

# Background task functions
async def create_initial_demo_data(customer_id: str):
    """Create initial demo data for new customers"""
    try:
        # This would typically generate sample data based on the customer's industry
        # and integrations to help them get started
        logger.info(f"Creating initial demo data for customer {customer_id}")
        
        # Implementation would create sample dashboards, alerts, etc.
        pass
        
    except Exception as e:
        logger.error(f"Error creating initial demo data: {e}")

@router.delete("/reset")
async def reset_onboarding(
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_async_session)
):
    """
    Reset onboarding status (admin only, for testing)
    """
    try:
        customer = await db.get(Customer, current_user.customer_id)
        if not customer:
            raise HTTPException(status_code=404, detail="Customer record not found")
        
        # Reset onboarding status
        customer.onboarding_completed = False
        customer.onboarding_completed_at = None
        customer.onboarding_data = {
            "current_step": 0,
            "completed_steps": [],
            "data": {},
            "reset_at": datetime.utcnow().isoformat()
        }
        
        await db.commit()
        
        return {
            "success": True,
            "message": "Onboarding status reset successfully"
        }
        
    except Exception as e:
        logger.error(f"Error resetting onboarding: {e}")
        await db.rollback()
        raise HTTPException(status_code=500, detail="Failed to reset onboarding")
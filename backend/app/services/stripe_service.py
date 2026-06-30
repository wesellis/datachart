"""
Stripe Payment Service
Handles subscription billing, payments, and customer management through Stripe
"""

import stripe
import os
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models.user import User, Organization
from app.core.database import get_db

logger = logging.getLogger(__name__)

# Initialize Stripe
stripe.api_key = os.getenv("STRIPE_SECRET_KEY", "sk_test_...")

class StripeService:
    def __init__(self):
        self.webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET", "whsec_...")
        
        # Subscription plans configuration
        self.plans = {
            "free": {
                "name": "Free Plan",
                "price": 0,
                "price_id": None,
                "features": ["5 users", "10 dashboards", "3 data sources", "Basic support"],
                "limits": {
                    "max_users": 5,
                    "max_dashboards": 10,
                    "max_data_sources": 3,
                    "max_widgets_per_dashboard": 20
                }
            },
            "starter": {
                "name": "Starter Plan",
                "price": 99,  # $99/month
                "price_id": os.getenv("STRIPE_STARTER_PRICE_ID", "price_starter"),
                "features": ["25 users", "50 dashboards", "10 data sources", "Email support", "Advanced charts"],
                "limits": {
                    "max_users": 25,
                    "max_dashboards": 50,
                    "max_data_sources": 10,
                    "max_widgets_per_dashboard": 50
                }
            },
            "professional": {
                "name": "Professional Plan", 
                "price": 299,  # $299/month
                "price_id": os.getenv("STRIPE_PROFESSIONAL_PRICE_ID", "price_professional"),
                "features": ["100 users", "Unlimited dashboards", "25 data sources", "Priority support", "Custom branding", "API access"],
                "limits": {
                    "max_users": 100,
                    "max_dashboards": -1,  # Unlimited
                    "max_data_sources": 25,
                    "max_widgets_per_dashboard": 100
                }
            },
            "enterprise": {
                "name": "Enterprise Plan",
                "price": 999,  # $999/month
                "price_id": os.getenv("STRIPE_ENTERPRISE_PRICE_ID", "price_enterprise"), 
                "features": ["Unlimited users", "Unlimited dashboards", "Unlimited data sources", "24/7 support", "Custom branding", "Advanced API", "SSO integration", "Dedicated support"],
                "limits": {
                    "max_users": -1,  # Unlimited
                    "max_dashboards": -1,  # Unlimited
                    "max_data_sources": -1,  # Unlimited
                    "max_widgets_per_dashboard": -1  # Unlimited
                }
            }
        }

    def create_customer(self, user: User, organization: Organization) -> Dict[str, Any]:
        """Create a Stripe customer"""
        try:
            customer = stripe.Customer.create(
                email=user.email,
                name=user.display_name,
                metadata={
                    "user_id": str(user.id),
                    "organization_id": str(organization.id),
                    "organization_name": organization.name
                }
            )
            
            logger.info(f"Created Stripe customer {customer.id} for user {user.id}")
            return {"customer_id": customer.id, "customer": customer}
            
        except stripe.error.StripeError as e:
            logger.error(f"Failed to create Stripe customer: {e}")
            raise Exception(f"Payment setup failed: {str(e)}")

    def create_subscription(
        self, 
        customer_id: str, 
        plan: str,
        payment_method_id: str,
        organization: Organization
    ) -> Dict[str, Any]:
        """Create a subscription for a customer"""
        try:
            if plan not in self.plans or self.plans[plan]["price_id"] is None:
                raise ValueError(f"Invalid plan: {plan}")
            
            plan_config = self.plans[plan]
            
            # Attach payment method to customer
            stripe.PaymentMethod.attach(
                payment_method_id,
                customer=customer_id
            )
            
            # Update customer's default payment method
            stripe.Customer.modify(
                customer_id,
                invoice_settings={
                    "default_payment_method": payment_method_id
                }
            )
            
            # Create subscription
            subscription = stripe.Subscription.create(
                customer=customer_id,
                items=[{"price": plan_config["price_id"]}],
                default_payment_method=payment_method_id,
                expand=["latest_invoice.payment_intent"],
                metadata={
                    "organization_id": str(organization.id),
                    "plan": plan
                }
            )
            
            logger.info(f"Created subscription {subscription.id} for customer {customer_id}")
            
            return {
                "subscription_id": subscription.id,
                "status": subscription.status,
                "current_period_end": subscription.current_period_end,
                "subscription": subscription
            }
            
        except stripe.error.StripeError as e:
            logger.error(f"Failed to create subscription: {e}")
            raise Exception(f"Subscription creation failed: {str(e)}")

    def cancel_subscription(self, subscription_id: str, at_period_end: bool = True) -> Dict[str, Any]:
        """Cancel a subscription"""
        try:
            subscription = stripe.Subscription.modify(
                subscription_id,
                cancel_at_period_end=at_period_end
            )
            
            if not at_period_end:
                subscription = stripe.Subscription.delete(subscription_id)
            
            logger.info(f"Cancelled subscription {subscription_id}")
            return {"subscription": subscription, "cancelled": True}
            
        except stripe.error.StripeError as e:
            logger.error(f"Failed to cancel subscription: {e}")
            raise Exception(f"Subscription cancellation failed: {str(e)}")

    def update_subscription(self, subscription_id: str, new_plan: str) -> Dict[str, Any]:
        """Update subscription to a different plan"""
        try:
            if new_plan not in self.plans or self.plans[new_plan]["price_id"] is None:
                raise ValueError(f"Invalid plan: {new_plan}")
            
            # Get current subscription
            subscription = stripe.Subscription.retrieve(subscription_id)
            
            # Update subscription
            updated_subscription = stripe.Subscription.modify(
                subscription_id,
                items=[{
                    "id": subscription["items"]["data"][0].id,
                    "price": self.plans[new_plan]["price_id"]
                }],
                proration_behavior="always_invoice",
                metadata={
                    **subscription.metadata,
                    "plan": new_plan
                }
            )
            
            logger.info(f"Updated subscription {subscription_id} to {new_plan}")
            return {"subscription": updated_subscription, "updated": True}
            
        except stripe.error.StripeError as e:
            logger.error(f"Failed to update subscription: {e}")
            raise Exception(f"Subscription update failed: {str(e)}")

    def get_subscription(self, subscription_id: str) -> Dict[str, Any]:
        """Get subscription details"""
        try:
            subscription = stripe.Subscription.retrieve(subscription_id)
            return {"subscription": subscription}
            
        except stripe.error.StripeError as e:
            logger.error(f"Failed to get subscription: {e}")
            raise Exception(f"Failed to retrieve subscription: {str(e)}")

    def create_billing_portal_session(self, customer_id: str, return_url: str) -> Dict[str, Any]:
        """Create a billing portal session for customer to manage their subscription"""
        try:
            session = stripe.billing_portal.Session.create(
                customer=customer_id,
                return_url=return_url
            )
            
            return {"url": session.url, "session": session}
            
        except stripe.error.StripeError as e:
            logger.error(f"Failed to create billing portal session: {e}")
            raise Exception(f"Billing portal creation failed: {str(e)}")

    def create_checkout_session(
        self, 
        customer_id: str, 
        plan: str, 
        success_url: str, 
        cancel_url: str
    ) -> Dict[str, Any]:
        """Create a Stripe Checkout session"""
        try:
            if plan not in self.plans or self.plans[plan]["price_id"] is None:
                raise ValueError(f"Invalid plan: {plan}")
            
            plan_config = self.plans[plan]
            
            session = stripe.checkout.Session.create(
                customer=customer_id,
                payment_method_types=["card"],
                line_items=[{
                    "price": plan_config["price_id"],
                    "quantity": 1
                }],
                mode="subscription",
                success_url=success_url,
                cancel_url=cancel_url,
                metadata={
                    "plan": plan
                }
            )
            
            return {"checkout_url": session.url, "session": session}
            
        except stripe.error.StripeError as e:
            logger.error(f"Failed to create checkout session: {e}")
            raise Exception(f"Checkout session creation failed: {str(e)}")

    def handle_webhook(self, payload: str, sig_header: str) -> Dict[str, Any]:
        """Handle Stripe webhook events"""
        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, self.webhook_secret
            )
            
            logger.info(f"Received Stripe webhook event: {event['type']}")
            
            # Handle different event types
            if event["type"] == "customer.subscription.created":
                return self._handle_subscription_created(event["data"]["object"])
            
            elif event["type"] == "customer.subscription.updated":
                return self._handle_subscription_updated(event["data"]["object"])
            
            elif event["type"] == "customer.subscription.deleted":
                return self._handle_subscription_deleted(event["data"]["object"])
            
            elif event["type"] == "invoice.payment_succeeded":
                return self._handle_payment_succeeded(event["data"]["object"])
            
            elif event["type"] == "invoice.payment_failed":
                return self._handle_payment_failed(event["data"]["object"])
            
            else:
                logger.info(f"Unhandled webhook event type: {event['type']}")
                return {"handled": False, "event_type": event["type"]}
            
        except ValueError as e:
            logger.error(f"Invalid webhook payload: {e}")
            raise Exception("Invalid webhook payload")
        
        except stripe.error.SignatureVerificationError as e:
            logger.error(f"Invalid webhook signature: {e}")
            raise Exception("Invalid webhook signature")

    def _handle_subscription_created(self, subscription) -> Dict[str, Any]:
        """Handle subscription created webhook"""
        try:
            org_id = subscription.metadata.get("organization_id")
            plan = subscription.metadata.get("plan")
            
            if org_id and plan:
                db = next(get_db())
                org = db.query(Organization).filter(Organization.id == int(org_id)).first()
                
                if org:
                    # Update organization with subscription details
                    org.subscription_tier = plan
                    org.subscription_status = subscription.status
                    org.stripe_subscription_id = subscription.id
                    org.stripe_customer_id = subscription.customer
                    
                    # Update limits based on plan
                    plan_limits = self.plans[plan]["limits"]
                    org.max_users = plan_limits["max_users"]
                    org.max_dashboards = plan_limits["max_dashboards"] 
                    org.max_data_sources = plan_limits["max_data_sources"]
                    org.max_widgets_per_dashboard = plan_limits["max_widgets_per_dashboard"]
                    
                    db.commit()
                    logger.info(f"Updated organization {org_id} with subscription {subscription.id}")
            
            return {"handled": True, "event_type": "subscription_created"}
            
        except Exception as e:
            logger.error(f"Failed to handle subscription created: {e}")
            return {"handled": False, "error": str(e)}

    def _handle_subscription_updated(self, subscription) -> Dict[str, Any]:
        """Handle subscription updated webhook"""
        try:
            org_id = subscription.metadata.get("organization_id")
            plan = subscription.metadata.get("plan")
            
            if org_id:
                db = next(get_db())
                org = db.query(Organization).filter(Organization.id == int(org_id)).first()
                
                if org:
                    # Update subscription status
                    org.subscription_status = subscription.status
                    
                    # If plan changed, update limits
                    if plan and plan in self.plans:
                        org.subscription_tier = plan
                        plan_limits = self.plans[plan]["limits"]
                        org.max_users = plan_limits["max_users"]
                        org.max_dashboards = plan_limits["max_dashboards"]
                        org.max_data_sources = plan_limits["max_data_sources"]
                        org.max_widgets_per_dashboard = plan_limits["max_widgets_per_dashboard"]
                    
                    db.commit()
                    logger.info(f"Updated organization {org_id} subscription status to {subscription.status}")
            
            return {"handled": True, "event_type": "subscription_updated"}
            
        except Exception as e:
            logger.error(f"Failed to handle subscription updated: {e}")
            return {"handled": False, "error": str(e)}

    def _handle_subscription_deleted(self, subscription) -> Dict[str, Any]:
        """Handle subscription deleted webhook"""
        try:
            org_id = subscription.metadata.get("organization_id")
            
            if org_id:
                db = next(get_db())
                org = db.query(Organization).filter(Organization.id == int(org_id)).first()
                
                if org:
                    # Downgrade to free plan
                    org.subscription_tier = "free"
                    org.subscription_status = "cancelled"
                    
                    # Reset to free plan limits
                    free_limits = self.plans["free"]["limits"]
                    org.max_users = free_limits["max_users"]
                    org.max_dashboards = free_limits["max_dashboards"]
                    org.max_data_sources = free_limits["max_data_sources"]
                    org.max_widgets_per_dashboard = free_limits["max_widgets_per_dashboard"]
                    
                    db.commit()
                    logger.info(f"Downgraded organization {org_id} to free plan")
            
            return {"handled": True, "event_type": "subscription_deleted"}
            
        except Exception as e:
            logger.error(f"Failed to handle subscription deleted: {e}")
            return {"handled": False, "error": str(e)}

    def _handle_payment_succeeded(self, invoice) -> Dict[str, Any]:
        """Handle successful payment"""
        logger.info(f"Payment succeeded for invoice {invoice.id}")
        return {"handled": True, "event_type": "payment_succeeded"}

    def _handle_payment_failed(self, invoice) -> Dict[str, Any]:
        """Handle failed payment"""
        logger.warning(f"Payment failed for invoice {invoice.id}")
        
        # Could implement logic to notify customer, retry payment, etc.
        
        return {"handled": True, "event_type": "payment_failed"}

    def get_plans(self) -> Dict[str, Any]:
        """Get available subscription plans"""
        return self.plans

    def get_usage_stats(self, organization_id: int, db: Session) -> Dict[str, Any]:
        """Get current usage stats for an organization"""
        org = db.query(Organization).filter(Organization.id == organization_id).first()
        
        if not org:
            raise Exception("Organization not found")
        
        # Count current usage
        user_count = db.query(User).filter(User.organization_id == organization_id, User.is_active == True).count()
        
        # TODO: Add dashboard and data source counts when those models are available
        dashboard_count = 0  # db.query(Dashboard).filter(Dashboard.organization_id == organization_id).count()
        data_source_count = 0  # db.query(DataSource).filter(DataSource.organization_id == organization_id).count()
        
        plan_limits = self.plans.get(org.subscription_tier, self.plans["free"])["limits"]
        
        return {
            "current_usage": {
                "users": user_count,
                "dashboards": dashboard_count, 
                "data_sources": data_source_count
            },
            "limits": plan_limits,
            "plan": org.subscription_tier,
            "status": org.subscription_status,
            "usage_percentage": {
                "users": (user_count / plan_limits["max_users"] * 100) if plan_limits["max_users"] > 0 else 0,
                "dashboards": (dashboard_count / plan_limits["max_dashboards"] * 100) if plan_limits["max_dashboards"] > 0 else 0,
                "data_sources": (data_source_count / plan_limits["max_data_sources"] * 100) if plan_limits["max_data_sources"] > 0 else 0
            }
        }

# Service instance
stripe_service = StripeService()
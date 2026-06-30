"""
Billing Service for DataChart
Subscription management, usage tracking, and payment processing
"""

import json
import logging
from datetime import datetime, timedelta, date
from typing import Dict, List, Optional, Any
from decimal import Decimal, ROUND_HALF_UP
from enum import Enum
import asyncio

import stripe
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func, desc
from fastapi import HTTPException, status

from app.core.database import get_db
from app.models.customers import Customer, CustomerTier
from app.core.cache import CacheManager
from app.core.config import settings

logger = logging.getLogger(__name__)

# Initialize Stripe
stripe.api_key = settings.STRIPE_SECRET_KEY if hasattr(settings, 'STRIPE_SECRET_KEY') else 'sk_test_...'


class SubscriptionStatus(str, Enum):
    """Subscription status values"""
    ACTIVE = "active"
    PAST_DUE = "past_due"
    CANCELED = "canceled"
    UNPAID = "unpaid"
    TRIALING = "trialing"
    INCOMPLETE = "incomplete"


class BillingCycle(str, Enum):
    """Billing cycle options"""
    MONTHLY = "monthly"
    QUARTERLY = "quarterly" 
    ANNUALLY = "annually"


class BillingService:
    """
    Comprehensive billing service for DataChart SaaS platform
    Handles subscriptions, usage tracking, invoicing, and payment processing
    """
    
    def __init__(self):
        self.cache = CacheManager()
        
        # Pricing plans (monthly prices in cents)
        self.pricing_plans = {
            CustomerTier.TRIAL: {
                'monthly': 0,
                'quarterly': 0,
                'annually': 0,
                'features': {
                    'max_users': 2,
                    'max_dashboards': 3,
                    'max_data_sources': 2,
                    'max_api_calls': 10000,
                    'support_level': 'community',
                    'data_retention_days': 30,
                    'custom_branding': False,
                    'sla_guarantee': False
                }
            },
            CustomerTier.STARTER: {
                'monthly': 299900,  # $2,999/month
                'quarterly': 269991,  # 10% discount
                'annually': 215992,  # 28% discount ($2,159.92/month)
                'features': {
                    'max_users': 10,
                    'max_dashboards': 25,
                    'max_data_sources': 5,
                    'max_api_calls': 100000,
                    'support_level': 'business',
                    'data_retention_days': 90,
                    'custom_branding': True,
                    'sla_guarantee': True,
                    'sla_uptime': 99.5
                }
            },
            CustomerTier.PROFESSIONAL: {
                'monthly': 699900,  # $6,999/month
                'quarterly': 629910,  # 10% discount
                'annually': 503928,  # 28% discount ($5,039.28/month)
                'features': {
                    'max_users': 50,
                    'max_dashboards': 100,
                    'max_data_sources': 15,
                    'max_api_calls': 500000,
                    'support_level': 'premium',
                    'data_retention_days': 365,
                    'custom_branding': True,
                    'sla_guarantee': True,
                    'sla_uptime': 99.9,
                    'dedicated_csm': True,
                    'advanced_analytics': True
                }
            },
            CustomerTier.ENTERPRISE: {
                'monthly': 1499900,  # $14,999/month
                'quarterly': 1349910,  # 10% discount
                'annually': 1079928,  # 28% discount ($10,799.28/month)
                'features': {
                    'max_users': 250,
                    'max_dashboards': 500,
                    'max_data_sources': 50,
                    'max_api_calls': 2000000,
                    'support_level': 'white_glove',
                    'data_retention_days': 2555,  # 7 years
                    'custom_branding': True,
                    'sla_guarantee': True,
                    'sla_uptime': 99.99,
                    'dedicated_csm': True,
                    'advanced_analytics': True,
                    'custom_integrations': True,
                    'on_premise_option': True,
                    'priority_support': True
                }
            }
        }
        
        # Usage-based pricing (overage charges)
        self.overage_rates = {
            'api_calls': 0.01,  # $0.01 per 100 API calls over limit
            'users': 9900,  # $99/month per additional user
            'dashboards': 4900,  # $49/month per additional dashboard
            'data_sources': 19900,  # $199/month per additional data source
            'storage_gb': 500,  # $5/month per GB over included storage
        }
        
        # Discount structures
        self.discounts = {
            'annual': 0.28,  # 28% annual discount
            'quarterly': 0.10,  # 10% quarterly discount
            'enterprise_volume': 0.15,  # 15% for 5+ enterprise licenses
            'multi_year': 0.35,  # 35% for 2+ year commitments
            'non_profit': 0.20,  # 20% non-profit discount
            'education': 0.50   # 50% education discount
        }
    
    # ==================== SUBSCRIPTION MANAGEMENT ====================
    
    async def create_subscription(self,
                                 customer: Customer,
                                 tier: CustomerTier,
                                 billing_cycle: BillingCycle,
                                 payment_method_id: str,
                                 trial_days: int = 14,
                                 db: Session = None) -> Dict[str, Any]:
        """
        Create new subscription for customer
        
        Args:
            customer: Customer object
            tier: Subscription tier
            billing_cycle: Monthly, quarterly, or annual billing
            payment_method_id: Stripe payment method ID
            trial_days: Trial period length
            db: Database session
        
        Returns:
            Subscription details
        """
        try:
            # Calculate pricing
            base_price = self.pricing_plans[tier][billing_cycle.value]
            
            # Apply discounts
            final_price = base_price
            applied_discounts = []
            
            if billing_cycle == BillingCycle.ANNUALLY:
                discount = self.discounts['annual']
                final_price = int(base_price * (1 - discount))
                applied_discounts.append(f"Annual discount: {discount*100}%")
            elif billing_cycle == BillingCycle.QUARTERLY:
                discount = self.discounts['quarterly']
                final_price = int(base_price * (1 - discount))
                applied_discounts.append(f"Quarterly discount: {discount*100}%")
            
            # Create Stripe customer if needed
            if not customer.stripe_customer_id:
                stripe_customer = await self._create_stripe_customer(customer)
                customer.stripe_customer_id = stripe_customer.id
                db.commit()
            
            # Attach payment method
            await stripe.PaymentMethod.attach(
                payment_method_id,
                customer=customer.stripe_customer_id
            )
            
            # Set as default payment method
            await stripe.Customer.modify(
                customer.stripe_customer_id,
                invoice_settings={'default_payment_method': payment_method_id}
            )
            
            # Create Stripe price object
            price_id = await self._get_or_create_stripe_price(tier, billing_cycle, final_price)
            
            # Create subscription
            trial_end = datetime.utcnow() + timedelta(days=trial_days) if trial_days > 0 else None
            
            stripe_subscription = await stripe.Subscription.create(
                customer=customer.stripe_customer_id,
                items=[{'price': price_id}],
                trial_end=int(trial_end.timestamp()) if trial_end else None,
                expand=['latest_invoice.payment_intent'],
                metadata={
                    'customer_id': str(customer.id),
                    'tier': tier.value,
                    'billing_cycle': billing_cycle.value
                }
            )
            
            # Update customer record
            customer.tier = tier.value
            customer.subscription_status = SubscriptionStatus.TRIALING.value if trial_days > 0 else SubscriptionStatus.ACTIVE.value
            customer.subscription_started_at = datetime.utcnow()
            customer.trial_ends_at = trial_end
            customer.next_billing_date = datetime.fromtimestamp(stripe_subscription.current_period_end)
            
            # Update limits based on tier
            tier_features = self.pricing_plans[tier]['features']
            customer.max_users = tier_features['max_users']
            customer.max_dashboards = tier_features['max_dashboards']
            customer.max_data_sources = tier_features['max_data_sources']
            customer.max_api_calls_per_month = tier_features['max_api_calls']
            
            db.commit()
            
            # Send welcome email
            await self._send_subscription_email(customer, 'subscription_created', {
                'tier': tier.value,
                'trial_days': trial_days,
                'next_billing_date': customer.next_billing_date.strftime('%Y-%m-%d')
            })
            
            return {
                'success': True,
                'subscription_id': stripe_subscription.id,
                'status': stripe_subscription.status,
                'tier': tier.value,
                'billing_cycle': billing_cycle.value,
                'monthly_price': final_price / 100,  # Convert to dollars
                'trial_ends_at': trial_end.isoformat() if trial_end else None,
                'next_billing_date': customer.next_billing_date.isoformat(),
                'applied_discounts': applied_discounts,
                'features': tier_features
            }
            
        except stripe.error.StripeError as e:
            logger.error(f"Stripe error creating subscription: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_402_PAYMENT_REQUIRED,
                detail=f"Payment processing failed: {str(e)}"
            )
        except Exception as e:
            logger.error(f"Error creating subscription: {str(e)}")
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create subscription"
            )
    
    async def upgrade_subscription(self,
                                  customer: Customer,
                                  new_tier: CustomerTier,
                                  new_billing_cycle: Optional[BillingCycle] = None,
                                  db: Session = None) -> Dict[str, Any]:
        """Upgrade customer subscription"""
        try:
            # Get current Stripe subscription
            subscriptions = await stripe.Subscription.list(
                customer=customer.stripe_customer_id,
                status='active',
                limit=1
            )
            
            if not subscriptions.data:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="No active subscription found"
                )
            
            current_subscription = subscriptions.data[0]
            current_tier = CustomerTier(customer.tier)
            billing_cycle = new_billing_cycle or BillingCycle(self._get_billing_cycle_from_subscription(current_subscription))
            
            # Calculate price difference for prorated billing
            new_price = self.pricing_plans[new_tier][billing_cycle.value]
            old_price = self.pricing_plans[current_tier][billing_cycle.value]
            
            # Create new price
            new_price_id = await self._get_or_create_stripe_price(new_tier, billing_cycle, new_price)
            
            # Update subscription
            await stripe.Subscription.modify(
                current_subscription.id,
                items=[{
                    'id': current_subscription.items.data[0].id,
                    'price': new_price_id
                }],
                proration_behavior='always_invoice'
            )
            
            # Update customer record
            old_tier = customer.tier
            customer.tier = new_tier.value
            
            # Update limits
            tier_features = self.pricing_plans[new_tier]['features']
            customer.max_users = tier_features['max_users']
            customer.max_dashboards = tier_features['max_dashboards']
            customer.max_data_sources = tier_features['max_data_sources']
            customer.max_api_calls_per_month = tier_features['max_api_calls']
            
            db.commit()
            
            # Send upgrade confirmation
            await self._send_subscription_email(customer, 'subscription_upgraded', {
                'old_tier': old_tier,
                'new_tier': new_tier.value,
                'price_difference': (new_price - old_price) / 100,
                'effective_date': datetime.utcnow().strftime('%Y-%m-%d')
            })
            
            return {
                'success': True,
                'old_tier': old_tier,
                'new_tier': new_tier.value,
                'new_features': tier_features,
                'price_change': (new_price - old_price) / 100,
                'effective_immediately': True
            }
            
        except stripe.error.StripeError as e:
            logger.error(f"Stripe error upgrading subscription: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_402_PAYMENT_REQUIRED,
                detail=f"Upgrade failed: {str(e)}"
            )
        except Exception as e:
            logger.error(f"Error upgrading subscription: {str(e)}")
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to upgrade subscription"
            )
    
    async def cancel_subscription(self,
                                 customer: Customer,
                                 cancel_immediately: bool = False,
                                 reason: Optional[str] = None,
                                 db: Session = None) -> Dict[str, Any]:
        """Cancel customer subscription"""
        try:
            # Get Stripe subscription
            subscriptions = await stripe.Subscription.list(
                customer=customer.stripe_customer_id,
                status='active',
                limit=1
            )
            
            if not subscriptions.data:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="No active subscription found"
                )
            
            subscription = subscriptions.data[0]
            
            if cancel_immediately:
                # Cancel immediately
                await stripe.Subscription.delete(subscription.id)
                customer.subscription_status = SubscriptionStatus.CANCELED.value
                access_until = datetime.utcnow()
            else:
                # Cancel at end of period
                await stripe.Subscription.modify(
                    subscription.id,
                    cancel_at_period_end=True,
                    metadata={'cancellation_reason': reason or 'User requested'}
                )
                customer.subscription_status = SubscriptionStatus.ACTIVE.value  # Still active until period end
                access_until = datetime.fromtimestamp(subscription.current_period_end)
            
            db.commit()
            
            # Send cancellation email
            await self._send_subscription_email(customer, 'subscription_canceled', {
                'reason': reason,
                'access_until': access_until.strftime('%Y-%m-%d'),
                'immediate': cancel_immediately
            })
            
            return {
                'success': True,
                'canceled_immediately': cancel_immediately,
                'access_until': access_until.isoformat(),
                'reason': reason,
                'can_reactivate': not cancel_immediately
            }
            
        except stripe.error.StripeError as e:
            logger.error(f"Stripe error canceling subscription: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_402_PAYMENT_REQUIRED,
                detail=f"Cancellation failed: {str(e)}"
            )
        except Exception as e:
            logger.error(f"Error canceling subscription: {str(e)}")
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to cancel subscription"
            )
    
    # ==================== USAGE TRACKING ====================
    
    async def track_usage(self,
                         customer_id: str,
                         metric: str,
                         value: int = 1,
                         timestamp: Optional[datetime] = None) -> Dict[str, Any]:
        """
        Track usage metrics for billing
        
        Args:
            customer_id: Customer identifier
            metric: Usage metric (api_calls, users, dashboards, etc.)
            value: Usage amount
            timestamp: When usage occurred
        
        Returns:
            Usage tracking result
        """
        if not timestamp:
            timestamp = datetime.utcnow()
        
        # Store in cache for real-time tracking
        date_key = timestamp.strftime('%Y-%m-%d')
        hour_key = timestamp.strftime('%Y-%m-%d-%H')
        
        # Daily usage
        daily_key = f"usage:{customer_id}:{metric}:{date_key}"
        self.cache.increment(daily_key, value, ttl=86400 * 32)  # Keep for 32 days
        
        # Hourly usage for rate limiting
        hourly_key = f"usage:{customer_id}:{metric}:{hour_key}"
        self.cache.increment(hourly_key, value, ttl=3600)
        
        # Monthly usage for billing
        month_key = timestamp.strftime('%Y-%m')
        monthly_key = f"usage:{customer_id}:{metric}:{month_key}"
        current_usage = self.cache.increment(monthly_key, value, ttl=86400 * 40)  # Keep for 40 days
        
        # Check if approaching limits
        db = next(get_db())
        customer = db.query(Customer).filter(Customer.id == customer_id).first()
        
        if customer:
            tier_features = self.pricing_plans.get(CustomerTier(customer.tier), {}).get('features', {})
            limit_key = f"max_{metric}_per_month" if metric == 'api_calls' else f"max_{metric}"
            usage_limit = tier_features.get(limit_key, float('inf'))
            
            if usage_limit != float('inf'):
                usage_percentage = (current_usage / usage_limit) * 100
                
                # Send alerts at 80% and 95% usage
                if usage_percentage >= 95 and not self.cache.get(f"alert:95:{customer_id}:{metric}:{month_key}"):
                    await self._send_usage_alert(customer, metric, usage_percentage, 'critical')
                    self.cache.set(f"alert:95:{customer_id}:{metric}:{month_key}", True, ttl=86400 * 30)
                elif usage_percentage >= 80 and not self.cache.get(f"alert:80:{customer_id}:{metric}:{month_key}"):
                    await self._send_usage_alert(customer, metric, usage_percentage, 'warning')
                    self.cache.set(f"alert:80:{customer_id}:{metric}:{month_key}", True, ttl=86400 * 30)
        
        db.close()
        
        return {
            'metric': metric,
            'value': value,
            'current_daily_usage': self.cache.get(daily_key) or 0,
            'current_monthly_usage': current_usage,
            'timestamp': timestamp.isoformat()
        }
    
    async def get_usage_summary(self,
                               customer_id: str,
                               period: str = 'current_month') -> Dict[str, Any]:
        """Get usage summary for customer"""
        now = datetime.utcnow()
        
        if period == 'current_month':
            month_key = now.strftime('%Y-%m')
        elif period == 'last_month':
            last_month = now.replace(day=1) - timedelta(days=1)
            month_key = last_month.strftime('%Y-%m')
        else:
            month_key = period
        
        usage_summary = {
            'customer_id': customer_id,
            'period': month_key,
            'usage': {},
            'limits': {},
            'overages': {},
            'estimated_charges': 0
        }
        
        # Get customer limits
        db = next(get_db())
        customer = db.query(Customer).filter(Customer.id == customer_id).first()
        db.close()
        
        if not customer:
            return usage_summary
        
        tier_features = self.pricing_plans.get(CustomerTier(customer.tier), {}).get('features', {})
        
        # Get usage for each metric
        metrics = ['api_calls', 'users', 'dashboards', 'data_sources']
        
        for metric in metrics:
            usage_key = f"usage:{customer_id}:{metric}:{month_key}"
            current_usage = self.cache.get(usage_key) or 0
            
            # Get limit
            if metric == 'api_calls':
                limit = tier_features.get('max_api_calls_per_month', 0)
            else:
                limit = tier_features.get(f'max_{metric}', 0)
            
            usage_summary['usage'][metric] = current_usage
            usage_summary['limits'][metric] = limit
            
            # Calculate overage
            if current_usage > limit:
                overage = current_usage - limit
                usage_summary['overages'][metric] = overage
                
                # Calculate overage charges
                if metric == 'api_calls':
                    # Charge per 100 API calls over limit
                    overage_units = (overage + 99) // 100  # Round up to nearest 100
                    overage_charge = overage_units * self.overage_rates['api_calls']
                else:
                    overage_charge = overage * (self.overage_rates[metric] / 100)  # Convert from cents
                
                usage_summary['estimated_charges'] += overage_charge
            else:
                usage_summary['overages'][metric] = 0
        
        return usage_summary
    
    # ==================== INVOICING ====================
    
    async def generate_invoice(self,
                              customer_id: str,
                              billing_period: str,
                              include_usage: bool = True) -> Dict[str, Any]:
        """Generate invoice for customer"""
        db = next(get_db())
        customer = db.query(Customer).filter(Customer.id == customer_id).first()
        
        if not customer:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Customer not found"
            )
        
        # Get subscription details
        tier = CustomerTier(customer.tier)
        base_price = self.pricing_plans[tier]['monthly'] / 100  # Convert to dollars
        
        invoice = {
            'invoice_id': f"INV-{customer_id[:8]}-{billing_period}",
            'customer_id': customer_id,
            'customer_name': customer.company_name,
            'billing_period': billing_period,
            'invoice_date': datetime.utcnow().strftime('%Y-%m-%d'),
            'due_date': (datetime.utcnow() + timedelta(days=30)).strftime('%Y-%m-%d'),
            'line_items': [],
            'subtotal': 0,
            'tax': 0,
            'total': 0,
            'currency': 'USD'
        }
        
        # Add subscription line item
        invoice['line_items'].append({
            'description': f"DataChart {tier.value.title()} Plan",
            'quantity': 1,
            'unit_price': base_price,
            'total': base_price
        })
        invoice['subtotal'] += base_price
        
        # Add usage-based charges if requested
        if include_usage:
            usage_summary = await self.get_usage_summary(customer_id, billing_period)
            
            for metric, overage in usage_summary['overages'].items():
                if overage > 0:
                    if metric == 'api_calls':
                        unit_price = self.overage_rates['api_calls']
                        quantity = (overage + 99) // 100  # Round up to nearest 100
                        description = f"API Calls Overage ({overage:,} calls, billed per 100)"
                    else:
                        unit_price = self.overage_rates[metric] / 100
                        quantity = overage
                        description = f"{metric.replace('_', ' ').title()} Overage"
                    
                    total = quantity * unit_price
                    
                    invoice['line_items'].append({
                        'description': description,
                        'quantity': quantity,
                        'unit_price': unit_price,
                        'total': total
                    })
                    invoice['subtotal'] += total
        
        # Calculate tax (simplified - would need proper tax service)
        tax_rate = 0.08  # 8% sales tax
        invoice['tax'] = round(invoice['subtotal'] * tax_rate, 2)
        invoice['total'] = round(invoice['subtotal'] + invoice['tax'], 2)
        
        db.close()
        return invoice
    
    async def process_payment(self,
                             customer: Customer,
                             amount_cents: int,
                             description: str,
                             idempotency_key: Optional[str] = None) -> Dict[str, Any]:
        """Process payment for customer"""
        try:
            # Create payment intent
            payment_intent = await stripe.PaymentIntent.create(
                amount=amount_cents,
                currency='usd',
                customer=customer.stripe_customer_id,
                description=description,
                automatic_payment_methods={'enabled': True},
                idempotency_key=idempotency_key
            )
            
            return {
                'success': True,
                'payment_intent_id': payment_intent.id,
                'client_secret': payment_intent.client_secret,
                'status': payment_intent.status,
                'amount': amount_cents / 100
            }
            
        except stripe.error.StripeError as e:
            logger.error(f"Payment processing error: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'error_type': type(e).__name__
            }
    
    # ==================== HELPER METHODS ====================
    
    async def _create_stripe_customer(self, customer: Customer) -> stripe.Customer:
        """Create Stripe customer"""
        return await stripe.Customer.create(
            email=customer.primary_contact_email,
            name=customer.company_name,
            metadata={
                'customer_id': str(customer.id),
                'company': customer.company_name
            }
        )
    
    async def _get_or_create_stripe_price(self,
                                         tier: CustomerTier,
                                         billing_cycle: BillingCycle,
                                         amount_cents: int) -> str:
        """Get or create Stripe price object"""
        # Check cache first
        price_key = f"stripe_price:{tier.value}:{billing_cycle.value}:{amount_cents}"
        cached_price_id = self.cache.get(price_key)
        
        if cached_price_id:
            return cached_price_id
        
        # Create new price
        interval_count = 1
        if billing_cycle == BillingCycle.QUARTERLY:
            interval_count = 3
        elif billing_cycle == BillingCycle.ANNUALLY:
            interval_count = 12
        
        price = await stripe.Price.create(
            unit_amount=amount_cents,
            currency='usd',
            recurring={
                'interval': 'month',
                'interval_count': interval_count
            },
            product_data={
                'name': f"DataChart {tier.value.title()} Plan",
                'metadata': {
                    'tier': tier.value,
                    'billing_cycle': billing_cycle.value
                }
            }
        )
        
        # Cache the price ID
        self.cache.set(price_key, price.id, ttl=86400 * 30)  # Cache for 30 days
        
        return price.id
    
    def _get_billing_cycle_from_subscription(self, subscription) -> str:
        """Extract billing cycle from Stripe subscription"""
        interval_count = subscription.items.data[0].price.recurring.interval_count
        
        if interval_count == 1:
            return BillingCycle.MONTHLY.value
        elif interval_count == 3:
            return BillingCycle.QUARTERLY.value
        elif interval_count == 12:
            return BillingCycle.ANNUALLY.value
        else:
            return BillingCycle.MONTHLY.value
    
    async def _send_subscription_email(self,
                                      customer: Customer,
                                      email_type: str,
                                      data: Dict[str, Any]):
        """Send subscription-related email"""
        # This would integrate with an email service like SendGrid
        logger.info(f"Sending {email_type} email to {customer.primary_contact_email}")
        # Implementation would go here
        pass
    
    async def _send_usage_alert(self,
                               customer: Customer,
                               metric: str,
                               usage_percentage: float,
                               alert_level: str):
        """Send usage alert email"""
        logger.info(f"Sending {alert_level} usage alert for {metric} to {customer.primary_contact_email}: {usage_percentage:.1f}%")
        # Implementation would go here
        pass
    
    # ==================== REPORTING ====================
    
    async def get_revenue_report(self,
                                start_date: datetime,
                                end_date: datetime) -> Dict[str, Any]:
        """Generate revenue report"""
        db = next(get_db())
        
        # This would query actual invoice/payment data
        # For now, returning sample data structure
        
        report = {
            'period': {
                'start': start_date.strftime('%Y-%m-%d'),
                'end': end_date.strftime('%Y-%m-%d')
            },
            'total_revenue': 0,
            'recurring_revenue': 0,
            'overage_revenue': 0,
            'by_tier': {},
            'by_month': [],
            'customer_metrics': {
                'total_customers': 0,
                'new_customers': 0,
                'churned_customers': 0,
                'upgrade_revenue': 0,
                'downgrade_revenue': 0
            }
        }
        
        # Calculate metrics from customer data
        customers = db.query(Customer).filter(
            Customer.subscription_status == 'active'
        ).all()
        
        for customer in customers:
            tier = CustomerTier(customer.tier)
            tier_price = self.pricing_plans[tier]['monthly'] / 100
            
            if tier.value not in report['by_tier']:
                report['by_tier'][tier.value] = {
                    'customer_count': 0,
                    'revenue': 0
                }
            
            report['by_tier'][tier.value]['customer_count'] += 1
            report['by_tier'][tier.value]['revenue'] += tier_price
            report['total_revenue'] += tier_price
            report['recurring_revenue'] += tier_price
        
        report['customer_metrics']['total_customers'] = len(customers)
        
        db.close()
        return report
    
    async def get_churn_analysis(self) -> Dict[str, Any]:
        """Analyze customer churn"""
        db = next(get_db())
        
        # Query customers who churned in last 90 days
        ninety_days_ago = datetime.utcnow() - timedelta(days=90)
        
        churned_customers = db.query(Customer).filter(
            and_(
                Customer.subscription_status == 'canceled',
                Customer.updated_at >= ninety_days_ago
            )
        ).all()
        
        active_customers = db.query(Customer).filter(
            Customer.subscription_status == 'active'
        ).count()
        
        analysis = {
            'period_days': 90,
            'churned_customers': len(churned_customers),
            'active_customers': active_customers,
            'churn_rate': (len(churned_customers) / max(active_customers, 1)) * 100,
            'churn_by_tier': {},
            'churn_reasons': {},
            'average_lifespan_days': 0
        }
        
        # Analyze churn by tier
        for customer in churned_customers:
            tier = customer.tier
            if tier not in analysis['churn_by_tier']:
                analysis['churn_by_tier'][tier] = 0
            analysis['churn_by_tier'][tier] += 1
        
        db.close()
        return analysis
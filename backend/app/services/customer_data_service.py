"""
Customer Data Service - Multi-tenant APM Data Provider
Provides customer-specific APM data from various sources (Snowflake, APIs, etc.)
"""

import random
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
import logging

logger = logging.getLogger(__name__)

class CustomerDataService:
    """
    Service for providing customer-specific APM data
    Integrates with Snowflake, Azure APIs, and other data sources
    """
    
    def __init__(self):
        # Customer configurations
        self.customers = {
            "hubbell-001": {
                "company_name": "Hubbell Incorporated",
                "industry": "Electrical Infrastructure",
                "revenue": "4.9B",
                "employees": 18000,
                "snowflake_config": {
                    "account": "hubbell_prod",
                    "database": "APM_PROD",
                    "schema": "VENDOR_ANALYTICS"
                }
            },
            "demo-001": {
                "company_name": "Demo Corporation",
                "industry": "Technology",
                "revenue": "2.9B", 
                "employees": 8000,
                "snowflake_config": {
                    "account": "demo_account",
                    "database": "APM_DEMO",
                    "schema": "PUBLIC"
                }
            }
        }
    
    def get_customer_info(self, customer_id: str) -> Dict[str, Any]:
        """Get customer information"""
        customer = self.customers.get(customer_id)
        if not customer:
            raise ValueError(f"Customer {customer_id} not found")
        
        return {
            "customer_id": customer_id,
            "company_name": customer["company_name"],
            "industry": customer["industry"],
            "revenue": customer["revenue"],
            "employees": customer["employees"],
            "last_sync": datetime.now().isoformat(),
            "data_sources": ["snowflake", "azure", "servicenow"]
        }
    
    def get_dashboard_overview(self, customer_id: str) -> Dict[str, Any]:
        """Get complete dashboard overview for customer"""
        if customer_id not in self.customers:
            raise ValueError(f"Customer {customer_id} not found")
        
        customer = self.customers[customer_id]
        
        # Get all metrics
        vendor_data = self.get_vendor_metrics(customer_id)
        app_data = self.get_application_metrics(customer_id)
        cost_data = self.get_cost_trends(customer_id)
        compliance_data = self.get_compliance_metrics(customer_id)
        
        return {
            "dashboard_id": f"{customer_id}-overview",
            "customer_id": customer_id,
            "company_name": customer["company_name"],
            "industry": customer["industry"],
            "last_updated": datetime.now().isoformat(),
            "data_sources": ["snowflake", "azure", "servicenow"],
            "metrics": {
                "vendor": vendor_data,
                "applications": app_data,
                "cost_trends": cost_data,
                "compliance": compliance_data
            },
            "summary": self._generate_executive_summary(vendor_data, app_data, cost_data, compliance_data)
        }
    
    def get_vendor_metrics(self, customer_id: str) -> Dict[str, Any]:
        """Get vendor spend and metrics for customer"""
        if customer_id == "hubbell-001":
            return self._get_hubbell_vendor_data()
        else:
            return self._get_demo_vendor_data()
    
    def get_application_metrics(self, customer_id: str) -> Dict[str, Any]:
        """Get application portfolio metrics"""
        if customer_id == "hubbell-001":
            return self._get_hubbell_app_data()
        else:
            return self._get_demo_app_data()
    
    def get_cost_trends(self, customer_id: str, months: int = 12) -> Dict[str, Any]:
        """Get cost trend analysis"""
        if customer_id == "hubbell-001":
            return self._get_hubbell_cost_data(months)
        else:
            return self._get_demo_cost_data(months)
    
    def get_compliance_metrics(self, customer_id: str) -> Dict[str, Any]:
        """Get compliance assessment metrics"""
        if customer_id == "hubbell-001":
            return self._get_hubbell_compliance_data()
        else:
            return self._get_demo_compliance_data()
    
    def _get_hubbell_vendor_data(self) -> Dict[str, Any]:
        """Hubbell-specific vendor data"""
        vendors = [
            {"vendor_name": "SAP", "total_spend": random.randint(1100000, 1200000), "app_count": 12, "contract_count": 4, "change_percent": round(random.uniform(-8, 3), 1)},
            {"vendor_name": "Salesforce", "total_spend": random.randint(900000, 950000), "app_count": 8, "contract_count": 3, "change_percent": round(random.uniform(-6, 5), 1)},
            {"vendor_name": "Oracle", "total_spend": random.randint(830000, 880000), "app_count": 15, "contract_count": 6, "change_percent": round(random.uniform(-7, 2), 1)},
            {"vendor_name": "Microsoft", "total_spend": random.randint(720000, 750000), "app_count": 25, "contract_count": 8, "change_percent": round(random.uniform(-4, 6), 1)},
            {"vendor_name": "ANSYS", "total_spend": random.randint(670000, 700000), "app_count": 5, "contract_count": 2, "change_percent": round(random.uniform(-9, 1), 1)},
            {"vendor_name": "Dassault Systemes", "total_spend": random.randint(600000, 630000), "app_count": 7, "contract_count": 3, "change_percent": round(random.uniform(-5, 4), 1)},
            {"vendor_name": "General Electric", "total_spend": random.randint(550000, 590000), "app_count": 6, "contract_count": 3, "change_percent": round(random.uniform(-8, 2), 1)},
            {"vendor_name": "Schneider Electric", "total_spend": random.randint(430000, 460000), "app_count": 4, "contract_count": 2, "change_percent": round(random.uniform(-6, 7), 1)},
            {"vendor_name": "AVEVA", "total_spend": random.randint(380000, 400000), "app_count": 3, "contract_count": 2, "change_percent": round(random.uniform(-10, -1), 1)},
            {"vendor_name": "Rockwell Automation", "total_spend": random.randint(340000, 370000), "app_count": 4, "contract_count": 2, "change_percent": round(random.uniform(-3, 8), 1)}
        ]
        
        return {
            "success": True,
            "data": {
                "vendors": vendors,
                "total_spend": sum(v["total_spend"] for v in vendors),
                "vendor_count": len(vendors),
                "query_timestamp": datetime.now().isoformat()
            }
        }
    
    def _get_hubbell_app_data(self) -> Dict[str, Any]:
        """Hubbell-specific application data"""
        return {
            "success": True,
            "data": {
                "total_applications": 235,
                "total_vendors": random.randint(87, 92),
                "active_applications": random.randint(215, 220),
                "compliant_applications": random.randint(190, 200),
                "avg_health_score": round(random.uniform(84, 88), 1),
                "total_annual_cost": random.randint(18000000, 19000000),
                "compliance_rate": round(random.uniform(82, 87), 1),
                "vendor_change": round(random.uniform(-3, -1), 1),
                "spend_change": round(random.uniform(-6, -2), 1),
                "compliance_change": round(random.uniform(1, 4), 1),
                "query_timestamp": datetime.now().isoformat()
            }
        }
    
    def _get_hubbell_cost_data(self, months: int) -> Dict[str, Any]:
        """Hubbell-specific cost trend data"""
        trends = []
        for i in range(months):
            month = datetime.now() - timedelta(days=i*30)
            spend = random.randint(1200000, 1600000)
            trends.append({
                "month": month.strftime('%Y-%m'),
                "monthly_spend": spend,
                "vendor_count": random.randint(85, 95),
                "app_count": random.randint(230, 240),
                "avg_transaction": random.randint(8000, 9000)
            })
        
        return {
            "success": True,
            "data": {
                "trends": trends,
                "current_month_spend": trends[0]["monthly_spend"],
                "trend_percentage": round(random.uniform(-5, -2), 1),
                "total_period_spend": sum(t["monthly_spend"] for t in trends),
                "query_timestamp": datetime.now().isoformat()
            }
        }
    
    def _get_hubbell_compliance_data(self) -> Dict[str, Any]:
        """Hubbell-specific compliance data"""
        categories = [
            {"category": "Security", "app_count": 235, "avg_score": round(random.uniform(86, 90), 1), "high_compliance": 187, "low_compliance": 23},
            {"category": "Data Privacy", "app_count": 235, "avg_score": round(random.uniform(82, 86), 1), "high_compliance": 156, "low_compliance": 34},
            {"category": "Licensing", "app_count": 235, "avg_score": round(random.uniform(90, 94), 1), "high_compliance": 203, "low_compliance": 12},
            {"category": "Financial", "app_count": 235, "avg_score": round(random.uniform(87, 91), 1), "high_compliance": 198, "low_compliance": 18},
            {"category": "Operational", "app_count": 235, "avg_score": round(random.uniform(84, 88), 1), "high_compliance": 167, "low_compliance": 28},
            {"category": "Regulatory", "app_count": 235, "avg_score": round(random.uniform(81, 85), 1), "high_compliance": 145, "low_compliance": 42}
        ]
        
        overall_score = sum(c["avg_score"] for c in categories) / len(categories)
        
        return {
            "success": True,
            "data": {
                "categories": categories,
                "overall_compliance_score": round(overall_score, 1),
                "total_assessed_apps": len(categories) * 235,
                "high_risk_apps": sum(c["low_compliance"] for c in categories),
                "query_timestamp": datetime.now().isoformat()
            }
        }
    
    def _get_demo_vendor_data(self) -> Dict[str, Any]:
        """Demo customer vendor data"""
        vendors = [
            {"vendor_name": "Microsoft", "total_spend": 5200000, "app_count": 45, "contract_count": 12, "change_percent": -2.3},
            {"vendor_name": "Oracle", "total_spend": 3100000, "app_count": 22, "contract_count": 8, "change_percent": -5.1},
            {"vendor_name": "Salesforce", "total_spend": 2800000, "app_count": 15, "contract_count": 6, "change_percent": 1.8},
            {"vendor_name": "ServiceNow", "total_spend": 1900000, "app_count": 8, "contract_count": 3, "change_percent": -1.2},
            {"vendor_name": "Adobe", "total_spend": 1500000, "app_count": 12, "contract_count": 4, "change_percent": 3.4}
        ]
        
        return {
            "success": True,
            "data": {
                "vendors": vendors,
                "total_spend": sum(v["total_spend"] for v in vendors),
                "vendor_count": len(vendors),
                "query_timestamp": datetime.now().isoformat()
            }
        }
    
    def _get_demo_app_data(self) -> Dict[str, Any]:
        """Demo customer application data"""
        return {
            "success": True,
            "data": {
                "total_applications": 311,
                "total_vendors": 458,
                "active_applications": 295,
                "compliant_applications": 278,
                "avg_health_score": 92.1,
                "total_annual_cost": 26350000,
                "compliance_rate": 89.4,
                "vendor_change": -2.1,
                "spend_change": -4.8,
                "compliance_change": 2.7,
                "query_timestamp": datetime.now().isoformat()
            }
        }
    
    def _get_demo_cost_data(self, months: int) -> Dict[str, Any]:
        """Demo customer cost data"""
        trends = []
        base_spend = 2200000
        
        for i in range(months):
            month = datetime.now() - timedelta(days=i*30)
            variance = random.uniform(0.9, 1.1)
            trends.append({
                "month": month.strftime('%Y-%m'),
                "monthly_spend": int(base_spend * variance),
                "vendor_count": random.randint(450, 465),
                "app_count": random.randint(305, 315),
                "avg_transaction": random.randint(7000, 8000)
            })
        
        return {
            "success": True,
            "data": {
                "trends": trends,
                "current_month_spend": trends[0]["monthly_spend"],
                "trend_percentage": -3.2,
                "total_period_spend": sum(t["monthly_spend"] for t in trends),
                "query_timestamp": datetime.now().isoformat()
            }
        }
    
    def _get_demo_compliance_data(self) -> Dict[str, Any]:
        """Demo customer compliance data"""
        categories = [
            {"category": "Security", "app_count": 311, "avg_score": 91.2, "high_compliance": 267, "low_compliance": 18},
            {"category": "Data Privacy", "app_count": 311, "avg_score": 88.7, "high_compliance": 242, "low_compliance": 25},
            {"category": "Licensing", "app_count": 311, "avg_score": 94.1, "high_compliance": 289, "low_compliance": 8},
            {"category": "Financial", "app_count": 311, "avg_score": 92.3, "high_compliance": 278, "low_compliance": 12},
            {"category": "Operational", "app_count": 311, "avg_score": 89.6, "high_compliance": 251, "low_compliance": 22},
            {"category": "Regulatory", "app_count": 311, "avg_score": 87.4, "high_compliance": 234, "low_compliance": 31}
        ]
        
        overall_score = sum(c["avg_score"] for c in categories) / len(categories)
        
        return {
            "success": True,
            "data": {
                "categories": categories,
                "overall_compliance_score": round(overall_score, 1),
                "total_assessed_apps": len(categories) * 311,
                "high_risk_apps": sum(c["low_compliance"] for c in categories),
                "query_timestamp": datetime.now().isoformat()
            }
        }
    
    def _generate_executive_summary(self, vendor_data, app_data, cost_data, compliance_data) -> Dict[str, Any]:
        """Generate executive summary from all metrics"""
        return {
            "total_spend": vendor_data["data"]["total_spend"],
            "vendor_count": vendor_data["data"]["vendor_count"],
            "application_count": app_data["data"]["total_applications"],
            "compliance_score": compliance_data["data"]["overall_compliance_score"],
            "cost_trend": cost_data["data"]["trend_percentage"],
            "key_insights": [
                f"Managing {vendor_data['data']['vendor_count']} vendors with ${vendor_data['data']['total_spend']:,.0f} annual spend",
                f"Portfolio includes {app_data['data']['total_applications']} applications",
                f"Compliance score: {compliance_data['data']['overall_compliance_score']:.1f}%",
                f"Cost trend: {cost_data['data']['trend_percentage']:+.1f}% month-over-month"
            ]
        }
    
    def refresh_customer_data(self, customer_id: str) -> Dict[str, Any]:
        """Refresh all data for a customer"""
        if customer_id not in self.customers:
            raise ValueError(f"Customer {customer_id} not found")
        
        # In real implementation, this would trigger data refresh from Snowflake/APIs
        logger.info(f"Refreshing data for customer {customer_id}")
        
        return {
            "status": "success",
            "message": f"Data refreshed for customer {customer_id}",
            "cache_cleared": random.randint(25, 50),
            "timestamp": datetime.now().isoformat()
        }
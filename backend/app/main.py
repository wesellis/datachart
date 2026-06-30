from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from datetime import datetime, timedelta
import random

app = FastAPI(title="DataChart Dashboard API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "DataChart Dashboard API is running"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}

@app.get("/api/v1/apm/dashboard")
def get_dashboard(view: str = "overview"):
    """Get APM dashboard data with correct structure and clean numbers"""
    
    # Generate realistic mock data with clean numbers
    monthly_trend = []
    for i in range(12):
        month = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][i]
        monthly_trend.append({
            "month": month,
            "spend_2024": random.randint(180000, 220000),
            "spend_2025": random.randint(160000, 200000) if i < 9 else None
        })
    
    # Generate mock applications
    applications = []
    vendors = ["Microsoft", "Adobe", "Salesforce", "Oracle", "SAP", "ServiceNow", "Workday", "Slack"]
    departments = ["IT", "Sales", "Marketing", "Finance", "HR", "Engineering", "Operations"]
    
    for i in range(85):
        app_id = f"app_{i+1}"
        vendor = random.choice(vendors)
        dept = random.choice(departments)
        total_licenses = random.randint(50, 500)
        used_licenses = random.randint(30, min(total_licenses, 450))
        cost_2024 = random.randint(50000, 500000)
        cost_2025 = int(cost_2024 * random.uniform(0.85, 1.1))
        
        # Calculate utilization rate and round to 1 decimal
        utilization = round((used_licenses / total_licenses * 100) if total_licenses > 0 else 0, 1)
        
        applications.append({
            "id": app_id,
            "name": f"{vendor} {['Enterprise', 'Professional', 'Standard', 'Premium'][i % 4]}",
            "vendor_name": vendor,
            "owner_name": f"User {i+1}",
            "owner_email": f"user{i+1}@company.com",
            "department": dept,
            "cost_2024": cost_2024,
            "cost_2025": cost_2025,
            "monthly_cost": round(cost_2025 / 12, 2),
            "cost_per_user": round(cost_2025 / used_licenses if used_licenses > 0 else 0, 2),
            "total_licenses": total_licenses,
            "used_licenses": used_licenses,
            "utilization_rate": utilization,
            "contract_end": (datetime.now() + timedelta(days=random.randint(30, 365))).isoformat(),
            "renewal_date": (datetime.now() + timedelta(days=random.randint(30, 365))).isoformat(),
            "days_until_renewal": random.randint(30, 365),
            "auto_renewal": random.choice([True, False]),
            "notice_period": random.choice([30, 60, 90]),
            "patch_status": random.choice(["Current", "Outdated", "Critical"]),
            "compliance_score": random.randint(70, 100),
            "security_score": random.randint(60, 100),
            "last_update": datetime.now().isoformat(),
            "risk_level": random.choice(["High", "Medium", "Low"]),
            "business_criticality": random.choice(["Critical", "High", "Medium", "Low"])
        })
    
    # Calculate totals with proper rounding
    total_spend_2024 = sum(app["cost_2024"] for app in applications)
    total_spend_2025 = sum(app["cost_2025"] for app in applications)
    savings_amount = total_spend_2024 - total_spend_2025
    
    # Round percentages to 1 decimal place
    savings_percentage = round((savings_amount / total_spend_2024 * 100) if total_spend_2024 > 0 else 0, 1)
    
    # Count risk levels
    high_risk = sum(1 for app in applications if app["risk_level"] == "High")
    medium_risk = sum(1 for app in applications if app["risk_level"] == "Medium")
    low_risk = sum(1 for app in applications if app["risk_level"] == "Low")
    
    # Calculate utilization with proper rounding
    total_licenses_all = sum(app["total_licenses"] for app in applications)
    used_licenses_all = sum(app["used_licenses"] for app in applications)
    avg_utilization = round((used_licenses_all / total_licenses_all * 100) if total_licenses_all > 0 else 0, 1)
    
    # Calculate patch compliance rate
    patch_compliance = round(len([a for a in applications if a["patch_status"] == "Current"]) / len(applications) * 100, 1)
    
    # Calculate average compliance score
    avg_compliance = round(sum(app["compliance_score"] for app in applications) / len(applications), 1)
    
    # Cost per employee (assuming 1000 employees)
    cost_per_emp = round(total_spend_2025 / 1000, 2)
    
    # Vendor totals
    vendor_totals = {}
    for app in applications:
        vendor = app["vendor_name"]
        if vendor not in vendor_totals:
            vendor_totals[vendor] = {
                "total_spend": 0,
                "app_count": 0,
                "total_licenses": 0,
                "used_licenses": 0
            }
        vendor_totals[vendor]["total_spend"] += app["cost_2025"]
        vendor_totals[vendor]["app_count"] += 1
        vendor_totals[vendor]["total_licenses"] += app["total_licenses"]
        vendor_totals[vendor]["used_licenses"] += app["used_licenses"]
    
    return {
        "total_applications": len(applications),
        "active_applications": len([a for a in applications if a["utilization_rate"] > 0]),
        "inactive_applications": len([a for a in applications if a["utilization_rate"] == 0]),
        "total_spend_2024": total_spend_2024,
        "total_spend_2025": total_spend_2025,
        "savings_amount": savings_amount,
        "savings_percentage": savings_percentage,
        "cost_per_employee": cost_per_emp,
        "compliance_average": avg_compliance,
        "patch_compliance_rate": patch_compliance,
        "renewals_next_30_days": len([a for a in applications if a["days_until_renewal"] <= 30]),
        "renewals_next_60_days": len([a for a in applications if a["days_until_renewal"] <= 60]),
        "renewals_next_90_days": len([a for a in applications if a["days_until_renewal"] <= 90]),
        "renewal_cost_30_days": sum(a["cost_2025"] for a in applications if a["days_until_renewal"] <= 30),
        "high_risk_apps": high_risk,
        "medium_risk_apps": medium_risk,
        "low_risk_apps": low_risk,
        "average_utilization": avg_utilization,
        "vendor_count": len(vendor_totals),
        "vendor_totals": vendor_totals,
        "monthly_trend": monthly_trend,
        "applications": applications
    }

@app.post("/api/v1/auth/login")
def login():
    """Mock login endpoint"""
    return {
        "access_token": "mock-token-123",
        "token_type": "bearer",
        "user": {
            "id": 1,
            "email": "user@example.com",
            "name": "Demo User"
        }
    }

@app.get("/api/v1/dashboards")
def get_dashboards():
    """Get list of dashboards"""
    return {
        "dashboards": [
            {
                "id": 1,
                "name": "Executive Overview",
                "created_at": "2024-09-01",
                "widgets_count": 8
            },
            {
                "id": 2,
                "name": "License Management",
                "created_at": "2024-09-01",
                "widgets_count": 6
            }
        ]
    }

@app.get("/api/v1/vendor-analysis")
def get_vendor_analysis():
    """Get vendor analysis data"""
    vendors = ["Microsoft", "Adobe", "Salesforce", "Oracle", "SAP"]
    top_vendors = []
    
    for vendor in vendors:
        spend_2024 = random.randint(200000, 800000)
        spend_2025 = int(spend_2024 * random.uniform(0.85, 1.05))
        total_licenses = random.randint(100, 1000)
        used_licenses = random.randint(80, min(total_licenses, 950))
        savings = spend_2024 - spend_2025
        
        top_vendors.append({
            "name": vendor,
            "total_spend_2024": spend_2024,
            "total_spend_2025": spend_2025,
            "application_count": random.randint(3, 12),
            "licenses_total": total_licenses,
            "licenses_used": used_licenses,
            "savings": savings,
            "savings_percentage": round((savings / spend_2024 * 100) if spend_2024 > 0 else 0, 1),
            "license_utilization": round((used_licenses / total_licenses * 100) if total_licenses > 0 else 0, 1),
            "department_count": random.randint(2, 6),
            "departments": ["IT", "Sales", "Marketing", "Finance"][:random.randint(2, 4)],
            "risk_levels": {
                "High": random.randint(0, 3),
                "Medium": random.randint(1, 5),
                "Low": random.randint(2, 6)
            },
            "applications": []
        })
    
    total_savings = sum(v["savings"] for v in top_vendors)
    avg_savings_pct = round(sum(v["savings_percentage"] for v in top_vendors) / len(top_vendors), 1)
    
    return {
        "top_vendors": top_vendors,
        "total_vendors": len(top_vendors),
        "total_savings": total_savings,
        "average_savings_percentage": avg_savings_pct,
        "optimization_opportunities": [
            {
                "vendor": "Microsoft",
                "opportunity": "License consolidation",
                "current_utilization": 65.0,
                "current_savings": 50000,
                "potential_savings": 125000,
                "recommendation": "Consolidate Office 365 licenses across departments"
            },
            {
                "vendor": "Adobe",
                "opportunity": "Unused licenses",
                "current_utilization": 45.0,
                "current_savings": 30000,
                "potential_savings": 85000,
                "recommendation": "Remove 150 unused Creative Cloud licenses"
            }
        ],
        "vendor_risk_summary": {
            "high_risk_vendors": 2,
            "medium_risk_vendors": 3,
            "low_risk_vendors": 5
        }
    }

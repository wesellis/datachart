import random
from datetime import datetime, timedelta
from typing import List, Dict, Any
import json

class APMMockDataService:
    def __init__(self):
        self.vendors = [
            {"name": "Microsoft Corporation", "base_spend": 4193318},
            {"name": "Salesforce Inc", "base_spend": 2093456},
            {"name": "Oracle Corporation", "base_spend": 1876543},
            {"name": "ServiceNow Inc", "base_spend": 1543210},
            {"name": "Adobe Inc", "base_spend": 987654},
            {"name": "Cisco Systems", "base_spend": 876543},
            {"name": "VMware Inc", "base_spend": 754321},
            {"name": "Citrix Systems", "base_spend": 654321},
            {"name": "Symantec Corporation", "base_spend": 587654},
            {"name": "Red Hat Inc", "base_spend": 423456},
            {"name": "Splunk Inc", "base_spend": 387654},
            {"name": "Atlassian Corporation", "base_spend": 354321},
            {"name": "Zoom Communications", "base_spend": 298765},
            {"name": "Slack Technologies", "base_spend": 276543},
            {"name": "Snowflake Inc", "base_spend": 254321}
        ]
        
        self.departments = ["IT Operations", "Finance", "HR", "Sales", "Marketing", "Engineering", "Customer Service", "Legal"]
        self.owners = [
            {"name": "John Smith", "email": "jsmith@DataChart.com"},
            {"name": "Sarah Johnson", "email": "sjohnson@DataChart.com"},
            {"name": "Michael Chen", "email": "mchen@DataChart.com"},
            {"name": "Emily Davis", "email": "edavis@DataChart.com"},
            {"name": "Robert Wilson", "email": "rwilson@DataChart.com"},
            {"name": "Jennifer Martinez", "email": "jmartinez@DataChart.com"},
            {"name": "David Anderson", "email": "danderson@DataChart.com"},
            {"name": "Lisa Thompson", "email": "lthompson@DataChart.com"}
        ]
        
        self.app_types = [
            "Enterprise Suite", "Collaboration Tool", "Security Platform", "Analytics Software",
            "CRM System", "ERP Module", "Development Tool", "Monitoring Platform",
            "Database System", "Middleware", "Cloud Service", "Productivity Suite"
        ]
        
        # IT-specific application types
        self.it_app_types = [
            "Infrastructure Management", "Network Monitor", "Security Scanner", "DevOps Platform",
            "Database Admin Tool", "Cloud Infrastructure", "API Gateway", "Container Platform",
            "Backup Solution", "Identity Management", "Log Analytics", "Performance Monitor"
        ]
        
        # HR-specific application types  
        self.hr_app_types = [
            "Recruitment Platform", "Learning Management", "Payroll System", "Benefits Admin",
            "Performance Review", "Employee Survey", "Onboarding Tool", "Time Tracking",
            "Expense Management", "Employee Portal", "Training Platform", "Wellness Program"
        ]
        
    def generate_applications(self, count: int = 500) -> List[Dict[str, Any]]:
        applications = []
        app_counter = {}
        
        for i in range(count):
            vendor = random.choice(self.vendors)
            vendor_name = vendor["name"]
            
            if vendor_name not in app_counter:
                app_counter[vendor_name] = 0
            app_counter[vendor_name] += 1
            
            app = self._generate_single_application(f"APP-{i:04d}", vendor, app_counter[vendor_name])
            applications.append(app)
            
        return applications
    
    def generate_applications_for_department(self, count: int, department: str, app_types: List[str]) -> List[Dict[str, Any]]:
        applications = []
        app_counter = {}
        
        for i in range(count):
            vendor = random.choice(self.vendors)
            vendor_name = vendor["name"]
            
            if vendor_name not in app_counter:
                app_counter[vendor_name] = 0
            app_counter[vendor_name] += 1
            
            app = self._generate_single_application_typed(f"APP-{i:04d}", vendor, app_counter[vendor_name], app_types, department)
            applications.append(app)
            
        return applications
    
    def _generate_single_application(self, app_id: str, vendor: Dict, counter: int) -> Dict[str, Any]:
        vendor_name = vendor["name"]
        base_cost = vendor["base_spend"] / (10 + random.randint(-3, 5))
        
        # Create realistic cost reduction (higher for larger vendors)
        if vendor["base_spend"] > 2000000:
            reduction = random.uniform(0.25, 0.40)  # 25-40% reduction for big vendors
        elif vendor["base_spend"] > 1000000:
            reduction = random.uniform(0.15, 0.30)  # 15-30% for medium
        else:
            reduction = random.uniform(0.05, 0.20)  # 5-20% for smaller
        
        cost_2024 = base_cost * random.uniform(0.8, 1.2)
        cost_2025 = cost_2024 * (1 - reduction)
        
        owner = random.choice(self.owners)
        total_licenses = random.randint(10, 500) if cost_2024 < 100000 else random.randint(100, 2000)
        used_licenses = random.randint(int(total_licenses * 0.4), int(total_licenses * 0.95))
        
        # Renewal dates - spread across the year but cluster some in next 90 days
        if random.random() < 0.3:  # 30% chance of renewal in next 90 days
            days_until_renewal = random.randint(1, 90)
        else:
            days_until_renewal = random.randint(91, 365)
        
        renewal_date = datetime.now() + timedelta(days=days_until_renewal)
        contract_end = renewal_date + timedelta(days=random.choice([365, 730, 1095]))  # 1, 2, or 3 year contracts
        
        # Compliance and patch status correlate with vendor size
        if vendor["base_spend"] > 2000000:
            patch_status = random.choices(["current", "pending", "overdue"], weights=[0.8, 0.15, 0.05])[0]
            compliance_score = random.randint(85, 100)
        else:
            patch_status = random.choices(["current", "pending", "overdue"], weights=[0.6, 0.25, 0.15])[0]
            compliance_score = random.randint(70, 95)
        
        app_type = random.choice(self.app_types)
        
        return {
            "id": app_id,
            "name": f"{vendor_name} {app_type} {counter}",
            "vendor_name": vendor_name,
            "owner_name": owner["name"],
            "owner_email": owner["email"],
            "department": random.choice(self.departments),
            "cost_2024": round(cost_2024, 2),
            "cost_2025": round(cost_2025, 2),
            "monthly_cost": round(cost_2025 / 12, 2),
            "cost_per_user": round(cost_2025 / total_licenses if total_licenses > 0 else 0, 2),
            "total_licenses": total_licenses,
            "used_licenses": used_licenses,
            "utilization_rate": round(used_licenses / total_licenses * 100 if total_licenses > 0 else 0, 2),
            "contract_end": contract_end.isoformat(),
            "renewal_date": renewal_date.isoformat(),
            "days_until_renewal": days_until_renewal,
            "auto_renewal": random.choice([True, False]),
            "notice_period": random.choice([30, 60, 90]),
            "patch_status": patch_status,
            "compliance_score": compliance_score,
            "security_score": random.randint(compliance_score - 10, min(100, compliance_score + 10)),
            "last_update": (datetime.now() - timedelta(days=random.randint(0, 30))).isoformat(),
            "risk_level": self._calculate_risk_level(compliance_score, patch_status, cost_2025),
            "business_criticality": random.choice(["High", "Medium", "Low"])
        }
    
    def _generate_single_application_typed(self, app_id: str, vendor: Dict, counter: int, app_types: List[str], department: str) -> Dict[str, Any]:
        vendor_name = vendor["name"]
        base_cost = vendor["base_spend"] / (10 + random.randint(-3, 5))
        
        # Department-specific cost adjustments
        if department == "hr":
            base_cost *= 0.3  # HR apps typically cost less
        elif department == "it":
            base_cost *= 1.2  # IT infrastructure costs more
        
        # Create realistic cost reduction (higher for larger vendors)
        if vendor["base_spend"] > 2000000:
            reduction = random.uniform(0.25, 0.40)  # 25-40% reduction for big vendors
        elif vendor["base_spend"] > 1000000:
            reduction = random.uniform(0.15, 0.30)  # 15-30% for medium
        else:
            reduction = random.uniform(0.05, 0.20)  # 5-20% for smaller
        
        cost_2024 = base_cost * random.uniform(0.8, 1.2)
        cost_2025 = cost_2024 * (1 - reduction)
        
        # Department-specific owners
        if department == "it":
            owner = random.choice([
                {"name": "Michael Chen", "email": "mchen@DataChart.com"},
                {"name": "David Anderson", "email": "danderson@DataChart.com"},
                {"name": "Robert Wilson", "email": "rwilson@DataChart.com"}
            ])
            dept_name = random.choice(["IT Operations", "Infrastructure", "Security", "DevOps"])
        elif department == "hr":
            owner = random.choice([
                {"name": "Sarah Johnson", "email": "sjohnson@DataChart.com"},
                {"name": "Emily Davis", "email": "edavis@DataChart.com"},
                {"name": "Jennifer Martinez", "email": "jmartinez@DataChart.com"}
            ])
            dept_name = "HR"
        else:
            owner = random.choice(self.owners)
            dept_name = random.choice(self.departments)
        
        total_licenses = random.randint(10, 500) if cost_2024 < 100000 else random.randint(100, 2000)
        used_licenses = random.randint(int(total_licenses * 0.4), int(total_licenses * 0.95))
        
        # Renewal dates - spread across the year but cluster some in next 90 days
        if random.random() < 0.3:  # 30% chance of renewal in next 90 days
            days_until_renewal = random.randint(1, 90)
        else:
            days_until_renewal = random.randint(91, 365)
        
        renewal_date = datetime.now() + timedelta(days=days_until_renewal)
        contract_end = renewal_date + timedelta(days=random.choice([365, 730, 1095]))  # 1, 2, or 3 year contracts
        
        # Department-specific compliance patterns
        if department == "it":
            # IT has better patch compliance
            patch_status = random.choices(["current", "pending", "overdue"], weights=[0.85, 0.12, 0.03])[0]
            compliance_score = random.randint(90, 100)
        elif department == "hr":
            # HR has moderate compliance
            patch_status = random.choices(["current", "pending", "overdue"], weights=[0.7, 0.2, 0.1])[0]
            compliance_score = random.randint(75, 95)
        else:
            # General enterprise compliance
            if vendor["base_spend"] > 2000000:
                patch_status = random.choices(["current", "pending", "overdue"], weights=[0.8, 0.15, 0.05])[0]
                compliance_score = random.randint(85, 100)
            else:
                patch_status = random.choices(["current", "pending", "overdue"], weights=[0.6, 0.25, 0.15])[0]
                compliance_score = random.randint(70, 95)
        
        app_type = random.choice(app_types)
        
        return {
            "id": app_id,
            "name": f"{vendor_name} {app_type} {counter}",
            "vendor_name": vendor_name,
            "owner_name": owner["name"],
            "owner_email": owner["email"],
            "department": dept_name,
            "cost_2024": round(cost_2024, 2),
            "cost_2025": round(cost_2025, 2),
            "monthly_cost": round(cost_2025 / 12, 2),
            "cost_per_user": round(cost_2025 / total_licenses if total_licenses > 0 else 0, 2),
            "total_licenses": total_licenses,
            "used_licenses": used_licenses,
            "utilization_rate": round(used_licenses / total_licenses * 100 if total_licenses > 0 else 0, 2),
            "contract_end": contract_end.isoformat(),
            "renewal_date": renewal_date.isoformat(),
            "days_until_renewal": days_until_renewal,
            "auto_renewal": random.choice([True, False]),
            "notice_period": random.choice([30, 60, 90]),
            "patch_status": patch_status,
            "compliance_score": compliance_score,
            "security_score": random.randint(compliance_score - 10, min(100, compliance_score + 10)),
            "last_update": (datetime.now() - timedelta(days=random.randint(0, 30))).isoformat(),
            "risk_level": self._calculate_risk_level(compliance_score, patch_status, cost_2025),
            "business_criticality": random.choice(["High", "Medium", "Low"]) if department == "it" else random.choice(["Medium", "Low"])
        }
    
    def _calculate_risk_level(self, compliance_score: int, patch_status: str, cost: float) -> str:
        risk_score = 0
        
        if compliance_score < 80:
            risk_score += 3
        elif compliance_score < 90:
            risk_score += 1
            
        if patch_status == "overdue":
            risk_score += 3
        elif patch_status == "pending":
            risk_score += 1
            
        if cost > 500000:
            risk_score += 2
        elif cost > 100000:
            risk_score += 1
            
        if risk_score >= 5:
            return "High"
        elif risk_score >= 2:
            return "Medium"
        else:
            return "Low"
    
    def get_dashboard_metrics(self, view_type: str = "overview") -> Dict[str, Any]:
        # Generate different data based on view type
        if view_type == "optimization":
            # Cost Optimization: Focus on underutilized and expensive apps
            base_count = 287  # Apps with optimization potential
            vendor_filter = ["Microsoft", "Oracle", "Salesforce", "Adobe", "ServiceNow", "SAP"]
            employee_count = 5000
            app_types = self.app_types
            focus = "cost"
        elif view_type == "compliance":
            # Risk & Compliance: Focus on security and compliance critical apps
            base_count = 198  # Security-critical apps
            vendor_filter = ["Microsoft", "Oracle", "VMware", "Cisco", "Symantec", "Splunk", "CrowdStrike"]
            employee_count = 5000
            app_types = self.it_app_types
            focus = "risk"
        elif view_type == "planning":
            # Strategic Planning: Focus on upcoming renewals and consolidation
            base_count = 156  # Apps up for renewal/review
            vendor_filter = None
            employee_count = 5000
            app_types = self.app_types
            focus = "planning"
        elif view_type == "operations":
            # Operations: Focus on daily operational apps
            base_count = 234  # Operational apps
            vendor_filter = ["ServiceNow", "Atlassian", "Microsoft", "Slack", "Zoom", "Datadog"]
            employee_count = 5000
            app_types = self.it_app_types
            focus = "operations"
        else:
            # Executive Overview: All apps
            base_count = 523  # Full enterprise
            vendor_filter = None
            employee_count = 5000
            app_types = self.app_types
            focus = "overview"
        
        # Use view-specific generation
        if view_type in ["optimization", "compliance", "operations"]:
            apps = self.generate_applications_for_department(base_count, view_type, app_types)
        else:
            apps = self.generate_applications(base_count)
        
        # Filter apps by department-relevant vendors if specified
        if vendor_filter:
            # Keep apps from specified vendors, but also add some general apps
            dept_apps = [app for app in apps if any(v in app["vendor_name"] for v in vendor_filter)]
            # Add some general productivity apps regardless
            general_apps = [app for app in apps if "Microsoft" in app["vendor_name"] or "Adobe" in app["vendor_name"]][:10]
            apps = list({app["id"]: app for app in (dept_apps + general_apps)}.values())
        
        total_2024 = sum(app["cost_2024"] for app in apps)
        total_2025 = sum(app["cost_2025"] for app in apps)
        active_apps = len([a for a in apps if a["patch_status"] == "current"])
        
        renewals_30 = [a for a in apps if a["days_until_renewal"] <= 30]
        renewals_60 = [a for a in apps if a["days_until_renewal"] <= 60]
        renewals_90 = [a for a in apps if a["days_until_renewal"] <= 90]
        
        # Calculate vendor totals
        vendor_totals = {}
        for app in apps:
            vendor = app["vendor_name"]
            if vendor not in vendor_totals:
                vendor_totals[vendor] = {
                    "total_2024": 0,
                    "total_2025": 0,
                    "app_count": 0
                }
            vendor_totals[vendor]["total_2024"] += app["cost_2024"]
            vendor_totals[vendor]["total_2025"] += app["cost_2025"]
            vendor_totals[vendor]["app_count"] += 1
        
        # Monthly spending trend
        monthly_trend = self._generate_monthly_trend(total_2024, total_2025)
        
        return {
            "total_applications": len(apps),
            "active_applications": active_apps,
            "inactive_applications": len(apps) - active_apps,
            "total_spend_2024": round(total_2024, 2),
            "total_spend_2025": round(total_2025, 2),
            "savings_amount": round(total_2024 - total_2025, 2),
            "savings_percentage": round((total_2024 - total_2025) / total_2024 * 100, 2),
            "cost_per_employee": round(total_2025 / employee_count, 2),  # Use department-specific employee count
            "compliance_average": round(sum(app["compliance_score"] for app in apps) / len(apps), 2),
            "patch_compliance_rate": round(active_apps / len(apps) * 100, 2),
            "renewals_next_30_days": len(renewals_30),
            "renewals_next_60_days": len(renewals_60),
            "renewals_next_90_days": len(renewals_90),
            "renewal_cost_30_days": round(sum(a["cost_2025"] for a in renewals_30), 2),
            "high_risk_apps": len([a for a in apps if a["risk_level"] == "High"]),
            "medium_risk_apps": len([a for a in apps if a["risk_level"] == "Medium"]),
            "low_risk_apps": len([a for a in apps if a["risk_level"] == "Low"]),
            "average_utilization": round(sum(app["utilization_rate"] for app in apps) / len(apps), 2),
            "vendor_count": len(vendor_totals),
            "vendor_totals": vendor_totals,
            "monthly_trend": monthly_trend,
            "applications": sorted(apps, key=lambda x: x["cost_2025"], reverse=True)[:50]
        }
    
    def _generate_monthly_trend(self, total_2024: float, total_2025: float) -> List[Dict[str, Any]]:
        months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
        trend = []
        
        monthly_2024 = total_2024 / 12
        monthly_2025 = total_2025 / 12
        
        for i, month in enumerate(months):
            # Add some realistic variation
            variation_2024 = random.uniform(0.85, 1.15)
            variation_2025 = random.uniform(0.80, 1.10)  # Slightly lower variation for 2025
            
            data = {
                "month": month,
                "spend_2024": round(monthly_2024 * variation_2024, 2)
            }
            
            # Only show 2025 data up to current month (August)
            if i < 8:
                data["spend_2025"] = round(monthly_2025 * variation_2025, 2)
            else:
                data["spend_2025"] = None
                
            trend.append(data)
        
        return trend
    
    def _days_until_renewal(self, renewal_date_str: str) -> int:
        renewal_date = datetime.fromisoformat(renewal_date_str)
        return (renewal_date - datetime.now()).days
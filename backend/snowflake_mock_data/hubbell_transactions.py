"""
Hubbell Incorporated - Mock Transaction Data
Generates realistic monthly transaction data for APM dashboard
"""

import random
from datetime import datetime, timedelta
from typing import List, Dict
from .hubbell_applications import ALL_HUBBELL_APPS

def generate_monthly_transactions(months_back: int = 12) -> List[Dict]:
    """Generate monthly transaction data for all Hubbell applications"""
    
    transactions = []
    
    # Generate transactions for each month
    for month_offset in range(months_back):
        transaction_date = datetime.now() - timedelta(days=month_offset * 30)
        
        for app in ALL_HUBBELL_APPS:
            # Skip inactive apps some months
            if app["status"] == "Inactive" and random.random() < 0.7:
                continue
                
            # Calculate monthly spend (annual cost / 12 with some variance)
            base_monthly = app["annual_cost"] / 12
            variance = random.uniform(0.8, 1.2)  # ±20% monthly variance
            monthly_amount = base_monthly * variance
            
            # Some apps have multiple transactions per month
            num_transactions = random.choices([1, 2, 3, 4], weights=[70, 20, 8, 2])[0]
            
            for trans_num in range(num_transactions):
                transaction = {
                    "transaction_id": f"TXN-{transaction_date.strftime('%Y%m')}-{app['application_id']}-{trans_num+1:02d}",
                    "vendor_id": app["vendor_id"],
                    "vendor_name": app["vendor"],
                    "application_id": app["application_id"],
                    "application_name": app["name"],
                    "contract_id": app["contract_id"],
                    "transaction_date": transaction_date.strftime("%Y-%m-%d"),
                    "amount": round(monthly_amount / num_transactions, 2),
                    "currency": "USD",
                    "transaction_type": random.choice(["Subscription", "License", "Support", "Professional Services"]),
                    "department": get_department_for_app(app["category"]),
                    "cost_center": get_cost_center_for_department(get_department_for_app(app["category"])),
                    "approval_status": "Approved",
                    "invoice_number": f"INV-{random.randint(100000, 999999)}",
                    "payment_method": random.choice(["Corporate Card", "ACH", "Wire Transfer", "Check"]),
                    "business_unit": get_business_unit_for_app(app["category"]),
                    "record_status": "Current",
                    "created_date": transaction_date.strftime("%Y-%m-%d"),
                    "modified_date": transaction_date.strftime("%Y-%m-%d")
                }
                
                transactions.append(transaction)
    
    return transactions

def get_department_for_app(category: str) -> str:
    """Map application category to department"""
    dept_mapping = {
        "ERP": "Finance",
        "Manufacturing": "Operations",
        "PLM": "Engineering", 
        "CAD": "Engineering",
        "SCM": "Supply Chain",
        "CRM": "Sales",
        "Marketing": "Marketing",
        "HCM": "Human Resources",
        "ITSM": "IT",
        "Security": "IT Security",
        "Analytics": "Business Intelligence",
        "Quality": "Quality Assurance",
        "Grid Management": "Utility Operations",
        "SCADA": "Operations",
        "Field Service": "Field Operations",
        "IoT": "Digital Innovation",
        "Electrical": "Engineering",
        "Simulation": "R&D",
        "Procurement": "Procurement",
        "WMS": "Supply Chain",
        "Logistics": "Logistics",
        "Maintenance": "Facilities",
        "Compliance": "Legal",
        "Finance": "Finance",
        "Productivity": "IT"
    }
    return dept_mapping.get(category, "General")

def get_cost_center_for_department(department: str) -> str:
    """Map department to cost center"""
    cost_centers = {
        "Engineering": "CC-1001-ENG",
        "Operations": "CC-2001-OPS", 
        "Supply Chain": "CC-3001-SCM",
        "Sales": "CC-4001-SLS",
        "Marketing": "CC-4002-MKT",
        "Finance": "CC-5001-FIN",
        "Human Resources": "CC-5002-HR",
        "IT": "CC-6001-IT",
        "IT Security": "CC-6002-SEC",
        "Quality Assurance": "CC-7001-QA",
        "Utility Operations": "CC-8001-UTIL",
        "Field Operations": "CC-8002-FLD",
        "R&D": "CC-9001-RND",
        "Procurement": "CC-3002-PROC",
        "Legal": "CC-5003-LGL",
        "Business Intelligence": "CC-6003-BI",
        "Digital Innovation": "CC-9002-DIG",
        "Logistics": "CC-3003-LOG",
        "Facilities": "CC-5004-FAC"
    }
    return cost_centers.get(department, "CC-0000-GEN")

def get_business_unit_for_app(category: str) -> str:
    """Map application to Hubbell business unit"""
    bu_mapping = {
        "Grid Management": "Utility Solutions",
        "SCADA": "Utility Solutions", 
        "Electrical": "Electrical Solutions",
        "Manufacturing": "Electrical Solutions",
        "PLM": "Electrical Solutions",
        "CAD": "Electrical Solutions",
        "Quality": "Electrical Solutions",
        "Field Service": "Utility Solutions",
        "IoT": "Digital Solutions"
    }
    return bu_mapping.get(category, "Corporate")

# Generate the transaction data
HUBBELL_TRANSACTIONS = generate_monthly_transactions(18)  # 18 months of data

# Summary statistics
total_transactions = len(HUBBELL_TRANSACTIONS)
total_spend = sum(t["amount"] for t in HUBBELL_TRANSACTIONS)
unique_vendors = len(set(t["vendor_name"] for t in HUBBELL_TRANSACTIONS))
unique_applications = len(set(t["application_name"] for t in HUBBELL_TRANSACTIONS))

print(f"Generated {total_transactions:,} transactions for Hubbell")
print(f"Total spend: ${total_spend:,.2f}")
print(f"Unique vendors: {unique_vendors}")
print(f"Unique applications: {unique_applications}")

# Top vendors by spend
vendor_spend = {}
for t in HUBBELL_TRANSACTIONS:
    vendor_spend[t["vendor_name"]] = vendor_spend.get(t["vendor_name"], 0) + t["amount"]

top_vendors = sorted(vendor_spend.items(), key=lambda x: x[1], reverse=True)[:10]
print("\nTop 10 Vendors by Spend:")
for vendor, spend in top_vendors:
    print(f"  {vendor}: ${spend:,.2f}")
"""
Hubbell Incorporated - Mock Compliance Data
Generates realistic compliance metrics for APM dashboard
"""

import random
from datetime import datetime, timedelta
from typing import List, Dict
from .hubbell_applications import ALL_HUBBELL_APPS

def generate_compliance_data() -> List[Dict]:
    """Generate compliance data for all Hubbell applications"""
    
    compliance_categories = {
        "Security": {
            "weight": 0.25,
            "requirements": ["Data Encryption", "Access Controls", "Vulnerability Management", "Incident Response"]
        },
        "Data Privacy": {
            "weight": 0.20,
            "requirements": ["GDPR Compliance", "Data Classification", "Retention Policies", "User Consent"]
        },
        "Licensing": {
            "weight": 0.15,
            "requirements": ["License Compliance", "Usage Monitoring", "Audit Trail", "Renewal Tracking"]
        },
        "Financial": {
            "weight": 0.15,
            "requirements": ["SOX Compliance", "Audit Trail", "Approval Workflows", "Cost Controls"]
        },
        "Operational": {
            "weight": 0.10,
            "requirements": ["SLA Monitoring", "Performance Metrics", "Change Management", "Documentation"]
        },
        "Regulatory": {
            "weight": 0.15,
            "requirements": ["Industry Standards", "Environmental", "Safety", "Export Controls"]
        }
    }
    
    compliance_records = []
    assessment_date = datetime.now() - timedelta(days=30)  # Last assessment 30 days ago
    
    for app in ALL_HUBBELL_APPS:
        for category, details in compliance_categories.items():
            # Generate base compliance score based on app criticality and category
            base_score = get_base_compliance_score(app["criticality"], category)
            
            # Add some variance
            variance = random.uniform(-8, 8)
            final_score = max(60, min(100, base_score + variance))
            
            # Determine compliance status
            if final_score >= 90:
                status = "Compliant"
            elif final_score >= 75:
                status = "Minor Issues" 
            elif final_score >= 60:
                status = "Major Issues"
            else:
                status = "Non-Compliant"
            
            compliance_record = {
                "compliance_id": f"COMP-{app['application_id']}-{category.upper()[:3]}-{assessment_date.strftime('%Y%m')}",
                "application_id": app["application_id"],
                "application_name": app["name"],
                "vendor_id": app["vendor_id"],
                "vendor_name": app["vendor"],
                "compliance_category": category,
                "compliance_score": round(final_score, 1),
                "compliance_status": status,
                "assessment_date": assessment_date.strftime("%Y-%m-%d"),
                "next_assessment": (assessment_date + timedelta(days=90)).strftime("%Y-%m-%d"),
                "risk_level": get_risk_level(final_score, app["criticality"]),
                "findings": generate_findings(category, status),
                "remediation_due": (assessment_date + timedelta(days=60)).strftime("%Y-%m-%d") if status != "Compliant" else None,
                "assessor": random.choice(["Compliance Team", "Security Team", "Legal Team", "Audit Team"]),
                "department": get_department_for_app(app["category"]),
                "business_unit": get_business_unit_for_app(app["category"]),
                "record_status": "Current",
                "created_date": assessment_date.strftime("%Y-%m-%d"),
                "modified_date": assessment_date.strftime("%Y-%m-%d")
            }
            
            compliance_records.append(compliance_record)
    
    return compliance_records

def get_base_compliance_score(criticality: str, category: str) -> float:
    """Get base compliance score based on app criticality and category"""
    
    criticality_scores = {
        "Critical": 92,
        "High": 87,
        "Medium": 82,
        "Low": 78
    }
    
    category_adjustments = {
        "Security": 5,      # Higher scores for security
        "Licensing": 8,     # Usually well managed
        "Financial": 6,     # SOX compliance drives this up
        "Data Privacy": 2,  # More challenging
        "Operational": 4,   # Mixed results
        "Regulatory": 1     # Complex requirements
    }
    
    base = criticality_scores.get(criticality, 80)
    adjustment = category_adjustments.get(category, 0)
    
    return base + adjustment

def get_risk_level(score: float, criticality: str) -> str:
    """Determine risk level based on score and app criticality"""
    
    if score >= 90:
        return "Low"
    elif score >= 75:
        if criticality in ["Critical", "High"]:
            return "Medium"
        else:
            return "Low"
    elif score >= 60:
        if criticality == "Critical":
            return "High"
        else:
            return "Medium"
    else:
        return "High"

def generate_findings(category: str, status: str) -> str:
    """Generate realistic findings based on category and status"""
    
    findings_by_category = {
        "Security": {
            "Compliant": "All security controls properly implemented",
            "Minor Issues": "Minor configuration issues identified", 
            "Major Issues": "Missing vulnerability patches, weak authentication",
            "Non-Compliant": "Critical security vulnerabilities, no encryption"
        },
        "Data Privacy": {
            "Compliant": "Full GDPR compliance, proper data handling",
            "Minor Issues": "Privacy notice needs updates",
            "Major Issues": "Data retention policies not enforced",
            "Non-Compliant": "No data classification, missing consent mechanisms"
        },
        "Licensing": {
            "Compliant": "All licenses properly tracked and compliant",
            "Minor Issues": "License usage approaching limits",
            "Major Issues": "Over-deployment detected, audit trail gaps",
            "Non-Compliant": "Unlicensed usage detected, no tracking system"
        },
        "Financial": {
            "Compliant": "SOX controls in place, proper approvals",
            "Minor Issues": "Documentation needs enhancement",
            "Major Issues": "Missing approval workflows, audit trail gaps", 
            "Non-Compliant": "No financial controls, segregation of duties issues"
        },
        "Operational": {
            "Compliant": "SLAs met, proper change management",
            "Minor Issues": "Performance monitoring needs improvement",
            "Major Issues": "SLA breaches, inadequate documentation",
            "Non-Compliant": "No operational controls, frequent outages"
        },
        "Regulatory": {
            "Compliant": "All regulatory requirements met",
            "Minor Issues": "Documentation updates needed",
            "Major Issues": "Some standards not fully implemented",
            "Non-Compliant": "Multiple regulatory violations identified"
        }
    }
    
    return findings_by_category.get(category, {}).get(status, "Assessment pending")

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
        "IoT": "Digital Innovation"
    }
    return dept_mapping.get(category, "General")

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

# Generate the compliance data
HUBBELL_COMPLIANCE = generate_compliance_data()

# Summary statistics
total_assessments = len(HUBBELL_COMPLIANCE)
avg_score = sum(c["compliance_score"] for c in HUBBELL_COMPLIANCE) / total_assessments
compliant_count = sum(1 for c in HUBBELL_COMPLIANCE if c["compliance_status"] == "Compliant")
high_risk_count = sum(1 for c in HUBBELL_COMPLIANCE if c["risk_level"] == "High")

print(f"Generated {total_assessments:,} compliance assessments for Hubbell")
print(f"Average compliance score: {avg_score:.1f}")
print(f"Compliant assessments: {compliant_count:,} ({compliant_count/total_assessments*100:.1f}%)")
print(f"High risk assessments: {high_risk_count:,} ({high_risk_count/total_assessments*100:.1f}%)")

# Compliance by category
category_stats = {}
for c in HUBBELL_COMPLIANCE:
    cat = c["compliance_category"]
    if cat not in category_stats:
        category_stats[cat] = {"count": 0, "total_score": 0, "compliant": 0}
    
    category_stats[cat]["count"] += 1
    category_stats[cat]["total_score"] += c["compliance_score"]
    if c["compliance_status"] == "Compliant":
        category_stats[cat]["compliant"] += 1

print("\nCompliance by Category:")
for cat, stats in category_stats.items():
    avg_score = stats["total_score"] / stats["count"]
    compliance_rate = stats["compliant"] / stats["count"] * 100
    print(f"  {cat}: {avg_score:.1f} avg score, {compliance_rate:.1f}% compliant")
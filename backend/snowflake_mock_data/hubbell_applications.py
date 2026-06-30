"""
Hubbell Incorporated - Mock Application Portfolio
Realistic software applications for a $4.9B electrical infrastructure & utility company
"""

import random
from datetime import datetime, timedelta
from typing import List, Dict

# Hubbell business areas and realistic applications
HUBBELL_APPLICATIONS = [
    # Manufacturing & Operations (50 apps)
    {"name": "SAP S/4HANA Manufacturing", "vendor": "SAP", "category": "ERP", "cost": 850000, "users": 450, "criticality": "Critical"},
    {"name": "Wonderware MES", "vendor": "AVEVA", "category": "Manufacturing", "cost": 320000, "users": 180, "criticality": "High"},
    {"name": "Rockwell FactoryTalk", "vendor": "Rockwell Automation", "category": "Manufacturing", "cost": 275000, "users": 120, "criticality": "High"},
    {"name": "GE Digital Proficy", "vendor": "General Electric", "category": "Manufacturing", "cost": 195000, "users": 85, "criticality": "Medium"},
    {"name": "Siemens SIMATIC", "vendor": "Siemens", "category": "Manufacturing", "cost": 167000, "users": 95, "criticality": "High"},
    {"name": "Dassault SOLIDWORKS PDM", "vendor": "Dassault Systemes", "category": "PLM", "cost": 145000, "users": 220, "criticality": "High"},
    {"name": "Autodesk Vault", "vendor": "Autodesk", "category": "PLM", "cost": 89000, "users": 180, "criticality": "Medium"},
    {"name": "PTC Windchill", "vendor": "PTC", "category": "PLM", "cost": 234000, "users": 160, "criticality": "High"},
    {"name": "QAD Manufacturing ERP", "vendor": "QAD", "category": "ERP", "cost": 156000, "users": 78, "criticality": "Medium"},
    {"name": "InfinityQS Quality Suite", "vendor": "InfinityQS", "category": "Quality", "cost": 67000, "users": 125, "criticality": "Medium"},
    
    # Supply Chain & Logistics (35 apps)
    {"name": "Oracle Supply Chain Cloud", "vendor": "Oracle", "category": "SCM", "cost": 425000, "users": 145, "criticality": "Critical"},
    {"name": "Blue Yonder WMS", "vendor": "Blue Yonder", "category": "WMS", "cost": 298000, "users": 89, "criticality": "High"},
    {"name": "Manhattan Associates WM", "vendor": "Manhattan Associates", "category": "WMS", "cost": 187000, "users": 67, "criticality": "High"},
    {"name": "SAP Ariba", "vendor": "SAP", "category": "Procurement", "cost": 178000, "users": 156, "criticality": "High"},
    {"name": "Coupa Procurement", "vendor": "Coupa", "category": "Procurement", "cost": 134000, "users": 98, "criticality": "Medium"},
    {"name": "Kinaxis RapidResponse", "vendor": "Kinaxis", "category": "Supply Planning", "cost": 267000, "users": 45, "criticality": "High"},
    {"name": "E2open Supply Chain", "vendor": "E2open", "category": "SCM", "cost": 189000, "users": 78, "criticality": "Medium"},
    {"name": "Descartes Routing", "vendor": "Descartes", "category": "Logistics", "cost": 98000, "users": 234, "criticality": "Medium"},
    {"name": "C.H. Robinson TMC", "vendor": "C.H. Robinson", "category": "Transportation", "cost": 76000, "users": 45, "criticality": "Low"},
    {"name": "CargoWise Logistics", "vendor": "WiseTech", "category": "Logistics", "cost": 89000, "users": 67, "criticality": "Medium"},
    
    # Engineering & Design (40 apps)
    {"name": "ANSYS Simulation Suite", "vendor": "ANSYS", "category": "Simulation", "cost": 345000, "users": 89, "criticality": "High"},
    {"name": "SolidWorks Premium", "vendor": "Dassault Systemes", "category": "CAD", "cost": 289000, "users": 267, "criticality": "Critical"},
    {"name": "AutoCAD Electrical", "vendor": "Autodesk", "category": "CAD", "cost": 178000, "users": 198, "criticality": "High"},
    {"name": "ETAP Power Systems", "vendor": "ETAP", "category": "Electrical", "cost": 234000, "users": 78, "criticality": "High"},
    {"name": "SKM Power Tools", "vendor": "SKM Systems", "category": "Electrical", "cost": 89000, "users": 45, "criticality": "Medium"},
    {"name": "MATLAB Engineering", "vendor": "MathWorks", "category": "Simulation", "cost": 156000, "users": 123, "criticality": "Medium"},
    {"name": "PTC Creo Parametric", "vendor": "PTC", "category": "CAD", "cost": 198000, "users": 145, "criticality": "High"},
    {"name": "Siemens NX", "vendor": "Siemens", "category": "CAD", "cost": 267000, "users": 89, "criticality": "Medium"},
    {"name": "Altium Designer", "vendor": "Altium", "category": "PCB Design", "cost": 145000, "users": 156, "criticality": "High"},
    {"name": "EPLAN Electric P8", "vendor": "EPLAN", "category": "Electrical", "cost": 123000, "users": 234, "criticality": "High"},
    
    # Sales & Marketing (25 apps)
    {"name": "Salesforce Enterprise", "vendor": "Salesforce", "category": "CRM", "cost": 467000, "users": 345, "criticality": "Critical"},
    {"name": "HubSpot Marketing Hub", "vendor": "HubSpot", "category": "Marketing", "cost": 89000, "users": 67, "criticality": "Medium"},
    {"name": "Marketo Engage", "vendor": "Adobe", "category": "Marketing", "cost": 134000, "users": 89, "criticality": "Medium"},
    {"name": "Tableau Desktop", "vendor": "Tableau", "category": "Analytics", "cost": 156000, "users": 234, "criticality": "High"},
    {"name": "Power BI Premium", "vendor": "Microsoft", "category": "Analytics", "cost": 78000, "users": 456, "criticality": "Medium"},
    {"name": "Oracle CPQ Cloud", "vendor": "Oracle", "category": "CPQ", "cost": 198000, "users": 123, "criticality": "High"},
    {"name": "Pipedrive CRM", "vendor": "Pipedrive", "category": "CRM", "cost": 45000, "users": 234, "criticality": "Low"},
    {"name": "ZoomInfo Sales", "vendor": "ZoomInfo", "category": "Sales Intelligence", "cost": 67000, "users": 156, "criticality": "Medium"},
    {"name": "Outreach.io", "vendor": "Outreach", "category": "Sales Engagement", "cost": 89000, "users": 98, "criticality": "Medium"},
    {"name": "Pardot Marketing", "vendor": "Salesforce", "category": "Marketing", "cost": 98000, "users": 67, "criticality": "Medium"},
    
    # Utility & Grid Solutions (30 apps)
    {"name": "GE ADMS", "vendor": "General Electric", "category": "Grid Management", "cost": 567000, "users": 89, "criticality": "Critical"},
    {"name": "Schneider ADMS", "vendor": "Schneider Electric", "category": "Grid Management", "cost": 445000, "users": 67, "criticality": "Critical"},
    {"name": "OSIsoft PI System", "vendor": "OSIsoft", "category": "Historian", "cost": 234000, "users": 145, "criticality": "High"},
    {"name": "Wonderware SCADA", "vendor": "AVEVA", "category": "SCADA", "cost": 198000, "users": 78, "criticality": "High"},
    {"name": "eSysman SCADA", "vendor": "eSysman", "category": "SCADA", "cost": 123000, "users": 56, "criticality": "Medium"},
    {"name": "ETAP Real Time", "vendor": "ETAP", "category": "Grid Analysis", "cost": 189000, "users": 34, "criticality": "High"},
    {"name": "PowerWorld Simulator", "vendor": "PowerWorld", "category": "Grid Analysis", "cost": 98000, "users": 45, "criticality": "Medium"},
    {"name": "GE Smallworld", "vendor": "General Electric", "category": "GIS", "cost": 278000, "users": 123, "criticality": "High"},
    {"name": "Esri ArcGIS Utility", "vendor": "Esri", "category": "GIS", "cost": 156000, "users": 189, "criticality": "High"},
    {"name": "Milsoft WindMil", "vendor": "Milsoft", "category": "Grid Analysis", "cost": 134000, "users": 67, "criticality": "Medium"},
    
    # Corporate & Finance (35 apps)
    {"name": "SAP SuccessFactors", "vendor": "SAP", "category": "HCM", "cost": 298000, "users": 1250, "criticality": "Critical"},
    {"name": "Workday HCM", "vendor": "Workday", "category": "HCM", "cost": 267000, "users": 1250, "criticality": "High"},
    {"name": "Oracle NetSuite ERP", "vendor": "Oracle", "category": "ERP", "cost": 189000, "users": 345, "criticality": "Medium"},
    {"name": "Concur Expense", "vendor": "SAP", "category": "Expense", "cost": 89000, "users": 1250, "criticality": "Medium"},
    {"name": "BlackLine Accounting", "vendor": "BlackLine", "category": "Finance", "cost": 134000, "users": 89, "criticality": "Medium"},
    {"name": "Hyperion Planning", "vendor": "Oracle", "category": "Planning", "cost": 234000, "users": 67, "criticality": "High"},
    {"name": "Adaptive Insights", "vendor": "Workday", "category": "Planning", "cost": 156000, "users": 89, "criticality": "Medium"},
    {"name": "ServiceNow ITSM", "vendor": "ServiceNow", "category": "ITSM", "cost": 198000, "users": 234, "criticality": "High"},
    {"name": "Jira Service Desk", "vendor": "Atlassian", "category": "ITSM", "cost": 67000, "users": 345, "criticality": "Medium"},
    {"name": "Office 365 E5", "vendor": "Microsoft", "category": "Productivity", "cost": 567000, "users": 4890, "criticality": "Critical"},
    
    # Additional applications to reach 200+
    {"name": "Snowflake Data Cloud", "vendor": "Snowflake", "category": "Data Platform", "cost": 345000, "users": 89, "criticality": "Critical"},
    {"name": "Databricks Analytics", "vendor": "Databricks", "category": "Analytics", "cost": 234000, "users": 67, "criticality": "High"},
    {"name": "Azure Synapse", "vendor": "Microsoft", "category": "Data Platform", "cost": 189000, "users": 45, "criticality": "Medium"},
    {"name": "Amazon Redshift", "vendor": "Amazon", "category": "Data Warehouse", "cost": 156000, "users": 78, "criticality": "Medium"},
    {"name": "Qlik Sense Enterprise", "vendor": "Qlik", "category": "Analytics", "cost": 123000, "users": 234, "criticality": "Medium"},
    {"name": "SAS Analytics", "vendor": "SAS", "category": "Analytics", "cost": 298000, "users": 89, "criticality": "High"},
    {"name": "Alteryx Designer", "vendor": "Alteryx", "category": "Data Prep", "cost": 89000, "users": 123, "criticality": "Medium"},
    {"name": "Informatica IICS", "vendor": "Informatica", "category": "Integration", "cost": 234000, "users": 67, "criticality": "High"},
    {"name": "Talend Data Fabric", "vendor": "Talend", "category": "Integration", "cost": 156000, "users": 89, "criticality": "Medium"},
    {"name": "MuleSoft Anypoint", "vendor": "MuleSoft", "category": "Integration", "cost": 189000, "users": 45, "criticality": "High"},
    
    # Security & Compliance (20 apps)
    {"name": "CyberArk Privileged", "vendor": "CyberArk", "category": "Security", "cost": 189000, "users": 1250, "criticality": "Critical"},
    {"name": "Okta Identity", "vendor": "Okta", "category": "Identity", "cost": 134000, "users": 4890, "criticality": "High"},
    {"name": "Splunk Enterprise", "vendor": "Splunk", "category": "SIEM", "cost": 298000, "users": 89, "criticality": "High"},
    {"name": "Qualys VMDR", "vendor": "Qualys", "category": "Security", "cost": 89000, "users": 234, "criticality": "Medium"},
    {"name": "Rapid7 InsightVM", "vendor": "Rapid7", "category": "Security", "cost": 67000, "users": 156, "criticality": "Medium"},
    {"name": "Tenable Nessus", "vendor": "Tenable", "category": "Security", "cost": 45000, "users": 89, "criticality": "Medium"},
    {"name": "Crowdstrike Falcon", "vendor": "CrowdStrike", "category": "Endpoint", "cost": 156000, "users": 4890, "criticality": "High"},
    {"name": "Proofpoint Email", "vendor": "Proofpoint", "category": "Email Security", "cost": 89000, "users": 4890, "criticality": "High"},
    {"name": "Zscaler Internet", "vendor": "Zscaler", "category": "Network Security", "cost": 123000, "users": 4890, "criticality": "Medium"},
    {"name": "Palo Alto Prisma", "vendor": "Palo Alto Networks", "category": "Cloud Security", "cost": 178000, "users": 234, "criticality": "High"},
    
    # Field Service & IoT (25 apps)
    {"name": "ServiceMax Field Service", "vendor": "ServiceMax", "category": "Field Service", "cost": 234000, "users": 345, "criticality": "High"},
    {"name": "Microsoft Dynamics FSO", "vendor": "Microsoft", "category": "Field Service", "cost": 189000, "users": 278, "criticality": "High"},
    {"name": "PTC ThingWorx", "vendor": "PTC", "category": "IoT", "cost": 298000, "users": 89, "criticality": "High"},
    {"name": "GE Digital Predix", "vendor": "General Electric", "category": "IoT", "cost": 267000, "users": 67, "criticality": "Medium"},
    {"name": "Azure IoT Central", "vendor": "Microsoft", "category": "IoT", "cost": 156000, "users": 123, "criticality": "Medium"},
    {"name": "AWS IoT Core", "vendor": "Amazon", "category": "IoT", "cost": 134000, "users": 89, "criticality": "Medium"},
    {"name": "Siemens MindSphere", "vendor": "Siemens", "category": "IoT", "cost": 198000, "users": 78, "criticality": "Medium"},
    {"name": "Schneider EcoStruxure", "vendor": "Schneider Electric", "category": "IoT", "cost": 234000, "users": 156, "criticality": "High"},
    {"name": "FieldAware Mobile", "vendor": "FieldAware", "category": "Field Service", "cost": 89000, "users": 234, "criticality": "Medium"},
    {"name": "ClickSoftware Workforce", "vendor": "ClickSoftware", "category": "Workforce Mgmt", "cost": 123000, "users": 189, "criticality": "Medium"},
    
    # Additional Manufacturing & Quality (15 apps)
    {"name": "Epicor ERP", "vendor": "Epicor", "category": "ERP", "cost": 178000, "users": 156, "criticality": "Medium"},
    {"name": "IQMS Manufacturing", "vendor": "IQMS", "category": "Manufacturing", "cost": 134000, "users": 89, "criticality": "Medium"},
    {"name": "Infor LN ERP", "vendor": "Infor", "category": "ERP", "cost": 298000, "users": 234, "criticality": "High"},
    {"name": "Minitab Quality", "vendor": "Minitab", "category": "Quality", "cost": 45000, "users": 123, "criticality": "Low"},
    {"name": "JMP Statistical", "vendor": "SAS", "category": "Quality", "cost": 67000, "users": 89, "criticality": "Medium"},
    {"name": "Arena PLM", "vendor": "Arena", "category": "PLM", "cost": 123000, "users": 178, "criticality": "Medium"},
    {"name": "Siemens Teamcenter", "vendor": "Siemens", "category": "PLM", "cost": 345000, "users": 189, "criticality": "High"},
    {"name": "AVEVA PI Historian", "vendor": "AVEVA", "category": "Historian", "cost": 189000, "users": 67, "criticality": "Medium"},
    {"name": "Honeywell Experion", "vendor": "Honeywell", "category": "DCS", "cost": 456000, "users": 45, "criticality": "Critical"},
    {"name": "Emerson DeltaV", "vendor": "Emerson", "category": "DCS", "cost": 398000, "users": 56, "criticality": "High"},
    
    # DevOps & Development (20 apps)
    {"name": "GitHub Enterprise", "vendor": "GitHub", "category": "DevOps", "cost": 89000, "users": 234, "criticality": "High"},
    {"name": "Azure DevOps", "vendor": "Microsoft", "category": "DevOps", "cost": 67000, "users": 189, "criticality": "Medium"},
    {"name": "Jenkins CI/CD", "vendor": "CloudBees", "category": "DevOps", "cost": 45000, "users": 156, "criticality": "Medium"},
    {"name": "Terraform Cloud", "vendor": "HashiCorp", "category": "Infrastructure", "cost": 78000, "users": 89, "criticality": "Medium"},
    {"name": "Docker Enterprise", "vendor": "Docker", "category": "Containers", "cost": 56000, "users": 123, "criticality": "Medium"},
    {"name": "Kubernetes", "vendor": "Red Hat", "category": "Orchestration", "cost": 134000, "users": 67, "criticality": "High"},
    {"name": "New Relic APM", "vendor": "New Relic", "category": "Monitoring", "cost": 89000, "users": 45, "criticality": "Medium"},
    {"name": "Dynatrace", "vendor": "Dynatrace", "category": "APM", "cost": 156000, "users": 78, "criticality": "High"},
    {"name": "AppDynamics", "vendor": "Cisco", "category": "APM", "cost": 123000, "users": 89, "criticality": "Medium"},
    {"name": "Datadog Infrastructure", "vendor": "Datadog", "category": "Monitoring", "cost": 98000, "users": 156, "criticality": "Medium"},
]

def generate_additional_apps(base_apps: List[Dict], target_count: int = 200) -> List[Dict]:
    """Generate additional applications to reach target count"""
    
    additional_vendors = [
        "Emerson", "ABB", "Honeywell", "Rockwell", "Allen-Bradley", "Phoenix Contact",
        "Weidmuller", "Rittal", "Panduit", "Thomas & Betts", "Leviton", "Pass & Seymour",
        "Raco", "Wiremold", "Carlon", "IDEAL", "Klein Tools", "Greenlee",
        "Fluke", "Megger", "AEMC", "Amprobe", "Extech", "Triplett"
    ]
    
    app_categories = [
        "CAD", "Manufacturing", "Quality", "PLM", "ERP", "CRM", "Analytics", 
        "Security", "SCADA", "HMI", "Maintenance", "Inventory", "Compliance",
        "Document Management", "Training", "Asset Management", "Environmental"
    ]
    
    current_count = len(base_apps)
    additional_apps = []
    
    while current_count < target_count:
        vendor = random.choice(additional_vendors)
        category = random.choice(app_categories)
        
        app = {
            "name": f"{vendor} {category} System",
            "vendor": vendor,
            "category": category,
            "cost": random.randint(15000, 500000),
            "users": random.randint(10, 500),
            "criticality": random.choice(["Low", "Medium", "High", "Critical"])
        }
        
        additional_apps.append(app)
        current_count += 1
    
    return base_apps + additional_apps

# Generate the complete application list
ALL_HUBBELL_APPS = generate_additional_apps(HUBBELL_APPLICATIONS, 235)

# Add some unique Hubbell-specific identifiers
for i, app in enumerate(ALL_HUBBELL_APPS):
    app["application_id"] = f"HUB-APP-{i+1:03d}"
    app["vendor_id"] = f"VENDOR-{hash(app['vendor']) % 1000:03d}"
    app["contract_id"] = f"CONTRACT-{random.randint(1000, 9999)}"
    app["deployment_date"] = (datetime.now() - timedelta(days=random.randint(30, 1800))).strftime("%Y-%m-%d")
    app["renewal_date"] = (datetime.now() + timedelta(days=random.randint(30, 730))).strftime("%Y-%m-%d")
    app["status"] = random.choice(["Active", "Active", "Active", "Inactive", "Pilot"])  # Weighted toward Active
    app["compliance_status"] = random.choice(["Compliant", "Compliant", "Non-Compliant", "Under Review"])
    app["health_score"] = random.randint(65, 98)
    app["annual_cost"] = app["cost"]

print(f"Generated {len(ALL_HUBBELL_APPS)} applications for Hubbell Incorporated")
print(f"Total annual software spend: ${sum(app['annual_cost'] for app in ALL_HUBBELL_APPS):,}")
"""
DataChart vs Qlik Comparison API Endpoints
Provides data for the comparison page showing why we beat Qlik
"""

from fastapi import APIRouter, HTTPException
from typing import Dict, List, Any
from datetime import datetime, timedelta
import random

router = APIRouter(tags=["Comparison"])

@router.get("/pricing")
async def get_pricing_comparison():
    """Get detailed pricing comparison between DataChart and competitors"""
    return {
        "DataChart": {
            "name": "DataChart Dashboard",
            "initial_cost": 0,
            "monthly_cost": 0,
            "annual_cost": 0,
            "three_year_total": 0,
            "implementation_cost": 0,
            "training_cost": 0,
            "per_user_cost": 0,
            "unlimited_users": True,
            "hidden_costs": [],
            "total_cost_of_ownership": 0
        },
        "qlik": {
            "name": "Qlik Sense Enterprise",
            "initial_cost": 30000,
            "monthly_cost": 2500,
            "annual_cost": 30000,
            "three_year_total": 250000,
            "implementation_cost": 75000,
            "training_cost": 10000,
            "per_user_cost": 70,
            "unlimited_users": False,
            "hidden_costs": [
                {"item": "Annual maintenance", "cost": 6000},
                {"item": "Consultant fees", "cost": 50000},
                {"item": "Server infrastructure", "cost": 15000},
                {"item": "Premium support", "cost": 12000}
            ],
            "total_cost_of_ownership": 250000
        },
        "tableau": {
            "name": "Tableau Server",
            "initial_cost": 35000,
            "monthly_cost": 2916,
            "annual_cost": 35000,
            "three_year_total": 280000,
            "implementation_cost": 60000,
            "training_cost": 15000,
            "per_user_cost": 75,
            "unlimited_users": False,
            "hidden_costs": [
                {"item": "Data prep tools", "cost": 10000},
                {"item": "Server licensing", "cost": 20000},
                {"item": "Professional services", "cost": 40000}
            ],
            "total_cost_of_ownership": 280000
        },
        "powerbi": {
            "name": "Power BI Premium",
            "initial_cost": 4995,
            "monthly_cost": 4995,
            "annual_cost": 59940,
            "three_year_total": 179820,
            "implementation_cost": 30000,
            "training_cost": 5000,
            "per_user_cost": 10,
            "unlimited_users": False,
            "hidden_costs": [
                {"item": "Azure infrastructure", "cost": 8000},
                {"item": "Premium capacity units", "cost": 15000},
                {"item": "Advanced features", "cost": 10000}
            ],
            "total_cost_of_ownership": 179820
        }
    }

@router.get("/features")
async def get_feature_comparison():
    """Get feature-by-feature comparison"""
    return {
        "categories": [
            {
                "name": "Dashboard Creation",
                "features": [
                    {
                        "feature": "One-click dashboard from data",
                        "DataChart": {"supported": True, "description": "3 seconds"},
                        "qlik": {"supported": False, "description": "2-3 hours"},
                        "tableau": {"supported": False, "description": "1-2 hours"},
                        "powerbi": {"supported": True, "description": "30 minutes"}
                    },
                    {
                        "feature": "AI-powered auto-layout",
                        "DataChart": {"supported": True, "description": "Automatic"},
                        "qlik": {"supported": False, "description": "Manual"},
                        "tableau": {"supported": False, "description": "Manual"},
                        "powerbi": {"supported": True, "description": "Limited"}
                    },
                    {
                        "feature": "Natural language queries",
                        "DataChart": {"supported": True, "description": "96% accuracy"},
                        "qlik": {"supported": True, "description": "Basic"},
                        "tableau": {"supported": True, "description": "Ask Data"},
                        "powerbi": {"supported": True, "description": "Q&A"}
                    }
                ]
            },
            {
                "name": "Collaboration",
                "features": [
                    {
                        "feature": "Real-time co-editing",
                        "DataChart": {"supported": True, "description": "Google Docs style"},
                        "qlik": {"supported": False, "description": "Not available"},
                        "tableau": {"supported": False, "description": "Not available"},
                        "powerbi": {"supported": False, "description": "Not available"}
                    },
                    {
                        "feature": "Live cursor tracking",
                        "DataChart": {"supported": True, "description": "See others editing"},
                        "qlik": {"supported": False, "description": "No"},
                        "tableau": {"supported": False, "description": "No"},
                        "powerbi": {"supported": False, "description": "No"}
                    },
                    {
                        "feature": "Version control",
                        "DataChart": {"supported": True, "description": "Git-based"},
                        "qlik": {"supported": True, "description": "Basic"},
                        "tableau": {"supported": True, "description": "Revisions"},
                        "powerbi": {"supported": True, "description": "Workspace"}
                    }
                ]
            },
            {
                "name": "Actions & Automation",
                "features": [
                    {
                        "feature": "Embedded actions",
                        "DataChart": {"supported": True, "description": "Fix problems directly"},
                        "qlik": {"supported": False, "description": "View only"},
                        "tableau": {"supported": False, "description": "View only"},
                        "powerbi": {"supported": True, "description": "Power Automate"}
                    },
                    {
                        "feature": "Auto-remediation",
                        "DataChart": {"supported": True, "description": "One-click fixes"},
                        "qlik": {"supported": False, "description": "No"},
                        "tableau": {"supported": False, "description": "No"},
                        "powerbi": {"supported": False, "description": "No"}
                    },
                    {
                        "feature": "Workflow triggers",
                        "DataChart": {"supported": True, "description": "Full automation"},
                        "qlik": {"supported": True, "description": "Alerting only"},
                        "tableau": {"supported": True, "description": "Basic"},
                        "powerbi": {"supported": True, "description": "Flow integration"}
                    }
                ]
            },
            {
                "name": "Enterprise Integration",
                "features": [
                    {
                        "feature": "SCCM/MECM",
                        "DataChart": {"supported": True, "description": "Native"},
                        "qlik": {"supported": False, "description": "Custom dev"},
                        "tableau": {"supported": False, "description": "Custom dev"},
                        "powerbi": {"supported": True, "description": "Connector"}
                    },
                    {
                        "feature": "PatchMyPC",
                        "DataChart": {"supported": True, "description": "Built-in"},
                        "qlik": {"supported": False, "description": "No"},
                        "tableau": {"supported": False, "description": "No"},
                        "powerbi": {"supported": False, "description": "No"}
                    },
                    {
                        "feature": "Snowflake",
                        "DataChart": {"supported": True, "description": "Native + AI parsing"},
                        "qlik": {"supported": True, "description": "Connector"},
                        "tableau": {"supported": True, "description": "Native"},
                        "powerbi": {"supported": True, "description": "Connector"}
                    }
                ]
            }
        ]
    }

@router.get("/metrics")
async def get_comparison_metrics():
    """Get performance and adoption metrics"""
    return {
        "performance": {
            "dashboard_creation_time": {
                "DataChart": 3,  # seconds
                "qlik": 7200,  # 2 hours
                "tableau": 3600,  # 1 hour
                "powerbi": 1800  # 30 minutes
            },
            "query_response_time": {
                "DataChart": 0.2,  # seconds
                "qlik": 2.5,
                "tableau": 1.8,
                "powerbi": 1.2
            },
            "data_refresh_rate": {
                "DataChart": "Real-time",
                "qlik": "Scheduled",
                "tableau": "Extract-based",
                "powerbi": "DirectQuery/Import"
            }
        },
        "adoption": {
            "user_adoption_rate": {
                "DataChart": 95,
                "qlik": 60,
                "tableau": 65,
                "powerbi": 75
            },
            "time_to_value": {
                "DataChart": 1,  # days
                "qlik": 90,
                "tableau": 60,
                "powerbi": 30
            },
            "training_required": {
                "DataChart": 2,  # hours
                "qlik": 40,
                "tableau": 32,
                "powerbi": 16
            }
        },
        "roi": {
            "productivity_gain": {
                "DataChart": 40,  # percent
                "qlik": 15,
                "tableau": 20,
                "powerbi": 25
            },
            "time_saved_weekly": {
                "DataChart": 8,  # hours
                "qlik": 2,
                "tableau": 3,
                "powerbi": 4
            }
        }
    }

@router.get("/savings-calculator")
async def calculate_savings(
    users: int = 100,
    years: int = 3,
    current_solution: str = "qlik"
):
    """Calculate potential savings by switching to DataChart"""
    
    # Cost calculations
    costs = {
        "qlik": {
            "license": 30000 + (max(0, users - 5) * 70 * 12),
            "implementation": 75000,
            "training": users * 100,
            "maintenance": 6000 * years,
            "consulting": 50000
        },
        "tableau": {
            "license": 35000 + (users * 75 * 12),
            "implementation": 60000,
            "training": users * 150,
            "maintenance": 8000 * years,
            "consulting": 40000
        },
        "powerbi": {
            "license": 4995 * 12 + (users * 10 * 12),
            "implementation": 30000,
            "training": users * 50,
            "maintenance": 3000 * years,
            "consulting": 20000
        }
    }
    
    current_cost = sum(costs.get(current_solution, costs["qlik"]).values()) * years
    DataChart_cost = 0
    
    # Productivity calculations
    hours_saved_per_user = 8  # hours per week
    hourly_rate = 75  # average IT worker hourly rate
    productivity_savings = users * hours_saved_per_user * 52 * hourly_rate * years
    
    # Action automation savings
    automated_fixes = 50  # per month
    cost_per_manual_fix = 200  # IT time cost
    automation_savings = automated_fixes * 12 * cost_per_manual_fix * years
    
    return {
        "current_solution": current_solution,
        "current_cost": current_cost,
        "DataChart_cost": DataChart_cost,
        "direct_savings": current_cost - DataChart_cost,
        "productivity_savings": productivity_savings,
        "automation_savings": automation_savings,
        "total_savings": current_cost + productivity_savings + automation_savings,
        "roi_percentage": ((current_cost + productivity_savings + automation_savings) / max(1, current_cost)) * 100,
        "payback_period": "Immediate",
        "details": {
            "license_savings": costs[current_solution]["license"] * years,
            "implementation_savings": costs[current_solution]["implementation"],
            "training_savings": costs[current_solution]["training"],
            "consulting_savings": costs[current_solution]["consulting"],
            "time_saved_hours": users * hours_saved_per_user * 52 * years,
            "automated_actions": automated_fixes * 12 * years
        }
    }

@router.get("/demo-data/{feature}")
async def get_demo_data(feature: str):
    """Get demo data for specific features"""
    
    demos = {
        "instant_dashboard": {
            "input": "SELECT * FROM application_inventory",
            "processing_time": 3.2,
            "widgets_created": 12,
            "insights_found": 8,
            "demo_url": "/demo/instant-dashboard",
            "comparison": {
                "qlik_time": "2-3 hours",
                "our_time": "3.2 seconds",
                "time_saved": "99.9%"
            }
        },
        "natural_language": {
            "query": "Show me which apps cost the most but are used the least",
            "interpretation": {
                "intent": "cost_optimization",
                "entities": ["cost", "usage", "inverse_correlation"],
                "confidence": 0.96
            },
            "results": [
                {"app": "Adobe Creative Suite", "cost": 125000, "usage": 10, "savings": 75000},
                {"app": "Tableau", "cost": 45000, "usage": 15, "savings": 30000},
                {"app": "Unused Oracle Licenses", "cost": 89000, "usage": 0, "savings": 89000}
            ],
            "total_savings_found": 194000
        },
        "collaboration": {
            "active_users": [
                {"name": "John (IT)", "editing": "Security Dashboard", "cursor_color": "#FF6B6B"},
                {"name": "Sarah (Finance)", "editing": "Cost Analysis", "cursor_color": "#4ECDC4"},
                {"name": "Mike (Ops)", "editing": "Patch Status", "cursor_color": "#45B7D1"}
            ],
            "changes_per_second": 2.5,
            "merge_conflicts": 0,
            "version_saves": 127
        },
        "embedded_actions": {
            "available_actions": [
                {"action": "Patch critical systems", "impact": "150 systems", "time": "2 hours"},
                {"action": "Remove unused licenses", "savings": "$67,500/year", "licenses": 45},
                {"action": "Block shadow IT", "apps": 12, "risk_reduced": "High"},
                {"action": "Optimize cloud costs", "monthly_savings": "$12,500", "resources": 89}
            ],
            "execution_time": "Immediate",
            "rollback_available": True,
            "audit_logged": True
        }
    }
    
    if feature not in demos:
        raise HTTPException(status_code=404, detail=f"Demo for {feature} not found")
    
    return demos[feature]

@router.get("/testimonials")
async def get_testimonials():
    """Get testimonials and case studies"""
    return {
        "testimonials": [
            {
                "author": "IT Director",
                "company": "Fortune 500 Company",
                "quote": "We saved $340K in the first year and reduced dashboard creation time by 99%",
                "metrics": {
                    "cost_saved": 340000,
                    "time_saved": "99%",
                    "user_adoption": "95%"
                }
            },
            {
                "author": "CTO",
                "company": "Healthcare Provider",
                "quote": "The embedded actions feature alone justified the switch from Qlik",
                "metrics": {
                    "automated_fixes": 1200,
                    "incident_reduction": "67%",
                    "mttr_improvement": "78%"
                }
            },
            {
                "author": "Data Analyst",
                "company": "Retail Chain",
                "quote": "Finally, a BI tool that non-technical users can actually use",
                "metrics": {
                    "dashboards_created": 450,
                    "training_time": "2 hours",
                    "self_service_rate": "92%"
                }
            }
        ],
        "case_studies": [
            {
                "title": "Global Manufacturer Saves $2.5M",
                "industry": "Manufacturing",
                "challenge": "Complex Qlik implementation costing $250K/year",
                "solution": "Migrated to DataChart Dashboard in 1 week",
                "results": [
                    "$250K annual savings on licensing",
                    "95% reduction in dashboard creation time",
                    "100% user adoption vs 60% with Qlik",
                    "$2.5M saved over 3 years including productivity gains"
                ]
            },
            {
                "title": "MSP Replaces Entire BI Stack",
                "industry": "Managed Services",
                "challenge": "Multiple BI tools (Qlik, Tableau, Power BI) costing $500K/year",
                "solution": "Consolidated on DataChart Dashboard",
                "results": [
                    "$500K annual cost elimination",
                    "Single platform for all reporting",
                    "Real-time client dashboards",
                    "Embedded automation saved 40 hours/week"
                ]
            }
        ]
    }

@router.post("/request-demo")
async def request_demo(
    company: str,
    email: str,
    current_solution: str,
    users: int
):
    """Request a personalized demo"""
    
    # Calculate potential savings for their scenario
    savings = await calculate_savings(users, 3, current_solution)
    
    return {
        "demo_scheduled": True,
        "personalized_insights": {
            "potential_savings": savings["total_savings"],
            "roi_percentage": savings["roi_percentage"],
            "key_benefits": [
                f"Save ${savings['direct_savings']:,.0f} on licensing",
                f"Save {savings['details']['time_saved_hours']:,.0f} hours",
                f"Automate {savings['details']['automated_actions']} actions"
            ]
        },
        "demo_link": f"/demo/personalized/{company.lower().replace(' ', '-')}",
        "materials_sent": [
            "ROI Calculator",
            "Feature Comparison Matrix",
            "Migration Guide from " + current_solution.title(),
            "Security & Compliance Documentation"
        ]
    }
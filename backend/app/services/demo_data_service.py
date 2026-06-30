"""
Demo Data Service for DataChart
Provides realistic demo data for sales demonstrations and trials
"""

import random
import json
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
import hashlib
from faker import Faker

fake = Faker()

class DemoDataService:
    """
    Generate realistic demo data for DataChart demonstrations
    Based on actual enterprise scenarios and DataChart's expertise
    """
    
    def __init__(self, customer_name: str = "Acme Corporation"):
        self.customer_name = customer_name
        self.base_seed = hashlib.md5(customer_name.encode()).hexdigest()
        random.seed(self.base_seed)
        Faker.seed(self.base_seed)
        
        # Industry templates
        self.industry_templates = {
            'healthcare': {
                'vendor_focus': ['Epic', 'Cerner', 'McKesson', 'GE Healthcare', 'Siemens Healthineers'],
                'app_focus': ['EHR System', 'PACS', 'Lab Information System', 'Patient Portal', 'Telehealth Platform'],
                'compliance': ['HIPAA', 'HITECH', 'FDA 21 CFR', 'Joint Commission'],
                'spend_multiplier': 1.3
            },
            'financial': {
                'vendor_focus': ['Bloomberg', 'Refinitiv', 'FIS', 'Fiserv', 'Jack Henry'],
                'app_focus': ['Core Banking', 'Trading Platform', 'Risk Management', 'AML System', 'Credit Scoring'],
                'compliance': ['SOX', 'PCI DSS', 'GDPR', 'Basel III', 'FFIEC'],
                'spend_multiplier': 1.5
            },
            'manufacturing': {
                'vendor_focus': ['SAP', 'Oracle', 'Siemens', 'Rockwell', 'Dassault'],
                'app_focus': ['ERP System', 'MES', 'PLM', 'SCM', 'Quality Management'],
                'compliance': ['ISO 9001', 'ISO 14001', 'OSHA', 'FDA', 'REACH'],
                'spend_multiplier': 1.1
            },
            'retail': {
                'vendor_focus': ['Salesforce', 'Adobe', 'Oracle Retail', 'Manhattan Associates', 'Blue Yonder'],
                'app_focus': ['POS System', 'E-commerce Platform', 'Inventory Management', 'CRM', 'Loyalty Program'],
                'compliance': ['PCI DSS', 'GDPR', 'CCPA', 'ADA', 'FTC'],
                'spend_multiplier': 0.9
            },
            'technology': {
                'vendor_focus': ['AWS', 'Microsoft Azure', 'Google Cloud', 'GitHub', 'Atlassian'],
                'app_focus': ['DevOps Platform', 'Cloud Infrastructure', 'Monitoring Suite', 'Security Platform', 'Data Analytics'],
                'compliance': ['SOC 2', 'ISO 27001', 'GDPR', 'CCPA', 'FedRAMP'],
                'spend_multiplier': 1.2
            }
        }
        
    def generate_complete_demo_data(self, 
                                   industry: str = 'technology',
                                   company_size: str = 'large',
                                   scenario: str = 'standard') -> Dict:
        """
        Generate complete demo dataset for a customer
        
        Args:
            industry: Industry vertical
            company_size: small (100-500), medium (500-5000), large (5000+)
            scenario: standard, cost_optimization, security_focus, compliance_audit
        
        Returns:
            Complete demo dataset
        """
        
        # Set parameters based on company size
        size_params = {
            'small': {
                'employees': random.randint(100, 500),
                'it_budget': random.randint(500000, 2000000),
                'vendors': random.randint(20, 50),
                'applications': random.randint(30, 100)
            },
            'medium': {
                'employees': random.randint(500, 5000),
                'it_budget': random.randint(2000000, 10000000),
                'vendors': random.randint(50, 200),
                'applications': random.randint(100, 500)
            },
            'large': {
                'employees': random.randint(5000, 50000),
                'it_budget': random.randint(10000000, 100000000),
                'vendors': random.randint(200, 500),
                'applications': random.randint(500, 2000)
            }
        }
        
        params = size_params.get(company_size, size_params['medium'])
        template = self.industry_templates.get(industry, self.industry_templates['technology'])
        
        # Adjust for scenario
        if scenario == 'cost_optimization':
            params['it_budget'] = int(params['it_budget'] * 1.2)  # Over budget
        elif scenario == 'security_focus':
            template['spend_multiplier'] *= 1.3  # Higher security spend
        elif scenario == 'compliance_audit':
            template['compliance'].append('Under Audit')
        
        return {
            'company_info': self._generate_company_info(params, industry),
            'vendor_metrics': self._generate_vendor_metrics(params, template),
            'application_portfolio': self._generate_application_portfolio(params, template),
            'cost_analytics': self._generate_cost_analytics(params, template, scenario),
            'compliance_status': self._generate_compliance_status(template, scenario),
            'security_posture': self._generate_security_posture(scenario),
            'performance_metrics': self._generate_performance_metrics(),
            'executive_insights': self._generate_executive_insights(params, scenario),
            'recommendations': self._generate_recommendations(scenario),
            'forecast': self._generate_forecast(params)
        }
    
    def _generate_company_info(self, params: Dict, industry: str) -> Dict:
        """Generate company information"""
        return {
            'name': self.customer_name,
            'industry': industry,
            'employees': params['employees'],
            'annual_revenue': params['employees'] * random.randint(100000, 500000),
            'it_budget': params['it_budget'],
            'it_staff': int(params['employees'] * 0.05),
            'locations': random.randint(1, 20),
            'founded': 2024 - random.randint(5, 50),
            'fiscal_year_end': 'December 31',
            'primary_contact': {
                'name': fake.name(),
                'title': 'CIO',
                'email': fake.corporate_email(),
                'phone': fake.phone_number()
            }
        }
    
    def _generate_vendor_metrics(self, params: Dict, template: Dict) -> Dict:
        """Generate vendor metrics data"""
        vendor_count = params['vendors']
        total_spend = params['it_budget'] * template['spend_multiplier']
        
        # Generate top vendors
        top_vendors = []
        remaining_spend = total_spend
        
        # Use template vendors for top spots
        for i, vendor_name in enumerate(template['vendor_focus'][:5]):
            spend = remaining_spend * random.uniform(0.15, 0.25) if i < 3 else remaining_spend * random.uniform(0.05, 0.15)
            change = random.uniform(-10, 20)
            
            top_vendors.append({
                'id': f'vendor_{i+1}',
                'name': vendor_name,
                'spend': int(spend),
                'change': round(change, 1),
                'contract_end': (datetime.now() + timedelta(days=random.randint(30, 730))).strftime('%Y-%m-%d'),
                'risk_score': random.randint(1, 100),
                'performance_score': random.randint(60, 100),
                'category': random.choice(['Software', 'Cloud', 'Services', 'Hardware'])
            })
            remaining_spend -= spend
        
        # Add more vendors
        generic_vendors = ['IBM', 'Cisco', 'Dell', 'HP', 'VMware', 'Splunk', 'ServiceNow', 'Workday', 'Zoom', 'Slack']
        for vendor in generic_vendors[:min(5, vendor_count - 5)]:
            if vendor not in [v['name'] for v in top_vendors]:
                spend = remaining_spend * random.uniform(0.01, 0.05)
                top_vendors.append({
                    'id': f'vendor_{len(top_vendors)+1}',
                    'name': vendor,
                    'spend': int(spend),
                    'change': round(random.uniform(-5, 15), 1),
                    'contract_end': (datetime.now() + timedelta(days=random.randint(30, 730))).strftime('%Y-%m-%d'),
                    'risk_score': random.randint(1, 100),
                    'performance_score': random.randint(60, 100),
                    'category': random.choice(['Software', 'Cloud', 'Services', 'Hardware'])
                })
                remaining_spend -= spend
        
        # Category breakdown
        categories = {
            'Cloud Infrastructure': total_spend * 0.35,
            'Software Licenses': total_spend * 0.25,
            'Professional Services': total_spend * 0.15,
            'Security Tools': total_spend * 0.15,
            'Hardware': total_spend * 0.10
        }
        
        return {
            'total_spend': int(total_spend),
            'vendor_count': vendor_count,
            'top_vendors': sorted(top_vendors, key=lambda x: x['spend'], reverse=True)[:10],
            'spend_by_category': [
                {'category': cat, 'amount': int(amount), 'percentage': round(amount/total_spend*100, 1)}
                for cat, amount in categories.items()
            ],
            'contracts_expiring_90d': random.randint(5, 25),
            'at_risk_spend': int(total_spend * random.uniform(0.05, 0.15)),
            'optimization_opportunities': int(total_spend * random.uniform(0.08, 0.20)),
            'vendor_consolidation_opportunities': random.randint(3, 15),
            'spend_trend': self._generate_trend_data(12, total_spend/12, 0.1)
        }
    
    def _generate_application_portfolio(self, params: Dict, template: Dict) -> Dict:
        """Generate application portfolio data"""
        total_apps = params['applications']
        
        # Generate critical applications
        critical_apps = []
        for i, app_name in enumerate(template['app_focus']):
            critical_apps.append({
                'id': f'app_{i+1}',
                'name': app_name,
                'criticality': 'Critical',
                'users': random.randint(100, params['employees']),
                'health_score': random.randint(70, 100),
                'technical_debt': random.randint(50000, 500000),
                'last_updated': (datetime.now() - timedelta(days=random.randint(1, 365))).strftime('%Y-%m-%d'),
                'vendor': random.choice(template['vendor_focus']),
                'monthly_cost': random.randint(5000, 50000),
                'compliance_status': random.choice(['Compliant', 'Compliant', 'At Risk']),
                'performance_score': random.randint(60, 100),
                'security_score': random.randint(70, 100),
                'integration_count': random.randint(2, 20)
            })
        
        # Add more applications
        app_names = [
            'HR Management System', 'Finance Platform', 'Analytics Dashboard',
            'Customer Portal', 'Vendor Portal', 'Mobile App', 'Data Warehouse',
            'Reporting Tool', 'Collaboration Suite', 'Project Management'
        ]
        
        for app in app_names[:min(10, total_apps - len(critical_apps))]:
            critical_apps.append({
                'id': f'app_{len(critical_apps)+1}',
                'name': app,
                'criticality': random.choice(['Critical', 'High', 'Medium', 'Low']),
                'users': random.randint(10, params['employees']//2),
                'health_score': random.randint(60, 100),
                'technical_debt': random.randint(10000, 200000),
                'last_updated': (datetime.now() - timedelta(days=random.randint(1, 730))).strftime('%Y-%m-%d'),
                'vendor': random.choice(['Microsoft', 'Oracle', 'SAP', 'Custom', 'Open Source']),
                'monthly_cost': random.randint(1000, 30000),
                'compliance_status': random.choice(['Compliant', 'Compliant', 'At Risk', 'Non-Compliant']),
                'performance_score': random.randint(50, 100),
                'security_score': random.randint(60, 100),
                'integration_count': random.randint(1, 10)
            })
        
        # Calculate metrics
        total_technical_debt = sum(app['technical_debt'] for app in critical_apps)
        avg_health = sum(app['health_score'] for app in critical_apps) / len(critical_apps)
        
        return {
            'total_applications': total_apps,
            'critical_applications': len([a for a in critical_apps if a['criticality'] == 'Critical']),
            'applications': critical_apps[:20],
            'by_status': {
                'Active': int(total_apps * 0.75),
                'Deprecated': int(total_apps * 0.10),
                'Planned': int(total_apps * 0.10),
                'Retired': int(total_apps * 0.05)
            },
            'by_criticality': {
                'Critical': int(total_apps * 0.15),
                'High': int(total_apps * 0.25),
                'Medium': int(total_apps * 0.40),
                'Low': int(total_apps * 0.20)
            },
            'technical_debt': total_technical_debt,
            'average_health_score': round(avg_health, 1),
            'modernization_candidates': random.randint(5, 30),
            'redundant_applications': random.randint(2, 15),
            'unsupported_applications': random.randint(1, 10),
            'cloud_migration_candidates': random.randint(10, 50)
        }
    
    def _generate_cost_analytics(self, params: Dict, template: Dict, scenario: str) -> Dict:
        """Generate cost analytics data"""
        monthly_budget = params['it_budget'] / 12
        
        # Generate monthly spend data
        monthly_data = []
        for i in range(12):
            month = (datetime.now() - timedelta(days=30*(11-i))).strftime('%b')
            
            if scenario == 'cost_optimization':
                # Show increasing spend trend
                actual = monthly_budget * random.uniform(1.05, 1.20) * (1 + i*0.01)
            else:
                actual = monthly_budget * random.uniform(0.90, 1.10)
            
            monthly_data.append({
                'month': month,
                'budget': int(monthly_budget),
                'actual': int(actual),
                'forecast': int(actual * random.uniform(0.95, 1.05)),
                'variance': round((actual - monthly_budget) / monthly_budget * 100, 1)
            })
        
        # Department breakdown
        departments = {
            'IT Operations': 0.30,
            'Development': 0.25,
            'Security': 0.15,
            'Data & Analytics': 0.15,
            'Infrastructure': 0.10,
            'Support': 0.05
        }
        
        dept_costs = [
            {
                'department': dept,
                'cost': int(params['it_budget'] * pct),
                'percentage': round(pct * 100, 1),
                'trend': random.choice(['increasing', 'stable', 'decreasing'])
            }
            for dept, pct in departments.items()
        ]
        
        # Cost optimization opportunities
        optimizations = [
            {'category': 'Unused Licenses', 'potential_savings': random.randint(50000, 200000), 'effort': 'Low', 'risk': 'Low'},
            {'category': 'Cloud Right-Sizing', 'potential_savings': random.randint(100000, 500000), 'effort': 'Medium', 'risk': 'Low'},
            {'category': 'Reserved Instances', 'potential_savings': random.randint(150000, 400000), 'effort': 'Low', 'risk': 'Low'},
            {'category': 'Vendor Consolidation', 'potential_savings': random.randint(75000, 300000), 'effort': 'High', 'risk': 'Medium'},
            {'category': 'License Optimization', 'potential_savings': random.randint(80000, 250000), 'effort': 'Medium', 'risk': 'Low'},
            {'category': 'Contract Renegotiation', 'potential_savings': random.randint(100000, 350000), 'effort': 'Medium', 'risk': 'Low'}
        ]
        
        if scenario == 'cost_optimization':
            # Add more urgent optimizations
            optimizations.extend([
                {'category': 'Duplicate Services', 'potential_savings': random.randint(200000, 500000), 'effort': 'High', 'risk': 'Medium'},
                {'category': 'Legacy System Retirement', 'potential_savings': random.randint(300000, 800000), 'effort': 'High', 'risk': 'High'}
            ])
        
        return {
            'annual_budget': params['it_budget'],
            'ytd_spend': int(sum(m['actual'] for m in monthly_data[:datetime.now().month])),
            'projected_annual': int(sum(m['actual'] for m in monthly_data)),
            'monthly_data': monthly_data,
            'by_department': dept_costs,
            'by_type': [
                {'type': 'OpEx', 'amount': int(params['it_budget'] * 0.70), 'percentage': 70},
                {'type': 'CapEx', 'amount': int(params['it_budget'] * 0.30), 'percentage': 30}
            ],
            'optimization_opportunities': sorted(optimizations, key=lambda x: x['potential_savings'], reverse=True),
            'total_savings_identified': sum(opt['potential_savings'] for opt in optimizations),
            'cost_per_employee': int(params['it_budget'] / params['employees']),
            'budget_utilization': round(sum(m['actual'] for m in monthly_data) / params['it_budget'] * 100, 1),
            'forecast_accuracy': random.randint(85, 95)
        }
    
    def _generate_compliance_status(self, template: Dict, scenario: str) -> Dict:
        """Generate compliance status data"""
        frameworks = []
        
        for framework in template['compliance']:
            if scenario == 'compliance_audit' and framework == template['compliance'][0]:
                # First framework under audit
                score = random.randint(65, 80)
                status = 'Under Audit'
                risk = 'High'
            else:
                score = random.randint(75, 98)
                status = 'Compliant' if score >= 80 else 'At Risk'
                risk = 'Low' if score >= 90 else 'Medium' if score >= 80 else 'High'
            
            frameworks.append({
                'framework': framework,
                'score': score,
                'status': status,
                'risk_level': risk,
                'last_audit': (datetime.now() - timedelta(days=random.randint(30, 365))).strftime('%Y-%m-%d'),
                'next_audit': (datetime.now() + timedelta(days=random.randint(30, 365))).strftime('%Y-%m-%d'),
                'open_findings': random.randint(0, 20) if status != 'Compliant' else 0,
                'critical_findings': random.randint(0, 5) if status == 'At Risk' else 0,
                'controls_tested': random.randint(50, 200),
                'controls_passed': random.randint(40, 190)
            })
        
        overall_score = sum(f['score'] for f in frameworks) / len(frameworks)
        
        # Generate audit findings
        findings = []
        finding_categories = ['Access Control', 'Data Protection', 'Network Security', 'Incident Response', 'Asset Management']
        
        for cat in finding_categories:
            findings.append({
                'category': cat,
                'total': random.randint(2, 15),
                'critical': random.randint(0, 2),
                'high': random.randint(0, 5),
                'medium': random.randint(1, 5),
                'low': random.randint(1, 8)
            })
        
        return {
            'overall_score': round(overall_score, 1),
            'overall_status': 'Compliant' if overall_score >= 80 else 'At Risk',
            'frameworks': frameworks,
            'findings_by_category': findings,
            'total_findings': sum(f['total'] for f in findings),
            'remediation_in_progress': random.randint(5, 30),
            'average_remediation_time': random.randint(5, 30),
            'compliance_trend': self._generate_trend_data(12, overall_score, 5),
            'upcoming_audits': random.randint(1, 5),
            'regulatory_changes': random.randint(2, 8)
        }
    
    def _generate_security_posture(self, scenario: str) -> Dict:
        """Generate security posture data"""
        if scenario == 'security_focus':
            base_score = random.randint(70, 85)
            vulnerabilities_multiplier = 1.5
        else:
            base_score = random.randint(75, 92)
            vulnerabilities_multiplier = 1.0
        
        vulnerabilities = {
            'critical': int(random.randint(0, 5) * vulnerabilities_multiplier),
            'high': int(random.randint(5, 20) * vulnerabilities_multiplier),
            'medium': int(random.randint(20, 50) * vulnerabilities_multiplier),
            'low': int(random.randint(50, 150) * vulnerabilities_multiplier)
        }
        
        # Threat intelligence
        threats = []
        threat_types = ['Phishing', 'Malware', 'Ransomware', 'DDoS', 'Insider Threat', 'APT', 'Zero-Day']
        
        for threat in threat_types[:random.randint(3, 6)]:
            threats.append({
                'type': threat,
                'severity': random.choice(['Critical', 'High', 'Medium']),
                'status': random.choice(['Mitigated', 'Monitoring', 'Active']),
                'first_seen': (datetime.now() - timedelta(days=random.randint(1, 90))).strftime('%Y-%m-%d'),
                'incidents': random.randint(0, 20)
            })
        
        return {
            'security_score': base_score,
            'maturity_level': self._get_maturity_level(base_score),
            'vulnerabilities': vulnerabilities,
            'total_vulnerabilities': sum(vulnerabilities.values()),
            'patch_compliance': random.randint(85, 98),
            'endpoint_compliance': random.randint(80, 95),
            'mfa_adoption': random.randint(60, 95),
            'privileged_accounts': random.randint(50, 200),
            'security_training_completion': random.randint(70, 95),
            'incidents_last_30d': random.randint(5, 50),
            'mean_time_to_detect': random.randint(1, 48),
            'mean_time_to_respond': random.randint(1, 24),
            'threats_detected': threats,
            'security_tools': random.randint(10, 30),
            'siem_events_daily': random.randint(100000, 1000000),
            'false_positive_rate': random.randint(5, 25),
            'security_budget_percentage': random.randint(8, 15)
        }
    
    def _generate_performance_metrics(self) -> Dict:
        """Generate IT performance metrics"""
        return {
            'system_availability': round(random.uniform(99.5, 99.99), 2),
            'average_response_time': random.randint(50, 500),
            'peak_response_time': random.randint(200, 2000),
            'error_rate': round(random.uniform(0.01, 0.5), 2),
            'successful_deployments': random.randint(80, 99),
            'failed_deployments': random.randint(1, 10),
            'rollback_rate': round(random.uniform(1, 10), 1),
            'ticket_volume': random.randint(500, 5000),
            'ticket_resolution_time': random.randint(2, 48),
            'first_call_resolution': random.randint(60, 85),
            'user_satisfaction': round(random.uniform(3.5, 4.8), 1),
            'sla_compliance': random.randint(90, 99),
            'api_calls_daily': random.randint(100000, 10000000),
            'data_processed_gb': random.randint(100, 10000),
            'concurrent_users': random.randint(100, 10000),
            'infrastructure_utilization': {
                'compute': random.randint(40, 80),
                'storage': random.randint(50, 85),
                'network': random.randint(30, 70),
                'database': random.randint(45, 75)
            }
        }
    
    def _generate_executive_insights(self, params: Dict, scenario: str) -> Dict:
        """Generate executive insights and KPIs"""
        insights = []
        
        if scenario == 'cost_optimization':
            insights.extend([
                {'type': 'warning', 'message': 'IT spend is 15% over budget YTD', 'impact': 'high'},
                {'type': 'opportunity', 'message': f'${random.randint(500000, 2000000):,} in cost savings identified', 'impact': 'high'},
                {'type': 'risk', 'message': '23 vendor contracts expiring in next 90 days', 'impact': 'medium'}
            ])
        elif scenario == 'security_focus':
            insights.extend([
                {'type': 'risk', 'message': 'Critical vulnerabilities increased by 25%', 'impact': 'high'},
                {'type': 'warning', 'message': 'Security training completion below target', 'impact': 'medium'},
                {'type': 'success', 'message': 'Zero-day threat successfully mitigated', 'impact': 'high'}
            ])
        elif scenario == 'compliance_audit':
            insights.extend([
                {'type': 'warning', 'message': 'Compliance audit findings require immediate attention', 'impact': 'high'},
                {'type': 'risk', 'message': '15 critical compliance gaps identified', 'impact': 'high'},
                {'type': 'info', 'message': 'Regulatory changes require policy updates', 'impact': 'medium'}
            ])
        else:
            insights.extend([
                {'type': 'success', 'message': 'System availability exceeds 99.9% SLA', 'impact': 'low'},
                {'type': 'opportunity', 'message': '35% of applications are modernization candidates', 'impact': 'medium'},
                {'type': 'info', 'message': 'Digital transformation initiatives on track', 'impact': 'low'}
            ])
        
        # Add common insights
        insights.extend([
            {'type': 'metric', 'message': f"IT spend per employee: ${params['it_budget']//params['employees']:,}", 'impact': 'low'},
            {'type': 'metric', 'message': f"Active vendors: {params['vendors']}", 'impact': 'low'},
            {'type': 'trend', 'message': 'Cloud adoption increased by 22% YoY', 'impact': 'medium'}
        ])
        
        return {
            'insights': insights,
            'kpis': {
                'it_budget_utilization': random.randint(85, 115),
                'project_success_rate': random.randint(70, 95),
                'innovation_index': random.randint(60, 85),
                'operational_efficiency': random.randint(65, 90),
                'risk_score': random.randint(30, 70),
                'digital_maturity': random.randint(50, 80)
            },
            'strategic_initiatives': [
                {'name': 'Cloud Migration', 'status': 'In Progress', 'completion': random.randint(20, 80)},
                {'name': 'Zero Trust Security', 'status': 'Planning', 'completion': random.randint(5, 30)},
                {'name': 'Application Modernization', 'status': 'In Progress', 'completion': random.randint(10, 60)},
                {'name': 'Data Analytics Platform', 'status': 'In Progress', 'completion': random.randint(40, 90)},
                {'name': 'Process Automation', 'status': 'Pilot', 'completion': random.randint(15, 45)}
            ]
        }
    
    def _generate_recommendations(self, scenario: str) -> List[Dict]:
        """Generate actionable recommendations"""
        recommendations = []
        
        if scenario == 'cost_optimization':
            recommendations = [
                {
                    'priority': 'Critical',
                    'category': 'Cost',
                    'title': 'Implement FinOps Framework',
                    'description': 'Establish cloud financial management practices to control spending',
                    'impact': 'Save $2M annually',
                    'effort': 'High',
                    'timeline': '3-6 months'
                },
                {
                    'priority': 'High',
                    'category': 'Cost',
                    'title': 'Optimize Cloud Resources',
                    'description': 'Right-size instances and implement auto-scaling',
                    'impact': 'Save $500K annually',
                    'effort': 'Medium',
                    'timeline': '1-2 months'
                },
                {
                    'priority': 'High',
                    'category': 'Vendor',
                    'title': 'Consolidate Vendor Contracts',
                    'description': 'Merge redundant services and renegotiate terms',
                    'impact': 'Save $750K annually',
                    'effort': 'Medium',
                    'timeline': '2-3 months'
                }
            ]
        elif scenario == 'security_focus':
            recommendations = [
                {
                    'priority': 'Critical',
                    'category': 'Security',
                    'title': 'Patch Critical Vulnerabilities',
                    'description': 'Address 5 critical security vulnerabilities immediately',
                    'impact': 'Reduce risk by 40%',
                    'effort': 'Low',
                    'timeline': '1 week'
                },
                {
                    'priority': 'High',
                    'category': 'Security',
                    'title': 'Implement Zero Trust Architecture',
                    'description': 'Deploy identity-based security model',
                    'impact': 'Reduce breach risk by 60%',
                    'effort': 'High',
                    'timeline': '6-12 months'
                },
                {
                    'priority': 'High',
                    'category': 'Security',
                    'title': 'Enhance Security Training',
                    'description': 'Mandatory security awareness for all employees',
                    'impact': 'Reduce phishing success by 70%',
                    'effort': 'Low',
                    'timeline': '1 month'
                }
            ]
        elif scenario == 'compliance_audit':
            recommendations = [
                {
                    'priority': 'Critical',
                    'category': 'Compliance',
                    'title': 'Address Audit Findings',
                    'description': 'Remediate 15 critical compliance gaps',
                    'impact': 'Achieve compliance certification',
                    'effort': 'High',
                    'timeline': '2-3 months'
                },
                {
                    'priority': 'High',
                    'category': 'Compliance',
                    'title': 'Update Data Governance',
                    'description': 'Implement data classification and handling procedures',
                    'impact': 'Meet regulatory requirements',
                    'effort': 'Medium',
                    'timeline': '1-2 months'
                },
                {
                    'priority': 'Medium',
                    'category': 'Process',
                    'title': 'Automate Compliance Reporting',
                    'description': 'Deploy automated compliance monitoring',
                    'impact': 'Reduce audit prep by 50%',
                    'effort': 'Medium',
                    'timeline': '3-4 months'
                }
            ]
        else:
            recommendations = [
                {
                    'priority': 'High',
                    'category': 'Modernization',
                    'title': 'Modernize Legacy Applications',
                    'description': 'Migrate 10 critical legacy apps to cloud-native',
                    'impact': 'Improve agility by 40%',
                    'effort': 'High',
                    'timeline': '6-9 months'
                },
                {
                    'priority': 'Medium',
                    'category': 'Efficiency',
                    'title': 'Implement AIOps Platform',
                    'description': 'Deploy AI-driven IT operations management',
                    'impact': 'Reduce incidents by 30%',
                    'effort': 'Medium',
                    'timeline': '3-4 months'
                },
                {
                    'priority': 'Medium',
                    'category': 'Innovation',
                    'title': 'Establish Innovation Lab',
                    'description': 'Create dedicated team for emerging tech evaluation',
                    'impact': 'Accelerate digital transformation',
                    'effort': 'Medium',
                    'timeline': '2-3 months'
                }
            ]
        
        # Add common recommendations
        recommendations.extend([
            {
                'priority': 'Low',
                'category': 'Governance',
                'title': 'Enhance IT Governance',
                'description': 'Strengthen IT steering committee and decision framework',
                'impact': 'Improve alignment with business',
                'effort': 'Low',
                'timeline': '1 month'
            }
        ])
        
        return sorted(recommendations, key=lambda x: {'Critical': 0, 'High': 1, 'Medium': 2, 'Low': 3}[x['priority']])
    
    def _generate_forecast(self, params: Dict) -> Dict:
        """Generate forecast data"""
        return {
            'spend_forecast': {
                'next_quarter': int(params['it_budget'] * 0.25 * random.uniform(0.95, 1.10)),
                'next_year': int(params['it_budget'] * random.uniform(1.02, 1.15)),
                'confidence': random.randint(75, 90)
            },
            'growth_projections': {
                'applications': random.randint(5, 20),
                'vendors': random.randint(-5, 10),
                'cloud_adoption': random.randint(15, 35),
                'automation': random.randint(20, 40)
            },
            'risk_forecast': {
                'security_incidents': random.randint(10, 50),
                'compliance_issues': random.randint(2, 10),
                'vendor_risks': random.randint(3, 15),
                'technical_debt_growth': random.randint(5, 25)
            },
            'opportunity_pipeline': {
                'cost_savings': int(params['it_budget'] * random.uniform(0.08, 0.20)),
                'efficiency_gains': random.randint(10, 30),
                'innovation_projects': random.randint(5, 20)
            }
        }
    
    def _generate_trend_data(self, points: int, base_value: float, variance: float) -> List[Dict]:
        """Generate trend data points"""
        trend = []
        current = base_value
        
        for i in range(points):
            date = (datetime.now() - timedelta(days=(points-i)*30)).strftime('%Y-%m-%d')
            current = current * random.uniform(1-variance/100, 1+variance/100)
            trend.append({
                'date': date,
                'value': round(current, 2)
            })
        
        return trend
    
    def _get_maturity_level(self, score: int) -> str:
        """Get maturity level from score"""
        if score >= 90:
            return 'Optimized'
        elif score >= 80:
            return 'Managed'
        elif score >= 70:
            return 'Defined'
        elif score >= 60:
            return 'Developing'
        else:
            return 'Initial'
    
    def generate_demo_credentials(self) -> Dict:
        """Generate demo credentials for testing"""
        return {
            'snowflake': {
                'account': 'demo_account',
                'username': 'demo_user',
                'password': 'Demo123!@#',
                'warehouse': 'DEMO_WH',
                'database': 'DEMO_DB',
                'schema': 'PUBLIC',
                'role': 'DEMO_ROLE'
            },
            'azure': {
                'tenant_id': fake.uuid4(),
                'client_id': fake.uuid4(),
                'client_secret': fake.uuid4(),
                'subscription_id': fake.uuid4()
            },
            'servicenow': {
                'instance_url': 'https://demo.service-now.com',
                'username': 'demo.user',
                'password': 'Demo123!@#'
            }
        }
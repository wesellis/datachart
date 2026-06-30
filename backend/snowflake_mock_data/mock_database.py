"""
Mock Snowflake Database for Hubbell Incorporated
Provides realistic data that matches the expected Snowflake schema
"""

import random
from datetime import datetime, timedelta
from typing import Dict, List, Any
from .hubbell_applications import ALL_HUBBELL_APPS
from .hubbell_transactions import HUBBELL_TRANSACTIONS
from .hubbell_compliance import HUBBELL_COMPLIANCE

class HubbellMockDatabase:
    """Mock database that simulates Snowflake responses for Hubbell"""
    
    def __init__(self):
        self.applications = ALL_HUBBELL_APPS
        self.transactions = HUBBELL_TRANSACTIONS
        self.compliance = HUBBELL_COMPLIANCE
        
    def query_vendor_spend(self, date_range: Dict = None) -> Dict[str, Any]:
        """Mock vendor spend query matching Snowflake service expectations"""
        
        # Filter transactions by date range if provided
        filtered_transactions = self.transactions
        if date_range:
            start_date = datetime.strptime(date_range.get('start_date', '2023-01-01'), '%Y-%m-%d')
            end_date = datetime.strptime(date_range.get('end_date', '2024-12-31'), '%Y-%m-%d')
            
            filtered_transactions = [
                t for t in self.transactions 
                if start_date <= datetime.strptime(t['transaction_date'], '%Y-%m-%d') <= end_date
            ]
        
        # Aggregate by vendor
        vendor_totals = {}
        for transaction in filtered_transactions:
            vendor = transaction['vendor_name']
            if vendor not in vendor_totals:
                vendor_totals[vendor] = {
                    'vendor_name': vendor,
                    'total_spend': 0,
                    'app_count': set(),
                    'contract_count': set(),
                    'transactions': []
                }
            
            vendor_totals[vendor]['total_spend'] += transaction['amount']
            vendor_totals[vendor]['app_count'].add(transaction['application_id'])
            vendor_totals[vendor]['contract_count'].add(transaction['contract_id'])
            vendor_totals[vendor]['transactions'].append(transaction)
        
        # Convert to list format expected by dashboard
        vendors = []
        for vendor_data in vendor_totals.values():
            vendor_info = {
                'vendor_name': vendor_data['vendor_name'],
                'total_spend': round(vendor_data['total_spend'], 2),
                'app_count': len(vendor_data['app_count']),
                'contract_count': len(vendor_data['contract_count']),
                'avg_transaction': round(vendor_data['total_spend'] / len(vendor_data['transactions']), 2),
                'month': None  # Aggregate across all months
            }
            vendors.append(vendor_info)
        
        # Sort by spend and return top vendors
        vendors.sort(key=lambda x: x['total_spend'], reverse=True)
        
        return {
            'success': True,
            'data': {
                'vendors': vendors[:10],  # Top 10 vendors
                'total_spend': sum(v['total_spend'] for v in vendors),
                'vendor_count': len(vendors),
                'query_timestamp': datetime.utcnow().isoformat()
            }
        }
    
    def query_application_metrics(self) -> Dict[str, Any]:
        """Mock application metrics query"""
        
        active_apps = [app for app in self.applications if app['status'] == 'Active']
        compliant_apps = [app for app in self.applications if app['compliance_status'] == 'Compliant']
        
        total_annual_cost = sum(app['annual_cost'] for app in self.applications)
        avg_health_score = sum(app['health_score'] for app in self.applications) / len(self.applications)
        
        return {
            'success': True,
            'data': {
                'total_applications': len(self.applications),
                'total_vendors': len(set(app['vendor'] for app in self.applications)),
                'active_applications': len(active_apps),
                'compliant_applications': len(compliant_apps),
                'avg_health_score': round(avg_health_score, 1),
                'total_annual_cost': total_annual_cost,
                'compliance_rate': round(len(compliant_apps) / len(self.applications) * 100, 1),
                'query_timestamp': datetime.utcnow().isoformat()
            }
        }
    
    def query_cost_trends(self, months: int = 12) -> Dict[str, Any]:
        """Mock cost trends query"""
        
        # Group transactions by month
        monthly_data = {}
        
        for transaction in self.transactions:
            trans_date = datetime.strptime(transaction['transaction_date'], '%Y-%m-%d')
            month_key = trans_date.strftime('%Y-%m')
            
            if month_key not in monthly_data:
                monthly_data[month_key] = {
                    'month': month_key,
                    'monthly_spend': 0,
                    'vendor_count': set(),
                    'app_count': set(),
                    'transactions': []
                }
            
            monthly_data[month_key]['monthly_spend'] += transaction['amount']
            monthly_data[month_key]['vendor_count'].add(transaction['vendor_name'])
            monthly_data[month_key]['app_count'].add(transaction['application_id'])
            monthly_data[month_key]['transactions'].append(transaction)
        
        # Convert to list and sort by date
        trends = []
        for month_data in monthly_data.values():
            trend_data = {
                'month': month_data['month'],
                'monthly_spend': round(month_data['monthly_spend'], 2),
                'vendor_count': len(month_data['vendor_count']),
                'app_count': len(month_data['app_count']),
                'avg_transaction': round(month_data['monthly_spend'] / len(month_data['transactions']), 2)
            }
            trends.append(trend_data)
        
        # Sort by month (most recent first)
        trends.sort(key=lambda x: x['month'], reverse=True)
        trends = trends[:months]
        
        # Calculate trend percentage
        if len(trends) >= 2:
            current_spend = trends[0]['monthly_spend']
            previous_spend = trends[1]['monthly_spend']
            trend_percentage = ((current_spend - previous_spend) / previous_spend * 100) if previous_spend else 0
        else:
            trend_percentage = 0
        
        return {
            'success': True,
            'data': {
                'trends': trends,
                'current_month_spend': trends[0]['monthly_spend'] if trends else 0,
                'trend_percentage': round(trend_percentage, 1),
                'total_period_spend': sum(t['monthly_spend'] for t in trends),
                'query_timestamp': datetime.utcnow().isoformat()
            }
        }
    
    def query_compliance_metrics(self) -> Dict[str, Any]:
        """Mock compliance metrics query"""
        
        # Group by compliance category
        categories = {}
        for comp in self.compliance:
            cat = comp['compliance_category']
            if cat not in categories:
                categories[cat] = {
                    'category': cat,
                    'assessments': [],
                    'total_score': 0,
                    'app_count': 0,
                    'high_compliance': 0,
                    'low_compliance': 0
                }
            
            categories[cat]['assessments'].append(comp)
            categories[cat]['total_score'] += comp['compliance_score']
            categories[cat]['app_count'] += 1
            
            if comp['compliance_score'] >= 90:
                categories[cat]['high_compliance'] += 1
            elif comp['compliance_score'] < 70:
                categories[cat]['low_compliance'] += 1
        
        # Calculate averages
        category_data = []
        total_score = 0
        total_apps = 0
        high_risk_apps = 0
        
        for cat_data in categories.values():
            avg_score = cat_data['total_score'] / cat_data['app_count']
            category_info = {
                'category': cat_data['category'],
                'app_count': cat_data['app_count'],
                'avg_score': round(avg_score, 1),
                'high_compliance': cat_data['high_compliance'],
                'low_compliance': cat_data['low_compliance']
            }
            category_data.append(category_info)
            
            total_score += cat_data['total_score']
            total_apps += cat_data['app_count']
            high_risk_apps += cat_data['low_compliance']
        
        overall_score = total_score / total_apps if total_apps else 0
        
        return {
            'success': True,
            'data': {
                'categories': category_data,
                'overall_compliance_score': round(overall_score, 1),
                'total_assessed_apps': total_apps,
                'high_risk_apps': high_risk_apps,
                'query_timestamp': datetime.utcnow().isoformat()
            }
        }
    
    def get_summary_stats(self) -> Dict[str, Any]:
        """Get summary statistics for the mock database"""
        
        return {
            'total_applications': len(self.applications),
            'total_transactions': len(self.transactions),
            'total_compliance_records': len(self.compliance),
            'total_annual_spend': sum(app['annual_cost'] for app in self.applications),
            'unique_vendors': len(set(app['vendor'] for app in self.applications)),
            'date_range': {
                'start': min(t['transaction_date'] for t in self.transactions),
                'end': max(t['transaction_date'] for t in self.transactions)
            }
        }

# Global instance for use in Snowflake service
hubbell_mock_db = HubbellMockDatabase()

# Print summary when imported
stats = hubbell_mock_db.get_summary_stats()
print(f"\n🏢 Hubbell Incorporated Mock Database Loaded")
print(f"📊 {stats['total_applications']} applications, {stats['unique_vendors']} vendors")
print(f"💰 ${stats['total_annual_spend']:,.2f} total annual spend")
print(f"📈 {stats['total_transactions']} transactions from {stats['date_range']['start']} to {stats['date_range']['end']}")
print(f"✅ {stats['total_compliance_records']} compliance assessments")
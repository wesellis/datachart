"""
APM Service Layer - Business logic for Application Portfolio Management
"""
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import random
import hashlib
import json
from app.schemas.apm_schemas import (
    Application, DashboardMetrics, ViewType, 
    RiskLevel, PatchStatus, ComplianceStatus,
    VendorSummary, MonthlyTrend, ApplicationFilter
)
from app.core.cache import CacheManager


class APMService:
    """Service class for APM operations"""
    
    def __init__(self):
        self.cache = CacheManager()
        self._cache_ttl = 300  # 5 minutes
    
    def get_dashboard_metrics(self, view_type: ViewType = ViewType.OVERVIEW) -> DashboardMetrics:
        """Get dashboard metrics based on view type"""
        # Try to get from cache first
        cache_key = f"dashboard_metrics:{view_type.value}"
        cached_metrics = self.cache.get(cache_key)
        
        if cached_metrics:
            return DashboardMetrics(**cached_metrics)
        
        # Generate metrics if not cached
        applications = self._get_applications()
        
        # Filter applications based on view type
        filtered_apps = self._filter_by_view(applications, view_type)
        
        # Calculate metrics
        metrics = self._calculate_metrics(filtered_apps)
        
        # Cache the results
        self.cache.set(cache_key, metrics, ttl=self._cache_ttl)
        
        return DashboardMetrics(**metrics)
    
    def get_applications(
        self, 
        limit: int = 50, 
        offset: int = 0,
        filters: Optional[ApplicationFilter] = None
    ) -> List[Application]:
        """Get filtered and paginated applications"""
        # Create cache key from parameters
        filter_hash = hashlib.md5(
            json.dumps(filters.dict() if filters else {}, sort_keys=True).encode()
        ).hexdigest()
        cache_key = f"applications:filtered:{filter_hash}:{limit}:{offset}"
        
        # Try to get from cache
        cached_result = self.cache.get(cache_key)
        if cached_result:
            return [Application(**app) for app in cached_result]
        
        # Get all applications
        apps = self._get_applications()
        
        if filters:
            apps = self._apply_filters(apps, filters)
        
        # Sort by cost (highest first)
        apps.sort(key=lambda x: x['cost_2025'], reverse=True)
        
        # Paginate
        paginated = apps[offset:offset + limit]
        
        # Cache the results
        self.cache.set(cache_key, paginated, ttl=self._cache_ttl)
        
        return [Application(**app) for app in paginated]
    
    def _get_applications(self) -> List[Dict[str, Any]]:
        """Get or generate applications data with caching"""
        cache_key = "applications:all"
        cached_apps = self.cache.get(cache_key)
        
        if cached_apps:
            return cached_apps
        
        # Generate new data if not cached
        applications = self._generate_applications()
        
        # Cache the results
        self.cache.set(cache_key, applications, ttl=self._cache_ttl)
        
        return applications
    
    def _generate_applications(self) -> List[Dict[str, Any]]:
        """Generate mock application data"""
        vendors = [
            "Microsoft", "Oracle", "SAP", "Salesforce", "Adobe",
            "IBM", "VMware", "ServiceNow", "Workday", "Atlassian",
            "Zoom", "Slack", "AWS", "Google", "Cisco"
        ]
        
        departments = ["IT", "Finance", "HR", "Sales", "Marketing", "Operations", "Engineering"]
        owners = [
            ("John Smith", "john.smith@DataChart.com"),
            ("Sarah Johnson", "sarah.johnson@DataChart.com"),
            ("Mike Davis", "mike.davis@DataChart.com"),
            ("Emily Wilson", "emily.wilson@DataChart.com"),
            ("David Brown", "david.brown@DataChart.com")
        ]
        
        applications = []
        for i in range(200):
            vendor = random.choice(vendors)
            owner = random.choice(owners)
            cost_2024 = random.uniform(10000, 500000)
            cost_2025 = cost_2024 * random.uniform(0.9, 1.15)
            
            app = {
                "id": f"app_{i+1:03d}",
                "name": f"{vendor} {random.choice(['Enterprise', 'Professional', 'Standard', 'Cloud', 'Suite'])}",
                "vendor_name": vendor,
                "owner_name": owner[0],
                "owner_email": owner[1],
                "department": random.choice(departments),
                "cost_2024": round(cost_2024, 2),
                "cost_2025": round(cost_2025, 2),
                "utilization_rate": random.randint(30, 100),
                "compliance_status": random.choice(list(ComplianceStatus)),
                "risk_level": random.choice(list(RiskLevel)),
                "patch_status": random.choice(list(PatchStatus)),
                "renewal_date": (datetime.now() + timedelta(days=random.randint(1, 365))).isoformat(),
                "total_licenses": random.randint(10, 500),
                "savings": round(cost_2024 - cost_2025, 2) if cost_2025 < cost_2024 else None
            }
            applications.append(app)
        
        return applications
    
    def _filter_by_view(self, applications: List[Dict], view_type: ViewType) -> List[Dict]:
        """Filter applications based on dashboard view type"""
        if view_type == ViewType.OPTIMIZATION:
            # Focus on cost optimization opportunities
            return [app for app in applications if app['utilization_rate'] < 70 or app.get('savings')]
        
        elif view_type == ViewType.COMPLIANCE:
            # Focus on compliance issues
            return [app for app in applications if app['compliance_status'] != ComplianceStatus.COMPLIANT]
        
        elif view_type == ViewType.PLANNING:
            # Focus on upcoming renewals and planning
            thirty_days = datetime.now() + timedelta(days=30)
            return [app for app in applications 
                   if datetime.fromisoformat(app['renewal_date']) <= thirty_days]
        
        elif view_type == ViewType.OPERATIONS:
            # Focus on operational metrics
            return [app for app in applications 
                   if app['risk_level'] == RiskLevel.HIGH or 
                   app['patch_status'] in [PatchStatus.OUTDATED, PatchStatus.CRITICAL]]
        
        # Default: return all for overview
        return applications
    
    def _apply_filters(self, applications: List[Dict], filters: ApplicationFilter) -> List[Dict]:
        """Apply filters to application list"""
        filtered = applications
        
        if filters.vendor:
            filtered = [a for a in filtered if filters.vendor.lower() in a['vendor_name'].lower()]
        
        if filters.department:
            filtered = [a for a in filtered if filters.department.lower() in a['department'].lower()]
        
        if filters.risk_level:
            filtered = [a for a in filtered if a['risk_level'] == filters.risk_level]
        
        if filters.patch_status:
            filtered = [a for a in filtered if a['patch_status'] == filters.patch_status]
        
        if filters.compliance_status:
            filtered = [a for a in filtered if a['compliance_status'] == filters.compliance_status]
        
        if filters.min_cost:
            filtered = [a for a in filtered if a['cost_2025'] >= filters.min_cost]
        
        if filters.max_cost:
            filtered = [a for a in filtered if a['cost_2025'] <= filters.max_cost]
        
        return filtered
    
    def _calculate_metrics(self, applications: List[Dict]) -> Dict[str, Any]:
        """Calculate dashboard metrics from applications"""
        total_apps = len(applications)
        active_apps = sum(1 for app in applications if app['utilization_rate'] > 20)
        
        total_2024 = sum(app['cost_2024'] for app in applications)
        total_2025 = sum(app['cost_2025'] for app in applications)
        savings = total_2024 - total_2025
        
        # Calculate vendor totals
        vendor_totals = {}
        for app in applications:
            vendor = app['vendor_name']
            if vendor not in vendor_totals:
                vendor_totals[vendor] = {
                    'vendor': vendor,
                    'total_2024': 0,
                    'total_2025': 0,
                    'app_count': 0,
                    'primary_department': app['department']
                }
            vendor_totals[vendor]['total_2024'] += app['cost_2024']
            vendor_totals[vendor]['total_2025'] += app['cost_2025']
            vendor_totals[vendor]['app_count'] += 1
        
        # Generate monthly trend
        monthly_trend = self._generate_monthly_trend(total_2024, total_2025)
        
        # Count risk levels
        high_risk = sum(1 for app in applications if app['risk_level'] == RiskLevel.HIGH)
        medium_risk = sum(1 for app in applications if app['risk_level'] == RiskLevel.MEDIUM)
        low_risk = sum(1 for app in applications if app['risk_level'] == RiskLevel.LOW)
        
        # Count compliance
        compliant = sum(1 for app in applications if app['compliance_status'] == ComplianceStatus.COMPLIANT)
        compliance_rate = (compliant / total_apps * 100) if total_apps > 0 else 0
        
        # Count renewals
        now = datetime.now()
        renewals_30 = sum(1 for app in applications 
                         if (datetime.fromisoformat(app['renewal_date']) - now).days <= 30)
        renewals_60 = sum(1 for app in applications 
                         if (datetime.fromisoformat(app['renewal_date']) - now).days <= 60)
        renewals_90 = sum(1 for app in applications 
                         if (datetime.fromisoformat(app['renewal_date']) - now).days <= 90)
        
        return {
            'total_applications': total_apps,
            'active_applications': active_apps,
            'inactive_applications': total_apps - active_apps,
            'total_spend_2024': round(total_2024, 2),
            'total_spend_2025': round(total_2025, 2),
            'savings_amount': round(savings, 2),
            'savings_percentage': round((savings / total_2024 * 100) if total_2024 > 0 else 0, 2),
            'cost_per_employee': round(total_2025 / 5000, 2),  # Assuming 5000 employees
            'compliance_average': round(compliance_rate, 2),
            'patch_compliance_rate': round(
                sum(1 for app in applications if app['patch_status'] == PatchStatus.UP_TO_DATE) / total_apps * 100
                if total_apps > 0 else 0, 2
            ),
            'renewals_next_30_days': renewals_30,
            'renewals_next_60_days': renewals_60,
            'renewals_next_90_days': renewals_90,
            'renewal_cost_30_days': round(
                sum(app['cost_2025'] for app in applications 
                    if (datetime.fromisoformat(app['renewal_date']) - now).days <= 30), 2
            ),
            'high_risk_apps': high_risk,
            'medium_risk_apps': medium_risk,
            'low_risk_apps': low_risk,
            'average_utilization': round(
                sum(app['utilization_rate'] for app in applications) / total_apps 
                if total_apps > 0 else 0, 2
            ),
            'vendor_count': len(vendor_totals),
            'vendor_totals': vendor_totals,
            'monthly_trend': monthly_trend,
            'applications': applications[:20]  # Top 20 by default
        }
    
    def _generate_monthly_trend(self, total_2024: float, total_2025: float) -> List[Dict]:
        """Generate monthly spending trend"""
        months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        
        trend = []
        for i, month in enumerate(months):
            base_2024 = total_2024 / 12
            base_2025 = total_2025 / 12
            
            # Add some variance
            variance = random.uniform(0.9, 1.1)
            
            trend.append({
                'month': month,
                'spend_2024': round(base_2024 * variance, 2),
                'spend_2025': round(base_2025 * variance, 2) if i < datetime.now().month else None
            })
        
        return trend
    
    def clear_cache(self, pattern: Optional[str] = None):
        """Clear cache entries, optionally matching a pattern"""
        if pattern:
            return self.cache.clear_pattern(pattern)
        else:
            return self.cache.flush_all()
    
    def get_cache_stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        return self.cache.get_stats()


# Singleton instance
apm_service = APMService()
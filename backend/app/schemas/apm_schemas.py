"""
Pydantic schemas for APM data validation and serialization
"""
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Dict, Optional, Any
from datetime import datetime
from enum import Enum


class ViewType(str, Enum):
    """Dashboard view types"""
    OVERVIEW = "overview"
    OPTIMIZATION = "optimization"
    COMPLIANCE = "compliance"
    PLANNING = "planning"
    OPERATIONS = "operations"


class RiskLevel(str, Enum):
    """Application risk levels"""
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class PatchStatus(str, Enum):
    """Patch status types"""
    UP_TO_DATE = "up-to-date"
    PENDING = "pending"
    OUTDATED = "outdated"
    CRITICAL = "critical"


class ComplianceStatus(str, Enum):
    """Compliance status types"""
    COMPLIANT = "Compliant"
    NON_COMPLIANT = "Non-Compliant"
    PARTIALLY_COMPLIANT = "Partially Compliant"


class MonthlyTrend(BaseModel):
    """Monthly spending trend data"""
    month: str
    spend_2024: float
    spend_2025: Optional[float] = None


class Application(BaseModel):
    """Application details schema"""
    id: str
    name: str
    vendor: str = Field(alias="vendor_name")
    owner: str = Field(alias="owner_name")
    owner_email: str
    department: str
    cost_2024: float
    cost_2025: float
    utilization: float = Field(alias="utilization_rate")
    compliance: ComplianceStatus = Field(alias="compliance_status")
    risk_level: RiskLevel
    patch_status: PatchStatus
    renewal_date: datetime
    savings: Optional[float] = None
    licenses: Optional[int] = Field(default=100, alias="total_licenses")
    
    model_config = ConfigDict(populate_by_name=True)


class VendorSummary(BaseModel):
    """Vendor spending summary"""
    vendor: str
    total_2024: float
    total_2025: float
    app_count: int
    primary_department: str
    savings: Optional[float] = None


class DashboardMetrics(BaseModel):
    """Main dashboard metrics"""
    total_applications: int
    active_applications: int
    inactive_applications: int
    total_spend_2024: float
    total_spend_2025: float
    savings_amount: float
    savings_percentage: float
    cost_per_employee: float
    compliance_average: float
    patch_compliance_rate: float
    renewals_next_30_days: int
    renewals_next_60_days: int
    renewals_next_90_days: int
    renewal_cost_30_days: float
    high_risk_apps: int
    medium_risk_apps: int
    low_risk_apps: int
    average_utilization: float
    vendor_count: int
    vendor_totals: Dict[str, VendorSummary]
    monthly_trend: List[MonthlyTrend]
    applications: List[Application]


class ApplicationFilter(BaseModel):
    """Filters for application queries"""
    vendor: Optional[str] = None
    department: Optional[str] = None
    risk_level: Optional[RiskLevel] = None
    patch_status: Optional[PatchStatus] = None
    compliance_status: Optional[ComplianceStatus] = None
    min_cost: Optional[float] = None
    max_cost: Optional[float] = None


class SpendingAnalysis(BaseModel):
    """Spending analysis response"""
    year: int
    total_spend: float
    vendor_breakdown: List[VendorSummary]
    department_breakdown: Dict[str, float]
    monthly_breakdown: List[Dict[str, Any]]
    top_applications: List[Application]


class ComplianceReport(BaseModel):
    """Compliance report schema"""
    overall_compliance_rate: float
    compliant_apps: int
    non_compliant_apps: int
    partially_compliant_apps: int
    by_department: Dict[str, Dict[str, int]]
    critical_violations: List[Dict[str, Any]]
    upcoming_audits: List[Dict[str, Any]]


class ExportRequest(BaseModel):
    """Export request schema"""
    format: str = Field(pattern="^(pdf|excel|csv)$")
    include_charts: bool = True
    include_summary: bool = True
    date_range: Optional[str] = None
    filters: Optional[ApplicationFilter] = None
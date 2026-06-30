import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export interface APMDashboardData {
  total_applications: number;
  active_applications: number;
  inactive_applications: number;
  total_spend_2024: number;
  total_spend_2025: number;
  savings_amount: number;
  savings_percentage: number;
  cost_per_employee: number;
  compliance_average: number;
  patch_compliance_rate: number;
  renewals_next_30_days: number;
  renewals_next_60_days: number;
  renewals_next_90_days: number;
  renewal_cost_30_days: number;
  high_risk_apps: number;
  medium_risk_apps: number;
  low_risk_apps: number;
  average_utilization: number;
  vendor_count: number;
  vendor_totals: Record<string, any>;
  monthly_trend: MonthlyTrend[];
  applications: Application[];
}

export interface MonthlyTrend {
  month: string;
  spend_2024: number;
  spend_2025: number | null;
}

export interface Application {
  id: string;
  name: string;
  vendor_name: string;
  owner_name: string;
  owner_email: string;
  department: string;
  cost_2024: number;
  cost_2025: number;
  monthly_cost: number;
  cost_per_user: number;
  total_licenses: number;
  used_licenses: number;
  utilization_rate: number;
  contract_end: string;
  renewal_date: string;
  days_until_renewal: number;
  auto_renewal: boolean;
  notice_period: number;
  patch_status: string;
  compliance_score: number;
  security_score: number;
  last_update: string;
  risk_level: string;
  business_criticality: string;
}

export interface VendorAnalysis {
  top_vendors: VendorDetail[];
  total_vendors: number;
  total_savings: number;
  average_savings_percentage: number;
  optimization_opportunities: OptimizationOpportunity[];
  vendor_risk_summary: Record<string, any>;
}

export interface VendorDetail {
  name: string;
  total_spend_2024: number;
  total_spend_2025: number;
  application_count: number;
  licenses_total: number;
  licenses_used: number;
  savings: number;
  savings_percentage: number;
  license_utilization: number;
  department_count: number;
  departments: string[];
  risk_levels: {
    High: number;
    Medium: number;
    Low: number;
  };
  applications: any[];
}

export interface OptimizationOpportunity {
  vendor: string;
  opportunity: string;
  current_utilization?: number;
  current_savings?: number;
  potential_savings: number;
  recommendation: string;
}

export interface ComplianceMetrics {
  total_applications: number;
  patch_current: number;
  patch_pending: number;
  patch_overdue: number;
  compliance_percentage: number;
  average_compliance_score: number;
  average_security_score: number;
  critical_issues: Application[];
  department_compliance: Record<string, number>;
  high_risk_apps: Application[];
  recent_updates: Application[];
}

export interface RenewalData {
  total_renewals: number;
  total_renewal_cost: number;
  periods: {
    [key: string]: {
      count: number;
      total_cost: number;
      applications: Application[];
    };
  };
  high_value_renewals: Application[];
  auto_renewals: number;
}

class APMService {
  private axiosInstance = axios.create({
    baseURL: API_BASE,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  async getDashboard(view: string = 'overview'): Promise<APMDashboardData> {
    const { data } = await this.axiosInstance.get('/api/v1/apm/dashboard', {
      params: { view }
    });
    return data;
  }
  
  async getApplications(params?: {
    limit?: number;
    offset?: number;
    vendor?: string;
    department?: string;
    risk_level?: string;
    patch_status?: string;
  }): Promise<Application[]> {
    const { data } = await this.axiosInstance.get('/api/v1/apm/applications', { params });
    return data;
  }
  
  async getSpending(year: number): Promise<any> {
    const { data } = await this.axiosInstance.get(`/api/v1/apm/spending/${year}`);
    return data;
  }
  
  async getRenewals(days: number = 90): Promise<RenewalData> {
    const { data } = await this.axiosInstance.get('/api/v1/apm/renewals', { params: { days } });
    return data;
  }
  
  async getCompliance(): Promise<ComplianceMetrics> {
    const { data } = await this.axiosInstance.get('/api/v1/apm/compliance');
    return data;
  }
  
  async getVendors(): Promise<VendorAnalysis> {
    const { data } = await this.axiosInstance.get('/api/v1/apm/vendors');
    return data;
  }

  async getLiveMetrics(): Promise<any> {
    const { data } = await this.axiosInstance.get('/api/v1/apm/metrics/live');
    return data;
  }
}

export default new APMService();
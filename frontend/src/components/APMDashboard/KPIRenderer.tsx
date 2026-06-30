import React from 'react';
import MetricCard from './MetricCard';

interface KPIRendererProps {
  type: string;
  data: any;
}

const KPIRenderer: React.FC<KPIRendererProps> = ({ type, data }) => {
  const formatCurrency = (value: number): string => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value.toFixed(0)}`;
  };

  const formatNumber = (value: number): string => {
    return value.toLocaleString();
  };

  const formatPercentage = (value: number): string => {
    return `${value.toFixed(1)}%`;
  };

  switch (type) {
    case 'total-applications':
      return (
        <MetricCard
          title="Total Applications"
          value={data.total_applications}
          subtitle={`${data.active_applications} active`}
          trend={`${((data.active_applications / data.total_applications) * 100).toFixed(0)}%`}
          trendDirection="up"
        />
      );

    case 'spending-2024':
      return (
        <MetricCard
          title="2024 Spending"
          value={formatCurrency(data.total_spend_2024)}
          subtitle="Previous Year"
        />
      );

    case 'spending-2025':
      return (
        <MetricCard
          title="2025 Spending"
          value={formatCurrency(data.total_spend_2025)}
          subtitle="YTD Projection"
          trend={`${data.savings_percentage.toFixed(1)}%`}
          trendDirection={data.savings_percentage > 0 ? 'down' : 'up'}
        />
      );

    case 'total-savings':
      return (
        <MetricCard
          title="Total Savings"
          value={formatCurrency(data.savings_amount)}
          subtitle="Year over Year"
          trend={`${data.savings_percentage.toFixed(1)}%`}
          trendDirection="up"
          highlight={true}
          color="success"
        />
      );

    case 'patch-compliance':
      return (
        <MetricCard
          title="Patch Compliance"
          value={formatPercentage(data.patch_compliance_rate)}
          subtitle={data.patch_compliance_rate < 50 ? "Needs Attention" : "On Track"}
          trendDirection={data.patch_compliance_rate < 50 ? 'down' : 'up'}
        />
      );

    case 'license-utilization':
      return (
        <MetricCard
          title="License Utilization"
          value={formatPercentage(data.average_utilization)}
          subtitle={data.average_utilization < 60 ? "Underutilized" : "Optimized"}
          trendDirection={data.average_utilization < 60 ? 'down' : 'up'}
        />
      );

    case 'renewals-30':
      return (
        <MetricCard
          title="30-Day Renewals"
          value={data.renewals_next_30_days}
          subtitle={`$${(data.renewal_cost_30_days / 1000).toFixed(0)}K`}
        />
      );

    case 'cost-per-employee':
      return (
        <MetricCard
          title="Cost per Employee"
          value={formatCurrency(data.cost_per_employee)}
          subtitle="5,000 employees"
        />
      );

    case 'high-risk':
      return (
        <MetricCard
          title="High Risk Apps"
          value={data.high_risk_apps}
          subtitle="Immediate attention"
          color="danger"
        />
      );

    case 'medium-risk':
      return (
        <MetricCard
          title="Medium Risk Apps"
          value={data.medium_risk_apps}
          subtitle="Monitor closely"
          color="warning"
        />
      );

    case 'low-risk':
      return (
        <MetricCard
          title="Low Risk Apps"
          value={data.low_risk_apps}
          subtitle="Stable"
          color="success"
        />
      );

    default:
      return null;
  }
};

export default KPIRenderer;

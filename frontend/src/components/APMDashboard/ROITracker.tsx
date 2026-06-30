import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, DollarSign, Target, Award, Calculator,
  ChevronUp, ChevronDown, Info, Download, Share2,
  BarChart3, PieChart, Activity, Zap
} from 'lucide-react';
import { APMDashboardData } from '../../services/apmService';
import './ROITracker.css';

interface ROIMetric {
  id: string;
  category: 'cost' | 'efficiency' | 'risk' | 'productivity';
  label: string;
  current: number;
  previous: number;
  target: number;
  unit: string;
  impact: number; // Dollar impact
  trend: 'up' | 'down' | 'stable';
  achievement: number; // Percentage of target achieved
}

interface ROITrackerProps {
  data: APMDashboardData;
  config?: {
    showProjections?: boolean;
    showBreakdown?: boolean;
    refreshInterval?: number;
  };
}

const ROITracker: React.FC<ROITrackerProps> = ({ 
  data, 
  config = { showProjections: true, showBreakdown: true } 
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'quarter' | 'year'>('year');
  const [metrics, setMetrics] = useState<ROIMetric[]>([]);
  const [totalROI, setTotalROI] = useState(0);
  const [projectedROI, setProjectedROI] = useState(0);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    calculateROIMetrics();
  }, [data, selectedPeriod]);

  const calculateROIMetrics = () => {
    if (!data) return;
    
    const newMetrics: ROIMetric[] = [];
    
    // Period multiplier for adjusting values based on selected period
    let periodMultiplier = 1;
    let periodLabel = 'year';
    
    switch (selectedPeriod) {
      case 'month':
        periodMultiplier = 1 / 12;
        periodLabel = 'month';
        break;
      case 'quarter':
        periodMultiplier = 1 / 4;
        periodLabel = 'quarter';
        break;
      case 'year':
      default:
        periodMultiplier = 1;
        periodLabel = 'year';
        break;
    }
    
    // Safely extract values with defaults
    const savingsPercentage = data.savings_percentage || 0;
    const savingsAmount = (data.savings_amount || 0) * periodMultiplier;
    const avgUtilization = data.average_utilization || 0;
    const totalSpend2025 = (data.total_spend_2025 || 0) * periodMultiplier;
    
    // Cost Reduction
    newMetrics.push({
      id: 'cost-reduction',
      category: 'cost',
      label: 'License Cost Reduction',
      current: savingsPercentage,
      previous: savingsPercentage - 5, // Simulated previous
      target: 20,
      unit: '%',
      impact: savingsAmount,
      trend: savingsPercentage > 15 ? 'up' : 'down',
      achievement: (savingsPercentage / 20) * 100
    });

    // License Optimization
    const underutilizedImpact = (100 - avgUtilization) * totalSpend2025 / 100 * 0.3;
    newMetrics.push({
      id: 'license-optimization',
      category: 'efficiency',
      label: 'License Optimization',
      current: avgUtilization,
      previous: avgUtilization - 10,
      target: 85,
      unit: '%',
      impact: underutilizedImpact,
      trend: avgUtilization > 70 ? 'up' : 'down',
      achievement: (avgUtilization / 85) * 100
    });

    // Compliance Risk Mitigation
    const patchCompliance = data.patch_compliance_rate || 0;
    const complianceImpact = (patchCompliance > 90 ? 500000 : -1000000) * periodMultiplier;
    newMetrics.push({
      id: 'compliance-risk',
      category: 'risk',
      label: 'Compliance Risk Mitigation',
      current: patchCompliance,
      previous: patchCompliance - 5,
      target: 95,
      unit: '%',
      impact: complianceImpact,
      trend: patchCompliance > 90 ? 'up' : 'down',
      achievement: (patchCompliance / 95) * 100
    });

    // Vendor Consolidation
    const vendorCount = Object.keys(data.vendor_totals || {}).length;
    const vendorConsolidation = (vendorCount > 10 ? 
      (vendorCount - 10) * 50000 : 0) * periodMultiplier;
    newMetrics.push({
      id: 'vendor-consolidation',
      category: 'efficiency',
      label: 'Vendor Consolidation',
      current: vendorCount,
      previous: vendorCount + 2,
      target: 10,
      unit: 'vendors',
      impact: vendorConsolidation,
      trend: 'down',
      achievement: Math.max(0, 100 - ((vendorCount - 10) / 10 * 100))
    });

    // Application Rationalization
    const totalApps = data.total_applications || 1;
    const activeApps = data.active_applications || 0;
    const inactiveApps = totalApps - activeApps;
    const rationalizationImpact = inactiveApps * 5000 * periodMultiplier;
    newMetrics.push({
      id: 'app-rationalization',
      category: 'productivity',
      label: 'Application Rationalization',
      current: (activeApps / totalApps) * 100,
      previous: ((activeApps - 10) / totalApps) * 100,
      target: 90,
      unit: '%',
      impact: rationalizationImpact,
      trend: 'up',
      achievement: ((activeApps / totalApps) * 100 / 90) * 100
    });

    // Renewal Optimization
    const renewals30Days = data.renewals_next_30_days || 0;
    const renewalOptimization = renewals30Days * 10000 * periodMultiplier;
    newMetrics.push({
      id: 'renewal-optimization',
      category: 'cost',
      label: 'Renewal Optimization',
      current: renewals30Days,
      previous: renewals30Days + 5,
      target: 5,
      unit: 'renewals',
      impact: renewalOptimization,
      trend: renewals30Days < 10 ? 'down' : 'up',
      achievement: Math.max(0, 100 - (renewals30Days / 5 * 100))
    });

    setMetrics(newMetrics);

    // Calculate total ROI
    const total = newMetrics.reduce((sum, metric) => sum + metric.impact, 0);
    setTotalROI(total);

    // Calculate projected ROI (with improvements)
    const projected = total * 1.25; // 25% improvement potential
    setProjectedROI(projected);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'cost':
        return <DollarSign size={16} />;
      case 'efficiency':
        return <Activity size={16} />;
      case 'risk':
        return <Target size={16} />;
      case 'productivity':
        return <Zap size={16} />;
      default:
        return <BarChart3 size={16} />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'cost':
        return '#10b981';
      case 'efficiency':
        return '#3b82f6';
      case 'risk':
        return '#f59e0b';
      case 'productivity':
        return '#8b5cf6';
      default:
        return '#64748b';
    }
  };

  const formatValue = (value: number | undefined, unit: string): string => {
    if (value === undefined || value === null || isNaN(value)) {
      return unit === '$' ? '$0.0M' : unit === '%' ? '0.0%' : '0 ' + unit;
    }
    if (unit === '%') {
      return `${value.toFixed(1)}%`;
    } else if (unit === '$') {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else {
      return `${value.toFixed(0)} ${unit}`;
    }
  };

  const exportROIReport = () => {
    const report = {
      date: new Date().toISOString(),
      period: selectedPeriod,
      totalROI,
      projectedROI,
      metrics: metrics.map(m => ({
        label: m.label,
        current: m.current,
        target: m.target,
        achievement: m.achievement,
        impact: m.impact
      })),
      summary: {
        totalSavings: data.savings_amount,
        savingsPercentage: data.savings_percentage,
        complianceRate: data.patch_compliance_rate,
        utilizationRate: data.average_utilization
      }
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `roi-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getROIStatus = () => {
    const avgAchievement = metrics.reduce((sum, m) => sum + m.achievement, 0) / metrics.length;
    if (avgAchievement >= 90) return { label: 'Excellent', color: '#10b981' };
    if (avgAchievement >= 70) return { label: 'Good', color: '#3b82f6' };
    if (avgAchievement >= 50) return { label: 'Fair', color: '#f59e0b' };
    return { label: 'Needs Improvement', color: '#ef4444' };
  };

  const roiStatus = getROIStatus();

  return (
    <div className="roi-tracker">
      {/* Header */}
      <div className="roi-header">
        <div className="header-left">
          <Calculator size={20} />
          <h3>ROI Tracker</h3>
          <span 
            className="roi-status" 
            style={{ background: roiStatus.color }}
          >
            {roiStatus.label}
          </span>
        </div>
        <div className="header-actions">
          <button 
            className="period-btn"
            onClick={() => setShowDetails(!showDetails)}
            title="Toggle details"
          >
            <Info size={14} />
          </button>
          <button 
            className="period-btn"
            onClick={exportROIReport}
            title="Export report"
          >
            <Download size={14} />
          </button>
        </div>
      </div>

      {/* Period Selector */}
      <div className="period-selector">
        <button 
          className={`period-btn ${selectedPeriod === 'month' ? 'active' : ''}`}
          onClick={() => setSelectedPeriod('month')}
        >
          Month
        </button>
        <button 
          className={`period-btn ${selectedPeriod === 'quarter' ? 'active' : ''}`}
          onClick={() => setSelectedPeriod('quarter')}
        >
          Quarter
        </button>
        <button 
          className={`period-btn ${selectedPeriod === 'year' ? 'active' : ''}`}
          onClick={() => setSelectedPeriod('year')}
        >
          Year
        </button>
      </div>

      {/* Total ROI Summary */}
      <div className="roi-summary">
        <div className="roi-total">
          <div className="total-label">Total ROI</div>
          <div className="total-value">
            ${(totalROI / 1000000).toFixed(2)}M
          </div>
          <div className="total-period">Per {selectedPeriod}</div>
        </div>
        {config.showProjections && (
          <div className="roi-projection">
            <div className="projection-label">Projected ROI</div>
            <div className="projection-value">
              ${(projectedROI / 1000000).toFixed(2)}M
            </div>
            <div className="projection-increase">
              <TrendingUp size={14} />
              +{((projectedROI - totalROI) / 1000000).toFixed(1)}M potential
            </div>
          </div>
        )}
      </div>

      {/* Metrics List */}
      <div className="roi-metrics">
        {metrics.map(metric => (
          <div key={metric.id} className="roi-metric">
            <div className="metric-header">
              <div className="metric-category" style={{ color: getCategoryColor(metric.category) }}>
                {getCategoryIcon(metric.category)}
                <span>{metric.category}</span>
              </div>
              <div className="metric-impact">
                {metric.impact >= 0 ? '+' : ''}${(Math.abs(metric.impact) / 1000000).toFixed(1)}M
              </div>
            </div>
            
            <div className="metric-label">{metric.label}</div>
            
            <div className="metric-values">
              <div className="metric-current">
                <span className="value">{formatValue(metric.current, metric.unit)}</span>
                <span className={`trend ${metric.trend}`}>
                  {metric.trend === 'up' ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  {Math.abs(metric.current - metric.previous).toFixed(1)}
                </span>
              </div>
              <div className="metric-target">
                Target: {formatValue(metric.target, metric.unit)}
              </div>
            </div>
            
            <div className="metric-progress">
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ 
                    width: `${Math.min(100, metric.achievement)}%`,
                    background: metric.achievement >= 80 ? '#10b981' : 
                               metric.achievement >= 60 ? '#f59e0b' : '#ef4444'
                  }}
                />
              </div>
              <span className="progress-text">{metric.achievement.toFixed(0)}%</span>
            </div>

            {showDetails && (
              <div className="metric-details">
                <p>Previous: {formatValue(metric.previous, metric.unit)}</p>
                <p>Impact: ${(metric.impact / 1000000).toFixed(2)}M</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ROI Breakdown */}
      {config.showBreakdown && (
        <div className="roi-breakdown">
          <h4>ROI by Category</h4>
          <div className="breakdown-chart">
            {['cost', 'efficiency', 'risk', 'productivity'].map(category => {
              const categoryMetrics = metrics.filter(m => m.category === category);
              const categoryTotal = categoryMetrics.reduce((sum, m) => sum + Math.max(0, m.impact), 0);
              const percentage = (categoryTotal / totalROI) * 100;
              
              return (
                <div key={category} className="breakdown-item">
                  <div className="breakdown-label">
                    {getCategoryIcon(category)}
                    <span>{category}</span>
                  </div>
                  <div className="breakdown-bar">
                    <div 
                      className="breakdown-fill"
                      style={{ 
                        width: `${percentage}%`,
                        background: getCategoryColor(category)
                      }}
                    />
                  </div>
                  <div className="breakdown-value">
                    ${(categoryTotal / 1000000).toFixed(1)}M
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Action Items */}
      <div className="roi-actions">
        <h4>Improvement Opportunities</h4>
        <div className="action-items">
          {metrics
            .filter(m => m.achievement < 80)
            .sort((a, b) => b.impact - a.impact)
            .slice(0, 3)
            .map(metric => (
              <div key={metric.id} className="action-item">
                <Award size={14} style={{ color: getCategoryColor(metric.category) }} />
                <span className="action-text">
                  Improve {metric.label} from {formatValue(metric.current, metric.unit)} to {formatValue(metric.target, metric.unit)}
                </span>
                <span className="action-impact">
                  +${((metric.target - metric.current) / 100 * metric.impact / 1000000).toFixed(1)}M
                </span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default ROITracker;
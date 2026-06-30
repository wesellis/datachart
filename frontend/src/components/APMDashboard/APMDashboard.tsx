import React, { useState, useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import apmService, { APMDashboardData } from '../../services/apmService';
import { useAPMDashboard } from '../../contexts/APMDashboardContext';
import { useAuth } from '../../contexts/AuthContext';
import MetricCard from './MetricCard';
import SpendingChart from './SpendingChart';
import RenewalTimeline from './RenewalTimeline';
import VendorBreakdown from './VendorBreakdown';
import ComplianceGauge from './ComplianceGauge';
import ApplicationGrid from './ApplicationGrid';
import ExecutiveInsights from './ExecutiveInsights';
import RealTimeStatus from './RealTimeStatus';
import APMDashboardBuilder from './APMDashboardBuilder';
import SettingsPanel from './SettingsPanel';
import ExecutiveBriefing from './ExecutiveBriefing';
import SmartNotifications from './SmartNotifications';
import MeetingPresentation from './MeetingPresentation';
import ROITracker from './ROITracker';
import IntegrationHub from './IntegrationHub';
import DemoMode from './DemoMode';
import HamburgerMenu from './HamburgerMenu';
import ContractNegotiationAssistant from './Modules/ContractNegotiationAssistant';
import ShadowITDetector from './Modules/ShadowITDetector';
import LicenseHarvesting from './Modules/LicenseHarvesting';
import UsageOptimizer from './Modules/UsageOptimizer';
import VendorConsolidation from './Modules/VendorConsolidation';
import ComplianceScorecard from './Modules/ComplianceScorecard';
import RiskAssessment from './Modules/RiskAssessment';
import BudgetForecast from './Modules/BudgetForecast';
import CapacityPlanning from './Modules/CapacityPlanning';
import PerformanceMetrics from './Modules/PerformanceMetrics';
import ScheduleReportModal from './ScheduleReportModal';
import { exportToPDF, exportToExcel } from '../../utils/exportUtils';
import './APMDashboard.css';

const APMDashboard: React.FC = () => {
  const [data, setData] = useState<APMDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('apm-theme');
    return (saved as 'light' | 'dark') || 'light';
  });
  const [error, setError] = useState<string | null>(null);
  const [showAllApps, setShowAllApps] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const { layout, updateLayout, resetLayout } = useAPMDashboard();
  const { user } = useAuth();
  
  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [user?.currentDashboard]); // Reload when dashboard changes
  
  useEffect(() => {
    // Apply theme to document
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('apm-theme', theme);
  }, [theme]);
  
  // Keyboard shortcut for demo mode (Ctrl/Cmd + D)
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        setDemoMode(!demoMode);
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [demoMode]);
  
  const loadDashboardData = async () => {
    try {
      // Use the current dashboard view type
      const viewType = user?.currentDashboard || 'overview';
      
      const dashboardData = await apmService.getDashboard(viewType);
      setData(dashboardData);
      setLoading(false);
      setError(null);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      setError('Failed to load dashboard data. Please try again.');
      setLoading(false);
    }
  };
  
  const toggleEditMode = () => {
    setEditMode(!editMode);
  };

  const handleExportPDF = async () => {
    if (!data) return;
    
    try {
      const exportData = {
        totalApplications: data.total_applications,
        activeApplications: data.active_applications,
        totalSpend2024: data.total_spend_2024,
        totalSpend2025: data.total_spend_2025,
        savingsAmount: data.savings_amount,
        savingsPercentage: data.savings_percentage,
        costPerEmployee: data.cost_per_employee,
        patchComplianceRate: data.patch_compliance_rate,
        renewalsNext30Days: data.renewals_next_30_days,
        averageUtilization: data.average_utilization,
        vendorTotals: data.vendor_totals,
        applications: data.applications,
        monthlyTrend: data.monthly_trend
      };
      
      await exportToPDF(exportData, user?.currentDashboard || 'overview');
      console.log('PDF exported successfully');
    } catch (error) {
      console.error('Failed to export PDF:', error);
    }
  };

  const handleExportExcel = () => {
    if (!data) return;
    
    try {
      const exportData = {
        totalApplications: data.total_applications,
        activeApplications: data.active_applications,
        totalSpend2024: data.total_spend_2024,
        totalSpend2025: data.total_spend_2025,
        savingsAmount: data.savings_amount,
        savingsPercentage: data.savings_percentage,
        costPerEmployee: data.cost_per_employee,
        patchComplianceRate: data.patch_compliance_rate,
        renewalsNext30Days: data.renewals_next_30_days,
        averageUtilization: data.average_utilization,
        vendorTotals: data.vendor_totals,
        applications: data.applications,
        monthlyTrend: data.monthly_trend
      };
      
      exportToExcel(exportData, user?.currentDashboard || 'overview');
      console.log('Excel exported successfully');
    } catch (error) {
      console.error('Failed to export Excel:', error);
    }
  };

  const handleScheduleReport = (config: any) => {
    console.log('Report scheduled:', config);
    // In a real application, this would send the configuration to a backend service
    alert(`Report scheduled! Will be sent ${config.frequency} at ${config.time} to ${config.recipients.join(', ')}`);
  };
  
  const formatCurrency = (value: number): string => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(2)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value.toFixed(0)}`;
  };

  const formatPercentage = (value: number): string => {
    return `${value.toFixed(1)}%`;
  };

  const renderWidget = (widget: any, data: APMDashboardData) => {
    switch (widget.type) {
      case 'executive-insights':
        return <ExecutiveInsights data={data} config={{ refreshInterval: 5000 }} />;
      case 'realtime-status':
        return <RealTimeStatus lastUpdate={new Date()} isConnected={true} refreshInterval={30} onRefresh={loadDashboardData} />;
      case 'quick-filters':
        return (
          <div style={{ 
            background: 'var(--widget-background, white)', 
            borderRadius: '12px', 
            padding: '16px',
            border: '1px solid var(--border-color, #e2e8f0)',
            height: '100%',
            display: 'flex',
            gap: '8px',
            alignItems: 'center'
          }}>
            <select style={{ 
              flex: 1, 
              padding: '8px', 
              borderRadius: '6px', 
              border: '1px solid var(--border-color, #e2e8f0)',
              background: 'var(--widget-background, white)',
              color: 'var(--text-primary, #1e293b)'
            }}>
              <option>All Departments</option>
              <option>IT</option>
              <option>Finance</option>
              <option>HR</option>
              <option>Operations</option>
            </select>
            <select style={{ 
              flex: 1, 
              padding: '8px', 
              borderRadius: '6px', 
              border: '1px solid var(--border-color, #e2e8f0)',
              background: 'var(--widget-background, white)',
              color: 'var(--text-primary, #1e293b)'
            }}>
              <option>All Vendors</option>
              <option>Microsoft</option>
              <option>Oracle</option>
              <option>Salesforce</option>
              <option>SAP</option>
            </select>
            <button style={{
              padding: '8px 16px',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}>Apply</button>
          </div>
        );
      case 'export-actions':
        return (
          <div style={{ 
            background: 'var(--widget-background, white)', 
            borderRadius: '12px', 
            padding: '16px',
            border: '1px solid var(--border-color, #e2e8f0)',
            height: '100%',
            display: 'flex',
            gap: '8px',
            alignItems: 'center'
          }}>
            <button 
              onClick={handleExportPDF}
              style={{
                flex: 1,
                padding: '8px',
                background: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 500,
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#059669'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#10b981'}
            >
              📄 Export PDF
            </button>
            <button 
              onClick={handleExportExcel}
              style={{
                flex: 1,
                padding: '8px',
                background: '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 500,
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#1d4ed8'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#2563eb'}
            >
              📊 Export Excel
            </button>
            <button 
              onClick={() => setScheduleModalOpen(true)}
              style={{
                flex: 1,
                padding: '8px',
                background: '#8b5cf6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 500,
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#7c3aed'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#8b5cf6'}
            >
              📧 Schedule Report
            </button>
          </div>
        );
      case 'total-applications':
        return (
          <MetricCard
            title="Total Applications"
            value={data.total_applications}
            subtitle={`${data.active_applications} active`}
            trend={`${((data.active_applications / data.total_applications) * 100).toFixed(0)}%`}
            trendDirection="up"
            icon="apps"
            color="primary"
          />
        );
      case 'spending-2024':
        return (
          <MetricCard
            title="2024 Spending"
            value={formatCurrency(data.total_spend_2024)}
            subtitle="Previous Year"
            icon="calendar"
            color="secondary"
          />
        );
      case 'spending-2025':
        return (
          <MetricCard
            title="2025 Spending"
            value={formatCurrency(data.total_spend_2025)}
            trend={`${data.savings_percentage}%`}
            trendDirection="down"
            subtitle="YTD Projection"
            icon="trending"
            color="info"
          />
        );
      case 'total-savings':
        return (
          <MetricCard
            title="Total Savings"
            value={formatCurrency(data.savings_amount)}
            trend={`${data.savings_percentage}%`}
            trendDirection="up"
            subtitle="Year over Year"
            highlight={true}
            icon="savings"
            color="success"
          />
        );
      case 'cost-per-employee':
        const employeeCount = '5,000 employees'; // All views show enterprise-wide metrics
        return (
          <MetricCard
            title="Cost per Employee"
            value={formatCurrency(data.cost_per_employee)}
            subtitle={employeeCount}
            icon="users"
            color="warning"
            compact={true}
          />
        );
      case 'patch-compliance':
        return (
          <MetricCard
            title="Patch Compliance"
            value={formatPercentage(data.patch_compliance_rate)}
            trend={data.patch_compliance_rate > 90 ? "Good" : "Needs Attention"}
            trendDirection={data.patch_compliance_rate > 90 ? "up" : "down"}
            icon="shield"
            color={data.patch_compliance_rate > 90 ? "success" : "warning"}
            compact={true}
          />
        );
      case 'renewal-30':
        return (
          <MetricCard
            title="30-Day Renewals"
            value={data.renewals_next_30_days}
            subtitle={formatCurrency(data.renewal_cost_30_days)}
            icon="clock"
            color="danger"
            compact={true}
          />
        );
      case 'license-utilization':
        return (
          <MetricCard
            title="License Utilization"
            value={formatPercentage(data.average_utilization)}
            trend={data.average_utilization > 80 ? "Optimal" : "Underutilized"}
            trendDirection={data.average_utilization > 80 ? "up" : "down"}
            icon="gauge"
            color="info"
            compact={true}
          />
        );
      case 'spending-trend':
        return <SpendingChart monthlyTrend={data.monthly_trend} />;
      case 'vendor-breakdown':
        return <VendorBreakdown vendorTotals={data.vendor_totals} />;
      case 'compliance-gauge':
        return (
          <ComplianceGauge 
            complianceScore={data.compliance_average}
            highRisk={data.high_risk_apps}
            mediumRisk={data.medium_risk_apps}
            lowRisk={data.low_risk_apps}
          />
        );
      case 'renewal-timeline':
        return (
          <RenewalTimeline 
            renewals30={data.renewals_next_30_days}
            renewals60={data.renewals_next_60_days}
            renewals90={data.renewals_next_90_days}
            cost30={data.renewal_cost_30_days}
          />
        );
      case 'application-grid':
        return (
          <div style={{ height: '100%' }}>
            <div className="section-header">
              <h2>Top Applications by Spend</h2>
              <button 
                className="view-all-btn"
                onClick={() => setShowAllApps(!showAllApps)}
              >
                {showAllApps ? 'Show Less ←' : 'View All →'}
              </button>
            </div>
            <ApplicationGrid applications={data.applications} showAll={showAllApps} />
          </div>
        );
      case 'executive-briefing':
        return <ExecutiveBriefing data={data} />;
      case 'smart-notifications':
        return <SmartNotifications data={data} />;
      case 'meeting-presentation':
        return <MeetingPresentation data={data} />;
      case 'roi-tracker':
        return <ROITracker data={data} config={{ showProjections: true, showBreakdown: true }} />;
      case 'integration-hub':
        return <IntegrationHub onDataImport={(importedData) => console.log('Data imported:', importedData)} />;
      case 'contract-negotiation':
        return <ContractNegotiationAssistant data={data} config={{ showDetails: true }} />;
      case 'shadow-it-detector':
        return <ShadowITDetector data={data} config={{ showRiskLevel: true, autoScan: false }} />;
      case 'license-harvesting':
        return <LicenseHarvesting data={data} config={{ showDetails: true }} />;
      case 'usage-optimizer':
        return <UsageOptimizer applications={data.applications} />;
      case 'vendor-consolidation':
        return <VendorConsolidation applications={data.applications} vendorTotals={data.vendor_totals} />;
      case 'compliance-scorecard':
        return <ComplianceScorecard applications={data.applications} />;
      case 'risk-assessment':
        return <RiskAssessment applications={data.applications} />;
      case 'budget-forecast':
        return <BudgetForecast monthlyTrend={data.monthly_trend} applications={data.applications} />;
      case 'capacity-planning':
        return <CapacityPlanning applications={data.applications} />;
      case 'performance-metrics':
        return <PerformanceMetrics applications={data.applications} />;
      default:
        return (
          <div style={{ 
            padding: '16px', 
            background: '#f8fafc', 
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%'
          }}>
            <span style={{ color: '#64748b' }}>Widget: {widget.type}</span>
          </div>
        );
    }
  };
  
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <div className="loading-text">Loading Application Portfolio Management Dashboard...</div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="error-container">
        <div className="error-icon">⚠️</div>
        <div className="error-text">{error}</div>
        <button className="retry-btn" onClick={loadDashboardData}>Retry</button>
      </div>
    );
  }
  
  if (!data) {
    return <div className="error">No data available</div>;
  }
  
  return (
    <div className={`apm-dashboard ${editMode ? 'edit-mode' : ''}`}>
      <div className="dashboard-header">
        <div className="header-left">
          <div className="header-text">
            <h1>Application Portfolio Management</h1>
            <p>DataChart Enterprise Command Center • Real-time Intelligence</p>
          </div>
        </div>
        <div className="header-right">
          <div className="header-stats">
            <span className="stat-item">
              <span className="stat-label">Last Update:</span>
              <span className="stat-value">{new Date().toLocaleTimeString()}</span>
            </span>
            <span className="stat-item">
              <span className="stat-label">Active Sessions:</span>
              <span className="stat-value">23</span>
            </span>
          </div>
          <HamburgerMenu
            onSettingsClick={() => setSettingsOpen(true)}
            onEditLayoutClick={toggleEditMode}
            onDemoClick={() => setDemoMode(true)}
            onThemeToggle={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            onLogout={() => window.location.href = '/'}
            currentTheme={theme}
            isEditMode={editMode}
            userEmail={user?.email}
            userRole={user?.role}
          />
        </div>
      </div>
      
      <div className={`dashboard-wrapper ${editMode ? 'flipped' : ''}`}>
        <div className="dashboard-container">
          <div className="dashboard-content">
            {/* Dynamic Widget Rendering based on Layout */}
            <div className="dashboard-grid">
              {layout.filter(w => w.visible).map(widget => {
                // Use position and size from widget layout  
                const gridStyle = {
                  gridColumn: `span ${widget.size?.width || 12}`,
                  gridRow: `span ${widget.size?.height || 1}`
                };
                
                // Map widget types to CSS classes for styling
                let widgetClass = "chart-card";
                
                if (widget.type === "executive-insights") widgetClass = "alert-card";
                else if (widget.type === "application-grid") widgetClass = "full-width-card";
                else if (["total-applications", "spending-2024", "spending-2025", "total-savings",
                         "cost-per-employee", "patch-compliance", "renewal-30", "license-utilization"].includes(widget.type)) {
                  widgetClass = "metric-card";
                }
                else if (widget.type === "realtime-status") widgetClass = "live-updates-card";
                else if (["quick-filters", "export-actions"].includes(widget.type)) widgetClass = "full-width-card";
                
                return (
                  <div key={widget.id} className={widgetClass} style={gridStyle}>
                    {renderWidget(widget, data)}
                  </div>
                );
              })}
            </div>
          </div>
















          
          <div className="edit-mode-content">
              <DndProvider backend={HTML5Backend}>
                <div className="builder-wrapper">
                  <h2 style={{ marginBottom: '20px', color: '#1e293b' }}>APM Dashboard Builder</h2>
                  <p style={{ marginBottom: '20px', color: '#64748b', fontSize: '14px' }}>
                    Customize your Application Portfolio Management dashboard with specialized widgets
                  </p>
                  <APMDashboardBuilder 
                    onSave={() => {
                      console.log('Saving APM dashboard configuration...');
                      setEditMode(false);
                    }}
                    onCancel={() => setEditMode(false)}
                  />
                  <div className="builder-actions" style={{ marginTop: '20px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                    <button 
                      className="btn-cancel" 
                      onClick={() => setEditMode(false)}
                      style={{ padding: '10px 20px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer' }}
                    >
                      Cancel
                    </button>
                    <button 
                      className="btn-save"
                      onClick={() => {
                        console.log('Saving APM dashboard configuration...');
                        setEditMode(false);
                      }}
                      style={{ padding: '10px 20px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                    >
                      Save Layout
                    </button>
                  </div>
                </div>
              </DndProvider>
          </div>
        </div>
      </div>
      
      {/* Settings Panel */}
      <SettingsPanel 
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        currentTheme={theme}
        onThemeChange={setTheme}
      />
      
      {/* Demo Mode */}
      <DemoMode 
        isActive={demoMode}
        onClose={() => setDemoMode(false)}
      />
      
      {/* Schedule Report Modal */}
      <ScheduleReportModal
        isOpen={scheduleModalOpen}
        onClose={() => setScheduleModalOpen(false)}
        onSchedule={handleScheduleReport}
        dashboardType={user?.currentDashboard || 'overview'}
      />
    </div>
  );
};

export default APMDashboard;
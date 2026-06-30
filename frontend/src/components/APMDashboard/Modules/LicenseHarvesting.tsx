import React, { useState, useEffect } from 'react';
import { Scissors, TrendingDown, DollarSign, Users, AlertCircle, CheckCircle } from 'lucide-react';

interface LicenseHarvestingProps {
  data?: any;
  config?: {
    showDetails?: boolean;
    autoRefresh?: boolean;
  };
}

interface UnusedLicense {
  application: string;
  vendor: string;
  unusedCount: number;
  lastUsed: string;
  monthlyCost: number;
  annualWaste: number;
  utilization: number;
  department: string;
  recommendation: 'harvest' | 'reassign' | 'monitor';
}

const LicenseHarvesting: React.FC<LicenseHarvestingProps> = ({ data, config }) => {
  const [licenses, setLicenses] = useState<UnusedLicense[]>([]);
  const [selectedApp, setSelectedApp] = useState<string | null>(null);
  const [harvesting, setHarvesting] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    generateUnusedLicenses();
  }, [data]);

  useEffect(() => {
    // Check for dark mode
    const checkDarkMode = () => {
      setIsDarkMode(document.documentElement.getAttribute('data-theme') === 'dark');
    };
    
    checkDarkMode();
    
    // Watch for theme changes
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    
    return () => observer.disconnect();
  }, []);

  const generateUnusedLicenses = () => {
    const mockLicenses: UnusedLicense[] = [
      {
        application: 'Adobe Creative Cloud',
        vendor: 'Adobe',
        unusedCount: 47,
        lastUsed: '90+ days ago',
        monthlyCost: 52.99,
        annualWaste: 29907,
        utilization: 68,
        department: 'Marketing',
        recommendation: 'harvest'
      },
      {
        application: 'Microsoft Visio',
        vendor: 'Microsoft',
        unusedCount: 23,
        lastUsed: '60 days ago',
        monthlyCost: 15,
        annualWaste: 4140,
        utilization: 45,
        department: 'Engineering',
        recommendation: 'harvest'
      },
      {
        application: 'Tableau Desktop',
        vendor: 'Salesforce',
        unusedCount: 18,
        lastUsed: '30 days ago',
        monthlyCost: 70,
        annualWaste: 15120,
        utilization: 72,
        department: 'Analytics',
        recommendation: 'reassign'
      },
      {
        application: 'Zoom Webinar',
        vendor: 'Zoom',
        unusedCount: 35,
        lastUsed: '120+ days ago',
        monthlyCost: 40,
        annualWaste: 16800,
        utilization: 12,
        department: 'Sales',
        recommendation: 'harvest'
      },
      {
        application: 'Slack Plus',
        vendor: 'Slack',
        unusedCount: 89,
        lastUsed: '45 days ago',
        monthlyCost: 12.50,
        annualWaste: 13350,
        utilization: 55,
        department: 'Multiple',
        recommendation: 'monitor'
      },
      {
        application: 'AutoCAD',
        vendor: 'Autodesk',
        unusedCount: 8,
        lastUsed: '180+ days ago',
        monthlyCost: 220,
        annualWaste: 21120,
        utilization: 35,
        department: 'Engineering',
        recommendation: 'harvest'
      }
    ];
    setLicenses(mockLicenses);
  };

  const runHarvesting = () => {
    setHarvesting(true);
    setTimeout(() => {
      setHarvesting(false);
      // Update licenses with new data
      generateUnusedLicenses();
    }, 3000);
  };

  const formatCurrency = (value: number): string => {
    return `$${value.toLocaleString()}`;
  };

  const getRecommendationColor = (rec: string): string => {
    switch (rec) {
      case 'harvest': return '#ef4444';
      case 'reassign': return '#f59e0b';
      case 'monitor': return '#3b82f6';
      default: return '#64748b';
    }
  };

  const getUtilizationColor = (util: number): string => {
    if (util < 30) return '#ef4444';
    if (util < 60) return '#f59e0b';
    if (util < 80) return '#3b82f6';
    return '#10b981';
  };

  const totalWaste = licenses.reduce((sum, lic) => sum + lic.annualWaste, 0);
  const totalUnused = licenses.reduce((sum, lic) => sum + lic.unusedCount, 0);
  const harvestable = licenses.filter(lic => lic.recommendation === 'harvest').length;

  return (
    <div style={{
      background: 'var(--widget-background, white)',
      borderRadius: '12px',
      padding: '20px',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      color: 'var(--text-primary, #1e293b)'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <h3 style={{
          fontSize: '16px',
          fontWeight: 600,
          color: 'var(--text-primary, #1e293b)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Scissors size={20} style={{ color: '#10b981' }} />
          License Harvesting Opportunities
        </h3>
        <button
          onClick={runHarvesting}
          disabled={harvesting}
          style={{
            padding: '6px 12px',
            background: harvesting ? '#94a3b8' : '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '12px',
            cursor: harvesting ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          {harvesting ? 'Analyzing...' : 'Run Analysis'}
        </button>
      </div>

      {/* Summary Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '12px',
        marginBottom: '16px'
      }}>
        <div style={{
          padding: '10px',
          background: document.documentElement.getAttribute('data-theme') === 'dark' ? 'rgba(239, 68, 68, 0.15)' : '#fef2f2',
          borderRadius: '8px',
          textAlign: 'center',
          border: '1px solid ' + (document.documentElement.getAttribute('data-theme') === 'dark' ? 'rgba(239, 68, 68, 0.3)' : 'transparent')
        }}>
          <DollarSign size={16} style={{ color: '#ef4444', margin: '0 auto 4px' }} />
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--text-primary, #1e293b)' }}>
            {formatCurrency(totalWaste)}/yr
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-secondary, #64748b)' }}>Annual Waste</div>
        </div>
        <div style={{
          padding: '10px',
          background: document.documentElement.getAttribute('data-theme') === 'dark' ? 'rgba(234, 179, 8, 0.15)' : '#fefce8',
          borderRadius: '8px',
          textAlign: 'center',
          border: '1px solid ' + (document.documentElement.getAttribute('data-theme') === 'dark' ? 'rgba(234, 179, 8, 0.3)' : 'transparent')
        }}>
          <Users size={16} style={{ color: '#eab308', margin: '0 auto 4px' }} />
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--text-primary, #1e293b)' }}>
            {totalUnused}
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-secondary, #64748b)' }}>Unused Licenses</div>
        </div>
        <div style={{
          padding: '10px',
          background: document.documentElement.getAttribute('data-theme') === 'dark' ? 'rgba(16, 185, 129, 0.15)' : '#f0fdf4',
          borderRadius: '8px',
          textAlign: 'center',
          border: '1px solid ' + (document.documentElement.getAttribute('data-theme') === 'dark' ? 'rgba(16, 185, 129, 0.3)' : 'transparent')
        }}>
          <TrendingDown size={16} style={{ color: '#10b981', margin: '0 auto 4px' }} />
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--text-primary, #1e293b)' }}>
            {harvestable}
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-secondary, #64748b)' }}>Harvestable</div>
        </div>
        <div style={{
          padding: '10px',
          background: document.documentElement.getAttribute('data-theme') === 'dark' ? 'rgba(59, 130, 246, 0.15)' : '#eff6ff',
          borderRadius: '8px',
          textAlign: 'center',
          border: '1px solid ' + (document.documentElement.getAttribute('data-theme') === 'dark' ? 'rgba(59, 130, 246, 0.3)' : 'transparent')
        }}>
          <CheckCircle size={16} style={{ color: '#3b82f6', margin: '0 auto 4px' }} />
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--text-primary, #1e293b)' }}>
            {formatCurrency(totalWaste / 12)}/mo
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-secondary, #64748b)' }}>Monthly Savings</div>
        </div>
      </div>

      {/* License List */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {licenses.map((license, index) => (
          <div
            key={index}
            style={{
              padding: '12px',
              marginBottom: '8px',
              border: `1px solid ${selectedApp === license.application ? getRecommendationColor(license.recommendation) : '#e2e8f0'}`,
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              background: selectedApp === license.application ? 'var(--widget-background-hover, #fafafa)' : 'var(--widget-background, white)'
            }}
            onClick={() => setSelectedApp(selectedApp === license.application ? null : license.application)}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 500, color: 'var(--text-primary, #1e293b)' }}>{license.application}</span>
                  <span style={{
                    padding: '2px 6px',
                    background: getRecommendationColor(license.recommendation) + '20',
                    color: getRecommendationColor(license.recommendation),
                    borderRadius: '4px',
                    fontSize: '10px',
                    fontWeight: 500,
                    textTransform: 'uppercase'
                  }}>
                    {license.recommendation}
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary, #64748b)' }}>
                  {license.vendor} • {license.department} • Last used: {license.lastUsed}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#ef4444' }}>
                  {license.unusedCount} unused
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary, #64748b)' }}>
                  {formatCurrency(license.annualWaste)}/yr waste
                </div>
              </div>
            </div>

            {/* Utilization Bar */}
            <div style={{ marginTop: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                <span style={{ fontSize: '10px', color: 'var(--text-secondary, #64748b)' }}>Utilization</span>
                <span style={{ fontSize: '10px', fontWeight: 500, color: getUtilizationColor(license.utilization) }}>
                  {license.utilization}%
                </span>
              </div>
              <div style={{
                height: '4px',
                background: '#e2e8f0',
                borderRadius: '2px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${license.utilization}%`,
                  height: '100%',
                  background: getUtilizationColor(license.utilization),
                  transition: 'width 0.3s ease'
                }} />
              </div>
            </div>

            {selectedApp === license.application && (
              <div style={{
                marginTop: '12px',
                paddingTop: '12px',
                borderTop: '1px solid var(--border-color, #e2e8f0)'
              }}>
                <div style={{ marginBottom: '8px' }}>
                  <strong style={{ fontSize: '11px', color: 'var(--text-secondary, #64748b)' }}>RECOMMENDATION:</strong>
                  <div style={{ fontSize: '12px', color: 'var(--text-primary, #1e293b)', marginTop: '4px' }}>
                    {license.recommendation === 'harvest' && 
                      `Immediately reclaim ${license.unusedCount} licenses. Users haven't accessed in ${license.lastUsed}.`}
                    {license.recommendation === 'reassign' && 
                      `Reassign to active users in ${license.department} department who are waiting for access.`}
                    {license.recommendation === 'monitor' && 
                      `Continue monitoring. Usage patterns suggest seasonal variation.`}
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                  <button style={{
                    flex: 1,
                    padding: '6px',
                    background: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '11px',
                    cursor: 'pointer'
                  }}>
                    Harvest Licenses
                  </button>
                  <button style={{
                    flex: 1,
                    padding: '6px',
                    background: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '11px',
                    cursor: 'pointer'
                  }}>
                    Reassign Users
                  </button>
                  <button style={{
                    flex: 1,
                    padding: '6px',
                    background: '#f59e0b',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '11px',
                    cursor: 'pointer'
                  }}>
                    Set Alert
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Action Button */}
      <div style={{
        marginTop: '16px',
        paddingTop: '16px',
        borderTop: '1px solid var(--border-color, #e2e8f0)'
      }}>
        <button style={{
          width: '100%',
          padding: '10px',
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: 500,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px'
        }}>
          <Scissors size={16} />
          Harvest All Recommended ({harvestable} apps)
        </button>
      </div>
    </div>
  );
};

export default LicenseHarvesting;
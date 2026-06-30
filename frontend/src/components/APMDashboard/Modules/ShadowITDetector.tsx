import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, AlertTriangle, DollarSign, Users, Shield } from 'lucide-react';

interface ShadowITProps {
  data?: any;
  config?: {
    showRiskLevel?: boolean;
    autoScan?: boolean;
  };
}

interface ShadowApp {
  name: string;
  department: string;
  discoveredVia: string;
  estimatedCost: number;
  users: number;
  riskLevel: 'high' | 'medium' | 'low';
  dataAccess: string[];
  firstSeen: string;
}

const ShadowITDetector: React.FC<ShadowITProps> = ({ data, config }) => {
  const [shadowApps, setShadowApps] = useState<ShadowApp[]>([]);
  const [scanning, setScanning] = useState(false);
  const [selectedApp, setSelectedApp] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    generateShadowApps();
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

  const generateShadowApps = () => {
    const apps: ShadowApp[] = [
      {
        name: 'Canva Pro',
        department: 'Marketing',
        discoveredVia: 'Expense Report',
        estimatedCost: 3600,
        users: 12,
        riskLevel: 'medium',
        dataAccess: ['Company logos', 'Marketing materials'],
        firstSeen: '2024-10-15'
      },
      {
        name: 'Notion',
        department: 'Engineering',
        discoveredVia: 'Network Traffic',
        estimatedCost: 8400,
        users: 23,
        riskLevel: 'high',
        dataAccess: ['Source code snippets', 'Project plans', 'API keys'],
        firstSeen: '2024-09-22'
      },
      {
        name: 'Grammarly Business',
        department: 'Sales',
        discoveredVia: 'Browser Extension',
        estimatedCost: 4200,
        users: 18,
        riskLevel: 'medium',
        dataAccess: ['Email content', 'Proposals'],
        firstSeen: '2024-11-01'
      },
      {
        name: 'Monday.com',
        department: 'Operations',
        discoveredVia: 'Credit Card',
        estimatedCost: 15600,
        users: 45,
        riskLevel: 'low',
        dataAccess: ['Project timelines', 'Task lists'],
        firstSeen: '2024-08-30'
      },
      {
        name: 'ChatGPT Plus',
        department: 'Multiple',
        discoveredVia: 'Expense Report',
        estimatedCost: 2400,
        users: 10,
        riskLevel: 'high',
        dataAccess: ['Confidential data', 'Code', 'Customer info'],
        firstSeen: '2024-11-10'
      }
    ];
    setShadowApps(apps);
  };

  const runScan = () => {
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      generateShadowApps();
    }, 2000);
  };

  const formatCurrency = (value: number): string => {
    return `$${value.toLocaleString()}`;
  };

  const getRiskColor = (risk: string): string => {
    switch (risk) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#64748b';
    }
  };

  const totalShadowSpend = shadowApps.reduce((sum, app) => sum + app.estimatedCost, 0);
  const totalShadowUsers = shadowApps.reduce((sum, app) => sum + app.users, 0);
  const highRiskApps = shadowApps.filter(app => app.riskLevel === 'high').length;

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
          <EyeOff size={20} style={{ color: '#ef4444' }} />
          Shadow IT Detector
        </h3>
        <button
          onClick={runScan}
          disabled={scanning}
          style={{
            padding: '6px 12px',
            background: scanning ? '#94a3b8' : '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '12px',
            cursor: scanning ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          {scanning ? 'Scanning...' : 'Run Scan'}
        </button>
      </div>

      {/* Alert Banner */}
      <div style={{
        padding: '12px',
        background: isDarkMode ? 'rgba(239, 68, 68, 0.15)' : '#fef2f2',
        border: '1px solid ' + (isDarkMode ? 'rgba(239, 68, 68, 0.3)' : '#fecaca'),
        borderRadius: '8px',
        marginBottom: '16px',
        display: 'flex',
        gap: '8px',
        alignItems: 'flex-start'
      }}>
        <AlertTriangle size={16} style={{ color: '#ef4444', marginTop: '2px' }} />
        <div>
          <div style={{ fontSize: '13px', fontWeight: 500, color: isDarkMode ? '#f87171' : '#991b1b' }}>
            {shadowApps.length} Unauthorized Applications Detected
          </div>
          <div style={{ fontSize: '12px', color: isDarkMode ? '#fca5a5' : '#7f1d1d', marginTop: '2px' }}>
            Estimated annual exposure: {formatCurrency(totalShadowSpend * 12)}
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '12px',
        marginBottom: '16px'
      }}>
        <div style={{
          padding: '10px',
          background: isDarkMode ? 'rgba(239, 68, 68, 0.15)' : '#fef2f2',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <DollarSign size={16} style={{ color: '#ef4444', margin: '0 auto 4px' }} />
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--text-primary, #1e293b)' }}>
            {formatCurrency(totalShadowSpend)}/mo
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-secondary, #64748b)' }}>Shadow Spend</div>
        </div>
        <div style={{
          padding: '10px',
          background: isDarkMode ? 'rgba(234, 179, 8, 0.15)' : '#fefce8',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <Users size={16} style={{ color: '#eab308', margin: '0 auto 4px' }} />
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--text-primary, #1e293b)' }}>
            {totalShadowUsers}
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-secondary, #64748b)' }}>Affected Users</div>
        </div>
        <div style={{
          padding: '10px',
          background: isDarkMode ? 'rgba(239, 68, 68, 0.15)' : '#fee2e2',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <Shield size={16} style={{ color: '#ef4444', margin: '0 auto 4px' }} />
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--text-primary, #1e293b)' }}>
            {highRiskApps}
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-secondary, #64748b)' }}>High Risk</div>
        </div>
      </div>

      {/* Shadow Apps List */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {shadowApps.map((app, index) => (
          <div
            key={index}
            style={{
              padding: '12px',
              marginBottom: '8px',
              border: `1px solid ${selectedApp === app.name ? getRiskColor(app.riskLevel) : '#e2e8f0'}`,
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              background: selectedApp === app.name ? 'var(--widget-background-hover, #fafafa)' : 'var(--widget-background, white)'
            }}
            onClick={() => setSelectedApp(selectedApp === app.name ? null : app.name)}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 500, color: 'var(--text-primary, #1e293b)' }}>{app.name}</span>
                  <span style={{
                    padding: '2px 6px',
                    background: getRiskColor(app.riskLevel) + '20',
                    color: getRiskColor(app.riskLevel),
                    borderRadius: '4px',
                    fontSize: '10px',
                    fontWeight: 500,
                    textTransform: 'uppercase'
                  }}>
                    {app.riskLevel} risk
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary, #64748b)' }}>
                  {app.department} • {app.users} users • Discovered via {app.discoveredVia}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-primary, #1e293b)' }}>
                  {formatCurrency(app.estimatedCost)}/mo
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary, #64748b)' }}>
                  Since {app.firstSeen}
                </div>
              </div>
            </div>

            {selectedApp === app.name && (
              <div style={{
                marginTop: '12px',
                paddingTop: '12px',
                borderTop: '1px solid #e2e8f0'
              }}>
                <div style={{ marginBottom: '8px' }}>
                  <strong style={{ fontSize: '11px', color: 'var(--text-secondary, #64748b)' }}>DATA ACCESS DETECTED:</strong>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                    {app.dataAccess.map((data, i) => (
                      <span key={i} style={{
                        padding: '2px 6px',
                        background: '#fee2e2',
                        color: 'var(--text-danger, #991b1b)',
                        borderRadius: '4px',
                        fontSize: '11px'
                      }}>
                        {data}
                      </span>
                    ))}
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
                    Approve & Manage
                  </button>
                  <button style={{
                    flex: 1,
                    padding: '6px',
                    background: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '11px',
                    cursor: 'pointer'
                  }}>
                    Block Access
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
                    Request Info
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Discovery Methods */}
      <div style={{
        marginTop: '12px',
        padding: '8px',
        background: 'var(--widget-background-subtle, #f8fafc)',
        borderRadius: '8px',
        fontSize: '11px',
        color: 'var(--text-secondary, #64748b)'
      }}>
        <strong>Detection Methods:</strong> Expense Reports • Network Traffic • Browser Extensions • Credit Cards • SSO Logs
      </div>
    </div>
  );
};

export default ShadowITDetector;
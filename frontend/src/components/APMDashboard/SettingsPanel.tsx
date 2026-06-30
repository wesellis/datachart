import React, { useState, useEffect } from 'react';
import { X, Sun, Moon, Bell, Download, Shield, RefreshCw, Save, Database, Eye } from 'lucide-react';

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme?: 'light' | 'dark';
  onThemeChange?: (theme: 'light' | 'dark') => void;
}

const SettingsPanel: React.FC<SettingsProps> = ({ 
  isOpen, 
  onClose, 
  currentTheme = 'light',
  onThemeChange 
}) => {
  const [theme, setTheme] = useState(currentTheme);
  const [settings, setSettings] = useState({
    // Display Settings
    theme: currentTheme,
    compactMode: false,
    showGridLines: true,
    animationsEnabled: true,
    
    // Data Settings
    autoRefresh: true,
    refreshInterval: 30,
    dataRetention: 90,
    cacheEnabled: true,
    
    // Alert Settings
    enableAlerts: true,
    complianceThreshold: 90,
    renewalAlertDays: 30,
    budgetAlertThreshold: 80,
    emailNotifications: true,
    slackNotifications: false,
    
    // Export Settings
    defaultExportFormat: 'pdf',
    includeCharts: true,
    includeRawData: false,
    scheduledReports: false,
    reportFrequency: 'weekly',
    
    // Security Settings
    requireMFA: false,
    sessionTimeout: 30,
    auditLogging: true,
    dataEncryption: true,
  });

  useEffect(() => {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem('apm-settings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  const handleThemeToggle = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    setSettings({ ...settings, theme: newTheme });
    if (onThemeChange) {
      onThemeChange(newTheme);
    }
    
    // Apply theme to document
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const handleSave = () => {
    localStorage.setItem('apm-settings', JSON.stringify(settings));
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
    }}>
      <div style={{
        background: theme === 'dark' ? '#1e293b' : 'white',
        borderRadius: '16px',
        width: '800px',
        maxHeight: '90vh',
        overflow: 'hidden',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.3)',
      }}>
        {/* Header */}
        <div style={{
          padding: '24px',
          borderBottom: `1px solid ${theme === 'dark' ? '#334155' : '#e2e8f0'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <h2 style={{ 
            margin: 0, 
            fontSize: '20px', 
            fontWeight: 600, 
            color: theme === 'dark' ? 'white' : '#1e293b' 
          }}>
            Dashboard Settings
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              color: theme === 'dark' ? '#94a3b8' : '#64748b',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{
          padding: '24px',
          maxHeight: 'calc(90vh - 140px)',
          overflowY: 'auto',
        }}>
          {/* Theme Toggle - Featured */}
          <div style={{
            background: theme === 'dark' 
              ? 'linear-gradient(135deg, #334155 0%, #1e293b 100%)' 
              : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '24px',
            color: 'white',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {theme === 'light' ? <Sun size={24} /> : <Moon size={24} />}
                <div>
                  <div style={{ fontSize: '16px', fontWeight: 600 }}>
                    {theme === 'light' ? 'Light Mode' : 'Dark Mode'}
                  </div>
                  <div style={{ fontSize: '13px', opacity: 0.9 }}>
                    {theme === 'light' ? 'Optimized for daylight viewing' : 'Reduces eye strain in low light'}
                  </div>
                </div>
              </div>
              <button
                onClick={handleThemeToggle}
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: 'none',
                  borderRadius: '24px',
                  padding: '4px',
                  cursor: 'pointer',
                  width: '60px',
                  display: 'flex',
                  alignItems: 'center',
                  transition: 'all 0.3s ease',
                }}
              >
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: 'white',
                  transform: theme === 'dark' ? 'translateX(32px)' : 'translateX(0)',
                  transition: 'transform 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  {theme === 'dark' ? 
                    <Moon size={14} style={{ color: '#334155' }} /> : 
                    <Sun size={14} style={{ color: '#f59e0b' }} />
                  }
                </div>
              </button>
            </div>
          </div>

          {/* Settings Sections */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            {/* Display Preferences */}
            <div style={{
              background: theme === 'dark' ? '#334155' : '#f8fafc',
              borderRadius: '12px',
              padding: '16px',
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                marginBottom: '16px',
                color: theme === 'dark' ? 'white' : '#1e293b',
              }}>
                <Eye size={18} />
                <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>Display</h3>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  fontSize: '13px',
                  color: theme === 'dark' ? '#cbd5e1' : '#475569',
                }}>
                  <input 
                    type="checkbox" 
                    checked={settings.compactMode}
                    onChange={(e) => setSettings({...settings, compactMode: e.target.checked})}
                  />
                  Compact Mode
                </label>
                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  fontSize: '13px',
                  color: theme === 'dark' ? '#cbd5e1' : '#475569',
                }}>
                  <input 
                    type="checkbox" 
                    checked={settings.showGridLines}
                    onChange={(e) => setSettings({...settings, showGridLines: e.target.checked})}
                  />
                  Show Grid Lines
                </label>
                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  fontSize: '13px',
                  color: theme === 'dark' ? '#cbd5e1' : '#475569',
                }}>
                  <input 
                    type="checkbox" 
                    checked={settings.animationsEnabled}
                    onChange={(e) => setSettings({...settings, animationsEnabled: e.target.checked})}
                  />
                  Enable Animations
                </label>
              </div>
            </div>

            {/* Data & Refresh */}
            <div style={{
              background: theme === 'dark' ? '#334155' : '#f8fafc',
              borderRadius: '12px',
              padding: '16px',
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                marginBottom: '16px',
                color: theme === 'dark' ? 'white' : '#1e293b',
              }}>
                <RefreshCw size={18} />
                <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>Data & Refresh</h3>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  fontSize: '13px',
                  color: theme === 'dark' ? '#cbd5e1' : '#475569',
                }}>
                  <input 
                    type="checkbox" 
                    checked={settings.autoRefresh}
                    onChange={(e) => setSettings({...settings, autoRefresh: e.target.checked})}
                  />
                  Auto Refresh
                </label>
                <div>
                  <label style={{ 
                    fontSize: '13px', 
                    color: theme === 'dark' ? '#cbd5e1' : '#475569',
                    marginBottom: '4px',
                    display: 'block'
                  }}>
                    Refresh Interval (seconds)
                  </label>
                  <input 
                    type="number" 
                    value={settings.refreshInterval}
                    onChange={(e) => setSettings({...settings, refreshInterval: parseInt(e.target.value)})}
                    style={{
                      width: '100%',
                      padding: '6px',
                      borderRadius: '6px',
                      border: `1px solid ${theme === 'dark' ? '#475569' : '#e2e8f0'}`,
                      background: theme === 'dark' ? '#1e293b' : 'white',
                      color: theme === 'dark' ? 'white' : '#1e293b',
                      fontSize: '13px',
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Alerts & Thresholds */}
            <div style={{
              background: theme === 'dark' ? '#334155' : '#f8fafc',
              borderRadius: '12px',
              padding: '16px',
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                marginBottom: '16px',
                color: theme === 'dark' ? 'white' : '#1e293b',
              }}>
                <Bell size={18} />
                <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>Alerts</h3>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ 
                    fontSize: '13px', 
                    color: theme === 'dark' ? '#cbd5e1' : '#475569',
                    marginBottom: '4px',
                    display: 'block'
                  }}>
                    Compliance Alert (%)
                  </label>
                  <input 
                    type="number" 
                    value={settings.complianceThreshold}
                    onChange={(e) => setSettings({...settings, complianceThreshold: parseInt(e.target.value)})}
                    style={{
                      width: '100%',
                      padding: '6px',
                      borderRadius: '6px',
                      border: `1px solid ${theme === 'dark' ? '#475569' : '#e2e8f0'}`,
                      background: theme === 'dark' ? '#1e293b' : 'white',
                      color: theme === 'dark' ? 'white' : '#1e293b',
                      fontSize: '13px',
                    }}
                  />
                </div>
                <div>
                  <label style={{ 
                    fontSize: '13px', 
                    color: theme === 'dark' ? '#cbd5e1' : '#475569',
                    marginBottom: '4px',
                    display: 'block'
                  }}>
                    Renewal Alert (days)
                  </label>
                  <input 
                    type="number" 
                    value={settings.renewalAlertDays}
                    onChange={(e) => setSettings({...settings, renewalAlertDays: parseInt(e.target.value)})}
                    style={{
                      width: '100%',
                      padding: '6px',
                      borderRadius: '6px',
                      border: `1px solid ${theme === 'dark' ? '#475569' : '#e2e8f0'}`,
                      background: theme === 'dark' ? '#1e293b' : 'white',
                      color: theme === 'dark' ? 'white' : '#1e293b',
                      fontSize: '13px',
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Export Preferences */}
            <div style={{
              background: theme === 'dark' ? '#334155' : '#f8fafc',
              borderRadius: '12px',
              padding: '16px',
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                marginBottom: '16px',
                color: theme === 'dark' ? 'white' : '#1e293b',
              }}>
                <Download size={18} />
                <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>Export</h3>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ 
                    fontSize: '13px', 
                    color: theme === 'dark' ? '#cbd5e1' : '#475569',
                    marginBottom: '4px',
                    display: 'block'
                  }}>
                    Default Format
                  </label>
                  <select 
                    value={settings.defaultExportFormat}
                    onChange={(e) => setSettings({...settings, defaultExportFormat: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '6px',
                      borderRadius: '6px',
                      border: `1px solid ${theme === 'dark' ? '#475569' : '#e2e8f0'}`,
                      background: theme === 'dark' ? '#1e293b' : 'white',
                      color: theme === 'dark' ? 'white' : '#1e293b',
                      fontSize: '13px',
                    }}
                  >
                    <option value="pdf">PDF</option>
                    <option value="excel">Excel</option>
                    <option value="csv">CSV</option>
                    <option value="json">JSON</option>
                  </select>
                </div>
                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  fontSize: '13px',
                  color: theme === 'dark' ? '#cbd5e1' : '#475569',
                }}>
                  <input 
                    type="checkbox" 
                    checked={settings.includeCharts}
                    onChange={(e) => setSettings({...settings, includeCharts: e.target.checked})}
                  />
                  Include Charts
                </label>
              </div>
            </div>

            {/* Notifications */}
            <div style={{
              background: theme === 'dark' ? '#334155' : '#f8fafc',
              borderRadius: '12px',
              padding: '16px',
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                marginBottom: '16px',
                color: theme === 'dark' ? 'white' : '#1e293b',
              }}>
                <Bell size={18} />
                <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>Notifications</h3>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  fontSize: '13px',
                  color: theme === 'dark' ? '#cbd5e1' : '#475569',
                }}>
                  <input 
                    type="checkbox" 
                    checked={settings.emailNotifications}
                    onChange={(e) => setSettings({...settings, emailNotifications: e.target.checked})}
                  />
                  Email Alerts
                </label>
                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  fontSize: '13px',
                  color: theme === 'dark' ? '#cbd5e1' : '#475569',
                }}>
                  <input 
                    type="checkbox" 
                    checked={settings.slackNotifications}
                    onChange={(e) => setSettings({...settings, slackNotifications: e.target.checked})}
                  />
                  Slack Integration
                </label>
              </div>
            </div>

            {/* Security */}
            <div style={{
              background: theme === 'dark' ? '#334155' : '#f8fafc',
              borderRadius: '12px',
              padding: '16px',
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                marginBottom: '16px',
                color: theme === 'dark' ? 'white' : '#1e293b',
              }}>
                <Shield size={18} />
                <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>Security</h3>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  fontSize: '13px',
                  color: theme === 'dark' ? '#cbd5e1' : '#475569',
                }}>
                  <input 
                    type="checkbox" 
                    checked={settings.requireMFA}
                    onChange={(e) => setSettings({...settings, requireMFA: e.target.checked})}
                  />
                  Require MFA
                </label>
                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  fontSize: '13px',
                  color: theme === 'dark' ? '#cbd5e1' : '#475569',
                }}>
                  <input 
                    type="checkbox" 
                    checked={settings.auditLogging}
                    onChange={(e) => setSettings({...settings, auditLogging: e.target.checked})}
                  />
                  Audit Logging
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '20px 24px',
          borderTop: `1px solid ${theme === 'dark' ? '#334155' : '#e2e8f0'}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div style={{ 
            fontSize: '12px', 
            color: theme === 'dark' ? '#94a3b8' : '#64748b' 
          }}>
            Settings are saved per user and device
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={onClose}
              style={{
                padding: '8px 16px',
                background: theme === 'dark' ? '#475569' : 'white',
                color: theme === 'dark' ? 'white' : '#1e293b',
                border: `1px solid ${theme === 'dark' ? '#64748b' : '#e2e8f0'}`,
                borderRadius: '8px',
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              style={{
                padding: '8px 20px',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Save size={16} />
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
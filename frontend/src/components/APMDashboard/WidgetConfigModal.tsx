import React, { useState } from 'react';
import { X, Database, Save, Table } from 'lucide-react';
import { DashboardWidget } from '../../contexts/APMDashboardContext';

interface WidgetConfigModalProps {
  widget: DashboardWidget;
  onSave: (config: any) => void;
  onClose: () => void;
}

// Available data tables in Snowflake
const DATA_TABLES = [
  { id: 'applications', name: 'APPLICATIONS', schema: 'APM', description: 'Application inventory and metadata' },
  { id: 'spending', name: 'SPENDING', schema: 'FINANCE', description: 'Application spending and costs' },
  { id: 'compliance', name: 'COMPLIANCE', schema: 'SECURITY', description: 'Patch and compliance data' },
  { id: 'renewals', name: 'RENEWALS', schema: 'CONTRACTS', description: 'License renewals and contracts' },
  { id: 'vendors', name: 'VENDORS', schema: 'PROCUREMENT', description: 'Vendor information' },
  { id: 'employees', name: 'EMPLOYEES', schema: 'HR', description: 'Employee and department data' },
  { id: 'metrics', name: 'METRICS', schema: 'ANALYTICS', description: 'Aggregated metrics and KPIs' },
];

// Field mappings for different widget types
const WIDGET_FIELDS: Record<string, string[]> = {
  'total-applications': ['count', 'active_count', 'inactive_count'],
  'spending-2024': ['total_spend', 'monthly_spend', 'quarterly_spend'],
  'spending-2025': ['projected_spend', 'ytd_spend', 'budget'],
  'total-savings': ['savings_amount', 'savings_percentage', 'target_savings'],
  'cost-per-employee': ['cost_per_employee', 'total_employees', 'department'],
  'patch-compliance': ['compliance_rate', 'patched_count', 'pending_patches'],
  'renewal-30': ['renewal_count', 'renewal_cost', 'vendor_name'],
  'license-utilization': ['utilization_rate', 'total_licenses', 'used_licenses'],
  'spending-trend': ['month', 'spend_2024', 'spend_2025'],
  'vendor-breakdown': ['vendor_name', 'total_spend', 'app_count'],
  'compliance-gauge': ['compliance_score', 'risk_level', 'app_count'],
  'renewal-timeline': ['days_until_renewal', 'app_name', 'renewal_cost'],
  'application-grid': ['app_name', 'vendor', 'spend', 'owner', 'status'],
};

const WidgetConfigModal: React.FC<WidgetConfigModalProps> = ({ widget, onSave, onClose }) => {
  const [config, setConfig] = useState({
    name: widget.type.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    dataSource: {
      table: 'applications',
      schema: 'APM',
      fields: WIDGET_FIELDS[widget.type] || [],
      refreshInterval: 30,
    },
    display: {
      showTrend: true,
      showSubtitle: true,
      colorScheme: 'default',
    },
  });

  const handleSave = () => {
    onSave(config);
    onClose();
  };

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
      zIndex: 1000,
    }}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        width: '600px',
        maxHeight: '80vh',
        overflow: 'auto',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.2)',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#1e293b' }}>
            Configure Widget
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '20px' }}>
          {/* Widget Name */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: 500,
              color: '#475569',
            }}>
              Widget Name
            </label>
            <input
              type="text"
              value={config.name}
              onChange={(e) => setConfig({ ...config, name: e.target.value })}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                fontSize: '14px',
              }}
            />
          </div>

          {/* Data Source */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{
              fontSize: '16px',
              fontWeight: 600,
              marginBottom: '12px',
              color: '#1e293b',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <Database size={18} />
              Data Source
            </h3>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: 500,
                color: '#475569',
              }}>
                Snowflake Table
              </label>
              <select
                value={config.dataSource.table}
                onChange={(e) => {
                  const table = DATA_TABLES.find(t => t.id === e.target.value);
                  setConfig({
                    ...config,
                    dataSource: {
                      ...config.dataSource,
                      table: e.target.value,
                      schema: table?.schema || 'APM',
                    },
                  });
                }}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  fontSize: '14px',
                  background: 'white',
                }}
              >
                {DATA_TABLES.map((table) => (
                  <option key={table.id} value={table.id}>
                    {table.schema}.{table.name} - {table.description}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: 500,
                color: '#475569',
              }}>
                Fields to Display
              </label>
              <div style={{
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                padding: '12px',
                background: '#f8fafc',
                fontSize: '13px',
                color: '#64748b',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px',
              }}>
                {config.dataSource.fields.map((field, idx) => (
                  <span
                    key={idx}
                    style={{
                      background: 'white',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      border: '1px solid #e2e8f0',
                    }}
                  >
                    {field}
                  </span>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: 500,
                color: '#475569',
              }}>
                Refresh Interval (seconds)
              </label>
              <input
                type="number"
                value={config.dataSource.refreshInterval}
                onChange={(e) => setConfig({
                  ...config,
                  dataSource: {
                    ...config.dataSource,
                    refreshInterval: parseInt(e.target.value) || 30,
                  },
                })}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  fontSize: '14px',
                }}
              />
            </div>
          </div>

          {/* Display Options */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{
              fontSize: '16px',
              fontWeight: 600,
              marginBottom: '12px',
              color: '#1e293b',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <Table size={18} />
              Display Options
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '14px',
                color: '#475569',
              }}>
                <input
                  type="checkbox"
                  checked={config.display.showTrend}
                  onChange={(e) => setConfig({
                    ...config,
                    display: {
                      ...config.display,
                      showTrend: e.target.checked,
                    },
                  })}
                />
                Show Trend Indicator
              </label>
              
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '14px',
                color: '#475569',
              }}>
                <input
                  type="checkbox"
                  checked={config.display.showSubtitle}
                  onChange={(e) => setConfig({
                    ...config,
                    display: {
                      ...config.display,
                      showSubtitle: e.target.checked,
                    },
                  })}
                />
                Show Subtitle
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '20px',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px',
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              background: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            style={{
              padding: '8px 16px',
              background: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Save size={16} />
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
};

export default WidgetConfigModal;
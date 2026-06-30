import React, { useState, useEffect } from 'react';
import { X, Maximize2, Settings, Info, Sparkles, Database, RefreshCw } from 'lucide-react';
import MetricCard from './MetricCard';
import SpendingChart from './SpendingChart';
import VendorBreakdown from './VendorBreakdown';
import './EnhancedWidgetModal.css';

interface EnhancedWidgetModalProps {
  widgetType: string;
  isOpen: boolean;
  onClose: () => void;
  onAdd?: (config: any) => void;
}

const EnhancedWidgetModal: React.FC<EnhancedWidgetModalProps> = ({ 
  widgetType, 
  isOpen, 
  onClose,
  onAdd 
}) => {
  const [activeTab, setActiveTab] = useState<'preview' | 'configure' | 'data'>('preview');
  const [isAnimating, setIsAnimating] = useState(false);
  const [config, setConfig] = useState({
    refreshInterval: 30,
    showTrend: true,
    showSubtitle: true,
    dataSource: 'live',
    theme: 'default'
  });

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 500);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const getWidgetInfo = () => {
    const widgetInfo: Record<string, any> = {
      'total-savings': {
        title: 'Total Savings Widget',
        description: 'Displays year-over-year savings with trend indicators',
        category: 'Financial',
        updateFrequency: 'Real-time',
        dataPoints: '12 months historical',
        preview: (
          <MetricCard
            title="Total Savings"
            value="$11.61M"
            trend="22.68%"
            trendDirection="up"
            subtitle="Year over Year"
            highlight={true}
            icon="savings"
            color="success"
          />
        )
      },
      'spending-trend': {
        title: 'Spending Trend Chart',
        description: 'Monthly spending comparison across years',
        category: 'Analytics',
        updateFrequency: 'Daily',
        dataPoints: '24 months',
        preview: (
          <div style={{ height: '300px' }}>
            <SpendingChart monthlyTrend={[
              { month: 'Jan', spend_2024: 4200000, spend_2025: 3100000 },
              { month: 'Feb', spend_2024: 4300000, spend_2025: 3200000 },
              { month: 'Mar', spend_2024: 4100000, spend_2025: 3300000 },
            ]} />
          </div>
        )
      },
      'vendor-breakdown': {
        title: 'Vendor Distribution',
        description: 'Visual breakdown of spending by vendor',
        category: 'Procurement',
        updateFrequency: 'Hourly',
        dataPoints: 'Top 10 vendors',
        preview: (
          <div style={{ height: '300px' }}>
            <VendorBreakdown vendorTotals={[
              { vendor_name: 'Microsoft', total_spend: 12500000, percentage: 24.3 },
              { vendor_name: 'Salesforce', total_spend: 8700000, percentage: 16.9 },
              { vendor_name: 'Oracle', total_spend: 6200000, percentage: 12.0 },
            ]} />
          </div>
        )
      }
    };

    return widgetInfo[widgetType] || {
      title: widgetType.replace(/-/g, ' ').toUpperCase(),
      description: 'Configure this widget for your dashboard',
      category: 'Custom',
      updateFrequency: 'Configurable',
      dataPoints: 'Variable',
      preview: <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Widget Preview</div>
    };
  };

  const widgetInfo = getWidgetInfo();

  return (
    <div className={`enhanced-modal-overlay ${isAnimating ? 'animating' : ''}`}>
      <div className="enhanced-modal-container">
        {/* Header */}
        <div className="modal-header">
          <div className="header-content">
            <div className="widget-badge">
              <Sparkles size={20} />
            </div>
            <div>
              <h2>{widgetInfo.title}</h2>
              <p className="widget-description">{widgetInfo.description}</p>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="modal-tabs">
          <button 
            className={`tab ${activeTab === 'preview' ? 'active' : ''}`}
            onClick={() => setActiveTab('preview')}
          >
            <Maximize2 size={16} />
            Preview
          </button>
          <button 
            className={`tab ${activeTab === 'configure' ? 'active' : ''}`}
            onClick={() => setActiveTab('configure')}
          >
            <Settings size={16} />
            Configure
          </button>
          <button 
            className={`tab ${activeTab === 'data' ? 'active' : ''}`}
            onClick={() => setActiveTab('data')}
          >
            <Database size={16} />
            Data Source
          </button>
        </div>

        {/* Content */}
        <div className="modal-content">
          {activeTab === 'preview' && (
            <div className="preview-section">
              <div className="widget-preview-container">
                {widgetInfo.preview}
              </div>
              <div className="widget-stats">
                <div className="stat-item">
                  <span className="stat-label">Category</span>
                  <span className="stat-value">{widgetInfo.category}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Updates</span>
                  <span className="stat-value">{widgetInfo.updateFrequency}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Data Points</span>
                  <span className="stat-value">{widgetInfo.dataPoints}</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'configure' && (
            <div className="configure-section">
              <div className="config-group">
                <label className="config-label">
                  <RefreshCw size={16} />
                  Refresh Interval
                </label>
                <select 
                  value={config.refreshInterval}
                  onChange={(e) => setConfig({...config, refreshInterval: parseInt(e.target.value)})}
                  className="config-select"
                >
                  <option value={10}>10 seconds</option>
                  <option value={30}>30 seconds</option>
                  <option value={60}>1 minute</option>
                  <option value={300}>5 minutes</option>
                </select>
              </div>

              <div className="config-group">
                <label className="config-label">Display Options</label>
                <div className="config-checkboxes">
                  <label className="checkbox-label">
                    <input 
                      type="checkbox" 
                      checked={config.showTrend}
                      onChange={(e) => setConfig({...config, showTrend: e.target.checked})}
                    />
                    <span>Show trend indicators</span>
                  </label>
                  <label className="checkbox-label">
                    <input 
                      type="checkbox"
                      checked={config.showSubtitle}
                      onChange={(e) => setConfig({...config, showSubtitle: e.target.checked})}
                    />
                    <span>Show subtitle text</span>
                  </label>
                </div>
              </div>

              <div className="config-group">
                <label className="config-label">Widget Theme</label>
                <div className="theme-options">
                  {['default', 'blue', 'green', 'purple'].map(theme => (
                    <button
                      key={theme}
                      className={`theme-btn ${config.theme === theme ? 'active' : ''}`}
                      onClick={() => setConfig({...config, theme})}
                      style={{
                        background: theme === 'blue' ? '#3b82f6' : 
                                   theme === 'green' ? '#10b981' : 
                                   theme === 'purple' ? '#8b5cf6' : '#64748b'
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'data' && (
            <div className="data-section">
              <div className="data-source-card">
                <div className="source-header">
                  <Database size={20} />
                  <span>Snowflake Data Warehouse</span>
                </div>
                <div className="source-details">
                  <div className="detail-row">
                    <span className="detail-label">Database:</span>
                    <span className="detail-value">DataChart_APM</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Schema:</span>
                    <span className="detail-value">ANALYTICS</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Table:</span>
                    <span className="detail-value">APPLICATION_METRICS</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Last Updated:</span>
                    <span className="detail-value">2 minutes ago</span>
                  </div>
                </div>
              </div>

              <div className="data-preview">
                <h4>Sample Data</h4>
                <div className="data-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Field</th>
                        <th>Type</th>
                        <th>Sample Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>total_spend</td>
                        <td>NUMBER</td>
                        <td>$51,200,000</td>
                      </tr>
                      <tr>
                        <td>savings_pct</td>
                        <td>FLOAT</td>
                        <td>22.68%</td>
                      </tr>
                      <tr>
                        <td>app_count</td>
                        <td>INTEGER</td>
                        <td>523</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button 
            className="btn-primary"
            onClick={() => {
              onAdd?.(config);
              onClose();
            }}
          >
            <Sparkles size={16} />
            Add to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default EnhancedWidgetModal;
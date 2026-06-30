import React from 'react';
import { Zap, Clock, CheckCircle, AlertCircle } from 'lucide-react';

interface PerformanceMetricsProps {
  applications: any[];
}

const PerformanceMetrics: React.FC<PerformanceMetricsProps> = ({ applications }) => {
  // Calculate performance metrics
  const avgResponseTime = 245; // ms
  const avgUptime = 99.87; // %
  const totalIncidents = 12;
  const resolvedIncidents = 10;
  const mttr = 2.5; // hours Mean Time To Resolve

  // Application performance data
  const appPerformance = applications.slice(0, 5).map(app => ({
    name: app.name,
    responseTime: Math.random() * 500 + 100,
    uptime: 98 + Math.random() * 2,
    incidents: Math.floor(Math.random() * 5),
    sla: Math.random() > 0.3 ? 'Met' : 'At Risk'
  }));

  // Performance trends
  const trends = [
    { metric: 'Response Time', current: 245, previous: 280, unit: 'ms', improved: true },
    { metric: 'Uptime', current: 99.87, previous: 99.65, unit: '%', improved: true },
    { metric: 'MTTR', current: 2.5, previous: 3.2, unit: 'hrs', improved: true },
    { metric: 'Incidents', current: 12, previous: 18, unit: '', improved: true }
  ];

  const getPerformanceColor = (value: number, metric: string) => {
    if (metric === 'uptime') {
      return value >= 99.5 ? '#10b981' : value >= 99 ? '#f59e0b' : '#ef4444';
    }
    if (metric === 'responseTime') {
      return value <= 200 ? '#10b981' : value <= 500 ? '#f59e0b' : '#ef4444';
    }
    return '#3b82f6';
  };

  return (
    <div className="performance-metrics-module">
      <div className="module-header">
        <Zap className="module-icon" size={20} style={{ color: '#f59e0b' }} />
        <h3>Performance Metrics</h3>
      </div>

      <div className="metrics-overview">
        <div className="metric-card">
          <Clock size={16} style={{ color: '#3b82f6' }} />
          <div>
            <span className="metric-value">{avgResponseTime}ms</span>
            <span className="metric-label">Avg Response</span>
          </div>
        </div>
        <div className="metric-card">
          <CheckCircle size={16} style={{ color: '#10b981' }} />
          <div>
            <span className="metric-value">{avgUptime}%</span>
            <span className="metric-label">Uptime</span>
          </div>
        </div>
        <div className="metric-card">
          <AlertCircle size={16} style={{ color: '#f59e0b' }} />
          <div>
            <span className="metric-value">{mttr}h</span>
            <span className="metric-label">MTTR</span>
          </div>
        </div>
      </div>

      <div className="performance-trends">
        <h4>30-Day Trends</h4>
        <div className="trends-grid">
          {trends.map((trend, index) => (
            <div key={index} className="trend-item">
              <span className="trend-metric">{trend.metric}</span>
              <div className="trend-values">
                <span className="current">{trend.current}{trend.unit}</span>
                <span className={`change ${trend.improved ? 'positive' : 'negative'}`}>
                  {trend.improved ? '↓' : '↑'}
                  {Math.abs(((trend.current - trend.previous) / trend.previous * 100)).toFixed(1)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="app-performance">
        <h4>Application Performance</h4>
        <div className="performance-table">
          {appPerformance.map((app, index) => (
            <div key={index} className="performance-row">
              <span className="app-name">{app.name}</span>
              <div className="performance-metrics">
                <span 
                  className="response-time"
                  style={{ color: getPerformanceColor(app.responseTime, 'responseTime') }}
                >
                  {app.responseTime.toFixed(0)}ms
                </span>
                <span 
                  className="uptime"
                  style={{ color: getPerformanceColor(app.uptime, 'uptime') }}
                >
                  {app.uptime.toFixed(1)}%
                </span>
                <span className={`sla-status ${app.sla.toLowerCase().replace(' ', '-')}`}>
                  {app.sla}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="performance-actions">
        <button className="action-btn">
          View Performance Dashboard
        </button>
      </div>

      <style>{`
        .performance-metrics-module {
          padding: 20px;
          background: var(--widget-background, white);
          border-radius: 12px;
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .module-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 20px;
        }

        .module-header h3 {
          font-size: 16px;
          font-weight: 600;
          color: var(--text-primary, #1e293b);
          margin: 0;
        }

        .metrics-overview {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          margin-bottom: 20px;
        }

        .metric-card {
          padding: 12px;
          background: var(--widget-background-hover, #f8fafc);
          border-radius: 8px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .metric-card > div {
          display: flex;
          flex-direction: column;
        }

        .metric-value {
          font-size: 16px;
          font-weight: 700;
          color: var(--text-primary, #1e293b);
        }

        .metric-label {
          font-size: 10px;
          color: var(--text-secondary, #64748b);
        }

        .performance-trends {
          margin-bottom: 20px;
        }

        .performance-trends h4,
        .app-performance h4 {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-secondary, #64748b);
          margin: 0 0 12px 0;
        }

        .trends-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
        }

        .trend-item {
          padding: 8px;
          background: var(--widget-background, white);
          border: 1px solid var(--border-color, #e2e8f0);
          border-radius: 6px;
        }

        .trend-metric {
          display: block;
          font-size: 11px;
          color: var(--text-secondary, #64748b);
          margin-bottom: 4px;
        }

        .trend-values {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .current {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary, #1e293b);
        }

        .change {
          font-size: 11px;
          font-weight: 600;
        }

        .change.positive {
          color: #10b981;
        }

        .change.negative {
          color: #ef4444;
        }

        .app-performance {
          flex: 1;
          overflow-y: auto;
        }

        .performance-table {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .performance-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px;
          background: var(--widget-background, white);
          border: 1px solid var(--border-color, #e2e8f0);
          border-radius: 6px;
        }

        .app-name {
          font-size: 12px;
          font-weight: 500;
          color: var(--text-primary, #1e293b);
          flex: 1;
        }

        .performance-metrics {
          display: flex;
          gap: 15px;
          align-items: center;
        }

        .response-time,
        .uptime {
          font-size: 11px;
          font-weight: 600;
        }

        .sla-status {
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: 600;
        }

        .sla-status.met {
          background: rgba(16, 185, 129, 0.1);
          color: #10b981;
        }

        .sla-status.at-risk {
          background: rgba(245, 158, 11, 0.1);
          color: #f59e0b;
        }

        .performance-actions {
          margin-top: 15px;
          padding-top: 15px;
          border-top: 1px solid var(--border-color, #e2e8f0);
        }

        .action-btn {
          width: 100%;
          padding: 10px;
          background: #f59e0b;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .action-btn:hover {
          background: #d97706;
        }
      `}</style>
    </div>
  );
};

export default PerformanceMetrics;
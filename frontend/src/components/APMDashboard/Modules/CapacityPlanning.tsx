import React from 'react';
import { Activity, Users, Server, TrendingUp } from 'lucide-react';

interface CapacityPlanningProps {
  applications: any[];
}

const CapacityPlanning: React.FC<CapacityPlanningProps> = ({ applications }) => {
  // Calculate capacity metrics
  const totalLicenses = applications.reduce((sum, app) => sum + (app.licenses || 100), 0);
  const usedLicenses = applications.reduce((sum, app) => sum + ((app.licenses || 100) * (app.utilization / 100)), 0);
  const capacityUtilization = (usedLicenses / totalLicenses) * 100;

  // Growth projections
  const growthProjections = [
    { resource: 'User Licenses', current: 5000, projected: 6500, growth: 30 },
    { resource: 'Storage (TB)', current: 250, projected: 380, growth: 52 },
    { resource: 'API Calls/Day', current: 1200000, projected: 1800000, growth: 50 },
    { resource: 'Bandwidth (GB)', current: 8000, projected: 11000, growth: 37.5 }
  ];

  // Capacity alerts
  const capacityAlerts = [
    { app: 'Salesforce', resource: 'User Licenses', usage: 92, threshold: 90, daysToLimit: 15 },
    { app: 'AWS', resource: 'Storage', usage: 87, threshold: 85, daysToLimit: 30 },
    { app: 'Microsoft 365', resource: 'Mailbox Storage', usage: 78, threshold: 80, daysToLimit: 45 }
  ];

  return (
    <div className="capacity-planning-module">
      <div className="module-header">
        <Activity className="module-icon" size={20} style={{ color: '#8b5cf6' }} />
        <h3>Capacity Planning</h3>
      </div>

      <div className="capacity-overview">
        <div className="utilization-gauge">
          <div className="gauge-circle">
            <svg width="80" height="80">
              <circle
                cx="40"
                cy="40"
                r="35"
                fill="none"
                stroke="var(--border-color, #e2e8f0)"
                strokeWidth="6"
              />
              <circle
                cx="40"
                cy="40"
                r="35"
                fill="none"
                stroke="#8b5cf6"
                strokeWidth="6"
                strokeDasharray={`${capacityUtilization * 2.2} 220`}
                strokeDashoffset="-55"
                transform="rotate(-90 40 40)"
              />
            </svg>
            <div className="gauge-value">
              <span className="percentage">{capacityUtilization.toFixed(0)}%</span>
              <span className="label">Utilized</span>
            </div>
          </div>
        </div>
        <div className="capacity-stats">
          <div className="stat-item">
            <Users size={14} style={{ color: '#3b82f6' }} />
            <span className="stat-value">{(usedLicenses / 1000).toFixed(1)}K</span>
            <span className="stat-label">Active Licenses</span>
          </div>
          <div className="stat-item">
            <Server size={14} style={{ color: '#10b981' }} />
            <span className="stat-value">{((totalLicenses - usedLicenses) / 1000).toFixed(1)}K</span>
            <span className="stat-label">Available</span>
          </div>
        </div>
      </div>

      <div className="growth-projections">
        <h4>6-Month Growth Projections</h4>
        {growthProjections.map((proj, index) => (
          <div key={index} className="projection-item">
            <div className="projection-info">
              <span className="resource-name">{proj.resource}</span>
              <span className="growth-rate">
                <TrendingUp size={12} />
                +{proj.growth}%
              </span>
            </div>
            <div className="projection-values">
              <span className="current">{proj.current.toLocaleString()}</span>
              <span className="arrow">→</span>
              <span className="projected">{proj.projected.toLocaleString()}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="capacity-alerts">
        <h4>Capacity Alerts</h4>
        {capacityAlerts.map((alert, index) => (
          <div key={index} className={`alert-item ${alert.usage > alert.threshold ? 'critical' : 'warning'}`}>
            <div className="alert-header">
              <span className="app-name">{alert.app}</span>
              <span className="usage-badge">{alert.usage}%</span>
            </div>
            <div className="alert-details">
              <span className="resource">{alert.resource}</span>
              <span className="days-remaining">{alert.daysToLimit} days to limit</span>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .capacity-planning-module {
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

        .capacity-overview {
          display: flex;
          gap: 20px;
          margin-bottom: 25px;
          padding: 15px;
          background: var(--widget-background-hover, #f8fafc);
          border-radius: 10px;
        }

        .utilization-gauge {
          position: relative;
        }

        .gauge-circle {
          position: relative;
        }

        .gauge-value {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          text-align: center;
        }

        .gauge-value .percentage {
          display: block;
          font-size: 18px;
          font-weight: 700;
          color: var(--text-primary, #1e293b);
        }

        .gauge-value .label {
          display: block;
          font-size: 10px;
          color: var(--text-secondary, #64748b);
        }

        .capacity-stats {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 12px;
        }

        .stat-item {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .stat-value {
          font-size: 16px;
          font-weight: 600;
          color: var(--text-primary, #1e293b);
        }

        .stat-label {
          font-size: 11px;
          color: var(--text-secondary, #64748b);
        }

        .growth-projections,
        .capacity-alerts {
          flex: 1;
          overflow-y: auto;
        }

        .growth-projections h4,
        .capacity-alerts h4 {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-secondary, #64748b);
          margin: 0 0 12px 0;
        }

        .projection-item {
          padding: 10px;
          background: var(--widget-background, white);
          border: 1px solid var(--border-color, #e2e8f0);
          border-radius: 6px;
          margin-bottom: 8px;
        }

        .projection-info {
          display: flex;
          justify-content: space-between;
          margin-bottom: 6px;
        }

        .resource-name {
          font-size: 12px;
          font-weight: 500;
          color: var(--text-primary, #1e293b);
        }

        .growth-rate {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          color: #10b981;
          font-weight: 600;
        }

        .projection-values {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 11px;
          color: var(--text-secondary, #64748b);
        }

        .arrow {
          color: var(--border-color, #e2e8f0);
        }

        .projected {
          font-weight: 600;
          color: var(--text-primary, #1e293b);
        }

        .alert-item {
          padding: 10px;
          border-radius: 6px;
          margin-bottom: 8px;
        }

        .alert-item.critical {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
        }

        .alert-item.warning {
          background: rgba(245, 158, 11, 0.1);
          border: 1px solid rgba(245, 158, 11, 0.3);
        }

        .alert-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 4px;
        }

        .app-name {
          font-size: 12px;
          font-weight: 600;
          color: var(--text-primary, #1e293b);
        }

        .usage-badge {
          padding: 2px 6px;
          background: rgba(139, 92, 246, 0.1);
          color: #8b5cf6;
          border-radius: 4px;
          font-size: 10px;
          font-weight: 600;
        }

        .alert-details {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          color: var(--text-secondary, #64748b);
        }
      `}</style>
    </div>
  );
};

export default CapacityPlanning;
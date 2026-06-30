import React from 'react';
import { Shield, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface ComplianceScorecardProps {
  applications: any[];
}

const ComplianceScorecard: React.FC<ComplianceScorecardProps> = ({ applications }) => {
  // Calculate compliance metrics
  const compliantApps = applications.filter(app => app.compliance === 'Compliant');
  const nonCompliantApps = applications.filter(app => app.compliance === 'Non-Compliant');
  const partiallyCompliantApps = applications.filter(app => app.compliance === 'Partially Compliant');
  
  const overallScore = (compliantApps.length / applications.length) * 100;
  
  // Group by compliance requirements
  const requirements = [
    { name: 'SOC 2', compliant: 45, total: 50, critical: true },
    { name: 'ISO 27001', compliant: 38, total: 45, critical: true },
    { name: 'GDPR', compliant: 42, total: 42, critical: true },
    { name: 'HIPAA', compliant: 15, total: 18, critical: false },
    { name: 'PCI DSS', compliant: 8, total: 10, critical: false }
  ];

  const getStatusColor = (percentage: number) => {
    if (percentage >= 90) return '#10b981';
    if (percentage >= 70) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div className="compliance-scorecard-module">
      <div className="module-header">
        <Shield className="module-icon" size={20} style={{ color: '#3b82f6' }} />
        <h3>Compliance Scorecard</h3>
      </div>

      <div className="overall-score">
        <div className="score-circle" style={{ borderColor: getStatusColor(overallScore) }}>
          <span className="score-value">{overallScore.toFixed(0)}%</span>
          <span className="score-label">Compliant</span>
        </div>
        <div className="compliance-breakdown">
          <div className="status-item">
            <CheckCircle size={14} style={{ color: '#10b981' }} />
            <span>Compliant: {compliantApps.length}</span>
          </div>
          <div className="status-item">
            <AlertTriangle size={14} style={{ color: '#f59e0b' }} />
            <span>Partial: {partiallyCompliantApps.length}</span>
          </div>
          <div className="status-item">
            <XCircle size={14} style={{ color: '#ef4444' }} />
            <span>Non-Compliant: {nonCompliantApps.length}</span>
          </div>
        </div>
      </div>

      <div className="requirements-list">
        <h4>Compliance Requirements</h4>
        {requirements.map((req, index) => {
          const percentage = (req.compliant / req.total) * 100;
          return (
            <div key={index} className="requirement-item">
              <div className="requirement-info">
                <span className="requirement-name">
                  {req.name}
                  {req.critical && <span className="critical-badge">Critical</span>}
                </span>
                <span className="requirement-count">
                  {req.compliant}/{req.total} apps
                </span>
              </div>
              <div className="requirement-progress">
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ 
                      width: `${percentage}%`,
                      backgroundColor: getStatusColor(percentage)
                    }}
                  />
                </div>
                <span className="percentage" style={{ color: getStatusColor(percentage) }}>
                  {percentage.toFixed(0)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="compliance-actions">
        <button className="action-btn">
          View Full Compliance Report
        </button>
      </div>

      <style>{`
        .compliance-scorecard-module {
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

        .overall-score {
          display: flex;
          gap: 20px;
          margin-bottom: 25px;
          padding: 20px;
          background: var(--widget-background-hover, #f8fafc);
          border-radius: 10px;
        }

        .score-circle {
          width: 80px;
          height: 80px;
          border: 4px solid;
          border-radius: 50%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .score-value {
          font-size: 24px;
          font-weight: 700;
          color: var(--text-primary, #1e293b);
        }

        .score-label {
          font-size: 10px;
          color: var(--text-secondary, #64748b);
          text-transform: uppercase;
        }

        .compliance-breakdown {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 8px;
        }

        .status-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: var(--text-primary, #1e293b);
        }

        .requirements-list {
          flex: 1;
          overflow-y: auto;
        }

        .requirements-list h4 {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-secondary, #64748b);
          margin: 0 0 15px 0;
        }

        .requirement-item {
          margin-bottom: 15px;
        }

        .requirement-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .requirement-name {
          font-size: 13px;
          font-weight: 500;
          color: var(--text-primary, #1e293b);
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .critical-badge {
          padding: 2px 6px;
          background: #fee2e2;
          color: #dc2626;
          border-radius: 4px;
          font-size: 10px;
          font-weight: 600;
        }

        .requirement-count {
          font-size: 11px;
          color: var(--text-secondary, #64748b);
        }

        .requirement-progress {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .progress-bar {
          flex: 1;
          height: 6px;
          background: var(--border-color, #e2e8f0);
          border-radius: 3px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          transition: width 0.3s ease;
        }

        .percentage {
          font-size: 11px;
          font-weight: 600;
          min-width: 35px;
          text-align: right;
        }

        .compliance-actions {
          margin-top: 15px;
          padding-top: 15px;
          border-top: 1px solid var(--border-color, #e2e8f0);
        }

        .action-btn {
          width: 100%;
          padding: 10px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .action-btn:hover {
          background: #2563eb;
        }

        [data-theme="dark"] .critical-badge {
          background: rgba(239, 68, 68, 0.2);
          color: #f87171;
        }
      `}</style>
    </div>
  );
};

export default ComplianceScorecard;
import React from 'react';
import { AlertCircle, TrendingUp, Shield, AlertTriangle } from 'lucide-react';

interface RiskAssessmentProps {
  applications: any[];
}

const RiskAssessment: React.FC<RiskAssessmentProps> = ({ applications }) => {
  // Calculate risk metrics
  const highRiskApps = applications.filter(app => app.risk_level === 'High');
  const mediumRiskApps = applications.filter(app => app.risk_level === 'Medium');
  const lowRiskApps = applications.filter(app => app.risk_level === 'Low');
  
  // Risk factors
  const riskFactors = [
    { 
      factor: 'Outdated Software', 
      count: applications.filter(app => app.version_status === 'Outdated').length,
      severity: 'high',
      impact: 'Security vulnerabilities'
    },
    { 
      factor: 'No Backup Vendor', 
      count: 12,
      severity: 'medium',
      impact: 'Business continuity risk'
    },
    { 
      factor: 'Single Point of Failure', 
      count: 8,
      severity: 'high',
      impact: 'Operational disruption'
    },
    { 
      factor: 'Expired Contracts', 
      count: 5,
      severity: 'medium',
      impact: 'Legal & compliance risk'
    },
    { 
      factor: 'Data Privacy Concerns', 
      count: 3,
      severity: 'high',
      impact: 'Regulatory penalties'
    }
  ];

  const getSeverityColor = (severity: string) => {
    switch(severity) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#64748b';
    }
  };

  const overallRiskScore = Math.round(
    (highRiskApps.length * 3 + mediumRiskApps.length * 2 + lowRiskApps.length) / 
    (applications.length * 3) * 100
  );

  return (
    <div className="risk-assessment-module">
      <div className="module-header">
        <AlertCircle className="module-icon" size={20} style={{ color: '#ef4444' }} />
        <h3>Risk Assessment</h3>
      </div>

      <div className="risk-overview">
        <div className="risk-score">
          <div className="score-meter">
            <div className="score-bar" style={{ width: `${overallRiskScore}%` }}>
              <span className="score-text">{overallRiskScore}%</span>
            </div>
          </div>
          <span className="score-label">Overall Risk Level</span>
        </div>
        
        <div className="risk-distribution">
          <div className="risk-level high">
            <span className="count">{highRiskApps.length}</span>
            <span className="label">High Risk</span>
          </div>
          <div className="risk-level medium">
            <span className="count">{mediumRiskApps.length}</span>
            <span className="label">Medium</span>
          </div>
          <div className="risk-level low">
            <span className="count">{lowRiskApps.length}</span>
            <span className="label">Low Risk</span>
          </div>
        </div>
      </div>

      <div className="risk-factors">
        <h4>Top Risk Factors</h4>
        {riskFactors.map((risk, index) => (
          <div key={index} className="risk-factor-item">
            <div className="factor-header">
              <div className="factor-name">
                <AlertTriangle size={14} style={{ color: getSeverityColor(risk.severity) }} />
                <span>{risk.factor}</span>
              </div>
              <span className={`severity-badge ${risk.severity}`}>
                {risk.severity}
              </span>
            </div>
            <div className="factor-details">
              <span className="affected-count">{risk.count} applications affected</span>
              <span className="impact">{risk.impact}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="risk-actions">
        <button className="action-btn primary">
          <Shield size={16} />
          Mitigate Risks
        </button>
      </div>

      <style>{`
        .risk-assessment-module {
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

        .risk-overview {
          margin-bottom: 25px;
        }

        .risk-score {
          margin-bottom: 20px;
        }

        .score-meter {
          height: 30px;
          background: var(--border-color, #e2e8f0);
          border-radius: 15px;
          overflow: hidden;
          position: relative;
        }

        .score-bar {
          height: 100%;
          background: linear-gradient(90deg, #10b981, #f59e0b, #ef4444);
          border-radius: 15px;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          padding-right: 10px;
          transition: width 0.5s ease;
        }

        .score-text {
          font-size: 12px;
          font-weight: 600;
          color: white;
        }

        .score-label {
          display: block;
          margin-top: 8px;
          font-size: 11px;
          color: var(--text-secondary, #64748b);
          text-align: center;
        }

        .risk-distribution {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }

        .risk-level {
          padding: 12px;
          border-radius: 8px;
          text-align: center;
          border: 1px solid var(--border-color, #e2e8f0);
        }

        .risk-level.high {
          background: rgba(239, 68, 68, 0.1);
          border-color: rgba(239, 68, 68, 0.3);
        }

        .risk-level.medium {
          background: rgba(245, 158, 11, 0.1);
          border-color: rgba(245, 158, 11, 0.3);
        }

        .risk-level.low {
          background: rgba(16, 185, 129, 0.1);
          border-color: rgba(16, 185, 129, 0.3);
        }

        .risk-level .count {
          display: block;
          font-size: 20px;
          font-weight: 700;
          color: var(--text-primary, #1e293b);
          margin-bottom: 4px;
        }

        .risk-level .label {
          display: block;
          font-size: 11px;
          color: var(--text-secondary, #64748b);
        }

        .risk-factors {
          flex: 1;
          overflow-y: auto;
        }

        .risk-factors h4 {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-secondary, #64748b);
          margin: 0 0 15px 0;
        }

        .risk-factor-item {
          padding: 12px;
          background: var(--widget-background, white);
          border: 1px solid var(--border-color, #e2e8f0);
          border-radius: 8px;
          margin-bottom: 10px;
        }

        .factor-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .factor-name {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 500;
          color: var(--text-primary, #1e293b);
        }

        .severity-badge {
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .severity-badge.high {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
        }

        .severity-badge.medium {
          background: rgba(245, 158, 11, 0.1);
          color: #f59e0b;
        }

        .severity-badge.low {
          background: rgba(16, 185, 129, 0.1);
          color: #10b981;
        }

        .factor-details {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          color: var(--text-secondary, #64748b);
        }

        .risk-actions {
          margin-top: 15px;
          padding-top: 15px;
          border-top: 1px solid var(--border-color, #e2e8f0);
        }

        .action-btn {
          width: 100%;
          padding: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          border: none;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .action-btn.primary {
          background: #ef4444;
          color: white;
        }

        .action-btn.primary:hover {
          background: #dc2626;
        }
      `}</style>
    </div>
  );
};

export default RiskAssessment;
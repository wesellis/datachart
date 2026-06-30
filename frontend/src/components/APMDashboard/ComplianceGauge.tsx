import React from 'react';

interface ComplianceGaugeProps {
  complianceScore: number;
  highRisk: number;
  mediumRisk: number;
  lowRisk: number;
}

const ComplianceGauge: React.FC<ComplianceGaugeProps> = ({
  complianceScore,
  highRisk,
  mediumRisk,
  lowRisk
}) => {
  const getComplianceColor = (score: number) => {
    if (score >= 90) return '#10b981';
    if (score >= 75) return '#f59e0b';
    return '#ef4444';
  };

  const getComplianceStatus = (score: number) => {
    if (score >= 90) return 'Excellent';
    if (score >= 75) return 'Good';
    if (score >= 60) return 'Fair';
    return 'Needs Attention';
  };

  const totalApps = highRisk + mediumRisk + lowRisk;
  const highRiskPercentage = totalApps > 0 ? (highRisk / totalApps) * 100 : 0;
  const mediumRiskPercentage = totalApps > 0 ? (mediumRisk / totalApps) * 100 : 0;
  const lowRiskPercentage = totalApps > 0 ? (lowRisk / totalApps) * 100 : 0;

  return (
    <div className="compliance-gauge">
      <h3 className="gauge-title">Compliance & Risk Overview</h3>
      
      <div className="gauge-container">
        <div className="gauge-circle">
          <svg width="200" height="200" viewBox="0 0 200 200">
            {/* Background circle */}
            <circle
              cx="100"
              cy="100"
              r="90"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="15"
            />
            {/* Progress circle */}
            <circle
              cx="100"
              cy="100"
              r="90"
              fill="none"
              stroke={getComplianceColor(complianceScore)}
              strokeWidth="15"
              strokeDasharray={`${(complianceScore / 100) * 565} 565`}
              strokeLinecap="round"
              transform="rotate(-90 100 100)"
            />
          </svg>
          <div className="gauge-value">
            <span className="gauge-number">{complianceScore.toFixed(0)}</span>
            <span className="gauge-label">Compliance Score</span>
            <span className="gauge-status">{getComplianceStatus(complianceScore)}</span>
          </div>
        </div>
      </div>

      <div className="risk-breakdown">
        <h4>Risk Distribution</h4>
        <div className="risk-bars">
          <div className="risk-bar">
            <div className="risk-bar-label">
              <span>High Risk</span>
              <span className="risk-count">{highRisk}</span>
            </div>
            <div className="risk-bar-track">
              <div 
                className="risk-bar-fill high-risk" 
                style={{ width: `${highRiskPercentage}%` }}
              ></div>
            </div>
          </div>
          <div className="risk-bar">
            <div className="risk-bar-label">
              <span>Medium Risk</span>
              <span className="risk-count">{mediumRisk}</span>
            </div>
            <div className="risk-bar-track">
              <div 
                className="risk-bar-fill medium-risk" 
                style={{ width: `${mediumRiskPercentage}%` }}
              ></div>
            </div>
          </div>
          <div className="risk-bar">
            <div className="risk-bar-label">
              <span>Low Risk</span>
              <span className="risk-count">{lowRisk}</span>
            </div>
            <div className="risk-bar-track">
              <div 
                className="risk-bar-fill low-risk" 
                style={{ width: `${lowRiskPercentage}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComplianceGauge;
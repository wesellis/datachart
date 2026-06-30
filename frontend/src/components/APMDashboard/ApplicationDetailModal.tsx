import React from 'react';
import { Application } from '../../services/apmService';
import { X, TrendingUp, TrendingDown, Users, Shield, AlertCircle, DollarSign, Activity, Calendar, Award } from 'lucide-react';
import './ApplicationDetailModal.css';

interface ApplicationDetailModalProps {
  application: Application;
  isOpen: boolean;
  onClose: () => void;
}

const ApplicationDetailModal: React.FC<ApplicationDetailModalProps> = ({ application, isOpen, onClose }) => {
  if (!isOpen) return null;

  const formatCurrency = (value: number): string => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(2)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value.toFixed(0)}`;
  };

  const getDaysUntilRenewal = (renewalDate: string) => {
    const renewal = new Date(renewalDate);
    const today = new Date();
    const diffTime = renewal.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getRiskColor = (risk: string) => {
    switch (risk.toLowerCase()) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getComplianceColor = (score: number) => {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
  };

  const daysUntilRenewal = getDaysUntilRenewal(application.renewal_date);
  const costSavings = application.cost_2024 - application.cost_2025;
  const savingsPercentage = ((costSavings / application.cost_2024) * 100).toFixed(1);

  // Mock additional data for demo
  const monthlySpend = application.cost_2025 / 12;
  const userCount = Math.floor(Math.random() * 500) + 50;
  const incidentCount = Math.floor(Math.random() * 10);
  const lastReviewDate = new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toLocaleDateString();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div className="modal-vendor">{application.vendor_name}</div>
            <h2 className="modal-title">{application.name}</h2>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="modal-body">
          {/* Key Metrics Section */}
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-icon" style={{ backgroundColor: '#3b82f610' }}>
                <DollarSign size={20} style={{ color: '#3b82f6' }} />
              </div>
              <div className="metric-content">
                <div className="metric-label">2025 Spend</div>
                <div className="metric-value">{formatCurrency(application.cost_2025)}</div>
                <div className="metric-trend">
                  {costSavings > 0 ? (
                    <>
                      <TrendingDown size={16} style={{ color: '#10b981' }} />
                      <span style={{ color: '#10b981' }}>-{savingsPercentage}% YoY</span>
                    </>
                  ) : (
                    <>
                      <TrendingUp size={16} style={{ color: '#ef4444' }} />
                      <span style={{ color: '#ef4444' }}>+{Math.abs(parseFloat(savingsPercentage))}% YoY</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon" style={{ backgroundColor: '#10b98110' }}>
                <TrendingDown size={20} style={{ color: '#10b981' }} />
              </div>
              <div className="metric-content">
                <div className="metric-label">Total Savings</div>
                <div className="metric-value" style={{ color: '#10b981' }}>
                  {formatCurrency(Math.abs(costSavings))}
                </div>
                <div className="metric-trend">vs 2024 spend</div>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon" style={{ backgroundColor: '#8b5cf610' }}>
                <Activity size={20} style={{ color: '#8b5cf6' }} />
              </div>
              <div className="metric-content">
                <div className="metric-label">Utilization</div>
                <div className="metric-value">{application.utilization_rate}%</div>
                <div className="metric-trend">
                  {application.utilization_rate < 50 && (
                    <span style={{ color: '#ef4444' }}>Under-utilized</span>
                  )}
                  {application.utilization_rate >= 50 && application.utilization_rate < 80 && (
                    <span style={{ color: '#f59e0b' }}>Normal</span>
                  )}
                  {application.utilization_rate >= 80 && (
                    <span style={{ color: '#10b981' }}>Well-utilized</span>
                  )}
                </div>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon" style={{ backgroundColor: '#f5990b10' }}>
                <Users size={20} style={{ color: '#f59e0b' }} />
              </div>
              <div className="metric-content">
                <div className="metric-label">Active Users</div>
                <div className="metric-value">{userCount}</div>
                <div className="metric-trend">across organization</div>
              </div>
            </div>
          </div>

          {/* Status and Compliance Section */}
          <div className="status-section">
            <h3>Status & Compliance</h3>
            <div className="status-grid">
              <div className="status-item">
                <span className="status-label">Risk Level</span>
                <div className="status-badge" style={{ backgroundColor: getRiskColor(application.risk_level) + '20', color: getRiskColor(application.risk_level) }}>
                  {application.risk_level}
                </div>
              </div>

              <div className="status-item">
                <span className="status-label">Patch Status</span>
                <div className="status-badge" style={{ 
                  backgroundColor: application.patch_status === 'current' ? '#10b98120' : '#f5990b20',
                  color: application.patch_status === 'current' ? '#10b981' : '#f59e0b'
                }}>
                  {application.patch_status}
                </div>
              </div>

              <div className="status-item">
                <span className="status-label">Renewal</span>
                <div className="status-badge" style={{
                  backgroundColor: daysUntilRenewal <= 30 ? '#ef444420' : '#3b82f620',
                  color: daysUntilRenewal <= 30 ? '#ef4444' : '#3b82f6'
                }}>
                  {daysUntilRenewal > 0 ? `${daysUntilRenewal} days` : 'Expired'}
                </div>
              </div>

              <div className="status-item">
                <span className="status-label">Incidents (90d)</span>
                <div className="status-badge" style={{
                  backgroundColor: incidentCount > 5 ? '#ef444420' : '#10b98120',
                  color: incidentCount > 5 ? '#ef4444' : '#10b981'
                }}>
                  {incidentCount}
                </div>
              </div>
            </div>

            <div className="compliance-detail">
              <div className="compliance-header">
                <span>Compliance Score</span>
                <span style={{ color: getComplianceColor(application.compliance_score), fontWeight: 600 }}>
                  {application.compliance_score}%
                </span>
              </div>
              <div className="compliance-bar-detail">
                <div 
                  className="compliance-fill-detail" 
                  style={{ 
                    width: `${application.compliance_score}%`,
                    backgroundColor: getComplianceColor(application.compliance_score)
                  }}
                />
              </div>
            </div>
          </div>

          {/* Details Section */}
          <div className="details-section">
            <h3>Application Details</h3>
            <div className="details-grid">
              <div className="detail-item">
                <span className="detail-label">Owner</span>
                <span className="detail-value">{application.owner_name}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Department</span>
                <span className="detail-value">{application.department}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Contract Type</span>
                <span className="detail-value">Enterprise License</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Monthly Cost</span>
                <span className="detail-value">{formatCurrency(monthlySpend)}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Last Review</span>
                <span className="detail-value">{lastReviewDate}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Renewal Date</span>
                <span className="detail-value">{new Date(application.renewal_date).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Cost Breakdown */}
          <div className="cost-section">
            <h3>Cost Analysis</h3>
            <div className="cost-breakdown">
              <div className="cost-item">
                <span>2024 Spend</span>
                <span>{formatCurrency(application.cost_2024)}</span>
              </div>
              <div className="cost-item">
                <span>2025 Projection</span>
                <span>{formatCurrency(application.cost_2025)}</span>
              </div>
              <div className="cost-item highlight">
                <span>Potential Savings</span>
                <span style={{ color: '#10b981' }}>{formatCurrency(Math.abs(costSavings))}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="modal-actions">
            <button className="action-btn secondary" onClick={onClose}>
              Close
            </button>
            <button className="action-btn primary">
              <Calendar size={16} />
              Schedule Review
            </button>
            <button className="action-btn primary">
              <Shield size={16} />
              View Full Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplicationDetailModal;

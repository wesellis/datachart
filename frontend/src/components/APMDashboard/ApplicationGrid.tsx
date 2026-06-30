import React, { useState } from 'react';
import { Application } from '../../services/apmService';
import ApplicationDetailModal from './ApplicationDetailModal';

interface ApplicationGridProps {
  applications: Application[];
  showAll?: boolean;
}

const ApplicationGrid: React.FC<ApplicationGridProps> = ({ applications, showAll = false }) => {
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Show only 12 cards initially, or all if showAll is true
  const displayedApplications = showAll ? applications : applications.slice(0, 12);
  
  const formatCurrency = (value: number): string => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(2)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value.toFixed(0)}`;
  };

  const getPatchStatusColor = (status: string) => {
    switch (status) {
      case 'current':
        return 'status-current';
      case 'pending':
        return 'status-pending';
      case 'overdue':
        return 'status-overdue';
      default:
        return 'status-unknown';
    }
  };

  const getRiskLevelColor = (risk: string) => {
    switch (risk.toLowerCase()) {
      case 'high':
        return 'risk-high';
      case 'medium':
        return 'risk-medium';
      case 'low':
        return 'risk-low';
      default:
        return 'risk-unknown';
    }
  };

  const getDaysUntilRenewal = (renewalDate: string) => {
    const renewal = new Date(renewalDate);
    const today = new Date();
    const diffTime = renewal.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleCardClick = (app: Application) => {
    setSelectedApp(app);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedApp(null);
  };

  return (
    <>
      <div className="application-grid">
        {displayedApplications.map((app) => {
          const daysUntilRenewal = getDaysUntilRenewal(app.renewal_date);
          const renewalUrgent = daysUntilRenewal <= 30;
          
          return (
            <div 
              key={app.id} 
              className="app-card clickable" 
              onClick={() => handleCardClick(app)}
              style={{ cursor: 'pointer' }}
            >
              <div className="app-header">
                <div className="app-vendor">{app.vendor_name}</div>
                <div className={`app-risk ${getRiskLevelColor(app.risk_level)}`}>
                  {app.risk_level}
                </div>
              </div>
              
              <div className="app-name">{app.name}</div>
              
              <div className="app-metrics">
                <div className="app-metric">
                  <span className="metric-label">2025 Cost</span>
                  <span className="metric-value">{formatCurrency(app.cost_2025)}</span>
                </div>
                <div className="app-metric">
                  <span className="metric-label">Savings</span>
                  <span className="metric-value savings">
                    {formatCurrency(app.cost_2024 - app.cost_2025)}
                  </span>
                </div>
              </div>
              
              <div className="app-details">
                <div className="app-detail">
                  <span className="detail-label">Owner:</span>
                  <span className="detail-value">{app.owner_name}</span>
                </div>
                <div className="app-detail">
                  <span className="detail-label">Department:</span>
                  <span className="detail-value">{app.department}</span>
                </div>
                <div className="app-detail">
                  <span className="detail-label">Utilization:</span>
                  <span className="detail-value">{app.utilization_rate.toFixed(0)}%</span>
                </div>
              </div>
              
              <div className="app-status">
                <div className={`patch-status ${getPatchStatusColor(app.patch_status)}`}>
                  <span className="status-icon">🔒</span>
                  <span className="status-text">{app.patch_status}</span>
                </div>
                <div className={`renewal-status ${renewalUrgent ? 'urgent' : ''}`}>
                  <span className="status-icon">📅</span>
                  <span className="status-text">
                    {daysUntilRenewal > 0 ? `${daysUntilRenewal}d` : 'Expired'}
                  </span>
                </div>
              </div>
              
              <div className="app-compliance">
                <div className="compliance-bar">
                  <div 
                    className="compliance-fill" 
                    style={{ 
                      width: `${app.compliance_score}%`,
                      backgroundColor: app.compliance_score >= 80 ? '#10b981' : 
                                     app.compliance_score >= 60 ? '#f59e0b' : '#ef4444'
                    }}
                  ></div>
                </div>
                <span className="compliance-score">{app.compliance_score}%</span>
              </div>
            </div>
          );
        })}
      </div>
      
      {selectedApp && (
        <ApplicationDetailModal
          application={selectedApp}
          isOpen={modalOpen}
          onClose={handleCloseModal}
        />
      )}
    </>
  );
};

export default ApplicationGrid;

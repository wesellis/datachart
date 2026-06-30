import React from 'react';

interface RenewalTimelineProps {
  renewals30: number;
  renewals60: number;
  renewals90: number;
  cost30: number;
}

const RenewalTimeline: React.FC<RenewalTimelineProps> = ({
  renewals30,
  renewals60,
  renewals90,
  cost30
}) => {
  const formatCurrency = (value: number): string => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(2)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value.toFixed(0)}`;
  };

  const timelineData = [
    {
      period: 'Next 30 Days',
      count: renewals30,
      cost: cost30,
      urgency: 'high',
      icon: '🔴'
    },
    {
      period: '31-60 Days',
      count: renewals60 - renewals30,
      cost: 0, // We don't have this data yet
      urgency: 'medium',
      icon: '🟡'
    },
    {
      period: '61-90 Days',
      count: renewals90 - renewals60,
      cost: 0, // We don't have this data yet
      urgency: 'low',
      icon: '🟢'
    }
  ];

  return (
    <div className="renewal-timeline">
      <h3 className="timeline-title">Upcoming Renewals</h3>
      
      <div className="timeline-summary">
        <div className="summary-stat">
          <span className="summary-value">{renewals90}</span>
          <span className="summary-label">Total Renewals</span>
        </div>
        <div className="summary-stat highlight">
          <span className="summary-value">{formatCurrency(cost30)}</span>
          <span className="summary-label">30-Day Value</span>
        </div>
      </div>

      <div className="timeline-items">
        {timelineData.map((item, index) => (
          <div key={index} className={`timeline-item urgency-${item.urgency}`}>
            <div className="timeline-icon">{item.icon}</div>
            <div className="timeline-content">
              <div className="timeline-period">{item.period}</div>
              <div className="timeline-details">
                <span className="timeline-count">{item.count} applications</span>
                {item.cost > 0 && (
                  <span className="timeline-cost">{formatCurrency(item.cost)}</span>
                )}
              </div>
            </div>
            <div className="timeline-action">
              <button className="action-btn">Review →</button>
            </div>
          </div>
        ))}
      </div>

      <div className="timeline-footer">
        <div className="auto-renewal-warning">
          <span className="warning-icon">⚠️</span>
          <span className="warning-text">
            Multiple auto-renewals detected. Review contracts to optimize spend.
          </span>
        </div>
      </div>
    </div>
  );
};

export default RenewalTimeline;
import React from 'react';
import { TrendingUp, Users, AlertCircle, ArrowRight } from 'lucide-react';

interface UsageOptimizerProps {
  applications: any[];
}

const UsageOptimizer: React.FC<UsageOptimizerProps> = ({ applications }) => {
  // Identify underutilized applications
  const underutilized = applications
    .filter(app => app.utilization < 50)
    .sort((a, b) => b.cost_2025 - a.cost_2025)
    .slice(0, 5);

  const totalWaste = underutilized.reduce((sum, app) => {
    const waste = app.cost_2025 * ((100 - app.utilization) / 100);
    return sum + waste;
  }, 0);

  return (
    <div className="usage-optimizer-module">
      <div className="module-header">
        <TrendingUp className="module-icon" size={20} style={{ color: '#f59e0b' }} />
        <h3>Usage Optimization</h3>
      </div>

      <div className="optimization-summary">
        <div className="waste-amount">
          <span className="label">Potential Savings</span>
          <span className="value">${(totalWaste / 1000).toFixed(0)}K</span>
        </div>
        <div className="app-count">
          <span className="label">Underutilized Apps</span>
          <span className="value">{underutilized.length}</span>
        </div>
      </div>

      <div className="underutilized-list">
        <h4>Top Optimization Opportunities</h4>
        {underutilized.map((app, index) => {
          const waste = app.cost_2025 * ((100 - app.utilization) / 100);
          return (
            <div key={index} className="optimization-item">
              <div className="app-info">
                <span className="app-name">{app.name}</span>
                <div className="usage-indicator">
                  <Users size={14} />
                  <span>{app.utilization}% utilized</span>
                </div>
              </div>
              <div className="optimization-metrics">
                <span className="potential-savings">
                  ${(waste / 1000).toFixed(1)}K waste
                </span>
                <button className="optimize-btn">
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="optimization-actions">
        <button className="action-btn primary">
          <AlertCircle size={16} />
          Review All Underutilized
        </button>
      </div>

      <style>{`
        .usage-optimizer-module {
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

        .optimization-summary {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          margin-bottom: 20px;
          padding: 15px;
          background: var(--widget-background-hover, #f8fafc);
          border-radius: 8px;
        }

        .waste-amount,
        .app-count {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .label {
          font-size: 11px;
          color: var(--text-secondary, #64748b);
          text-transform: uppercase;
        }

        .value {
          font-size: 20px;
          font-weight: 700;
          color: var(--text-primary, #1e293b);
        }

        .underutilized-list {
          flex: 1;
          overflow-y: auto;
        }

        .underutilized-list h4 {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-secondary, #64748b);
          margin: 0 0 15px 0;
        }

        .optimization-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px;
          background: var(--widget-background, white);
          border: 1px solid var(--border-color, #e2e8f0);
          border-radius: 8px;
          margin-bottom: 10px;
          transition: all 0.2s;
        }

        .optimization-item:hover {
          background: var(--widget-background-hover, #f8fafc);
          border-color: #cbd5e1;
        }

        .app-info {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .app-name {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-primary, #1e293b);
        }

        .usage-indicator {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 11px;
          color: var(--text-secondary, #64748b);
        }

        .optimization-metrics {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .potential-savings {
          font-size: 13px;
          font-weight: 600;
          color: #f59e0b;
        }

        .optimize-btn {
          padding: 4px;
          background: transparent;
          border: none;
          color: var(--text-secondary, #64748b);
          cursor: pointer;
          transition: all 0.2s;
        }

        .optimize-btn:hover {
          color: #3b82f6;
        }

        .optimization-actions {
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
          background: #f59e0b;
          color: white;
        }

        .action-btn.primary:hover {
          background: #d97706;
        }
      `}</style>
    </div>
  );
};

export default UsageOptimizer;
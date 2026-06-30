import React from 'react';
import { TrendingUp, DollarSign, Calendar, Target } from 'lucide-react';

interface BudgetForecastProps {
  monthlyTrend: any[];
  applications: any[];
}

const BudgetForecast: React.FC<BudgetForecastProps> = ({ monthlyTrend, applications }) => {
  // Calculate forecast based on trend
  const currentMonth = new Date().getMonth();
  const ytdSpend = monthlyTrend
    .slice(0, currentMonth + 1)
    .reduce((sum, month) => sum + month.spend_2025, 0);
  
  const averageMonthlySpend = ytdSpend / (currentMonth + 1);
  const projectedAnnualSpend = averageMonthlySpend * 12;
  const budget2025 = 15000000; // $15M budget
  const variance = budget2025 - projectedAnnualSpend;
  const variancePercent = (variance / budget2025) * 100;

  // Quarterly projections
  const quarters = [
    { name: 'Q1', actual: 3500000, projected: 3750000, budget: 3750000 },
    { name: 'Q2', actual: 3200000, projected: 3750000, budget: 3750000 },
    { name: 'Q3', actual: null, projected: 3800000, budget: 3750000 },
    { name: 'Q4', actual: null, projected: 3900000, budget: 3750000 }
  ];

  // Department budgets
  const departmentBudgets = [
    { name: 'Engineering', allocated: 5000000, spent: 2100000, remaining: 2900000 },
    { name: 'Sales', allocated: 3000000, spent: 1200000, remaining: 1800000 },
    { name: 'Marketing', allocated: 2500000, spent: 1100000, remaining: 1400000 },
    { name: 'Operations', allocated: 2000000, spent: 900000, remaining: 1100000 },
    { name: 'HR', allocated: 1500000, spent: 600000, remaining: 900000 }
  ];

  return (
    <div className="budget-forecast-module">
      <div className="module-header">
        <TrendingUp className="module-icon" size={20} style={{ color: '#10b981' }} />
        <h3>Budget Forecast</h3>
      </div>

      <div className="forecast-summary">
        <div className="summary-item">
          <DollarSign size={16} style={{ color: '#3b82f6' }} />
          <div>
            <span className="label">2025 Budget</span>
            <span className="value">${(budget2025 / 1000000).toFixed(1)}M</span>
          </div>
        </div>
        <div className="summary-item">
          <Target size={16} style={{ color: variancePercent > 0 ? '#10b981' : '#ef4444' }} />
          <div>
            <span className="label">Projected Spend</span>
            <span className="value">${(projectedAnnualSpend / 1000000).toFixed(1)}M</span>
          </div>
        </div>
        <div className="summary-item variance">
          <div>
            <span className="label">Variance</span>
            <span className={`value ${variancePercent > 0 ? 'positive' : 'negative'}`}>
              {variancePercent > 0 ? '+' : ''}{variancePercent.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      <div className="quarterly-forecast">
        <h4>Quarterly Breakdown</h4>
        <div className="quarters-grid">
          {quarters.map((quarter, index) => (
            <div key={index} className="quarter-card">
              <span className="quarter-name">{quarter.name}</span>
              <div className="quarter-values">
                {quarter.actual !== null ? (
                  <span className="actual">${(quarter.actual / 1000000).toFixed(1)}M</span>
                ) : (
                  <span className="projected">${(quarter.projected / 1000000).toFixed(1)}M*</span>
                )}
              </div>
              <div className="quarter-variance">
                {((quarter.actual || quarter.projected) - quarter.budget) > 0 ? (
                  <span className="over">Over budget</span>
                ) : (
                  <span className="under">On track</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="department-budgets">
        <h4>Department Budgets</h4>
        {departmentBudgets.slice(0, 3).map((dept, index) => {
          const percentSpent = (dept.spent / dept.allocated) * 100;
          return (
            <div key={index} className="department-item">
              <div className="department-info">
                <span className="department-name">{dept.name}</span>
                <span className="budget-amount">
                  ${(dept.spent / 1000000).toFixed(1)}M / ${(dept.allocated / 1000000).toFixed(1)}M
                </span>
              </div>
              <div className="budget-progress">
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ 
                      width: `${percentSpent}%`,
                      backgroundColor: percentSpent > 75 ? '#ef4444' : percentSpent > 50 ? '#f59e0b' : '#10b981'
                    }}
                  />
                </div>
                <span className="percent">{percentSpent.toFixed(0)}%</span>
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        .budget-forecast-module {
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

        .forecast-summary {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-bottom: 25px;
        }

        .summary-item {
          padding: 12px;
          background: var(--widget-background-hover, #f8fafc);
          border-radius: 8px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .summary-item > div {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .label {
          font-size: 11px;
          color: var(--text-secondary, #64748b);
        }

        .value {
          font-size: 16px;
          font-weight: 700;
          color: var(--text-primary, #1e293b);
        }

        .value.positive {
          color: #10b981;
        }

        .value.negative {
          color: #ef4444;
        }

        .quarterly-forecast {
          margin-bottom: 20px;
        }

        .quarterly-forecast h4,
        .department-budgets h4 {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-secondary, #64748b);
          margin: 0 0 12px 0;
        }

        .quarters-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
        }

        .quarter-card {
          padding: 10px;
          background: var(--widget-background, white);
          border: 1px solid var(--border-color, #e2e8f0);
          border-radius: 6px;
          text-align: center;
        }

        .quarter-name {
          display: block;
          font-size: 11px;
          font-weight: 600;
          color: var(--text-secondary, #64748b);
          margin-bottom: 6px;
        }

        .quarter-values {
          margin-bottom: 4px;
        }

        .actual {
          font-size: 14px;
          font-weight: 700;
          color: var(--text-primary, #1e293b);
        }

        .projected {
          font-size: 14px;
          font-weight: 700;
          color: var(--text-secondary, #64748b);
          font-style: italic;
        }

        .quarter-variance {
          font-size: 10px;
        }

        .over {
          color: #ef4444;
        }

        .under {
          color: #10b981;
        }

        .department-budgets {
          flex: 1;
          overflow-y: auto;
        }

        .department-item {
          margin-bottom: 12px;
        }

        .department-info {
          display: flex;
          justify-content: space-between;
          margin-bottom: 6px;
        }

        .department-name {
          font-size: 12px;
          font-weight: 500;
          color: var(--text-primary, #1e293b);
        }

        .budget-amount {
          font-size: 11px;
          color: var(--text-secondary, #64748b);
        }

        .budget-progress {
          display: flex;
          align-items: center;
          gap: 8px;
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

        .percent {
          font-size: 10px;
          font-weight: 600;
          color: var(--text-secondary, #64748b);
          min-width: 30px;
        }
      `}</style>
    </div>
  );
};

export default BudgetForecast;
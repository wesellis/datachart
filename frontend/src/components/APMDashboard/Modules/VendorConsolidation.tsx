import React from 'react';
import { GitMerge, DollarSign, Package, TrendingDown } from 'lucide-react';

interface VendorConsolidationProps {
  applications: any[];
  vendorTotals: Record<string, any>;
}

const VendorConsolidation: React.FC<VendorConsolidationProps> = ({ applications, vendorTotals }) => {
  // Find vendors with similar products that could be consolidated
  const consolidationOpportunities: Array<{
    category: string;
    vendorCount: number;
    appCount: number;
    totalSpend: number;
    potentialSavings: number;
  }> = [];
  
  // Group applications by category
  const categoryGroups: Record<string, any[]> = {};
  applications.forEach(app => {
    const category = app.category || 'Other';
    if (!categoryGroups[category]) categoryGroups[category] = [];
    categoryGroups[category].push(app);
  });

  // Find categories with multiple vendors
  Object.entries(categoryGroups).forEach(([category, apps]) => {
    const vendorCount = new Set(apps.map(a => a.vendor)).size;
    if (vendorCount > 1 && apps.length > 1) {
      const totalSpend = apps.reduce((sum, app) => sum + app.cost_2025, 0);
      const potentialSavings = totalSpend * 0.15; // Assume 15% savings from consolidation
      consolidationOpportunities.push({
        category,
        vendorCount,
        appCount: apps.length,
        totalSpend,
        potentialSavings
      });
    }
  });

  // Sort by potential savings
  consolidationOpportunities.sort((a, b) => b.potentialSavings - a.potentialSavings);
  const topOpportunities = consolidationOpportunities.slice(0, 4);
  const totalPotentialSavings = consolidationOpportunities.reduce((sum, opp) => sum + opp.potentialSavings, 0);

  return (
    <div className="vendor-consolidation-module">
      <div className="module-header">
        <GitMerge className="module-icon" size={20} style={{ color: '#8b5cf6' }} />
        <h3>Vendor Consolidation</h3>
      </div>

      <div className="consolidation-summary">
        <div className="summary-card">
          <DollarSign size={16} style={{ color: '#10b981' }} />
          <div>
            <span className="label">Potential Annual Savings</span>
            <span className="value">${(totalPotentialSavings / 1000).toFixed(0)}K</span>
          </div>
        </div>
        <div className="summary-card">
          <Package size={16} style={{ color: '#3b82f6' }} />
          <div>
            <span className="label">Consolidation Opportunities</span>
            <span className="value">{consolidationOpportunities.length}</span>
          </div>
        </div>
      </div>

      <div className="opportunities-list">
        <h4>Top Consolidation Opportunities</h4>
        {topOpportunities.map((opp, index) => (
          <div key={index} className="opportunity-item">
            <div className="opportunity-info">
              <span className="category-name">{opp.category}</span>
              <div className="opportunity-details">
                <span className="detail">{opp.vendorCount} vendors</span>
                <span className="separator">•</span>
                <span className="detail">{opp.appCount} apps</span>
              </div>
            </div>
            <div className="opportunity-savings">
              <TrendingDown size={14} style={{ color: '#10b981' }} />
              <span>${(opp.potentialSavings / 1000).toFixed(1)}K</span>
            </div>
          </div>
        ))}
      </div>

      <div className="consolidation-actions">
        <button className="action-btn">
          Start Consolidation Analysis
        </button>
      </div>

      <style>{`
        .vendor-consolidation-module {
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

        .consolidation-summary {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
          margin-bottom: 20px;
        }

        .summary-card {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: var(--widget-background-hover, #f8fafc);
          border-radius: 8px;
        }

        .summary-card > div {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .label {
          font-size: 11px;
          color: var(--text-secondary, #64748b);
        }

        .value {
          font-size: 18px;
          font-weight: 700;
          color: var(--text-primary, #1e293b);
        }

        .opportunities-list {
          flex: 1;
          overflow-y: auto;
        }

        .opportunities-list h4 {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-secondary, #64748b);
          margin: 0 0 15px 0;
        }

        .opportunity-item {
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

        .opportunity-item:hover {
          background: var(--widget-background-hover, #f8fafc);
          border-color: #8b5cf6;
        }

        .opportunity-info {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .category-name {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-primary, #1e293b);
        }

        .opportunity-details {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 11px;
          color: var(--text-secondary, #64748b);
        }

        .separator {
          color: var(--border-color, #e2e8f0);
        }

        .opportunity-savings {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 14px;
          font-weight: 600;
          color: #10b981;
        }

        .consolidation-actions {
          margin-top: 15px;
          padding-top: 15px;
          border-top: 1px solid var(--border-color, #e2e8f0);
        }

        .action-btn {
          width: 100%;
          padding: 10px;
          background: #8b5cf6;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .action-btn:hover {
          background: #7c3aed;
        }
      `}</style>
    </div>
  );
};

export default VendorConsolidation;
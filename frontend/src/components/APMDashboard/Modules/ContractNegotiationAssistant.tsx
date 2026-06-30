import React, { useState, useEffect } from 'react';
import { TrendingUp, AlertCircle, DollarSign, Target, Calendar, ChevronRight } from 'lucide-react';

interface ContractNegotiationProps {
  data?: any;
  config?: {
    showDetails?: boolean;
    autoRefresh?: boolean;
  };
}

interface NegotiationOpportunity {
  vendor: string;
  currentSpend: number;
  leverage: number;
  suggestedDiscount: number;
  potentialSavings: number;
  renewalDate: string;
  strategy: string;
  historicalDiscounts: number[];
}

const ContractNegotiationAssistant: React.FC<ContractNegotiationProps> = ({ data, config }) => {
  const [selectedVendor, setSelectedVendor] = useState<string | null>(null);
  const [opportunities, setOpportunities] = useState<NegotiationOpportunity[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Check for dark mode
    const checkDarkMode = () => {
      setIsDarkMode(document.documentElement.getAttribute('data-theme') === 'dark');
    };
    
    checkDarkMode();
    
    // Watch for theme changes
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    // Generate negotiation opportunities from data
    const generateOpportunities = () => {
      const topVendors = Object.entries(data?.vendor_totals || {})
        .sort((a: any, b: any) => b[1].total_spend - a[1].total_spend)
        .slice(0, 5)
        .map(([vendor, details]: any) => {
          const spend = details.total_spend;
          const leverage = calculateLeverage(spend, details.app_count);
          const suggestedDiscount = calculateSuggestedDiscount(leverage, spend);
          
          return {
            vendor,
            currentSpend: spend,
            leverage,
            suggestedDiscount,
            potentialSavings: spend * (suggestedDiscount / 100),
            renewalDate: getNextRenewalDate(),
            strategy: getStrategy(leverage),
            historicalDiscounts: [12, 15, 18, 22, 25] // Mock historical data
          };
        });
      
      setOpportunities(opportunities);
    };

    if (data) {
      generateOpportunities();
    }
  }, [data]);

  const calculateLeverage = (spend: number, appCount: number): number => {
    // Higher spend and more apps = more leverage
    const spendScore = Math.min(spend / 100000, 10) * 10;
    const appScore = Math.min(appCount / 10, 10) * 5;
    return Math.round(spendScore + appScore + Math.random() * 20);
  };

  const calculateSuggestedDiscount = (leverage: number, spend: number): number => {
    if (leverage > 70) return 35;
    if (leverage > 50) return 25;
    if (leverage > 30) return 15;
    return 10;
  };

  const getStrategy = (leverage: number): string => {
    if (leverage > 70) return "Aggressive - Threaten to switch vendors";
    if (leverage > 50) return "Strong - Bundle for volume discount";
    if (leverage > 30) return "Moderate - Focus on multi-year commitment";
    return "Conservative - Negotiate payment terms";
  };

  const getNextRenewalDate = (): string => {
    const days = Math.floor(Math.random() * 180) + 30;
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toLocaleDateString();
  };

  const formatCurrency = (value: number): string => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(2)}M`;
    }
    return `$${(value / 1000).toFixed(0)}K`;
  };

  return (
    <div style={{
      background: 'var(--widget-background, white)',
      borderRadius: '12px',
      padding: '20px',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      color: 'var(--text-primary, #1e293b)'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <h3 style={{
          fontSize: '16px',
          fontWeight: 600,
          color: 'var(--text-primary, #1e293b)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Target size={20} style={{ color: '#3b82f6' }} />
          Contract Negotiation Assistant
        </h3>
        <div style={{
          padding: '4px 8px',
          background: isDarkMode ? 'rgba(251, 191, 36, 0.2)' : '#fef3c7',
          borderRadius: '6px',
          fontSize: '12px',
          fontWeight: 500,
          color: isDarkMode ? '#fbbf24' : '#92400e'
        }}>
          {opportunities.length} Opportunities
        </div>
      </div>

      {/* Summary Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '12px',
        marginBottom: '20px'
      }}>
        <div style={{
          padding: '12px',
          background: isDarkMode ? 'rgba(59, 130, 246, 0.15)' : '#f0f9ff',
          borderRadius: '8px',
          borderLeft: '3px solid #3b82f6'
        }}>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--text-primary, #1e293b)' }}>
            {formatCurrency(opportunities.reduce((sum, o) => sum + o.potentialSavings, 0))}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary, #64748b)' }}>Total Savings Potential</div>
        </div>
        <div style={{
          padding: '12px',
          background: isDarkMode ? 'rgba(16, 185, 129, 0.15)' : '#f0fdf4',
          borderRadius: '8px',
          borderLeft: '3px solid #10b981'
        }}>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--text-primary, #1e293b)' }}>
            {Math.round(opportunities.reduce((sum, o) => sum + o.leverage, 0) / opportunities.length || 0)}%
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary, #64748b)' }}>Avg Leverage Score</div>
        </div>
        <div style={{
          padding: '12px',
          background: isDarkMode ? 'rgba(234, 179, 8, 0.15)' : '#fefce8',
          borderRadius: '8px',
          borderLeft: '3px solid #eab308'
        }}>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--text-primary, #1e293b)' }}>
            {opportunities.filter(o => o.leverage > 50).length}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary, #64748b)' }}>High Priority</div>
        </div>
      </div>

      {/* Vendor Opportunities */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {opportunities.map((opp, index) => (
          <div
            key={index}
            style={{
              padding: '12px',
              marginBottom: '8px',
              border: '1px solid ' + (isDarkMode ? 'var(--border-color, #374151)' : '#e2e8f0'),
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              background: selectedVendor === opp.vendor ? 'var(--widget-background-hover, #f8fafc)' : 'var(--widget-background, white)'
            }}
            onClick={() => setSelectedVendor(selectedVendor === opp.vendor ? null : opp.vendor)}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#3b82f6';
              e.currentTarget.style.transform = 'translateX(4px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#e2e8f0';
              e.currentTarget.style.transform = 'translateX(0)';
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 500, color: 'var(--text-primary, #1e293b)', marginBottom: '4px' }}>
                  {opp.vendor}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary, #64748b)' }}>
                  Current: {formatCurrency(opp.currentSpend)} • Renewal: {opp.renewalDate}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{
                  fontSize: '16px',
                  fontWeight: 'bold',
                  color: opp.leverage > 50 ? '#10b981' : '#f59e0b'
                }}>
                  {opp.leverage}% leverage
                </div>
                <div style={{ fontSize: '12px', color: '#10b981', fontWeight: 500 }}>
                  Save {formatCurrency(opp.potentialSavings)}
                </div>
              </div>
            </div>

            {selectedVendor === opp.vendor && (
              <div style={{
                marginTop: '12px',
                paddingTop: '12px',
                borderTop: '1px solid #e2e8f0'
              }}>
                <div style={{ marginBottom: '8px' }}>
                  <strong style={{ fontSize: '12px', color: 'var(--text-secondary, #64748b)' }}>NEGOTIATION STRATEGY:</strong>
                  <div style={{ fontSize: '13px', color: 'var(--text-primary, #1e293b)', marginTop: '4px' }}>
                    {opp.strategy}
                  </div>
                </div>
                
                <div style={{ marginBottom: '8px' }}>
                  <strong style={{ fontSize: '12px', color: 'var(--text-secondary, #64748b)' }}>SUGGESTED OPENING:</strong>
                  <div style={{ fontSize: '13px', color: 'var(--text-primary, #1e293b)', marginTop: '4px' }}>
                    Request {opp.suggestedDiscount}% discount based on {formatCurrency(opp.currentSpend)} annual spend
                  </div>
                </div>

                <div style={{ marginBottom: '8px' }}>
                  <strong style={{ fontSize: '12px', color: 'var(--text-secondary, #64748b)' }}>HISTORICAL DISCOUNTS:</strong>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                    {opp.historicalDiscounts.map((discount, i) => (
                      <span key={i} style={{
                        padding: '2px 6px',
                        background: 'var(--badge-background, #f1f5f9)',
                        borderRadius: '4px',
                        fontSize: '11px'
                      }}>
                        {discount}%
                      </span>
                    ))}
                  </div>
                </div>

                <button style={{
                  marginTop: '8px',
                  padding: '6px 12px',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  Generate Negotiation Plan
                  <ChevronRight size={14} />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Action Button */}
      <div style={{
        marginTop: '16px',
        paddingTop: '16px',
        borderTop: '1px solid #e2e8f0'
      }}>
        <button style={{
          width: '100%',
          padding: '10px',
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: 500,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px'
        }}>
          <DollarSign size={16} />
          Start Negotiation Workflow
        </button>
      </div>
    </div>
  );
};

export default ContractNegotiationAssistant;
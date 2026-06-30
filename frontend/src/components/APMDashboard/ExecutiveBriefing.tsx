import React, { useState, useEffect } from 'react';
import { 
  Calendar, TrendingUp, TrendingDown, AlertCircle, 
  CheckCircle, Clock, FileText, Printer, Download,
  ChevronRight, Sun, Moon, Coffee, Briefcase
} from 'lucide-react';
import { APMDashboardData } from '../../services/apmService';
import './ExecutiveBriefing.css';

interface BriefingItem {
  type: 'success' | 'warning' | 'critical' | 'info';
  title: string;
  detail: string;
  value?: string;
  action?: string;
}

interface ExecutiveBriefingProps {
  data: APMDashboardData;
  onClose?: () => void;
}

const ExecutiveBriefing: React.FC<ExecutiveBriefingProps> = ({ data, onClose }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [greeting, setGreeting] = useState('');
  const [briefingItems, setBriefingItems] = useState<BriefingItem[]>([]);
  const [keyDecisions, setKeyDecisions] = useState<string[]>([]);
  const [talkingPoints, setTalkingPoints] = useState<string[]>([]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Set greeting based on time of day
    const hour = currentTime.getHours();
    if (hour < 12) {
      setGreeting('Good Morning');
    } else if (hour < 17) {
      setGreeting('Good Afternoon');
    } else {
      setGreeting('Good Evening');
    }

    // Generate briefing items
    generateBriefingItems();
    generateKeyDecisions();
    generateTalkingPoints();
  }, [data, currentTime]);

  const generateBriefingItems = () => {
    const items: BriefingItem[] = [];

    // What changed overnight
    if (data.renewals_next_30_days > 5) {
      items.push({
        type: 'critical',
        title: 'Urgent Renewals',
        detail: `${data.renewals_next_30_days} applications need renewal within 30 days`,
        value: `$${(data.renewal_cost_30_days / 1000000).toFixed(1)}M`,
        action: 'Review renewal strategy'
      });
    }

    // Savings achievement
    if (data.savings_percentage > 20) {
      items.push({
        type: 'success',
        title: 'Exceptional Savings',
        detail: 'Year-over-year savings exceeding target',
        value: `${data.savings_percentage.toFixed(1)}%`,
        action: 'Share with board'
      });
    } else if (data.savings_percentage < 10) {
      items.push({
        type: 'warning',
        title: 'Savings Below Target',
        detail: 'Cost optimization opportunities available',
        value: `${data.savings_percentage.toFixed(1)}%`,
        action: 'Review vendor contracts'
      });
    }

    // Compliance status
    if (data.patch_compliance_rate < 85) {
      items.push({
        type: 'critical',
        title: 'Compliance Risk',
        detail: 'Patch compliance below security threshold',
        value: `${data.patch_compliance_rate.toFixed(0)}%`,
        action: 'Schedule security review'
      });
    }

    // License utilization
    if (data.average_utilization < 60) {
      items.push({
        type: 'warning',
        title: 'Underutilized Licenses',
        detail: 'Opportunity to reduce license costs',
        value: `${data.average_utilization.toFixed(0)}% utilized`,
        action: 'Audit license usage'
      });
    }

    // High-risk applications
    if (data.high_risk_apps > 0) {
      items.push({
        type: 'critical',
        title: 'High-Risk Applications',
        detail: 'Applications require immediate attention',
        value: `${data.high_risk_apps} apps`,
        action: 'Review risk mitigation'
      });
    }

    // Cost per employee
    if (data.cost_per_employee > 500) {
      items.push({
        type: 'info',
        title: 'Cost Efficiency',
        detail: 'Per-employee software costs',
        value: `$${data.cost_per_employee.toFixed(0)}/employee`,
        action: data.cost_per_employee > 800 ? 'Optimize subscriptions' : undefined
      });
    }

    setBriefingItems(items);
  };

  const generateKeyDecisions = () => {
    const decisions: string[] = [];

    if (data.renewals_next_30_days > 0) {
      decisions.push(`Approve ${data.renewals_next_30_days} pending renewals ($${(data.renewal_cost_30_days / 1000000).toFixed(1)}M)`);
    }

    if (data.high_risk_apps > 0) {
      decisions.push(`Address ${data.high_risk_apps} high-risk applications`);
    }

    if (data.average_utilization < 60) {
      decisions.push('Review underutilized licenses for cost reduction');
    }

    if (data.patch_compliance_rate < 90) {
      decisions.push('Approve emergency patching schedule');
    }

    setKeyDecisions(decisions);
  };

  const generateTalkingPoints = () => {
    const points: string[] = [];

    // Positive achievements
    if (data.savings_percentage > 15) {
      points.push(`We've achieved ${data.savings_percentage.toFixed(1)}% cost reduction YoY, saving $${(data.savings_amount / 1000000).toFixed(1)}M`);
    }

    // Current state
    points.push(`Managing ${data.total_applications} applications across the enterprise with ${data.active_applications} actively in use`);

    // Vendor landscape
    const topVendor = data.vendor_totals?.[0];
    if (topVendor) {
      points.push(`${topVendor.vendor_name} remains our largest vendor at $${(topVendor.total_spend / 1000000).toFixed(1)}M annually`);
    }

    // Future outlook
    if (data.renewals_next_60_days > data.renewals_next_30_days) {
      const upcoming = data.renewals_next_60_days - data.renewals_next_30_days;
      points.push(`${upcoming} additional renewals coming in the next 30-60 days`);
    }

    // Risk management
    if (data.patch_compliance_rate > 90) {
      points.push(`Strong security posture with ${data.patch_compliance_rate.toFixed(0)}% patch compliance`);
    }

    setTalkingPoints(points);
  };

  const getTimeIcon = () => {
    const hour = currentTime.getHours();
    if (hour < 6) return <Moon size={20} />;
    if (hour < 12) return <Coffee size={20} />;
    if (hour < 17) return <Sun size={20} />;
    return <Moon size={20} />;
  };

  const exportBriefing = () => {
    const briefingContent = {
      date: currentTime.toISOString(),
      items: briefingItems,
      decisions: keyDecisions,
      talkingPoints: talkingPoints,
      metrics: {
        applications: data.total_applications,
        savings: data.savings_percentage,
        compliance: data.patch_compliance_rate,
        renewals: data.renewals_next_30_days
      }
    };

    const blob = new Blob([JSON.stringify(briefingContent, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `executive-briefing-${currentTime.toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const printBriefing = () => {
    window.print();
  };

  return (
    <div className="executive-briefing">
      {/* Header */}
      <div className="briefing-header">
        <div className="header-left">
          <div className="greeting">
            {getTimeIcon()}
            <h1>{greeting}, Executive</h1>
          </div>
          <p className="date-time">
            {currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="header-actions">
          <button onClick={printBriefing} className="action-btn" title="Print briefing">
            <Printer size={18} />
          </button>
          <button onClick={exportBriefing} className="action-btn" title="Export briefing">
            <Download size={18} />
          </button>
          {onClose && (
            <button onClick={onClose} className="close-btn" title="Close briefing">
              ×
            </button>
          )}
        </div>
      </div>

      {/* Key Metrics Summary */}
      <div className="metrics-summary">
        <div className="metric-tile">
          <span className="metric-label">Total Portfolio</span>
          <span className="metric-value">{data.total_applications}</span>
          <span className="metric-sublabel">applications</span>
        </div>
        <div className="metric-tile">
          <span className="metric-label">YoY Savings</span>
          <span className="metric-value">{data.savings_percentage.toFixed(1)}%</span>
          <span className="metric-sublabel">${(data.savings_amount / 1000000).toFixed(1)}M saved</span>
        </div>
        <div className="metric-tile">
          <span className="metric-label">Compliance</span>
          <span className="metric-value">{data.patch_compliance_rate.toFixed(0)}%</span>
          <span className="metric-sublabel">patch rate</span>
        </div>
        <div className="metric-tile">
          <span className="metric-label">30-Day Renewals</span>
          <span className="metric-value">{data.renewals_next_30_days}</span>
          <span className="metric-sublabel">${(data.renewal_cost_30_days / 1000000).toFixed(1)}M</span>
        </div>
      </div>

      <div className="briefing-content">
        {/* What Needs Attention */}
        <div className="briefing-section">
          <h2>
            <AlertCircle size={20} />
            What Needs Your Attention Today
          </h2>
          <div className="briefing-items">
            {briefingItems.map((item, idx) => (
              <div key={idx} className={`briefing-item ${item.type}`}>
                <div className="item-icon">
                  {item.type === 'success' ? <CheckCircle size={18} /> :
                   item.type === 'critical' ? <AlertCircle size={18} /> :
                   item.type === 'warning' ? <Clock size={18} /> :
                   <FileText size={18} />}
                </div>
                <div className="item-content">
                  <h3>{item.title}</h3>
                  <p>{item.detail}</p>
                  {item.value && <span className="item-value">{item.value}</span>}
                  {item.action && (
                    <button className="item-action">
                      {item.action}
                      <ChevronRight size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Key Decisions Required */}
        <div className="briefing-section">
          <h2>
            <Briefcase size={20} />
            Key Decisions Required This Week
          </h2>
          <div className="decision-list">
            {keyDecisions.map((decision, idx) => (
              <div key={idx} className="decision-item">
                <span className="decision-number">{idx + 1}</span>
                <span className="decision-text">{decision}</span>
                <button className="decision-action">Review</button>
              </div>
            ))}
          </div>
        </div>

        {/* Meeting Talking Points */}
        <div className="briefing-section">
          <h2>
            <FileText size={20} />
            Meeting-Ready Talking Points
          </h2>
          <div className="talking-points">
            {talkingPoints.map((point, idx) => (
              <div key={idx} className="talking-point">
                <span className="point-bullet">•</span>
                <span className="point-text">{point}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="briefing-footer">
        <p>This briefing updates every 30 seconds with real-time data</p>
        <p>Next scheduled review: {new Date(currentTime.getTime() + 24 * 60 * 60 * 1000).toLocaleDateString()}</p>
      </div>
    </div>
  );
};

export default ExecutiveBriefing;
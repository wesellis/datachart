import React, { useState, useEffect } from 'react';
import { 
  Bell, AlertTriangle, TrendingUp, TrendingDown, 
  CheckCircle, Clock, DollarSign, Shield, Users,
  Calendar, Package, AlertCircle, X, Filter,
  ChevronDown, Archive, Eye, EyeOff
} from 'lucide-react';
import { APMDashboardData } from '../../services/apmService';
import './SmartNotifications.css';

interface Notification {
  id: string;
  type: 'critical' | 'warning' | 'success' | 'info';
  category: 'renewal' | 'compliance' | 'cost' | 'usage' | 'security' | 'vendor';
  title: string;
  message: string;
  timestamp: Date;
  priority: number;
  actionRequired: boolean;
  read: boolean;
  dismissed: boolean;
  relatedApp?: string;
  value?: string;
  action?: {
    label: string;
    callback: () => void;
  };
}

interface SmartNotificationsProps {
  data: APMDashboardData;
  onNotificationAction?: (notification: Notification) => void;
}

const SmartNotifications: React.FC<SmartNotificationsProps> = ({ data, onNotificationAction }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread' | 'critical' | 'actionRequired'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  // Removed isExpanded state - now always shows all notifications
  const [showDismissed, setShowDismissed] = useState(false);

  useEffect(() => {
    generateNotifications();
    const interval = setInterval(generateNotifications, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [data]);

  const generateNotifications = () => {
    const newNotifications: Notification[] = [];
    const now = new Date();

    // Critical: Immediate renewals
    if (data.renewals_next_30_days > 5) {
      newNotifications.push({
        id: 'renewal-critical-' + now.getTime(),
        type: 'critical',
        category: 'renewal',
        title: 'Urgent Renewals Required',
        message: `${data.renewals_next_30_days} applications expire within 30 days. Total cost: $${(data.renewal_cost_30_days / 1000000).toFixed(1)}M`,
        timestamp: now,
        priority: 1,
        actionRequired: true,
        read: false,
        dismissed: false,
        value: `$${(data.renewal_cost_30_days / 1000000).toFixed(1)}M`,
        action: {
          label: 'Review Renewals',
          callback: () => console.log('Opening renewal dashboard')
        }
      });
    }

    // Critical: Compliance issues
    if (data.patch_compliance_rate < 85) {
      newNotifications.push({
        id: 'compliance-critical-' + now.getTime(),
        type: 'critical',
        category: 'compliance',
        title: 'Compliance Below Threshold',
        message: `Patch compliance at ${data.patch_compliance_rate.toFixed(0)}% - immediate action required for security`,
        timestamp: now,
        priority: 1,
        actionRequired: true,
        read: false,
        dismissed: false,
        value: `${data.patch_compliance_rate.toFixed(0)}%`,
        action: {
          label: 'View Compliance Report',
          callback: () => console.log('Opening compliance report')
        }
      });
    }

    // Warning: High-risk applications
    if (data.high_risk_apps > 0) {
      newNotifications.push({
        id: 'risk-warning-' + now.getTime(),
        type: 'warning',
        category: 'security',
        title: 'High-Risk Applications Detected',
        message: `${data.high_risk_apps} applications flagged as high-risk. Review security posture immediately.`,
        timestamp: now,
        priority: 2,
        actionRequired: true,
        read: false,
        dismissed: false,
        value: `${data.high_risk_apps} apps`
      });
    }

    // Warning: Low utilization
    if (data.average_utilization < 60) {
      newNotifications.push({
        id: 'utilization-warning-' + now.getTime(),
        type: 'warning',
        category: 'usage',
        title: 'Low License Utilization',
        message: `Average utilization at ${data.average_utilization.toFixed(0)}%. Opportunity to reduce costs by optimizing licenses.`,
        timestamp: now,
        priority: 3,
        actionRequired: false,
        read: false,
        dismissed: false,
        value: `${data.average_utilization.toFixed(0)}%`,
        action: {
          label: 'Optimize Licenses',
          callback: () => console.log('Opening license optimization')
        }
      });
    }

    // Success: Cost savings
    if (data.savings_percentage > 15) {
      newNotifications.push({
        id: 'savings-success-' + now.getTime(),
        type: 'success',
        category: 'cost',
        title: 'Excellent Cost Savings',
        message: `Achieved ${data.savings_percentage.toFixed(1)}% YoY savings ($${(data.savings_amount / 1000000).toFixed(1)}M saved)`,
        timestamp: now,
        priority: 4,
        actionRequired: false,
        read: false,
        dismissed: false,
        value: `$${(data.savings_amount / 1000000).toFixed(1)}M`
      });
    }

    // Info: Vendor concentration
    const topVendor = data.vendor_totals?.[0];
    if (topVendor && (topVendor.total_spend / data.total_spend_2025) > 0.3) {
      newNotifications.push({
        id: 'vendor-info-' + now.getTime(),
        type: 'info',
        category: 'vendor',
        title: 'Vendor Concentration Risk',
        message: `${topVendor.vendor_name} represents ${((topVendor.total_spend / data.total_spend_2025) * 100).toFixed(0)}% of total spend`,
        timestamp: now,
        priority: 5,
        actionRequired: false,
        read: false,
        dismissed: false,
        value: `$${(topVendor.total_spend / 1000000).toFixed(1)}M`,
        action: {
          label: 'Review Vendor Strategy',
          callback: () => console.log('Opening vendor analysis')
        }
      });
    }

    // Info: Upcoming renewals
    if (data.renewals_next_60_days > data.renewals_next_30_days) {
      const upcoming = data.renewals_next_60_days - data.renewals_next_30_days;
      newNotifications.push({
        id: 'renewal-info-' + now.getTime(),
        type: 'info',
        category: 'renewal',
        title: 'Upcoming Renewals',
        message: `${upcoming} renewals coming in 30-60 days. Start preparation now.`,
        timestamp: now,
        priority: 6,
        actionRequired: false,
        read: false,
        dismissed: false,
        value: `${upcoming} apps`
      });
    }

    // Merge with existing notifications, avoiding duplicates
    setNotifications(prev => {
      const existingIds = new Set(prev.map(n => n.id.split('-').slice(0, -1).join('-')));
      const filteredNew = newNotifications.filter(n => {
        const baseId = n.id.split('-').slice(0, -1).join('-');
        return !existingIds.has(baseId);
      });
      return [...filteredNew, ...prev].sort((a, b) => a.priority - b.priority);
    });
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, dismissed: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(n => ({ ...n, read: true }))
    );
  };

  const getFilteredNotifications = () => {
    return notifications.filter(n => {
      if (!showDismissed && n.dismissed) return false;
      
      switch (filter) {
        case 'unread':
          return !n.read;
        case 'critical':
          return n.type === 'critical' || n.type === 'warning';
        case 'actionRequired':
          return n.actionRequired;
        default:
          return true;
      }
    }).filter(n => {
      if (categoryFilter === 'all') return true;
      return n.category === categoryFilter;
    });
  };

  const getIcon = (notification: Notification) => {
    switch (notification.category) {
      case 'renewal':
        return <Calendar size={16} />;
      case 'compliance':
        return <Shield size={16} />;
      case 'cost':
        return <DollarSign size={16} />;
      case 'usage':
        return <Users size={16} />;
      case 'security':
        return <AlertTriangle size={16} />;
      case 'vendor':
        return <Package size={16} />;
      default:
        return <Bell size={16} />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'critical':
        return '#ef4444';
      case 'warning':
        return '#f59e0b';
      case 'success':
        return '#10b981';
      case 'info':
        return '#3b82f6';
      default:
        return '#64748b';
    }
  };

  const unreadCount = notifications.filter(n => !n.read && !n.dismissed).length;
  const criticalCount = notifications.filter(n => (n.type === 'critical' || n.type === 'warning') && !n.dismissed).length;
  const filteredNotifications = getFilteredNotifications();

  return (
    <div className="smart-notifications">
      {/* Header */}
      <div className="notifications-header">
        <div className="header-title">
          <Bell size={20} />
          <h3>Smart Notifications</h3>
          {unreadCount > 0 && (
            <span className="badge">{unreadCount}</span>
          )}
        </div>
        <div className="header-actions">
          {unreadCount > 0 && (
            <button 
              className="action-btn"
              onClick={markAllAsRead}
              title="Mark all as read"
            >
              <Eye size={16} />
            </button>
          )}
          <button 
            className="action-btn"
            onClick={() => setShowDismissed(!showDismissed)}
            title={showDismissed ? "Hide dismissed" : "Show dismissed"}
            style={{ opacity: showDismissed ? 1 : 0.5 }}
          >
            <Archive size={16} />
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="notifications-stats">
        <div className="stat-item critical">
          <AlertCircle size={14} />
          <span>{criticalCount} Critical</span>
        </div>
        <div className="stat-item action">
          <Clock size={14} />
          <span>{notifications.filter(n => n.actionRequired && !n.dismissed).length} Action Required</span>
        </div>
        <div className="stat-item unread">
          <Bell size={14} />
          <span>{unreadCount} Unread</span>
        </div>
      </div>

      {/* Filters */}
      <div className="notifications-filters">
        <select 
          value={filter} 
          onChange={(e) => setFilter(e.target.value as any)}
          className="filter-select"
        >
          <option value="all">All Notifications</option>
          <option value="unread">Unread Only</option>
          <option value="critical">Critical & Warnings</option>
          <option value="actionRequired">Action Required</option>
        </select>
        <select 
          value={categoryFilter} 
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="filter-select"
        >
          <option value="all">All Categories</option>
          <option value="renewal">Renewals</option>
          <option value="compliance">Compliance</option>
          <option value="cost">Cost</option>
          <option value="usage">Usage</option>
          <option value="security">Security</option>
          <option value="vendor">Vendor</option>
        </select>
      </div>

      {/* Notifications List */}
      <div className="notifications-list">
        {filteredNotifications.length === 0 ? (
          <div className="no-notifications">
            <Bell size={32} style={{ opacity: 0.3 }} />
            <p>No notifications to display</p>
          </div>
        ) : (
          filteredNotifications.map(notification => (
            <div 
              key={notification.id}
              className={`notification-item ${notification.type} ${notification.read ? 'read' : 'unread'} ${notification.dismissed ? 'dismissed' : ''}`}
              onClick={() => markAsRead(notification.id)}
            >
              <div 
                className="notification-indicator"
                style={{ background: getTypeColor(notification.type) }}
              />
              <div className="notification-icon">
                {getIcon(notification)}
              </div>
              <div className="notification-content">
                <div className="notification-header">
                  <h4>{notification.title}</h4>
                  {notification.actionRequired && (
                    <span className="action-badge">Action Required</span>
                  )}
                </div>
                <p>{notification.message}</p>
                {notification.value && (
                  <span className="notification-value">{notification.value}</span>
                )}
                <div className="notification-footer">
                  <span className="notification-time">
                    {formatTime(notification.timestamp)}
                  </span>
                  {notification.action && (
                    <button 
                      className="notification-action"
                      onClick={(e) => {
                        e.stopPropagation();
                        notification.action?.callback();
                        if (onNotificationAction) {
                          onNotificationAction(notification);
                        }
                      }}
                    >
                      {notification.action.label}
                    </button>
                  )}
                </div>
              </div>
              <button
                className="dismiss-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  dismissNotification(notification.id);
                }}
                title="Dismiss"
              >
                <X size={14} />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Scroll indicator for many notifications */}
      {filteredNotifications.length > 10 && (
        <div className="notifications-footer">
          <span className="notifications-count">
            Showing {filteredNotifications.length} notifications
          </span>
        </div>
      )}
    </div>
  );
};

const formatTime = (date: Date): string => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
};

export default SmartNotifications;
export interface DashboardTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  thumbnail?: string;
  tags: string[];
  widgets: any[];
}

export const dashboardTemplates: DashboardTemplate[] = [
  {
    id: 'executive-overview',
    name: 'Executive Overview',
    description: 'High-level KPIs and metrics for C-suite executives',
    category: 'Executive',
    icon: '🎯',
    tags: ['executive', 'kpi', 'overview'],
    widgets: [
      {
        id: 'revenue-kpi',
        type: 'metric',
        title: 'Total Revenue',
        position: { x: 0, y: 0, w: 3, h: 2 },
        config: {
          format: 'currency',
          trend: 'up',
          trendValue: 12.5,
          color: '#10b981'
        }
      },
      {
        id: 'costs-kpi',
        type: 'metric',
        title: 'Operating Costs',
        position: { x: 3, y: 0, w: 3, h: 2 },
        config: {
          format: 'currency',
          trend: 'down',
          trendValue: -3.2,
          color: '#3b82f6'
        }
      },
      {
        id: 'profit-kpi',
        type: 'metric',
        title: 'Net Profit',
        position: { x: 6, y: 0, w: 3, h: 2 },
        config: {
          format: 'currency',
          trend: 'up',
          trendValue: 18.7,
          color: '#8b5cf6'
        }
      },
      {
        id: 'efficiency-kpi',
        type: 'metric',
        title: 'Efficiency Score',
        position: { x: 9, y: 0, w: 3, h: 2 },
        config: {
          format: 'percent',
          value: 87.4,
          trend: 'up',
          trendValue: 2.1,
          color: '#f59e0b'
        }
      },
      {
        id: 'revenue-chart',
        type: 'line-chart',
        title: 'Revenue Trend',
        position: { x: 0, y: 2, w: 6, h: 4 },
        config: {
          xAxis: 'month',
          yAxis: 'revenue',
          color: '#10b981'
        }
      },
      {
        id: 'department-pie',
        type: 'pie-chart',
        title: 'Revenue by Department',
        position: { x: 6, y: 2, w: 4, h: 4 },
        config: {
          colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']
        }
      },
      {
        id: 'ai-insights',
        type: 'ai-insights',
        title: 'AI Recommendations',
        position: { x: 10, y: 2, w: 2, h: 4 },
        config: {
          maxInsights: 3,
          priority: 'high'
        }
      }
    ]
  },
  {
    id: 'sales-performance',
    name: 'Sales Performance',
    description: 'Track sales metrics, team performance, and pipeline',
    category: 'Sales',
    icon: '📊',
    tags: ['sales', 'performance', 'pipeline'],
    widgets: [
      {
        id: 'sales-total',
        type: 'metric',
        title: 'Total Sales',
        position: { x: 0, y: 0, w: 3, h: 2 },
        config: {
          format: 'currency',
          trend: 'up',
          trendValue: 8.3
        }
      },
      {
        id: 'deals-closed',
        type: 'metric',
        title: 'Deals Closed',
        position: { x: 3, y: 0, w: 3, h: 2 },
        config: {
          format: 'number',
          value: 47,
          trend: 'up',
          trendValue: 5
        }
      },
      {
        id: 'conversion-rate',
        type: 'metric',
        title: 'Conversion Rate',
        position: { x: 6, y: 0, w: 3, h: 2 },
        config: {
          format: 'percent',
          value: 24.7,
          trend: 'up',
          trendValue: 1.2
        }
      },
      {
        id: 'pipeline-value',
        type: 'metric',
        title: 'Pipeline Value',
        position: { x: 9, y: 0, w: 3, h: 2 },
        config: {
          format: 'currency',
          value: 3200000
        }
      },
      {
        id: 'sales-funnel',
        type: 'bar-chart',
        title: 'Sales Funnel',
        position: { x: 0, y: 2, w: 6, h: 4 },
        config: {
          orientation: 'horizontal',
          colors: ['#3b82f6']
        }
      },
      {
        id: 'team-leaderboard',
        type: 'table',
        title: 'Team Leaderboard',
        position: { x: 6, y: 2, w: 6, h: 4 },
        config: {
          columns: ['Name', 'Deals', 'Revenue', 'Target %'],
          sortBy: 'Revenue',
          sortOrder: 'desc'
        }
      },
      {
        id: 'monthly-targets',
        type: 'radar-chart',
        title: 'Monthly Targets',
        position: { x: 0, y: 6, w: 4, h: 4 },
        config: {
          metrics: ['New Leads', 'Calls', 'Meetings', 'Proposals', 'Closed']
        }
      }
    ]
  },
  {
    id: 'it-operations',
    name: 'IT Operations',
    description: 'Monitor system health, incidents, and infrastructure',
    category: 'IT',
    icon: '🖥️',
    tags: ['it', 'operations', 'monitoring'],
    widgets: [
      {
        id: 'system-uptime',
        type: 'metric',
        title: 'System Uptime',
        position: { x: 0, y: 0, w: 3, h: 2 },
        config: {
          format: 'percent',
          value: 99.97,
          color: '#10b981'
        }
      },
      {
        id: 'active-incidents',
        type: 'metric',
        title: 'Active Incidents',
        position: { x: 3, y: 0, w: 3, h: 2 },
        config: {
          format: 'number',
          value: 3,
          color: '#ef4444',
          threshold: { warning: 5, critical: 10 }
        }
      },
      {
        id: 'response-time',
        type: 'metric',
        title: 'Avg Response Time',
        position: { x: 6, y: 0, w: 3, h: 2 },
        config: {
          format: 'duration',
          value: 245,
          unit: 'ms',
          color: '#3b82f6'
        }
      },
      {
        id: 'server-load',
        type: 'metric',
        title: 'Server Load',
        position: { x: 9, y: 0, w: 3, h: 2 },
        config: {
          format: 'percent',
          value: 42,
          color: '#f59e0b',
          threshold: { warning: 70, critical: 90 }
        }
      },
      {
        id: 'infrastructure-map',
        type: 'bar-chart',
        title: 'Infrastructure Status',
        position: { x: 0, y: 2, w: 8, h: 4 },
        config: {
          stacked: true,
          colors: ['#10b981', '#f59e0b', '#ef4444']
        }
      },
      {
        id: 'alerts-feed',
        type: 'alerts',
        title: 'Recent Alerts',
        position: { x: 0, y: 6, w: 12, h: 1 },
        config: {
          maxAlerts: 5,
          autoScroll: true
        }
      }
    ]
  },
  {
    id: 'financial-analytics',
    name: 'Financial Analytics',
    description: 'Comprehensive financial metrics and analysis',
    category: 'Finance',
    icon: '💰',
    tags: ['finance', 'analytics', 'accounting'],
    widgets: [
      {
        id: 'cash-flow',
        type: 'metric',
        title: 'Cash Flow',
        position: { x: 0, y: 0, w: 3, h: 2 },
        config: {
          format: 'currency',
          trend: 'up',
          trendValue: 5.2
        }
      },
      {
        id: 'accounts-receivable',
        type: 'metric',
        title: 'Accounts Receivable',
        position: { x: 3, y: 0, w: 3, h: 2 },
        config: {
          format: 'currency'
        }
      },
      {
        id: 'accounts-payable',
        type: 'metric',
        title: 'Accounts Payable',
        position: { x: 6, y: 0, w: 3, h: 2 },
        config: {
          format: 'currency'
        }
      },
      {
        id: 'burn-rate',
        type: 'metric',
        title: 'Burn Rate',
        position: { x: 9, y: 0, w: 3, h: 2 },
        config: {
          format: 'currency',
          period: 'monthly'
        }
      },
      {
        id: 'pl-statement',
        type: 'table',
        title: 'P&L Statement',
        position: { x: 0, y: 2, w: 6, h: 5 },
        config: {
          columns: ['Category', 'Actual', 'Budget', 'Variance'],
          expandable: true
        }
      },
      {
        id: 'expense-breakdown',
        type: 'pie-chart',
        title: 'Expense Breakdown',
        position: { x: 6, y: 2, w: 4, h: 4 },
        config: {
          colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']
        }
      },
      {
        id: 'forecast',
        type: 'line-chart',
        title: '12-Month Forecast',
        position: { x: 10, y: 2, w: 2, h: 4 },
        config: {
          showForecast: true,
          confidenceInterval: true
        }
      }
    ]
  },
  {
    id: 'hr-dashboard',
    name: 'HR Dashboard',
    description: 'Employee metrics, satisfaction, and workforce analytics',
    category: 'HR',
    icon: '👥',
    tags: ['hr', 'employees', 'workforce'],
    widgets: [
      {
        id: 'total-employees',
        type: 'metric',
        title: 'Total Employees',
        position: { x: 0, y: 0, w: 3, h: 2 },
        config: {
          format: 'number',
          value: 1247,
          trend: 'up',
          trendValue: 23
        }
      },
      {
        id: 'satisfaction-score',
        type: 'metric',
        title: 'Satisfaction Score',
        position: { x: 3, y: 0, w: 3, h: 2 },
        config: {
          format: 'score',
          value: 4.2,
          maxValue: 5,
          color: '#10b981'
        }
      },
      {
        id: 'turnover-rate',
        type: 'metric',
        title: 'Turnover Rate',
        position: { x: 6, y: 0, w: 3, h: 2 },
        config: {
          format: 'percent',
          value: 8.3,
          trend: 'down',
          trendValue: -1.2,
          color: '#3b82f6'
        }
      },
      {
        id: 'open-positions',
        type: 'metric',
        title: 'Open Positions',
        position: { x: 9, y: 0, w: 3, h: 2 },
        config: {
          format: 'number',
          value: 47,
          color: '#f59e0b'
        }
      },
      {
        id: 'department-distribution',
        type: 'bar-chart',
        title: 'Department Distribution',
        position: { x: 0, y: 2, w: 6, h: 4 },
        config: {
          orientation: 'vertical'
        }
      },
      {
        id: 'skills-matrix',
        type: 'radar-chart',
        title: 'Skills Matrix',
        position: { x: 6, y: 2, w: 4, h: 4 },
        config: {
          metrics: ['Technical', 'Communication', 'Leadership', 'Innovation', 'Teamwork']
        }
      }
    ]
  },
  {
    id: 'marketing-analytics',
    name: 'Marketing Analytics',
    description: 'Campaign performance, leads, and marketing ROI',
    category: 'Marketing',
    icon: '📈',
    tags: ['marketing', 'campaigns', 'analytics'],
    widgets: [
      {
        id: 'leads-generated',
        type: 'metric',
        title: 'Leads Generated',
        position: { x: 0, y: 0, w: 3, h: 2 },
        config: {
          format: 'number',
          value: 3847,
          trend: 'up',
          trendValue: 234
        }
      },
      {
        id: 'conversion-rate',
        type: 'metric',
        title: 'Conversion Rate',
        position: { x: 3, y: 0, w: 3, h: 2 },
        config: {
          format: 'percent',
          value: 3.7,
          trend: 'up',
          trendValue: 0.4
        }
      },
      {
        id: 'campaign-roi',
        type: 'metric',
        title: 'Campaign ROI',
        position: { x: 6, y: 0, w: 3, h: 2 },
        config: {
          format: 'percent',
          value: 287,
          color: '#10b981'
        }
      },
      {
        id: 'cost-per-lead',
        type: 'metric',
        title: 'Cost per Lead',
        position: { x: 9, y: 0, w: 3, h: 2 },
        config: {
          format: 'currency',
          value: 42.5,
          trend: 'down',
          trendValue: -3.2
        }
      },
      {
        id: 'channel-performance',
        type: 'bar-chart',
        title: 'Channel Performance',
        position: { x: 0, y: 2, w: 8, h: 4 },
        config: {
          categories: ['Social', 'Email', 'Search', 'Display', 'Direct']
        }
      },
      {
        id: 'campaign-list',
        type: 'table',
        title: 'Active Campaigns',
        position: { x: 8, y: 2, w: 4, h: 4 },
        config: {
          columns: ['Campaign', 'Status', 'Leads', 'ROI'],
          sortBy: 'ROI',
          sortOrder: 'desc'
        }
      }
    ]
  },
  {
    id: 'customer-success',
    name: 'Customer Success',
    description: 'Customer satisfaction, support metrics, and retention',
    category: 'Customer',
    icon: '🎯',
    tags: ['customer', 'support', 'satisfaction'],
    widgets: [
      {
        id: 'nps-score',
        type: 'metric',
        title: 'NPS Score',
        position: { x: 0, y: 0, w: 3, h: 2 },
        config: {
          format: 'number',
          value: 72,
          color: '#10b981',
          threshold: { warning: 50, critical: 30 }
        }
      },
      {
        id: 'csat-score',
        type: 'metric',
        title: 'CSAT Score',
        position: { x: 3, y: 0, w: 3, h: 2 },
        config: {
          format: 'percent',
          value: 91.3,
          trend: 'up',
          trendValue: 2.1
        }
      },
      {
        id: 'avg-response-time',
        type: 'metric',
        title: 'Avg Response Time',
        position: { x: 6, y: 0, w: 3, h: 2 },
        config: {
          format: 'duration',
          value: 4.2,
          unit: 'hours'
        }
      },
      {
        id: 'ticket-volume',
        type: 'metric',
        title: 'Ticket Volume',
        position: { x: 9, y: 0, w: 3, h: 2 },
        config: {
          format: 'number',
          value: 847,
          trend: 'down',
          trendValue: -12
        }
      },
      {
        id: 'ticket-trend',
        type: 'line-chart',
        title: 'Ticket Trend',
        position: { x: 0, y: 2, w: 6, h: 4 },
        config: {
          lines: ['Created', 'Resolved', 'Pending']
        }
      },
      {
        id: 'satisfaction-breakdown',
        type: 'pie-chart',
        title: 'Satisfaction Breakdown',
        position: { x: 6, y: 2, w: 4, h: 4 },
        config: {
          colors: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444']
        }
      }
    ]
  },
  {
    id: 'project-management',
    name: 'Project Management',
    description: 'Project status, timelines, and resource allocation',
    category: 'Projects',
    icon: '📋',
    tags: ['projects', 'management', 'timeline'],
    widgets: [
      {
        id: 'active-projects',
        type: 'metric',
        title: 'Active Projects',
        position: { x: 0, y: 0, w: 3, h: 2 },
        config: {
          format: 'number',
          value: 24
        }
      },
      {
        id: 'on-track',
        type: 'metric',
        title: 'On Track',
        position: { x: 3, y: 0, w: 3, h: 2 },
        config: {
          format: 'percent',
          value: 75,
          color: '#10b981'
        }
      },
      {
        id: 'at-risk',
        type: 'metric',
        title: 'At Risk',
        position: { x: 6, y: 0, w: 3, h: 2 },
        config: {
          format: 'number',
          value: 4,
          color: '#f59e0b'
        }
      },
      {
        id: 'delayed',
        type: 'metric',
        title: 'Delayed',
        position: { x: 9, y: 0, w: 3, h: 2 },
        config: {
          format: 'number',
          value: 2,
          color: '#ef4444'
        }
      },
      {
        id: 'project-timeline',
        type: 'bar-chart',
        title: 'Project Timeline',
        position: { x: 0, y: 2, w: 8, h: 4 },
        config: {
          orientation: 'horizontal',
          type: 'gantt'
        }
      },
      {
        id: 'resource-allocation',
        type: 'table',
        title: 'Resource Allocation',
        position: { x: 8, y: 2, w: 4, h: 4 },
        config: {
          columns: ['Resource', 'Project', 'Allocation', 'Availability']
        }
      }
    ]
  }
];
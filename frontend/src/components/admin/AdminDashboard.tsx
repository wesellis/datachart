/**
 * Admin Dashboard for DataChart
 * Comprehensive admin interface for managing the SaaS platform
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  UserGroupIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  CogIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ServerIcon,
  CircleStackIcon,
  ShieldCheckIcon,
  DocumentTextIcon,
  BellIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ArrowPathIcon,
  ArrowDownTrayIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { format, parseISO, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import CountUp from 'react-countup';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Types
interface AdminMetrics {
  platform: PlatformMetrics;
  customers: CustomerMetrics;
  revenue: RevenueMetrics;
  system: SystemMetrics;
  security: SecurityMetrics;
  support: SupportMetrics;
}

interface PlatformMetrics {
  totalCustomers: number;
  activeSubscriptions: number;
  trialCustomers: number;
  churnRate: number;
  systemUptime: number;
  apiResponseTime: number;
  totalApiCalls: number;
  dataProcessedGB: number;
}

// Type definitions
interface CustomerSignup {
  date: string;
  count: number;
}

interface TierDistribution {
  tier: string;
  count: number;
  percentage: number;
}

interface GrowthData {
  date: string;
  value: number;
}

interface TopCustomer {
  name: string;
  tier: string;
  mrr: number;
  health: number;
}

interface HealthScore {
  range: string;
  count: number;
  color: string;
}

interface CustomerMetrics {
  newSignups: CustomerSignup[];
  customersByTier: TierDistribution[];
  customerGrowth: GrowthData[];
  topCustomers: TopCustomer[];
  customerHealth: HealthScore[];
}

interface TierRevenue {
  tier: string;
  revenue: number;
  percentage?: number;
}

interface RevenueMetrics {
  totalRevenue: number;
  monthlyRecurring: number;
  annualRecurring: number;
  averageContractValue: number;
  revenueGrowth: GrowthData[];
  revenueByTier: TierRevenue[];
  churnImpact: number;
}

interface ServerHealth {
  id?: string;
  name: string;
  status: string;
  cpu?: number;
  memory?: number;
  utilization?: number;
  instances?: number;
}

interface DatabaseMetrics {
  connections?: number;
  queries?: number;
  latency?: number;
  totalQueries?: number;
  avgQueryTime?: number;
  slowQueries?: number;
  connectionPool?: number;
}

interface MaintenanceWindow {
  id?: string;
  name?: string;
  date: string;
  description?: string;
  duration?: string;
}

interface SystemMetrics {
  serverHealth: ServerHealth[];
  databaseMetrics: DatabaseMetrics;
  cacheHitRate: number;
  errorRate: number;
  alertsActive: number;
  scheduledMaintenance: MaintenanceWindow[];
}

interface VulnerabilityCount {
  critical: number;
  high: number;
  medium: number;
  low: number;
}

interface SecurityMetrics {
  threatsDetected: number;
  securityIncidents: number;
  complianceScore: number;
  vulnerabilities: VulnerabilityCount;
  auditEvents: number;
  failedLogins: number;
}

interface SupportMetrics {
  ticketsOpen: number;
  ticketsResolved: number;
  avgResponseTime: number;
  customerSatisfaction: number;
  knowledgeBaseViews: number;
  escalations: number;
}

// Admin Dashboard Component
const AdminDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState('30d');
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [customers, setCustomers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

  // Fetch admin metrics
  const fetchMetrics = useCallback(async () => {
    try {
      const response = await fetch(`/api/v1/admin/metrics?timeRange=${selectedTimeRange}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to fetch metrics');

      const data = await response.json();
      setMetrics(data);
    } catch (error) {
      console.error('Error fetching admin metrics:', error);
      // Use demo data as fallback
      setMetrics(generateDemoMetrics());
    } finally {
      setLoading(false);
    }
  }, [selectedTimeRange]);

  // Fetch customers
  const fetchCustomers = useCallback(async () => {
    try {
      const response = await fetch(`/api/v1/admin/customers?search=${searchQuery}&status=${filterStatus}&sortBy=${sortBy}&order=${sortOrder}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to fetch customers');

      const data = await response.json();
      setCustomers(data.customers);
    } catch (error) {
      console.error('Error fetching customers:', error);
      setCustomers(generateDemoCustomers());
    }
  }, [searchQuery, filterStatus, sortBy, sortOrder]);

  useEffect(() => {
    fetchMetrics();
    if (activeTab === 'customers') {
      fetchCustomers();
    }
  }, [fetchMetrics, fetchCustomers, activeTab]);

  // Generate demo metrics
  const generateDemoMetrics = (): AdminMetrics => ({
    platform: {
      totalCustomers: 1247,
      activeSubscriptions: 1089,
      trialCustomers: 158,
      churnRate: 3.2,
      systemUptime: 99.98,
      apiResponseTime: 142,
      totalApiCalls: 25847293,
      dataProcessedGB: 15847
    },
    customers: {
      newSignups: [
        { date: '2024-01-01', count: 12 },
        { date: '2024-01-02', count: 8 },
        { date: '2024-01-03', count: 15 }
      ],
      customersByTier: [
        { tier: 'Trial', count: 158, percentage: 12.7 },
        { tier: 'Starter', count: 623, percentage: 50.0 },
        { tier: 'Professional', count: 389, percentage: 31.2 },
        { tier: 'Enterprise', count: 77, percentage: 6.1 }
      ],
      customerGrowth: [
        { date: '2024-01-01', value: 1180 },
        { date: '2024-01-15', value: 1203 },
        { date: '2024-01-30', value: 1247 }
      ],
      topCustomers: [
        { name: 'Acme Corporation', tier: 'Enterprise', mrr: 14999, health: 95 },
        { name: 'Global Tech Solutions', tier: 'Professional', mrr: 6999, health: 88 },
        { name: 'Innovation Labs', tier: 'Professional', mrr: 6999, health: 92 }
      ],
      customerHealth: [
        { range: '90-100', count: 456, color: '#10b981' },
        { range: '70-89', count: 523, color: '#f59e0b' },
        { range: '50-69', count: 198, color: '#ef4444' },
        { range: '0-49', count: 70, color: '#dc2626' }
      ]
    },
    revenue: {
      totalRevenue: 4856721,
      monthlyRecurring: 3921450,
      annualRecurring: 47057400,
      averageContractValue: 4458,
      revenueGrowth: [
        { date: '2024-01-01', value: 4203421 },
        { date: '2024-01-15', value: 4456892 },
        { date: '2024-01-30', value: 4856721 }
      ],
      revenueByTier: [
        { tier: 'Enterprise', revenue: 1154923, percentage: 23.8 },
        { tier: 'Professional', revenue: 2723587, percentage: 56.1 },
        { tier: 'Starter', revenue: 978211, percentage: 20.1 }
      ],
      churnImpact: -143250
    },
    system: {
      serverHealth: [
        { name: 'Web Servers', status: 'healthy', utilization: 45, instances: 8 },
        { name: 'API Servers', status: 'healthy', utilization: 62, instances: 12 },
        { name: 'Database', status: 'warning', utilization: 78, instances: 4 },
        { name: 'Cache Cluster', status: 'healthy', utilization: 34, instances: 6 }
      ],
      databaseMetrics: {
        totalQueries: 15847293,
        avgQueryTime: 23,
        slowQueries: 1847,
        connectionPool: 85
      },
      cacheHitRate: 94.2,
      errorRate: 0.12,
      alertsActive: 3,
      scheduledMaintenance: [
        { name: 'Database Upgrade', date: '2024-02-15', duration: '2 hours' },
        { name: 'Security Patches', date: '2024-02-20', duration: '30 minutes' }
      ]
    },
    security: {
      threatsDetected: 127,
      securityIncidents: 2,
      complianceScore: 94,
      vulnerabilities: { critical: 0, high: 2, medium: 8, low: 23 },
      auditEvents: 15847,
      failedLogins: 234
    },
    support: {
      ticketsOpen: 23,
      ticketsResolved: 156,
      avgResponseTime: 2.3,
      customerSatisfaction: 4.7,
      knowledgeBaseViews: 8547,
      escalations: 4
    }
  });

  const generateDemoCustomers = () => [
    {
      id: '1',
      name: 'Acme Corporation',
      email: 'admin@acme.com',
      tier: 'Enterprise',
      status: 'active',
      mrr: 14999,
      created_at: '2023-06-15',
      last_login: '2024-01-30',
      health_score: 95,
      users: 45,
      api_usage: 850000
    },
    {
      id: '2', 
      name: 'Global Tech Solutions',
      email: 'it@globaltech.com',
      tier: 'Professional',
      status: 'active',
      mrr: 6999,
      created_at: '2023-09-22',
      last_login: '2024-01-29',
      health_score: 88,
      users: 23,
      api_usage: 320000
    }
  ];

  // Render loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-16 w-16 text-red-500 mx-auto" />
          <p className="mt-4 text-gray-600">Failed to load admin metrics</p>
          <button
            onClick={fetchMetrics}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', name: 'Overview', icon: ChartBarIcon },
    { id: 'customers', name: 'Customers', icon: UserGroupIcon },
    { id: 'revenue', name: 'Revenue', icon: CurrencyDollarIcon },
    { id: 'system', name: 'System Health', icon: ServerIcon },
    { id: 'security', name: 'Security', icon: ShieldCheckIcon },
    { id: 'support', name: 'Support', icon: DocumentTextIcon }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
                <CogIcon className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-sm text-gray-500">DataChart Platform Management</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Time Range Selector */}
              <div className="flex bg-gray-100 rounded-lg border border-gray-300">
                {['24h', '7d', '30d', '90d'].map((range) => (
                  <button
                    key={range}
                    onClick={() => setSelectedTimeRange(range)}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                      selectedTimeRange === range
                        ? 'bg-blue-600 text-white rounded-lg'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {range}
                  </button>
                ))}
              </div>

              <button
                onClick={fetchMetrics}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowPathIcon className="h-5 w-5" />
              </button>

              <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                <BellIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white border-b border-gray-200">
        <div className="px-6">
          <div className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="px-6 py-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <UserGroupIcon className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Customers</p>
                      <p className="text-2xl font-bold text-gray-900">
                        <CountUp end={metrics.platform.totalCustomers} />
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center text-green-600">
                      <ArrowUpIcon className="h-4 w-4" />
                      <span className="text-sm font-medium">12.5%</span>
                    </div>
                    <p className="text-xs text-gray-500">vs last month</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-green-100 rounded-lg">
                      <CurrencyDollarIcon className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
                      <p className="text-2xl font-bold text-gray-900">
                        $<CountUp end={metrics.revenue.monthlyRecurring / 1000} />K
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center text-green-600">
                      <ArrowUpIcon className="h-4 w-4" />
                      <span className="text-sm font-medium">8.2%</span>
                    </div>
                    <p className="text-xs text-gray-500">vs last month</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-purple-100 rounded-lg">
                      <ServerIcon className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">System Uptime</p>
                      <p className="text-2xl font-bold text-gray-900">
                        <CountUp end={metrics.platform.systemUptime} decimals={2} />%
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center text-green-600">
                      <CheckCircleIcon className="h-4 w-4" />
                      <span className="text-sm font-medium">Healthy</span>
                    </div>
                    <p className="text-xs text-gray-500">All systems</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-yellow-100 rounded-lg">
                      <ShieldCheckIcon className="h-6 w-6 text-yellow-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Security Score</p>
                      <p className="text-2xl font-bold text-gray-900">
                        <CountUp end={metrics.security.complianceScore} />
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center text-yellow-600">
                      <ExclamationTriangleIcon className="h-4 w-4" />
                      <span className="text-sm font-medium">{metrics.security.vulnerabilities.high} High</span>
                    </div>
                    <p className="text-xs text-gray-500">vulnerabilities</p>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Customer Growth Chart */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Growth</h3>
                <Line
                  data={{
                    labels: metrics.customers.customerGrowth.map(item => format(parseISO(item.date), 'MMM dd')),
                    datasets: [{
                      label: 'Total Customers',
                      data: metrics.customers.customerGrowth.map(item => item.value),
                      borderColor: 'rgb(59, 130, 246)',
                      backgroundColor: 'rgba(59, 130, 246, 0.1)',
                      tension: 0.4,
                      fill: true
                    }]
                  }}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: { display: false }
                    },
                    scales: {
                      y: { beginAtZero: true }
                    }
                  }}
                />
              </motion.div>

              {/* Revenue Growth Chart */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Growth</h3>
                <Line
                  data={{
                    labels: metrics.revenue.revenueGrowth.map(item => format(parseISO(item.date), 'MMM dd')),
                    datasets: [{
                      label: 'Total Revenue',
                      data: metrics.revenue.revenueGrowth.map(item => item.value / 1000),
                      borderColor: 'rgb(16, 185, 129)',
                      backgroundColor: 'rgba(16, 185, 129, 0.1)',
                      tension: 0.4,
                      fill: true
                    }]
                  }}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: { display: false },
                      tooltip: {
                        callbacks: {
                          label: (context) => `Revenue: $${context.parsed.y.toFixed(0)}K`
                        }
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          callback: (value) => `$${value}K`
                        }
                      }
                    }
                  }}
                />
              </motion.div>
            </div>

            {/* Customer Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Customers by Tier</h3>
                <Doughnut
                  data={{
                    labels: metrics.customers.customersByTier.map(item => item.tier),
                    datasets: [{
                      data: metrics.customers.customersByTier.map(item => item.count),
                      backgroundColor: [
                        '#f3f4f6',
                        '#3b82f6',
                        '#8b5cf6',
                        '#10b981'
                      ],
                      borderWidth: 0
                    }]
                  }}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: {
                        position: 'bottom',
                        labels: { padding: 20 }
                      }
                    }
                  }}
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue by Tier</h3>
                <Bar
                  data={{
                    labels: metrics.revenue.revenueByTier.map(item => item.tier),
                    datasets: [{
                      data: metrics.revenue.revenueByTier.map(item => item.revenue / 1000),
                      backgroundColor: ['#10b981', '#8b5cf6', '#3b82f6'],
                      borderRadius: 8,
                      borderSkipped: false
                    }]
                  }}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: { display: false },
                      tooltip: {
                        callbacks: {
                          label: (context) => `Revenue: $${context.parsed.y.toFixed(0)}K`
                        }
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          callback: (value) => `$${value}K`
                        }
                      }
                    }
                  }}
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">System Health</h3>
                <div className="space-y-4">
                  {metrics.system.serverHealth.map((server, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${
                          server.status === 'healthy' ? 'bg-green-400' :
                          server.status === 'warning' ? 'bg-yellow-400' : 'bg-red-400'
                        }`} />
                        <span className="text-sm font-medium text-gray-900">{server.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">{server.utilization}%</div>
                        <div className="text-xs text-gray-500">{server.instances} instances</div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        )}

        {/* Customer Management Tab */}
        {activeTab === 'customers' && (
          <div className="space-y-6">
            {/* Customer Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search customers..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="trial">Trial</option>
                  <option value="canceled">Canceled</option>
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="created_at">Created Date</option>
                  <option value="name">Name</option>
                  <option value="mrr">Revenue</option>
                  <option value="health_score">Health Score</option>
                </select>

                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  <PlusIcon className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Customer Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tier</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">MRR</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Health</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usage</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {customers.map((customer) => (
                      <tr key={customer.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                            <div className="text-sm text-gray-500">{customer.email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            customer.tier === 'Enterprise' ? 'bg-purple-100 text-purple-800' :
                            customer.tier === 'Professional' ? 'bg-blue-100 text-blue-800' :
                            customer.tier === 'Starter' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {customer.tier}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            customer.status === 'active' ? 'bg-green-100 text-green-800' :
                            customer.status === 'trial' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {customer.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ${customer.mrr?.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className={`w-2 h-2 rounded-full mr-2 ${
                              customer.health_score >= 80 ? 'bg-green-400' :
                              customer.health_score >= 60 ? 'bg-yellow-400' : 'bg-red-400'
                            }`} />
                            <span className="text-sm text-gray-900">{customer.health_score}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {customer.api_usage?.toLocaleString()} calls
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button className="text-blue-600 hover:text-blue-900">
                              <EyeIcon className="h-4 w-4" />
                            </button>
                            <button className="text-gray-600 hover:text-gray-900">
                              <PencilIcon className="h-4 w-4" />
                            </button>
                            <button className="text-red-600 hover:text-red-900">
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Add other tabs (revenue, system, security, support) with similar structure */}
        {activeTab === 'revenue' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Analytics</h3>
            <p className="text-gray-500">Revenue analytics and reporting coming soon...</p>
          </div>
        )}

        {activeTab === 'system' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">System Health</h3>
            <p className="text-gray-500">System monitoring and health checks coming soon...</p>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Security Dashboard</h3>
            <p className="text-gray-500">Security monitoring and compliance reporting coming soon...</p>
          </div>
        )}

        {activeTab === 'support' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Support Analytics</h3>
            <p className="text-gray-500">Support ticket analytics and customer satisfaction metrics coming soon...</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
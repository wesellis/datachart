/**
 * Professional Dashboard Component
 * Based on professional-dashboard-blueprint.html design
 * Enterprise-grade APM dashboard with glassmorphism and complex metrics
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ChartBarIcon,
  CurrencyDollarIcon,
  ServerIcon,
  ShieldCheckIcon,
  ArrowTrendingUpIcon,
  UsersIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ArrowPathIcon,
  CogIcon,
  BellIcon,
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  Squares2X2Icon,
  DocumentTextIcon,
  CloudIcon,
  CircleStackIcon,
  BoltIcon,
  CpuChipIcon,
  GlobeAltIcon,
  LockClosedIcon,
  CheckCircleIcon,
  XCircleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { Line, Bar, Doughnut, Radar, Scatter, Bubble } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  RadialLinearScale,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { format, parseISO, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import CountUp from 'react-countup';
import { Sparklines, SparklinesLine, SparklinesSpots, SparklinesReferenceLine } from 'react-sparklines';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  RadialLinearScale,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Types
interface DashboardData {
  vendorMetrics: VendorMetrics;
  applicationMetrics: ApplicationMetrics;
  costTrends: CostTrends;
  complianceScore: ComplianceScore;
  securityMetrics: SecurityMetrics;
  performanceMetrics: PerformanceMetrics;
  executiveSummary: ExecutiveSummary;
}

interface VendorMetrics {
  totalSpend: number;
  vendorCount: number;
  topVendors: Array<{ name: string; spend: number; change: number }>;
  spendByCategory: Array<{ category: string; amount: number }>;
  contractsExpiring: number;
  savingsOpportunities: number;
}

interface ApplicationMetrics {
  totalApplications: number;
  criticalApplications: number;
  applicationsByStatus: { active: number; deprecated: number; planned: number };
  technicalDebt: number;
  securityVulnerabilities: number;
  performanceIssues: number;
  topApplications: Array<{ name: string; users: number; health: number }>;
}

interface CostTrends {
  monthlySpend: Array<{ month: string; actual: number; budget: number }>;
  costByDepartment: Array<{ department: string; cost: number }>;
  forecastedSpend: number;
  budgetVariance: number;
  costOptimizations: Array<{ item: string; savings: number }>;
}

interface ComplianceScore {
  overallScore: number;
  byFramework: Array<{ framework: string; score: number; status: string }>;
  openIssues: number;
  criticalFindings: number;
  auditStatus: string;
  nextAuditDate: string;
}

interface SecurityMetrics {
  securityScore: number;
  threatsDetected: number;
  incidentsResolved: number;
  vulnerabilities: { critical: number; high: number; medium: number; low: number };
  patchCompliance: number;
  mfaAdoption: number;
}

interface PerformanceMetrics {
  systemUptime: number;
  avgResponseTime: number;
  errorRate: number;
  throughput: number;
  activeUsers: number;
  apiCalls: number;
}

interface ExecutiveSummary {
  keyInsights: string[];
  recommendations: Array<{ priority: string; action: string; impact: string }>;
  risks: Array<{ level: string; description: string; mitigation: string }>;
}

// Professional Dashboard Component
const ProfessionalDashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState('30d');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [activeView, setActiveView] = useState<'executive' | 'operational' | 'technical'>('executive');
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    try {
      const customerId = localStorage.getItem('customerId') || 'demo';
      const response = await fetch(`/api/v1/dashboards/${customerId}/overview?refresh=${refreshing}`, {
        headers: {
          'X-API-Key': localStorage.getItem('apiKey') || ''
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch dashboard data');
      
      const data = await response.json();
      setDashboardData(data.data);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      // Use demo data as fallback
      setDashboardData(generateDemoData());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [refreshing]);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 300000); // Refresh every 5 minutes
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  // Generate demo data
  const generateDemoData = (): DashboardData => {
    return {
      vendorMetrics: {
        totalSpend: 12500000,
        vendorCount: 342,
        topVendors: [
          { name: 'Microsoft', spend: 3200000, change: 5.2 },
          { name: 'Amazon Web Services', spend: 2800000, change: -2.1 },
          { name: 'Salesforce', spend: 1500000, change: 8.7 },
          { name: 'Oracle', spend: 1200000, change: -4.3 },
          { name: 'ServiceNow', spend: 980000, change: 12.5 }
        ],
        spendByCategory: [
          { category: 'Cloud Infrastructure', amount: 4500000 },
          { category: 'Software Licenses', amount: 3200000 },
          { category: 'Security Tools', amount: 2100000 },
          { category: 'Development Tools', amount: 1800000 },
          { category: 'Support Services', amount: 900000 }
        ],
        contractsExpiring: 23,
        savingsOpportunities: 850000
      },
      applicationMetrics: {
        totalApplications: 847,
        criticalApplications: 124,
        applicationsByStatus: { active: 623, deprecated: 87, planned: 137 },
        technicalDebt: 3400000,
        securityVulnerabilities: 42,
        performanceIssues: 18,
        topApplications: [
          { name: 'ERP System', users: 8500, health: 94 },
          { name: 'CRM Platform', users: 6200, health: 88 },
          { name: 'HR Portal', users: 4500, health: 92 },
          { name: 'Finance Suite', users: 3200, health: 96 },
          { name: 'Analytics Platform', users: 2800, health: 85 }
        ]
      },
      costTrends: {
        monthlySpend: [
          { month: 'Jan', actual: 980000, budget: 1000000 },
          { month: 'Feb', actual: 1020000, budget: 1000000 },
          { month: 'Mar', actual: 1100000, budget: 1050000 },
          { month: 'Apr', actual: 1080000, budget: 1050000 },
          { month: 'May', actual: 1150000, budget: 1100000 },
          { month: 'Jun', actual: 1200000, budget: 1100000 }
        ],
        costByDepartment: [
          { department: 'IT Operations', cost: 450000 },
          { department: 'Development', cost: 380000 },
          { department: 'Sales', cost: 220000 },
          { department: 'Marketing', cost: 180000 },
          { department: 'HR', cost: 120000 }
        ],
        forecastedSpend: 1250000,
        budgetVariance: -8.5,
        costOptimizations: [
          { item: 'Unused Azure Resources', savings: 125000 },
          { item: 'License Optimization', savings: 85000 },
          { item: 'Reserved Instances', savings: 210000 }
        ]
      },
      complianceScore: {
        overallScore: 87,
        byFramework: [
          { framework: 'SOC 2', score: 92, status: 'Compliant' },
          { framework: 'ISO 27001', score: 88, status: 'Compliant' },
          { framework: 'GDPR', score: 85, status: 'Compliant' },
          { framework: 'HIPAA', score: 82, status: 'At Risk' }
        ],
        openIssues: 34,
        criticalFindings: 3,
        auditStatus: 'In Progress',
        nextAuditDate: '2024-03-15'
      },
      securityMetrics: {
        securityScore: 84,
        threatsDetected: 127,
        incidentsResolved: 119,
        vulnerabilities: { critical: 2, high: 8, medium: 24, low: 67 },
        patchCompliance: 94,
        mfaAdoption: 78
      },
      performanceMetrics: {
        systemUptime: 99.98,
        avgResponseTime: 124,
        errorRate: 0.12,
        throughput: 45000,
        activeUsers: 12450,
        apiCalls: 2840000
      },
      executiveSummary: {
        keyInsights: [
          'IT spend is 8.5% over budget YTD',
          'Security posture improved by 12% this quarter',
          '23 vendor contracts expire in next 90 days',
          'Technical debt increased by $400K this month'
        ],
        recommendations: [
          { priority: 'High', action: 'Review Azure spend', impact: '$125K savings' },
          { priority: 'High', action: 'Address critical vulnerabilities', impact: 'Reduce risk by 35%' },
          { priority: 'Medium', action: 'Consolidate vendor contracts', impact: '$85K annual savings' }
        ],
        risks: [
          { level: 'Critical', description: '2 critical security vulnerabilities', mitigation: 'Patch within 48 hours' },
          { level: 'High', description: 'Budget overrun trajectory', mitigation: 'Implement cost controls' },
          { level: 'Medium', description: 'HIPAA compliance at risk', mitigation: 'Review data handling procedures' }
        ]
      }
    };
  };

  // Render loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-slate-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-16 w-16 text-red-500 mx-auto" />
          <p className="mt-4 text-slate-400">Failed to load dashboard data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Dashboard Header */}
      <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-xl border-b border-slate-700/50">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo and Title */}
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
                <ChartBarIcon className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">APM Command Center</h1>
                <p className="text-sm text-slate-400">DataChart Enterprise Dashboard</p>
              </div>
            </div>

            {/* Header Controls */}
            <div className="flex items-center space-x-4">
              {/* Search */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-300 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-slate-500" />
              </div>

              {/* Time Range Selector */}
              <div className="flex bg-slate-800/50 rounded-lg border border-slate-700">
                {['24h', '7d', '30d', '90d', '1y'].map((range) => (
                  <button
                    key={range}
                    onClick={() => setSelectedTimeRange(range)}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                      selectedTimeRange === range
                        ? 'bg-blue-600 text-white rounded-lg'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {range}
                  </button>
                ))}
              </div>

              {/* View Selector */}
              <div className="flex bg-slate-800/50 rounded-lg border border-slate-700">
                {(['executive', 'operational', 'technical'] as const).map((view) => (
                  <button
                    key={view}
                    onClick={() => setActiveView(view)}
                    className={`px-4 py-2 text-sm font-medium capitalize transition-colors ${
                      activeView === view
                        ? 'bg-purple-600 text-white rounded-lg'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {view}
                  </button>
                ))}
              </div>

              {/* Action Buttons */}
              <button
                onClick={() => setRefreshing(true)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                disabled={refreshing}
              >
                <ArrowPathIcon className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
              </button>

              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              >
                <BellIcon className="h-5 w-5" />
                <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full animate-pulse"></span>
              </button>

              <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
                <CogIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Executive Summary Bar */}
      <div className="bg-slate-800/50 border-b border-slate-700/50 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            {dashboardData.executiveSummary.keyInsights.map((insight, index) => (
              <div key={index} className="flex items-center space-x-2">
                <InformationCircleIcon className="h-4 w-4 text-blue-400" />
                <span className="text-sm text-slate-300">{insight}</span>
              </div>
            ))}
          </div>
          <button className="text-sm text-blue-400 hover:text-blue-300 font-medium">
            View Full Report →
          </button>
        </div>
      </div>

      {/* Main Dashboard Content */}
      <div className="p-6">
        {/* Key Metrics Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-6">
          {/* Total Spend */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-800/50 backdrop-blur-xl rounded-xl border border-slate-700/50 p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <CurrencyDollarIcon className="h-5 w-5 text-green-400" />
              <span className="text-xs text-green-400 font-medium">+5.2%</span>
            </div>
            <div className="text-2xl font-bold text-white">
              $<CountUp end={dashboardData.vendorMetrics.totalSpend / 1000000} decimals={1} />M
            </div>
            <div className="text-xs text-slate-400 mt-1">Total IT Spend</div>
            <div className="mt-2">
              <Sparklines data={[8, 12, 10, 14, 13, 16, 15, 18]} width={100} height={30}>
                <SparklinesLine color="#10b981" style={{ strokeWidth: 2 }} />
                <SparklinesSpots />
              </Sparklines>
            </div>
          </motion.div>

          {/* Vendor Count */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-slate-800/50 backdrop-blur-xl rounded-xl border border-slate-700/50 p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <UsersIcon className="h-5 w-5 text-blue-400" />
              <span className="text-xs text-red-400 font-medium">-2.1%</span>
            </div>
            <div className="text-2xl font-bold text-white">
              <CountUp end={dashboardData.vendorMetrics.vendorCount} />
            </div>
            <div className="text-xs text-slate-400 mt-1">Active Vendors</div>
            <div className="mt-2">
              <Sparklines data={[15, 14, 16, 13, 12, 11, 10, 9]} width={100} height={30}>
                <SparklinesLine color="#3b82f6" style={{ strokeWidth: 2 }} />
                <SparklinesReferenceLine type="avg" />
              </Sparklines>
            </div>
          </motion.div>

          {/* Applications */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-slate-800/50 backdrop-blur-xl rounded-xl border border-slate-700/50 p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <ServerIcon className="h-5 w-5 text-purple-400" />
              <span className="text-xs text-green-400 font-medium">+8.7%</span>
            </div>
            <div className="text-2xl font-bold text-white">
              <CountUp end={dashboardData.applicationMetrics.totalApplications} />
            </div>
            <div className="text-xs text-slate-400 mt-1">Applications</div>
            <div className="mt-2 flex items-center space-x-1">
              <div className="flex-1 bg-green-500 h-2 rounded-full" style={{ width: '73%' }}></div>
              <div className="flex-1 bg-yellow-500 h-2 rounded-full" style={{ width: '17%' }}></div>
              <div className="flex-1 bg-red-500 h-2 rounded-full" style={{ width: '10%' }}></div>
            </div>
          </motion.div>

          {/* Compliance Score */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-slate-800/50 backdrop-blur-xl rounded-xl border border-slate-700/50 p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <ShieldCheckIcon className="h-5 w-5 text-yellow-400" />
              <span className="text-xs text-green-400 font-medium">+3.2%</span>
            </div>
            <div className="text-2xl font-bold text-white">
              <CountUp end={dashboardData.complianceScore.overallScore} />%
            </div>
            <div className="text-xs text-slate-400 mt-1">Compliance Score</div>
            <div className="mt-2">
              <div className="relative h-8 w-8 mx-auto">
                <svg className="transform -rotate-90 w-8 h-8">
                  <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="3" fill="none" className="text-slate-700" />
                  <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="3" fill="none" 
                    className="text-yellow-400" 
                    strokeDasharray={`${2 * Math.PI * 14 * dashboardData.complianceScore.overallScore / 100} ${2 * Math.PI * 14}`} 
                  />
                </svg>
              </div>
            </div>
          </motion.div>

          {/* Security Score */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-slate-800/50 backdrop-blur-xl rounded-xl border border-slate-700/50 p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <LockClosedIcon className="h-5 w-5 text-red-400" />
              <span className="text-xs text-yellow-400 font-medium">+1.8%</span>
            </div>
            <div className="text-2xl font-bold text-white">
              <CountUp end={dashboardData.securityMetrics.securityScore} />
            </div>
            <div className="text-xs text-slate-400 mt-1">Security Score</div>
            <div className="mt-2 grid grid-cols-4 gap-1">
              <div className="text-center">
                <div className="text-xs font-bold text-red-400">{dashboardData.securityMetrics.vulnerabilities.critical}</div>
                <div className="text-[10px] text-slate-500">Crit</div>
              </div>
              <div className="text-center">
                <div className="text-xs font-bold text-orange-400">{dashboardData.securityMetrics.vulnerabilities.high}</div>
                <div className="text-[10px] text-slate-500">High</div>
              </div>
              <div className="text-center">
                <div className="text-xs font-bold text-yellow-400">{dashboardData.securityMetrics.vulnerabilities.medium}</div>
                <div className="text-[10px] text-slate-500">Med</div>
              </div>
              <div className="text-center">
                <div className="text-xs font-bold text-green-400">{dashboardData.securityMetrics.vulnerabilities.low}</div>
                <div className="text-[10px] text-slate-500">Low</div>
              </div>
            </div>
          </motion.div>

          {/* System Uptime */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-slate-800/50 backdrop-blur-xl rounded-xl border border-slate-700/50 p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <BoltIcon className="h-5 w-5 text-cyan-400" />
              <CheckCircleIcon className="h-4 w-4 text-green-400" />
            </div>
            <div className="text-2xl font-bold text-white">
              <CountUp end={dashboardData.performanceMetrics.systemUptime} decimals={2} />%
            </div>
            <div className="text-xs text-slate-400 mt-1">System Uptime</div>
            <div className="mt-2 flex items-center space-x-2">
              <div className="text-[10px] text-slate-500">Response:</div>
              <div className="text-xs font-medium text-cyan-400">{dashboardData.performanceMetrics.avgResponseTime}ms</div>
            </div>
          </motion.div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-12 gap-6">
          {/* Left Column - Vendor Analytics */}
          <div className="col-span-12 lg:col-span-8 space-y-6">
            {/* Vendor Spend Chart */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-slate-800/50 backdrop-blur-xl rounded-xl border border-slate-700/50 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Vendor Spend Analysis</h3>
                <div className="flex items-center space-x-2">
                  <button className="text-sm text-slate-400 hover:text-white">Export</button>
                  <button className="text-sm text-slate-400 hover:text-white">Settings</button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Bar
                    data={{
                      labels: dashboardData.vendorMetrics.topVendors.map(v => v.name),
                      datasets: [{
                        label: 'Spend ($)',
                        data: dashboardData.vendorMetrics.topVendors.map(v => v.spend),
                        backgroundColor: 'rgba(59, 130, 246, 0.5)',
                        borderColor: 'rgba(59, 130, 246, 1)',
                        borderWidth: 1
                      }]
                    }}
                    options={{
                      responsive: true,
                      plugins: {
                        legend: { display: false },
                        tooltip: {
                          callbacks: {
                            label: (context) => `$${(context.parsed.y / 1000000).toFixed(1)}M`
                          }
                        }
                      },
                      scales: {
                        y: {
                          ticks: {
                            callback: (value) => `$${(Number(value) / 1000000).toFixed(1)}M`,
                            color: '#94a3b8'
                          },
                          grid: { color: 'rgba(148, 163, 184, 0.1)' }
                        },
                        x: {
                          ticks: { color: '#94a3b8' },
                          grid: { display: false }
                        }
                      }
                    }}
                  />
                </div>
                
                <div>
                  <Doughnut
                    data={{
                      labels: dashboardData.vendorMetrics.spendByCategory.map(c => c.category),
                      datasets: [{
                        data: dashboardData.vendorMetrics.spendByCategory.map(c => c.amount),
                        backgroundColor: [
                          'rgba(59, 130, 246, 0.8)',
                          'rgba(139, 92, 246, 0.8)',
                          'rgba(16, 185, 129, 0.8)',
                          'rgba(251, 146, 60, 0.8)',
                          'rgba(239, 68, 68, 0.8)'
                        ],
                        borderWidth: 0
                      }]
                    }}
                    options={{
                      responsive: true,
                      plugins: {
                        legend: {
                          position: 'right',
                          labels: { color: '#94a3b8', padding: 10 }
                        },
                        tooltip: {
                          callbacks: {
                            label: (context) => `${context.label}: $${(Number(context.parsed) / 1000000).toFixed(1)}M`
                          }
                        }
                      }
                    }}
                  />
                </div>
              </div>
            </motion.div>

            {/* Cost Trends */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="bg-slate-800/50 backdrop-blur-xl rounded-xl border border-slate-700/50 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Cost Trends & Budget</h3>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-xs text-slate-400">Actual</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-xs text-slate-400">Budget</span>
                  </div>
                </div>
              </div>
              
              <Line
                data={{
                  labels: dashboardData.costTrends.monthlySpend.map(m => m.month),
                  datasets: [
                    {
                      label: 'Actual Spend',
                      data: dashboardData.costTrends.monthlySpend.map(m => m.actual),
                      borderColor: 'rgba(59, 130, 246, 1)',
                      backgroundColor: 'rgba(59, 130, 246, 0.1)',
                      tension: 0.4,
                      fill: true
                    },
                    {
                      label: 'Budget',
                      data: dashboardData.costTrends.monthlySpend.map(m => m.budget),
                      borderColor: 'rgba(16, 185, 129, 1)',
                      backgroundColor: 'rgba(16, 185, 129, 0.1)',
                      tension: 0.4,
                      fill: true
                    }
                  ]
                }}
                options={{
                  responsive: true,
                  plugins: {
                    legend: { display: false },
                    tooltip: {
                      callbacks: {
                        label: (context) => `${context.dataset.label}: $${(context.parsed.y / 1000000).toFixed(2)}M`
                      }
                    }
                  },
                  scales: {
                    y: {
                      ticks: {
                        callback: (value) => `$${(Number(value) / 1000000).toFixed(1)}M`,
                        color: '#94a3b8'
                      },
                      grid: { color: 'rgba(148, 163, 184, 0.1)' }
                    },
                    x: {
                      ticks: { color: '#94a3b8' },
                      grid: { display: false }
                    }
                  }
                }}
              />
              
              {/* Cost Optimization Opportunities */}
              <div className="mt-4 p-4 bg-slate-900/50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-300">Optimization Opportunities</span>
                  <span className="text-sm font-bold text-green-400">
                    ${(dashboardData.costTrends.costOptimizations.reduce((sum, opt) => sum + opt.savings, 0) / 1000).toFixed(0)}K potential savings
                  </span>
                </div>
                <div className="space-y-2">
                  {dashboardData.costTrends.costOptimizations.map((opt, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-xs text-slate-400">{opt.item}</span>
                      <span className="text-xs font-medium text-green-400">${(opt.savings / 1000).toFixed(0)}K</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Application Health Matrix */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-slate-800/50 backdrop-blur-xl rounded-xl border border-slate-700/50 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Application Health Matrix</h3>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-slate-400">Critical Apps:</span>
                  <span className="text-sm font-bold text-red-400">{dashboardData.applicationMetrics.criticalApplications}</span>
                </div>
              </div>
              
              <div className="grid grid-cols-5 gap-4">
                {dashboardData.applicationMetrics.topApplications.map((app, index) => (
                  <div key={index} className="text-center">
                    <div className="relative">
                      <svg className="w-16 h-16 mx-auto">
                        <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="none" className="text-slate-700" />
                        <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="none" 
                          className={app.health > 90 ? 'text-green-400' : app.health > 70 ? 'text-yellow-400' : 'text-red-400'}
                          strokeDasharray={`${2 * Math.PI * 28 * app.health / 100} ${2 * Math.PI * 28}`}
                          strokeLinecap="round"
                          transform="rotate(-90 32 32)"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-sm font-bold text-white">{app.health}%</span>
                      </div>
                    </div>
                    <div className="mt-2">
                      <div className="text-xs font-medium text-slate-300 truncate">{app.name}</div>
                      <div className="text-xs text-slate-500">{app.users.toLocaleString()} users</div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Application Issues Summary */}
              <div className="mt-4 grid grid-cols-3 gap-4">
                <div className="p-3 bg-red-900/20 rounded-lg border border-red-900/50">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-red-400">Security Issues</span>
                    <ExclamationTriangleIcon className="h-4 w-4 text-red-400" />
                  </div>
                  <div className="text-2xl font-bold text-red-400 mt-1">{dashboardData.applicationMetrics.securityVulnerabilities}</div>
                </div>
                <div className="p-3 bg-yellow-900/20 rounded-lg border border-yellow-900/50">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-yellow-400">Performance Issues</span>
                    <ClockIcon className="h-4 w-4 text-yellow-400" />
                  </div>
                  <div className="text-2xl font-bold text-yellow-400 mt-1">{dashboardData.applicationMetrics.performanceIssues}</div>
                </div>
                <div className="p-3 bg-purple-900/20 rounded-lg border border-purple-900/50">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-purple-400">Technical Debt</span>
                    <CurrencyDollarIcon className="h-4 w-4 text-purple-400" />
                  </div>
                  <div className="text-2xl font-bold text-purple-400 mt-1">${(dashboardData.applicationMetrics.technicalDebt / 1000000).toFixed(1)}M</div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right Column - Compliance & Security */}
          <div className="col-span-12 lg:col-span-4 space-y-6">
            {/* Compliance Dashboard */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-slate-800/50 backdrop-blur-xl rounded-xl border border-slate-700/50 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Compliance Status</h3>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  dashboardData.complianceScore.overallScore >= 90 ? 'bg-green-900/50 text-green-400' :
                  dashboardData.complianceScore.overallScore >= 70 ? 'bg-yellow-900/50 text-yellow-400' :
                  'bg-red-900/50 text-red-400'
                }`}>
                  {dashboardData.complianceScore.auditStatus}
                </span>
              </div>
              
              <div className="space-y-3">
                {dashboardData.complianceScore.byFramework.map((framework, index) => (
                  <div key={index} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-300">{framework.framework}</span>
                      <span className={`text-sm font-medium ${
                        framework.score >= 90 ? 'text-green-400' :
                        framework.score >= 70 ? 'text-yellow-400' :
                        'text-red-400'
                      }`}>
                        {framework.score}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-500 ${
                          framework.score >= 90 ? 'bg-green-500' :
                          framework.score >= 70 ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${framework.score}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 p-3 bg-slate-900/50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-400">Open Issues</span>
                  <span className="text-sm font-bold text-yellow-400">{dashboardData.complianceScore.openIssues}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Critical Findings</span>
                  <span className="text-sm font-bold text-red-400">{dashboardData.complianceScore.criticalFindings}</span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-slate-400">Next Audit</span>
                  <span className="text-xs font-medium text-slate-300">{dashboardData.complianceScore.nextAuditDate}</span>
                </div>
              </div>
            </motion.div>

            {/* Security Metrics */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-slate-800/50 backdrop-blur-xl rounded-xl border border-slate-700/50 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Security Posture</h3>
                <div className="flex items-center space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className={`h-6 w-1 rounded-full ${
                        i < Math.floor(dashboardData.securityMetrics.securityScore / 20)
                          ? 'bg-green-400'
                          : 'bg-slate-700'
                      }`}
                    ></div>
                  ))}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-slate-900/50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-400">{dashboardData.securityMetrics.threatsDetected}</div>
                  <div className="text-xs text-slate-400 mt-1">Threats Detected</div>
                </div>
                <div className="text-center p-3 bg-slate-900/50 rounded-lg">
                  <div className="text-2xl font-bold text-green-400">{dashboardData.securityMetrics.incidentsResolved}</div>
                  <div className="text-xs text-slate-400 mt-1">Resolved</div>
                </div>
              </div>
              
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-400">Patch Compliance</span>
                  <span className="text-sm font-medium text-green-400">{dashboardData.securityMetrics.patchCompliance}%</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: `${dashboardData.securityMetrics.patchCompliance}%` }}></div>
                </div>
              </div>
              
              <div className="mt-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-400">MFA Adoption</span>
                  <span className="text-sm font-medium text-blue-400">{dashboardData.securityMetrics.mfaAdoption}%</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${dashboardData.securityMetrics.mfaAdoption}%` }}></div>
                </div>
              </div>
              
              {/* Vulnerability Breakdown */}
              <div className="mt-4 p-3 bg-slate-900/50 rounded-lg">
                <div className="text-xs text-slate-400 mb-2">Vulnerability Summary</div>
                <div className="flex items-center justify-between space-x-2">
                  <div className="text-center flex-1">
                    <div className="text-lg font-bold text-red-500">{dashboardData.securityMetrics.vulnerabilities.critical}</div>
                    <div className="text-[10px] text-slate-500">Critical</div>
                  </div>
                  <div className="text-center flex-1">
                    <div className="text-lg font-bold text-orange-500">{dashboardData.securityMetrics.vulnerabilities.high}</div>
                    <div className="text-[10px] text-slate-500">High</div>
                  </div>
                  <div className="text-center flex-1">
                    <div className="text-lg font-bold text-yellow-500">{dashboardData.securityMetrics.vulnerabilities.medium}</div>
                    <div className="text-[10px] text-slate-500">Medium</div>
                  </div>
                  <div className="text-center flex-1">
                    <div className="text-lg font-bold text-green-500">{dashboardData.securityMetrics.vulnerabilities.low}</div>
                    <div className="text-[10px] text-slate-500">Low</div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Recommendations */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-slate-800/50 backdrop-blur-xl rounded-xl border border-slate-700/50 p-6"
            >
              <h3 className="text-lg font-semibold text-white mb-4">Priority Actions</h3>
              
              <div className="space-y-3">
                {dashboardData.executiveSummary.recommendations.map((rec, index) => (
                  <div key={index} className="p-3 bg-slate-900/50 rounded-lg border-l-4 border-blue-500">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        rec.priority === 'High' ? 'bg-red-900/50 text-red-400' :
                        rec.priority === 'Medium' ? 'bg-yellow-900/50 text-yellow-400' :
                        'bg-green-900/50 text-green-400'
                      }`}>
                        {rec.priority}
                      </span>
                      <span className="text-xs text-green-400">{rec.impact}</span>
                    </div>
                    <p className="text-sm text-slate-300">{rec.action}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Risk Alerts */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-slate-800/50 backdrop-blur-xl rounded-xl border border-slate-700/50 p-6"
            >
              <h3 className="text-lg font-semibold text-white mb-4">Risk Alerts</h3>
              
              <div className="space-y-3">
                {dashboardData.executiveSummary.risks.map((risk, index) => (
                  <div key={index} className={`p-3 rounded-lg border ${
                    risk.level === 'Critical' ? 'bg-red-900/20 border-red-900/50' :
                    risk.level === 'High' ? 'bg-orange-900/20 border-orange-900/50' :
                    'bg-yellow-900/20 border-yellow-900/50'
                  }`}>
                    <div className="flex items-start space-x-2">
                      <ExclamationTriangleIcon className={`h-5 w-5 mt-0.5 ${
                        risk.level === 'Critical' ? 'text-red-400' :
                        risk.level === 'High' ? 'text-orange-400' :
                        'text-yellow-400'
                      }`} />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-slate-200">{risk.description}</div>
                        <div className="text-xs text-slate-400 mt-1">Mitigation: {risk.mitigation}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Notifications Panel */}
      <AnimatePresence>
        {showNotifications && (
          <motion.div
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            className="fixed right-0 top-0 h-full w-96 bg-slate-900 border-l border-slate-700 shadow-2xl z-50"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white">Notifications</h3>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <XCircleIcon className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="p-4 bg-red-900/20 border border-red-900/50 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mt-0.5" />
                    <div>
                      <div className="text-sm font-medium text-red-400">Critical Security Alert</div>
                      <div className="text-xs text-slate-400 mt-1">2 critical vulnerabilities detected in production</div>
                      <div className="text-xs text-slate-500 mt-2">5 minutes ago</div>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-yellow-900/20 border border-yellow-900/50 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <CurrencyDollarIcon className="h-5 w-5 text-yellow-400 mt-0.5" />
                    <div>
                      <div className="text-sm font-medium text-yellow-400">Budget Alert</div>
                      <div className="text-xs text-slate-400 mt-1">Q2 spend is 8.5% over budget</div>
                      <div className="text-xs text-slate-500 mt-2">1 hour ago</div>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-blue-900/20 border border-blue-900/50 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <InformationCircleIcon className="h-5 w-5 text-blue-400 mt-0.5" />
                    <div>
                      <div className="text-sm font-medium text-blue-400">Contract Renewal</div>
                      <div className="text-xs text-slate-400 mt-1">Microsoft contract expires in 30 days</div>
                      <div className="text-xs text-slate-500 mt-2">2 hours ago</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProfessionalDashboard;
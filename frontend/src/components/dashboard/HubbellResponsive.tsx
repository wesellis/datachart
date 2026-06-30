import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import { 
  TrendingUp, TrendingDown, AlertTriangle, Shield, DollarSign, 
  Activity, Target, X, Brain, AlertCircle, 
  CheckCircle, Info, BarChart2, Users, Layers, Settings, Eye
} from 'lucide-react';
import DashboardBuilderFixed from './DashboardBuilderFixed';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

interface Alert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  message: string;
  timestamp: Date;
}

interface AIInsight {
  id: string;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  savings?: number;
  action: string;
}

const HubbellResponsive: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState('30D');
  const [showControls, setShowControls] = useState(false);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [aiInsights, setAIInsights] = useState<AIInsight[]>([]);
  const [viewMode, setViewMode] = useState<'operational' | 'ai'>('operational');
  const [isBuilderMode, setIsBuilderMode] = useState(false);

  useEffect(() => {
    fetchDashboardData();
    generateAlerts();
    generateAIInsights();
    const interval = setInterval(() => {
      fetchDashboardData();
      generateAlerts();
    }, 30000);
    return () => clearInterval(interval);
  }, [selectedTimeRange]);

  const fetchDashboardData = async () => {
    setLoading(true);
    
    try {
      // Try to fetch from backend with time range parameter
      const response = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/v1/dashboards/hubbell-001?timeRange=${selectedTimeRange}`);
      
      // Transform dashboard config into renderable data
      const dashboard = response.data;
      const transformedData = {
        id: dashboard.id,
        name: dashboard.name,
        widgets: dashboard.widgets || [],
        layout: dashboard.layout || [],
        metrics: extractMetricsFromWidgets(dashboard.widgets),
        charts: extractChartsFromWidgets(dashboard.widgets)
      };
      
      setDashboardData(transformedData);
    } catch (error) {
      console.error('Error fetching dashboard, using mock data:', error);
      // Use fallback mock data with time range consideration
      setDashboardData(getMockDashboardData(selectedTimeRange));
    } finally {
      setLoading(false);
    }
  };

  const extractMetricsFromWidgets = (widgets: any[]) => {
    // Extract metric widgets
    const metricWidgets = widgets?.filter(w => w.type === 'metric' || w.type === 'kpi') || [];
    
    // If no metric widgets, return default metrics
    if (metricWidgets.length === 0) {
      return getDefaultMetrics(selectedTimeRange);
    }
    
    return metricWidgets.map(widget => ({
      id: widget.id,
      title: widget.config?.title || widget.name,
      value: widget.config?.value || '0',
      change: widget.config?.change || 0,
      subtitle: widget.config?.subtitle || '',
      icon: getIconForMetric(widget.config?.icon || 'dollar-sign'),
      color: widget.config?.color || '#3b82f6'
    }));
  };

  const extractChartsFromWidgets = (widgets: any[]) => {
    // Extract chart widgets
    const chartWidgets = widgets?.filter(w => 
      w.type === 'chart' || w.type === 'bar' || w.type === 'line' || w.type === 'pie'
    ) || [];
    
    return chartWidgets.map(widget => ({
      id: widget.id,
      type: widget.type,
      title: widget.config?.title || widget.name,
      data: widget.config?.data || [],
      config: widget.config || {}
    }));
  };

  const getIconForMetric = (iconName: string) => {
    const icons: any = {
      'dollar-sign': DollarSign,
      'shield': Shield,
      'check-circle': CheckCircle,
      'users': Users,
      'layers': Layers,
      'trending-up': TrendingUp,
      'activity': Activity,
      'target': Target
    };
    return icons[iconName] || DollarSign;
  };

  const getDefaultMetrics = (timeRange: string = '30D') => {
    // Adjust values based on time range
    const multiplier = timeRange === '7D' ? 0.25 : timeRange === '30D' ? 1 : timeRange === '90D' ? 2.8 : 12;
    
    return [
      {
        id: 'spend',
        title: 'Total Spend',
        value: `$${(18.5 * multiplier).toFixed(1)}M`,
        change: 3.2,
        subtitle: `${timeRange} period • Budget: $${(20 * multiplier).toFixed(1)}M`,
        icon: DollarSign,
        color: '#3b82f6'
      },
      {
        id: 'risk',
        title: 'Risk Score',
        value: '40/100',
        change: -2.1,
        subtitle: '3 critical issues detected',
        icon: Shield,
        color: '#f59e0b'
      },
      {
        id: 'compliance',
        title: 'Compliance',
        value: '87.4%',
        change: 2.1,
        subtitle: 'Target: 90% • 29 gaps',
        icon: CheckCircle,
        color: '#10b981'
      },
      {
        id: 'applications',
        title: 'Applications',
        value: '235',
        change: 8.1,
        subtitle: '218 active • 17 sunset',
        icon: Layers,
        color: '#8b5cf6'
      },
      {
        id: 'optimization',
        title: 'OptimizationNew',
        value: `$${Math.floor(285 * Math.max(multiplier / 4, 1))}K`,
        change: 0,
        subtitle: 'Potential annual savings',
        icon: Target,
        color: '#ec4899'
      }
    ];
  };

  const getMockDashboardData = (timeRange: string = '30D') => ({
    id: 'hubbell-001',
    name: 'APM Command Center',
    metrics: getDefaultMetrics(timeRange),
    charts: [
      {
        id: 'spend-chart',
        type: 'area',
        title: 'Spend Analysis & Forecast',
        data: generateSpendData(timeRange)
      },
      {
        id: 'vendor-chart',
        type: 'bar',
        title: 'Top Vendor Spend',
        data: generateVendorData(timeRange)
      }
    ]
  });

  const generateSpendData = (timeRange: string = '30D') => {
    let periods: string[] = [];
    let dataMultiplier = 1;
    
    if (timeRange === '7D') {
      periods = ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7'];
      dataMultiplier = 0.033; // Daily amounts
    } else if (timeRange === '30D') {
      periods = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
      dataMultiplier = 0.25; // Weekly amounts
    } else if (timeRange === '90D') {
      periods = ['Jan', 'Feb', 'Mar'];
      dataMultiplier = 1; // Monthly amounts
    } else {
      periods = ['Q1', 'Q2', 'Q3', 'Q4'];
      dataMultiplier = 3; // Quarterly amounts
    }
    
    return periods.map(period => ({
      month: period,
      actual: Math.floor((Math.random() * 500000 + 1500000) * dataMultiplier),
      budget: Math.floor(1800000 * dataMultiplier),
      forecast: Math.floor((Math.random() * 200000 + 1700000) * dataMultiplier)
    }));
  };

  const generateVendorData = (timeRange: string = '30D') => {
    const multiplier = timeRange === '7D' ? 0.25 : timeRange === '30D' ? 1 : timeRange === '90D' ? 2.8 : 12;
    
    return [
      { name: 'Microsoft', value: Math.floor(4200000 * multiplier), change: 12 },
      { name: 'Oracle', value: Math.floor(3800000 * multiplier), change: -5 },
      { name: 'Salesforce', value: Math.floor(2100000 * multiplier), change: 8 },
      { name: 'Adobe', value: Math.floor(1800000 * multiplier), change: 3 },
      { name: 'AWS', value: Math.floor(1500000 * multiplier), change: 15 }
    ];
  };

  const generateAlerts = () => {
    setAlerts([
      { id: '1', type: 'critical', message: 'Oracle license compliance audit scheduled for next week', timestamp: new Date() },
      { id: '2', type: 'warning', message: 'SAP contract renewal approaching (45 days)', timestamp: new Date() },
      { id: '3', type: 'info', message: '3 new vendor onboarding requests pending approval', timestamp: new Date() }
    ]);
  };

  const generateAIInsights = () => {
    setAIInsights([
      {
        id: '1',
        title: 'Vendor Consolidation Opportunity',
        description: 'Consolidate 5 analytics tools into Microsoft Power BI',
        impact: 'high',
        savings: 285000,
        action: 'Review Analysis'
      },
      {
        id: '2',
        title: 'License Optimization Alert',
        description: 'ANSYS licenses are 77% underutilized',
        impact: 'medium',
        savings: 156000,
        action: 'Optimize Now'
      }
    ]);
  };

  const renderMetricCard = (metric: any) => (
    <div key={metric.id} className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-white/10 rounded-xl p-6 hover:border-blue-500/30 transition-all">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <metric.icon className="w-5 h-5 text-blue-400" />
          <h3 className="text-sm font-medium text-slate-400">{metric.title}</h3>
        </div>
        <span className={`text-xs flex items-center gap-1 ${metric.change > 0 ? 'text-green-400' : 'text-red-400'}`}>
          {metric.change > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {Math.abs(metric.change)}%
        </span>
      </div>
      <div className="text-3xl font-bold text-white mb-2">{metric.value}</div>
      <div className="text-xs text-slate-500">{metric.subtitle}</div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white">Loading dashboard...</div>
      </div>
    );
  }

  const metrics = dashboardData?.metrics || getDefaultMetrics(selectedTimeRange);
  const charts = dashboardData?.charts || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Alert Bar */}
      <div className="bg-red-500/10 border-b border-red-500/20 px-6 py-2 flex items-center gap-4 overflow-x-auto">
        {alerts.map(alert => (
          <div key={alert.id} className="flex items-center gap-2 text-xs whitespace-nowrap">
            {alert.type === 'critical' && <AlertCircle className="w-4 h-4 text-red-400" />}
            {alert.type === 'warning' && <AlertTriangle className="w-4 h-4 text-yellow-400" />}
            {alert.type === 'info' && <Info className="w-4 h-4 text-blue-400" />}
            <span className="text-slate-300">{alert.message}</span>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="px-6 py-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
              H
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">APM Command Center</h1>
              <p className="text-xs text-slate-400">Hubbell Incorporated • Real-time Portfolio Intelligence</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Dashboard/Builder Toggle */}
            <button
              onClick={() => setIsBuilderMode(!isBuilderMode)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                isBuilderMode 
                  ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-lg'
                  : 'bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              {isBuilderMode ? <Eye className="w-4 h-4" /> : <Settings className="w-4 h-4" />}
              {isBuilderMode ? 'View Dashboard' : 'Edit Dashboard'}
            </button>

            {!isBuilderMode && (
              <>
                {/* Time Range Selector */}
                <div className="flex bg-slate-800/50 rounded-lg p-1">
                  {['7D', '30D', '90D', '1Y'].map(range => (
                    <button
                      key={range}
                      onClick={() => setSelectedTimeRange(range)}
                      className={`px-3 py-1.5 text-xs rounded transition-all ${
                        selectedTimeRange === range
                          ? 'bg-blue-500 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {range}
                    </button>
                  ))}
                </div>

                {/* View Mode Toggle */}
                <button
                  onClick={() => setViewMode(viewMode === 'operational' ? 'ai' : 'operational')}
                  className="px-3 py-1.5 bg-slate-800/50 text-slate-400 hover:text-white rounded-lg text-xs transition-all flex items-center gap-2"
                >
                  {viewMode === 'operational' ? 'Operational View' : 'AI Insights'}
                </button>

                {/* Filters Button */}
                <button
                  onClick={() => setShowControls(!showControls)}
                  className="px-3 py-1.5 bg-slate-800/50 text-slate-400 hover:text-white rounded-lg text-xs transition-all"
                >
                  Filters
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Content - Dashboard or Builder */}
      {isBuilderMode ? (
        <div className="flex-1 min-h-screen bg-slate-950">
          <div className="p-4 bg-blue-500 text-white text-center mb-4">
            Dashboard Builder Mode - You should see widgets panel and canvas below
          </div>
          <DashboardBuilderFixed />
        </div>
      ) : (
        <div className="p-6">
        {/* Metrics Grid - Responsive: 1 col mobile, auto-fit compact cards desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-6 max-w-7xl mx-auto">
          {metrics.map(renderMetricCard)}
        </div>

        {/* Charts Grid - Content based on view mode */}
        {viewMode === 'operational' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Chart - Spend Analysis */}
          <div className="lg:col-span-2 bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-white/10 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Spend Analysis & Forecast</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={generateSpendData(selectedTimeRange)}>
                <defs>
                  <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorBudget" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="month" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                  labelStyle={{ color: '#e2e8f0' }}
                />
                <Area type="monotone" dataKey="actual" stroke="#3b82f6" fillOpacity={1} fill="url(#colorActual)" />
                <Area type="monotone" dataKey="budget" stroke="#10b981" fillOpacity={1} fill="url(#colorBudget)" />
                <Area type="monotone" dataKey="forecast" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorForecast)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* AI Insights Panel */}
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Brain className="w-5 h-5 text-purple-400" />
                AI Insights
              </h3>
            </div>
            <div className="space-y-4">
              {aiInsights.map(insight => (
                <div key={insight.id} className="bg-slate-800/30 rounded-lg p-4 border border-white/5">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="text-sm font-medium text-white">{insight.title}</h4>
                    <span className={`text-xs px-2 py-1 rounded ${
                      insight.impact === 'high' ? 'bg-red-500/20 text-red-400' :
                      insight.impact === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-blue-500/20 text-blue-400'
                    }`}>
                      {insight.impact}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mb-3">{insight.description}</p>
                  {insight.savings && (
                    <p className="text-sm font-semibold text-green-400 mb-2">
                      Potential Savings: ${insight.savings.toLocaleString()}
                    </p>
                  )}
                  <button className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
                    {insight.action} →
                  </button>
                </div>
              ))}
            </div>
          </div>
          </div>
        ) : (
          /* AI Insights View */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Enhanced AI Insights */}
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Brain className="w-5 h-5 text-purple-400" />
                AI-Powered Recommendations
              </h3>
              <div className="space-y-4">
                {aiInsights.map(insight => (
                  <div key={insight.id} className="bg-slate-800/30 rounded-lg p-6 border border-white/5">
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="text-base font-medium text-white">{insight.title}</h4>
                      <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                        insight.impact === 'high' ? 'bg-red-500/20 text-red-400' :
                        insight.impact === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-blue-500/20 text-blue-400'
                      }`}>
                        {insight.impact} impact
                      </span>
                    </div>
                    <p className="text-sm text-slate-300 mb-4">{insight.description}</p>
                    {insight.savings && (
                      <p className="text-lg font-semibold text-green-400 mb-4">
                        💰 Potential Savings: ${insight.savings.toLocaleString()}
                      </p>
                    )}
                    <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm transition-colors">
                      {insight.action} →
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Analytics Chart */}
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">AI Performance Metrics</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={generateVendorData(selectedTimeRange)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="name" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                    labelStyle={{ color: '#e2e8f0' }}
                  />
                  <Bar dataKey="value" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
        </div>
      )}

      {/* Controls Panel - Filters Modal - Only show in dashboard mode */}
      {!isBuilderMode && showControls && (
        <>
          {/* Background Overlay */}
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={() => setShowControls(false)} />
          
          {/* Modal Panel */}
          <div className="fixed right-0 top-0 h-full w-96 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-l border-white/20 shadow-2xl p-6 overflow-y-auto z-50">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-blue-400" />
                Filters & Controls
              </h3>
              <button 
                onClick={() => setShowControls(false)} 
                className="text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-700/50 p-2 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter Sections */}
            <div className="space-y-6">
              {/* Time Range Filter */}
              <div className="bg-slate-800/30 rounded-lg p-4 border border-white/10">
                <h4 className="text-sm font-medium text-slate-300 mb-3">Time Range</h4>
                <div className="grid grid-cols-2 gap-2">
                  {['7D', '30D', '90D', '1Y'].map(range => (
                    <button
                      key={range}
                      onClick={() => setSelectedTimeRange(range)}
                      className={`px-3 py-2 text-sm rounded transition-all ${
                        selectedTimeRange === range
                          ? 'bg-blue-500 text-white shadow-lg'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      {range}
                    </button>
                  ))}
                </div>
              </div>

              {/* View Mode Filter */}
              <div className="bg-slate-800/30 rounded-lg p-4 border border-white/10">
                <h4 className="text-sm font-medium text-slate-300 mb-3">Dashboard View</h4>
                <div className="space-y-2">
                  <button
                    onClick={() => setViewMode('operational')}
                    className={`w-full px-3 py-2 text-sm rounded transition-all text-left ${
                      viewMode === 'operational'
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    📊 Operational View
                  </button>
                  <button
                    onClick={() => setViewMode('ai')}
                    className={`w-full px-3 py-2 text-sm rounded transition-all text-left ${
                      viewMode === 'ai'
                        ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    🤖 AI Insights
                  </button>
                </div>
              </div>

              {/* Data Source Filters */}
              <div className="bg-slate-800/30 rounded-lg p-4 border border-white/10">
                <h4 className="text-sm font-medium text-slate-300 mb-3">Data Sources</h4>
                <div className="space-y-2">
                  {['Snowflake', 'ServiceNow', 'Intune', 'Azure'].map(source => (
                    <label key={source} className="flex items-center gap-3 cursor-pointer">
                      <input 
                        type="checkbox" 
                        defaultChecked 
                        className="rounded bg-slate-700 border-slate-600 text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
                      />
                      <span className="text-sm text-slate-300">{source}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Alert Filters */}
              <div className="bg-slate-800/30 rounded-lg p-4 border border-white/10">
                <h4 className="text-sm font-medium text-slate-300 mb-3">Alert Types</h4>
                <div className="space-y-2">
                  {[
                    { name: 'Critical', color: 'text-red-400' },
                    { name: 'Warning', color: 'text-yellow-400' },
                    { name: 'Info', color: 'text-blue-400' }
                  ].map(alert => (
                    <label key={alert.name} className="flex items-center gap-3 cursor-pointer">
                      <input 
                        type="checkbox" 
                        defaultChecked 
                        className="rounded bg-slate-700 border-slate-600 text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
                      />
                      <span className={`text-sm ${alert.color}`}>{alert.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4">
                <button className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors">
                  Apply Filters
                </button>
                <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm transition-colors">
                  Reset
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default HubbellResponsive;
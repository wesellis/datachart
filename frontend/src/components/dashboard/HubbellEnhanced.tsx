import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ComposedChart, Scatter
} from 'recharts';
import { TrendingUp, TrendingDown, AlertTriangle, Shield, DollarSign, 
         Activity, Target, Clock, ChevronDown, X, Filter, Brain,
         AlertCircle, CheckCircle, Info, BarChart2, PieChart as PieChartIcon } from 'lucide-react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

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

const HubbellEnhanced: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState('30D');
  const [showAIPanel, setShowAIPanel] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [aiInsights, setAIInsights] = useState<AIInsight[]>([]);
  const [executiveView, setExecutiveView] = useState(false);

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
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/v1/dashboards/hubbell-001/overview`);
      
      // Enhanced mock data for advanced features
      const enhancedData = {
        ...response.data,
        riskScore: calculateRiskScore(),
        predictions: generatePredictions(),
        anomalies: detectAnomalies(),
        optimizations: findOptimizations()
      };
      
      setData(enhancedData);
      setLoading(false);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      setLoading(false);
    }
  };

  const calculateRiskScore = () => {
    const factors = {
      vendorConcentration: Math.random() * 30,
      complianceGaps: Math.random() * 25,
      securityVulnerabilities: Math.random() * 25,
      costOverruns: Math.random() * 20
    };
    const total = Object.values(factors).reduce((a, b) => a + b, 0);
    return {
      score: Math.round(total),
      level: total > 70 ? 'High' : total > 40 ? 'Medium' : 'Low',
      factors
    };
  };

  const generatePredictions = () => ({
    nextMonthSpend: 1.92,
    vendorChurn: 3,
    complianceTarget: 92,
    costSavingOpportunity: 285000
  });

  const detectAnomalies = () => [
    { app: 'SAP S/4HANA', type: 'usage_spike', severity: 'medium', delta: '+45%' },
    { app: 'Oracle Database', type: 'cost_increase', severity: 'high', delta: '+$12K' },
    { app: 'ANSYS', type: 'license_underutilized', severity: 'low', delta: '23% used' }
  ];

  const findOptimizations = () => [
    { type: 'consolidation', apps: ['App1', 'App2'], savings: 45000 },
    { type: 'license_reduction', vendor: 'Microsoft', savings: 32000 },
    { type: 'alternative_vendor', current: 'Oracle', suggested: 'PostgreSQL', savings: 128000 }
  ];

  const generateAlerts = () => {
    const newAlerts: Alert[] = [
      {
        id: '1',
        type: 'critical',
        message: 'Oracle license compliance audit scheduled for next week',
        timestamp: new Date()
      },
      {
        id: '2',
        type: 'warning',
        message: 'SAP contract renewal approaching (45 days)',
        timestamp: new Date()
      },
      {
        id: '3',
        type: 'info',
        message: '3 new vendor onboarding requests pending approval',
        timestamp: new Date()
      }
    ];
    setAlerts(newAlerts);
  };

  const generateAIInsights = () => {
    const insights: AIInsight[] = [
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
      },
      {
        id: '3',
        title: 'Security Compliance Gap',
        description: '12 applications missing SOC2 certification',
        impact: 'high',
        action: 'View Details'
      },
      {
        id: '4',
        title: 'Cost Anomaly Detected',
        description: 'Unusual 45% spike in AWS spending this week',
        impact: 'medium',
        savings: 23000,
        action: 'Investigate'
      }
    ];
    setAIInsights(insights);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-400 text-lg">Initializing Command Center...</p>
        </div>
      </div>
    );
  }

  // Mock data for charts
  const vendorSpendTrend = Array.from({length: 12}, (_, i) => ({
    month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i],
    actual: 1.5 + Math.random() * 0.5,
    budget: 1.7,
    forecast: 1.6 + Math.random() * 0.3
  }));

  const riskMatrix = [
    { vendor: 'SAP', impact: 95, probability: 30, size: 2400 },
    { vendor: 'Oracle', impact: 85, probability: 45, size: 850 },
    { vendor: 'Microsoft', impact: 70, probability: 20, size: 730 },
    { vendor: 'Salesforce', impact: 60, probability: 35, size: 920 },
    { vendor: 'ANSYS', impact: 40, probability: 60, size: 689 }
  ];

  return (
    <div className="min-h-screen" style={{background: 'linear-gradient(135deg, #020617 0%, #0f172a 50%, #020617 100%)'}}>
      {/* Real-time Alerts Banner */}
      {alerts.length > 0 && (
        <div className="bg-gradient-to-r from-red-900/20 via-orange-900/20 to-red-900/20 border-b border-red-500/30 px-6 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 animate-pulse" />
              <div className="flex gap-6 overflow-x-auto">
                {alerts.map(alert => (
                  <div key={alert.id} className="flex items-center gap-2 text-sm">
                    <span className={`w-2 h-2 rounded-full ${
                      alert.type === 'critical' ? 'bg-red-500' :
                      alert.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                    }`}></span>
                    <span className="text-slate-300 whitespace-nowrap">{alert.message}</span>
                  </div>
                ))}
              </div>
            </div>
            <button className="text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Enhanced Header with Controls */}
      <div className="bg-slate-900/50 backdrop-blur-xl border-b border-white/10 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center font-bold text-xl shadow-lg">
                H
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                  APM Command Center
                </h1>
                <p className="text-slate-400 text-sm">Hubbell Incorporated • Real-time Portfolio Intelligence</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Time Range Selector */}
              <div className="flex bg-slate-800/50 rounded-lg p-1 border border-white/10">
                {['7D', '30D', '90D', '1Y'].map(range => (
                  <button
                    key={range}
                    onClick={() => setSelectedTimeRange(range)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                      selectedTimeRange === range 
                        ? 'bg-blue-500 text-white' 
                        : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                    }`}
                  >
                    {range}
                  </button>
                ))}
              </div>

              {/* View Toggle */}
              <button
                onClick={() => setExecutiveView(!executiveView)}
                className={`px-4 py-2 rounded-lg border transition-all flex items-center gap-2 ${
                  executiveView 
                    ? 'bg-purple-500/20 border-purple-500/30 text-purple-300'
                    : 'bg-slate-800/50 border-white/10 text-slate-400 hover:text-white'
                }`}
              >
                <Target className="w-4 h-4" />
                {executiveView ? 'Executive View' : 'Operational View'}
              </button>

              {/* Advanced Filters */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-4 py-2 bg-slate-800/50 border border-white/10 rounded-lg hover:bg-slate-700/50 transition-all flex items-center gap-2 text-slate-400 hover:text-white"
              >
                <Filter className="w-4 h-4" />
                Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 max-w-7xl mx-auto">
        {/* Executive KPI Cards with Predictions */}
        <div className="grid grid-cols-5 gap-4 mb-6">
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-white/10 rounded-xl p-6 hover:border-blue-500/30 transition-all group">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-blue-400" />
                <h3 className="text-sm font-medium text-slate-400">Total Spend</h3>
              </div>
              <span className="text-green-400 text-xs flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> 3.2%
              </span>
            </div>
            <div className="text-3xl font-bold text-white mb-2">$18.5M</div>
            <div className="text-xs text-slate-500">Budget: $20M • 92.5% utilized</div>
            <div className="mt-3 pt-3 border-t border-slate-700/50">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Next Month Forecast</span>
                <span className="text-blue-400 font-medium">${data?.predictions?.nextMonthSpend}M</span>
              </div>
            </div>
            {/* Mini sparkline */}
            <div className="mt-2 h-8 flex items-end gap-1">
              {[65, 70, 68, 72, 75, 73, 78, 80].map((h, i) => (
                <div key={i} className="flex-1 bg-blue-500/30 rounded-t" style={{height: `${h}%`}}></div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-white/10 rounded-xl p-6 hover:border-green-500/30 transition-all group">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-green-400" />
                <h3 className="text-sm font-medium text-slate-400">Risk Score</h3>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${
                data?.riskScore?.level === 'High' ? 'bg-red-500/20 text-red-400' :
                data?.riskScore?.level === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-green-500/20 text-green-400'
              }`}>
                {data?.riskScore?.level}
              </span>
            </div>
            <div className="text-3xl font-bold text-white mb-2">{data?.riskScore?.score}/100</div>
            <div className="text-xs text-slate-500">3 critical issues detected</div>
            <div className="mt-3 pt-3 border-t border-slate-700/50">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-500">Security</span>
                  <div className="w-full bg-slate-700 rounded-full h-1 mt-1">
                    <div className="bg-green-500 h-1 rounded-full" style={{width: '82%'}}></div>
                  </div>
                </div>
                <div>
                  <span className="text-slate-500">Compliance</span>
                  <div className="w-full bg-slate-700 rounded-full h-1 mt-1">
                    <div className="bg-yellow-500 h-1 rounded-full" style={{width: '67%'}}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-white/10 rounded-xl p-6 hover:border-purple-500/30 transition-all group">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-purple-400" />
                <h3 className="text-sm font-medium text-slate-400">Compliance</h3>
              </div>
              <span className="text-yellow-400 text-xs flex items-center gap-1">
                <TrendingDown className="w-3 h-3" /> 2.1%
              </span>
            </div>
            <div className="text-3xl font-bold text-white mb-2">87.4%</div>
            <div className="text-xs text-slate-500">Target: 90% • 23 gaps</div>
            <div className="mt-3 pt-3 border-t border-slate-700/50">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Predicted Q4</span>
                <span className="text-purple-400 font-medium">{data?.predictions?.complianceTarget}%</span>
              </div>
            </div>
            {/* Circular progress */}
            <div className="mt-2 relative w-12 h-12 mx-auto">
              <svg className="transform -rotate-90 w-12 h-12">
                <circle cx="24" cy="24" r="20" stroke="#334155" strokeWidth="3" fill="none"/>
                <circle cx="24" cy="24" r="20" stroke="#a855f7" strokeWidth="3" fill="none" 
                        strokeDasharray={`${87.4 * 1.26} 126`} strokeLinecap="round"/>
              </svg>
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-white/10 rounded-xl p-6 hover:border-yellow-500/30 transition-all group">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-yellow-400" />
                <h3 className="text-sm font-medium text-slate-400">Applications</h3>
              </div>
              <span className="text-green-400 text-xs flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> 8.1%
              </span>
            </div>
            <div className="text-3xl font-bold text-white mb-2">235</div>
            <div className="text-xs text-slate-500">218 active • 17 sunset</div>
            <div className="mt-3 pt-3 border-t border-slate-700/50">
              <div className="grid grid-cols-3 gap-1 text-xs text-center">
                <div>
                  <div className="text-green-400 font-bold">195</div>
                  <div className="text-slate-600 text-[10px]">Compliant</div>
                </div>
                <div>
                  <div className="text-yellow-400 font-bold">28</div>
                  <div className="text-slate-600 text-[10px]">Review</div>
                </div>
                <div>
                  <div className="text-red-400 font-bold">12</div>
                  <div className="text-slate-600 text-[10px]">Critical</div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-white/10 rounded-xl p-6 hover:border-cyan-500/30 transition-all group">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-medium text-slate-400">Optimization</h3>
              </div>
              <span className="text-green-400 text-xs">New</span>
            </div>
            <div className="text-3xl font-bold text-white mb-2">$285K</div>
            <div className="text-xs text-slate-500">Potential annual savings</div>
            <div className="mt-3 pt-3 border-t border-slate-700/50">
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Quick wins</span>
                  <span className="text-cyan-400 font-medium">$45K</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">6-month plan</span>
                  <span className="text-cyan-400 font-medium">$240K</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area with AI Panel */}
        <div className="grid grid-cols-12 gap-6">
          {/* Left Main Content */}
          <div className={showAIPanel ? 'col-span-9' : 'col-span-12'}>
            {/* Vendor Spend Trend with Predictions */}
            <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-xl p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">Spend Analysis & Forecast</h2>
                <div className="flex gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded"></div>
                    <span className="text-slate-400">Actual</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded"></div>
                    <span className="text-slate-400">Budget</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-purple-500 rounded"></div>
                    <span className="text-slate-400">Forecast</span>
                  </div>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={vendorSpendTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(value) => `$${value}M`} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }} />
                  <Bar dataKey="actual" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Line type="monotone" dataKey="budget" stroke="#10b981" strokeWidth={2} strokeDasharray="5 5" />
                  <Line type="monotone" dataKey="forecast" stroke="#a855f7" strokeWidth={2} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Risk Matrix */}
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Vendor Risk Matrix</h2>
                <ResponsiveContainer width="100%" height={250}>
                  <ComposedChart data={riskMatrix}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="probability" stroke="#94a3b8" fontSize={12} label={{ value: 'Probability %', position: 'insideBottom', offset: -5 }} />
                    <YAxis dataKey="impact" stroke="#94a3b8" fontSize={12} label={{ value: 'Impact Score', angle: -90, position: 'insideLeft' }} />
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }} />
                    <Scatter dataKey="impact" fill="#3b82f6">
                      {riskMatrix.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={
                          entry.probability > 50 ? '#ef4444' : 
                          entry.probability > 30 ? '#f59e0b' : '#10b981'
                        } />
                      ))}
                    </Scatter>
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Anomaly Detection</h2>
                <div className="space-y-3">
                  {data?.anomalies?.map((anomaly: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg border border-white/5">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          anomaly.severity === 'high' ? 'bg-red-500' :
                          anomaly.severity === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                        }`}></div>
                        <div>
                          <div className="text-sm font-medium text-white">{anomaly.app}</div>
                          <div className="text-xs text-slate-400">{anomaly.type.replace('_', ' ')}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-white">{anomaly.delta}</div>
                        <button className="text-xs text-blue-400 hover:text-blue-300">Investigate</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Portfolio Performance Story */}
            <div className="bg-gradient-to-br from-slate-800/30 to-slate-900/30 backdrop-blur-xl border border-white/10 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Executive Intelligence Summary</h2>
              <div className="prose prose-invert max-w-none">
                <p className="text-slate-300 leading-relaxed">
                  <span className="font-semibold text-white">Portfolio Performance:</span> Your application portfolio 
                  shows a <span className="text-green-400 font-medium">3.2% reduction</span> in monthly spend while 
                  maintaining <span className="text-blue-400 font-medium">87.4% compliance</span>. The consolidation 
                  of redundant tools has yielded <span className="text-green-400 font-medium">$285K in identified savings</span>.
                </p>
                <p className="text-slate-300 leading-relaxed mt-3">
                  <span className="font-semibold text-white">Critical Actions:</span> Immediate attention required for 
                  <span className="text-red-400 font-medium">Oracle license compliance</span> (audit in 7 days) and 
                  <span className="text-yellow-400 font-medium">SAP contract renewal</span> (45 days). 
                  AI analysis suggests prioritizing the consolidation of analytics tools for maximum ROI.
                </p>
                <p className="text-slate-300 leading-relaxed mt-3">
                  <span className="font-semibold text-white">Forecast:</span> Based on current trends, Q4 projects 
                  a <span className="text-blue-400 font-medium">92% compliance rate</span> and 
                  <span className="text-green-400 font-medium">$1.92M monthly spend</span>, well within budget targets.
                </p>
              </div>
            </div>
          </div>

          {/* AI Insights Panel */}
          {showAIPanel && (
            <div className="col-span-3">
              <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 backdrop-blur-xl border border-purple-500/20 rounded-xl p-4 sticky top-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-purple-400" />
                    <h3 className="text-white font-semibold">AI Insights</h3>
                  </div>
                  <button 
                    onClick={() => setShowAIPanel(false)}
                    className="text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="space-y-3">
                  {aiInsights.map(insight => (
                    <div key={insight.id} className="bg-slate-800/50 rounded-lg p-3 border border-white/10 hover:border-purple-500/30 transition-all cursor-pointer">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="text-sm font-medium text-white">{insight.title}</h4>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          insight.impact === 'high' ? 'bg-red-500/20 text-red-400' :
                          insight.impact === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-green-500/20 text-green-400'
                        }`}>
                          {insight.impact}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mb-2">{insight.description}</p>
                      {insight.savings && (
                        <div className="text-green-400 text-sm font-semibold mb-2">
                          Potential Savings: ${(insight.savings / 1000).toFixed(0)}K
                        </div>
                      )}
                      <button className="text-xs text-purple-400 hover:text-purple-300 font-medium">
                        {insight.action} →
                      </button>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-4 border-t border-slate-700/50">
                  <button className="w-full py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg text-purple-300 text-sm font-medium transition-all">
                    Generate Full Report
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Advanced Filters Panel (Slide-out) */}
      {showFilters && (
        <div className="fixed right-0 top-0 h-full w-80 bg-slate-900/95 backdrop-blur-xl border-l border-white/10 p-6 z-50 overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">Advanced Filters</h3>
            <button onClick={() => setShowFilters(false)} className="text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm text-slate-400 mb-2 block">Vendor Category</label>
              <select className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-white">
                <option>All Categories</option>
                <option>Infrastructure</option>
                <option>Security</option>
                <option>Productivity</option>
              </select>
            </div>
            
            <div>
              <label className="text-sm text-slate-400 mb-2 block">Risk Level</label>
              <div className="flex gap-2">
                {['Low', 'Medium', 'High'].map(level => (
                  <button key={level} className="flex-1 py-2 bg-slate-800 border border-white/10 rounded-lg text-sm text-slate-400 hover:bg-slate-700 hover:text-white transition-all">
                    {level}
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <label className="text-sm text-slate-400 mb-2 block">Compliance Score</label>
              <input type="range" min="0" max="100" className="w-full" />
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>0%</span>
                <span>100%</span>
              </div>
            </div>
            
            <div>
              <label className="text-sm text-slate-400 mb-2 block">Spend Range</label>
              <div className="grid grid-cols-2 gap-2">
                <input type="text" placeholder="Min" className="bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-white" />
                <input type="text" placeholder="Max" className="bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-white" />
              </div>
            </div>
            
            <button className="w-full py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-white font-medium transition-all mt-6">
              Apply Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default HubbellEnhanced;
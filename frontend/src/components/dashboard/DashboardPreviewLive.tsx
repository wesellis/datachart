import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Edit3, Share2, Download, Maximize, 
  DollarSign, Activity, Shield, Target, Brain, 
  AlertCircle, TrendingUp, TrendingDown
} from 'lucide-react';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';

interface Widget {
  id: string;
  type: string;
  title: string;
  position: { x: number; y: number; w: number; h: number };
  color?: string;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

const DashboardPreviewLive: React.FC = () => {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState<any>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds default
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [data, setData] = useState<any>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Load dashboard from sessionStorage (from builder)
    const previewData = sessionStorage.getItem('previewDashboard');
    if (previewData) {
      setDashboard(JSON.parse(previewData));
    } else {
      // Load from localStorage if saved
      const savedData = localStorage.getItem('savedDashboard');
      if (savedData) {
        setDashboard(JSON.parse(savedData));
      }
    }
  }, []);

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    setIsRefreshing(true);
    try {
      // Fetch from backend API
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/v1/dashboard/data`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const newData = await response.json();
        setData(newData);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setIsRefreshing(false);
      setLastRefresh(new Date());
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchDashboardData().then(() => setIsInitialized(true));
  }, []);

  // Auto-refresh data
  useEffect(() => {
    const interval = setInterval(fetchDashboardData, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  // Mock data for visualization
  const mockData = {
    spend: { value: 18.5, unit: 'M', trend: 3.2, status: 'up' },
    risk: { value: 42, unit: '/100', trend: -2.1, status: 'down', level: 'Medium' },
    compliance: { value: 87.4, unit: '%', trend: 0.8, status: 'up' },
    vendors: { value: 89, unit: '', trend: -5.3, status: 'down' },
    applications: { value: 235, unit: '', trend: 8.1, status: 'up' },
    
    barChartData: [
      { name: 'SAP', value: 2400 },
      { name: 'Oracle', value: 1800 },
      { name: 'Microsoft', value: 1600 },
      { name: 'Salesforce', value: 1200 },
      { name: 'Adobe', value: 900 }
    ],
    
    pieChartData: [
      { name: 'Infrastructure', value: 35 },
      { name: 'Security', value: 25 },
      { name: 'Productivity', value: 20 },
      { name: 'Development', value: 15 },
      { name: 'Analytics', value: 5 }
    ],
    
    lineChartData: Array.from({ length: 12 }, (_, i) => ({
      month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i],
      value: 1.5 + Math.random() * 0.5
    })),
    
    radarData: [
      { subject: 'Security', A: 88, fullMark: 100 },
      { subject: 'Performance', A: 92, fullMark: 100 },
      { subject: 'Cost', A: 75, fullMark: 100 },
      { subject: 'Compliance', A: 87, fullMark: 100 },
      { subject: 'Reliability', A: 95, fullMark: 100 },
      { subject: 'Scalability', A: 82, fullMark: 100 }
    ],
    
    aiInsights: [
      { title: 'Cost Optimization', description: 'Consolidate 5 analytics tools', savings: '$285K/year', impact: 'high' },
      { title: 'License Alert', description: 'ANSYS 77% underutilized', savings: '$156K/year', impact: 'medium' },
      { title: 'Compliance Gap', description: '12 apps missing SOC2', impact: 'high' },
      { title: 'Anomaly Detected', description: '45% spike in AWS spending', savings: '$23K/month', impact: 'medium' }
    ],
    
    alerts: [
      { type: 'critical', message: 'Oracle license audit next week' },
      { type: 'warning', message: 'SAP renewal in 45 days' },
      { type: 'info', message: '3 vendor onboarding pending' }
    ]
  };

  const renderWidget = (widget: Widget) => {
    const { type, title, position, color = '#3b82f6' } = widget;
    
    // Use absolute positioning to match builder exactly
    const GRID_SIZE = 60;
    const widgetStyle = {
      position: 'absolute' as const,
      left: `${position.x * GRID_SIZE + 4}px`,
      top: `${position.y * GRID_SIZE + 4}px`,
      width: `${position.w * GRID_SIZE - 8}px`,
      height: `${position.h * GRID_SIZE - 8}px`,
      margin: 0
    };

    // Metric widgets (KPIs)
    if (type === 'metric' || type === 'kpi') {
      const dataKey = title.toLowerCase().includes('spend') ? 'spend' :
                      title.toLowerCase().includes('risk') ? 'risk' :
                      title.toLowerCase().includes('compliance') ? 'compliance' :
                      title.toLowerCase().includes('vendor') ? 'vendors' : 'applications';
      const dataToUse = data || mockData;
      const metricData = dataToUse[dataKey as keyof typeof dataToUse] as any;
      
      return (
        <div key={widget.id} style={widgetStyle} className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-xl p-6 hover:border-blue-500/30 transition-all">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-slate-400">{title}</h3>
            <span className={`text-xs flex items-center gap-1 ${metricData.status === 'up' ? 'text-green-400' : 'text-red-400'}`}>
              {metricData.status === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {Math.abs(metricData.trend)}%
            </span>
          </div>
          <div className="text-3xl font-bold text-white">
            {dataKey === 'spend' && '$'}{metricData.value}{metricData.unit}
          </div>
          {dataKey === 'risk' && (
            <div className="mt-2 text-xs font-medium px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded-full inline-block">
              {metricData.level} Risk
            </div>
          )}
          <div className="mt-3 w-full bg-slate-700/50 rounded-full h-2">
            <div 
              className="h-2 rounded-full transition-all"
              style={{ 
                width: `${dataKey === 'risk' ? metricData.value : dataKey === 'compliance' ? metricData.value : 75}%`,
                backgroundColor: color 
              }}
            />
          </div>
        </div>
      );
    }

    // Bar chart widget
    if (type === 'bar-chart') {
      return (
        <div key={widget.id} style={widgetStyle} className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={mockData.barChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }} />
              <Bar dataKey="value" fill={color} radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      );
    }

    // Pie chart widget
    if (type === 'pie-chart') {
      return (
        <div key={widget.id} style={widgetStyle} className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={mockData.pieChartData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {mockData.pieChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      );
    }

    // Line chart widget
    if (type === 'line-chart') {
      return (
        <div key={widget.id} style={widgetStyle} className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={mockData.lineChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }} />
              <Area type="monotone" dataKey="value" stroke={color} fill={color} fillOpacity={0.3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      );
    }

    // Radar chart widget
    if (type === 'radar-chart') {
      return (
        <div key={widget.id} style={widgetStyle} className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={mockData.radarData}>
              <PolarGrid stroke="#334155" />
              <PolarAngleAxis dataKey="subject" stroke="#94a3b8" fontSize={12} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} stroke="#94a3b8" fontSize={10} />
              <Radar name="Score" dataKey="A" stroke={color} fill={color} fillOpacity={0.6} />
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      );
    }

    // AI Insights widget
    if (type === 'ai-insights') {
      return (
        <div key={widget.id} style={widgetStyle} className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 backdrop-blur-xl border border-purple-500/20 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Brain className="w-5 h-5 text-purple-400" />
            <h3 className="text-lg font-semibold text-white">{title}</h3>
          </div>
          <div className="space-y-3">
            {mockData.aiInsights.slice(0, 3).map((insight, i) => (
              <div key={i} className="bg-slate-800/50 rounded-lg p-3 border border-white/10">
                <h4 className="text-sm font-medium text-white mb-1">{insight.title}</h4>
                <p className="text-xs text-slate-400 mb-2">{insight.description}</p>
                {insight.savings && (
                  <div className="text-green-400 text-sm font-semibold">{insight.savings}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      );
    }

    // Alert banner widget
    if (type === 'alerts') {
      return (
        <div key={widget.id} style={widgetStyle} className="bg-gradient-to-r from-red-900/20 via-orange-900/20 to-red-900/20 border border-red-500/30 rounded-xl p-4">
          <div className="flex items-center gap-4 overflow-x-auto">
            <AlertCircle className="w-5 h-5 text-red-400 animate-pulse flex-shrink-0" />
            {mockData.alerts.map((alert, i) => (
              <div key={i} className="flex items-center gap-2 flex-shrink-0">
                <span className={`w-2 h-2 rounded-full ${
                  alert.type === 'critical' ? 'bg-red-500' :
                  alert.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                }`} />
                <span className="text-sm text-slate-300">{alert.message}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // Table widget
    if (type.includes('table')) {
      return (
        <div key={widget.id} style={widgetStyle} className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-xl p-6 overflow-auto">
          <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-2 text-sm font-medium text-slate-400">Name</th>
                <th className="text-left py-2 text-sm font-medium text-slate-400">Status</th>
                <th className="text-right py-2 text-sm font-medium text-slate-400">Value</th>
                <th className="text-center py-2 text-sm font-medium text-slate-400">Risk</th>
              </tr>
            </thead>
            <tbody>
              {['Application 1', 'Application 2', 'Application 3'].map((app, i) => (
                <tr key={i} className="border-b border-slate-700/50">
                  <td className="py-2 text-sm text-white">{app}</td>
                  <td className="py-2 text-sm text-green-400">Active</td>
                  <td className="py-2 text-sm text-right text-white">${(Math.random() * 100).toFixed(0)}K</td>
                  <td className="py-2 text-center">
                    <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded">Low</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    // Default/text widget
    return (
      <div key={widget.id} style={widgetStyle} className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
        <p className="text-sm text-slate-400">Widget type: {type}</p>
      </div>
    );
  };

  if (!dashboard) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
          <p className="text-lg text-slate-400">No dashboard to preview</p>
          <button
            onClick={() => navigate('/app/dashboard-builder')}
            className="mt-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg transition-all"
          >
            Back to Builder
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white ${fullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* Header */}
      <div className="bg-slate-900/50 backdrop-blur-xl border-b border-white/10 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/app/dashboard-builder')}
              className="p-2 hover:bg-slate-800/50 rounded-lg transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold">{dashboard.name}</h1>
              <p className="text-sm text-slate-400">Preview Mode</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setFullscreen(!fullscreen)}
              className="px-3 py-2 bg-slate-800/50 border border-white/10 rounded-lg hover:bg-slate-700/50 transition-all"
            >
              <Maximize className="w-4 h-4" />
            </button>
            <button className="px-3 py-2 bg-slate-800/50 border border-white/10 rounded-lg hover:bg-slate-700/50 transition-all">
              <Share2 className="w-4 h-4" />
            </button>
            <button className="px-3 py-2 bg-slate-800/50 border border-white/10 rounded-lg hover:bg-slate-700/50 transition-all">
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigate('/app/dashboard-builder')}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg transition-all flex items-center gap-2"
            >
              <Edit3 className="w-4 h-4" />
              Edit Dashboard
            </button>
          </div>
        </div>
      </div>

      {/* Dashboard Canvas - matches builder exactly */}
      <div className="p-6">
        <div 
          className="relative w-full bg-slate-900/30 rounded-xl"
          style={{
            minHeight: `${Math.max(600, Math.max(...(dashboard.widgets?.map((w: Widget) => (w.position.y + w.position.h) * 60) || [600])) + 120)}px`,
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
            padding: '4px'
          }}
        >
          {dashboard.widgets && dashboard.widgets.length > 0 ? (
            dashboard.widgets.map((widget: Widget) => renderWidget(widget))
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-slate-500">No widgets to display</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPreviewLive;
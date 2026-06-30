import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';

interface VendorData {
  vendor_name: string;
  total_spend: number;
  app_count: number;
  contract_count: number;
  change_percent: number;
}

interface ApplicationData {
  app_name: string;
  vendor: string;
  category: string;
  users: number;
  annual_cost: number;
  compliance_score: number;
  risk_level: string;
  last_review: string;
}

interface DashboardData {
  dashboard_id: string;
  customer_id: string;
  company_name: string;
  last_updated: string;
  metrics: {
    vendor: {
      data: {
        total_spend: number;
        vendor_count: number;
        vendors: VendorData[];
      }
    };
    applications: {
      data: {
        total_applications: number;
        compliance_rate: number;
        applications: ApplicationData[];
      }
    };
    compliance: {
      data: {
        overall_compliance_score: number;
      }
    };
  };
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

const HubbellDashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/v1/dashboards/hubbell-001/overview`);
      
      // Generate mock applications data since API doesn't return detailed apps
      const mockApplications = [
        { app_name: 'SAP S/4HANA', vendor: 'SAP', category: 'ERP', users: 12000, annual_cost: 2400000, compliance_score: 92, risk_level: 'Low', last_review: '2025-08-15' },
        { app_name: 'Salesforce CRM', vendor: 'Salesforce', category: 'CRM', users: 5000, annual_cost: 920000, compliance_score: 88, risk_level: 'Low', last_review: '2025-08-10' },
        { app_name: 'Oracle Database', vendor: 'Oracle', category: 'Database', users: 500, annual_cost: 856000, compliance_score: 85, risk_level: 'Medium', last_review: '2025-07-20' },
        { app_name: 'Microsoft 365', vendor: 'Microsoft', category: 'Productivity', users: 18000, annual_cost: 734000, compliance_score: 95, risk_level: 'Low', last_review: '2025-08-25' },
        { app_name: 'ANSYS Simulation', vendor: 'ANSYS', category: 'Engineering', users: 300, annual_cost: 689000, compliance_score: 78, risk_level: 'Medium', last_review: '2025-07-15' },
        { app_name: 'CATIA', vendor: 'Dassault Systemes', category: 'CAD', users: 250, annual_cost: 612000, compliance_score: 82, risk_level: 'Low', last_review: '2025-08-05' },
        { app_name: 'GE Digital APM', vendor: 'General Electric', category: 'Asset Management', users: 800, annual_cost: 578000, compliance_score: 90, risk_level: 'Low', last_review: '2025-08-20' },
        { app_name: 'EcoStruxure', vendor: 'Schneider Electric', category: 'IoT Platform', users: 1200, annual_cost: 445000, compliance_score: 86, risk_level: 'Medium', last_review: '2025-07-30' }
      ];
      
      // Enhance the data with applications
      const enhancedData = {
        ...response.data,
        metrics: {
          ...response.data.metrics,
          applications: {
            ...response.data.metrics.applications,
            data: {
              ...response.data.metrics.applications.data,
              applications: mockApplications
            }
          }
        }
      };
      
      setData(enhancedData);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-400 text-lg">Loading Hubbell Dashboard...</p>
        </div>
      </div>
    );
  }

  // Prepare chart data
  const vendorSpendData = data?.metrics.vendor?.data.vendors?.slice(0, 8) || [];
  const categoryData = [
    { name: 'Infrastructure', value: 35, color: '#3b82f6' },
    { name: 'Security', value: 25, color: '#ef4444' },
    { name: 'Productivity', value: 20, color: '#10b981' },
    { name: 'Development', value: 15, color: '#f59e0b' },
    { name: 'Analytics', value: 5, color: '#8b5cf6' }
  ];

  const complianceData = [
    { category: 'Security', score: 92, fullMark: 100 },
    { category: 'Performance', score: 88, fullMark: 100 },
    { category: 'Cost', score: 75, fullMark: 100 },
    { category: 'Governance', score: 85, fullMark: 100 },
    { category: 'Compliance', score: 90, fullMark: 100 },
    { category: 'Risk', score: 82, fullMark: 100 }
  ];

  const monthlySpendData = [
    { month: 'Jan', spend: 1.45, budget: 1.5 },
    { month: 'Feb', spend: 1.52, budget: 1.5 },
    { month: 'Mar', spend: 1.48, budget: 1.5 },
    { month: 'Apr', spend: 1.55, budget: 1.6 },
    { month: 'May', spend: 1.62, budget: 1.6 },
    { month: 'Jun', spend: 1.58, budget: 1.6 },
    { month: 'Jul', spend: 1.65, budget: 1.7 },
    { month: 'Aug', spend: 1.54, budget: 1.7 }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Header */}
      <div className="bg-slate-800/50 backdrop-blur-xl border-b border-white/10 p-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center font-bold text-xl">
              H
            </div>
            <div>
              <h1 className="text-2xl font-bold">Hubbell Incorporated</h1>
              <p className="text-slate-400 text-sm">Electrical Infrastructure & Power Solutions</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={handleRefresh}
              className={`px-4 py-2 bg-blue-500/20 border border-blue-500/30 rounded-lg hover:bg-blue-500/30 transition-all flex items-center gap-2 ${refreshing ? 'animate-pulse' : ''}`}
            >
              <span className={refreshing ? 'animate-spin' : ''}>🔄</span>
              Refresh Data
            </button>
            <div className="text-sm text-slate-500">
              Last updated: {new Date().toLocaleTimeString()}
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 max-w-7xl mx-auto">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-xl p-6 hover:bg-slate-800/60 transition-all">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-slate-400 text-sm font-medium">Total IT Spend</h3>
              <span className="text-green-400 text-xs">↑ 3.2%</span>
            </div>
            <div className="text-3xl font-bold text-blue-400">$18.5M</div>
            <div className="text-xs text-slate-500 mt-2">Annual budget: $20M</div>
            <div className="w-full bg-slate-700/50 rounded-full h-2 mt-2">
              <div className="bg-blue-500 h-2 rounded-full" style={{width: '92.5%'}}></div>
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-xl p-6 hover:bg-slate-800/60 transition-all">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-slate-400 text-sm font-medium">Active Vendors</h3>
              <span className="text-red-400 text-xs">↓ 5.3%</span>
            </div>
            <div className="text-3xl font-bold text-green-400">89</div>
            <div className="text-xs text-slate-500 mt-2">12 pending review</div>
            <div className="flex gap-1 mt-2">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="flex-1 h-8 bg-gradient-to-t from-green-500/20 to-green-500/50 rounded" 
                     style={{height: `${Math.random() * 20 + 10}px`}}></div>
              ))}
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-xl p-6 hover:bg-slate-800/60 transition-all">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-slate-400 text-sm font-medium">Applications</h3>
              <span className="text-green-400 text-xs">↑ 8.1%</span>
            </div>
            <div className="text-3xl font-bold text-purple-400">235</div>
            <div className="text-xs text-slate-500 mt-2">28 critical systems</div>
            <div className="grid grid-cols-3 gap-1 mt-2">
              <div className="h-4 bg-purple-500/30 rounded"></div>
              <div className="h-4 bg-purple-500/50 rounded"></div>
              <div className="h-4 bg-purple-500/20 rounded"></div>
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-xl p-6 hover:bg-slate-800/60 transition-all">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-slate-400 text-sm font-medium">Compliance Score</h3>
              <span className="text-yellow-400 text-xs">→ 0.0%</span>
            </div>
            <div className="text-3xl font-bold text-yellow-400">87.4%</div>
            <div className="text-xs text-slate-500 mt-2">Target: 90%</div>
            <div className="relative w-16 h-16 mx-auto mt-2">
              <svg className="transform -rotate-90 w-16 h-16">
                <circle cx="32" cy="32" r="28" stroke="#334155" strokeWidth="4" fill="none"/>
                <circle cx="32" cy="32" r="28" stroke="#eab308" strokeWidth="4" fill="none" 
                        strokeDasharray={`${87.4 * 1.76} 176`} strokeLinecap="round"/>
              </svg>
            </div>
          </div>
        </div>

        {/* Main Charts Grid */}
        <div className="grid grid-cols-12 gap-4">
          {/* Vendor Spend Analysis */}
          <div className="col-span-8 bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center justify-between">
              Top Vendor Spend Analysis
              <span className="text-sm text-slate-400">FY 2025</span>
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={vendorSpendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="vendor_name" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(value) => `$${(value/1000000).toFixed(1)}M`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                  formatter={(value: any) => `$${(value/1000000).toFixed(2)}M`}
                />
                <Bar dataKey="total_spend" fill="#3b82f6" radius={[8, 8, 0, 0]}>
                  {vendorSpendData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Category Distribution */}
          <div className="col-span-4 bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4">Spend by Category</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {categoryData.map((cat, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded" style={{backgroundColor: cat.color}}></div>
                    <span className="text-slate-400">{cat.name}</span>
                  </div>
                  <span className="text-white font-medium">{cat.value}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Monthly Spend Trend */}
          <div className="col-span-7 bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4">Monthly Spend vs Budget</h2>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={monthlySpendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(value) => `$${value}M`} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }} />
                <Area type="monotone" dataKey="budget" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                <Area type="monotone" dataKey="spend" stackId="2" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Compliance Radar */}
          <div className="col-span-5 bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4">Compliance Metrics</h2>
            <ResponsiveContainer width="100%" height={250}>
              <RadarChart data={complianceData}>
                <PolarGrid stroke="#334155" />
                <PolarAngleAxis dataKey="category" stroke="#94a3b8" fontSize={12} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} stroke="#94a3b8" fontSize={10} />
                <Radar name="Score" dataKey="score" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.6} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Top Applications Table */}
          <div className="col-span-12 bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4">Critical Applications</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Application</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Vendor</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Category</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">Users</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">Annual Cost</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-slate-400">Risk</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-slate-400">Compliance</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.metrics.applications?.data.applications?.slice(0, 8).map((app, i) => (
                    <tr key={i} className="border-b border-slate-700/50 hover:bg-slate-700/20 transition-colors">
                      <td className="py-3 px-4 text-sm font-medium">{app.app_name}</td>
                      <td className="py-3 px-4 text-sm text-slate-400">{app.vendor}</td>
                      <td className="py-3 px-4 text-sm text-slate-400">{app.category}</td>
                      <td className="py-3 px-4 text-sm text-right">{app.users.toLocaleString()}</td>
                      <td className="py-3 px-4 text-sm text-right">${(app.annual_cost / 1000).toFixed(0)}K</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          app.risk_level === 'Low' ? 'bg-green-500/20 text-green-400' :
                          app.risk_level === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {app.risk_level}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <div className="w-full max-w-[60px] bg-slate-700 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                app.compliance_score >= 90 ? 'bg-green-500' :
                                app.compliance_score >= 70 ? 'bg-yellow-500' :
                                'bg-red-500'
                              }`}
                              style={{width: `${app.compliance_score}%`}}
                            ></div>
                          </div>
                          <span className="text-xs text-slate-400 ml-1">{app.compliance_score}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer Stats */}
        <div className="mt-6 grid grid-cols-4 gap-4">
          <div className="bg-slate-800/30 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-400">18,000</div>
            <div className="text-xs text-slate-400 mt-1">Total Employees</div>
          </div>
          <div className="bg-slate-800/30 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-400">42</div>
            <div className="text-xs text-slate-400 mt-1">Global Locations</div>
          </div>
          <div className="bg-slate-800/30 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-purple-400">$4.9B</div>
            <div className="text-xs text-slate-400 mt-1">Annual Revenue</div>
          </div>
          <div className="bg-slate-800/30 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-yellow-400">NYSE: HUBB</div>
            <div className="text-xs text-slate-400 mt-1">Stock Symbol</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HubbellDashboard;
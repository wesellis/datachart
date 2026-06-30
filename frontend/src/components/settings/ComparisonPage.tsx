import React, { useState } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DollarSign, Clock, Zap, Users, TrendingUp, Shield, Award, CheckCircle, XCircle, ArrowRight, Sparkles } from 'lucide-react';

const ComparisonPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const costData = [
    { name: 'Year 1', Qlik: 96000, DataChart: 0 },
    { name: 'Year 2', Qlik: 154000, DataChart: 0 },
    { name: 'Year 3', Qlik: 250000, DataChart: 0 },
  ];

  const adoptionData = [
    { name: 'Month 1', Qlik: 15, DataChart: 45 },
    { name: 'Month 2', Qlik: 25, DataChart: 65 },
    { name: 'Month 3', Qlik: 35, DataChart: 80 },
    { name: 'Month 6', Qlik: 60, DataChart: 95 },
  ];

  const timeToValueData = [
    { metric: 'Dashboard Creation', value: 99.9, unit: '% faster' },
    { metric: 'User Training', value: 95, unit: '% reduction' },
    { metric: 'ROI Achievement', value: 30, unit: 'days vs 180' },
    { metric: 'Full Deployment', value: 1, unit: 'day vs 90' },
  ];

  const savingsBreakdown = [
    { category: 'Qlik Licenses', value: 250000, color: '#FF6B6B' },
    { category: 'Implementation', value: 75000, color: '#4ECDC4' },
    { category: 'Training', value: 15000, color: '#45B7D1' },
    { category: 'Unused Software Found', value: 340000, color: '#96CEB4' },
  ];

  const features = {
    'Dashboard Creation': { qlik: '2-3 hours', DataChart: '3 seconds', winner: 'DataChart' },
    'Cost (3 years)': { qlik: '$250,000+', DataChart: '$0', winner: 'DataChart' },
    'Real-time Collaboration': { qlik: '❌ No', DataChart: '✅ Yes', winner: 'DataChart' },
    'Embedded Actions': { qlik: '❌ View Only', DataChart: '✅ One-Click Fix', winner: 'DataChart' },
    'Excel Import': { qlik: 'Manual Modeling', DataChart: 'Instant Conversion', winner: 'DataChart' },
    'Predictive Analytics': { qlik: '$15K/year extra', DataChart: 'Included Free', winner: 'DataChart' },
    'Natural Language Query': { qlik: 'Basic', DataChart: 'Advanced AI (96%)', winner: 'DataChart' },
    'Mobile Experience': { qlik: 'Separate App', DataChart: 'PWA + Offline', winner: 'DataChart' },
    'User Adoption Rate': { qlik: '60%', DataChart: '95%', winner: 'DataChart' },
    'Time to Value': { qlik: '3-6 months', DataChart: '1 day', winner: 'DataChart' },
  };

  const killerFeatures = [
    {
      icon: <Zap className="w-6 h-6 text-yellow-500" />,
      title: 'One-Click Actions',
      description: 'Don\'t just view problems - FIX them instantly. Deploy patches, remove licenses, optimize costs.',
      impact: 'Save 8 hours/week'
    },
    {
      icon: <Users className="w-6 h-6 text-blue-500" />,
      title: 'Real-Time Collaboration',
      description: 'Google Docs-style editing. See teammates\' cursors, changes sync instantly.',
      impact: 'No version conflicts'
    },
    {
      icon: <Sparkles className="w-6 h-6 text-purple-500" />,
      title: 'AI Natural Language',
      description: '"Show me apps costing the most but used least" - Get instant visualizations.',
      impact: '96% accuracy'
    },
    {
      icon: <DollarSign className="w-6 h-6 text-green-500" />,
      title: 'Find Hidden Savings',
      description: 'AI discovers $340K in unused software, duplicate licenses, optimization opportunities.',
      impact: '$340K found'
    },
  ];

  const integrations = [
    'PatchMyPC', 'SCCM/MECM', 'Windows Autopatch', 'Entra ID', 
    'Salesforce Conga', 'Oracle Financials', 'Snowflake', 'ServiceNow'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                DataChart Dashboard vs. Qlik Sense
              </h1>
              <p className="text-xl text-gray-600">
                Why pay $250,000 when you can have better for FREE?
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-green-600">$680,000</div>
              <div className="text-sm text-gray-600">Total 3-Year Savings</div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex space-x-4 border-b">
            {['overview', 'features', 'roi', 'integrations'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 px-4 text-sm font-medium capitalize transition ${
                  activeTab === tab
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Cost Comparison Chart */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold mb-4">3-Year Cost Comparison</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={costData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                  <Legend />
                  <Bar dataKey="Qlik" fill="#FF6B6B" />
                  <Bar dataKey="DataChart" fill="#4ECDC4" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Adoption Rate Chart */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold mb-4">User Adoption Rate</h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={adoptionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => `${value}%`} />
                  <Legend />
                  <Line type="monotone" dataKey="Qlik" stroke="#FF6B6B" strokeWidth={2} />
                  <Line type="monotone" dataKey="DataChart" stroke="#4ECDC4" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Killer Features */}
            <div className="bg-white rounded-xl shadow-lg p-6 lg:col-span-2">
              <h2 className="text-xl font-bold mb-4">DataChart Exclusive Features</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {killerFeatures.map((feature, index) => (
                  <div key={index} className="flex space-x-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
                    <div className="flex-shrink-0">{feature.icon}</div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{feature.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{feature.description}</p>
                      <span className="inline-block mt-2 px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                        {feature.impact}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Savings Breakdown */}
            <div className="bg-white rounded-xl shadow-lg p-6 lg:col-span-2">
              <h2 className="text-xl font-bold mb-4">Total Savings Breakdown</h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={savingsBreakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.category}: $${(entry.value / 1000).toFixed(0)}K`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {savingsBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Features Tab */}
        {activeTab === 'features' && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-6">Feature-by-Feature Comparison</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Feature</th>
                    <th className="text-center py-3 px-4">Qlik Sense</th>
                    <th className="text-center py-3 px-4">DataChart Dashboard</th>
                    <th className="text-center py-3 px-4">Winner</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(features).map(([feature, comparison]) => (
                    <tr key={feature} className="border-b hover:bg-gray-50">
                      <td className="py-4 px-4 font-medium">{feature}</td>
                      <td className="py-4 px-4 text-center text-gray-600">{comparison.qlik}</td>
                      <td className="py-4 px-4 text-center font-medium text-green-600">
                        {comparison.DataChart}
                      </td>
                      <td className="py-4 px-4 text-center">
                        {comparison.winner === 'DataChart' ? (
                          <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-500 mx-auto" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Unique Capabilities */}
            <div className="mt-8 p-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg">
              <h3 className="text-lg font-bold mb-4">🚀 DataChart Exclusive Capabilities</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-start space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Embedded Actions</p>
                    <p className="text-sm text-gray-600">Fix problems with one click</p>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Real-time Collaboration</p>
                    <p className="text-sm text-gray-600">Multiple users edit simultaneously</p>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Excel Auto-Convert</p>
                    <p className="text-sm text-gray-600">Drop file, get dashboard instantly</p>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium">License Optimization</p>
                    <p className="text-sm text-gray-600">AI finds $340K in savings</p>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Shadow IT Discovery</p>
                    <p className="text-sm text-gray-600">Find & block unauthorized apps</p>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Patch Automation</p>
                    <p className="text-sm text-gray-600">Deploy updates from dashboard</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ROI Tab */}
        {activeTab === 'roi' && (
          <div className="space-y-8">
            {/* ROI Summary */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl shadow-lg p-8 text-white">
              <h2 className="text-3xl font-bold mb-4">Return on Investment</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div>
                  <div className="text-4xl font-bold">$680K</div>
                  <div className="text-green-100">3-Year Savings</div>
                </div>
                <div>
                  <div className="text-4xl font-bold">1 Day</div>
                  <div className="text-green-100">Time to Value</div>
                </div>
                <div>
                  <div className="text-4xl font-bold">95%</div>
                  <div className="text-green-100">User Adoption</div>
                </div>
                <div>
                  <div className="text-4xl font-bold">40%</div>
                  <div className="text-green-100">Productivity Gain</div>
                </div>
              </div>
            </div>

            {/* Time to Value Metrics */}
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h3 className="text-xl font-bold mb-6">Time to Value Comparison</h3>
              <div className="space-y-4">
                {timeToValueData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">{item.metric}</p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-600">{item.value}</p>
                        <p className="text-sm text-gray-600">{item.unit}</p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Cost Breakdown */}
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h3 className="text-xl font-bold mb-6">Detailed Cost Analysis</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h4 className="font-semibold text-red-600 mb-4">Qlik Sense Enterprise</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between py-2 border-b">
                      <span>License Cost</span>
                      <span className="font-medium">$30,000/year</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span>Per User (after 5)</span>
                      <span className="font-medium">$70/month</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span>Implementation</span>
                      <span className="font-medium">$50,000-100,000</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span>Training</span>
                      <span className="font-medium">$10,000</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span>Annual Maintenance</span>
                      <span className="font-medium">$6,000</span>
                    </div>
                    <div className="flex justify-between py-2 font-bold text-red-600">
                      <span>3-Year Total</span>
                      <span>$250,000+</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-green-600 mb-4">DataChart Dashboard</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between py-2 border-b">
                      <span>License Cost</span>
                      <span className="font-medium text-green-600">$0</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span>Per User</span>
                      <span className="font-medium text-green-600">$0</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span>Implementation</span>
                      <span className="font-medium text-green-600">$0 (Self-service)</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span>Training</span>
                      <span className="font-medium text-green-600">$0 (Intuitive)</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span>Annual Maintenance</span>
                      <span className="font-medium text-green-600">$0</span>
                    </div>
                    <div className="flex justify-between py-2 font-bold text-green-600">
                      <span>3-Year Total</span>
                      <span>$0</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Integrations Tab */}
        {activeTab === 'integrations' && (
          <div className="space-y-8">
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-bold mb-6">Enterprise Integrations</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {integrations.map((integration) => (
                  <div
                    key={integration}
                    className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg text-center"
                  >
                    <Shield className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <p className="font-medium text-sm">{integration}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Integration Benefits */}
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h3 className="text-xl font-bold mb-6">What These Integrations Enable</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <Zap className="w-5 h-5 text-yellow-500 mt-1" />
                    <div>
                      <p className="font-medium">Automated Patch Deployment</p>
                      <p className="text-sm text-gray-600">Deploy patches directly from dashboards via PatchMyPC</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <DollarSign className="w-5 h-5 text-green-500 mt-1" />
                    <div>
                      <p className="font-medium">Financial Integration</p>
                      <p className="text-sm text-gray-600">Pull costs from Oracle, contracts from Salesforce</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Shield className="w-5 h-5 text-blue-500 mt-1" />
                    <div>
                      <p className="font-medium">Security Compliance</p>
                      <p className="text-sm text-gray-600">Real-time compliance tracking via SCCM/Autopatch</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <Users className="w-5 h-5 text-purple-500 mt-1" />
                    <div>
                      <p className="font-medium">Identity Management</p>
                      <p className="text-sm text-gray-600">SSO and app registration via Entra ID</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <TrendingUp className="w-5 h-5 text-indigo-500 mt-1" />
                    <div>
                      <p className="font-medium">Data Warehouse</p>
                      <p className="text-sm text-gray-600">Pull app usage data from Snowflake</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Award className="w-5 h-5 text-orange-500 mt-1" />
                    <div>
                      <p className="font-medium">Service Management</p>
                      <p className="text-sm text-gray-600">Create tickets in ServiceNow automatically</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* The Pitch */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-lg p-8 text-white">
              <h3 className="text-2xl font-bold mb-4">The Bottom Line</h3>
              <p className="text-lg mb-6">
                DataChart Dashboard isn't just better than Qlik - it's in a completely different league. 
                While Qlik shows you data, we help you take action. While Qlik costs $250,000, we cost nothing. 
                While Qlik takes months to implement, we're ready in one day.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white/20 rounded-lg p-4">
                  <p className="text-2xl font-bold">100x</p>
                  <p className="text-white/90">Faster Dashboard Creation</p>
                </div>
                <div className="bg-white/20 rounded-lg p-4">
                  <p className="text-2xl font-bold">$680K</p>
                  <p className="text-white/90">Total Savings Found</p>
                </div>
                <div className="bg-white/20 rounded-lg p-4">
                  <p className="text-2xl font-bold">1 Day</p>
                  <p className="text-white/90">Full Deployment</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ComparisonPage;
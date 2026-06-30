import React, { useState, useEffect } from 'react';
import UserManagement from './UserManagement';
import { userService } from '../../services/userService';

const AdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCurrentUser();
  }, []);

  const loadCurrentUser = async () => {
    try {
      const user = await userService.getCurrentUser();
      setCurrentUser(user);
    } catch (error) {
      console.error('Failed to load current user:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6 flex items-center justify-center">
        <div>Loading admin panel...</div>
      </div>
    );
  }

  const tabs = [
    { id: 'dashboard', name: 'Dashboard', icon: '📊' },
    { id: 'users', name: 'User Management', icon: '👥' },
    { id: 'organizations', name: 'Organizations', icon: '🏢' },
    { id: 'billing', name: 'Billing & Subscriptions', icon: '💳' },
    { id: 'analytics', name: 'Analytics', icon: '📈' },
    { id: 'settings', name: 'System Settings', icon: '⚙️' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <div className="flex">
        {/* Sidebar Navigation */}
        <div className="w-64 bg-slate-800/50 min-h-screen">
          <div className="p-6">
            <h1 className="text-xl font-bold mb-6">DataChart Admin</h1>
            <div className="space-y-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center gap-3 ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:bg-slate-700/50'
                  }`}
                >
                  <span className="text-lg">{tab.icon}</span>
                  {tab.name}
                </button>
              ))}
            </div>
          </div>
          
          {/* User Info */}
          {currentUser && (
            <div className="absolute bottom-4 left-4 right-4">
              <div className="bg-slate-700/50 rounded-lg p-3">
                <div className="text-sm text-slate-300">Logged in as:</div>
                <div className="text-white font-medium">
                  {currentUser.first_name} {currentUser.last_name}
                </div>
                <div className="text-xs text-slate-400">{currentUser.email}</div>
              </div>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1 bg-white min-h-screen">
          {activeTab === 'dashboard' && (
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Admin Dashboard</h2>
              
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white shadow rounded-lg p-6 border-l-4 border-blue-500">
                  <div className="text-sm font-medium text-gray-500">Total Users</div>
                  <div className="text-2xl font-bold text-gray-900">1,247</div>
                  <div className="text-green-600 text-sm">+12% this month</div>
                </div>
                <div className="bg-white shadow rounded-lg p-6 border-l-4 border-green-500">
                  <div className="text-sm font-medium text-gray-500">Active Organizations</div>
                  <div className="text-2xl font-bold text-gray-900">89</div>
                  <div className="text-green-600 text-sm">+5% this month</div>
                </div>
                <div className="bg-white shadow rounded-lg p-6 border-l-4 border-yellow-500">
                  <div className="text-sm font-medium text-gray-500">Monthly Revenue</div>
                  <div className="text-2xl font-bold text-gray-900">$47,580</div>
                  <div className="text-green-600 text-sm">+18% this month</div>
                </div>
                <div className="bg-white shadow rounded-lg p-6 border-l-4 border-red-500">
                  <div className="text-sm font-medium text-gray-500">Support Tickets</div>
                  <div className="text-2xl font-bold text-gray-900">23</div>
                  <div className="text-red-600 text-sm">4 urgent</div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 p-3 bg-gray-50 rounded">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600">👤</span>
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium">New user registration</div>
                        <div className="text-xs text-gray-500">john.doe@company.com joined</div>
                      </div>
                      <div className="text-xs text-gray-400">2 min ago</div>
                    </div>
                    <div className="flex items-center gap-4 p-3 bg-gray-50 rounded">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-green-600">🏢</span>
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium">Organization upgraded</div>
                        <div className="text-xs text-gray-500">Acme Corp upgraded to Enterprise</div>
                      </div>
                      <div className="text-xs text-gray-400">1 hour ago</div>
                    </div>
                    <div className="flex items-center gap-4 p-3 bg-gray-50 rounded">
                      <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                        <span className="text-yellow-600">⚠️</span>
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium">System alert</div>
                        <div className="text-xs text-gray-500">High CPU usage detected</div>
                      </div>
                      <div className="text-xs text-gray-400">3 hours ago</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'users' && <UserManagement />}
          
          {activeTab === 'organizations' && (
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Organization Management</h2>
              <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
                Organization management functionality is coming soon.
              </div>
            </div>
          )}
          
          {activeTab === 'billing' && (
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Billing & Subscriptions</h2>
              
              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-blue-50 p-6 rounded-lg">
                  <h3 className="font-semibold text-blue-900 mb-2">Subscription Overview</h3>
                  <p className="text-blue-700 text-sm mb-4">Monitor subscription status and usage</p>
                  <a 
                    href="/app/billing" 
                    className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
                  >
                    View Billing Dashboard
                  </a>
                </div>
                
                <div className="bg-green-50 p-6 rounded-lg">
                  <h3 className="font-semibold text-green-900 mb-2">Usage Analytics</h3>
                  <p className="text-green-700 text-sm mb-4">Track usage across all features</p>
                  <button className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700">
                    View Usage Report
                  </button>
                </div>
                
                <div className="bg-purple-50 p-6 rounded-lg">
                  <h3 className="font-semibold text-purple-900 mb-2">Plan Management</h3>
                  <p className="text-purple-700 text-sm mb-4">Upgrade or modify subscription</p>
                  <button className="bg-purple-600 text-white px-4 py-2 rounded text-sm hover:bg-purple-700">
                    Manage Plan
                  </button>
                </div>
              </div>

              {/* Recent Billing Activity */}
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b">
                  <h3 className="text-lg font-medium text-gray-900">Recent Billing Activity</h3>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div>
                        <div className="font-medium">Payment Successful</div>
                        <div className="text-sm text-gray-600">Professional Plan - $299.00</div>
                      </div>
                      <div className="text-sm text-gray-500">2 days ago</div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div>
                        <div className="font-medium">Plan Upgraded</div>
                        <div className="text-sm text-gray-600">Starter → Professional</div>
                      </div>
                      <div className="text-sm text-gray-500">1 week ago</div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div>
                        <div className="font-medium">Subscription Started</div>
                        <div className="text-sm text-gray-600">Starter Plan - $99.00</div>
                      </div>
                      <div className="text-sm text-gray-500">1 month ago</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'analytics' && (
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">System Analytics</h2>
              <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
                Analytics dashboard is coming soon.
              </div>
            </div>
          )}
          
          {activeTab === 'settings' && (
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">System Settings</h2>
              <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
                System settings panel is coming soon.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
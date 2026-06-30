import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Settings, 
  Users, 
  Shield, 
  CreditCard, 
  Database, 
  Bell, 
  Palette, 
  Key,
  BarChart3,
  TrendingUp,
  DollarSign
} from 'lucide-react';

const SettingsMenu: React.FC = () => {
  const location = useLocation();

  const menuItems = [
    { icon: Settings, label: 'General', path: '/settings/general' },
    { icon: Users, label: 'Team Management', path: '/settings/team' },
    { icon: Shield, label: 'Security', path: '/settings/security' },
    { icon: CreditCard, label: 'Billing', path: '/settings/billing' },
    { icon: Database, label: 'Data Sources', path: '/settings/data-sources' },
    { icon: Bell, label: 'Notifications', path: '/settings/notifications' },
    { icon: Palette, label: 'Appearance', path: '/settings/appearance' },
    { icon: Key, label: 'API Keys', path: '/settings/api-keys' },
    { 
      icon: TrendingUp, 
      label: 'Why DataChart Wins', 
      path: '/settings/comparison',
      highlight: true,
      badge: 'NEW'
    },
  ];

  return (
    <div className="w-64 bg-white border-r border-gray-200 min-h-screen">
      <div className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Settings</h2>
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors
                  ${isActive 
                    ? 'bg-blue-50 text-blue-700' 
                    : item.highlight 
                      ? 'text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }
                `}
              >
                <div className="flex items-center">
                  <Icon className="w-5 h-5 mr-3" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="px-2 py-1 text-xs font-bold bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-full">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Special Section for Value Proposition */}
        <div className="mt-8 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
          <div className="flex items-center mb-2">
            <DollarSign className="w-5 h-5 text-green-600 mr-2" />
            <h3 className="font-semibold text-green-900">Savings Calculator</h3>
          </div>
          <p className="text-sm text-green-700 mb-3">
            See how much you're saving vs. Qlik Sense
          </p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">3-Year Qlik Cost:</span>
              <span className="font-medium text-red-600 line-through">$250,000</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">DataChart Cost:</span>
              <span className="font-medium text-green-600">$0</span>
            </div>
            <div className="pt-2 border-t border-green-200">
              <div className="flex justify-between">
                <span className="font-medium text-gray-700">You Save:</span>
                <span className="font-bold text-green-600">$250,000</span>
              </div>
            </div>
          </div>
          <Link 
            to="/settings/comparison"
            className="mt-3 w-full inline-flex justify-center items-center px-3 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-sm font-medium rounded-lg hover:from-green-600 hover:to-emerald-600 transition"
          >
            View Full Comparison
            <BarChart3 className="w-4 h-4 ml-2" />
          </Link>
        </div>

        {/* Quick Stats */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-3">Platform Stats</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Dashboards Created:</span>
              <span className="font-medium">47</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Time Saved:</span>
              <span className="font-medium">312 hours</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Savings Found:</span>
              <span className="font-medium text-green-600">$340K</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">User Adoption:</span>
              <span className="font-medium">95%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsMenu;
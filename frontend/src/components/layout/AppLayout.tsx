import React, { ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { usePermissions } from '../../hooks/useAuth';
import { 
  LayoutDashboard, Database, Settings, ChevronLeft, ChevronRight,
  User, LogOut, Key, CreditCard, Menu, X, Bell, Search,
  BarChart3, Shield, Zap, HelpCircle, Activity, TrendingUp,
  Users, FileText, Lock, Globe, Sparkles
} from 'lucide-react';

interface AppLayoutProps {
  children: ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const { canCreateDashboards, canManageUsers, hasApiAccess } = usePermissions();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { 
      name: 'Dashboard Builder', 
      href: '/app/dashboard-builder', 
      icon: <LayoutDashboard className="w-5 h-5" />,
      badge: 'New',
      badgeColor: 'bg-green-500'
    },
    { 
      name: 'Analytics', 
      href: '/app/analytics', 
      icon: <BarChart3 className="w-5 h-5" />,
      badge: null
    },
    { 
      name: 'Data Sources', 
      href: '/app/data-sources', 
      icon: <Database className="w-5 h-5" />,
      badge: '4',
      badgeColor: 'bg-blue-500'
    },
    { 
      name: 'Reports', 
      href: '/app/reports', 
      icon: <FileText className="w-5 h-5" />,
      badge: null
    },
    ...(canManageUsers() ? [{ 
      name: 'Admin Panel', 
      href: '/admin', 
      icon: <Shield className="w-5 h-5" />,
      badge: null,
      separator: true
    }] : []),
  ];

  const bottomNavItems = [
    { 
      name: 'Help & Support', 
      href: '/app/help', 
      icon: <HelpCircle className="w-5 h-5" />
    },
    { 
      name: 'Settings', 
      href: '/app/settings', 
      icon: <Settings className="w-5 h-5" />
    },
  ];

  const getPlanBadge = () => {
    const plan = user?.organizations?.[0]?.plan_type || 'free';
    const planColors: { [key: string]: string } = {
      free: 'bg-gray-500',
      starter: 'bg-blue-500',
      professional: 'bg-purple-500',
      enterprise: 'bg-gradient-to-r from-purple-500 to-pink-500'
    };
    return {
      color: planColors[plan.toLowerCase()] || 'bg-gray-500',
      label: plan.charAt(0).toUpperCase() + plan.slice(1)
    };
  };

  const planBadge = getPlanBadge();

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Enhanced Sidebar */}
      <div className={`${
        sidebarOpen ? 'w-72' : 'w-20'
      } bg-gradient-to-b from-slate-900/95 to-slate-900/90 backdrop-blur-xl border-r border-white/10 transition-all duration-300 flex flex-col relative`}>
        
        {/* Logo and Toggle */}
        <div className="p-5 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className={`flex items-center gap-3 ${sidebarOpen ? 'opacity-100' : 'opacity-0'} transition-opacity duration-200`}>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">DataChart</h1>
                <p className="text-xs text-slate-400">Chart Platform</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors text-slate-400 hover:text-white"
            >
              {sidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Search Bar (when sidebar is open) */}
        {sidebarOpen && (
          <div className="px-5 py-3 border-b border-white/10">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all"
              />
            </div>
          </div>
        )}

        {/* Main Navigation */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <div className="space-y-1">
            {navItems.map((item) => (
              <React.Fragment key={item.name}>
                {item.separator && sidebarOpen && (
                  <div className="my-3 border-t border-white/10"></div>
                )}
                <Link
                  to={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group relative ${
                    location.pathname === item.href
                      ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-white border border-white/10'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                  title={!sidebarOpen ? item.name : ''}
                >
                  <div className={`${
                    location.pathname === item.href
                      ? 'text-blue-400'
                      : 'text-slate-400 group-hover:text-white'
                  } transition-colors`}>
                    {item.icon}
                  </div>
                  {sidebarOpen && (
                    <>
                      <span className="flex-1 font-medium">{item.name}</span>
                      {item.badge && (
                        <span className={`px-2 py-0.5 text-xs font-medium text-white rounded-full ${
                          item.badgeColor || 'bg-slate-600'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                  {location.pathname === item.href && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-blue-400 to-purple-400 rounded-r-full"></div>
                  )}
                </Link>
              </React.Fragment>
            ))}
          </div>

          {/* Bottom Navigation Items */}
          <div className="mt-auto pt-4 border-t border-white/10">
            <div className="space-y-1">
              {bottomNavItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group ${
                    location.pathname === item.href
                      ? 'bg-white/10 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                  title={!sidebarOpen ? item.name : ''}
                >
                  <div className="text-slate-400 group-hover:text-white transition-colors">
                    {item.icon}
                  </div>
                  {sidebarOpen && <span className="font-medium">{item.name}</span>}
                </Link>
              ))}
            </div>
          </div>
        </nav>

        {/* User Profile Section */}
        {sidebarOpen && (
          <div className="p-4 border-t border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/20">
                <span className="text-white font-semibold">
                  {user?.first_name?.[0] || user?.email[0].toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user?.first_name} {user?.last_name}
                </p>
                <p className="text-xs text-slate-400 truncate">{user?.email}</p>
              </div>
              <span className={`px-2 py-1 text-xs font-medium text-white rounded-md ${planBadge.color}`}>
                {planBadge.label}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Enhanced Top Bar */}
        <header className="bg-slate-900/50 backdrop-blur-xl border-b border-white/10 px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Page Title and Breadcrumbs */}
            <div>
              <h2 className="text-xl font-semibold text-white">
                {navItems.find(item => item.href === location.pathname)?.name || 'Dashboard'}
              </h2>
              <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                <span>Home</span>
                <ChevronRight className="w-3 h-3" />
                <span className="text-slate-300">
                  {navItems.find(item => item.href === location.pathname)?.name || 'Dashboard'}
                </span>
              </div>
            </div>
            
            {/* Right Side Actions */}
            <div className="flex items-center gap-4">
              {/* Quick Actions */}
              <button className="p-2 rounded-lg hover:bg-white/10 transition-colors text-slate-400 hover:text-white relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              </button>
              
              {/* User Dropdown */}
              <div className="relative">
                <button 
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/10 transition-all"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-semibold">
                      {user?.first_name?.[0] || user?.email[0].toUpperCase()}
                    </span>
                  </div>
                  <div className="text-left hidden sm:block">
                    <p className="text-sm font-medium text-white">
                      {user?.first_name} {user?.last_name}
                    </p>
                    <p className="text-xs text-slate-400">{planBadge.label} Plan</p>
                  </div>
                  <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${
                    profileDropdownOpen ? 'rotate-90' : ''
                  }`} />
                </button>
                
                {/* Enhanced Dropdown Menu */}
                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-slate-800 rounded-xl shadow-2xl border border-white/10 overflow-hidden z-50">
                    <div className="p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-b border-white/10">
                      <p className="text-sm font-medium text-white">{user?.email}</p>
                      <p className="text-xs text-slate-400 mt-1">
                        Organization: {user?.organizations?.[0]?.name || 'Personal'}
                      </p>
                    </div>
                    
                    <div className="p-2">
                      <Link
                        to="/app/profile"
                        className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-white/10 transition-all"
                        onClick={() => setProfileDropdownOpen(false)}
                      >
                        <User className="w-4 h-4" />
                        Profile Settings
                      </Link>
                      
                      {hasApiAccess() && (
                        <Link
                          to="/app/api-keys"
                          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-white/10 transition-all"
                          onClick={() => setProfileDropdownOpen(false)}
                        >
                          <Key className="w-4 h-4" />
                          API Keys
                        </Link>
                      )}
                      
                      <Link
                        to="/app/billing"
                        className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-white/10 transition-all"
                        onClick={() => setProfileDropdownOpen(false)}
                      >
                        <CreditCard className="w-4 h-4" />
                        Billing & Plans
                      </Link>
                      
                      <div className="border-t border-white/10 mt-2 pt-2">
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
          <div className="h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
import React, { useState } from 'react';
import { AuthProvider, useAuth } from '../../contexts/AuthContext';
import { APMDashboardProvider } from '../../contexts/APMDashboardContext';
import APMDashboard from './APMDashboard';
import Login from '../Login/Login';
import { LogOut, Building, Users, DollarSign, Shield, TrendingUp } from 'lucide-react';
import './APMDashboardWrapper.css';

const DashboardSelector: React.FC = () => {
  const { user, logout, switchDashboard } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);

  if (!user) return null;

  const getDashboardIcon = (dashboardId: string) => {
    switch (dashboardId) {
      case 'overview':
        return <Building size={16} />;
      case 'optimization':
        return <DollarSign size={16} />;
      case 'compliance':
        return <Shield size={16} />;
      case 'planning':
        return <TrendingUp size={16} />;
      case 'operations':
        return <Users size={16} />;
      default:
        return <Building size={16} />;
    }
  };

  const getDashboardName = (dashboardId: string) => {
    switch (dashboardId) {
      case 'overview':
        return 'Executive Overview';
      case 'optimization':
        return 'Cost Optimization';
      case 'compliance':
        return 'Risk & Compliance';
      case 'planning':
        return 'Strategic Planning';
      case 'operations':
        return 'Operations';
      default:
        return dashboardId;
    }
  };

  return (
    <div className="dashboard-selector">
      <div className="user-info">
        <span className="user-name">{user.name}</span>
        <span className="user-role">{user.role}</span>
      </div>
      
      {user.dashboards.length > 1 && (
        <div className="dashboard-dropdown">
          <button 
            className="dropdown-toggle"
            onClick={() => setShowDropdown(!showDropdown)}
          >
            {getDashboardIcon(user.currentDashboard)}
            <span>{getDashboardName(user.currentDashboard)}</span>
            <span className="arrow">▼</span>
          </button>
          
          {showDropdown && (
            <div className="dropdown-menu">
              {user.dashboards.map(dashboard => (
                <button
                  key={dashboard}
                  className={`dropdown-item ${dashboard === user.currentDashboard ? 'active' : ''}`}
                  onClick={() => {
                    switchDashboard(dashboard);
                    setShowDropdown(false);
                  }}
                >
                  {getDashboardIcon(dashboard)}
                  <span>{getDashboardName(dashboard)}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      
      <button className="logout-btn" onClick={logout} title="Logout">
        <LogOut size={16} />
        Logout
      </button>
    </div>
  );
};

const AuthenticatedDashboard: React.FC = () => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login onSuccess={() => {}} />;
  }

  // In a real app, you would fetch different data based on user.currentDashboard
  // For demo, we'll show the same data but can add filters/modifications here
  const getDashboardTitle = () => {
    switch (user?.currentDashboard) {
      case 'enterprise':
        return 'Enterprise Application Portfolio';
      case 'department-it':
        return 'IT Department Applications';
      case 'department-hr':
        return 'HR Department Applications';
      default:
        return 'Application Portfolio Management';
    }
  };

  return (
    <div className="authenticated-dashboard">
      <DashboardSelector />
      <div className="dashboard-container">
        {/* Pass dashboard-specific context if needed */}
        <APMDashboard />
      </div>
    </div>
  );
};

const APMDashboardWrapper: React.FC = () => {
  return (
    <AuthProvider>
      <APMDashboardProvider>
        <AuthenticatedDashboard />
      </APMDashboardProvider>
    </AuthProvider>
  );
};

export default APMDashboardWrapper;
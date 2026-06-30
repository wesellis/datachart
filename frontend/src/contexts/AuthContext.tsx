import React, { createContext, useState, useContext, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'CEO' | 'CFO' | 'CISO' | 'COO' | 'CTO' | 'admin' | 'manager' | 'analyst';
  dashboards: string[];
  currentDashboard: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  switchDashboard: (dashboardId: string) => void;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Demo users with different dashboard access
const DEMO_USERS: Record<string, User> = {
  'admin@DataChart.com': {
    id: '1',
    email: 'admin@DataChart.com',
    name: 'John Smith',
    role: 'CEO',
    dashboards: ['overview', 'optimization', 'compliance', 'planning', 'operations'],
    currentDashboard: 'overview'
  },
  'cfo@DataChart.com': {
    id: '2',
    email: 'cfo@DataChart.com',
    name: 'Sarah Johnson',
    role: 'CFO',
    dashboards: ['overview', 'optimization', 'planning'],
    currentDashboard: 'optimization'
  },
  'ciso@DataChart.com': {
    id: '3',
    email: 'ciso@DataChart.com',
    name: 'Michael Chen',
    role: 'CISO',
    dashboards: ['overview', 'compliance', 'operations'],
    currentDashboard: 'compliance'
  }
};

// Demo password for all users
const DEMO_PASSWORD = 'demo123';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for saved session
    const savedUser = localStorage.getItem('apm-user');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      
      // Migrate old dashboard IDs to new ones
      const migrateDashboard = (oldId: string): string => {
        switch (oldId) {
          case 'enterprise': return 'overview';
          case 'department-it': return 'operations';
          case 'department-hr': return 'optimization';
          default: return oldId;
        }
      };
      
      // Update user's dashboards and current dashboard
      if (parsedUser.dashboards) {
        parsedUser.dashboards = parsedUser.dashboards.map(migrateDashboard);
        parsedUser.currentDashboard = migrateDashboard(parsedUser.currentDashboard);
        
        // If user had all old dashboards, give them all new ones
        if (parsedUser.dashboards.includes('overview') && 
            parsedUser.dashboards.includes('operations') && 
            parsedUser.dashboards.includes('optimization')) {
          parsedUser.dashboards = ['overview', 'optimization', 'compliance', 'planning', 'operations'];
        }
        
        // Save the migrated user data
        localStorage.setItem('apm-user', JSON.stringify(parsedUser));
      }
      
      setUser(parsedUser);
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Check demo credentials
    const demoUser = DEMO_USERS[email.toLowerCase()];
    if (demoUser && password === DEMO_PASSWORD) {
      setUser(demoUser);
      localStorage.setItem('apm-user', JSON.stringify(demoUser));
      return true;
    }

    // Quick admin login (for development)
    if (email === 'admin' && password === 'admin') {
      const adminUser = DEMO_USERS['admin@DataChart.com'];
      setUser(adminUser);
      localStorage.setItem('apm-user', JSON.stringify(adminUser));
      return true;
    }

    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('apm-user');
  };

  const switchDashboard = (dashboardId: string) => {
    if (user && user.dashboards.includes(dashboardId)) {
      const updatedUser = { ...user, currentDashboard: dashboardId };
      setUser(updatedUser);
      localStorage.setItem('apm-user', JSON.stringify(updatedUser));
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      switchDashboard,
      isAuthenticated: !!user,
      loading
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
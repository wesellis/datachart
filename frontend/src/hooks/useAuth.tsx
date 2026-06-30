// Authentication Hook
import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, LoginRequest, RegisterRequest, AuthResponse } from '../types/auth';
import { authApi } from '../services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize auth state on app start
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (token) {
        const currentUser = await authApi.getCurrentUser();
        setUser(currentUser);
      }
    } catch (err) {
      // Token might be expired, try to refresh
      const refreshed = await authApi.refreshToken();
      if (refreshed) {
        try {
          const currentUser = await authApi.getCurrentUser();
          setUser(currentUser);
        } catch {
          // If refresh also fails, clear tokens
          await authApi.logout();
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials: LoginRequest) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await authApi.login(credentials);
      setUser(response.user);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: RegisterRequest) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await authApi.register(userData);
      setUser(response.user);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await authApi.logout();
      setUser(null);
      setError(null);
    } finally {
      setLoading(false);
    }
  };

  const refreshToken = async (): Promise<boolean> => {
    try {
      const success = await authApi.refreshToken();
      if (success) {
        const currentUser = await authApi.getCurrentUser();
        setUser(currentUser);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      setError(null);
      await authApi.forgotPassword(email);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Password reset request failed';
      setError(message);
      throw new Error(message);
    }
  };

  const resetPassword = async (token: string, newPassword: string) => {
    try {
      setError(null);
      await authApi.resetPassword(token, newPassword);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Password reset failed';
      setError(message);
      throw new Error(message);
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    refreshToken,
    forgotPassword,
    resetPassword,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Higher-order component for protecting routes
export const withAuth = <P extends object>(Component: React.ComponentType<P>) => {
  return (props: P) => {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
      return <div>Loading...</div>; // You can replace with a proper loading component
    }

    if (!isAuthenticated) {
      // Redirect to login or show login modal
      window.location.href = '/login';
      return null;
    }

    return <Component {...props} />;
  };
};

// Hook for checking specific permissions
export const usePermissions = () => {
  const { user } = useAuth();

  const hasPermission = (permission: string): boolean => {
    if (!user || !user.organizations.length) return false;

    // Check if user's organization has the required permission
    const org = user.organizations[0]; // Assuming single org for now
    
    // Define permission logic based on plan type
    const permissions: Record<string, string[]> = {
      free: ['read_dashboards', 'create_dashboards'],
      pro: ['read_dashboards', 'create_dashboards', 'share_dashboards', 'export_data'],
      enterprise: ['read_dashboards', 'create_dashboards', 'share_dashboards', 'export_data', 'manage_users', 'api_access'],
    };

    return permissions[org.plan_type]?.includes(permission) || false;
  };

  const canCreateDashboards = () => hasPermission('create_dashboards');
  const canShareDashboards = () => hasPermission('share_dashboards');
  const canExportData = () => hasPermission('export_data');
  const canManageUsers = () => hasPermission('manage_users');
  const hasApiAccess = () => hasPermission('api_access');

  return {
    hasPermission,
    canCreateDashboards,
    canShareDashboards,
    canExportData,
    canManageUsers,
    hasApiAccess,
  };
};
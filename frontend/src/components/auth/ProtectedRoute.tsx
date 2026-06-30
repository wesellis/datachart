import React, { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import LoadingScreen from '../ui/LoadingScreen';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAuth?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireAuth = true 
}) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingScreen />;
  }

  if (requireAuth && !isAuthenticated) {
    // Redirect to login page with return url
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  if (!requireAuth && isAuthenticated) {
    // If user is already authenticated and trying to access login/register, redirect to app
    return <Navigate to="/app" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
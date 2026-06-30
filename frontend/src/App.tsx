import React, { Suspense } from 'react';
import './styles/dashboard-grid.css';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { NotificationProvider } from './components/ui/NotificationContainer';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { AuthProvider } from './hooks/useAuth';
import { APMDashboardProvider } from './contexts/APMDashboardContext';
import LoadingScreen from './components/ui/LoadingScreen';

// Main SaaS Dashboard Components
import DashboardBuilder from './components/dashboard/DashboardBuilder';
import DashboardBuilderEnhanced from './components/dashboard/DashboardBuilderEnhanced';
import DashboardBuilderFixed from './components/dashboard/DashboardBuilderFixed';
import DashboardPreview from './components/dashboard/DashboardPreview';
import DashboardPreviewLive from './components/dashboard/DashboardPreviewLive';
import DashboardList from './components/dashboard/DashboardList';
import DataSourceList from './components/data-sources/DataSourceList';
import DataSourceConfiguration from './components/data-sources/DataSourceConfiguration';
import TenantDashboard from './components/dashboard/TenantDashboard';
import HubbellDashboard from './components/dashboard/HubbellDashboard';
import HubbellEnhanced from './components/dashboard/HubbellEnhanced';
import HubbellResponsive from './components/dashboard/HubbellResponsive';
import APMDashboard from './components/APMDashboard/APMDashboard';
import APMDashboardWrapper from './components/APMDashboard/APMDashboardWrapper';

// Authentication & Admin
import LoginPage from './pages/Login';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AdminPanel from './components/admin/AdminPanel';

// User Management
import UserProfile from './components/user/UserProfile';

// Billing
import BillingDashboard from './components/billing/BillingDashboard';

// Landing & Marketing
import LandingPage from './components/marketing/LandingPage';
import ProfessionalLanding from './components/marketing/ProfessionalLanding';

// Layout
import Navigation from './components/layout/Navigation';

import './App.css';
import './styles/globals.css';
import './styles/kpi-font-fix.css';
import "./styles/grid-widget-sizes.css";

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <NotificationProvider>
          <AuthProvider>
            <Router>
              <Suspense fallback={<LoadingScreen />}>
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<APMDashboardWrapper />} />
                  <Route path="/apm" element={<APMDashboardWrapper />} />
                  <Route path="/apm-demo" element={<APMDashboardProvider><APMDashboard /></APMDashboardProvider>} />
                  <Route path="/landing" element={<ProfessionalLanding />} />
                  <Route path="/demo" element={<DashboardPreviewLive />} />
                  <Route path="/login" element={
                    <ProtectedRoute requireAuth={false}>
                      <LoginPage />
                    </ProtectedRoute>
                  } />
                  
                  {/* Protected Application Routes */}
                  <Route path="/app/dashboards" element={
                    <ProtectedRoute>
                      <DashboardList />
                    </ProtectedRoute>
                  } />
                  <Route path="/app/dashboard-builder" element={
                    <ProtectedRoute>
                      <DashboardBuilder />
                    </ProtectedRoute>
                  } />
                  <Route path="/app/builder/legacy" element={
                    <ProtectedRoute>
                      <DashboardBuilderFixed />
                    </ProtectedRoute>
                  } />
                  <Route path="/app/preview/:dashboardId" element={
                    <ProtectedRoute>
                      <DashboardPreview />
                    </ProtectedRoute>
                  } />
                  <Route path="/app/dashboard/preview" element={
                    <ProtectedRoute>
                      <DashboardPreviewLive />
                    </ProtectedRoute>
                  } />
                  <Route path="/app/data-sources" element={
                    <ProtectedRoute>
                      <DataSourceList />
                    </ProtectedRoute>
                  } />
                  <Route path="/app/data-sources/configure" element={
                    <ProtectedRoute>
                      <DataSourceConfiguration />
                    </ProtectedRoute>
                  } />
                  <Route path="/app/dashboard/hubbell-001" element={
                    <ProtectedRoute>
                      <HubbellResponsive />
                    </ProtectedRoute>
                  } />
                  <Route path="/app/dashboard/:tenantId" element={
                    <ProtectedRoute>
                      <TenantDashboard />
                    </ProtectedRoute>
                  } />
                  
                  {/* User Management */}
                  <Route path="/app/profile" element={
                    <ProtectedRoute>
                      <UserProfile />
                    </ProtectedRoute>
                  } />
                  
                  {/* Billing */}
                  <Route path="/app/billing" element={
                    <ProtectedRoute>
                      <BillingDashboard />
                    </ProtectedRoute>
                  } />
                  
                  {/* Admin Panel */}
                  <Route path="/admin" element={
                    <ProtectedRoute>
                      <AdminPanel />
                    </ProtectedRoute>
                  } />
                  
                  {/* Default redirects */}
                  <Route path="/app" element={<Navigate to="/app/dashboards" replace />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Suspense>
            </Router>
          </AuthProvider>
        </NotificationProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

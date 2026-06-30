import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useAuth } from './AuthContext';

// Widget configuration type
export interface DashboardWidget {
  id: string;
  type: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  visible: boolean;
}

// Default layouts for each dashboard view
const DEFAULT_LAYOUTS: Record<string, DashboardWidget[]> = {
  overview: [
    // Executive Bar
    { id: 'insights', type: 'executive-insights', position: { x: 0, y: 0 }, size: { width: 12, height: 1 }, visible: true },
    
    // Control Bar
    { id: 'status', type: 'realtime-status', position: { x: 0, y: 1 }, size: { width: 4, height: 1 }, visible: true },
    { id: 'filters', type: 'quick-filters', position: { x: 4, y: 1 }, size: { width: 4, height: 1 }, visible: true },
    { id: 'export', type: 'export-actions', position: { x: 8, y: 1 }, size: { width: 4, height: 1 }, visible: true },
    
    // Key Metrics Row
    { id: 'total-apps', type: 'total-applications', position: { x: 0, y: 2 }, size: { width: 3, height: 1 }, visible: true },
    { id: 'spend-2024', type: 'spending-2024', position: { x: 3, y: 2 }, size: { width: 3, height: 1 }, visible: true },
    { id: 'spend-2025', type: 'spending-2025', position: { x: 6, y: 2 }, size: { width: 3, height: 1 }, visible: true },
    { id: 'savings', type: 'total-savings', position: { x: 9, y: 2 }, size: { width: 3, height: 1 }, visible: true },
    
    // Executive Tools
    { id: 'briefing', type: 'executive-briefing', position: { x: 0, y: 3 }, size: { width: 6, height: 3 }, visible: true },
    { id: 'notifications', type: 'smart-notifications', position: { x: 6, y: 3 }, size: { width: 3, height: 3 }, visible: true },
    { id: 'roi', type: 'roi-tracker', position: { x: 9, y: 3 }, size: { width: 3, height: 3 }, visible: true },
    
    // Main Charts
    { id: 'spending-chart', type: 'spending-trend', position: { x: 0, y: 6 }, size: { width: 8, height: 4 }, visible: true },
    { id: 'vendor-chart', type: 'vendor-breakdown', position: { x: 8, y: 6 }, size: { width: 4, height: 4 }, visible: true },
    
    // Application Grid
    { id: 'application-grid', type: 'application-grid', position: { x: 0, y: 10 }, size: { width: 12, height: 4 }, visible: true },
  ],
  
  optimization: [
    // Executive Insights
    { id: 'insights', type: 'executive-insights', position: { x: 0, y: 0 }, size: { width: 12, height: 1 }, visible: true },
    
    // Cost Metrics
    { id: 'spend-2025', type: 'spending-2025', position: { x: 0, y: 1 }, size: { width: 3, height: 1 }, visible: true },
    { id: 'savings', type: 'total-savings', position: { x: 3, y: 1 }, size: { width: 3, height: 1 }, visible: true },
    { id: 'cost-employee', type: 'cost-per-employee', position: { x: 6, y: 1 }, size: { width: 3, height: 1 }, visible: true },
    { id: 'utilization', type: 'license-utilization', position: { x: 9, y: 1 }, size: { width: 3, height: 1 }, visible: true },
    
    // Cost Optimization Modules
    { id: 'contract-neg', type: 'contract-negotiation', position: { x: 0, y: 2 }, size: { width: 6, height: 4 }, visible: true },
    { id: 'shadow-it', type: 'shadow-it-detector', position: { x: 6, y: 2 }, size: { width: 6, height: 4 }, visible: true },
    { id: 'license-harvest', type: 'license-harvesting', position: { x: 0, y: 6 }, size: { width: 6, height: 4 }, visible: true },
    
    // Charts
    { id: 'spending-chart', type: 'spending-trend', position: { x: 6, y: 6 }, size: { width: 6, height: 4 }, visible: true },
    
    // ROI and Meeting Tools
    { id: 'roi', type: 'roi-tracker', position: { x: 0, y: 10 }, size: { width: 4, height: 3 }, visible: true },
    { id: 'vendor-chart', type: 'vendor-breakdown', position: { x: 4, y: 10 }, size: { width: 4, height: 3 }, visible: true },
    { id: 'renewal-timeline', type: 'renewal-timeline', position: { x: 8, y: 10 }, size: { width: 4, height: 3 }, visible: true },
  ],
  
  compliance: [
    // Executive Insights
    { id: 'insights', type: 'executive-insights', position: { x: 0, y: 0 }, size: { width: 12, height: 1 }, visible: true },
    
    // Compliance Metrics
    { id: 'compliance', type: 'patch-compliance', position: { x: 0, y: 1 }, size: { width: 3, height: 1 }, visible: true },
    { id: 'total-apps', type: 'total-applications', position: { x: 3, y: 1 }, size: { width: 3, height: 1 }, visible: true },
    { id: 'renewals', type: 'renewal-30', position: { x: 6, y: 1 }, size: { width: 3, height: 1 }, visible: true },
    { id: 'spend-2025', type: 'spending-2025', position: { x: 9, y: 1 }, size: { width: 3, height: 1 }, visible: true },
    
    // Compliance Tools
    { id: 'compliance-gauge', type: 'compliance-gauge', position: { x: 0, y: 2 }, size: { width: 6, height: 4 }, visible: true },
    { id: 'shadow-it', type: 'shadow-it-detector', position: { x: 6, y: 2 }, size: { width: 6, height: 4 }, visible: true },
    
    // Notifications and Briefing
    { id: 'notifications', type: 'smart-notifications', position: { x: 0, y: 6 }, size: { width: 4, height: 3 }, visible: true },
    { id: 'briefing', type: 'executive-briefing', position: { x: 4, y: 6 }, size: { width: 8, height: 3 }, visible: true },
    
    // Application Grid
    { id: 'application-grid', type: 'application-grid', position: { x: 0, y: 9 }, size: { width: 12, height: 5 }, visible: true },
  ],
  
  planning: [
    // Executive Insights
    { id: 'insights', type: 'executive-insights', position: { x: 0, y: 0 }, size: { width: 12, height: 1 }, visible: true },
    
    // Planning Metrics
    { id: 'total-apps', type: 'total-applications', position: { x: 0, y: 1 }, size: { width: 3, height: 1 }, visible: true },
    { id: 'spend-2024', type: 'spending-2024', position: { x: 3, y: 1 }, size: { width: 3, height: 1 }, visible: true },
    { id: 'spend-2025', type: 'spending-2025', position: { x: 6, y: 1 }, size: { width: 3, height: 1 }, visible: true },
    { id: 'savings', type: 'total-savings', position: { x: 9, y: 1 }, size: { width: 3, height: 1 }, visible: true },
    
    // Strategic Tools
    { id: 'meeting', type: 'meeting-presentation', position: { x: 0, y: 2 }, size: { width: 8, height: 4 }, visible: true },
    { id: 'roi', type: 'roi-tracker', position: { x: 8, y: 2 }, size: { width: 4, height: 4 }, visible: true },
    
    // Charts and Timeline
    { id: 'spending-chart', type: 'spending-trend', position: { x: 0, y: 6 }, size: { width: 8, height: 4 }, visible: true },
    { id: 'renewal-timeline', type: 'renewal-timeline', position: { x: 8, y: 6 }, size: { width: 4, height: 4 }, visible: true },
    
    // Vendor Analysis
    { id: 'vendor-chart', type: 'vendor-breakdown', position: { x: 0, y: 10 }, size: { width: 4, height: 4 }, visible: true },
    { id: 'contract-neg', type: 'contract-negotiation', position: { x: 4, y: 10 }, size: { width: 8, height: 4 }, visible: true },
  ],
  
  operations: [
    // Executive Insights
    { id: 'insights', type: 'executive-insights', position: { x: 0, y: 0 }, size: { width: 12, height: 1 }, visible: true },
    
    // Control Bar
    { id: 'status', type: 'realtime-status', position: { x: 0, y: 1 }, size: { width: 4, height: 1 }, visible: true },
    { id: 'filters', type: 'quick-filters', position: { x: 4, y: 1 }, size: { width: 4, height: 1 }, visible: true },
    { id: 'export', type: 'export-actions', position: { x: 8, y: 1 }, size: { width: 4, height: 1 }, visible: true },
    
    // Operational Metrics
    { id: 'total-apps', type: 'total-applications', position: { x: 0, y: 2 }, size: { width: 3, height: 1 }, visible: true },
    { id: 'compliance', type: 'patch-compliance', position: { x: 3, y: 2 }, size: { width: 3, height: 1 }, visible: true },
    { id: 'utilization', type: 'license-utilization', position: { x: 6, y: 2 }, size: { width: 3, height: 1 }, visible: true },
    { id: 'renewals', type: 'renewal-30', position: { x: 9, y: 2 }, size: { width: 3, height: 1 }, visible: true },
    
    // License Management
    { id: 'license-harvest', type: 'license-harvesting', position: { x: 0, y: 3 }, size: { width: 6, height: 4 }, visible: true },
    { id: 'renewal-timeline', type: 'renewal-timeline', position: { x: 6, y: 3 }, size: { width: 6, height: 4 }, visible: true },
    
    // Monitoring
    { id: 'notifications', type: 'smart-notifications', position: { x: 0, y: 7 }, size: { width: 4, height: 3 }, visible: true },
    { id: 'compliance-gauge', type: 'compliance-gauge', position: { x: 4, y: 7 }, size: { width: 4, height: 3 }, visible: true },
    { id: 'integration', type: 'integration-hub', position: { x: 8, y: 7 }, size: { width: 4, height: 3 }, visible: true },
    
    // Application Grid
    { id: 'application-grid', type: 'application-grid', position: { x: 0, y: 10 }, size: { width: 12, height: 4 }, visible: true },
  ]
};

interface APMDashboardContextType {
  layout: DashboardWidget[];
  updateLayout: (newLayout: DashboardWidget[]) => void;
  toggleWidget: (widgetId: string) => void;
  resetLayout: () => void;
  addWidget: (widget: DashboardWidget) => void;
  removeWidget: (widgetId: string) => void;
  moveWidget: (widgetId: string, newPosition: { x: number; y: number }) => void;
  resizeWidget: (widgetId: string, newSize: { width: number; height: number }) => void;
}

const APMDashboardContext = createContext<APMDashboardContextType | undefined>(undefined);

export const APMDashboardProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const currentDashboard = user?.currentDashboard || 'overview';
  
  const [layouts, setLayouts] = useState<Record<string, DashboardWidget[]>>(() => {
    // Try to load all layouts from localStorage
    const saved = localStorage.getItem('apm-dashboard-layouts');
    if (saved) {
      const parsedLayouts = JSON.parse(saved);
      // Merge with defaults to ensure all dashboards have layouts
      return {
        ...DEFAULT_LAYOUTS,
        ...parsedLayouts
      };
    }
    return DEFAULT_LAYOUTS;
  });

  // Get current layout based on active dashboard
  const layout = layouts[currentDashboard] || DEFAULT_LAYOUTS[currentDashboard] || DEFAULT_LAYOUTS.overview;

  const updateLayout = (newLayout: DashboardWidget[]) => {
    const newLayouts = {
      ...layouts,
      [currentDashboard]: newLayout
    };
    setLayouts(newLayouts);
    localStorage.setItem('apm-dashboard-layouts', JSON.stringify(newLayouts));
  };

  const toggleWidget = (widgetId: string) => {
    const newLayout = layout.map(widget =>
      widget.id === widgetId ? { ...widget, visible: !widget.visible } : widget
    );
    updateLayout(newLayout);
  };

  const resetLayout = () => {
    const defaultLayout = DEFAULT_LAYOUTS[currentDashboard] || DEFAULT_LAYOUTS.overview;
    updateLayout(defaultLayout);
  };

  const addWidget = (widget: DashboardWidget) => {
    updateLayout([...layout, widget]);
  };

  const removeWidget = (widgetId: string) => {
    updateLayout(layout.filter(w => w.id !== widgetId));
  };

  const moveWidget = (widgetId: string, newPosition: { x: number; y: number }) => {
    const newLayout = layout.map(widget =>
      widget.id === widgetId ? { ...widget, position: newPosition } : widget
    );
    updateLayout(newLayout);
  };

  const resizeWidget = (widgetId: string, newSize: { width: number; height: number }) => {
    const newLayout = layout.map(widget =>
      widget.id === widgetId ? { ...widget, size: newSize } : widget
    );
    updateLayout(newLayout);
  };

  return (
    <APMDashboardContext.Provider value={{
      layout,
      updateLayout,
      toggleWidget,
      resetLayout,
      addWidget,
      removeWidget,
      moveWidget,
      resizeWidget
    }}>
      {children}
    </APMDashboardContext.Provider>
  );
};

export const useAPMDashboard = () => {
  const context = useContext(APMDashboardContext);
  if (context === undefined) {
    throw new Error('useAPMDashboard must be used within an APMDashboardProvider');
  }
  return context;
};
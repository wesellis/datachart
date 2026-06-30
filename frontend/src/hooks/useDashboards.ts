// Dashboard Management Hook
import { useState, useEffect, useCallback } from 'react';
import { Dashboard, DashboardSummary, DashboardCreate, DashboardUpdate, Widget } from '../types/dashboard';
import { dashboardApi } from '../services/api';

export const useDashboards = () => {
  const [dashboards, setDashboards] = useState<DashboardSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboards = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await dashboardApi.getAll();
      setDashboards(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch dashboards';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboards();
  }, [fetchDashboards]);

  const createDashboard = async (dashboardData: DashboardCreate): Promise<Dashboard> => {
    try {
      setError(null);
      const newDashboard = await dashboardApi.create(dashboardData);
      await fetchDashboards(); // Refresh the list
      return newDashboard;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create dashboard';
      setError(message);
      throw new Error(message);
    }
  };

  const duplicateDashboard = async (id: string, name?: string): Promise<Dashboard> => {
    try {
      setError(null);
      const duplicated = await dashboardApi.duplicate(id, name);
      await fetchDashboards(); // Refresh the list
      return duplicated;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to duplicate dashboard';
      setError(message);
      throw new Error(message);
    }
  };

  const deleteDashboard = async (id: string): Promise<void> => {
    try {
      setError(null);
      await dashboardApi.delete(id);
      setDashboards(prev => prev.filter(d => d.id !== id));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete dashboard';
      setError(message);
      throw new Error(message);
    }
  };

  return {
    dashboards,
    loading,
    error,
    fetchDashboards,
    createDashboard,
    duplicateDashboard,
    deleteDashboard,
  };
};

export const useDashboard = (dashboardId?: string) => {
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchDashboard = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await dashboardApi.getById(id);
      setDashboard(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch dashboard';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (dashboardId) {
      fetchDashboard(dashboardId);
    }
  }, [dashboardId, fetchDashboard]);

  const updateDashboard = async (updates: DashboardUpdate): Promise<void> => {
    if (!dashboard) return;

    try {
      setSaving(true);
      setError(null);
      const updated = await dashboardApi.update(dashboard.id, updates);
      setDashboard(updated);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update dashboard';
      setError(message);
      throw new Error(message);
    } finally {
      setSaving(false);
    }
  };

  const addWidget = async (widget: Omit<Widget, 'id' | 'created_at' | 'updated_at'>): Promise<void> => {
    if (!dashboard) return;

    const newWidget: Widget = {
      ...widget,
      id: `widget_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const updatedWidgets = [...dashboard.widgets, newWidget];
    await updateDashboard({ widgets: updatedWidgets });
  };

  const updateWidget = async (widgetId: string, updates: Partial<Widget>): Promise<void> => {
    if (!dashboard) return;

    const updatedWidgets = dashboard.widgets.map(widget => 
      widget.id === widgetId 
        ? { ...widget, ...updates, updated_at: new Date().toISOString() }
        : widget
    );

    await updateDashboard({ widgets: updatedWidgets });
  };

  const removeWidget = async (widgetId: string): Promise<void> => {
    if (!dashboard) return;

    const updatedWidgets = dashboard.widgets.filter(widget => widget.id !== widgetId);
    await updateDashboard({ widgets: updatedWidgets });
  };

  const shareDashboard = async (permissions: any): Promise<{ share_token: string; share_url: string }> => {
    if (!dashboard) throw new Error('No dashboard to share');

    try {
      setError(null);
      const shareInfo = await dashboardApi.share(dashboard.id, permissions);
      return shareInfo;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to share dashboard';
      setError(message);
      throw new Error(message);
    }
  };

  const getVersions = async () => {
    if (!dashboard) return [];

    try {
      setError(null);
      return await dashboardApi.getVersions(dashboard.id);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch versions';
      setError(message);
      throw new Error(message);
    }
  };

  const restoreVersion = async (versionId: string): Promise<void> => {
    if (!dashboard) return;

    try {
      setError(null);
      const restored = await dashboardApi.restoreVersion(dashboard.id, versionId);
      setDashboard(restored);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to restore version';
      setError(message);
      throw new Error(message);
    }
  };

  // Auto-save functionality
  const enableAutoSave = (intervalMs: number = 30000) => {
    if (!dashboard) return;

    const autoSaveInterval = setInterval(async () => {
      if (dashboard && !saving) {
        try {
          await updateDashboard({});
        } catch {
          // Silently handle auto-save errors
        }
      }
    }, intervalMs);

    return () => clearInterval(autoSaveInterval);
  };

  return {
    dashboard,
    loading,
    error,
    saving,
    fetchDashboard,
    updateDashboard,
    addWidget,
    updateWidget,
    removeWidget,
    shareDashboard,
    getVersions,
    restoreVersion,
    enableAutoSave,
  };
};

// Hook for managing dashboard templates
export const useDashboardTemplates = () => {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // This would typically fetch from an API endpoint
      // For now, we'll use the local dashboard templates
      const { dashboardTemplates } = await import('../data/dashboardTemplates');
      setTemplates(dashboardTemplates);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch templates';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const createFromTemplate = async (templateId: string, name: string): Promise<Dashboard> => {
    try {
      setError(null);
      const template = templates.find((t: any) => t.id === templateId);
      if (!template) {
        throw new Error('Template not found');
      }

      // Create dashboard from template
      const dashboardData: DashboardCreate = {
        name,
        description: `Created from ${(template as any).name} template`,
        // Add template-specific configuration
      };

      return await dashboardApi.create(dashboardData);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create dashboard from template';
      setError(message);
      throw new Error(message);
    }
  };

  return {
    templates,
    loading,
    error,
    fetchTemplates,
    createFromTemplate,
  };
};
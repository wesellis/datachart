import React, { useState, useCallback, useRef, useEffect } from 'react';
import { 
  Plus, Save, Eye, Settings, Database, Layout, Palette, 
  BarChart3, PieChart, TrendingUp, Table, Type, Activity,
  DollarSign, Shield, Target, Brain, AlertCircle, Grid3x3,
  Layers, Copy, Trash2, ChevronDown, ChevronRight, Lock,
  Unlock, Zap, RefreshCw, Download, Upload, Share2, Move,
  Maximize2, Minimize2, Undo, Redo, Layers2, X
} from 'lucide-react';
import axios from 'axios';
import WidgetConfigPanel from './WidgetConfigPanel';
import ExportPanel from './ExportPanel';
import SharePanel from './SharePanel';

interface Widget {
  id: string;
  type: string;
  title: string;
  icon: React.ReactNode;
  category: string;
  dataSource?: string;
  config: any;
  position: { x: number; y: number; w: number; h: number };
  color?: string;
  locked?: boolean;
}

const widgetLibrary = [
  {
    category: 'Key Metrics',
    widgets: [
      { type: 'metric', title: 'Total Spend', icon: <DollarSign className="w-4 h-4" />, defaultSize: { w: 3, h: 2 } },
      { type: 'metric', title: 'Risk Score', icon: <Activity className="w-4 h-4" />, defaultSize: { w: 3, h: 2 } },
      { type: 'metric', title: 'Compliance Score', icon: <Shield className="w-4 h-4" />, defaultSize: { w: 3, h: 2 } },
      { type: 'metric', title: 'Vendor Count', icon: <Target className="w-4 h-4" />, defaultSize: { w: 3, h: 2 } },
      { type: 'kpi', title: 'KPI Gauge', icon: <Activity className="w-4 h-4" />, defaultSize: { w: 3, h: 3 } },
      { type: 'progress', title: 'Progress Bar', icon: <Activity className="w-4 h-4" />, defaultSize: { w: 4, h: 2 } }
    ]
  },
  {
    category: 'Charts & Analytics',
    widgets: [
      { type: 'bar-chart', title: 'Bar Chart', icon: <BarChart3 className="w-4 h-4" />, defaultSize: { w: 6, h: 4 } },
      { type: 'pie-chart', title: 'Pie Chart', icon: <PieChart className="w-4 h-4" />, defaultSize: { w: 4, h: 4 } },
      { type: 'line-chart', title: 'Line Chart', icon: <TrendingUp className="w-4 h-4" />, defaultSize: { w: 6, h: 4 } },
      { type: 'radar-chart', title: 'Radar Chart', icon: <Activity className="w-4 h-4" />, defaultSize: { w: 4, h: 4 } },
      { type: 'heatmap', title: 'Heat Map', icon: <Grid3x3 className="w-4 h-4" />, defaultSize: { w: 6, h: 4 } },
      { type: 'scatter', title: 'Scatter Plot', icon: <Activity className="w-4 h-4" />, defaultSize: { w: 6, h: 4 } },
      { type: 'funnel', title: 'Funnel Chart', icon: <TrendingUp className="w-4 h-4" />, defaultSize: { w: 4, h: 5 } },
      { type: 'treemap', title: 'Tree Map', icon: <Grid3x3 className="w-4 h-4" />, defaultSize: { w: 6, h: 4 } }
    ]
  },
  {
    category: 'AI & Insights',
    widgets: [
      { type: 'ai-insights', title: 'AI Insights Panel', icon: <Brain className="w-4 h-4" />, defaultSize: { w: 4, h: 6 } },
      { type: 'alerts', title: 'Alert Banner', icon: <AlertCircle className="w-4 h-4" />, defaultSize: { w: 12, h: 1 } },
      { type: 'anomaly', title: 'Anomaly Detection', icon: <Zap className="w-4 h-4" />, defaultSize: { w: 4, h: 3 } },
      { type: 'predictions', title: 'ML Predictions', icon: <Brain className="w-4 h-4" />, defaultSize: { w: 6, h: 4 } },
      { type: 'sentiment', title: 'Sentiment Analysis', icon: <Activity className="w-4 h-4" />, defaultSize: { w: 4, h: 3 } },
      { type: 'recommendations', title: 'Smart Recommendations', icon: <Target className="w-4 h-4" />, defaultSize: { w: 4, h: 5 } }
    ]
  },
  {
    category: 'Data Tables',
    widgets: [
      { type: 'app-table', title: 'Applications Table', icon: <Table className="w-4 h-4" />, defaultSize: { w: 12, h: 4 } },
      { type: 'vendor-table', title: 'Vendor Table', icon: <Table className="w-4 h-4" />, defaultSize: { w: 6, h: 4 } },
      { type: 'pivot-table', title: 'Pivot Table', icon: <Table className="w-4 h-4" />, defaultSize: { w: 8, h: 5 } },
      { type: 'audit-log', title: 'Audit Log', icon: <Table className="w-4 h-4" />, defaultSize: { w: 12, h: 3 } }
    ]
  },
  {
    category: 'Interactive Controls',
    widgets: [
      { type: 'filter', title: 'Filter Panel', icon: <Settings className="w-4 h-4" />, defaultSize: { w: 3, h: 4 } },
      { type: 'date-picker', title: 'Date Range Picker', icon: <Settings className="w-4 h-4" />, defaultSize: { w: 4, h: 2 } },
      { type: 'search', title: 'Search Box', icon: <Settings className="w-4 h-4" />, defaultSize: { w: 4, h: 1 } },
      { type: 'dropdown', title: 'Dropdown Filter', icon: <Settings className="w-4 h-4" />, defaultSize: { w: 3, h: 2 } }
    ]
  },
  {
    category: 'Business Intelligence',
    widgets: [
      { type: 'scorecard', title: 'Business Scorecard', icon: <Target className="w-4 h-4" />, defaultSize: { w: 6, h: 4 } },
      { type: 'dashboard-tiles', title: 'Executive Tiles', icon: <Grid3x3 className="w-4 h-4" />, defaultSize: { w: 8, h: 3 } },
      { type: 'trend-indicator', title: 'Trend Indicators', icon: <TrendingUp className="w-4 h-4" />, defaultSize: { w: 6, h: 2 } },
      { type: 'comparison', title: 'Side-by-Side Compare', icon: <BarChart3 className="w-4 h-4" />, defaultSize: { w: 8, h: 4 } }
    ]
  }
];

const GRID_SIZE = 60;
const GRID_COLS = 12;

const DashboardBuilderFixed: React.FC = () => {
  const [activePanel, setActivePanel] = useState<'widgets' | 'templates' | 'data' | 'settings'>('widgets');
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [dashboardName, setDashboardName] = useState('Untitled Dashboard');
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['Key Metrics', 'Charts']);
  const [selectedWidget, setSelectedWidget] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedWidget, setDraggedWidget] = useState<any>(null);
  const [resizing, setResizing] = useState<{ id: string; handle: string } | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [history, setHistory] = useState<Widget[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [configPanelWidget, setConfigPanelWidget] = useState<Widget | null>(null);
  const [showExportPanel, setShowExportPanel] = useState(false);
  const [showSharePanel, setShowSharePanel] = useState(false);
  const [showHelpPanel, setShowHelpPanel] = useState(false);
  const [dashboardId] = useState(`dashboard-${Date.now()}`);
  const [dataSources] = useState([
    { id: 'snowflake-1', name: 'Snowflake Production', type: 'snowflake', status: 'connected' },
    { id: 'salesforce-1', name: 'Salesforce CRM', type: 'salesforce', status: 'connected' },
    { id: 'oracle-1', name: 'Oracle ERP', type: 'oracle', status: 'connected' },
    { id: 'api-1', name: 'Custom API', type: 'api', status: 'connected' }
  ]);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent default browser shortcuts when focused on canvas
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'z':
            e.preventDefault();
            if (e.shiftKey) {
              handleRedo();
            } else {
              handleUndo();
            }
            break;
          case 'y':
            e.preventDefault();
            handleRedo();
            break;
          case 's':
            e.preventDefault();
            handleSaveDashboard();
            break;
          case 'd':
            e.preventDefault();
            if (selectedWidget) {
              handleDuplicateWidget(selectedWidget);
            }
            break;
        }
      }
      
      // Help panel
      if (e.key === 'F1' || (e.ctrlKey && e.key === '/')) {
        e.preventDefault();
        setShowHelpPanel(!showHelpPanel);
      }
      
      // Delete key
      if (e.key === 'Delete' && selectedWidget) {
        const widget = widgets.find(w => w.id === selectedWidget);
        if (widget && !widget.locked) {
          handleDeleteWidget(selectedWidget);
        }
      }
      
      // Arrow keys for fine movement
      if (selectedWidget && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        const widget = widgets.find(w => w.id === selectedWidget);
        if (!widget || widget.locked) return;
        
        let newX = widget.position.x;
        let newY = widget.position.y;
        
        const step = e.shiftKey ? 1 : 1; // Fine movement
        
        switch (e.key) {
          case 'ArrowLeft':
            newX = Math.max(0, newX - step);
            break;
          case 'ArrowRight':
            newX = Math.min(GRID_COLS - widget.position.w, newX + step);
            break;
          case 'ArrowUp':
            newY = Math.max(0, newY - step);
            break;
          case 'ArrowDown':
            newY = newY + step;
            break;
        }
        
        setWidgets(prev => prev.map(w => 
          w.id === selectedWidget 
            ? { ...w, position: { ...w.position, x: newX, y: newY } }
            : w
        ));
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedWidget, widgets, historyIndex, history]);

  // Add to history for undo/redo
  const addToHistory = (newWidgets: Widget[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newWidgets);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setWidgets(newWidgets);
  };

  // Undo
  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setWidgets(history[historyIndex - 1]);
    }
  };

  // Redo  
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setWidgets(history[historyIndex + 1]);
    }
  };

  // Duplicate widget
  const handleDuplicateWidget = (widgetId: string) => {
    const widget = widgets.find(w => w.id === widgetId);
    if (!widget) return;
    
    const newWidget: Widget = {
      ...widget,
      id: `widget-${Date.now()}`,
      position: {
        ...widget.position,
        x: Math.min(widget.position.x + 1, 12 - widget.position.w),
        y: widget.position.y + 1
      }
    };
    
    addToHistory([...widgets, newWidget]);
  };

  // Toggle lock on widget
  const handleToggleLock = (widgetId: string) => {
    const updatedWidgets = widgets.map(w =>
      w.id === widgetId ? { ...w, locked: !w.locked } : w
    );
    addToHistory(updatedWidgets);
  };

  // Add widget to canvas
  const handleAddWidget = (widgetTemplate: any) => {
    const newWidget: Widget = {
      id: `widget-${Date.now()}`,
      type: widgetTemplate.type,
      title: widgetTemplate.title,
      icon: widgetTemplate.icon,
      category: widgetTemplate.category,
      position: {
        x: 0,
        y: 0,
        w: widgetTemplate.defaultSize?.w || 3,
        h: widgetTemplate.defaultSize?.h || 2
      },
      config: {},
      color: '#3b82f6'
    };
    setWidgets([...widgets, newWidget]);
  };

  // Handle drag start from widget library
  const handleDragStart = (e: React.DragEvent, widgetTemplate: any) => {
    setIsDragging(true);
    setDraggedWidget(widgetTemplate);
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('widget', JSON.stringify(widgetTemplate));
  };

  // Handle drop on canvas
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (!canvasRef.current || !draggedWidget) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / GRID_SIZE);
    const y = Math.floor((e.clientY - rect.top) / GRID_SIZE);
    
    const newWidget: Widget = {
      id: `widget-${Date.now()}`,
      type: draggedWidget.type,
      title: draggedWidget.title,
      icon: draggedWidget.icon,
      category: draggedWidget.category || '',
      position: {
        x: Math.max(0, Math.min(x, GRID_COLS - (draggedWidget.defaultSize?.w || 3))),
        y: Math.max(0, y),
        w: draggedWidget.defaultSize?.w || 3,
        h: draggedWidget.defaultSize?.h || 2
      },
      config: {},
      color: '#3b82f6'
    };
    
    setWidgets([...widgets, newWidget]);
    setDraggedWidget(null);
  };

  // Handle drag over canvas
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  // Handle widget move
  const handleWidgetMouseDown = (e: React.MouseEvent, widgetId: string) => {
    e.preventDefault();
    const widget = widgets.find(w => w.id === widgetId);
    if (!widget || !canvasRef.current || widget.locked) return;

    const startX = e.clientX;
    const startY = e.clientY;
    const startPosX = widget.position.x;
    const startPosY = widget.position.y;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = Math.round((e.clientX - startX) / GRID_SIZE);
      const deltaY = Math.round((e.clientY - startY) / GRID_SIZE);
      
      const newX = Math.max(0, Math.min(startPosX + deltaX, GRID_COLS - widget.position.w));
      const newY = Math.max(0, startPosY + deltaY);
      
      setWidgets(prev => prev.map(w => 
        w.id === widgetId 
          ? { ...w, position: { ...w.position, x: newX, y: newY } }
          : w
      ));
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Handle widget resize
  const handleResizeStart = (e: React.MouseEvent, widgetId: string, handle: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    const widget = widgets.find(w => w.id === widgetId);
    if (!widget) return;

    const startX = e.clientX;
    const startY = e.clientY;
    const startW = widget.position.w;
    const startH = widget.position.h;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = Math.round((e.clientX - startX) / GRID_SIZE);
      const deltaY = Math.round((e.clientY - startY) / GRID_SIZE);
      
      let newW = startW;
      let newH = startH;
      
      if (handle.includes('right')) {
        newW = Math.max(1, Math.min(startW + deltaX, GRID_COLS - widget.position.x));
      }
      if (handle.includes('bottom')) {
        newH = Math.max(1, startH + deltaY);
      }
      
      setWidgets(prev => prev.map(w => 
        w.id === widgetId 
          ? { ...w, position: { ...w.position, w: newW, h: newH } }
          : w
      ));
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      setResizing(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    setResizing({ id: widgetId, handle });
  };

  // Delete widget
  const handleDeleteWidget = (widgetId: string) => {
    setWidgets(widgets.filter(w => w.id !== widgetId));
    setSelectedWidget(null);
  };

  // Configure widget
  const handleConfigureWidget = (widgetId: string) => {
    const widget = widgets.find(w => w.id === widgetId);
    if (widget) {
      setConfigPanelWidget(widget);
    }
  };

  // Save widget configuration
  const handleSaveWidgetConfig = (updatedWidget: Widget) => {
    setWidgets(prev => prev.map(w => 
      w.id === updatedWidget.id ? updatedWidget : w
    ));
    addToHistory(widgets);
  };

  // Toggle category
  const toggleCategory = (category: string) => {
    setExpandedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  // Save dashboard
  const handleSaveDashboard = async () => {
    setSaveStatus('saving');
    try {
      const dashboardConfig = {
        name: dashboardName,
        description: `Dashboard created on ${new Date().toLocaleDateString()}`,
        widgets: widgets.map(w => ({
          id: w.id,
          type: w.type,
          title: w.title,
          config: w.config,
          position: w.position
        })),
        is_public: true,
        theme: "dark",
        tags: ["demo", "hubbell"],
        category: "operations"
      };
      
      // Use demo endpoint that doesn't require authentication
      const response = await axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/v1/dashboards/demo`, dashboardConfig);
      
      setSaveStatus('saved');
      
      // Store in localStorage as backup
      localStorage.setItem('savedDashboard', JSON.stringify({
        ...dashboardConfig,
        id: response.data.id,
        created_at: response.data.created_at
      }));
      
      setTimeout(() => setSaveStatus('idle'), 3000);
      
      // Show success message
      alert(`Dashboard "${dashboardName}" saved successfully! ID: ${response.data.id}`);
      
    } catch (error) {
      console.error('Save failed:', error);
      setSaveStatus('error');
      
      // Save to localStorage as fallback
      const dashboardConfig = {
        id: `dashboard-${Date.now()}`,
        name: dashboardName,
        widgets: widgets,
        created_at: new Date().toISOString()
      };
      localStorage.setItem('savedDashboard', JSON.stringify(dashboardConfig));
      
      alert('Saved to local storage. Backend save will be retried.');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  // Preview dashboard
  const handlePreview = () => {
    if (widgets.length === 0) {
      alert('Add some widgets to preview the dashboard');
      return;
    }
    
    // Store current configuration
    const previewConfig = {
      name: dashboardName,
      widgets: widgets
    };
    sessionStorage.setItem('previewDashboard', JSON.stringify(previewConfig));
    
    // Open preview in new tab
    window.open('/app/dashboard/preview', '_blank');
  };

  // Load template
  const loadTemplate = (templateName: string) => {
    const templates: { [key: string]: Widget[] } = {
      executive: [
        {
          id: 'w1',
          type: 'metric',
          title: 'Total Spend',
          icon: <DollarSign className="w-4 h-4" />,
          category: 'Key Metrics',
          position: { x: 0, y: 0, w: 3, h: 2 },
          config: {},
          color: '#3b82f6'
        },
        {
          id: 'w2',
          type: 'metric',
          title: 'Risk Score',
          icon: <Activity className="w-4 h-4" />,
          category: 'Key Metrics',
          position: { x: 3, y: 0, w: 3, h: 2 },
          config: {},
          color: '#10b981'
        },
        {
          id: 'w3',
          type: 'metric',
          title: 'Compliance',
          icon: <Shield className="w-4 h-4" />,
          category: 'Key Metrics',
          position: { x: 6, y: 0, w: 3, h: 2 },
          config: {},
          color: '#f59e0b'
        },
        {
          id: 'w4',
          type: 'metric',
          title: 'Applications',
          icon: <Target className="w-4 h-4" />,
          category: 'Key Metrics',
          position: { x: 9, y: 0, w: 3, h: 2 },
          config: {},
          color: '#8b5cf6'
        },
        {
          id: 'w5',
          type: 'bar-chart',
          title: 'Vendor Spend Analysis',
          icon: <BarChart3 className="w-4 h-4" />,
          category: 'Charts',
          position: { x: 0, y: 2, w: 8, h: 4 },
          config: {},
          color: '#3b82f6'
        },
        {
          id: 'w6',
          type: 'ai-insights',
          title: 'AI Insights',
          icon: <Brain className="w-4 h-4" />,
          category: 'AI & Insights',
          position: { x: 8, y: 2, w: 4, h: 6 },
          config: {},
          color: '#a855f7'
        }
      ]
    };
    
    setWidgets(templates[templateName] || []);
    setDashboardName(`${templateName.charAt(0).toUpperCase() + templateName.slice(1)} Dashboard`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900/95 to-slate-900 backdrop-blur-xl border-b border-white/10 px-6 py-4 shadow-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            {/* Logo with Animation */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl blur-lg opacity-50 animate-pulse"></div>
              <div className="relative w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Layout className="w-6 h-6 text-white" />
              </div>
            </div>
            <div>
              <input
                type="text"
                value={dashboardName}
                onChange={(e) => setDashboardName(e.target.value)}
                className="text-2xl font-bold bg-transparent border-b-2 border-transparent hover:border-white/20 focus:border-blue-500 outline-none text-white placeholder-slate-400 transition-all px-1"
                placeholder="Dashboard Name"
              />
              <p className="text-xs text-slate-500 mt-1 font-medium">ID: {dashboardId.slice(-8)} • {widgets.length} widgets • Auto-save enabled</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Enhanced Action Bar */}
            <div className="flex items-center bg-slate-800/40 backdrop-blur-sm rounded-xl p-1.5 border border-white/5 shadow-inner">
              <button
                onClick={handleUndo}
                disabled={historyIndex === 0}
                className={`p-2.5 rounded-lg transition-all ${
                  historyIndex === 0 
                    ? 'text-slate-600 cursor-not-allowed opacity-40' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/70'
                }`}
                title="Undo (Ctrl+Z)"
              >
                <Undo className="w-4 h-4" />
              </button>
              <button
                onClick={handleRedo}
                disabled={historyIndex === history.length - 1}
                className={`p-2.5 rounded-lg transition-all ${
                  historyIndex === history.length - 1
                    ? 'text-slate-600 cursor-not-allowed opacity-40'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/70'
                }`}
                title="Redo (Ctrl+Y)"
              >
                <Redo className="w-4 h-4" />
              </button>
              <div className="w-px h-5 bg-white/10 mx-1"></div>
              <button
                onClick={() => setShowExportPanel(true)}
                className="p-2.5 rounded-lg transition-all text-slate-400 hover:text-white hover:bg-slate-700/70"
                title="Export Dashboard"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowSharePanel(true)}
                className="p-2.5 rounded-lg transition-all text-slate-400 hover:text-white hover:bg-slate-700/70"
                title="Share Dashboard"
              >
                <Share2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowHelpPanel(true)}
                className="p-2.5 rounded-lg transition-all text-slate-400 hover:text-white hover:bg-slate-700/70"
                title="Help & Shortcuts (F1)"
              >
                <AlertCircle className="w-4 h-4" />
              </button>
            </div>
            
            <button 
              onClick={handlePreview}
              className="px-5 py-2.5 bg-gradient-to-r from-slate-800 to-slate-700 border border-white/10 rounded-xl hover:from-slate-700 hover:to-slate-600 transition-all flex items-center gap-2 font-medium shadow-lg shadow-black/30"
            >
              <Eye className="w-4 h-4" />
              <span>Preview</span>
            </button>
            <button 
              onClick={handleSaveDashboard}
              disabled={saveStatus === 'saving'}
              className={`px-5 py-2.5 rounded-xl transition-all flex items-center gap-2 font-medium shadow-lg ${
                saveStatus === 'saving' 
                  ? 'bg-gradient-to-r from-blue-400 to-blue-500 cursor-wait animate-pulse shadow-blue-500/30' 
                  : saveStatus === 'saved' 
                  ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-green-500/30' 
                  : saveStatus === 'error'
                  ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-red-500/30'
                  : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-blue-500/30'
              } text-white`}
            >
              {saveStatus === 'saving' ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : saveStatus === 'saved' ? (
                <>
                  <Save className="w-4 h-4" />
                  Saved!
                </>
              ) : saveStatus === 'error' ? (
                <>
                  <AlertCircle className="w-4 h-4" />
                  Retry Save
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Dashboard
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Enhanced Left Sidebar */}
        <div className="w-80 bg-gradient-to-b from-slate-900/60 to-slate-900/40 backdrop-blur-xl border-r border-white/10 overflow-hidden flex flex-col shadow-2xl">
          {/* Enhanced Panel Tabs */}
          <div className="flex bg-slate-900/70 border-b border-white/10">
            {[
              { id: 'widgets', label: 'Widgets', icon: <Grid3x3 className="w-4 h-4" />, gradient: 'from-blue-500 to-blue-400' },
              { id: 'templates', label: 'Templates', icon: <Layout className="w-4 h-4" />, gradient: 'from-purple-500 to-purple-400' },
              { id: 'data', label: 'Data', icon: <Database className="w-4 h-4" />, gradient: 'from-green-500 to-green-400' },
              { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" />, gradient: 'from-orange-500 to-orange-400' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActivePanel(tab.id as any)}
                className={`flex-1 py-3.5 flex items-center justify-center gap-2 text-sm font-medium transition-all relative group ${
                  activePanel === tab.id
                    ? 'bg-gradient-to-b from-slate-800/80 to-slate-800/60 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                }`}
              >
                <div className={`transition-transform group-hover:scale-110 ${
                  activePanel === tab.id ? 'text-white' : ''
                }`}>
                  {tab.icon}
                </div>
                <span>{tab.label}</span>
                {activePanel === tab.id && (
                  <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r ${tab.gradient}`}></div>
                )}
              </button>
            ))}
          </div>

          {/* Panel Content */}
          <div className="flex-1 p-4 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#475569 transparent' }}>
            {activePanel === 'widgets' && (
              <div className="space-y-4">
                {widgetLibrary.map(category => (
                  <div key={category.category}>
                    <button
                      onClick={() => toggleCategory(category.category)}
                      className="w-full flex items-center justify-between py-2.5 px-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/30 rounded-lg transition-all"
                    >
                      <span>{category.category}</span>
                      {expandedCategories.includes(category.category) ? 
                        <ChevronDown className="w-4 h-4" /> : 
                        <ChevronRight className="w-4 h-4" />
                      }
                    </button>
                    {expandedCategories.includes(category.category) && (
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {category.widgets.map((widget, idx) => (
                          <div
                            key={idx}
                            draggable
                            onDragStart={(e) => handleDragStart(e, { ...widget, category: category.category })}
                            onClick={() => handleAddWidget({ ...widget, category: category.category })}
                            className="p-3 bg-gradient-to-br from-slate-800/60 to-slate-800/40 border border-white/10 rounded-xl cursor-move hover:from-slate-700/70 hover:to-slate-700/50 hover:border-blue-500/40 hover:shadow-lg hover:shadow-blue-500/10 hover:scale-[1.02] transition-all group"
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <div className="text-blue-400 group-hover:text-blue-300 transition-colors">
                                {widget.icon}
                              </div>
                              <span className="text-sm font-medium text-white group-hover:text-blue-50">{widget.title}</span>
                            </div>
                            <div className="text-xs text-slate-500 group-hover:text-slate-400">{widget.type}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {activePanel === 'templates' && (
              <div className="space-y-3">
                <p className="text-sm text-slate-400 mb-4">Start with a pre-built template</p>
                {[
                  { id: 'executive', name: 'Executive Dashboard', icon: '🎯', desc: 'High-level KPIs and trends' },
                  { id: 'operational', name: 'Operational Dashboard', icon: '📊', desc: 'Real-time operations monitoring' },
                  { id: 'financial', name: 'Financial Analytics', icon: '💰', desc: 'Cost analysis and budgeting' },
                  { id: 'compliance', name: 'Compliance & Risk', icon: '🛡️', desc: 'Risk assessment and compliance' },
                  { id: 'ai-powered', name: 'AI-Powered Insights', icon: '🤖', desc: 'ML-driven analytics and predictions' },
                  { id: 'vendor-management', name: 'Vendor Management', icon: '🏢', desc: 'Vendor performance and contracts' },
                  { id: 'security', name: 'Security Overview', icon: '🔒', desc: 'Threat monitoring and security metrics' },
                  { id: 'performance', name: 'Application Performance', icon: '⚡', desc: 'App performance and user experience' }
                ].map(template => (
                  <button
                    key={template.id}
                    onClick={() => loadTemplate(template.id)}
                    className="w-full p-4 bg-gradient-to-br from-slate-800/60 to-slate-800/40 border border-white/10 rounded-xl hover:from-slate-700/70 hover:to-slate-700/50 hover:border-purple-500/40 hover:shadow-xl hover:shadow-purple-500/10 hover:scale-[1.01] transition-all text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl group-hover:scale-110 transition-transform">{template.icon}</span>
                      <div className="flex-1">
                        <span className="font-medium text-white block group-hover:text-purple-100">{template.name}</span>
                        <span className="text-xs text-slate-500 group-hover:text-slate-400">{template.desc}</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
                    </div>
                  </button>
                ))}
              </div>
            )}

            {activePanel === 'data' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-white mb-3">Connected Data Sources</h3>
                  <div className="space-y-2">
                    {dataSources.map(source => (
                      <div key={source.id} className="flex items-center justify-between p-3 bg-slate-800/50 border border-white/10 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${
                            source.status === 'connected' ? 'bg-green-400' : 'bg-red-400'
                          }`} />
                          <div>
                            <div className="text-sm font-medium text-white">{source.name}</div>
                            <div className="text-xs text-slate-400">{source.type}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <RefreshCw className="w-4 h-4 text-slate-400 cursor-pointer hover:text-white" />
                          <Settings className="w-4 h-4 text-slate-400 cursor-pointer hover:text-white" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <button className="w-full p-3 border-2 border-dashed border-slate-600 rounded-lg hover:border-blue-500/50 transition-all text-slate-400 hover:text-white">
                    <Plus className="w-4 h-4 mx-auto mb-1" />
                    <div className="text-sm">Add Data Source</div>
                  </button>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-white mb-3">Sample Datasets</h3>
                  <div className="space-y-2">
                    {[
                      { name: 'DataChart Applications', count: '1,247 records' },
                      { name: 'Vendor Contracts', count: '89 records' },
                      { name: 'User Analytics', count: '45,892 records' },
                      { name: 'Cost Data', count: '2,156 records' }
                    ].map((dataset, idx) => (
                      <div key={idx} className="p-2 bg-slate-800/30 rounded border border-white/10">
                        <div className="text-sm text-white">{dataset.name}</div>
                        <div className="text-xs text-slate-400">{dataset.count}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activePanel === 'settings' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-white mb-3">Dashboard Settings</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">Theme</label>
                      <select className="w-full bg-slate-800/50 border border-white/10 rounded px-2 py-1 text-sm text-white">
                        <option>Dark Theme</option>
                        <option>Light Theme</option>
                        <option>Auto</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">Auto-refresh</label>
                      <select className="w-full bg-slate-800/50 border border-white/10 rounded px-2 py-1 text-sm text-white">
                        <option>30 seconds</option>
                        <option>1 minute</option>
                        <option>5 minutes</option>
                        <option>Disabled</option>
                      </select>
                    </div>
                    <div>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" className="rounded" defaultChecked />
                        <span className="text-sm text-slate-400">Enable animations</span>
                      </label>
                    </div>
                    <div>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" className="rounded" />
                        <span className="text-sm text-slate-400">Show grid lines</span>
                      </label>
                    </div>
                    <div>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" className="rounded" defaultChecked />
                        <span className="text-sm text-slate-400">Auto-save changes</span>
                      </label>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-white mb-3">Permissions</h3>
                  <div className="space-y-2">
                    <div className="p-2 bg-slate-800/30 rounded border border-white/10">
                      <div className="text-sm text-white">View Access</div>
                      <div className="text-xs text-green-400">All users</div>
                    </div>
                    <div className="p-2 bg-slate-800/30 rounded border border-white/10">
                      <div className="text-sm text-white">Edit Access</div>
                      <div className="text-xs text-yellow-400">Admin only</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main Canvas */}
        <div className="flex-1 p-6 overflow-auto">
          <div
            id="dashboard-canvas"
            ref={canvasRef}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className={`relative w-full bg-slate-900/50 rounded-xl border-2 border-dashed transition-all ${
              isDragging ? 'border-blue-500/50 bg-blue-500/5' : 'border-slate-700'
            }`}
            style={{ 
              minHeight: '600px',
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
              backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px`
            }}
          >
            {widgets.length === 0 && !isDragging && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 pointer-events-none">
                <Grid3x3 className="w-12 h-12 mb-3" />
                <p className="text-lg font-medium">Drop widgets here to build your dashboard</p>
                <p className="text-sm mt-2">Or click on widgets in the left panel</p>
              </div>
            )}
            
            {/* Render widgets */}
            {widgets.map(widget => (
              <div
                key={widget.id}
                className={`absolute bg-slate-800/80 border rounded-lg p-4 hover:border-blue-500/30 transition-all group cursor-move ${
                  selectedWidget === widget.id ? 'border-blue-500 shadow-lg shadow-blue-500/20' : 'border-white/10'
                }`}
                style={{
                  left: `${widget.position.x * GRID_SIZE}px`,
                  top: `${widget.position.y * GRID_SIZE}px`,
                  width: `${widget.position.w * GRID_SIZE - 8}px`,
                  height: `${widget.position.h * GRID_SIZE - 8}px`
                }}
                onClick={() => setSelectedWidget(widget.id)}
                onMouseDown={(e) => handleWidgetMouseDown(e, widget.id)}
              >
                {/* Widget Header */}
                <div className="flex items-center justify-between mb-2 pointer-events-none">
                  <div className="flex items-center gap-2">
                    <div style={{ color: widget.color }}>{widget.icon}</div>
                    <span className="text-sm font-medium text-white">{widget.title}</span>
                    {widget.locked && <Lock className="w-3 h-3 text-yellow-400" />}
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 pointer-events-auto">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleToggleLock(widget.id); }}
                      className="p-1 hover:bg-slate-700 rounded"
                      title={widget.locked ? "Unlock" : "Lock"}
                    >
                      {widget.locked ? <Unlock className="w-3 h-3 text-yellow-400" /> : <Lock className="w-3 h-3 text-slate-400" />}
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleConfigureWidget(widget.id); }}
                      className="p-1 hover:bg-slate-700 rounded"
                      title="Configure"
                    >
                      <Settings className="w-3 h-3 text-blue-400" />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDuplicateWidget(widget.id); }}
                      className="p-1 hover:bg-slate-700 rounded"
                      title="Duplicate"
                    >
                      <Copy className="w-3 h-3 text-slate-400" />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDeleteWidget(widget.id); }}
                      className="p-1 hover:bg-red-500/20 rounded"
                      title="Delete"
                      disabled={widget.locked}
                    >
                      <Trash2 className={`w-3 h-3 ${widget.locked ? 'text-slate-600' : 'text-red-400'}`} />
                    </button>
                  </div>
                </div>
                
                {/* Widget Preview Content */}
                <div className="text-xs text-slate-500 pointer-events-none">
                  {widget.type === 'metric' && (
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white mt-2">$18.5M</div>
                      <div className="text-green-400 text-xs mt-1">↑ 3.2%</div>
                    </div>
                  )}
                  {widget.type === 'kpi' && (
                    <div className="text-center">
                      <div className="w-16 h-16 mx-auto mt-2 rounded-full border-4 border-green-400 flex items-center justify-center">
                        <span className="text-sm font-bold text-white">87%</span>
                      </div>
                      <div className="text-xs text-green-400 mt-1">Target: 90%</div>
                    </div>
                  )}
                  {widget.type === 'progress' && (
                    <div className="mt-4">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-white">Progress</span>
                        <span className="text-white">73%</span>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full" style={{width: '73%'}}></div>
                      </div>
                    </div>
                  )}
                  {(widget.type.includes('chart') || widget.type === 'heatmap' || widget.type === 'scatter') && (
                    <div className="flex items-center justify-center h-full">
                      <BarChart3 className="w-8 h-8 text-slate-600" />
                    </div>
                  )}
                  {widget.type === 'ai-insights' && (
                    <div className="space-y-2">
                      <div className="bg-purple-900/30 rounded p-2">
                        <div className="text-xs text-purple-400">💡 High risk vendor detected</div>
                      </div>
                      <div className="bg-blue-900/30 rounded p-2">
                        <div className="text-xs text-blue-400">📊 Cost optimization opportunity</div>
                      </div>
                      <div className="bg-green-900/30 rounded p-2">
                        <div className="text-xs text-green-400">✅ Compliance score improved</div>
                      </div>
                    </div>
                  )}
                  {widget.type === 'predictions' && (
                    <div className="space-y-2">
                      <div className="text-xs text-white font-medium">Q4 Forecast</div>
                      <div className="text-lg text-blue-400">$2.3M</div>
                      <div className="text-xs text-green-400">Confidence: 94%</div>
                    </div>
                  )}
                  {widget.type.includes('table') && (
                    <div className="space-y-1">
                      <div className="grid grid-cols-3 gap-1 text-xs">
                        <div className="bg-slate-700/50 p-1 rounded">Item</div>
                        <div className="bg-slate-700/50 p-1 rounded">Value</div>
                        <div className="bg-slate-700/50 p-1 rounded">Status</div>
                      </div>
                      <div className="grid grid-cols-3 gap-1 text-xs text-slate-400">
                        <div className="p-1">App 1</div>
                        <div className="p-1">$1.2K</div>
                        <div className="p-1 text-green-400">✓</div>
                      </div>
                    </div>
                  )}
                  {widget.type === 'filter' && (
                    <div className="space-y-2">
                      <div className="bg-slate-700/50 rounded px-2 py-1">
                        <div className="text-xs text-slate-400">Department: All</div>
                      </div>
                      <div className="bg-slate-700/50 rounded px-2 py-1">
                        <div className="text-xs text-slate-400">Status: Active</div>
                      </div>
                    </div>
                  )}
                  {widget.type === 'scorecard' && (
                    <div className="grid grid-cols-2 gap-2">
                      <div className="text-center">
                        <div className="text-lg font-bold text-green-400">A+</div>
                        <div className="text-xs text-slate-400">Security</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-yellow-400">B</div>
                        <div className="text-xs text-slate-400">Cost</div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Resize Handles */}
                <div
                  className="absolute bottom-0 right-0 w-4 h-4 bg-blue-500 rounded-tl opacity-0 group-hover:opacity-100 cursor-se-resize"
                  onMouseDown={(e) => handleResizeStart(e, widget.id, 'bottom-right')}
                />
                <div
                  className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-2 bg-blue-500 rounded-t opacity-0 group-hover:opacity-100 cursor-s-resize"
                  onMouseDown={(e) => handleResizeStart(e, widget.id, 'bottom')}
                />
                <div
                  className="absolute top-1/2 right-0 transform -translate-y-1/2 w-2 h-8 bg-blue-500 rounded-l opacity-0 group-hover:opacity-100 cursor-e-resize"
                  onMouseDown={(e) => handleResizeStart(e, widget.id, 'right')}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Right Properties Panel */}
        {selectedWidget && widgets.find(w => w.id === selectedWidget) && (
          <div className="w-80 bg-slate-900/30 border-l border-white/10 p-4">
            <h3 className="text-sm font-medium text-white mb-4">Widget Properties</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Title</label>
                <input
                  type="text"
                  value={widgets.find(w => w.id === selectedWidget)?.title || ''}
                  onChange={(e) => {
                    setWidgets(widgets.map(w => 
                      w.id === selectedWidget ? { ...w, title: e.target.value } : w
                    ));
                  }}
                  className="w-full bg-slate-800/50 border border-white/10 rounded px-2 py-1 text-sm text-white"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Color</label>
                <div className="flex gap-2">
                  {['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'].map(color => (
                    <button
                      key={color}
                      onClick={() => {
                        setWidgets(widgets.map(w => 
                          w.id === selectedWidget ? { ...w, color } : w
                        ));
                      }}
                      className="w-8 h-8 rounded border-2 border-white/20"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Position</label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-slate-500">X</label>
                    <input
                      type="number"
                      value={widgets.find(w => w.id === selectedWidget)?.position.x || 0}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        setWidgets(widgets.map(w => 
                          w.id === selectedWidget 
                            ? { ...w, position: { ...w.position, x: Math.max(0, Math.min(val, GRID_COLS - w.position.w)) } }
                            : w
                        ));
                      }}
                      className="w-full bg-slate-800/50 border border-white/10 rounded px-2 py-1 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500">Y</label>
                    <input
                      type="number"
                      value={widgets.find(w => w.id === selectedWidget)?.position.y || 0}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        setWidgets(widgets.map(w => 
                          w.id === selectedWidget 
                            ? { ...w, position: { ...w.position, y: Math.max(0, val) } }
                            : w
                        ));
                      }}
                      className="w-full bg-slate-800/50 border border-white/10 rounded px-2 py-1 text-sm text-white"
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Size</label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-slate-500">Width</label>
                    <input
                      type="number"
                      value={widgets.find(w => w.id === selectedWidget)?.position.w || 3}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 1;
                        setWidgets(widgets.map(w => 
                          w.id === selectedWidget 
                            ? { ...w, position: { ...w.position, w: Math.max(1, Math.min(val, GRID_COLS - w.position.x)) } }
                            : w
                        ));
                      }}
                      className="w-full bg-slate-800/50 border border-white/10 rounded px-2 py-1 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500">Height</label>
                    <input
                      type="number"
                      value={widgets.find(w => w.id === selectedWidget)?.position.h || 2}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 1;
                        setWidgets(widgets.map(w => 
                          w.id === selectedWidget 
                            ? { ...w, position: { ...w.position, h: Math.max(1, val) } }
                            : w
                        ));
                      }}
                      className="w-full bg-slate-800/50 border border-white/10 rounded px-2 py-1 text-sm text-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Widget Configuration Panel */}
      {configPanelWidget && (
        <WidgetConfigPanel
          widget={configPanelWidget}
          dataSources={dataSources}
          onSave={handleSaveWidgetConfig}
          onClose={() => setConfigPanelWidget(null)}
        />
      )}
      
      {/* Export Panel */}
      {showExportPanel && (
        <ExportPanel
          dashboardName={dashboardName}
          onClose={() => setShowExportPanel(false)}
        />
      )}
      
      {/* Share Panel */}
      {showSharePanel && (
        <SharePanel
          dashboardId={dashboardId}
          dashboardName={dashboardName}
          onClose={() => setShowSharePanel(false)}
        />
      )}
      
      {/* Help Panel */}
      {showHelpPanel && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Dashboard Builder Help</h2>
              <button
                onClick={() => setShowHelpPanel(false)}
                className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Keyboard Shortcuts</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    { keys: ['Ctrl', 'S'], desc: 'Save dashboard' },
                    { keys: ['Ctrl', 'Z'], desc: 'Undo' },
                    { keys: ['Ctrl', 'Y'], desc: 'Redo' },
                    { keys: ['Ctrl', 'D'], desc: 'Duplicate selected widget' },
                    { keys: ['Delete'], desc: 'Delete selected widget' },
                    { keys: ['Arrow Keys'], desc: 'Move selected widget' },
                    { keys: ['F1'], desc: 'Show this help panel' },
                    { keys: ['Esc'], desc: 'Deselect widget' }
                  ].map((shortcut, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                      <span className="text-sm text-slate-300">{shortcut.desc}</span>
                      <div className="flex gap-1">
                        {shortcut.keys.map((key, keyIdx) => (
                          <span key={keyIdx} className="px-2 py-1 bg-slate-700 text-xs rounded border border-white/10 text-white">
                            {key}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Widget Operations</h3>
                <div className="space-y-2">
                  <div className="flex items-start gap-3 p-3 bg-slate-800/30 rounded-lg">
                    <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                      <Move className="w-4 h-4 text-blue-400" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">Drag & Drop</div>
                      <div className="text-xs text-slate-400">Drag widgets from the library to the canvas or move existing widgets around</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-slate-800/30 rounded-lg">
                    <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                      <Maximize2 className="w-4 h-4 text-green-400" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">Resize</div>
                      <div className="text-xs text-slate-400">Hover over a widget to see resize handles, then drag to resize</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-slate-800/30 rounded-lg">
                    <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                      <Settings className="w-4 h-4 text-purple-400" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">Configure</div>
                      <div className="text-xs text-slate-400">Click the settings icon on a widget to configure data sources and styling</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Pro Tips</h3>
                <div className="space-y-2 text-sm text-slate-300">
                  <div className="flex gap-3">
                    <span className="text-blue-400">•</span>
                    <span>Use templates to get started quickly with pre-configured layouts</span>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-blue-400">•</span>
                    <span>Lock widgets to prevent accidental modifications</span>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-blue-400">•</span>
                    <span>Use the grid to align widgets perfectly</span>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-blue-400">•</span>
                    <span>Save regularly using Ctrl+S</span>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-blue-400">•</span>
                    <span>Preview your dashboard before sharing with stakeholders</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardBuilderFixed;
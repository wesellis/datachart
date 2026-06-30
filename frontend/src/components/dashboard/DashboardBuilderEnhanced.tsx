import React, { useState, useCallback, useRef } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { 
  Plus, Save, Eye, Settings, Database, Layout, Palette, 
  BarChart3, PieChart, TrendingUp, Table, Type, Activity,
  DollarSign, Shield, Target, Brain, AlertCircle, Grid3x3,
  Layers, Copy, Trash2, ChevronDown, ChevronRight, Lock,
  Unlock, Zap, RefreshCw, Download, Upload, Share2
} from 'lucide-react';
import axios from 'axios';

interface Widget {
  id: string;
  type: string;
  title: string;
  icon: React.ReactNode;
  category: string;
  dataSource?: string;
  config: any;
  position?: { x: number; y: number; w: number; h: number };
  defaultSize?: { w: number; h: number };
}

interface Template {
  id: string;
  name: string;
  description: string;
  preview: string;
  widgets: Widget[];
}

const widgetLibrary = [
  {
    category: 'Key Metrics',
    widgets: [
      { id: 'kpi-spend', type: 'metric', title: 'Total Spend', icon: <DollarSign className="w-4 h-4" />, defaultSize: { w: 3, h: 2 } },
      { id: 'kpi-risk', type: 'metric', title: 'Risk Score', icon: <Activity className="w-4 h-4" />, defaultSize: { w: 3, h: 2 } },
      { id: 'kpi-compliance', type: 'metric', title: 'Compliance', icon: <Shield className="w-4 h-4" />, defaultSize: { w: 3, h: 2 } },
      { id: 'kpi-vendors', type: 'metric', title: 'Vendor Count', icon: <Target className="w-4 h-4" />, defaultSize: { w: 3, h: 2 } }
    ]
  },
  {
    category: 'Charts',
    widgets: [
      { id: 'bar-chart', type: 'chart', title: 'Bar Chart', icon: <BarChart3 className="w-4 h-4" />, defaultSize: { w: 6, h: 4 } },
      { id: 'pie-chart', type: 'chart', title: 'Pie Chart', icon: <PieChart className="w-4 h-4" />, defaultSize: { w: 4, h: 4 } },
      { id: 'line-chart', type: 'chart', title: 'Line Chart', icon: <TrendingUp className="w-4 h-4" />, defaultSize: { w: 6, h: 4 } },
      { id: 'radar-chart', type: 'chart', title: 'Radar Chart', icon: <Activity className="w-4 h-4" />, defaultSize: { w: 4, h: 4 } }
    ]
  },
  {
    category: 'AI & Insights',
    widgets: [
      { id: 'ai-insights', type: 'ai', title: 'AI Insights Panel', icon: <Brain className="w-4 h-4" />, defaultSize: { w: 3, h: 6 } },
      { id: 'alerts', type: 'alerts', title: 'Alert Banner', icon: <AlertCircle className="w-4 h-4" />, defaultSize: { w: 12, h: 1 } },
      { id: 'anomaly', type: 'anomaly', title: 'Anomaly Detection', icon: <Zap className="w-4 h-4" />, defaultSize: { w: 4, h: 3 } }
    ]
  },
  {
    category: 'Data Tables',
    widgets: [
      { id: 'app-table', type: 'table', title: 'Applications Table', icon: <Table className="w-4 h-4" />, defaultSize: { w: 12, h: 4 } },
      { id: 'vendor-table', type: 'table', title: 'Vendor Table', icon: <Table className="w-4 h-4" />, defaultSize: { w: 6, h: 4 } }
    ]
  },
  {
    category: 'Text & Layout',
    widgets: [
      { id: 'text', type: 'text', title: 'Text Block', icon: <Type className="w-4 h-4" />, defaultSize: { w: 6, h: 2 } },
      { id: 'divider', type: 'divider', title: 'Divider', icon: <Layers className="w-4 h-4" />, defaultSize: { w: 12, h: 1 } }
    ]
  }
];

const templates: Template[] = [
  {
    id: 'executive',
    name: 'Executive Dashboard',
    description: 'High-level KPIs with AI insights and predictive analytics',
    preview: '🎯',
    widgets: []
  },
  {
    id: 'operational',
    name: 'Operational Dashboard',
    description: 'Detailed metrics, tables, and real-time monitoring',
    preview: '📊',
    widgets: []
  },
  {
    id: 'financial',
    name: 'Financial Analytics',
    description: 'Cost optimization and spend analysis focused',
    preview: '💰',
    widgets: []
  },
  {
    id: 'compliance',
    name: 'Compliance & Risk',
    description: 'Security, compliance, and risk management focused',
    preview: '🛡️',
    widgets: []
  }
];

const DraggableWidget: React.FC<{ widget: any; onDrop: (widget: any) => void }> = ({ widget, onDrop }) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'widget',
    item: widget,
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    })
  });

  return (
    <div
      ref={drag as any}
      className={`p-3 bg-slate-800/50 border border-white/10 rounded-lg cursor-move hover:bg-slate-700/50 hover:border-blue-500/30 transition-all ${
        isDragging ? 'opacity-50' : ''
      }`}
      onClick={() => onDrop(widget)}
    >
      <div className="flex items-center gap-2 mb-1">
        {widget.icon}
        <span className="text-sm font-medium text-white">{widget.title}</span>
      </div>
      <div className="text-xs text-slate-400">{widget.type}</div>
    </div>
  );
};

const Canvas: React.FC<{ widgets: Widget[]; onUpdateWidget: (id: string, updates: any) => void; onDeleteWidget: (id: string) => void }> = ({ 
  widgets, 
  onUpdateWidget, 
  onDeleteWidget 
}) => {
  const [{ isOver }, drop] = useDrop({
    accept: 'widget',
    drop: (item: Widget, monitor) => {
      const offset = monitor.getSourceClientOffset();
      if (offset) {
        onUpdateWidget(item.id, { 
          position: { 
            x: Math.round(offset.x / 100), 
            y: Math.round(offset.y / 100),
            w: item.defaultSize?.w || 3,
            h: item.defaultSize?.h || 2
          } 
        });
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver()
    })
  });

  return (
    <div
      ref={drop as any}
      className={`relative w-full h-full bg-slate-900/50 rounded-xl border-2 border-dashed ${
        isOver ? 'border-blue-500/50 bg-blue-500/5' : 'border-slate-700'
      } transition-all`}
      style={{ minHeight: '600px' }}
    >
      {widgets.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500">
          <Grid3x3 className="w-12 h-12 mb-3" />
          <p className="text-lg font-medium">Drop widgets here to build your dashboard</p>
          <p className="text-sm mt-2">Or select a template to get started</p>
        </div>
      )}
      
      {/* Grid overlay */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
        backgroundSize: '60px 60px'
      }} />
      
      {/* Render widgets */}
      {widgets.map(widget => (
        <div
          key={widget.id}
          className="absolute bg-slate-800/80 border border-white/10 rounded-lg p-4 hover:border-blue-500/30 transition-all group"
          style={{
            left: `${(widget.position?.x || 0) * 60}px`,
            top: `${(widget.position?.y || 0) * 60}px`,
            width: `${(widget.position?.w || 3) * 60 - 8}px`,
            height: `${(widget.position?.h || 2) * 60 - 8}px`
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {widget.icon}
              <span className="text-sm font-medium text-white">{widget.title}</span>
            </div>
            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
              <button className="p-1 hover:bg-slate-700 rounded">
                <Settings className="w-3 h-3 text-slate-400" />
              </button>
              <button className="p-1 hover:bg-slate-700 rounded">
                <Copy className="w-3 h-3 text-slate-400" />
              </button>
              <button 
                onClick={() => onDeleteWidget(widget.id)}
                className="p-1 hover:bg-red-500/20 rounded"
              >
                <Trash2 className="w-3 h-3 text-red-400" />
              </button>
            </div>
          </div>
          <div className="text-xs text-slate-500">
            {widget.dataSource ? `Data: ${widget.dataSource}` : 'No data source'}
          </div>
        </div>
      ))}
    </div>
  );
};

const DashboardBuilderEnhanced: React.FC = () => {
  const [activePanel, setActivePanel] = useState<'widgets' | 'templates' | 'data' | 'settings'>('widgets');
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [dashboardName, setDashboardName] = useState('Untitled Dashboard');
  const [selectedDataSource, setSelectedDataSource] = useState('snowflake');
  const [previewMode, setPreviewMode] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['Key Metrics', 'Charts']);

  const handleAddWidget = (widget: any) => {
    const newWidget = {
      ...widget,
      id: `widget-${Date.now()}`,
      position: { x: 0, y: 0, w: widget.defaultSize?.w || 3, h: widget.defaultSize?.h || 2 }
    };
    setWidgets([...widgets, newWidget]);
  };

  const handleUpdateWidget = (id: string, updates: any) => {
    setWidgets(widgets.map(w => w.id === id ? { ...w, ...updates } : w));
  };

  const handleDeleteWidget = (id: string) => {
    setWidgets(widgets.filter(w => w.id !== id));
  };

  const handleSave = async () => {
    try {
      await axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/v1/dashboards`, {
        name: dashboardName,
        widgets,
        dataSources: [selectedDataSource]
      });
      alert('Dashboard saved successfully!');
    } catch (error) {
      console.error('Save failed:', error);
    }
  };

  const handleLoadTemplate = (template: Template) => {
    // Load predefined widgets for the template
    const templateWidgets = template.id === 'executive' ? [
      { ...widgetLibrary[0].widgets[0], id: 'w1', position: { x: 0, y: 0, w: 3, h: 2 } },
      { ...widgetLibrary[0].widgets[1], id: 'w2', position: { x: 3, y: 0, w: 3, h: 2 } },
      { ...widgetLibrary[0].widgets[2], id: 'w3', position: { x: 6, y: 0, w: 3, h: 2 } },
      { ...widgetLibrary[0].widgets[3], id: 'w4', position: { x: 9, y: 0, w: 3, h: 2 } },
      { ...widgetLibrary[1].widgets[0], id: 'w5', position: { x: 0, y: 2, w: 8, h: 4 } },
      { ...widgetLibrary[2].widgets[0], id: 'w6', position: { x: 8, y: 2, w: 4, h: 6 } }
    ] : [];
    setWidgets(templateWidgets as Widget[]);
    setDashboardName(`${template.name} - ${new Date().toLocaleDateString()}`);
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
        {/* Header */}
        <div className="bg-slate-900/50 backdrop-blur-xl border-b border-white/10 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                <Layout className="w-5 h-5 text-white" />
              </div>
              <div>
                <input
                  type="text"
                  value={dashboardName}
                  onChange={(e) => setDashboardName(e.target.value)}
                  className="text-xl font-bold bg-transparent border-none outline-none text-white placeholder-slate-500"
                  placeholder="Dashboard Name"
                />
                <p className="text-sm text-slate-400">Drag and drop widgets to build your dashboard</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button className="px-4 py-2 bg-slate-800/50 border border-white/10 rounded-lg hover:bg-slate-700/50 transition-all flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Import
              </button>
              <button className="px-4 py-2 bg-slate-800/50 border border-white/10 rounded-lg hover:bg-slate-700/50 transition-all flex items-center gap-2">
                <Download className="w-4 h-4" />
                Export
              </button>
              <button 
                onClick={() => setPreviewMode(!previewMode)}
                className="px-4 py-2 bg-slate-800/50 border border-white/10 rounded-lg hover:bg-slate-700/50 transition-all flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                Preview
              </button>
              <button className="px-4 py-2 bg-slate-800/50 border border-white/10 rounded-lg hover:bg-slate-700/50 transition-all flex items-center gap-2">
                <Share2 className="w-4 h-4" />
                Share
              </button>
              <button 
                onClick={handleSave}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg transition-all flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Save Dashboard
              </button>
            </div>
          </div>
        </div>

        <div className="flex h-[calc(100vh-80px)]">
          {/* Left Sidebar */}
          <div className="w-80 bg-slate-900/30 border-r border-white/10 overflow-y-auto">
            {/* Panel Tabs */}
            <div className="flex border-b border-white/10">
              {[
                { id: 'widgets', label: 'Widgets', icon: <Grid3x3 className="w-4 h-4" /> },
                { id: 'templates', label: 'Templates', icon: <Layout className="w-4 h-4" /> },
                { id: 'data', label: 'Data', icon: <Database className="w-4 h-4" /> },
                { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActivePanel(tab.id as any)}
                  className={`flex-1 py-3 flex items-center justify-center gap-2 text-sm font-medium transition-all ${
                    activePanel === tab.id
                      ? 'bg-slate-800/50 text-white border-b-2 border-blue-500'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/30'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Panel Content */}
            <div className="p-4">
              {activePanel === 'widgets' && (
                <div className="space-y-4">
                  {widgetLibrary.map(category => (
                    <div key={category.category}>
                      <button
                        onClick={() => toggleCategory(category.category)}
                        className="w-full flex items-center justify-between py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
                      >
                        <span>{category.category}</span>
                        {expandedCategories.includes(category.category) ? 
                          <ChevronDown className="w-4 h-4" /> : 
                          <ChevronRight className="w-4 h-4" />
                        }
                      </button>
                      {expandedCategories.includes(category.category) && (
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          {category.widgets.map(widget => (
                            <DraggableWidget 
                              key={widget.id} 
                              widget={widget} 
                              onDrop={handleAddWidget}
                            />
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
                  {templates.map(template => (
                    <button
                      key={template.id}
                      onClick={() => handleLoadTemplate(template)}
                      className="w-full p-4 bg-slate-800/50 border border-white/10 rounded-lg hover:bg-slate-700/50 hover:border-blue-500/30 transition-all text-left"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">{template.preview}</span>
                        <h3 className="font-medium text-white">{template.name}</h3>
                      </div>
                      <p className="text-xs text-slate-400">{template.description}</p>
                    </button>
                  ))}
                </div>
              )}

              {activePanel === 'data' && (
                <div className="space-y-4">
                  <p className="text-sm text-slate-400 mb-4">Connect data sources</p>
                  {['Snowflake', 'Azure', 'ServiceNow', 'Oracle', 'SAP'].map(source => (
                    <div key={source} className="p-3 bg-slate-800/50 border border-white/10 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Database className="w-4 h-4 text-blue-400" />
                          <span className="text-sm font-medium text-white">{source}</span>
                        </div>
                        <button className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded hover:bg-blue-500/30 transition-all">
                          Connect
                        </button>
                      </div>
                      <div className="text-xs text-slate-500">
                        {source === 'Snowflake' ? 'Connected' : 'Not connected'}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activePanel === 'settings' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-slate-400 mb-2 block">Refresh Rate</label>
                    <select className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 text-white">
                      <option>Real-time</option>
                      <option>30 seconds</option>
                      <option>1 minute</option>
                      <option>5 minutes</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm text-slate-400 mb-2 block">Theme</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button className="p-2 bg-slate-800/50 border border-blue-500/30 rounded-lg text-sm">Dark</button>
                      <button className="p-2 bg-slate-800/50 border border-white/10 rounded-lg text-sm hover:border-white/30">Light</button>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-slate-400 mb-2 block">Grid Size</label>
                    <input type="range" min="8" max="24" className="w-full" />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Main Canvas */}
          <div className="flex-1 p-6 overflow-auto">
            <Canvas 
              widgets={widgets}
              onUpdateWidget={handleUpdateWidget}
              onDeleteWidget={handleDeleteWidget}
            />
          </div>

          {/* Right Properties Panel */}
          {widgets.length > 0 && (
            <div className="w-80 bg-slate-900/30 border-l border-white/10 p-4">
              <h3 className="text-sm font-medium text-white mb-4">Widget Properties</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Data Source</label>
                  <select className="w-full bg-slate-800/50 border border-white/10 rounded px-2 py-1 text-sm text-white">
                    <option>Snowflake</option>
                    <option>Azure</option>
                    <option>ServiceNow</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Refresh Rate</label>
                  <select className="w-full bg-slate-800/50 border border-white/10 rounded px-2 py-1 text-sm text-white">
                    <option>Real-time</option>
                    <option>30s</option>
                    <option>1m</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Colors</label>
                  <div className="flex gap-2">
                    {['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'].map(color => (
                      <button
                        key={color}
                        className="w-8 h-8 rounded border-2 border-white/20"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </DndProvider>
  );
};

export default DashboardBuilderEnhanced;
import React, { useState } from 'react';
import { useDrag } from 'react-dnd';
import { 
  BarChart3, 
  PieChart, 
  LineChart,
  Activity,
  Database,
  FileText,
  Users,
  TrendingUp,
  Calendar,
  Target
} from 'lucide-react';

interface WidgetType {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: 'charts' | 'metrics' | 'data' | 'text';
  gradient: string;
  config?: any;
}

interface DraggableWidgetProps {
  widget: WidgetType;
  onAdd: () => void;
}

const DraggableWidget: React.FC<DraggableWidgetProps> = ({ widget, onAdd }) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'widget',
    item: { type: widget.id },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  return (
    <div
      ref={drag as any}
      onClick={onAdd}
      className={`
        group relative p-4 rounded-xl cursor-move transition-all duration-200
        bg-slate-700/30 border border-slate-600/30 
        hover:bg-slate-600/40 hover:border-blue-500/30 hover:scale-105
        ${isDragging ? 'opacity-50' : ''}
      `}
    >
      <div className={`
        w-12 h-12 rounded-lg mb-3 flex items-center justify-center
        bg-gradient-to-br ${widget.gradient}
      `}>
        {widget.icon}
      </div>
      
      <h4 className="font-semibold text-white mb-1 group-hover:text-blue-300">
        {widget.name}
      </h4>
      
      <p className="text-sm text-slate-400 group-hover:text-slate-300">
        {widget.description}
      </p>

      {/* Drag indicator */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-60 transition-opacity">
        <div className="flex flex-col gap-1">
          <div className="flex gap-1">
            <div className="w-1 h-1 bg-white rounded-full"></div>
            <div className="w-1 h-1 bg-white rounded-full"></div>
          </div>
          <div className="flex gap-1">
            <div className="w-1 h-1 bg-white rounded-full"></div>
            <div className="w-1 h-1 bg-white rounded-full"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface WidgetLibraryProps {
  onAddWidget: (widgetType: string) => void;
}

const WidgetLibrary: React.FC<WidgetLibraryProps> = ({ onAddWidget }) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const widgetTypes: WidgetType[] = [
    // Chart Widgets
    {
      id: 'line-chart',
      name: 'Line Chart',
      description: 'Time series and trend visualization',
      icon: <LineChart className="w-6 h-6 text-white" />,
      category: 'charts',
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      id: 'bar-chart',
      name: 'Bar Chart',
      description: 'Compare categories and values',
      icon: <BarChart3 className="w-6 h-6 text-white" />,
      category: 'charts',
      gradient: 'from-purple-500 to-pink-500'
    },
    {
      id: 'pie-chart',
      name: 'Pie Chart',
      description: 'Show proportions and percentages',
      icon: <PieChart className="w-6 h-6 text-white" />,
      category: 'charts',
      gradient: 'from-green-500 to-emerald-500'
    },
    
    // Metric Widgets
    {
      id: 'kpi-metric',
      name: 'KPI Metric',
      description: 'Single value with trend indicator',
      icon: <TrendingUp className="w-6 h-6 text-white" />,
      category: 'metrics',
      gradient: 'from-orange-500 to-red-500'
    },
    {
      id: 'gauge-chart',
      name: 'Gauge Chart',
      description: 'Progress and performance indicator',
      icon: <Activity className="w-6 h-6 text-white" />,
      category: 'metrics',
      gradient: 'from-indigo-500 to-blue-500'
    },
    {
      id: 'target-metric',
      name: 'Target vs Actual',
      description: 'Compare actual vs target values',
      icon: <Target className="w-6 h-6 text-white" />,
      category: 'metrics',
      gradient: 'from-teal-500 to-cyan-500'
    },
    
    // Data Widgets
    {
      id: 'data-table',
      name: 'Data Table',
      description: 'Tabular data with sorting/filtering',
      icon: <Database className="w-6 h-6 text-white" />,
      category: 'data',
      gradient: 'from-slate-500 to-gray-500'
    },
    {
      id: 'user-list',
      name: 'User List',
      description: 'Display user information and stats',
      icon: <Users className="w-6 h-6 text-white" />,
      category: 'data',
      gradient: 'from-violet-500 to-purple-500'
    },
    
    // Text Widgets
    {
      id: 'text-widget',
      name: 'Text Block',
      description: 'Rich text content and formatting',
      icon: <FileText className="w-6 h-6 text-white" />,
      category: 'text',
      gradient: 'from-amber-500 to-orange-500'
    },
    {
      id: 'date-display',
      name: 'Date Display',
      description: 'Current date and time widget',
      icon: <Calendar className="w-6 h-6 text-white" />,
      category: 'text',
      gradient: 'from-rose-500 to-pink-500'
    }
  ];

  const categories = [
    { id: 'all', name: 'All Widgets', count: widgetTypes.length },
    { id: 'charts', name: 'Charts', count: widgetTypes.filter(w => w.category === 'charts').length },
    { id: 'metrics', name: 'Metrics', count: widgetTypes.filter(w => w.category === 'metrics').length },
    { id: 'data', name: 'Data', count: widgetTypes.filter(w => w.category === 'data').length },
    { id: 'text', name: 'Text', count: widgetTypes.filter(w => w.category === 'text').length }
  ];

  const filteredWidgets = activeCategory === 'all' 
    ? widgetTypes 
    : widgetTypes.filter(widget => widget.category === activeCategory);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white mb-2">Widget Library</h2>
        <p className="text-sm text-slate-400">
          Drag widgets to canvas or click to add
        </p>
      </div>

      {/* Category Filter */}
      <div className="space-y-2">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setActiveCategory(category.id)}
            className={`
              w-full text-left px-3 py-2 rounded-lg transition-all duration-200
              flex items-center justify-between
              ${activeCategory === category.id
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                : 'text-slate-300 hover:bg-slate-700/30 hover:text-white'
              }
            `}
          >
            <span className="font-medium">{category.name}</span>
            <span className={`
              text-xs px-2 py-1 rounded-full
              ${activeCategory === category.id
                ? 'bg-blue-500/30 text-blue-200'
                : 'bg-slate-600/50 text-slate-400'
              }
            `}>
              {category.count}
            </span>
          </button>
        ))}
      </div>

      {/* Widget Grid */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
          Available Widgets
        </h3>
        
        <div className="grid grid-cols-1 gap-3">
          {filteredWidgets.map((widget) => (
            <DraggableWidget
              key={widget.id}
              widget={widget}
              onAdd={() => onAddWidget(widget.id)}
            />
          ))}
        </div>
      </div>

      {/* Usage Tips */}
      <div className="mt-8 p-4 rounded-lg bg-slate-800/40 border border-slate-700/50">
        <h4 className="font-semibold text-white mb-2">💡 Pro Tips</h4>
        <ul className="text-sm text-slate-400 space-y-1">
          <li>• Drag widgets directly onto the canvas</li>
          <li>• Resize widgets by dragging corners</li>
          <li>• Connect data sources before adding charts</li>
          <li>• Use Cmd+S to save your dashboard</li>
        </ul>
      </div>
    </div>
  );
};

export default WidgetLibrary;

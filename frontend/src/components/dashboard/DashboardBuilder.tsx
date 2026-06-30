import React, { useState, useCallback } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { 
  Grid3x3, 
  BarChart3, 
  PieChart, 
  LineChart, 
  Activity,
  DollarSign,
  Users,
  TrendingUp,
  Package,
  Save,
  Eye,
  Settings,
  Plus,
  X,
  Move
} from 'lucide-react';
import './DashboardBuilder.css';

// Widget types
export interface Widget {
  id: string;
  type: 'metric' | 'chart' | 'table' | 'text';
  title: string;
  config: any;
  position: { x: number; y: number };
  size: { width: number; height: number };
}

// Available widget templates
const WIDGET_TEMPLATES = [
  { type: 'metric', icon: DollarSign, label: 'Metric Card', defaultSize: { width: 2, height: 1 } },
  { type: 'chart', subtype: 'bar', icon: BarChart3, label: 'Bar Chart', defaultSize: { width: 3, height: 2 } },
  { type: 'chart', subtype: 'line', icon: LineChart, label: 'Line Chart', defaultSize: { width: 3, height: 2 } },
  { type: 'chart', subtype: 'pie', icon: PieChart, label: 'Pie Chart', defaultSize: { width: 2, height: 2 } },
  { type: 'metric', subtype: 'kpi', icon: TrendingUp, label: 'KPI Tracker', defaultSize: { width: 2, height: 1 } },
  { type: 'table', icon: Grid3x3, label: 'Data Table', defaultSize: { width: 4, height: 3 } },
];

// Draggable widget from palette
const PaletteWidget: React.FC<{ template: any }> = ({ template }) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'widget',
    item: { ...template, isNew: true },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const Icon = template.icon;
  
  return (
    <div 
      ref={drag as any} 
      className={`palette-widget ${isDragging ? 'dragging' : ''}`}
      title={`Drag to add ${template.label}`}
    >
      <Icon size={24} />
      <span>{template.label}</span>
    </div>
  );
};

// Grid cell that accepts drops
const GridCell: React.FC<{ 
  x: number; 
  y: number; 
  onDrop: (item: any, x: number, y: number) => void;
  hasWidget: boolean;
}> = ({ x, y, onDrop, hasWidget }) => {
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: 'widget',
    drop: (item: any) => onDrop(item, x, y),
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  return (
    <div 
      ref={drop as any}
      className={`grid-cell ${isOver ? 'hover' : ''} ${canDrop ? 'can-drop' : ''} ${hasWidget ? 'has-widget' : ''}`}
      data-x={x}
      data-y={y}
    />
  );
};

// Dashboard canvas widget
const CanvasWidget: React.FC<{ 
  widget: Widget; 
  onRemove: (id: string) => void;
  onConfigure: (id: string) => void;
}> = ({ widget, onRemove, onConfigure }) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'widget',
    item: { ...widget, isNew: false },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const getIcon = () => {
    switch(widget.type) {
      case 'metric': return <DollarSign size={20} />;
      case 'chart': 
        if (widget.config?.subtype === 'line') return <LineChart size={20} />;
        if (widget.config?.subtype === 'pie') return <PieChart size={20} />;
        return <BarChart3 size={20} />;
      case 'table': return <Grid3x3 size={20} />;
      default: return <Package size={20} />;
    }
  };

  return (
    <div 
      ref={drag as any}
      className={`canvas-widget ${isDragging ? 'dragging' : ''}`}
      style={{
        gridColumn: `${widget.position.x + 1} / span ${widget.size.width}`,
        gridRow: `${widget.position.y + 1} / span ${widget.size.height}`,
      }}
    >
      <div className="widget-header">
        <div className="widget-title">
          {getIcon()}
          <span>{widget.title}</span>
        </div>
        <div className="widget-actions">
          <button onClick={() => onConfigure(widget.id)} title="Configure">
            <Settings size={16} />
          </button>
          <button onClick={() => onRemove(widget.id)} title="Remove">
            <X size={16} />
          </button>
        </div>
      </div>
      <div className="widget-content">
        <div className="widget-placeholder">
          {widget.type === 'metric' && (
            <div className="metric-placeholder">
              <div className="metric-value">$42.5K</div>
              <div className="metric-label">Sample Metric</div>
            </div>
          )}
          {widget.type === 'chart' && (
            <div className="chart-placeholder">
              <Activity size={48} />
              <p>Chart Preview</p>
            </div>
          )}
          {widget.type === 'table' && (
            <div className="table-placeholder">
              <div className="table-row"></div>
              <div className="table-row"></div>
              <div className="table-row"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Main Dashboard Builder Component
export const DashboardBuilder: React.FC = () => {
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [dashboardName, setDashboardName] = useState('Untitled Dashboard');
  const [isPreview, setIsPreview] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);

  const handleDrop = useCallback((item: any, x: number, y: number) => {
    if (item.isNew) {
      // Adding new widget from palette
      const newWidget: Widget = {
        id: `widget-${Date.now()}`,
        type: item.type,
        title: item.label,
        config: { subtype: item.subtype },
        position: { x, y },
        size: item.defaultSize || { width: 2, height: 2 },
      };
      setWidgets([...widgets, newWidget]);
    } else {
      // Moving existing widget
      setWidgets(widgets.map(w => 
        w.id === item.id 
          ? { ...w, position: { x, y } }
          : w
      ));
    }
  }, [widgets]);

  const removeWidget = (id: string) => {
    setWidgets(widgets.filter(w => w.id !== id));
  };

  const configureWidget = (id: string) => {
    // TODO: Open configuration modal
    alert(`Configure widget ${id} - Coming soon!`);
  };

  const saveDashboard = async () => {
    const dashboardData = {
      name: dashboardName,
      widgets: widgets,
      layout: {
        columns: 6,
        rows: 4,
      },
      created_at: new Date().toISOString(),
    };

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/v1/dashboards`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // TODO: Add authentication header
        },
        body: JSON.stringify(dashboardData),
      });

      if (response.ok) {
        alert('Dashboard saved successfully!');
        setShowSaveModal(false);
      } else {
        alert('Failed to save dashboard');
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('Error saving dashboard');
    }
  };

  const gridCells = [];
  for (let y = 0; y < 4; y++) {
    for (let x = 0; x < 6; x++) {
      const hasWidget = widgets.some(w => 
        x >= w.position.x && 
        x < w.position.x + w.size.width &&
        y >= w.position.y && 
        y < w.position.y + w.size.height
      );
      gridCells.push(
        <GridCell 
          key={`${x}-${y}`} 
          x={x} 
          y={y} 
          onDrop={handleDrop}
          hasWidget={hasWidget}
        />
      );
    }
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="dashboard-builder">
        {/* Header */}
        <div className="builder-header">
          <div className="header-left">
            <h1>Dashboard Builder</h1>
            <input 
              type="text" 
              value={dashboardName}
              onChange={(e) => setDashboardName(e.target.value)}
              className="dashboard-name-input"
              placeholder="Enter dashboard name..."
            />
          </div>
          <div className="header-actions">
            <button 
              className="btn-secondary"
              onClick={() => setIsPreview(!isPreview)}
            >
              <Eye size={18} />
              {isPreview ? 'Edit' : 'Preview'}
            </button>
            <button 
              className="btn-primary"
              onClick={() => setShowSaveModal(true)}
              disabled={widgets.length === 0}
            >
              <Save size={18} />
              Save Dashboard
            </button>
          </div>
        </div>

        <div className="builder-content">
          {/* Widget Palette */}
          {!isPreview && (
            <div className="widget-palette">
              <h3>Widgets</h3>
              <div className="palette-grid">
                {WIDGET_TEMPLATES.map((template, index) => (
                  <PaletteWidget key={index} template={template} />
                ))}
              </div>
              <div className="palette-help">
                <p>Drag widgets to the canvas to build your dashboard</p>
              </div>
            </div>
          )}

          {/* Dashboard Canvas */}
          <div className={`dashboard-canvas ${isPreview ? 'preview-mode' : ''}`}>
            <div className="canvas-container">
              {!isPreview && (
                <div className="canvas-grid">
                  {gridCells}
                </div>
              )}
              <div className="canvas-widgets">
                {widgets.map(widget => (
                  <CanvasWidget 
                    key={widget.id}
                    widget={widget}
                    onRemove={removeWidget}
                    onConfigure={configureWidget}
                  />
                ))}
              </div>
              {widgets.length === 0 && (
                <div className="empty-state">
                  <Package size={64} />
                  <h3>Start Building Your Dashboard</h3>
                  <p>Drag widgets from the palette to get started</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Save Modal */}
        {showSaveModal && (
          <div className="modal-overlay" onClick={() => setShowSaveModal(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <h2>Save Dashboard</h2>
              <div className="modal-content">
                <label>
                  Dashboard Name:
                  <input 
                    type="text" 
                    value={dashboardName}
                    onChange={(e) => setDashboardName(e.target.value)}
                    placeholder="Enter dashboard name..."
                  />
                </label>
                <div className="modal-info">
                  <p>Widgets: {widgets.length}</p>
                  <p>Layout: 6x4 Grid</p>
                </div>
              </div>
              <div className="modal-actions">
                <button className="btn-secondary" onClick={() => setShowSaveModal(false)}>
                  Cancel
                </button>
                <button className="btn-primary" onClick={saveDashboard}>
                  Save Dashboard
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DndProvider>
  );
};

export default DashboardBuilder;
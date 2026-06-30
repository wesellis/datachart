import React, { useState, useEffect, useCallback, useRef } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useAPMDashboard, DashboardWidget } from '../../contexts/APMDashboardContext';
import DraggableWidget from './DraggableWidget';
import { 
  Search, Star, StarOff, Download, Upload, Save, Undo, Redo,
  ZoomIn, ZoomOut, Grid, Smartphone, Tablet, Monitor, 
  Lock, Unlock, Copy, Link, Eye, EyeOff, Share2, Users,
  Sparkles, History, Layers, Settings, PlayCircle, PauseCircle,
  ChevronLeft, ChevronRight, Plus, Trash2, Move, Maximize2,
  RefreshCw, AlertCircle, CheckCircle, Clock, Package
} from 'lucide-react';
import './EnhancedDashboardBuilder.css';

// Widget template type
interface WidgetTemplate {
  id: string;
  type: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  category: string;
  defaultSize: { width: number; height: number };
  isFavorite?: boolean;
}

// Layout template type
interface LayoutTemplate {
  id: string;
  name: string;
  description: string;
  layout: DashboardWidget[];
  thumbnail?: string;
  createdAt: Date;
}

// History entry type
interface HistoryEntry {
  action: string;
  timestamp: Date;
  layout: DashboardWidget[];
}

const EnhancedDashboardBuilder: React.FC = () => {
  const { 
    layout, 
    addWidget, 
    removeWidget, 
    moveWidget, 
    updateLayout,
    resetLayout 
  } = useAPMDashboard();

  // Core states
  const [zoom, setZoom] = useState(100);
  const [viewMode, setViewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWidgets, setSelectedWidgets] = useState<Set<string>>(new Set());
  const [lockedWidgets, setLockedWidgets] = useState<Set<string>>(new Set());
  const [favoriteWidgets, setFavoriteWidgets] = useState<Set<string>>(new Set());
  
  // History & Undo/Redo
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [showHistory, setShowHistory] = useState(false);
  
  // Templates & Saving
  const [templates, setTemplates] = useState<LayoutTemplate[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [lastSaved, setLastSaved] = useState<Date>(new Date());
  
  // Advanced features
  const [showGrid, setShowGrid] = useState(true);
  const [showAlignmentGuides, setShowAlignmentGuides] = useState(true);
  const [collaborators, setCollaborators] = useState<string[]>([]);
  const [performanceMode, setPerformanceMode] = useState(false);
  const [draggedWidget, setDraggedWidget] = useState<any>(null);
  const [hoveredWidget, setHoveredWidget] = useState<string | null>(null);
  
  // Refs
  const canvasRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Widget templates
  const widgetTemplates: WidgetTemplate[] = [
    { id: 'total-apps', type: 'total-applications', label: 'Total Applications', description: 'Application count', icon: <Package size={20} />, category: 'metrics', defaultSize: { width: 3, height: 1 } },
    { id: 'spending-2024', type: 'spending-2024', label: '2024 Spending', description: 'Previous year spend', icon: <Clock size={20} />, category: 'metrics', defaultSize: { width: 3, height: 1 } },
    { id: 'spending-2025', type: 'spending-2025', label: '2025 Spending', description: 'Current year spend', icon: <Clock size={20} />, category: 'metrics', defaultSize: { width: 3, height: 1 } },
    { id: 'total-savings', type: 'total-savings', label: 'Total Savings', description: 'YoY savings', icon: <Sparkles size={20} />, category: 'metrics', defaultSize: { width: 3, height: 1 } },
    { id: 'spending-chart', type: 'spending-trend', label: 'Spending Trend', description: 'Monthly trend chart', icon: <PlayCircle size={20} />, category: 'charts', defaultSize: { width: 8, height: 3 } },
    { id: 'vendor-breakdown', type: 'vendor-breakdown', label: 'Vendor Breakdown', description: 'Vendor distribution', icon: <Layers size={20} />, category: 'charts', defaultSize: { width: 4, height: 3 } },
  ];

  // Auto-save effect
  useEffect(() => {
    if (autoSaveEnabled) {
      const saveInterval = setInterval(() => {
        saveToLocalStorage();
        setLastSaved(new Date());
      }, 30000); // Every 30 seconds
      return () => clearInterval(saveInterval);
    }
  }, [layout, autoSaveEnabled]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Undo: Ctrl+Z
      if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      // Redo: Ctrl+Y or Ctrl+Shift+Z
      if ((e.ctrlKey && e.key === 'y') || (e.ctrlKey && e.shiftKey && e.key === 'z')) {
        e.preventDefault();
        redo();
      }
      // Delete selected widgets
      if (e.key === 'Delete' && selectedWidgets.size > 0) {
        e.preventDefault();
        deleteSelectedWidgets();
      }
      // Select all: Ctrl+A
      if (e.ctrlKey && e.key === 'a') {
        e.preventDefault();
        selectAllWidgets();
      }
      // Save: Ctrl+S
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        saveToLocalStorage();
      }
      // Grid toggle: G
      if (e.key === 'g' && !e.ctrlKey) {
        setShowGrid(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedWidgets, historyIndex, history]);

  // History management
  const addToHistory = (action: string) => {
    const newEntry: HistoryEntry = {
      action,
      timestamp: new Date(),
      layout: [...layout]
    };
    
    // Remove any history after current index
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newEntry);
    
    // Limit history to 50 entries
    if (newHistory.length > 50) {
      newHistory.shift();
    }
    
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      const prevEntry = history[historyIndex - 1];
      updateLayout(prevEntry.layout);
      setHistoryIndex(historyIndex - 1);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const nextEntry = history[historyIndex + 1];
      updateLayout(nextEntry.layout);
      setHistoryIndex(historyIndex + 1);
    }
  };

  // Widget operations
  const deleteSelectedWidgets = () => {
    selectedWidgets.forEach(widgetId => {
      removeWidget(widgetId);
    });
    setSelectedWidgets(new Set());
    addToHistory('Deleted widgets');
  };

  const selectAllWidgets = () => {
    const allWidgetIds = layout.filter(w => w.visible).map(w => w.id);
    setSelectedWidgets(new Set(allWidgetIds));
  };

  const duplicateSelectedWidgets = () => {
    selectedWidgets.forEach(widgetId => {
      const widget = layout.find(w => w.id === widgetId);
      if (widget) {
        const newWidget: DashboardWidget = {
          ...widget,
          id: `widget-${Date.now()}-${Math.random()}`,
          position: {
            x: Math.min(widget.position.x + 1, 11),
            y: widget.position.y
          }
        };
        addWidget(newWidget);
      }
    });
    addToHistory('Duplicated widgets');
  };

  // Save/Load functions
  const saveToLocalStorage = () => {
    localStorage.setItem('dashboard-layout', JSON.stringify(layout));
    localStorage.setItem('dashboard-favorites', JSON.stringify(Array.from(favoriteWidgets)));
    localStorage.setItem('dashboard-locked', JSON.stringify(Array.from(lockedWidgets)));
  };

  const loadFromLocalStorage = () => {
    const savedLayout = localStorage.getItem('dashboard-layout');
    const savedFavorites = localStorage.getItem('dashboard-favorites');
    const savedLocked = localStorage.getItem('dashboard-locked');
    
    if (savedLayout) {
      updateLayout(JSON.parse(savedLayout));
    }
    if (savedFavorites) {
      setFavoriteWidgets(new Set(JSON.parse(savedFavorites)));
    }
    if (savedLocked) {
      setLockedWidgets(new Set(JSON.parse(savedLocked)));
    }
  };

  const exportLayout = () => {
    const data = {
      layout,
      favorites: Array.from(favoriteWidgets),
      locked: Array.from(lockedWidgets),
      exportDate: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dashboard-layout-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importLayout = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          updateLayout(data.layout);
          setFavoriteWidgets(new Set(data.favorites || []));
          setLockedWidgets(new Set(data.locked || []));
          addToHistory('Imported layout');
        } catch (error) {
          console.error('Failed to import layout:', error);
        }
      };
      reader.readAsText(file);
    }
  };

  // Template functions
  const saveAsTemplate = () => {
    const templateName = prompt('Enter template name:');
    if (templateName) {
      const newTemplate: LayoutTemplate = {
        id: `template-${Date.now()}`,
        name: templateName,
        description: `${layout.length} widgets`,
        layout: [...layout],
        createdAt: new Date()
      };
      setTemplates([...templates, newTemplate]);
      localStorage.setItem('dashboard-templates', JSON.stringify([...templates, newTemplate]));
    }
  };

  const loadTemplate = (template: LayoutTemplate) => {
    updateLayout(template.layout);
    addToHistory(`Loaded template: ${template.name}`);
    setShowTemplates(false);
  };

  // Smart suggestions (AI simulation)
  const getSuggestions = () => {
    const suggestions = [];
    const hasMetrics = layout.some(w => w.type.includes('spending') || w.type.includes('savings'));
    const hasCharts = layout.some(w => w.type.includes('chart') || w.type.includes('breakdown'));
    
    if (!hasMetrics) {
      suggestions.push('Add key metrics widgets for quick insights');
    }
    if (!hasCharts) {
      suggestions.push('Add visualization charts for better data understanding');
    }
    if (layout.length === 0) {
      suggestions.push('Start with the Executive Dashboard template');
    }
    
    return suggestions;
  };

  // View mode dimensions
  const getCanvasStyle = () => {
    const baseStyle = {
      transform: `scale(${zoom / 100})`,
      transformOrigin: 'top left',
      transition: 'transform 0.3s ease',
      width: viewMode === 'mobile' ? '375px' : viewMode === 'tablet' ? '768px' : '100%',
      minHeight: '600px',
      margin: '0 auto'
    };
    return baseStyle;
  };

  // Filtered widgets based on search
  const filteredWidgets = widgetTemplates.filter(widget => 
    widget.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    widget.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="enhanced-dashboard-builder">
        {/* Top Toolbar */}
        <div className="builder-toolbar">
          <div className="toolbar-section">
            <button onClick={undo} disabled={historyIndex <= 0} className="toolbar-btn" title="Undo (Ctrl+Z)">
              <Undo size={18} />
            </button>
            <button onClick={redo} disabled={historyIndex >= history.length - 1} className="toolbar-btn" title="Redo (Ctrl+Y)">
              <Redo size={18} />
            </button>
            <div className="toolbar-divider" />
            
            <button onClick={() => setZoom(Math.max(50, zoom - 10))} className="toolbar-btn" title="Zoom Out">
              <ZoomOut size={18} />
            </button>
            <span className="zoom-level">{zoom}%</span>
            <button onClick={() => setZoom(Math.min(200, zoom + 10))} className="toolbar-btn" title="Zoom In">
              <ZoomIn size={18} />
            </button>
            <button onClick={() => setZoom(100)} className="toolbar-btn" title="Reset Zoom">
              <Maximize2 size={18} />
            </button>
            <div className="toolbar-divider" />
            
            <button 
              onClick={() => setViewMode('desktop')} 
              className={`toolbar-btn ${viewMode === 'desktop' ? 'active' : ''}`}
              title="Desktop View"
            >
              <Monitor size={18} />
            </button>
            <button 
              onClick={() => setViewMode('tablet')} 
              className={`toolbar-btn ${viewMode === 'tablet' ? 'active' : ''}`}
              title="Tablet View"
            >
              <Tablet size={18} />
            </button>
            <button 
              onClick={() => setViewMode('mobile')} 
              className={`toolbar-btn ${viewMode === 'mobile' ? 'active' : ''}`}
              title="Mobile View"
            >
              <Smartphone size={18} />
            </button>
          </div>

          <div className="toolbar-section">
            <button 
              onClick={() => setShowGrid(!showGrid)} 
              className={`toolbar-btn ${showGrid ? 'active' : ''}`}
              title="Toggle Grid (G)"
            >
              <Grid size={18} />
            </button>
            <button 
              onClick={() => setShowAlignmentGuides(!showAlignmentGuides)} 
              className={`toolbar-btn ${showAlignmentGuides ? 'active' : ''}`}
              title="Alignment Guides"
            >
              <Move size={18} />
            </button>
            <button 
              onClick={() => setPerformanceMode(!performanceMode)} 
              className={`toolbar-btn ${performanceMode ? 'active' : ''}`}
              title="Performance Mode"
            >
              <PlayCircle size={18} />
            </button>
            <div className="toolbar-divider" />
            
            <button onClick={saveToLocalStorage} className="toolbar-btn" title="Save (Ctrl+S)">
              <Save size={18} />
            </button>
            <button onClick={exportLayout} className="toolbar-btn" title="Export Layout">
              <Download size={18} />
            </button>
            <button onClick={() => fileInputRef.current?.click()} className="toolbar-btn" title="Import Layout">
              <Upload size={18} />
            </button>
            <input 
              ref={fileInputRef}
              type="file" 
              accept=".json" 
              onChange={importLayout} 
              style={{ display: 'none' }} 
            />
            <div className="toolbar-divider" />
            
            <button onClick={() => setShowHistory(!showHistory)} className="toolbar-btn" title="History">
              <History size={18} />
            </button>
            <button onClick={() => setShowTemplates(!showTemplates)} className="toolbar-btn" title="Templates">
              <Layers size={18} />
            </button>
            <button onClick={saveAsTemplate} className="toolbar-btn" title="Save as Template">
              <Plus size={18} />
            </button>
          </div>

          <div className="toolbar-section">
            {autoSaveEnabled && (
              <span className="auto-save-indicator">
                <CheckCircle size={14} />
                Auto-saved {lastSaved.toLocaleTimeString()}
              </span>
            )}
            <button 
              onClick={() => setAutoSaveEnabled(!autoSaveEnabled)} 
              className={`toolbar-btn ${autoSaveEnabled ? 'active' : ''}`}
              title="Toggle Auto-save"
            >
              {autoSaveEnabled ? <RefreshCw size={18} /> : <PauseCircle size={18} />}
            </button>
          </div>
        </div>

        <div className="builder-main">
          {/* Left Sidebar - Widget Palette */}
          <div className="widget-palette">
            <div className="palette-header">
              <h3>Widgets</h3>
              <div className="widget-search">
                <Search size={16} />
                <input 
                  type="text" 
                  placeholder="Search widgets..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Favorites Section */}
            {favoriteWidgets.size > 0 && (
              <div className="widget-section">
                <h4>⭐ Favorites</h4>
                <div className="widget-grid">
                  {filteredWidgets
                    .filter(w => favoriteWidgets.has(w.id))
                    .map(widget => (
                      <WidgetTile 
                        key={widget.id} 
                        widget={widget}
                        isFavorite={true}
                        onToggleFavorite={() => {
                          const newFavorites = new Set(favoriteWidgets);
                          newFavorites.delete(widget.id);
                          setFavoriteWidgets(newFavorites);
                        }}
                      />
                    ))}
                </div>
              </div>
            )}

            {/* All Widgets */}
            <div className="widget-section">
              <h4>All Widgets</h4>
              <div className="widget-grid">
                {filteredWidgets
                  .filter(w => !favoriteWidgets.has(w.id))
                  .map(widget => (
                    <WidgetTile 
                      key={widget.id} 
                      widget={widget}
                      isFavorite={false}
                      onToggleFavorite={() => {
                        const newFavorites = new Set(favoriteWidgets);
                        newFavorites.add(widget.id);
                        setFavoriteWidgets(newFavorites);
                      }}
                    />
                  ))}
              </div>
            </div>

            {/* AI Suggestions */}
            <div className="suggestions-section">
              <h4>
                <Sparkles size={16} />
                Smart Suggestions
              </h4>
              {getSuggestions().map((suggestion, idx) => (
                <div key={idx} className="suggestion-item">
                  <AlertCircle size={14} />
                  {suggestion}
                </div>
              ))}
            </div>
          </div>

          {/* Canvas */}
          <div className="canvas-container">
            <div 
              ref={canvasRef}
              className={`canvas ${showGrid ? 'show-grid' : ''} ${performanceMode ? 'performance' : ''}`}
              style={getCanvasStyle()}
            >
              <DropZone
                layout={layout}
                selectedWidgets={selectedWidgets}
                lockedWidgets={lockedWidgets}
                onSelectWidget={(id: string) => {
                  if (!lockedWidgets.has(id)) {
                    setSelectedWidgets(new Set([id]));
                  }
                }}
                onMultiSelect={(id: string) => {
                  const newSelection = new Set(selectedWidgets);
                  if (newSelection.has(id)) {
                    newSelection.delete(id);
                  } else {
                    newSelection.add(id);
                  }
                  setSelectedWidgets(newSelection);
                }}
                showAlignmentGuides={showAlignmentGuides}
                hoveredWidget={hoveredWidget}
                onHoverWidget={setHoveredWidget}
              />
            </div>
          </div>

          {/* Right Sidebar - Properties/History */}
          <div className="right-sidebar">
            {showHistory && (
              <div className="history-panel">
                <h3>History</h3>
                <div className="history-list">
                  {history.map((entry, idx) => (
                    <div 
                      key={idx} 
                      className={`history-item ${idx === historyIndex ? 'current' : ''}`}
                      onClick={() => {
                        updateLayout(entry.layout);
                        setHistoryIndex(idx);
                      }}
                    >
                      <span className="history-action">{entry.action}</span>
                      <span className="history-time">
                        {entry.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {showTemplates && (
              <div className="templates-panel">
                <h3>Templates</h3>
                <div className="template-list">
                  {templates.map(template => (
                    <div 
                      key={template.id} 
                      className="template-item"
                      onClick={() => loadTemplate(template)}
                    >
                      <h4>{template.name}</h4>
                      <p>{template.description}</p>
                      <span className="template-date">
                        {template.createdAt.toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedWidgets.size > 0 && (
              <div className="properties-panel">
                <h3>Selected ({selectedWidgets.size})</h3>
                <div className="properties-actions">
                  <button onClick={duplicateSelectedWidgets} className="action-btn">
                    <Copy size={16} /> Duplicate
                  </button>
                  <button 
                    onClick={() => {
                      selectedWidgets.forEach(id => {
                        const newLocked = new Set(lockedWidgets);
                        if (newLocked.has(id)) {
                          newLocked.delete(id);
                        } else {
                          newLocked.add(id);
                        }
                        setLockedWidgets(newLocked);
                      });
                    }} 
                    className="action-btn"
                  >
                    <Lock size={16} /> Toggle Lock
                  </button>
                  <button onClick={deleteSelectedWidgets} className="action-btn danger">
                    <Trash2 size={16} /> Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Status Bar */}
        <div className="status-bar">
          <div className="status-section">
            <span>{layout.filter(w => w.visible).length} widgets</span>
            <span>{selectedWidgets.size} selected</span>
            <span>{lockedWidgets.size} locked</span>
          </div>
          <div className="status-section">
            {collaborators.length > 0 && (
              <span className="collaborators">
                <Users size={14} />
                {collaborators.length} collaborating
              </span>
            )}
          </div>
        </div>
      </div>
    </DndProvider>
  );
};

// Widget Tile Component
const WidgetTile: React.FC<{
  widget: WidgetTemplate;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}> = ({ widget, isFavorite, onToggleFavorite }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'NEW_WIDGET',
    item: { ...widget, isNew: true },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  return (
    <div 
      ref={drag as any}
      className={`widget-tile ${isDragging ? 'dragging' : ''}`}
      style={{ opacity: isDragging ? 0.5 : 1 }}
    >
      <button 
        className="favorite-btn"
        onClick={(e) => {
          e.stopPropagation();
          onToggleFavorite();
        }}
      >
        {isFavorite ? <Star size={14} fill="gold" /> : <StarOff size={14} />}
      </button>
      {widget.icon}
      <span className="widget-label">{widget.label}</span>
    </div>
  );
};

// Drop Zone Component
const DropZone: React.FC<any> = ({ 
  layout, 
  selectedWidgets, 
  lockedWidgets,
  onSelectWidget,
  onMultiSelect,
  showAlignmentGuides,
  hoveredWidget,
  onHoverWidget
}) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: ['NEW_WIDGET', 'PLACED_WIDGET'],
    drop: (item: any, monitor) => {
      // Handle drop logic
      console.log('Widget dropped:', item);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }));

  return (
    <div 
      ref={drop as any}
      className={`drop-zone ${isOver ? 'drag-over' : ''}`}
    >
      {/* Alignment guides */}
      {showAlignmentGuides && hoveredWidget && (
        <div className="alignment-guides">
          {/* Render alignment guide lines here */}
        </div>
      )}
      
      {/* Render widgets */}
      {layout.filter((w: DashboardWidget) => w.visible).map((widget: DashboardWidget) => (
        <div
          key={widget.id}
          className={`
            placed-widget 
            ${selectedWidgets.has(widget.id) ? 'selected' : ''}
            ${lockedWidgets.has(widget.id) ? 'locked' : ''}
          `}
          style={{
            gridColumn: `${widget.position.x + 1} / span ${widget.size.width}`,
            gridRow: `${widget.position.y + 1} / span ${widget.size.height}`,
          }}
          onClick={(e) => {
            if (e.ctrlKey || e.metaKey) {
              onMultiSelect(widget.id);
            } else {
              onSelectWidget(widget.id);
            }
          }}
          onMouseEnter={() => onHoverWidget(widget.id)}
          onMouseLeave={() => onHoverWidget(null)}
        >
          <div className="widget-content">
            {widget.type.replace(/-/g, ' ').toUpperCase()}
          </div>
          {lockedWidgets.has(widget.id) && (
            <Lock size={14} className="lock-indicator" />
          )}
        </div>
      ))}
    </div>
  );
};

export default EnhancedDashboardBuilder;
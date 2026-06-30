import React from 'react';

interface WidgetConfig {
  id: string;
  type: 'metric' | 'chart' | 'table' | 'text';
  title: string;
  dataSource?: string;
  config: any;
  position: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
}

interface LayoutConfig {
  cols: number;
  rowHeight: number;
}

interface DataSource {
  id: string;
  name: string;
  type: 'snowflake' | 'salesforce' | 'oracle' | 'api';
  config: any;
  status: 'connected' | 'disconnected' | 'error';
}

interface DragDropCanvasProps {
  widgets: WidgetConfig[];
  layout: LayoutConfig;
  onUpdateWidget: (widgetId: string, updates: Partial<WidgetConfig>) => void;
  onDeleteWidget: (widgetId: string) => void;
  dataSources: DataSource[];
}

const DragDropCanvas: React.FC<DragDropCanvasProps> = ({
  widgets,
  layout,
  onUpdateWidget,
  onDeleteWidget,
  dataSources
}) => {
  return (
    <div className="flex-1 bg-slate-900/50 rounded-xl border border-slate-700/50 p-6">
      {widgets.length === 0 ? (
        <div className="h-full flex items-center justify-center">
          <div className="text-center">
            <div className="w-24 h-24 bg-slate-700/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <div className="text-slate-400 text-3xl">📊</div>
            </div>
            <h3 className="text-xl font-semibold text-slate-300 mb-2">
              Start Building Your Dashboard
            </h3>
            <p className="text-slate-400 max-w-md mx-auto">
              Drag widgets from the library or click to add them to your canvas. 
              Create professional APM dashboards with live data integration.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-12 gap-4 h-full">
          {widgets.map((widget) => (
            <div
              key={widget.id}
              className={`bg-slate-800/50 rounded-lg p-4 border border-slate-600/30 hover:border-blue-500/30 transition-all col-span-${widget.position.w}`}
              style={{ minHeight: widget.position.h * layout.rowHeight }}
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-white">{widget.title}</h4>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onDeleteWidget(widget.id)}
                    className="text-slate-400 hover:text-red-400 transition-colors"
                    title="Delete widget"
                  >
                    ✕
                  </button>
                </div>
              </div>
              
              <div className="text-slate-400 text-sm mb-2">
                Type: {widget.type}
              </div>
              
              {widget.dataSource && (
                <div className="text-slate-400 text-sm mb-3">
                  Data Source: {widget.dataSource}
                </div>
              )}
              
              <div className="h-24 bg-slate-700/30 rounded flex items-center justify-center">
                <div className="text-slate-500 text-center">
                  <div className="text-2xl mb-1">
                    {widget.type === 'chart' ? '📈' : 
                     widget.type === 'metric' ? '📊' :
                     widget.type === 'table' ? '📋' : '📝'}
                  </div>
                  <div className="text-xs">
                    {widget.type} widget
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DragDropCanvas;
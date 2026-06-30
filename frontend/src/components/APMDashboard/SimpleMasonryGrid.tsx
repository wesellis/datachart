import React, { useMemo, CSSProperties } from 'react';
import { getGridStyle, WIDGET_SIZES, WidgetSize } from '../../utils/gridHelpers';

interface Widget {
  id: string;
  type: WidgetSize;
  content: React.ReactNode;
  priority?: number;
}

interface SimpleMasonryGridProps {
  widgets: Widget[];
  gap?: number;
  debug?: boolean;
}

// Calculate layout positions
const calculateLayout = (widgets: Widget[], columns: number) => {
  const layout = new Map<string, { x: number; y: number; width: number; height: number }>();
  const heights = new Array(columns).fill(0);
  
  // Sort by priority and size
  const sorted = [...widgets].sort((a, b) => {
    if (a.priority && b.priority) return b.priority - a.priority;
    const aSize = WIDGET_SIZES[a.type];
    const bSize = WIDGET_SIZES[b.type];
    return bSize.width - aSize.width;
  });
  
  sorted.forEach(widget => {
    const size = WIDGET_SIZES[widget.type];
    const width = Math.min(size.width, columns);
    const height = typeof size.height === 'number' ? size.height : 4;
    
    // Find best position
    let bestX = 0;
    let bestY = Math.min(...heights);
    
    if (width === columns) {
      // Full width widget
      bestX = 0;
      bestY = Math.max(...heights);
      for (let i = 0; i < columns; i++) {
        heights[i] = bestY + height;
      }
    } else {
      // Find lowest position that fits
      let minHeight = Infinity;
      for (let x = 0; x <= columns - width; x++) {
        let maxHeight = 0;
        for (let i = x; i < x + width; i++) {
          maxHeight = Math.max(maxHeight, heights[i]);
        }
        if (maxHeight < minHeight) {
          minHeight = maxHeight;
          bestX = x;
          bestY = maxHeight;
        }
      }
      for (let i = bestX; i < bestX + width; i++) {
        heights[i] = bestY + height;
      }
    }
    
    layout.set(widget.id, { x: bestX, y: bestY, width, height });
  });
  
  return { layout, totalHeight: Math.max(...heights) };
};

export const SimpleMasonryGrid: React.FC<SimpleMasonryGridProps> = ({
  widgets,
  gap = 16,
  debug = false
}) => {
  // Responsive columns
  const columns = useMemo(() => {
    if (typeof window === 'undefined') return 12;
    const width = window.innerWidth;
    if (width < 640) return 3;
    if (width < 1024) return 6;
    return 12;
  }, []);
  
  const { layout, totalHeight } = useMemo(
    () => calculateLayout(widgets, columns),
    [widgets, columns]
  );
  
  const gridStyle: CSSProperties = {
    position: 'relative',
    width: '100%',
    height: `${totalHeight * 100 + (totalHeight - 1) * gap}px`,
    display: 'grid',
    gridTemplateColumns: `repeat(${columns}, 1fr)`,
    gap: `${gap}px`
  };
  
  return (
    <div 
      className={`masonry-grid ${debug ? 'masonry-debug' : ''}`}
      style={gridStyle}
    >
      {widgets.map(widget => {
        const pos = layout.get(widget.id);
        if (!pos) return null;
        
        const style: CSSProperties = {
          gridColumn: `span ${pos.width}`,
          gridRow: `span ${pos.height}`,
          minHeight: `${pos.height * 100}px`
        };
        
        return (
          <div
            key={widget.id}
            className="masonry-widget"
            style={style}
            data-type={widget.type}
          >
            {widget.content}
          </div>
        );
      })}
    </div>
  );
};

export default SimpleMasonryGrid;
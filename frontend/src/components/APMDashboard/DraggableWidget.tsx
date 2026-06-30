import React, { useState } from 'react';
import { useDrag } from 'react-dnd';
import { Move, Settings, X, Copy, Lock, Unlock } from 'lucide-react';
import { DashboardWidget } from '../../contexts/APMDashboardContext';

interface DraggableWidgetProps {
  widget: DashboardWidget;
  onRemove: (id: string) => void;
  onConfigure: (widget: DashboardWidget) => void;
  onDuplicate?: (widget: DashboardWidget) => void;
  isLocked?: boolean;
  onToggleLock?: (id: string) => void;
}

const DraggableWidget: React.FC<DraggableWidgetProps> = ({
  widget,
  onRemove,
  onConfigure,
  onDuplicate,
  isLocked = false,
  onToggleLock
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showActions, setShowActions] = useState(false);

  // Make the widget draggable for repositioning
  const [{ isDragging }, drag, preview] = useDrag(() => ({
    type: 'PLACED_WIDGET',
    item: { 
      id: widget.id,
      type: widget.type,
      size: widget.size,
      currentPosition: widget.position
    },
    canDrag: !isLocked,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }), [widget, isLocked]);

  const getWidgetColor = () => {
    if (widget.type === 'total-savings') {
      return {
        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        color: 'white',
        border: 'none'
      };
    }
    return {
      background: 'white',
      color: '#1e293b',
      border: '1px solid #e2e8f0'
    };
  };

  const styles = getWidgetColor();

  return (
    <div
      ref={preview as any}
      style={{
        gridColumn: `${widget.position.x + 1} / span ${widget.size.width}`,
        gridRow: `${widget.position.y + 1} / span ${widget.size.height}`,
        ...styles,
        borderRadius: '8px',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: isDragging ? '0 8px 24px rgba(0, 0, 0, 0.2)' : '0 1px 3px rgba(0, 0, 0, 0.1)',
        opacity: isDragging ? 0.5 : 1,
        cursor: isLocked ? 'default' : 'move',
        position: 'relative',
        transition: 'all 0.2s ease',
        transform: isHovered && !isLocked ? 'translateY(-2px)' : 'none',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setShowActions(false);
      }}
    >
      {/* Drag Handle - Make entire widget draggable when not locked */}
      {!isLocked && (
        <div 
          ref={drag as any}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            cursor: 'move',
            zIndex: 1,
          }}
          title="Drag to move widget"
        />
      )}
      
      {/* Visual drag indicator */}
      {!isLocked && (
        <div 
          style={{
            position: 'absolute',
            top: '8px',
            left: '8px',
            cursor: 'move',
            color: styles.color === 'white' ? 'rgba(255,255,255,0.8)' : '#94a3b8',
            opacity: isHovered ? 1 : 0.3,
            transition: 'opacity 0.2s',
            pointerEvents: 'none',
            zIndex: 2,
            background: styles.color === 'white' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)',
            borderRadius: '4px',
            padding: '2px',
          }}
        >
          <Move size={16} />
        </div>
      )}

      {/* Action Buttons */}
      <div style={{
        position: 'absolute',
        top: '8px',
        right: '8px',
        display: 'flex',
        gap: '4px',
        opacity: isHovered ? 1 : 0,
        transition: 'opacity 0.2s',
        zIndex: 10,
        flexWrap: 'wrap',
        maxWidth: '120px',
        justifyContent: 'flex-end',
      }}>
        {/* Lock/Unlock Button */}
        {onToggleLock && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleLock(widget.id);
            }}
            style={{
              background: isLocked ? 'rgba(251, 191, 36, 0.9)' : 'rgba(156, 163, 175, 0.9)',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              padding: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title={isLocked ? 'Unlock widget' : 'Lock widget position'}
          >
            {isLocked ? <Lock size={14} /> : <Unlock size={14} />}
          </button>
        )}

        {/* Duplicate Button */}
        {onDuplicate && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate(widget);
            }}
            style={{
              background: 'rgba(59, 130, 246, 0.9)',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              padding: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Duplicate widget"
          >
            <Copy size={14} />
          </button>
        )}

        {/* Configure Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onConfigure(widget);
          }}
          style={{
            background: 'rgba(99, 102, 241, 0.9)',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            padding: '4px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title="Configure widget"
        >
          <Settings size={14} />
        </button>

        {/* Remove Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(widget.id);
          }}
          style={{
            background: 'rgba(239, 68, 68, 0.9)',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            padding: '4px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title="Remove widget"
        >
          <X size={14} />
        </button>
      </div>

      {/* Widget Content */}
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
      }}>
        <h4 style={{ 
          fontSize: '14px', 
          fontWeight: 600, 
          marginBottom: '8px',
          textAlign: 'center',
          opacity: styles.color === 'white' ? 1 : 0.9,
        }}>
          {widget.type.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
        </h4>
        
        <div style={{ 
          fontSize: '11px', 
          opacity: 0.7, 
          marginBottom: '4px',
          textAlign: 'center',
        }}>
          Position: ({widget.position.x}, {widget.position.y})
        </div>
        
        <div style={{ 
          fontSize: '11px', 
          opacity: 0.7,
          textAlign: 'center',
        }}>
          Size: {widget.size.width}×{widget.size.height}
        </div>

        {isLocked && (
          <div style={{
            marginTop: '8px',
            padding: '2px 6px',
            background: 'rgba(251, 191, 36, 0.2)',
            borderRadius: '4px',
            fontSize: '10px',
            color: styles.color === 'white' ? 'white' : '#f59e0b',
          }}>
            🔒 Locked
          </div>
        )}
      </div>
    </div>
  );
};

export default DraggableWidget;
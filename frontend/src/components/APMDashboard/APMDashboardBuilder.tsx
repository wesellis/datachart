import React, { useState } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { useAPMDashboard, DashboardWidget } from '../../contexts/APMDashboardContext';
import DraggableWidget from './DraggableWidget';
import { 
  PieChart, 
  LineChart, 
  DollarSign,
  Users,
  TrendingUp,
  Package,
  Shield,
  Clock,
  AlertTriangle,
  Building,
  Activity,
  Gauge,
  Eye,
  Grid3x3,
  Lightbulb,
  Wifi,
  Filter,
  Download,
  FileText,
  Bell,
  Presentation,
  Calculator,
  Link2,
  Target,
  EyeOff,
  Scissors,
  Copy,
  FileCheck,
  ClipboardCheck,
  Lock,
  Award,
  GitMerge,
  Map,
  Layers,
  Cloud,
  Calendar,
  BarChart2,
  Heart,
  Smile
} from 'lucide-react';

// APM-specific widget types
export interface APMWidget {
  id: string;
  type: string;
  title: string;
  description: string;
  config: any;
  position: { x: number; y: number };
  size: { width: number; height: number };
}

// APM-specific widget templates matching the front dashboard
const APM_WIDGET_TEMPLATES = [
  // Executive & Status Widgets
  { 
    type: 'executive-insights', 
    icon: Lightbulb, 
    label: 'Executive Insights', 
    description: 'AI-powered insights',
    defaultSize: { width: 12, height: 1 },
    category: 'executive',
    highlight: true
  },
  { 
    type: 'realtime-status', 
    icon: Wifi, 
    label: 'Real-Time Status', 
    description: 'Connection & refresh status',
    defaultSize: { width: 4, height: 1 },
    category: 'executive'
  },
  { 
    type: 'quick-filters', 
    icon: Filter, 
    label: 'Quick Filters', 
    description: 'Department & vendor filters',
    defaultSize: { width: 4, height: 1 },
    category: 'executive'
  },
  { 
    type: 'export-actions', 
    icon: Download, 
    label: 'Export Actions', 
    description: 'PDF & data export',
    defaultSize: { width: 4, height: 1 },
    category: 'executive'
  },
  {
    type: 'executive-briefing',
    icon: FileText,
    label: 'Executive Briefing',
    description: 'Morning brief with insights',
    defaultSize: { width: 6, height: 3 },
    category: 'executive',
    highlight: true
  },
  {
    type: 'smart-notifications',
    icon: Bell,
    label: 'Smart Notifications',
    description: 'Prioritized alerts & actions',
    defaultSize: { width: 4, height: 3 },
    category: 'executive'
  },
  {
    type: 'meeting-presentation',
    icon: Presentation,
    label: 'Meeting Presentation',
    description: 'Ready-to-present slides',
    defaultSize: { width: 8, height: 4 },
    category: 'executive'
  },
  {
    type: 'roi-tracker',
    icon: Calculator,
    label: 'ROI Tracker',
    description: 'Track return on investment',
    defaultSize: { width: 4, height: 3 },
    category: 'executive',
    highlight: true
  },
  {
    type: 'integration-hub',
    icon: Link2,
    label: 'Integration Hub',
    description: 'Connect to external systems',
    defaultSize: { width: 6, height: 3 },
    category: 'executive',
    highlight: true
  },
  // Original Metrics
  { 
    type: 'total-applications', 
    icon: Package, 
    label: 'Total Applications', 
    description: 'Active application count',
    defaultSize: { width: 3, height: 1 },
    category: 'metrics'
  },
  { 
    type: 'spending-2024', 
    icon: DollarSign, 
    label: 'Spending 2024', 
    description: 'Previous year spending',
    defaultSize: { width: 3, height: 1 },
    category: 'metrics'
  },
  { 
    type: 'spending-2025', 
    icon: DollarSign, 
    label: 'Spending 2025', 
    description: 'Current year spending',
    defaultSize: { width: 3, height: 1 },
    category: 'metrics'
  },
  { 
    type: 'total-savings', 
    icon: TrendingUp, 
    label: 'Total Savings', 
    description: 'Year over year savings',
    defaultSize: { width: 3, height: 1 },
    category: 'metrics',
    highlight: true
  },
  { 
    type: 'cost-per-employee', 
    icon: Users, 
    label: 'Cost per Employee', 
    description: 'Efficiency metric',
    defaultSize: { width: 3, height: 1 },
    category: 'metrics'
  },
  { 
    type: 'patch-compliance', 
    icon: Shield, 
    label: 'Patch Compliance', 
    description: 'Security compliance rate',
    defaultSize: { width: 3, height: 1 },
    category: 'metrics'
  },
  { 
    type: 'renewal-30', 
    icon: Clock, 
    label: '30-Day Renewals', 
    description: 'Renewals next 30 days',
    defaultSize: { width: 3, height: 1 },
    category: 'metrics'
  },
  { 
    type: 'license-utilization', 
    icon: Activity, 
    label: 'License Utilization', 
    description: 'License usage metrics',
    defaultSize: { width: 3, height: 1 },
    category: 'metrics'
  },
  { 
    type: 'renewal-timeline', 
    icon: Clock, 
    label: 'Renewal Timeline', 
    description: '30/60/90 day renewals',
    defaultSize: { width: 6, height: 3 },
    category: 'timeline'
  },
  { 
    type: 'spending-trend', 
    icon: LineChart, 
    label: 'Monthly Spending Trend', 
    description: '12-month comparison chart',
    defaultSize: { width: 8, height: 4 },
    category: 'charts'
  },
  { 
    type: 'vendor-breakdown', 
    icon: PieChart, 
    label: 'Vendor Breakdown', 
    description: 'Spending by vendor',
    defaultSize: { width: 4, height: 4 },
    category: 'charts'
  },
  { 
    type: 'compliance-gauge', 
    icon: Gauge, 
    label: 'Compliance Gauge', 
    description: 'Overall compliance score',
    defaultSize: { width: 6, height: 4 },
    category: 'gauges'
  },
  { 
    type: 'risk-matrix', 
    icon: AlertTriangle, 
    label: 'Risk Assessment', 
    description: 'High/Medium/Low risk apps',
    defaultSize: { width: 6, height: 3 },
    category: 'analysis'
  },
  { 
    type: 'department-breakdown', 
    icon: Building, 
    label: 'Department Costs', 
    description: 'Spending by department',
    defaultSize: { width: 4, height: 3 },
    category: 'charts'
  },
  { 
    type: 'application-grid', 
    icon: Grid3x3, 
    label: 'Application Grid', 
    description: 'Top apps by spend',
    defaultSize: { width: 12, height: 4 },
    category: 'grids'
  },
  // Cost Optimization Modules
  {
    type: 'contract-negotiation',
    icon: Target,
    label: 'Contract Negotiation',
    description: 'Vendor leverage & strategies',
    defaultSize: { width: 6, height: 4 },
    category: 'optimization',
    highlight: true
  },
  {
    type: 'shadow-it-detector',
    icon: EyeOff,
    label: 'Shadow IT Detector',
    description: 'Unauthorized app detection',
    defaultSize: { width: 6, height: 4 },
    category: 'optimization',
    highlight: true
  },
  {
    type: 'license-harvesting',
    icon: Scissors,
    label: 'License Harvesting',
    description: 'Reclaim unused licenses',
    defaultSize: { width: 4, height: 3 },
    category: 'optimization'
  },
  {
    type: 'duplicate-app-finder',
    icon: Copy,
    label: 'Duplicate App Finder',
    description: 'Find redundant applications',
    defaultSize: { width: 4, height: 3 },
    category: 'optimization'
  },
  {
    type: 'true-up-predictor',
    icon: Calculator,
    label: 'True-Up Predictor',
    description: 'Forecast license reconciliation',
    defaultSize: { width: 4, height: 3 },
    category: 'optimization'
  },
  // Risk & Compliance Modules
  {
    type: 'vendor-risk-scorecard',
    icon: Shield,
    label: 'Vendor Risk Scorecard',
    description: 'Vendor security ratings',
    defaultSize: { width: 6, height: 4 },
    category: 'compliance',
    highlight: true
  },
  {
    type: 'gdpr-tracker',
    icon: FileCheck,
    label: 'GDPR Compliance',
    description: 'Data privacy tracking',
    defaultSize: { width: 4, height: 3 },
    category: 'compliance'
  },
  {
    type: 'audit-readiness',
    icon: ClipboardCheck,
    label: 'Audit Readiness',
    description: 'Compliance audit status',
    defaultSize: { width: 4, height: 3 },
    category: 'compliance'
  },
  {
    type: 'api-security-monitor',
    icon: Lock,
    label: 'API Security Monitor',
    description: 'Monitor API vulnerabilities',
    defaultSize: { width: 4, height: 3 },
    category: 'compliance'
  },
  {
    type: 'certification-tracker',
    icon: Award,
    label: 'Certification Tracker',
    description: 'Track compliance certs',
    defaultSize: { width: 4, height: 3 },
    category: 'compliance'
  },
  // Strategic Planning Modules
  {
    type: 'ma-impact-analyzer',
    icon: GitMerge,
    label: 'M&A Impact Analyzer',
    description: 'Merger app consolidation',
    defaultSize: { width: 6, height: 4 },
    category: 'planning',
    highlight: true
  },
  {
    type: 'budget-scenario-planner',
    icon: Calculator,
    label: 'Budget Scenario Planner',
    description: 'What-if budget analysis',
    defaultSize: { width: 6, height: 4 },
    category: 'planning'
  },
  {
    type: 'technology-roadmap',
    icon: Map,
    label: 'Technology Roadmap',
    description: 'Strategic tech planning',
    defaultSize: { width: 8, height: 4 },
    category: 'planning'
  },
  {
    type: 'vendor-consolidation',
    icon: Layers,
    label: 'Vendor Consolidation',
    description: 'Optimize vendor portfolio',
    defaultSize: { width: 4, height: 3 },
    category: 'planning'
  },
  {
    type: 'cloud-migration-tracker',
    icon: Cloud,
    label: 'Cloud Migration',
    description: 'Track cloud transitions',
    defaultSize: { width: 4, height: 3 },
    category: 'planning'
  },
  // Operational Excellence Modules
  {
    type: 'auto-renewal-calendar',
    icon: Calendar,
    label: 'Auto-Renewal Calendar',
    description: 'Automated renewal tracking',
    defaultSize: { width: 6, height: 3 },
    category: 'operations',
    highlight: true
  },
  {
    type: 'benchmark-comparator',
    icon: BarChart2,
    label: 'Industry Benchmarks',
    description: 'Compare to industry standards',
    defaultSize: { width: 4, height: 3 },
    category: 'operations'
  },
  {
    type: 'app-health-score',
    icon: Heart,
    label: 'App Health Score',
    description: 'Application performance',
    defaultSize: { width: 4, height: 3 },
    category: 'operations'
  },
  {
    type: 'user-sentiment',
    icon: Smile,
    label: 'User Sentiment',
    description: 'User satisfaction tracking',
    defaultSize: { width: 4, height: 3 },
    category: 'operations'
  },
  {
    type: 'sla-performance',
    icon: Target,
    label: 'SLA Performance',
    description: 'Service level tracking',
    defaultSize: { width: 4, height: 3 },
    category: 'operations'
  }
];

// Group widgets by category
const WIDGET_CATEGORIES = {
  executive: 'Executive Tools',
  metrics: 'Key Metrics',
  charts: 'Charts & Graphs',
  timeline: 'Timelines',
  gauges: 'Gauges',
  analysis: 'Analysis',
  grids: 'Data Grids',
  optimization: 'Cost Optimization',
  compliance: 'Risk & Compliance',
  planning: 'Strategic Planning',
  operations: 'Operational Excellence'
};

// Draggable widget from palette
const PaletteWidget: React.FC<{ template: any }> = ({ template }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'apm-widget',
    item: { 
      type: template.type,
      defaultSize: template.defaultSize,
      isNew: true 
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }), [template]);

  const Icon = template.icon;

  return (
    <div
      ref={drag as any}
      className={`apm-palette-widget ${isDragging ? 'dragging' : ''} ${template.highlight ? 'highlight' : ''}`}
      style={{
        opacity: isDragging ? 0.5 : 1,
        cursor: 'move',
        padding: '12px',
        margin: '8px',
        background: template.highlight ? 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)' : 'white',
        color: template.highlight ? 'white' : '#1e293b',
        border: template.highlight ? 'none' : '2px solid #e2e8f0',
        borderRadius: '8px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        transition: 'all 0.2s ease',
      }}
    >
      <Icon size={24} />
      <span style={{ fontSize: '12px', fontWeight: 500, textAlign: 'center' }}>{template.label}</span>
      <span style={{ fontSize: '10px', opacity: 0.8, textAlign: 'center' }}>{template.description}</span>
    </div>
  );
};

// Main APM Dashboard Builder Component
const APMDashboardBuilder: React.FC<{ onSave?: () => void; onCancel?: () => void }> = ({ onSave, onCancel }) => {
  const { layout, addWidget, removeWidget, moveWidget, resizeWidget, resetLayout, updateLayout } = useAPMDashboard();
  const [previewMode, setPreviewMode] = useState(false);
  const [configWidget, setConfigWidget] = useState<DashboardWidget | null>(null);
  const [lockedWidgets, setLockedWidgets] = useState<Set<string>>(new Set());
  const [history, setHistory] = useState<any[]>([]);
  
  // Add to history function
  const addToHistory = (action: string) => {
    setHistory(prev => [...prev, { action, timestamp: new Date(), layout: [...layout] }]);
  };

  // Drop zone for the entire canvas - handles both new widgets and repositioning
  const [{ isOver }, drop] = useDrop(() => ({
    accept: ['apm-widget', 'PLACED_WIDGET'],
    drop: (item: any, monitor) => {
      console.log('=== DROP ATTEMPT ===');
      console.log('Item:', item);
      console.log('Current layout:', layout);
      
      const offset = monitor.getClientOffset();
      const dropTargetBounds = document.getElementById('grid-canvas')?.getBoundingClientRect();
      
      console.log('Mouse offset:', offset);
      console.log('Canvas bounds:', dropTargetBounds);
      
      if (!offset || !dropTargetBounds) {
        console.log('ERROR: No offset or bounds');
        return;
      }
      
      // Handle repositioning of existing widgets
      if (item.id && !item.isNew) {
        console.log('Repositioning existing widget:', item.id);
        const relativeX = offset.x - dropTargetBounds.left - 24; // Account for padding
        const relativeY = offset.y - dropTargetBounds.top - 24;
        
        const cellWidth = (dropTargetBounds.width - 48) / 12; // Account for padding
        const cellHeight = (dropTargetBounds.height - 48) / 14;
        
        const gridX = Math.floor(relativeX / cellWidth);
        const gridY = Math.floor(relativeY / cellHeight);
        
        // Check if new position is valid
        const newX = Math.max(0, Math.min(12 - item.size.width, gridX));
        const newY = Math.max(0, Math.min(14 - item.size.height, gridY));
        
        // Don't move if position hasn't changed
        if (item.currentPosition && item.currentPosition.x === newX && item.currentPosition.y === newY) {
          console.log('Position unchanged');
          return;
        }
        
        // Check for overlaps (excluding the widget being moved)
        const overlaps = layout.some(w => {
          if (w.id === item.id || !w.visible) return false;
          return newX < w.position.x + w.size.width &&
                 newX + item.size.width > w.position.x &&
                 newY < w.position.y + w.size.height &&
                 newY + item.size.height > w.position.y;
        });
        
        if (!overlaps) {
          moveWidget(item.id, { x: newX, y: newY });
          console.log(`Moved widget ${item.id} to (${newX}, ${newY})`);
          addToHistory(`Moved widget to (${newX}, ${newY})`);
        } else {
          console.log('Position occupied by another widget');
        }
        return;
      }
      
      // Handle new widgets
      if (!item.isNew) {
        console.log('ERROR: Item is not new and has no ID');
        return;
      }
      
      // Calculate the actual content area (excluding padding)
      const contentWidth = dropTargetBounds.width - 48; // 24px padding on each side
      const contentHeight = dropTargetBounds.height - 48;
      const cellWidth = contentWidth / 12;
      const cellHeight = contentHeight / 14;
      
      // Calculate grid position from mouse position
      const relativeX = offset.x - dropTargetBounds.left - 24;
      const relativeY = offset.y - dropTargetBounds.top - 24;
      
      const rawGridX = relativeX / cellWidth;
      const rawGridY = relativeY / cellHeight;
      
      const gridX = Math.max(0, Math.min(Math.floor(rawGridX), 12 - item.defaultSize.width));
      const gridY = Math.max(0, Math.min(Math.floor(rawGridY), 14 - item.defaultSize.height));
      
      console.log('Calculated position:', { rawGridX, rawGridY, gridX, gridY });
      console.log('Widget size:', item.defaultSize);
        
        // Check if position is available
        const overlaps = layout.some(w => {
          const overlap = w.visible && 
            gridX < w.position.x + w.size.width &&
            gridX + item.defaultSize.width > w.position.x &&
            gridY < w.position.y + w.size.height &&
            gridY + item.defaultSize.height > w.position.y;
          
          if (overlap) {
            console.log(`Overlap detected with widget ${w.id} at (${w.position.x}, ${w.position.y})`);
          }
          return overlap;
        });
        
        console.log('Overlaps:', overlaps);
        
        if (!overlaps) {
          const newWidget: DashboardWidget = {
            id: `widget-${Date.now()}`,
            type: item.type,
            position: { x: gridX, y: gridY },
            size: item.defaultSize,
            visible: true,
          };
          console.log('ADDING WIDGET:', newWidget);
          addWidget(newWidget);
          return { added: true };
        } else {
          console.log('Position occupied, searching for alternative...');
          // Try to find an empty spot near the drop location
          for (let radius = 1; radius < 8; radius++) {
            for (let dy = -radius; dy <= radius; dy++) {
              for (let dx = -radius; dx <= radius; dx++) {
                const testX = gridX + dx;
                const testY = gridY + dy;
                
                if (testX >= 0 && testX <= 12 - item.defaultSize.width &&
                    testY >= 0 && testY <= 14 - item.defaultSize.height) {
                  
                  const testOverlap = layout.some(w => {
                    return w.visible && 
                      testX < w.position.x + w.size.width &&
                      testX + item.defaultSize.width > w.position.x &&
                      testY < w.position.y + w.size.height &&
                      testY + item.defaultSize.height > w.position.y;
                  });
                  
                  if (!testOverlap) {
                    console.log(`Found empty spot at (${testX}, ${testY})`);
                    const newWidget: DashboardWidget = {
                      id: `widget-${Date.now()}`,
                      type: item.type,
                      position: { x: testX, y: testY },
                      size: item.defaultSize,
                      visible: true,
                    };
                    console.log('ADDING WIDGET AT ALTERNATIVE POSITION:', newWidget);
                    addWidget(newWidget);
                    return { added: true };
                  }
                }
              }
            }
          }
          console.log('ERROR: No empty space found anywhere!');
        }
      
      console.log('=== DROP FAILED ===');
      return undefined;
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }), [layout, addWidget, moveWidget, addToHistory]);

  // Load preset layouts
  const loadPreset = (preset: string) => {
    resetLayout(); // This loads the default layout from context
    console.log(`Loading ${preset} preset with default APM layout`);
  };

  // Duplicate a widget
  const duplicateWidget = (widget: DashboardWidget) => {
    // Find an empty spot near the original
    for (let dx = 1; dx < 5; dx++) {
      const newX = Math.min(12 - widget.size.width, widget.position.x + dx);
      const overlaps = layout.some(w => 
        w.visible && 
        newX < w.position.x + w.size.width &&
        newX + widget.size.width > w.position.x &&
        widget.position.y < w.position.y + w.size.height &&
        widget.position.y + widget.size.height > w.position.y
      );
      
      if (!overlaps && newX >= 0) {
        const newWidget: DashboardWidget = {
          id: `widget-${Date.now()}`,
          type: widget.type,
          position: { x: newX, y: widget.position.y },
          size: { ...widget.size },
          visible: true,
        };
        addWidget(newWidget);
        break;
      }
    }
  };

  // Toggle widget lock state
  const toggleWidgetLock = (widgetId: string) => {
    setLockedWidgets(prev => {
      const newSet = new Set(prev);
      if (newSet.has(widgetId)) {
        newSet.delete(widgetId);
      } else {
        newSet.add(widgetId);
      }
      return newSet;
    });
  };

  return (
    <div style={{ display: 'flex', gap: '24px', height: '100%' }}>
      {/* Widget Palette */}
      <div style={{ 
        width: '280px', 
        background: '#f8fafc', 
        borderRadius: '12px', 
        padding: '20px',
        overflowY: 'auto',
        maxHeight: '700px'
      }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', color: '#1e293b' }}>
          APM Widgets
        </h3>
        
        {Object.entries(WIDGET_CATEGORIES).map(([key, label]) => (
          <div key={key} style={{ marginBottom: '24px' }}>
            <h4 style={{ 
              fontSize: '12px', 
              fontWeight: 600, 
              textTransform: 'uppercase', 
              color: '#64748b',
              marginBottom: '8px',
              letterSpacing: '0.5px'
            }}>
              {label}
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '4px' }}>
              {APM_WIDGET_TEMPLATES
                .filter(template => template.category === key)
                .map((template, index) => (
                  <PaletteWidget key={index} template={template} />
                ))}
            </div>
          </div>
        ))}
      </div>

      {/* Canvas Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Canvas Controls */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          padding: '16px',
          background: 'white',
          borderRadius: '8px',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => loadPreset('executive')}
              style={{
                padding: '8px 16px',
                background: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              Executive View
            </button>
            <button
              onClick={() => loadPreset('operations')}
              style={{
                padding: '8px 16px',
                background: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              Operations Focus
            </button>
            <button
              onClick={() => loadPreset('compliance')}
              style={{
                padding: '8px 16px',
                background: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              Compliance View
            </button>
            <button
              onClick={() => loadPreset('cost')}
              style={{
                padding: '8px 16px',
                background: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              Cost Analysis
            </button>
          </div>
          
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setPreviewMode(!previewMode)}
              style={{
                padding: '8px 16px',
                background: previewMode ? '#2563eb' : 'white',
                color: previewMode ? 'white' : '#1e293b',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Eye size={16} />
              Preview
            </button>
          </div>
        </div>

        {/* Drop Zone Canvas */}
        <div
          id="grid-canvas"
          ref={drop as any}
          style={{
            flex: 1,
            background: isOver ? 
              `linear-gradient(rgba(59, 130, 246, 0.05), rgba(59, 130, 246, 0.05)),
               repeating-linear-gradient(0deg, transparent, transparent calc(100% / 8 - 1px), #e2e8f0 calc(100% / 8 - 1px), #e2e8f0 calc(100% / 8)),
               repeating-linear-gradient(90deg, transparent, transparent calc(100% / 12 - 1px), #e2e8f0 calc(100% / 12 - 1px), #e2e8f0 calc(100% / 12))` :
              `repeating-linear-gradient(0deg, transparent, transparent calc(100% / 8 - 1px), #e2e8f0 calc(100% / 8 - 1px), #e2e8f0 calc(100% / 8)),
               repeating-linear-gradient(90deg, transparent, transparent calc(100% / 12 - 1px), #e2e8f0 calc(100% / 12 - 1px), #e2e8f0 calc(100% / 12))`,
            backgroundColor: 'white',
            border: '2px dashed #cbd5e1',
            borderRadius: '12px',
            padding: '24px',
            position: 'relative',
            display: 'grid',
            gridTemplateColumns: 'repeat(12, 1fr)',
            gridTemplateRows: 'repeat(14, 100px)',
            gap: '8px',
            transition: 'background-color 0.2s ease',
          }}
        >
          {layout.filter(w => w.visible).length === 0 ? (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              color: '#94a3b8',
            }}>
              <Package size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
              <h3 style={{ fontSize: '18px', fontWeight: 500, marginBottom: '8px' }}>
                Start Building Your APM Dashboard
              </h3>
              <p style={{ fontSize: '14px' }}>
                Drag widgets from the palette to get started
              </p>
            </div>
          ) : (
            layout.filter(w => w.visible).map((widget) => (
              <DraggableWidget
                key={widget.id}
                widget={widget}
                onRemove={removeWidget}
                onConfigure={(w) => setConfigWidget(w)}
                onDuplicate={duplicateWidget}
                isLocked={lockedWidgets.has(widget.id)}
                onToggleLock={toggleWidgetLock}
              />
            ))
          )}
        </div>
      </div>
      
      {/* Configuration Modal */}
      {configWidget && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            width: '500px',
            maxHeight: '80vh',
            overflow: 'auto',
          }}>
            <h2 style={{ marginBottom: '16px' }}>Configure: {configWidget.type.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</h2>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                Data Source Table
              </label>
              <select 
                defaultValue={
                  configWidget.type.includes('spending') ? 'spending' :
                  configWidget.type.includes('compliance') || configWidget.type.includes('patch') ? 'compliance' :
                  configWidget.type.includes('renewal') ? 'renewals' :
                  configWidget.type.includes('vendor') ? 'vendors' :
                  'applications'
                }
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                }}>
                <option value="applications">APM.APPLICATIONS</option>
                <option value="spending">FINANCE.SPENDING</option>
                <option value="compliance">SECURITY.COMPLIANCE</option>
                <option value="renewals">CONTRACTS.RENEWALS</option>
                <option value="vendors">PROCUREMENT.VENDORS</option>
              </select>
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                Current Widget Type
              </label>
              <div style={{
                padding: '8px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                fontSize: '14px',
                color: '#475569',
              }}>
                {configWidget.type}
              </div>
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                Data Fields Used
              </label>
              <div style={{
                padding: '8px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                fontSize: '13px',
                color: '#64748b',
              }}>
                {configWidget.type === 'total-applications' && 'COUNT(*), active_status, application_name'}
                {configWidget.type === 'spending-2024' && 'SUM(spend_amount) WHERE year=2024'}
                {configWidget.type === 'spending-2025' && 'SUM(spend_amount) WHERE year=2025'}
                {configWidget.type === 'total-savings' && 'spend_2024 - spend_2025, savings_percentage'}
                {configWidget.type === 'cost-per-employee' && 'total_spend / employee_count'}
                {configWidget.type === 'patch-compliance' && 'compliance_rate, patched_count, total_apps'}
                {configWidget.type === 'renewal-30' && 'COUNT(*) WHERE days_until_renewal <= 30'}
                {configWidget.type === 'license-utilization' && 'used_licenses / total_licenses * 100'}
                {configWidget.type === 'spending-trend' && 'month, spend_2024, spend_2025'}
                {configWidget.type === 'vendor-breakdown' && 'vendor_name, SUM(spend) GROUP BY vendor'}
                {configWidget.type === 'compliance-gauge' && 'compliance_score, risk_level'}
                {configWidget.type === 'renewal-timeline' && 'app_name, renewal_date, renewal_cost'}
                {configWidget.type === 'application-grid' && 'app_name, vendor, spend, owner, status'}
              </div>
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                Refresh Rate (seconds)
              </label>
              <input 
                type="number" 
                defaultValue="30"
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                }}
              />
            </div>
            
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setConfigWidget(null)}
                style={{
                  padding: '8px 16px',
                  background: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // Save config here
                  setConfigWidget(null);
                }}
                style={{
                  padding: '8px 16px',
                  background: '#2563eb',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default APMDashboardBuilder;
// Grid helper utilities to fix dynamic class issues

export const getGridColumns = (width: number): string => {
  // Pre-defined Tailwind classes that are included in build
  const columnClasses: Record<number, string> = {
    1: 'col-span-1',
    2: 'col-span-2', 
    3: 'col-span-3',
    4: 'col-span-4',
    5: 'col-span-5',
    6: 'col-span-6',
    7: 'col-span-7',
    8: 'col-span-8',
    9: 'col-span-9',
    10: 'col-span-10',
    11: 'col-span-11',
    12: 'col-span-12'
  };
  
  return columnClasses[width] || 'col-span-12';
};

export const getGridStyle = (width: number): React.CSSProperties => {
  // Fallback to inline styles if classes don't work
  return {
    gridColumn: `span ${width} / span ${width}`
  };
};

// Widget size definitions  
export const WIDGET_SIZES = {
  'kpi': { width: 3, height: 1 },
  'metric': { width: 3, height: 2 },
  'chart-small': { width: 6, height: 2 },
  'chart-medium': { width: 6, height: 3 },
  'chart-large': { width: 9, height: 3 },
  'executive': { width: 12, height: 4 },
  'app-grid': { width: 12, height: 'auto' },
  'table': { width: 12, height: 4 }
} as const;

export type WidgetSize = keyof typeof WIDGET_SIZES;

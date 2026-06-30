// Dashboard Types
export interface Widget {
  id: string;
  type: 'chart' | 'metric' | 'table' | 'text' | 'image';
  title: string;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  config: Record<string, any>;
  data_source_id?: string;
  query?: string;
  refresh_interval?: number;
  created_at: string;
  updated_at: string;
}

export interface Dashboard {
  id: string;
  name: string;
  description?: string;
  layout: 'grid' | 'flex' | 'custom';
  theme: 'light' | 'dark' | 'auto';
  is_public: boolean;
  organization_id: string;
  created_by: string;
  widgets: Widget[];
  filters: Record<string, any>;
  refresh_interval?: number;
  created_at: string;
  updated_at: string;
  version: number;
  tags: string[];
  share_token?: string;
}

export interface DashboardSummary {
  id: string;
  name: string;
  description?: string;
  is_public: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  version: number;
  widgets_count: number;
  tags: string[];
}

export interface DashboardCreate {
  name: string;
  description?: string;
  layout?: 'grid' | 'flex' | 'custom';
  theme?: 'light' | 'dark' | 'auto';
  is_public?: boolean;
  tags?: string[];
}

export interface DashboardUpdate {
  name?: string;
  description?: string;
  layout?: 'grid' | 'flex' | 'custom';
  theme?: 'light' | 'dark' | 'auto';
  is_public?: boolean;
  widgets?: Widget[];
  filters?: Record<string, any>;
  refresh_interval?: number;
  tags?: string[];
}

export interface DashboardVersion {
  id: string;
  dashboard_id: string;
  version_number: number;
  changes_summary: string;
  created_by: string;
  created_at: string;
  widgets_snapshot: Widget[];
}

export interface DashboardShare {
  share_token: string;
  share_url: string;
  permissions: SharePermissions;
  expires_at?: string;
  created_at: string;
}

export interface SharePermissions {
  can_view: boolean;
  can_interact: boolean;
  can_export: boolean;
  password_protected?: boolean;
}

// Widget creation types
export interface WidgetCreate {
  type: 'chart' | 'metric' | 'table' | 'text' | 'image';
  title: string;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  config: Record<string, any>;
  data_source_id?: string;
  query?: string;
  refresh_interval?: number;
}

export interface WidgetUpdate {
  title?: string;
  position?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  config?: Record<string, any>;
  data_source_id?: string;
  query?: string;
  refresh_interval?: number;
}

// Chart configuration types
export interface ChartConfig {
  chart_type: 'line' | 'bar' | 'pie' | 'scatter' | 'area' | 'gauge';
  x_axis?: string;
  y_axis?: string | string[];
  color_scheme?: string;
  show_legend?: boolean;
  show_grid?: boolean;
  animation?: boolean;
  custom_options?: Record<string, any>;
}

export interface MetricConfig {
  value_column: string;
  format?: 'number' | 'currency' | 'percentage';
  prefix?: string;
  suffix?: string;
  color?: string;
  trend_column?: string;
  comparison_value?: number;
}

export interface TableConfig {
  columns?: string[];
  sortable?: boolean;
  filterable?: boolean;
  pagination?: boolean;
  page_size?: number;
  row_selection?: boolean;
}

// Template types
export interface DashboardTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  thumbnail?: string;
  widgets: Omit<Widget, 'id' | 'created_at' | 'updated_at'>[];
  tags: string[];
  is_premium: boolean;
}

// Real-time collaboration types
export interface CollaborationEvent {
  type: 'cursor_move' | 'widget_select' | 'widget_edit' | 'widget_create' | 'widget_delete' | 'chat_message';
  user_id: string;
  user_name: string;
  data: any;
  timestamp: string;
}

export interface CursorPosition {
  user_id: string;
  user_name: string;
  x: number;
  y: number;
  color: string;
}
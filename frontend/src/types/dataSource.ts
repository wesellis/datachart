// Data Source Types
export interface DataSource {
  id: string;
  name: string;
  type: 'snowflake' | 'azure' | 'servicenow' | 'postgresql' | 'mysql' | 'rest_api' | 'intune' | 'oracle' | 'csv';
  description?: string;
  connection_config: Record<string, any>;
  connection_status: 'connected' | 'failed' | 'unknown' | 'testing';
  organization_id: string;
  created_at: string;
  updated_at: string;
  last_connection_test?: string;
  error_message?: string;
  is_active: boolean;
}

export interface DataSourceCreate {
  name: string;
  type: 'snowflake' | 'azure' | 'servicenow' | 'postgresql' | 'mysql' | 'rest_api' | 'intune' | 'oracle' | 'csv';
  description?: string;
  connection_config: Record<string, any>;
}

export interface DataSourceResponse {
  id: string;
  name: string;
  type: string;
  description?: string;
  connection_status: string;
  created_at: string;
  last_connection_test?: string;
  tables_count?: number;
}

export interface DataSourceUpdate {
  name?: string;
  description?: string;
  connection_config?: Record<string, any>;
}

// Connection configurations for different data source types
export interface SnowflakeConfig {
  account: string;
  username: string;
  password: string;
  warehouse?: string;
  database?: string;
  schema?: string;
  role?: string;
}

export interface PostgreSQLConfig {
  host: string;
  port?: number;
  database: string;
  username: string;
  password: string;
  ssl?: boolean;
}

export interface MySQLConfig {
  host: string;
  port?: number;
  database: string;
  username: string;
  password: string;
  ssl?: boolean;
}

export interface OracleConfig {
  host: string;
  port?: number;
  service_name?: string;
  sid?: string;
  username: string;
  password: string;
}

export interface APIConfig {
  base_url: string;
  authentication_type: 'none' | 'api_key' | 'bearer' | 'basic';
  api_key?: string;
  api_key_header?: string;
  bearer_token?: string;
  username?: string;
  password?: string;
  headers?: Record<string, string>;
}

export interface CSVConfig {
  file_path?: string;
  has_header: boolean;
  delimiter: ',' | ';' | '\t' | '|';
  encoding?: 'utf-8' | 'latin1' | 'ascii';
}

// Schema and table information
export interface TableInfo {
  table_name: string;
  row_count: number;
  columns: ColumnInfo[];
  table_size?: string;
  schema?: string;
}

export interface ColumnInfo {
  name: string;
  type: string;
  nullable?: boolean;
  default?: string;
  max_length?: number;
  is_primary_key?: boolean;
  is_foreign_key?: boolean;
}

export interface SchemaInfo {
  [tableName: string]: ColumnInfo[];
}

// Query execution
export interface QueryRequest {
  query: string;
  parameters?: Record<string, any>;
  limit?: number;
}

export interface QueryResult {
  success: boolean;
  data?: any[];
  row_count?: number;
  column_count?: number;
  columns?: string[];
  execution_time_seconds?: number;
  query?: string;
  error?: string;
}

export interface SampleQuery {
  name: string;
  description: string;
  query: string;
}

// Connection test result
export interface ConnectionTestResult {
  success: boolean;
  message: string;
  version?: string;
  database?: string;
  warehouse?: string;
  user?: string;
}

// Data source templates for quick setup
export interface DataSourceTemplate {
  id: string;
  name: string;
  type: string;
  description: string;
  icon: string;
  config_schema: Record<string, any>;
  is_premium: boolean;
  documentation_url?: string;
}

// Data preview for CSV/file sources
export interface DataPreview {
  columns: string[];
  sample_rows: any[][];
  total_rows?: number;
  data_types?: Record<string, string>;
}

// Data source statistics
export interface DataSourceStats {
  total_queries: number;
  successful_queries: number;
  failed_queries: number;
  avg_query_time: number;
  last_query_at?: string;
  most_used_tables: Array<{
    table_name: string;
    query_count: number;
  }>;
}
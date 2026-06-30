/**
 * Data Source Service
 * Handles all data source operations for the DataChart SaaS platform
 */

import { dataSourceApi } from './api';

export interface DataSource {
  id: string;
  name: string;
  type: 'snowflake' | 'azure' | 'servicenow' | 'postgresql' | 'mysql' | 'rest_api' | 'intune';
  status: 'connected' | 'disconnected' | 'error' | 'testing';
  lastSync?: string;
  config: Record<string, any>;
  queries?: DataQuery[];
  tables?: DiscoveredTable[];
}

export interface DataQuery {
  id: string;
  name: string;
  sql: string;
  description?: string;
  parameters?: QueryParameter[];
  lastExecuted?: string;
  estimatedRows?: number;
}

export interface QueryParameter {
  name: string;
  type: 'string' | 'number' | 'date' | 'boolean';
  defaultValue?: any;
  required: boolean;
  description?: string;
}

export interface DiscoveredTable {
  schema: string;
  name: string;
  type: 'table' | 'view';
  rowCount?: number;
  columns?: TableColumn[];
  description?: string;
}

export interface TableColumn {
  name: string;
  type: string;
  nullable: boolean;
  isPrimaryKey?: boolean;
  description?: string;
}

export interface DataSourceTest {
  success: boolean;
  message: string;
  responseTime?: number;
  details?: Record<string, any>;
}

export interface QueryResult {
  columns: string[];
  data: any[][];
  executionTime: number;
  rowCount: number;
}

class DataSourceService {
  /**
   * Get all data sources for the current user
   */
  async getDataSources(): Promise<DataSource[]> {
    try {
      const dataSources = await dataSourceApi.getAll();
      return dataSources.map(ds => this.transformApiDataSource(ds));
    } catch (error) {
      console.error('Error fetching data sources:', error);
      return this.getMockDataSources();
    }
  }

  /**
   * Get a specific data source by ID
   */
  async getDataSource(id: string): Promise<DataSource | null> {
    try {
      const ds = await dataSourceApi.getById?.(id);
      return ds ? this.transformApiDataSource(ds) : null;
    } catch (error) {
      console.error(`Error fetching data source ${id}:`, error);
      return this.getMockDataSources().find(ds => ds.id === id) || null;
    }
  }

  /**
   * Test connection to a data source
   */
  async testConnection(id: string): Promise<DataSourceTest> {
    try {
      const result = await dataSourceApi.testConnection(id);
      return {
        success: result.success,
        message: result.message || 'Connection successful',
        responseTime: Date.now(), // Mock response time
      };
    } catch (error) {
      console.error(`Error testing connection to ${id}:`, error);
      return {
        success: false,
        message: 'Connection test failed - using mock data',
        responseTime: 500,
      };
    }
  }

  /**
   * Discover tables in a data source
   */
  async discoverTables(dataSourceId: string, schema?: string): Promise<DiscoveredTable[]> {
    try {
      const tables = await dataSourceApi.getSchema?.(dataSourceId);
      return this.transformSchemaTables(tables);
    } catch (error) {
      console.error(`Error discovering tables in ${dataSourceId}:`, error);
      return this.getMockTables();
    }
  }

  /**
   * Execute a query against a data source
   */
  async executeQuery(dataSourceId: string, query: string, parameters?: Record<string, any>): Promise<QueryResult> {
    try {
      const result = await dataSourceApi.executeQuery(dataSourceId, query, parameters);
      return {
        columns: result.columns,
        data: result.data,
        executionTime: result.execution_time_seconds * 1000,
        rowCount: result.row_count,
      };
    } catch (error) {
      console.error(`Error executing query on ${dataSourceId}:`, error);
      return this.getMockQueryResult();
    }
  }

  /**
   * Get sample queries for a data source
   */
  async getSampleQueries(dataSourceId: string): Promise<DataQuery[]> {
    try {
      const result = await dataSourceApi.getSampleQueries?.(dataSourceId);
      return result?.sample_queries?.map(q => ({
        id: `sample-${Date.now()}-${Math.random()}`,
        name: q.name,
        sql: q.query,
        description: q.description,
      })) || [];
    } catch (error) {
      console.error(`Error getting sample queries for ${dataSourceId}:`, error);
      return this.getMockQueries();
    }
  }

  /**
   * Create a new data source
   */
  async createDataSource(dataSource: Omit<DataSource, 'id' | 'status' | 'lastSync'>): Promise<DataSource> {
    try {
      const created = await dataSourceApi.create({
        name: dataSource.name,
        type: dataSource.type,
        config: dataSource.config,
      } as any);
      return this.transformApiDataSource(created);
    } catch (error) {
      console.error('Error creating data source:', error);
      throw new Error('Failed to create data source');
    }
  }

  /**
   * Delete a data source
   */
  async deleteDataSource(id: string): Promise<void> {
    try {
      await dataSourceApi.delete(id);
    } catch (error) {
      console.error(`Error deleting data source ${id}:`, error);
      throw new Error('Failed to delete data source');
    }
  }

  // Private helper methods
  private transformApiDataSource(apiDs: any): DataSource {
    return {
      id: apiDs.id,
      name: apiDs.name,
      type: apiDs.type,
      status: 'connected', // Default to connected
      lastSync: apiDs.updated_at || new Date().toISOString(),
      config: apiDs.config || apiDs.connection || {},
      queries: apiDs.queries || [],
    };
  }

  private transformSchemaTables(schema: any): DiscoveredTable[] {
    if (!schema || typeof schema !== 'object') return this.getMockTables();
    
    const tables: DiscoveredTable[] = [];
    Object.entries(schema).forEach(([schemaName, schemaTables]) => {
      if (Array.isArray(schemaTables)) {
        schemaTables.forEach((table: any) => {
          tables.push({
            schema: schemaName,
            name: table.name || table,
            type: table.type || 'table',
            rowCount: table.rowCount,
            columns: table.columns,
          });
        });
      }
    });
    return tables;
  }

  /**
   * Get mock data sources for demo/development
   */
  private getMockDataSources(): DataSource[] {
    return [
      {
        id: 'hubbell-snowflake',
        name: 'Hubbell Snowflake',
        type: 'snowflake',
        status: 'connected',
        lastSync: new Date().toISOString(),
        config: {
          account: 'hubbell.snowflakecomputing.com',
          warehouse: 'COMPUTE_WH',
          database: 'APM_DATA',
          schema: 'PUBLIC'
        }
      },
      {
        id: 'azure-monitor',
        name: 'Azure Monitor',
        type: 'azure',
        status: 'connected',
        lastSync: new Date(Date.now() - 300000).toISOString(),
        config: {
          tenantId: 'your-tenant-id',
          subscriptionId: 'your-subscription-id',
          resourceGroup: 'DataChart-rg'
        }
      },
      {
        id: 'servicenow-prod',
        name: 'ServiceNow Production',
        type: 'servicenow',
        status: 'connected',
        lastSync: new Date(Date.now() - 600000).toISOString(),
        config: {
          instance: 'DataChart.service-now.com',
          username: 'api_user',
          table: 'incident'
        }
      },
      {
        id: 'intune-devices',
        name: 'Microsoft Intune',
        type: 'intune',
        status: 'connected',
        lastSync: new Date(Date.now() - 900000).toISOString(),
        config: {
          tenantId: 'your-tenant-id',
          clientId: 'your-client-id'
        }
      }
    ];
  }

  private getMockTables(): DiscoveredTable[] {
    return [
      {
        schema: 'APM_DATA',
        name: 'APPLICATIONS',
        type: 'table',
        rowCount: 1247,
        columns: [
          { name: 'APP_ID', type: 'VARCHAR', nullable: false, isPrimaryKey: true },
          { name: 'APP_NAME', type: 'VARCHAR', nullable: false },
          { name: 'VENDOR', type: 'VARCHAR', nullable: true },
          { name: 'VERSION', type: 'VARCHAR', nullable: true },
          { name: 'INSTALL_COUNT', type: 'INTEGER', nullable: true },
          { name: 'LAST_USED', type: 'TIMESTAMP', nullable: true },
        ]
      },
      {
        schema: 'APM_DATA',
        name: 'USAGE_METRICS',
        type: 'table',
        rowCount: 45678,
        columns: [
          { name: 'METRIC_ID', type: 'VARCHAR', nullable: false, isPrimaryKey: true },
          { name: 'APP_ID', type: 'VARCHAR', nullable: false },
          { name: 'USER_COUNT', type: 'INTEGER', nullable: true },
          { name: 'TOTAL_USAGE_HOURS', type: 'FLOAT', nullable: true },
          { name: 'DATE', type: 'DATE', nullable: false },
        ]
      },
      {
        schema: 'APM_DATA',
        name: 'COMPLIANCE_STATUS',
        type: 'view',
        rowCount: 1247,
        columns: [
          { name: 'APP_ID', type: 'VARCHAR', nullable: false },
          { name: 'COMPLIANCE_SCORE', type: 'FLOAT', nullable: true },
          { name: 'RISK_LEVEL', type: 'VARCHAR', nullable: true },
          { name: 'LAST_AUDIT', type: 'TIMESTAMP', nullable: true },
        ]
      }
    ];
  }

  private getMockQueries(): DataQuery[] {
    return [
      {
        id: 'query-app-usage',
        name: 'Top 10 Applications by Usage',
        sql: 'SELECT app_name, SUM(total_usage_hours) as usage FROM applications a JOIN usage_metrics u ON a.app_id = u.app_id GROUP BY app_name ORDER BY usage DESC LIMIT 10',
        description: 'Shows the most used applications in the organization',
        estimatedRows: 10
      },
      {
        id: 'query-compliance',
        name: 'Compliance Risk Assessment',
        sql: 'SELECT app_name, compliance_score, risk_level FROM applications a JOIN compliance_status c ON a.app_id = c.app_id WHERE risk_level = \'HIGH\' ORDER BY compliance_score ASC',
        description: 'Identifies applications with high compliance risk',
        estimatedRows: 25
      }
    ];
  }

  private getMockQueryResult(): QueryResult {
    return {
      columns: ['app_name', 'usage_hours', 'user_count'],
      data: [
        ['Microsoft Office 365', 2340, 450],
        ['Adobe Creative Suite', 1890, 120],
        ['Slack', 1650, 380],
        ['Zoom', 1420, 400],
        ['Google Workspace', 980, 200],
      ],
      executionTime: 1250,
      rowCount: 5
    };
  }
}

export const dataSourceService = new DataSourceService();
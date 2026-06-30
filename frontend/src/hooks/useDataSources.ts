// Data Source Management Hook
import { useState, useEffect, useCallback } from 'react';
import { 
  DataSourceResponse, 
  DataSourceCreate, 
  QueryResult, 
  ConnectionTestResult, 
  SchemaInfo,
  TableInfo,
  SampleQuery 
} from '../types/dataSource';
import { dataSourceApi } from '../services/api';

export const useDataSources = () => {
  const [dataSources, setDataSources] = useState<DataSourceResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDataSources = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await dataSourceApi.getAll();
      setDataSources(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch data sources';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDataSources();
  }, [fetchDataSources]);

  const createDataSource = async (dataSourceData: DataSourceCreate): Promise<DataSourceResponse> => {
    try {
      setError(null);
      const newDataSource = await dataSourceApi.create(dataSourceData);
      await fetchDataSources(); // Refresh the list
      return newDataSource;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create data source';
      setError(message);
      throw new Error(message);
    }
  };

  const deleteDataSource = async (id: string): Promise<void> => {
    try {
      setError(null);
      await dataSourceApi.delete(id);
      setDataSources(prev => prev.filter(ds => ds.id !== id));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete data source';
      setError(message);
      throw new Error(message);
    }
  };

  const testConnection = async (id: string): Promise<ConnectionTestResult> => {
    try {
      setError(null);
      const result = await dataSourceApi.testConnection(id);
      
      // Update the data source status in the local state
      setDataSources(prev => 
        prev.map(ds => 
          ds.id === id 
            ? { ...ds, connection_status: result.success ? 'connected' : 'failed' }
            : ds
        )
      );
      
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to test connection';
      setError(message);
      throw new Error(message);
    }
  };

  return {
    dataSources,
    loading,
    error,
    fetchDataSources,
    createDataSource,
    deleteDataSource,
    testConnection,
  };
};

export const useDataSource = (dataSourceId?: string) => {
  const [schema, setSchema] = useState<SchemaInfo | null>(null);
  const [loadingSchema, setLoadingSchema] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSchema = useCallback(async (id: string) => {
    try {
      setLoadingSchema(true);
      setError(null);
      const data = await dataSourceApi.getSchema(id);
      setSchema(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch schema';
      setError(message);
    } finally {
      setLoadingSchema(false);
    }
  }, []);

  useEffect(() => {
    if (dataSourceId) {
      fetchSchema(dataSourceId);
    }
  }, [dataSourceId, fetchSchema]);

  const executeQuery = async (
    query: string,
    parameters?: Record<string, any>,
    limit?: number
  ): Promise<QueryResult> => {
    if (!dataSourceId) throw new Error('No data source selected');

    try {
      setError(null);
      const result = await dataSourceApi.executeQuery(dataSourceId, query, parameters, limit);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Query execution failed';
      setError(message);
      throw new Error(message);
    }
  };

  const getSampleQueries = async (): Promise<SampleQuery[]> => {
    if (!dataSourceId) return [];

    try {
      setError(null);
      const result = await dataSourceApi.getSampleQueries(dataSourceId);
      return result.sample_queries;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get sample queries';
      setError(message);
      throw new Error(message);
    }
  };

  const getTableInfo = async (tableName: string): Promise<TableInfo> => {
    if (!dataSourceId) throw new Error('No data source selected');

    try {
      setError(null);
      const result = await dataSourceApi.getTableInfo(dataSourceId, tableName);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get table info';
      setError(message);
      throw new Error(message);
    }
  };

  return {
    schema,
    loadingSchema,
    error,
    fetchSchema,
    executeQuery,
    getSampleQueries,
    getTableInfo,
  };
};

// Hook for SQL query builder/editor
export const useQueryEditor = (dataSourceId?: string) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<QueryResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [queryHistory, setQueryHistory] = useState<string[]>([]);

  const { executeQuery } = useDataSource(dataSourceId);

  const runQuery = async (parameters?: Record<string, any>, limit?: number) => {
    if (!query.trim()) {
      setError('Query cannot be empty');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const result = await executeQuery(query, parameters, limit);
      setResults(result);
      
      // Add to history if successful
      if (result.success) {
        setQueryHistory(prev => {
          const newHistory = [query, ...prev.filter(q => q !== query)];
          return newHistory.slice(0, 10); // Keep last 10 queries
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Query execution failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const clearResults = () => {
    setResults(null);
    setError(null);
  };

  const loadQueryFromHistory = (historicalQuery: string) => {
    setQuery(historicalQuery);
    clearResults();
  };

  // Auto-save query to localStorage
  useEffect(() => {
    if (dataSourceId && query) {
      localStorage.setItem(`query_${dataSourceId}`, query);
    }
  }, [dataSourceId, query]);

  // Load saved query on mount
  useEffect(() => {
    if (dataSourceId) {
      const savedQuery = localStorage.getItem(`query_${dataSourceId}`);
      if (savedQuery) {
        setQuery(savedQuery);
      }
    }
  }, [dataSourceId]);

  return {
    query,
    setQuery,
    results,
    loading,
    error,
    queryHistory,
    runQuery,
    clearResults,
    loadQueryFromHistory,
  };
};

// Hook for managing data source templates and quick setup
export const useDataSourceTemplates = () => {
  const templates = [
    {
      id: 'snowflake',
      name: 'Snowflake',
      type: 'snowflake',
      description: 'Connect to Snowflake data warehouse',
      icon: '❄️',
      is_premium: false,
      config_schema: {
        account: { type: 'string', required: true, label: 'Account' },
        username: { type: 'string', required: true, label: 'Username' },
        password: { type: 'password', required: true, label: 'Password' },
        warehouse: { type: 'string', required: false, label: 'Warehouse' },
        database: { type: 'string', required: false, label: 'Database' },
        schema: { type: 'string', required: false, label: 'Schema' },
        role: { type: 'string', required: false, label: 'Role' },
      },
    },
    {
      id: 'postgresql',
      name: 'PostgreSQL',
      type: 'postgresql',
      description: 'Connect to PostgreSQL database',
      icon: '🐘',
      is_premium: false,
      config_schema: {
        host: { type: 'string', required: true, label: 'Host' },
        port: { type: 'number', required: false, label: 'Port', default: 5432 },
        database: { type: 'string', required: true, label: 'Database' },
        username: { type: 'string', required: true, label: 'Username' },
        password: { type: 'password', required: true, label: 'Password' },
        ssl: { type: 'boolean', required: false, label: 'Use SSL' },
      },
    },
    {
      id: 'mysql',
      name: 'MySQL',
      type: 'mysql',
      description: 'Connect to MySQL database',
      icon: '🐬',
      is_premium: false,
      config_schema: {
        host: { type: 'string', required: true, label: 'Host' },
        port: { type: 'number', required: false, label: 'Port', default: 3306 },
        database: { type: 'string', required: true, label: 'Database' },
        username: { type: 'string', required: true, label: 'Username' },
        password: { type: 'password', required: true, label: 'Password' },
        ssl: { type: 'boolean', required: false, label: 'Use SSL' },
      },
    },
  ];

  const getTemplate = (templateId: string) => {
    return templates.find(t => t.id === templateId);
  };

  const validateConfig = (templateId: string, config: Record<string, any>) => {
    const template = getTemplate(templateId);
    if (!template) return { isValid: false, errors: ['Template not found'] };

    const errors: string[] = [];
    const schema = template.config_schema;

    Object.entries(schema).forEach(([key, fieldSchema]) => {
      if ((fieldSchema as any).required && (!config[key] || config[key] === '')) {
        errors.push(`${(fieldSchema as any).label} is required`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
    };
  };

  return {
    templates,
    getTemplate,
    validateConfig,
  };
};
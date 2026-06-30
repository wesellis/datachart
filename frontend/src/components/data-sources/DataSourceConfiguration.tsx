import React, { useState, useEffect } from 'react';
import {
  Database,
  Search,
  Play,
  CheckCircle,
  Eye,
  Settings,
  Plus,
  Table,
  Code,
  BarChart3,
  RefreshCw,
  Clock,
  Users,
  TrendingUp,
  AlertCircle,
  Download,
  Upload,
  Filter,
  Zap
} from 'lucide-react';
import { dataSourceService, type DataSource, type DiscoveredTable, type DataQuery, type QueryResult } from '../../services/dataSourceService';

interface DataSourceConfigurationProps {}

const DataSourceConfiguration: React.FC<DataSourceConfigurationProps> = () => {
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'tables' | 'queries' | 'preview'>('overview');
  const [tables, setTables] = useState<DiscoveredTable[]>([]);
  const [queries, setQueries] = useState<DataQuery[]>([]);
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [selectedQuery, setSelectedQuery] = useState<string>('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [testingConnection, setTestingConnection] = useState<string | null>(null);

  useEffect(() => {
    loadDataSources();
  }, []);

  useEffect(() => {
    if (selectedSource) {
      loadDataSourceDetails(selectedSource);
    }
  }, [selectedSource]);

  const loadDataSources = async () => {
    try {
      setLoading(true);
      const sources = await dataSourceService.getDataSources();
      setDataSources(sources);
      if (sources.length > 0 && !selectedSource) {
        setSelectedSource(sources[0].id);
      }
    } catch (error) {
      console.error('Error loading data sources:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDataSourceDetails = async (sourceId: string) => {
    try {
      const [tablesData, queriesData] = await Promise.all([
        dataSourceService.discoverTables(sourceId),
        dataSourceService.getSampleQueries(sourceId)
      ]);
      setTables(tablesData);
      setQueries(queriesData);
    } catch (error) {
      console.error('Error loading data source details:', error);
    }
  };

  const testConnection = async (sourceId: string) => {
    try {
      setTestingConnection(sourceId);
      const result = await dataSourceService.testConnection(sourceId);
      
      const message = result.success 
        ? `✅ Connection successful! Response time: ${result.responseTime}ms`
        : `❌ Connection failed: ${result.message}`;
      
      alert(message);
    } catch (error) {
      alert('❌ Connection test failed');
    } finally {
      setTestingConnection(null);
    }
  };

  const executeQuery = async (query: string) => {
    if (!selectedSource || !query.trim()) return;
    
    try {
      setIsExecuting(true);
      const result = await dataSourceService.executeQuery(selectedSource, query);
      setQueryResult(result);
      setActiveTab('preview');
    } catch (error) {
      console.error('Query execution failed:', error);
      alert('Query execution failed. Please check your SQL syntax.');
    } finally {
      setIsExecuting(false);
    }
  };

  const getSelectedDataSource = () => {
    return dataSources.find(ds => ds.id === selectedSource);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'text-green-400';
      case 'disconnected': return 'text-red-400';
      case 'testing': return 'text-yellow-400';
      case 'error': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'snowflake': return '❄️';
      case 'azure': return '☁️';
      case 'servicenow': return '📋';
      case 'intune': return '🔒';
      case 'postgresql': return '🐘';
      case 'mysql': return '🐬';
      default: return '📊';
    }
  };

  const selectedDataSource = getSelectedDataSource();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Data Source Configuration</h1>
            <p className="text-slate-300">Configure, explore, and manage your enterprise data connections</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Add Data Source
            </button>
            <button 
              onClick={loadDataSources}
              className="bg-slate-700 text-white px-4 py-3 rounded-lg hover:bg-slate-600 transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Data Sources Sidebar */}
          <div className="space-y-4">
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Database className="w-5 h-5" />
                Data Sources ({dataSources.length})
              </h2>
              
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto"></div>
                  <p className="text-slate-300 mt-2 text-sm">Loading...</p>
                </div>
              ) : dataSources.length === 0 ? (
                <div className="text-center py-8">
                  <Database className="w-12 h-12 text-slate-500 mx-auto mb-3" />
                  <p className="text-slate-300 text-sm mb-2">No data sources</p>
                  <button className="text-blue-400 text-sm hover:text-blue-300">Add your first one</button>
                </div>
              ) : (
                <div className="space-y-2">
                  {dataSources.map((source) => (
                    <div 
                      key={source.id}
                      className={`border rounded-lg p-3 cursor-pointer transition-all ${
                        selectedSource === source.id 
                          ? 'bg-blue-500/20 border-blue-400' 
                          : 'border-white/10 hover:bg-white/5 hover:border-white/20'
                      }`}
                      onClick={() => setSelectedSource(source.id)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{getTypeIcon(source.type)}</span>
                          <div>
                            <h3 className="text-white text-sm font-medium">{source.name}</h3>
                            <p className="text-slate-400 text-xs capitalize">{source.type}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              testConnection(source.id);
                            }}
                            disabled={testingConnection === source.id}
                            className="text-blue-400 hover:text-blue-300 p-1"
                            title="Test Connection"
                          >
                            {testingConnection === source.id ? (
                              <RefreshCw className="w-3 h-3 animate-spin" />
                            ) : (
                              <Play className="w-3 h-3" />
                            )}
                          </button>
                          <div 
                            className={`w-2 h-2 rounded-full ${source.status === 'connected' ? 'bg-green-400' : 'bg-red-400'}`} 
                            title={source.status}
                          ></div>
                        </div>
                      </div>
                      {source.lastSync && (
                        <p className="text-slate-500 text-xs flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(source.lastSync).toLocaleTimeString()}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3 space-y-6">
            {selectedDataSource ? (
              <>
                {/* Data Source Header */}
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getTypeIcon(selectedDataSource.type)}</span>
                      <div>
                        <h2 className="text-xl font-bold text-white">{selectedDataSource.name}</h2>
                        <p className="text-slate-300 capitalize flex items-center gap-2">
                          {selectedDataSource.type} 
                          <span className={`w-2 h-2 rounded-full ${selectedDataSource.status === 'connected' ? 'bg-green-400' : 'bg-red-400'}`}></span>
                          <span className={`text-sm ${getStatusColor(selectedDataSource.status)}`}>
                            {selectedDataSource.status}
                          </span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="bg-slate-700 text-white px-4 py-2 rounded-lg hover:bg-slate-600 transition-colors text-sm">
                        <Settings className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Tabs */}
                  <div className="flex space-x-1 bg-slate-800/50 rounded-lg p-1">
                    {[
                      { id: 'overview', label: 'Overview', icon: BarChart3 },
                      { id: 'tables', label: `Tables (${tables.length})`, icon: Table },
                      { id: 'queries', label: `Queries (${queries.length})`, icon: Code },
                      { id: 'preview', label: 'Query Preview', icon: Eye },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                          activeTab === tab.id
                            ? 'bg-blue-600 text-white'
                            : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                        }`}
                      >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tab Content */}
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 min-h-[400px]">
                  {activeTab === 'overview' && (
                    <div className="space-y-6">
                      <h3 className="text-lg font-semibold text-white mb-4">Data Source Overview</h3>
                      
                      {/* Stats Cards */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-slate-800/50 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Table className="w-5 h-5 text-blue-400" />
                            <span className="text-slate-300 text-sm">Tables</span>
                          </div>
                          <p className="text-2xl font-bold text-white">{tables.length}</p>
                          <p className="text-slate-400 text-xs">Available tables and views</p>
                        </div>
                        
                        <div className="bg-slate-800/50 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Code className="w-5 h-5 text-green-400" />
                            <span className="text-slate-300 text-sm">Queries</span>
                          </div>
                          <p className="text-2xl font-bold text-white">{queries.length}</p>
                          <p className="text-slate-400 text-xs">Sample queries available</p>
                        </div>
                        
                        <div className="bg-slate-800/50 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <TrendingUp className="w-5 h-5 text-purple-400" />
                            <span className="text-slate-300 text-sm">Status</span>
                          </div>
                          <p className={`text-2xl font-bold ${getStatusColor(selectedDataSource.status)}`}>
                            {selectedDataSource.status}
                          </p>
                          <p className="text-slate-400 text-xs">Connection status</p>
                        </div>
                      </div>

                      {/* Configuration Details */}
                      <div className="bg-slate-800/30 rounded-lg p-4">
                        <h4 className="text-white font-medium mb-3">Configuration</h4>
                        <div className="space-y-2 text-sm">
                          {Object.entries(selectedDataSource.config).map(([key, value]) => (
                            <div key={key} className="flex justify-between">
                              <span className="text-slate-300 capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                              <span className="text-white font-mono">{String(value)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'tables' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-white">Discovered Tables</h3>
                        <div className="flex items-center gap-2">
                          <button className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">
                            <RefreshCw className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        {tables.map((table, idx) => (
                          <div key={idx} className="bg-slate-800/50 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Table className="w-4 h-4 text-blue-400" />
                                <span className="text-white font-medium">{table.schema}.{table.name}</span>
                                <span className={`px-2 py-1 text-xs rounded ${
                                  table.type === 'table' ? 'bg-blue-500/20 text-blue-300' : 'bg-purple-500/20 text-purple-300'
                                }`}>
                                  {table.type}
                                </span>
                              </div>
                              <span className="text-slate-400 text-sm">{table.rowCount?.toLocaleString()} rows</span>
                            </div>
                            {table.columns && (
                              <div className="text-xs text-slate-400">
                                {table.columns.slice(0, 5).map(col => col.name).join(', ')}
                                {table.columns.length > 5 && ` +${table.columns.length - 5} more`}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeTab === 'queries' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-white">Sample Queries</h3>
                        <button className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="space-y-3">
                        {queries.map((query) => (
                          <div key={query.id} className="bg-slate-800/50 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="text-white font-medium">{query.name}</h4>
                              <button
                                onClick={() => {
                                  setSelectedQuery(query.sql);
                                  executeQuery(query.sql);
                                }}
                                className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 flex items-center gap-1"
                                disabled={isExecuting}
                              >
                                {isExecuting ? (
                                  <RefreshCw className="w-3 h-3 animate-spin" />
                                ) : (
                                  <Play className="w-3 h-3" />
                                )}
                                Run
                              </button>
                            </div>
                            {query.description && (
                              <p className="text-slate-300 text-sm mb-2">{query.description}</p>
                            )}
                            <pre className="text-xs text-slate-400 bg-slate-900/50 p-3 rounded overflow-x-auto">
{query.sql}
                            </pre>
                            {query.estimatedRows && (
                              <p className="text-slate-500 text-xs mt-2">
                                Estimated rows: {query.estimatedRows.toLocaleString()}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeTab === 'preview' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-white">Query Preview</h3>
                        <div className="flex items-center gap-2">
                          <button className="bg-slate-700 text-white px-3 py-1 rounded text-sm">
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      
                      {queryResult ? (
                        <div className="space-y-4">
                          {/* Query Stats */}
                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-slate-300">
                              Execution time: <span className="text-white font-mono">{queryResult.executionTime}ms</span>
                            </span>
                            <span className="text-slate-300">
                              Rows: <span className="text-white font-mono">{queryResult.rowCount.toLocaleString()}</span>
                            </span>
                            <span className="text-slate-300">
                              Columns: <span className="text-white font-mono">{queryResult.columns.length}</span>
                            </span>
                          </div>
                          
                          {/* Results Table */}
                          <div className="bg-slate-800/30 rounded-lg overflow-hidden">
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm">
                                <thead className="bg-slate-700/50">
                                  <tr>
                                    {queryResult.columns.map((col, idx) => (
                                      <th key={idx} className="px-4 py-2 text-left text-slate-200 font-medium">
                                        {col}
                                      </th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {queryResult.data.map((row, rowIdx) => (
                                    <tr key={rowIdx} className="border-t border-slate-600/30">
                                      {row.map((cell, cellIdx) => (
                                        <td key={cellIdx} className="px-4 py-2 text-slate-300 font-mono">
                                          {String(cell)}
                                        </td>
                                      ))}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <Code className="w-16 h-16 text-slate-500 mx-auto mb-4" />
                          <p className="text-slate-300 mb-2">No query results yet</p>
                          <p className="text-slate-500 text-sm">Run a query from the Queries tab to see results here</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-12 text-center">
                <Database className="w-24 h-24 text-slate-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No Data Source Selected</h3>
                <p className="text-slate-300">Select a data source from the sidebar to view its configuration and explore data</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataSourceConfiguration;
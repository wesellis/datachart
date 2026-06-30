import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Plus, 
  Search, 
  Filter, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  RefreshCw,
  Settings,
  Play,
  Code,
  Trash2,
  Edit,
  MoreVertical,
  Server,
  Cloud,
  FileJson,
  Globe
} from 'lucide-react';

interface DataSource {
  id: string;
  name: string;
  description?: string;
  type: string;
  connection_status: string;
  is_active: boolean;
  last_connection_test?: string;
  last_sync?: string;
  created_at: string;
  updated_at?: string;
  table_count: number;
  query_count: number;
}

const DataSourceList: React.FC = () => {
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [testingConnection, setTestingConnection] = useState<string | null>(null);

  // Fetch data sources
  const fetchDataSources = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/v1/data-sources/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setDataSources(data);
      } else {
        throw new Error('Failed to fetch data sources');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Test connection
  const testConnection = async (dataSourceId: string) => {
    setTestingConnection(dataSourceId);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/v1/data-sources/${dataSourceId}/test`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // Update local state
          setDataSources(prev => prev.map(ds => 
            ds.id === dataSourceId 
              ? { ...ds, connection_status: 'connected', last_connection_test: new Date().toISOString() }
              : ds
          ));
        } else {
          setDataSources(prev => prev.map(ds => 
            ds.id === dataSourceId 
              ? { ...ds, connection_status: 'failed' }
              : ds
          ));
        }
      }
    } catch (err) {
      console.error('Connection test failed:', err);
    } finally {
      setTestingConnection(null);
    }
  };

  // Delete data source
  const deleteDataSource = async (dataSourceId: string) => {
    if (!window.confirm('Are you sure you want to delete this data source?')) return;
    
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/v1/data-sources/${dataSourceId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setDataSources(prev => prev.filter(ds => ds.id !== dataSourceId));
      }
    } catch (err) {
      console.error('Failed to delete data source:', err);
    }
  };

  useEffect(() => {
    fetchDataSources();
  }, []);

  // Filter data sources
  const filteredDataSources = dataSources.filter(ds => {
    const matchesSearch = ds.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (ds.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    const matchesType = !typeFilter || ds.type === typeFilter;
    const matchesStatus = !statusFilter || ds.connection_status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  // Get icon for data source type
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'postgresql':
      case 'mysql':
        return <Database className="w-5 h-5" />;
      case 'snowflake':
        return <Cloud className="w-5 h-5" />;
      case 'mongodb':
        return <Server className="w-5 h-5" />;
      case 'rest_api':
        return <Globe className="w-5 h-5" />;
      case 'csv':
      case 'excel':
        return <FileJson className="w-5 h-5" />;
      default:
        return <Database className="w-5 h-5" />;
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'testing':
        return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  // Get unique types for filter
  const types = Array.from(new Set(dataSources.map(ds => ds.type)));

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Database className="w-12 h-12 text-gray-400 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading data sources...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Data Sources</h1>
              <p className="text-gray-600 mt-1">Connect and manage your data sources</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add Data Source
            </button>
          </div>

          {/* Search and Filters */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search data sources..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
              >
                <option value="">All Types</option>
                {types.map(type => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Status</option>
              <option value="connected">Connected</option>
              <option value="failed">Failed</option>
              <option value="unknown">Unknown</option>
            </select>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Data Sources Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredDataSources.map(dataSource => (
            <div key={dataSource.id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="p-6">
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      {getTypeIcon(dataSource.type)}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{dataSource.name}</h3>
                      <p className="text-sm text-gray-500 capitalize">{dataSource.type.replace('_', ' ')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(testingConnection === dataSource.id ? 'testing' : dataSource.connection_status)}
                    <div className="relative group">
                      <button className="p-1 text-gray-400 hover:text-gray-600">
                        <MoreVertical className="w-5 h-5" />
                      </button>
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 hidden group-hover:block z-10">
                        <button
                          onClick={() => testConnection(dataSource.id)}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                        >
                          <RefreshCw className="w-4 h-4" />
                          Test Connection
                        </button>
                        <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                          <Code className="w-4 h-4" />
                          View Queries
                        </button>
                        <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                          <Settings className="w-4 h-4" />
                          Configure
                        </button>
                        <hr className="my-1" />
                        <button
                          onClick={() => deleteDataSource(dataSource.id)}
                          className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Description */}
                {dataSource.description && (
                  <p className="text-gray-600 text-sm mb-4">
                    {dataSource.description}
                  </p>
                )}

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-500">Tables</p>
                    <p className="text-lg font-semibold text-gray-900">{dataSource.table_count}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Queries</p>
                    <p className="text-lg font-semibold text-gray-900">{dataSource.query_count}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Status</p>
                    <p className="text-sm font-medium capitalize">
                      <span className={`${
                        dataSource.connection_status === 'connected' ? 'text-green-600' :
                        dataSource.connection_status === 'failed' ? 'text-red-600' :
                        'text-gray-600'
                      }`}>
                        {dataSource.connection_status}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Timestamps */}
                <div className="text-xs text-gray-500 border-t pt-3">
                  {dataSource.last_connection_test && (
                    <p>Last tested: {new Date(dataSource.last_connection_test).toLocaleString()}</p>
                  )}
                  {dataSource.last_sync && (
                    <p>Last sync: {new Date(dataSource.last_sync).toLocaleString()}</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-4">
                  <button className="flex-1 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium flex items-center justify-center gap-2">
                    <Play className="w-4 h-4" />
                    Query Builder
                  </button>
                  <button className="flex-1 px-4 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium flex items-center justify-center gap-2">
                    <Database className="w-4 h-4" />
                    Explore Schema
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredDataSources.length === 0 && !loading && (
          <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
            <Database className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || typeFilter || statusFilter ? 'No matching data sources' : 'No data sources yet'}
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              {searchTerm || typeFilter || statusFilter 
                ? 'Try adjusting your search or filter criteria.'
                : 'Connect your databases, APIs, and files to start building powerful dashboards.'
              }
            </p>
            {!searchTerm && !typeFilter && !statusFilter && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg inline-flex items-center gap-2 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Add Your First Data Source
              </button>
            )}
          </div>
        )}
      </div>

      {/* Create Data Source Modal */}
      {showCreateModal && (
        <CreateDataSourceModal
          onClose={() => setShowCreateModal(false)}
          onCreate={(newDataSource) => {
            setDataSources(prev => [newDataSource, ...prev]);
            setShowCreateModal(false);
          }}
        />
      )}
    </div>
  );
};

// Create Data Source Modal Component
interface CreateDataSourceModalProps {
  onClose: () => void;
  onCreate: (dataSource: DataSource) => void;
}

const CreateDataSourceModal: React.FC<CreateDataSourceModalProps> = ({ onClose, onCreate }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: '',
    connection_config: {} as any
  });
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const dataSourceTypes = [
    { id: 'postgresql', name: 'PostgreSQL', icon: Database },
    { id: 'mysql', name: 'MySQL', icon: Database },
    { id: 'snowflake', name: 'Snowflake', icon: Cloud },
    { id: 'mongodb', name: 'MongoDB', icon: Server },
    { id: 'rest_api', name: 'REST API', icon: Globe },
    { id: 'csv', name: 'CSV File', icon: FileJson },
  ];

  const testConnection = async () => {
    setTesting(true);
    setTestResult(null);
    
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/v1/data-sources/test-connection`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: formData.type,
          connection_config: formData.connection_config
        }),
      });

      const result = await response.json();
      setTestResult(result);
    } catch (err) {
      setTestResult({ success: false, message: 'Connection test failed' });
    } finally {
      setTesting(false);
    }
  };

  const handleCreate = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/v1/data-sources/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const newDataSource = await response.json();
        onCreate(newDataSource);
      }
    } catch (err) {
      console.error('Failed to create data source:', err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Add Data Source</h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>

          {/* Step Indicator */}
          <div className="flex items-center mb-8">
            <div className={`flex items-center ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${step >= 1 ? 'border-blue-600 bg-blue-50' : 'border-gray-300'}`}>
                1
              </div>
              <span className="ml-2 font-medium">Choose Type</span>
            </div>
            <div className={`flex-1 h-0.5 mx-4 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-300'}`} />
            <div className={`flex items-center ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${step >= 2 ? 'border-blue-600 bg-blue-50' : 'border-gray-300'}`}>
                2
              </div>
              <span className="ml-2 font-medium">Configure</span>
            </div>
            <div className={`flex-1 h-0.5 mx-4 ${step >= 3 ? 'bg-blue-600' : 'bg-gray-300'}`} />
            <div className={`flex items-center ${step >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${step >= 3 ? 'border-blue-600 bg-blue-50' : 'border-gray-300'}`}>
                3
              </div>
              <span className="ml-2 font-medium">Test & Create</span>
            </div>
          </div>

          {/* Step Content */}
          {step === 1 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Select Data Source Type</h3>
              <div className="grid grid-cols-2 gap-4">
                {dataSourceTypes.map(type => (
                  <button
                    key={type.id}
                    onClick={() => {
                      setFormData(prev => ({ ...prev, type: type.id }));
                      setStep(2);
                    }}
                    className={`p-4 border-2 rounded-lg hover:border-blue-500 transition-colors ${
                      formData.type === type.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                    }`}
                  >
                    <type.icon className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                    <p className="font-medium text-gray-900">{type.name}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Configure Connection</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Connection Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Production Database"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Describe this data source"
                    rows={3}
                  />
                </div>

                {/* Dynamic fields based on type */}
                {(formData.type === 'postgresql' || formData.type === 'mysql') && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Host *</label>
                        <input
                          type="text"
                          value={formData.connection_config.host || ''}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            connection_config: { ...prev.connection_config, host: e.target.value }
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="localhost"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Port *</label>
                        <input
                          type="number"
                          value={formData.connection_config.port || (formData.type === 'postgresql' ? 5432 : 3306)}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            connection_config: { ...prev.connection_config, port: parseInt(e.target.value) }
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Database *</label>
                      <input
                        type="text"
                        value={formData.connection_config.database || ''}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          connection_config: { ...prev.connection_config, database: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="database_name"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Username *</label>
                        <input
                          type="text"
                          value={formData.connection_config.username || ''}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            connection_config: { ...prev.connection_config, username: e.target.value }
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                        <input
                          type="password"
                          value={formData.connection_config.password || ''}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            connection_config: { ...prev.connection_config, password: e.target.value }
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </>
                )}

                {formData.type === 'snowflake' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Account *</label>
                      <input
                        type="text"
                        value={formData.connection_config.account || ''}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          connection_config: { ...prev.connection_config, account: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="abc12345.us-east-1"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Warehouse *</label>
                        <input
                          type="text"
                          value={formData.connection_config.warehouse || ''}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            connection_config: { ...prev.connection_config, warehouse: e.target.value }
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Database *</label>
                        <input
                          type="text"
                          value={formData.connection_config.database || ''}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            connection_config: { ...prev.connection_config, database: e.target.value }
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Username *</label>
                        <input
                          type="text"
                          value={formData.connection_config.username || ''}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            connection_config: { ...prev.connection_config, username: e.target.value }
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                        <input
                          type="password"
                          value={formData.connection_config.password || ''}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            connection_config: { ...prev.connection_config, password: e.target.value }
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </>
                )}

                {formData.type === 'rest_api' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Base URL *</label>
                      <input
                        type="url"
                        value={formData.connection_config.base_url || ''}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          connection_config: { ...prev.connection_config, base_url: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="https://api.example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                      <input
                        type="password"
                        value={formData.connection_config.api_key || ''}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          connection_config: { ...prev.connection_config, api_key: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Your API key"
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="flex justify-between mt-6">
                <button
                  onClick={() => setStep(1)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={!formData.name}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next: Test Connection
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Test Connection</h3>
              
              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="font-medium text-gray-900">{formData.name}</p>
                    <p className="text-sm text-gray-500">{formData.type}</p>
                  </div>
                  <button
                    onClick={testConnection}
                    disabled={testing}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    {testing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Testing...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4" />
                        Test Connection
                      </>
                    )}
                  </button>
                </div>

                {testResult && (
                  <div className={`p-4 rounded-lg ${testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                    <div className="flex items-center gap-2">
                      {testResult.success ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600" />
                      )}
                      <p className={`font-medium ${testResult.success ? 'text-green-800' : 'text-red-800'}`}>
                        {testResult.message}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-between">
                <button
                  onClick={() => setStep(2)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  onClick={handleCreate}
                  disabled={!testResult?.success}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Data Source
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DataSourceList;
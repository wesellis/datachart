import React, { useState } from 'react';
import { Database, Cloud, Settings, CheckCircle, XCircle } from 'lucide-react';

interface DataSource {
  id: string;
  name: string;
  type: 'snowflake' | 'salesforce' | 'oracle' | 'api';
  config: any;
  status: 'connected' | 'disconnected' | 'error';
}

interface DataSourceConnectorProps {
  dataSources: DataSource[];
  onUpdateDataSources: (sources: DataSource[]) => void;
}

const DataSourceConnector: React.FC<DataSourceConnectorProps> = ({
  dataSources,
  onUpdateDataSources
}) => {
  const [activeSource, setActiveSource] = useState<string | null>(null);

  const dataSourceTemplates = [
    {
      type: 'snowflake',
      name: 'Snowflake',
      description: 'Connect to Snowflake data warehouse',
      icon: <Database className="w-6 h-6" />,
      gradient: 'from-blue-500 to-cyan-500',
      fields: [
        { key: 'account', label: 'Account', type: 'text', placeholder: 'your-account.snowflakecomputing.com' },
        { key: 'username', label: 'Username', type: 'text', placeholder: 'your-username' },
        { key: 'password', label: 'Password', type: 'password', placeholder: '••••••••' },
        { key: 'warehouse', label: 'Warehouse', type: 'text', placeholder: 'COMPUTE_WH' },
        { key: 'database', label: 'Database', type: 'text', placeholder: 'APM_DATA' },
        { key: 'schema', label: 'Schema', type: 'text', placeholder: 'PUBLIC' }
      ]
    },
    {
      type: 'salesforce',
      name: 'Salesforce',
      description: 'Connect to Salesforce CRM',
      icon: <Cloud className="w-6 h-6" />,
      gradient: 'from-blue-600 to-indigo-600',
      fields: [
        { key: 'username', label: 'Username', type: 'email', placeholder: 'user@company.com' },
        { key: 'password', label: 'Password', type: 'password', placeholder: '••••••••' },
        { key: 'token', label: 'Security Token', type: 'password', placeholder: 'security-token' },
        { key: 'environment', label: 'Environment', type: 'select', options: ['production', 'sandbox'] }
      ]
    },
    {
      type: 'api',
      name: 'Custom API',
      description: 'Connect to REST API endpoint',
      icon: <Settings className="w-6 h-6" />,
      gradient: 'from-green-500 to-emerald-500',
      fields: [
        { key: 'url', label: 'API URL', type: 'url', placeholder: 'https://api.example.com' },
        { key: 'apiKey', label: 'API Key', type: 'password', placeholder: 'your-api-key' },
        { key: 'headers', label: 'Headers', type: 'textarea', placeholder: '{"Authorization": "Bearer token"}' }
      ]
    }
  ];

  const handleTestConnection = async (sourceType: string, config: any) => {
    // Simulate connection test
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(Math.random() > 0.3); // 70% success rate
      }, 1000);
    });
  };

  const addDataSource = (template: any) => {
    const newSource: DataSource = {
      id: `${template.type}-${Date.now()}`,
      name: `${template.name} Connection`,
      type: template.type,
      config: {},
      status: 'disconnected'
    };
    
    onUpdateDataSources([...dataSources, newSource]);
    setActiveSource(newSource.id);
  };

  const updateDataSource = (sourceId: string, updates: Partial<DataSource>) => {
    const updatedSources = dataSources.map(source =>
      source.id === sourceId ? { ...source, ...updates } : source
    );
    onUpdateDataSources(updatedSources);
  };

  const removeDataSource = (sourceId: string) => {
    const filteredSources = dataSources.filter(source => source.id !== sourceId);
    onUpdateDataSources(filteredSources);
    if (activeSource === sourceId) {
      setActiveSource(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white mb-2">Data Sources</h2>
        <p className="text-sm text-slate-400">
          Connect to your data sources for live dashboard updates
        </p>
      </div>

      {/* Existing Connections */}
      {dataSources.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
            Active Connections
          </h3>
          
          {dataSources.map((source) => (
            <div
              key={source.id}
              className={`
                p-4 rounded-lg border transition-all duration-200 cursor-pointer
                ${activeSource === source.id
                  ? 'bg-blue-500/10 border-blue-500/30'
                  : 'bg-slate-700/30 border-slate-600/30 hover:border-slate-500/50'
                }
              `}
              onClick={() => setActiveSource(activeSource === source.id ? null : source.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`
                    w-8 h-8 rounded-lg flex items-center justify-center text-white
                    ${source.status === 'connected' ? 'bg-green-500' : 
                      source.status === 'error' ? 'bg-red-500' : 'bg-gray-500'}
                  `}>
                    {source.status === 'connected' ? <CheckCircle className="w-4 h-4" /> :
                     source.status === 'error' ? <XCircle className="w-4 h-4" /> :
                     <Database className="w-4 h-4" />}
                  </div>
                  
                  <div>
                    <div className="font-medium text-white">{source.name}</div>
                    <div className="text-sm text-slate-400 capitalize">{source.type}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className={`
                    px-2 py-1 rounded text-xs font-medium
                    ${source.status === 'connected' ? 'bg-green-500/20 text-green-300' :
                      source.status === 'error' ? 'bg-red-500/20 text-red-300' :
                      'bg-gray-500/20 text-gray-300'}
                  `}>
                    {source.status}
                  </span>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeDataSource(source.id);
                    }}
                    className="text-slate-400 hover:text-red-400 transition-colors"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add New Connection */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
          Add New Connection
        </h3>
        
        <div className="space-y-3">
          {dataSourceTemplates.map((template) => (
            <div
              key={template.type}
              onClick={() => addDataSource(template)}
              className="p-4 rounded-lg bg-slate-700/30 border border-slate-600/30 hover:border-blue-500/30 hover:bg-slate-600/40 transition-all duration-200 cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className={`
                  w-10 h-10 rounded-lg flex items-center justify-center text-white
                  bg-gradient-to-br ${template.gradient}
                `}>
                  {template.icon}
                </div>
                
                <div>
                  <div className="font-medium text-white group-hover:text-blue-300">
                    {template.name}
                  </div>
                  <div className="text-sm text-slate-400 group-hover:text-slate-300">
                    {template.description}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Connection Status */}
      <div className="mt-8 p-4 rounded-lg bg-slate-800/40 border border-slate-700/50">
        <h4 className="font-semibold text-white mb-2">💡 Connection Tips</h4>
        <ul className="text-sm text-slate-400 space-y-1">
          <li>• Test connections before using in widgets</li>
          <li>• Use read-only credentials for security</li>
          <li>• Configure IP allowlisting if required</li>
          <li>• Data is queried live, not stored</li>
        </ul>
      </div>
    </div>
  );
};

export default DataSourceConnector;
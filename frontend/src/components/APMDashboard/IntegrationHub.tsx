import React, { useState, useRef } from 'react';
import { 
  Upload, Database, Webhook, Code, CheckCircle, 
  AlertCircle, Clock, Download, RefreshCw, 
  FileSpreadsheet, Server, Cloud, Link, Settings
} from 'lucide-react';
import './IntegrationHub.css';

interface Integration {
  id: string;
  name: string;
  type: 'api' | 'file' | 'webhook' | 'database';
  status: 'connected' | 'disconnected' | 'syncing' | 'error';
  lastSync?: Date;
  recordsImported?: number;
  endpoint?: string;
}

interface IntegrationHubProps {
  onDataImport?: (data: any) => void;
}

const IntegrationHub: React.FC<IntegrationHubProps> = ({ onDataImport }) => {
  const [activeTab, setActiveTab] = useState<'connections' | 'upload' | 'api' | 'webhooks'>('connections');
  const [integrations, setIntegrations] = useState<Integration[]>([
    {
      id: '1',
      name: 'ServiceNow',
      type: 'api',
      status: 'connected',
      lastSync: new Date(Date.now() - 3600000),
      recordsImported: 1247,
      endpoint: 'https://api.servicenow.com/v1/apps'
    },
    {
      id: '2',
      name: 'SAP Ariba',
      type: 'api',
      status: 'disconnected',
      endpoint: 'https://api.ariba.com/v2/contracts'
    },
    {
      id: '3',
      name: 'Excel Import',
      type: 'file',
      status: 'connected',
      lastSync: new Date(Date.now() - 86400000),
      recordsImported: 523
    },
    {
      id: '4',
      name: 'Webhook Listener',
      type: 'webhook',
      status: 'connected',
      endpoint: 'https://apm.DataChart.com/webhooks/inbound'
    }
  ]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);

    // Simulate file processing
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          
          // Add to integrations
          const newIntegration: Integration = {
            id: Date.now().toString(),
            name: file.name,
            type: 'file',
            status: 'connected',
            lastSync: new Date(),
            recordsImported: Math.floor(Math.random() * 1000) + 100
          };
          setIntegrations(prev => [...prev, newIntegration]);
          
          // Simulate data import
          if (onDataImport) {
            onDataImport({
              source: file.name,
              records: newIntegration.recordsImported,
              timestamp: new Date()
            });
          }
          
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  const syncIntegration = (id: string) => {
    setIntegrations(prev => prev.map(int => 
      int.id === id ? { ...int, status: 'syncing' } : int
    ));

    // Simulate sync process
    setTimeout(() => {
      setIntegrations(prev => prev.map(int => 
        int.id === id ? { 
          ...int, 
          status: 'connected', 
          lastSync: new Date(),
          recordsImported: (int.recordsImported || 0) + Math.floor(Math.random() * 100)
        } : int
      ));
    }, 2000);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle size={16} className="status-icon connected" />;
      case 'disconnected':
        return <AlertCircle size={16} className="status-icon disconnected" />;
      case 'syncing':
        return <RefreshCw size={16} className="status-icon syncing" />;
      case 'error':
        return <AlertCircle size={16} className="status-icon error" />;
      default:
        return <Clock size={16} className="status-icon" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'api':
        return <Server size={20} />;
      case 'file':
        return <FileSpreadsheet size={20} />;
      case 'webhook':
        return <Webhook size={20} />;
      case 'database':
        return <Database size={20} />;
      default:
        return <Cloud size={20} />;
    }
  };

  const formatLastSync = (date?: Date) => {
    if (!date) return 'Never';
    const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
    if (minutes < 60) return `${minutes} minutes ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hours ago`;
    return `${Math.floor(hours / 24)} days ago`;
  };

  return (
    <div className="integration-hub">
      <div className="hub-header">
        <div className="header-title">
          <Link size={20} />
          <h3>Integration Hub</h3>
        </div>
        <div className="header-stats">
          <span className="stat">
            <span className="stat-value">{integrations.filter(i => i.status === 'connected').length}</span>
            <span className="stat-label">Active</span>
          </span>
          <span className="stat">
            <span className="stat-value">{integrations.reduce((sum, i) => sum + (i.recordsImported || 0), 0)}</span>
            <span className="stat-label">Records</span>
          </span>
        </div>
      </div>

      <div className="hub-tabs">
        <button 
          className={`tab ${activeTab === 'connections' ? 'active' : ''}`}
          onClick={() => setActiveTab('connections')}
        >
          <Database size={16} />
          Connections
        </button>
        <button 
          className={`tab ${activeTab === 'upload' ? 'active' : ''}`}
          onClick={() => setActiveTab('upload')}
        >
          <Upload size={16} />
          Upload
        </button>
        <button 
          className={`tab ${activeTab === 'api' ? 'active' : ''}`}
          onClick={() => setActiveTab('api')}
        >
          <Code size={16} />
          API Docs
        </button>
        <button 
          className={`tab ${activeTab === 'webhooks' ? 'active' : ''}`}
          onClick={() => setActiveTab('webhooks')}
        >
          <Webhook size={16} />
          Webhooks
        </button>
      </div>

      <div className="hub-content">
        {activeTab === 'connections' && (
          <div className="connections-panel">
            <div className="connections-list">
              {integrations.map(integration => (
                <div key={integration.id} className="integration-card">
                  <div className="integration-icon">
                    {getTypeIcon(integration.type)}
                  </div>
                  <div className="integration-info">
                    <div className="integration-name">
                      {integration.name}
                      {getStatusIcon(integration.status)}
                    </div>
                    <div className="integration-details">
                      {integration.endpoint && (
                        <span className="detail endpoint">{integration.endpoint}</span>
                      )}
                      <span className="detail">
                        Last sync: {formatLastSync(integration.lastSync)}
                      </span>
                      {integration.recordsImported && (
                        <span className="detail">
                          {integration.recordsImported} records
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="integration-actions">
                    {integration.status === 'disconnected' ? (
                      <button 
                        className="action-btn connect"
                        onClick={() => syncIntegration(integration.id)}
                      >
                        Connect
                      </button>
                    ) : (
                      <button 
                        className="action-btn sync"
                        onClick={() => syncIntegration(integration.id)}
                        disabled={integration.status === 'syncing'}
                      >
                        {integration.status === 'syncing' ? 'Syncing...' : 'Sync Now'}
                      </button>
                    )}
                    <button className="action-btn settings">
                      <Settings size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="add-integration">
              <h4>Available Integrations</h4>
              <div className="integration-options">
                <button className="integration-option">
                  <img src="https://via.placeholder.com/32" alt="Oracle" />
                  <span>Oracle Cloud</span>
                </button>
                <button className="integration-option">
                  <img src="https://via.placeholder.com/32" alt="Salesforce" />
                  <span>Salesforce</span>
                </button>
                <button className="integration-option">
                  <img src="https://via.placeholder.com/32" alt="Microsoft" />
                  <span>Microsoft 365</span>
                </button>
                <button className="integration-option">
                  <img src="https://via.placeholder.com/32" alt="AWS" />
                  <span>AWS</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'upload' && (
          <div className="upload-panel">
            <div 
              className="upload-zone"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls,.json"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
              <Upload size={48} />
              <h3>Upload Data File</h3>
              <p>Drag and drop or click to browse</p>
              <p className="file-types">Supports CSV, Excel, JSON</p>
            </div>

            {isUploading && (
              <div className="upload-progress">
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <span className="progress-text">{uploadProgress}%</span>
              </div>
            )}

            <div className="recent-uploads">
              <h4>Recent Uploads</h4>
              {integrations
                .filter(i => i.type === 'file')
                .slice(-5)
                .reverse()
                .map(upload => (
                  <div key={upload.id} className="upload-item">
                    <FileSpreadsheet size={16} />
                    <span className="upload-name">{upload.name}</span>
                    <span className="upload-time">{formatLastSync(upload.lastSync)}</span>
                    <span className="upload-records">{upload.recordsImported} records</span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {activeTab === 'api' && (
          <div className="api-panel">
            <div className="api-info">
              <h3>REST API Documentation</h3>
              <p>Access your APM data programmatically</p>
              
              <div className="api-section">
                <h4>Base URL</h4>
                <code className="api-code">https://api.DataChart-apm.com/v1</code>
              </div>

              <div className="api-section">
                <h4>Authentication</h4>
                <code className="api-code">
                  Authorization: Bearer YOUR_API_KEY
                </code>
              </div>

              <div className="api-section">
                <h4>Endpoints</h4>
                <div className="endpoint">
                  <span className="method get">GET</span>
                  <code>/applications</code>
                  <span className="description">List all applications</span>
                </div>
                <div className="endpoint">
                  <span className="method post">POST</span>
                  <code>/applications</code>
                  <span className="description">Create new application</span>
                </div>
                <div className="endpoint">
                  <span className="method get">GET</span>
                  <code>/metrics/dashboard</code>
                  <span className="description">Get dashboard metrics</span>
                </div>
                <div className="endpoint">
                  <span className="method get">GET</span>
                  <code>/vendors</code>
                  <span className="description">List vendor information</span>
                </div>
                <div className="endpoint">
                  <span className="method post">POST</span>
                  <code>/import/csv</code>
                  <span className="description">Import CSV data</span>
                </div>
              </div>

              <div className="api-section">
                <h4>GraphQL Endpoint</h4>
                <code className="api-code">https://api.DataChart-apm.com/graphql</code>
              </div>

              <button className="download-btn">
                <Download size={16} />
                Download Full API Documentation
              </button>
            </div>
          </div>
        )}

        {activeTab === 'webhooks' && (
          <div className="webhooks-panel">
            <div className="webhook-info">
              <h3>Webhook Configuration</h3>
              <p>Receive real-time updates when data changes</p>

              <div className="webhook-url">
                <h4>Your Webhook URL</h4>
                <div className="url-box">
                  <code>https://apm.DataChart.com/webhooks/abc123def456</code>
                  <button className="copy-btn">Copy</button>
                </div>
              </div>

              <div className="webhook-events">
                <h4>Event Subscriptions</h4>
                <label className="event-option">
                  <input type="checkbox" defaultChecked />
                  <span>Application Created</span>
                </label>
                <label className="event-option">
                  <input type="checkbox" defaultChecked />
                  <span>Application Updated</span>
                </label>
                <label className="event-option">
                  <input type="checkbox" />
                  <span>Renewal Due</span>
                </label>
                <label className="event-option">
                  <input type="checkbox" defaultChecked />
                  <span>Compliance Alert</span>
                </label>
                <label className="event-option">
                  <input type="checkbox" />
                  <span>Cost Threshold Exceeded</span>
                </label>
              </div>

              <div className="webhook-test">
                <h4>Test Webhook</h4>
                <button className="test-btn">
                  Send Test Event
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default IntegrationHub;
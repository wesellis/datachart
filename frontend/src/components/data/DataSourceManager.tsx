import React from 'react';

const DataSourceManager: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Data Source Manager</h1>
        <div className="bg-slate-800/50 rounded-xl p-8">
          <div className="text-slate-400 text-lg mb-4">
            Configure your data connections
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-700/50 rounded-lg p-6 text-center">
              <div className="text-blue-400 text-3xl mb-3">❄️</div>
              <h3 className="font-semibold mb-2">Snowflake</h3>
              <p className="text-slate-400 text-sm">Enterprise data warehouse</p>
            </div>
            <div className="bg-slate-700/50 rounded-lg p-6 text-center">
              <div className="text-blue-400 text-3xl mb-3">☁️</div>
              <h3 className="font-semibold mb-2">Azure</h3>
              <p className="text-slate-400 text-sm">Microsoft cloud services</p>
            </div>
            <div className="bg-slate-700/50 rounded-lg p-6 text-center">
              <div className="text-blue-400 text-3xl mb-3">🔧</div>
              <h3 className="font-semibold mb-2">ServiceNow</h3>
              <p className="text-slate-400 text-sm">IT service management</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataSourceManager;
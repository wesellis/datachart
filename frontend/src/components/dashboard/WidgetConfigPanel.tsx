import React, { useState } from 'react';
import { X, Database, Settings, Link, RefreshCw, Save } from 'lucide-react';

interface WidgetConfigPanelProps {
  widget: any;
  dataSources: any[];
  onSave: (config: any) => void;
  onClose: () => void;
}

const WidgetConfigPanel: React.FC<WidgetConfigPanelProps> = ({
  widget,
  dataSources,
  onSave,
  onClose
}) => {
  const [config, setConfig] = useState({
    title: widget.title || '',
    dataSource: widget.dataSource || '',
    refreshRate: widget.refreshRate || 30,
    query: widget.query || '',
    aggregation: widget.aggregation || 'sum',
    groupBy: widget.groupBy || '',
    filters: widget.filters || [],
    visualization: widget.visualization || {},
    thresholds: widget.thresholds || { warning: 0, critical: 0 },
    format: widget.format || 'number'
  });

  const handleSave = () => {
    onSave({
      ...widget,
      ...config
    });
    onClose();
  };

  const addFilter = () => {
    setConfig({
      ...config,
      filters: [...config.filters, { field: '', operator: '=', value: '' }]
    });
  };

  const updateFilter = (index: number, field: string, value: any) => {
    const newFilters = [...config.filters];
    newFilters[index] = { ...newFilters[index], [field]: value };
    setConfig({ ...config, filters: newFilters });
  };

  const removeFilter = (index: number) => {
    setConfig({
      ...config,
      filters: config.filters.filter((_: any, i: number) => i !== index)
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
      <div 
        className="bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          border: '1px solid rgba(255,255,255,0.1)'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <Settings className="w-5 h-5 text-blue-400" />
            <h2 className="text-xl font-bold text-white">Configure Widget</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Basic Settings */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Widget Title
              </label>
              <input
                type="text"
                value={config.title}
                onChange={(e) => setConfig({ ...config, title: e.target.value })}
                className="w-full px-4 py-2 bg-slate-900/50 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-400"
                placeholder="Enter widget title..."
              />
            </div>

            {/* Data Source Selection */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                <Database className="w-4 h-4 inline mr-2" />
                Data Source
              </label>
              <select
                value={config.dataSource}
                onChange={(e) => setConfig({ ...config, dataSource: e.target.value })}
                className="w-full px-4 py-2 bg-slate-900/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-400"
              >
                <option value="">Select a data source...</option>
                {dataSources.map((source) => (
                  <option key={source.id} value={source.id}>
                    {source.name} ({source.type})
                  </option>
                ))}
              </select>
            </div>

            {/* Query Configuration */}
            {config.dataSource && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Query / Metric
                  </label>
                  <textarea
                    value={config.query}
                    onChange={(e) => setConfig({ ...config, query: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-900/50 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-400 font-mono text-sm"
                    rows={3}
                    placeholder="SELECT * FROM orders WHERE status = 'active'"
                  />
                </div>

                {/* Aggregation */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Aggregation
                    </label>
                    <select
                      value={config.aggregation}
                      onChange={(e) => setConfig({ ...config, aggregation: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-900/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-400"
                    >
                      <option value="sum">Sum</option>
                      <option value="avg">Average</option>
                      <option value="min">Minimum</option>
                      <option value="max">Maximum</option>
                      <option value="count">Count</option>
                      <option value="distinct">Distinct Count</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Group By
                    </label>
                    <input
                      type="text"
                      value={config.groupBy}
                      onChange={(e) => setConfig({ ...config, groupBy: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-900/50 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-400"
                      placeholder="category, date"
                    />
                  </div>
                </div>

                {/* Filters */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-slate-300">
                      Filters
                    </label>
                    <button
                      onClick={addFilter}
                      className="text-xs px-2 py-1 bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/30 transition-colors"
                    >
                      + Add Filter
                    </button>
                  </div>
                  <div className="space-y-2">
                    {config.filters.map((filter: any, index: number) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          value={filter.field}
                          onChange={(e) => updateFilter(index, 'field', e.target.value)}
                          className="flex-1 px-3 py-1.5 bg-slate-900/50 border border-white/10 rounded text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-400"
                          placeholder="Field"
                        />
                        <select
                          value={filter.operator}
                          onChange={(e) => updateFilter(index, 'operator', e.target.value)}
                          className="px-3 py-1.5 bg-slate-900/50 border border-white/10 rounded text-white text-sm focus:outline-none focus:border-blue-400"
                        >
                          <option value="=">=</option>
                          <option value="!=">!=</option>
                          <option value="&gt;">&gt;</option>
                          <option value="&lt;">&lt;</option>
                          <option value="&gt;=">&gt;=</option>
                          <option value="&lt;=">&lt;=</option>
                          <option value="contains">contains</option>
                        </select>
                        <input
                          type="text"
                          value={filter.value}
                          onChange={(e) => updateFilter(index, 'value', e.target.value)}
                          className="flex-1 px-3 py-1.5 bg-slate-900/50 border border-white/10 rounded text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-400"
                          placeholder="Value"
                        />
                        <button
                          onClick={() => removeFilter(index)}
                          className="p-1.5 hover:bg-red-500/20 rounded text-red-400 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Refresh Rate */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    <RefreshCw className="w-4 h-4 inline mr-2" />
                    Refresh Rate (seconds)
                  </label>
                  <input
                    type="number"
                    value={config.refreshRate}
                    onChange={(e) => setConfig({ ...config, refreshRate: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 bg-slate-900/50 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-400"
                    min="5"
                    step="5"
                  />
                </div>

                {/* Thresholds for KPI widgets */}
                {widget.type === 'kpi' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Alert Thresholds
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-slate-400">Warning</label>
                        <input
                          type="number"
                          value={config.thresholds.warning}
                          onChange={(e) => setConfig({
                            ...config,
                            thresholds: { ...config.thresholds, warning: parseFloat(e.target.value) }
                          })}
                          className="w-full px-3 py-1.5 bg-slate-900/50 border border-white/10 rounded text-white text-sm focus:outline-none focus:border-yellow-400"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-400">Critical</label>
                        <input
                          type="number"
                          value={config.thresholds.critical}
                          onChange={(e) => setConfig({
                            ...config,
                            thresholds: { ...config.thresholds, critical: parseFloat(e.target.value) }
                          })}
                          className="w-full px-3 py-1.5 bg-slate-900/50 border border-white/10 rounded text-white text-sm focus:outline-none focus:border-red-400"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Format for display */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Display Format
                  </label>
                  <select
                    value={config.format}
                    onChange={(e) => setConfig({ ...config, format: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-900/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-400"
                  >
                    <option value="number">Number</option>
                    <option value="currency">Currency ($)</option>
                    <option value="percent">Percentage (%)</option>
                    <option value="decimal">Decimal (2 places)</option>
                    <option value="short">Short (1.2K, 3.4M)</option>
                  </select>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-white/10">
          <button
            onClick={onClose}
            className="px-6 py-2 text-slate-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
};

export default WidgetConfigPanel;
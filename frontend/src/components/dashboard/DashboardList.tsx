import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Calendar, Eye, Share2, Edit, Trash2, Search, Filter, BarChart3, X } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface Dashboard {
  id: string;
  name: string;
  description?: string;
  category?: string;
  theme: string;
  is_public: boolean;
  view_count: number;
  created_at: string;
  updated_at?: string;
  owner_id: string;
  tags: string[];
  widgets: any[];
}

const DashboardList: React.FC = () => {
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Fetch dashboards from API
  const fetchDashboards = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/v1/dashboards/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setDashboards(data);
      } else {
        throw new Error('Failed to fetch dashboards');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Create new dashboard
  const createDashboard = async (dashboardData: {
    name: string;
    description?: string;
    category?: string;
    theme: string;
    is_public: boolean;
    tags?: string[];
  }) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/v1/dashboards/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dashboardData),
      });

      if (response.ok) {
        const newDashboard = await response.json();
        setDashboards(prev => [newDashboard, ...prev]);
        setShowCreateModal(false);
        return newDashboard;
      } else {
        throw new Error('Failed to create dashboard');
      }
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  // Delete dashboard
  const deleteDashboard = async (dashboardId: string) => {
    if (!window.confirm('Are you sure you want to delete this dashboard?')) return;
    
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/v1/dashboards/${dashboardId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setDashboards(prev => prev.filter(d => d.id !== dashboardId));
      } else {
        throw new Error('Failed to delete dashboard');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete dashboard');
    }
  };

  useEffect(() => {
    fetchDashboards();
  }, []);

  // Filter dashboards based on search and category
  const filteredDashboards = dashboards.filter(dashboard => {
    const matchesSearch = dashboard.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (dashboard.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    const matchesCategory = !categoryFilter || dashboard.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Get unique categories for filter
  const categories = Array.from(new Set(dashboards.map(d => d.category).filter(Boolean)));

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboards...</p>
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
              <h1 className="text-3xl font-bold text-gray-900">My Dashboards</h1>
              <p className="text-gray-600 mt-1">Manage and create your APM dashboards</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Plus className="w-5 h-5" />
              New Dashboard
            </button>
          </div>

          {/* Search and Filter */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search dashboards..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Categories</option>
                {categories.map(category => category && (
                  <option key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDashboards.map(dashboard => (
            <div key={dashboard.id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-semibold text-gray-900 truncate">
                    {dashboard.name}
                  </h3>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => navigate(`/app/preview/${dashboard.id}`)}
                      className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                      title="View Dashboard"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => navigate(`/app/dashboard-builder?edit=${dashboard.id}`)}
                      className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                      title="Edit Dashboard"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteDashboard(dashboard.id)}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                      title="Delete Dashboard"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {dashboard.description && (
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {dashboard.description}
                  </p>
                )}

                {/* Tags */}
                {dashboard.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {dashboard.tags.slice(0, 3).map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                    {dashboard.tags.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                        +{dashboard.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}

                {/* Metadata */}
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(dashboard.created_at)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {dashboard.view_count} views
                    </span>
                  </div>
                  {dashboard.is_public && (
                    <span className="flex items-center gap-1 text-blue-600">
                      <Share2 className="w-3 h-3" />
                      Public
                    </span>
                  )}
                </div>

                {/* Category & Theme */}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                  {dashboard.category && (
                    <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded">
                      {dashboard.category}
                    </span>
                  )}
                  <div className="flex items-center gap-1">
                    <div className={`w-3 h-3 rounded-full ${dashboard.theme === 'dark' ? 'bg-gray-800' : 'bg-white border border-gray-300'}`}></div>
                    <span className="text-xs text-gray-500">{dashboard.theme}</span>
                  </div>
                </div>

                {/* Widget count */}
                <div className="mt-2 text-xs text-gray-500">
                  {dashboard.widgets.length} widgets
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredDashboards.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <BarChart3 className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || categoryFilter ? 'No matching dashboards' : 'No dashboards yet'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || categoryFilter 
                ? 'Try adjusting your search or filter criteria.'
                : 'Get started by creating your first dashboard.'
              }
            </p>
            {!searchTerm && !categoryFilter && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg inline-flex items-center gap-2 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Create Dashboard
              </button>
            )}
          </div>
        )}
      </div>

      {/* Create Dashboard Modal */}
      {showCreateModal && (
        <CreateDashboardModal
          onClose={() => setShowCreateModal(false)}
          onCreate={createDashboard}
        />
      )}
    </div>
  );
};

// Create Dashboard Modal Component
interface CreateDashboardModalProps {
  onClose: () => void;
  onCreate: (data: any) => Promise<any>;
}

const CreateDashboardModal: React.FC<CreateDashboardModalProps> = ({ onClose, onCreate }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    theme: 'dark',
    is_public: false,
    tags: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const dashboardData = {
        ...formData,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean)
      };
      await onCreate(dashboardData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Create New Dashboard</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dashboard Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter dashboard name"
              required
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
              placeholder="Describe your dashboard"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <input
              type="text"
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., analytics, monitoring, reporting"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="tag1, tag2, tag3"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Theme
            </label>
            <select
              value={formData.theme}
              onChange={(e) => setFormData(prev => ({ ...prev, theme: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="dark">Dark</option>
              <option value="light">Light</option>
            </select>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_public"
              checked={formData.is_public}
              onChange={(e) => setFormData(prev => ({ ...prev, is_public: e.target.checked }))}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="is_public" className="ml-2 text-sm text-gray-700">
              Make this dashboard public
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.name}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Creating...' : 'Create Dashboard'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DashboardList;
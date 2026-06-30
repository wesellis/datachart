import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

interface DashboardData {
  dashboard_id: string;
  customer_id: string;
  company_name: string;
  last_updated: string;
  metrics: {
    vendor: {
      data: {
        total_spend: number;
        vendor_count: number;
      }
    };
    applications: {
      data: {
        total_applications: number;
        compliance_rate: number;
      }
    };
    compliance: {
      data: {
        overall_compliance_score: number;
      }
    };
  };
}

const TenantDashboard: React.FC = () => {
  const { tenantId } = useParams<{ tenantId: string }>();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/v1/dashboards/${tenantId}/overview`);
        setData(response.data);
      } catch (err) {
        setError('Failed to load dashboard data');
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    if (tenantId) {
      fetchDashboardData();
    }
  }, [tenantId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-4xl mb-4">❌</div>
          <p className="text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">{data?.company_name}</h1>
            <p className="text-slate-400">Customer ID: {tenantId}</p>
          </div>
          <div className="text-sm text-slate-500">
            Last updated: {data?.last_updated ? new Date(data.last_updated).toLocaleString() : 'Unknown'}
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-xl p-6">
            <h3 className="text-slate-400 text-sm font-medium mb-2">Total Spend</h3>
            <div className="text-2xl font-bold text-blue-400">
              ${data?.metrics.vendor?.data.total_spend ? (data.metrics.vendor.data.total_spend / 1000000).toFixed(1) + 'M' : 'N/A'}
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-xl p-6">
            <h3 className="text-slate-400 text-sm font-medium mb-2">Vendors</h3>
            <div className="text-2xl font-bold text-green-400">
              {data?.metrics.vendor?.data.vendor_count || 'N/A'}
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-xl p-6">
            <h3 className="text-slate-400 text-sm font-medium mb-2">Applications</h3>
            <div className="text-2xl font-bold text-purple-400">
              {data?.metrics.applications?.data.total_applications || 'N/A'}
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-xl p-6">
            <h3 className="text-slate-400 text-sm font-medium mb-2">Compliance Score</h3>
            <div className="text-2xl font-bold text-yellow-400">
              {data?.metrics.compliance?.data.overall_compliance_score?.toFixed(1) || 'N/A'}%
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">Dashboard Status</h2>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-green-400">Connected to backend API</span>
          </div>
          <div className="flex items-center gap-3 mt-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-blue-400">Live data integration active</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TenantDashboard;
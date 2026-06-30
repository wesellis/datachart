import React from 'react';
import { useParams } from 'react-router-dom';

const DashboardPreview: React.FC = () => {
  const { dashboardId } = useParams<{ dashboardId: string }>();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Dashboard Preview</h1>
        <div className="bg-slate-800/50 rounded-xl p-8 text-center">
          <div className="text-slate-400 text-lg">
            Previewing Dashboard: {dashboardId}
          </div>
          <p className="text-slate-500 mt-2">
            Dashboard preview functionality will be implemented here.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DashboardPreview;
import React, { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

interface VendorBreakdownProps {
  vendorTotals: Record<string, any>;
}

const VendorBreakdown: React.FC<VendorBreakdownProps> = ({ vendorTotals }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDarkMode(document.documentElement.getAttribute('data-theme') === 'dark');
    };
    checkDarkMode();
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);
  
  // Hardcoded chart data
  const chartData = {
    labels: ['Microsoft', 'Oracle', 'Salesforce', 'ServiceNow', 'Adobe', 'SAP', 'Workday', 'Slack'],
    datasets: [{
      data: [2400000, 1800000, 1500000, 1200000, 980000, 850000, 720000, 650000],
      backgroundColor: [
        '#2563eb',
        '#10b981',
        '#3b82f6',
        '#60a5fa',
        '#fbbf24',
        '#93c5fd',
        '#34d399',
        '#f59e0b'
      ],
      borderColor: isDarkMode ? '#1e293b' : '#ffffff',
      borderWidth: 2
    }]
  };
  
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          padding: 15,
          color: isDarkMode ? '#cbd5e1' : '#64748b',
          font: { size: 11 }
        }
      },
      title: {
        display: true,
        text: 'Vendor Spend Distribution',
        font: { size: 16, weight: 'bold' as const },
        color: isDarkMode ? '#f1f5f9' : '#1e293b',
        padding: { bottom: 20 }
      }
    }
  };
  
  // Add debug div to verify component renders
  return (
    <div style={{ width: '100%', height: '300px', position: 'relative', padding: '10px' }}>
      <div style={{ width: '100%', height: '100%' }}>
        <Doughnut data={chartData} options={options} />
      </div>
    </div>
  );
};

export default VendorBreakdown;

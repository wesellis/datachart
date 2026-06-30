import React, { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { MonthlyTrend } from '../../services/apmService';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface SpendingChartProps {
  monthlyTrend: MonthlyTrend[];
}

const SpendingChart: React.FC<SpendingChartProps> = ({ monthlyTrend }) => {
  const [chartData, setChartData] = useState<any>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  useEffect(() => {
    // Check for dark mode
    const checkDarkMode = () => {
      setIsDarkMode(document.documentElement.getAttribute('data-theme') === 'dark');
    };
    
    checkDarkMode();
    
    // Watch for theme changes
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    
    return () => observer.disconnect();
  }, []);
  
  useEffect(() => {
    if (monthlyTrend && monthlyTrend.length > 0) {
      const labels = monthlyTrend.map(item => item.month);
      const data2024 = monthlyTrend.map(item => item.spend_2024);
      const data2025 = monthlyTrend.map(item => item.spend_2025);
      
      setChartData({
        labels,
        datasets: [
          {
            label: '2024 Spending',
            data: data2024,
            borderColor: '#94a3b8',
            backgroundColor: 'rgba(148, 163, 184, 0.1)',
            tension: 0.4,
            borderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
          },
          {
            label: '2025 Spending',
            data: data2025,
            borderColor: '#2563eb',
            backgroundColor: 'rgba(37, 99, 235, 0.1)',
            tension: 0.4,
            borderWidth: 3,
            pointRadius: 4,
            pointHoverRadius: 6,
          }
        ]
      });
    }
  }, [monthlyTrend, isDarkMode]);
  
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          padding: 20,
          color: isDarkMode ? '#cbd5e1' : '#64748b',
          font: {
            size: 12,
            weight: 'normal' as const
          }
        }
      },
      title: {
        display: true,
        text: 'Monthly Spending Trend',
        font: {
          size: 16,
          weight: 'bold' as const
        },
        color: isDarkMode ? '#f1f5f9' : '#1e293b',
        padding: {
          bottom: 20
        }
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const value = context.parsed.y;
            if (value === null) return '';
            return `${context.dataset.label}: $${(value / 1000000).toFixed(2)}M`;
          }
        },
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        cornerRadius: 8,
      }
    },
    scales: {
      y: {
        ticks: {
          callback: (value: any) => `$${(value / 1000000).toFixed(1)}M`,
          color: isDarkMode ? '#94a3b8' : '#64748b',
          font: {
            size: 11
          }
        },
        grid: {
          color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: isDarkMode ? '#94a3b8' : '#64748b',
          font: {
            size: 11
          }
        }
      }
    }
  };
  
  if (!chartData) return <div className="chart-loading">Loading chart...</div>;
  
  return (
    <div className="spending-chart">
      <Line options={options} data={chartData} height={300} />
    </div>
  );
};

export default SpendingChart;
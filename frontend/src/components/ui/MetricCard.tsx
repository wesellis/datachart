import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: {
    value: string;
    type: 'positive' | 'negative' | 'neutral';
    icon?: React.ReactNode;
  };
  icon?: {
    component: LucideIcon;
    gradient: string;
  };
  tooltip?: string;
  status?: 'live' | 'cached';
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  icon,
  tooltip,
  status = 'live',
  className = ''
}) => {
  const statusClasses = {
    live: 'bg-green-500/20 text-green-400 border-green-500/30',
    cached: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
  };

  const changeClasses = {
    positive: 'text-green-400',
    negative: 'text-red-400',
    neutral: 'text-gray-400'
  };

  return (
    <div className={`
      relative overflow-hidden transition-all duration-300 ease-in-out
      bg-slate-800/60 backdrop-blur-xl border border-white/10 
      rounded-2xl p-6 hover:transform hover:-translate-y-1 
      hover:shadow-2xl hover:border-blue-500/30 
      before:absolute before:top-0 before:left-0 before:right-0 before:h-1
      before:bg-gradient-to-r before:from-blue-500 before:via-purple-500 before:to-pink-500
      ${className}
    `}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="text-sm text-slate-400 font-medium uppercase tracking-wider">
              {title}
              {tooltip && (
                <span 
                  className="ml-2 w-4 h-4 rounded-full bg-slate-700 inline-flex items-center justify-center text-xs cursor-help"
                  title={tooltip}
                >
                  ?
                </span>
              )}
            </div>
            <span className={`
              inline-flex items-center px-2 py-1 rounded-xl text-xs font-semibold
              border ${statusClasses[status]}
            `}>
              <div className="w-1 h-1 rounded-full bg-current mr-1 animate-pulse"></div>
              {status.toUpperCase()}
            </span>
          </div>
          <div className="text-4xl font-bold text-white mb-2 leading-none">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </div>
          {change && (
            <div className={`flex items-center gap-1 text-sm font-semibold ${changeClasses[change.type]}`}>
              {change.icon}
              <span>{change.value}</span>
            </div>
          )}
        </div>
        
        {icon && (
          <div className={`
            w-12 h-12 rounded-xl flex items-center justify-center
            bg-gradient-to-br ${icon.gradient}
          `}>
            <icon.component className="w-6 h-6 text-white" />
          </div>
        )}
      </div>
    </div>
  );
};

export default MetricCard;

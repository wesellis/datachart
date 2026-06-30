import React, { useState } from 'react';
import { Download, Maximize2, Minimize2 } from 'lucide-react';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onExport?: () => void;
  onFullscreen?: () => void;
  isFullscreen?: boolean;
  className?: string;
  controls?: React.ReactNode;
}

export const ChartCard: React.FC<ChartCardProps> = ({
  title,
  subtitle,
  children,
  onExport,
  onFullscreen,
  isFullscreen = false,
  className = '',
  controls
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      className={`
        relative bg-slate-800/60 backdrop-blur-xl border border-white/10 
        rounded-2xl p-6 transition-all duration-300 ease-in-out
        hover:transform hover:-translate-y-0.5 hover:shadow-2xl hover:border-blue-500/30
        ${isFullscreen ? 'fixed inset-0 z-50 m-0 rounded-none bg-slate-900/95' : ''}
        ${className}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-xl font-bold text-white mb-1">
            {title}
          </h3>
          {subtitle && (
            <p className="text-sm text-slate-400">
              {subtitle}
            </p>
          )}
        </div>
        
        <div className={`
          flex items-center gap-2 transition-opacity duration-200
          ${isHovered ? 'opacity-100' : 'opacity-70'}
        `}>
          {controls}
          
          {onExport && (
            <button
              onClick={onExport}
              className="
                p-2 rounded-lg bg-white/5 border border-white/10 
                text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 
                hover:border-blue-500/30 transition-all duration-200
              "
              title="Export chart"
            >
              <Download className="w-4 h-4" />
            </button>
          )}
          
          {onFullscreen && (
            <button
              onClick={onFullscreen}
              className="
                p-2 rounded-lg bg-white/5 border border-white/10 
                text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 
                hover:border-blue-500/30 transition-all duration-200
              "
              title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </button>
          )}
        </div>
      </div>
      
      <div className={`
        ${isFullscreen ? 'h-[calc(100vh-120px)]' : 'h-96'}
        relative
      `}>
        {children}
      </div>
    </div>
  );
};

export default ChartCard;

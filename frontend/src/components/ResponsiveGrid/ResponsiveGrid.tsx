import React, { useEffect, useState } from 'react';
import '../../styles/responsive.css';

interface ResponsiveGridProps {
  children: React.ReactNode;
  className?: string;
}

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({ children, className = '' }) => {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
      setIsTablet(window.innerWidth >= 768 && window.innerWidth < 1024);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  return (
    <div 
      className={`dashboard-grid ${className} ${isMobile ? 'mobile-view' : ''} ${isTablet ? 'tablet-view' : ''}`}
      data-mobile={isMobile}
      data-tablet={isTablet}
    >
      {children}
    </div>
  );
};

interface WidgetProps {
  children: React.ReactNode;
  cols?: number;
  rows?: number;
  className?: string;
}

export const Widget: React.FC<WidgetProps> = ({ 
  children, 
  cols = 3, 
  rows = 1, 
  className = '' 
}) => {
  return (
    <div className={`widget-col-${cols} widget-row-${rows} ${className}`}>
      {children}
    </div>
  );
};

export default ResponsiveGrid;

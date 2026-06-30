import React from 'react';

const SkeletonLoader: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`skeleton-loader ${className}`}>
      <div className="animate-pulse bg-gray-700 rounded h-4 w-full"></div>
    </div>
  );
};

export default SkeletonLoader;

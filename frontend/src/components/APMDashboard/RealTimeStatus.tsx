import React, { useState, useEffect } from 'react';
import { Activity, RefreshCw, Wifi, WifiOff } from 'lucide-react';

interface RealTimeStatusProps {
  lastUpdate?: Date;
  isConnected?: boolean;
  refreshInterval?: number;
  onRefresh?: () => void;
}

const RealTimeStatus: React.FC<RealTimeStatusProps> = ({ 
  lastUpdate = new Date(), 
  isConnected = true, 
  refreshInterval = 30,
  onRefresh 
}) => {
  const [timeAgo, setTimeAgo] = useState('just now');
  const [nextRefresh, setNextRefresh] = useState(refreshInterval);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const updateTimeAgo = () => {
      const now = new Date();
      const diff = Math.floor((now.getTime() - lastUpdate.getTime()) / 1000);
      
      if (diff < 5) {
        setTimeAgo('just now');
      } else if (diff < 60) {
        setTimeAgo(`${diff} seconds ago`);
      } else if (diff < 3600) {
        const minutes = Math.floor(diff / 60);
        setTimeAgo(`${minutes} minute${minutes > 1 ? 's' : ''} ago`);
      } else {
        const hours = Math.floor(diff / 3600);
        setTimeAgo(`${hours} hour${hours > 1 ? 's' : ''} ago`);
      }
    };

    updateTimeAgo();
    const interval = setInterval(updateTimeAgo, 1000);
    return () => clearInterval(interval);
  }, [lastUpdate]);

  useEffect(() => {
    const countdown = setInterval(() => {
      setNextRefresh((prev) => {
        if (prev <= 1) {
          handleRefresh();
          return refreshInterval;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(countdown);
  }, [refreshInterval]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    if (onRefresh) {
      await onRefresh();
    }
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  return (
    <div style={{
      background: 'var(--widget-background, white)',
      borderRadius: '12px',
      padding: '16px',
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      border: '1px solid var(--border-color, #e2e8f0)',
      height: '100%',
    }}>
      {/* Status Indicator */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}>
        <div style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {isConnected ? (
            <>
              <div style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: '#10b981',
                animation: 'pulse-green 2s infinite',
              }} />
              <div style={{
                position: 'absolute',
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                background: '#10b981',
                opacity: 0.3,
                animation: 'pulse-ring 2s infinite',
              }} />
            </>
          ) : (
            <div style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: '#ef4444',
            }} />
          )}
        </div>
        <div>
          <div style={{ 
            fontSize: '12px', 
            fontWeight: 600, 
            color: isConnected ? '#10b981' : '#ef4444' 
          }}>
            {isConnected ? 'LIVE' : 'OFFLINE'}
          </div>
      </div>
        </div>

      {/* Divider */}
      <div style={{
        width: '1px',
        height: '32px',
        background: 'var(--border-color, #e2e8f0)',
      }} />

      {/* Refresh Info */}
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '12px', color: 'var(--text-secondary, #475569)', marginBottom: '4px' }}>
          Auto-refresh in {nextRefresh}s
        </div>
        <div style={{
          width: '100%',
          height: '4px',
          background: 'var(--widget-background-hover, #f1f5f9)',
          borderRadius: '2px',
          overflow: 'hidden',
        }}>
          <div style={{
            width: `${(nextRefresh / refreshInterval) * 100}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)',
            transition: 'width 1s linear',
          }} />
        </div>
      </div>

      {/* Manual Refresh Button */}
      <button
        onClick={handleRefresh}
        disabled={isRefreshing}
        style={{
          padding: '8px',
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          cursor: isRefreshing ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => !isRefreshing && (e.currentTarget.style.background = '#f1f5f9')}
        onMouseLeave={(e) => e.currentTarget.style.background = '#f8fafc'}
      >
        <RefreshCw 
          size={16} 
          style={{
            animation: isRefreshing ? 'spin 1s linear infinite' : 'none',
            color: '#64748b',
          }}
        />
      </button>

      {/* Connection Icon */}
      <div style={{ color: '#64748b' }}>
        {isConnected ? <Wifi size={16} /> : <WifiOff size={16} />}
      </div>

      <style>{`
        @keyframes pulse-green {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes pulse-ring {
          0% { transform: scale(1); opacity: 0.3; }
          100% { transform: scale(1.5); opacity: 0; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default RealTimeStatus;
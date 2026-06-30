// Number formatting utilities for consistent display

export const formatNumber = (num: number | string): string => {
  const n = typeof num === 'string' ? parseFloat(num) : num;
  if (isNaN(n)) return '0';
  
  // For millions/billions
  if (n >= 1000000000) {
    return '$' + (n / 1000000000).toFixed(1) + 'B';
  }
  if (n >= 1000000) {
    return '$' + (n / 1000000).toFixed(1) + 'M';
  }
  
  // Add commas for thousands
  return n.toLocaleString('en-US');
};

export const formatPercent = (num: number | string): string => {
  const n = typeof num === 'string' ? parseFloat(num) : num;
  if (isNaN(n)) return '0.0%';
  return n.toFixed(1) + '%';
};

export const formatChange = (num: number | string): string => {
  const n = typeof num === 'string' ? parseFloat(num) : num;
  if (isNaN(n)) return '+0.0%';
  const prefix = n >= 0 ? '+' : '';
  return prefix + n.toFixed(1) + '%';
};

export const formatCurrency = (num: number | string): string => {
  const n = typeof num === 'string' ? parseFloat(num) : num;
  if (isNaN(n)) return '$0';
  
  if (n >= 1000000000) {
    return '$' + (n / 1000000000).toFixed(1) + 'B';
  }
  if (n >= 1000000) {
    return '$' + (n / 1000000).toFixed(1) + 'M';
  }
  if (n >= 1000) {
    return '$' + (n / 1000).toFixed(1) + 'K';
  }
  
  return '$' + n.toFixed(0);
};

export const getTimeAgo = (timestamp: Date | string): string => {
  const now = new Date();
  const then = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);
  
  if (seconds < 30) return 'Just now';
  if (seconds < 60) return seconds + 's ago';
  if (seconds < 3600) return Math.floor(seconds / 60) + 'm ago';
  if (seconds < 86400) return Math.floor(seconds / 3600) + 'h ago';
  return Math.floor(seconds / 86400) + 'd ago';
};

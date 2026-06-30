import React, { ReactNode } from 'react';
import { Box, Typography } from '@mui/material';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'neutral';
  };
  color?: 'primary' | 'success' | 'warning' | 'error' | 'info';
  isDarkMode?: boolean;
  format?: 'number' | 'currency' | 'percentage';
  size?: 'small' | 'medium' | 'large';
}

const colorMap = {
  primary: { light: '#dbeafe', main: '#3b82f6', dark: 'rgba(59, 130, 246, 0.15)' },
  success: { light: '#dcfce7', main: '#22c55e', dark: 'rgba(34, 197, 94, 0.15)' },
  warning: { light: '#fef3c7', main: '#f59e0b', dark: 'rgba(245, 158, 11, 0.15)' },
  error: { light: '#fee2e2', main: '#ef4444', dark: 'rgba(239, 68, 68, 0.15)' },
  info: { light: '#e0e7ff', main: '#6366f1', dark: 'rgba(99, 102, 241, 0.15)' }
};

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon,
  trend,
  color = 'primary',
  isDarkMode = false,
  format = 'number',
  size = 'medium'
}) => {
  const formatValue = (val: string | number): string => {
    if (typeof val === 'string') return val;
    
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(val);
      case 'percentage':
        return `${val}%`;
      default:
        return new Intl.NumberFormat('en-US').format(val);
    }
  };

  const sizeConfig = {
    small: { padding: '12px', valueSize: '1.25rem', labelSize: '0.75rem' },
    medium: { padding: '16px', valueSize: '1.5rem', labelSize: '0.875rem' },
    large: { padding: '20px', valueSize: '2rem', labelSize: '1rem' }
  };

  const config = sizeConfig[size];
  const colorConfig = colorMap[color];

  return (
    <Box
      sx={{
        padding: config.padding,
        borderRadius: '8px',
        background: isDarkMode ? colorConfig.dark : colorConfig.light,
        border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : colorConfig.main}33`,
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: isDarkMode 
            ? '0 4px 6px rgba(0, 0, 0, 0.3)' 
            : '0 4px 6px rgba(0, 0, 0, 0.1)'
        }
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <Box sx={{ flex: 1 }}>
          <Typography
            sx={{
              fontSize: config.labelSize,
              color: 'var(--text-secondary, #64748b)',
              marginBottom: '4px',
              fontWeight: 500
            }}
          >
            {label}
          </Typography>
          <Typography
            sx={{
              fontSize: config.valueSize,
              fontWeight: 700,
              color: colorConfig.main,
              lineHeight: 1.2
            }}
          >
            {formatValue(value)}
          </Typography>
          {trend && (
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 0.5,
              marginTop: '8px'
            }}>
              {trend.direction === 'up' && (
                <TrendingUp size={14} color="#22c55e" />
              )}
              {trend.direction === 'down' && (
                <TrendingDown size={14} color="#ef4444" />
              )}
              {trend.direction === 'neutral' && (
                <Minus size={14} color="#64748b" />
              )}
              <Typography
                sx={{
                  fontSize: '0.75rem',
                  color: trend.direction === 'up' ? '#22c55e' : 
                         trend.direction === 'down' ? '#ef4444' : '#64748b',
                  fontWeight: 600
                }}
              >
                {trend.value}%
              </Typography>
            </Box>
          )}
        </Box>
        {icon && (
          <Box sx={{ 
            color: colorConfig.main,
            opacity: 0.8,
            display: 'flex',
            alignItems: 'center'
          }}>
            {icon}
          </Box>
        )}
      </Box>
    </Box>
  );
};
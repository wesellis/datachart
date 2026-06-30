import React, { ReactNode } from 'react';
import { Box, Card, CardContent, Typography, IconButton } from '@mui/material';
import { MoreVertical, TrendingUp, TrendingDown } from 'lucide-react';

interface ModuleCardProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  children: ReactNode;
  trend?: {
    value: number;
    label: string;
    positive?: boolean;
  };
  actions?: ReactNode;
  isDarkMode?: boolean;
  className?: string;
  headerColor?: string;
}

export const ModuleCard: React.FC<ModuleCardProps> = ({
  title,
  subtitle,
  icon,
  children,
  trend,
  actions,
  isDarkMode = false,
  className = '',
  headerColor
}) => {
  return (
    <Card 
      className={className}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--widget-background, white)',
        borderRadius: '12px',
        border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : '#e5e7eb'}`,
        transition: 'all 0.3s ease',
        '&:hover': {
          boxShadow: isDarkMode 
            ? '0 4px 6px rgba(0, 0, 0, 0.3)' 
            : '0 4px 6px rgba(0, 0, 0, 0.1)',
          transform: 'translateY(-2px)'
        }
      }}
    >
      <Box
        sx={{
          padding: '16px 20px',
          borderBottom: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : '#e5e7eb'}`,
          background: headerColor || 'transparent',
          borderRadius: '12px 12px 0 0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {icon && (
            <Box sx={{ 
              color: isDarkMode ? '#60a5fa' : '#3b82f6',
              display: 'flex',
              alignItems: 'center'
            }}>
              {icon}
            </Box>
          )}
          <Box>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                color: 'var(--text-primary, #1e293b)',
                fontSize: '1rem'
              }}
            >
              {title}
            </Typography>
            {subtitle && (
              <Typography
                variant="body2"
                sx={{
                  color: 'var(--text-secondary, #64748b)',
                  fontSize: '0.875rem'
                }}
              >
                {subtitle}
              </Typography>
            )}
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {trend && (
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 0.5,
              padding: '4px 8px',
              borderRadius: '6px',
              background: trend.positive 
                ? (isDarkMode ? 'rgba(34, 197, 94, 0.15)' : '#f0fdf4')
                : (isDarkMode ? 'rgba(239, 68, 68, 0.15)' : '#fef2f2')
            }}>
              {trend.positive ? (
                <TrendingUp size={16} color={trend.positive ? '#22c55e' : '#ef4444'} />
              ) : (
                <TrendingDown size={16} color={trend.positive ? '#22c55e' : '#ef4444'} />
              )}
              <Typography
                variant="caption"
                sx={{
                  color: trend.positive ? '#22c55e' : '#ef4444',
                  fontWeight: 600
                }}
              >
                {trend.value}% {trend.label}
              </Typography>
            </Box>
          )}
          {actions || (
            <IconButton size="small">
              <MoreVertical size={18} />
            </IconButton>
          )}
        </Box>
      </Box>

      <CardContent sx={{ 
        flexGrow: 1, 
        padding: '20px',
        '&:last-child': { paddingBottom: '20px' }
      }}>
        {children}
      </CardContent>
    </Card>
  );
};
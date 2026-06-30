import React, { ReactNode } from 'react';
import { Box, Typography, IconButton, Menu, MenuItem } from '@mui/material';
import { Download, MoreVertical, Maximize2 } from 'lucide-react';

interface ChartWrapperProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  height?: number | string;
  isDarkMode?: boolean;
  onExport?: () => void;
  onFullscreen?: () => void;
  menuItems?: Array<{
    label: string;
    onClick: () => void;
    icon?: ReactNode;
  }>;
}

export const ChartWrapper: React.FC<ChartWrapperProps> = ({
  title,
  subtitle,
  children,
  height = 300,
  isDarkMode = false,
  onExport,
  onFullscreen,
  menuItems = []
}) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  return (
    <Box
      sx={{
        background: 'var(--widget-background, white)',
        borderRadius: '8px',
        border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : '#e5e7eb'}`,
        padding: '16px',
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start',
        marginBottom: '16px'
      }}>
        <Box>
          <Typography
            variant="h6"
            sx={{
              fontSize: '1rem',
              fontWeight: 600,
              color: 'var(--text-primary, #1e293b)'
            }}
          >
            {title}
          </Typography>
          {subtitle && (
            <Typography
              variant="body2"
              sx={{
                fontSize: '0.875rem',
                color: 'var(--text-secondary, #64748b)',
                marginTop: '2px'
              }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          {onExport && (
            <IconButton 
              size="small" 
              onClick={onExport}
              sx={{ 
                color: 'var(--text-secondary, #64748b)',
                '&:hover': {
                  background: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.04)'
                }
              }}
            >
              <Download size={18} />
            </IconButton>
          )}
          {onFullscreen && (
            <IconButton 
              size="small" 
              onClick={onFullscreen}
              sx={{ 
                color: 'var(--text-secondary, #64748b)',
                '&:hover': {
                  background: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.04)'
                }
              }}
            >
              <Maximize2 size={18} />
            </IconButton>
          )}
          {menuItems.length > 0 && (
            <>
              <IconButton 
                size="small" 
                onClick={handleMenuClick}
                sx={{ 
                  color: 'var(--text-secondary, #64748b)',
                  '&:hover': {
                    background: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.04)'
                  }
                }}
              >
                <MoreVertical size={18} />
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                PaperProps={{
                  sx: {
                    background: 'var(--widget-background, white)',
                    border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : '#e5e7eb'}`,
                    boxShadow: isDarkMode 
                      ? '0 4px 6px rgba(0, 0, 0, 0.3)' 
                      : '0 4px 6px rgba(0, 0, 0, 0.1)'
                  }
                }}
              >
                {menuItems.map((item, index) => (
                  <MenuItem 
                    key={index} 
                    onClick={() => {
                      item.onClick();
                      handleMenuClose();
                    }}
                    sx={{
                      display: 'flex',
                      gap: 1,
                      color: 'var(--text-primary, #1e293b)',
                      '&:hover': {
                        background: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.04)'
                      }
                    }}
                  >
                    {item.icon}
                    {item.label}
                  </MenuItem>
                ))}
              </Menu>
            </>
          )}
        </Box>
      </Box>
      <Box sx={{ 
        flex: 1, 
        minHeight: 0,
        height: typeof height === 'number' ? `${height}px` : height
      }}>
        {children}
      </Box>
    </Box>
  );
};
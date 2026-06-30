import React, { useState, useRef, useEffect } from 'react';
import { 
  Menu, 
  X, 
  Settings, 
  Layout, 
  Play, 
  LogOut,
  User,
  Moon,
  Sun,
  HelpCircle,
  FileText,
  Download
} from 'lucide-react';

interface HamburgerMenuProps {
  onSettingsClick: () => void;
  onEditLayoutClick: () => void;
  onDemoClick: () => void;
  onThemeToggle: () => void;
  onLogout?: () => void;
  currentTheme: 'light' | 'dark';
  isEditMode: boolean;
  userEmail?: string;
  userRole?: string;
}

const HamburgerMenu: React.FC<HamburgerMenuProps> = ({
  onSettingsClick,
  onEditLayoutClick,
  onDemoClick,
  onThemeToggle,
  onLogout,
  currentTheme,
  isEditMode,
  userEmail,
  userRole
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close menu on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const handleMenuClick = (action: () => void) => {
    action();
    setIsOpen(false);
  };

  const exportData = (format: 'pdf' | 'excel') => {
    console.log(`Exporting as ${format}...`);
    // Add export logic here
    setIsOpen(false);
  };

  return (
    <div className="hamburger-menu-container" ref={menuRef}>
      <button
        className="hamburger-button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          padding: '8px',
          background: currentTheme === 'dark' ? '#475569' : '#ffffff',
          border: `1px solid ${currentTheme === 'dark' ? '#64748b' : '#e2e8f0'}`,
          borderRadius: '8px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '40px',
          height: '40px',
          transition: 'all 0.2s ease'
        }}
      >
        {isOpen ? (
          <X size={20} color={currentTheme === 'dark' ? '#ffffff' : '#1e293b'} />
        ) : (
          <Menu size={20} color={currentTheme === 'dark' ? '#ffffff' : '#1e293b'} />
        )}
      </button>

      {isOpen && (
        <div
          className="hamburger-dropdown"
          style={{
            position: 'absolute',
            top: '50px',
            right: '0',
            background: currentTheme === 'dark' ? '#1e293b' : '#ffffff',
            borderRadius: '12px',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
            minWidth: '280px',
            zIndex: 1000,
            border: `1px solid ${currentTheme === 'dark' ? '#475569' : '#e2e8f0'}`,
            overflow: 'hidden'
          }}
        >
          {/* User Info Section */}
          {userEmail && (
            <div style={{
              padding: '16px',
              borderBottom: `1px solid ${currentTheme === 'dark' ? '#475569' : '#e2e8f0'}`,
              background: currentTheme === 'dark' ? '#0f172a' : '#f8fafc'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 600
                }}>
                  {userEmail[0].toUpperCase()}
                </div>
                <div>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: 500,
                    color: currentTheme === 'dark' ? '#ffffff' : '#1e293b'
                  }}>
                    {userRole}
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: currentTheme === 'dark' ? '#94a3b8' : '#64748b'
                  }}>
                    {userEmail}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Main Menu Items */}
          <div style={{ padding: '8px' }}>
            {/* Dashboard Controls */}
            <div style={{ marginBottom: '8px' }}>
              <div style={{
                fontSize: '11px',
                fontWeight: 600,
                textTransform: 'uppercase',
                color: currentTheme === 'dark' ? '#64748b' : '#94a3b8',
                padding: '8px 12px 4px 12px',
                letterSpacing: '0.5px'
              }}>
                Dashboard
              </div>

              <button
                onClick={() => handleMenuClick(onEditLayoutClick)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: isEditMode ? (currentTheme === 'dark' ? '#3b82f6' : '#dbeafe') : 'transparent',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  color: currentTheme === 'dark' ? '#ffffff' : '#1e293b',
                  fontSize: '14px',
                  transition: 'background 0.2s ease',
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => {
                  if (!isEditMode) {
                    e.currentTarget.style.background = currentTheme === 'dark' ? '#334155' : '#f1f5f9';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isEditMode) {
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                <Layout size={18} />
                <span>{isEditMode ? 'View Mode' : 'Edit Layout'}</span>
              </button>

              <button
                onClick={() => handleMenuClick(onDemoClick)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: 'transparent',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  color: currentTheme === 'dark' ? '#ffffff' : '#1e293b',
                  fontSize: '14px',
                  transition: 'background 0.2s ease',
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = currentTheme === 'dark' ? '#334155' : '#f1f5f9';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <Play size={18} />
                <span>Start Demo</span>
                <span style={{
                  marginLeft: 'auto',
                  fontSize: '11px',
                  padding: '2px 6px',
                  background: currentTheme === 'dark' ? '#475569' : '#e2e8f0',
                  borderRadius: '4px',
                  color: currentTheme === 'dark' ? '#cbd5e1' : '#64748b'
                }}>
                  Ctrl+D
                </span>
              </button>
            </div>

            {/* Export Options */}
            <div style={{ marginBottom: '8px' }}>
              <div style={{
                fontSize: '11px',
                fontWeight: 600,
                textTransform: 'uppercase',
                color: currentTheme === 'dark' ? '#64748b' : '#94a3b8',
                padding: '8px 12px 4px 12px',
                letterSpacing: '0.5px'
              }}>
                Export
              </div>

              <button
                onClick={() => exportData('pdf')}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: 'transparent',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  color: currentTheme === 'dark' ? '#ffffff' : '#1e293b',
                  fontSize: '14px',
                  transition: 'background 0.2s ease',
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = currentTheme === 'dark' ? '#334155' : '#f1f5f9';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <FileText size={18} />
                <span>Export as PDF</span>
              </button>

              <button
                onClick={() => exportData('excel')}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: 'transparent',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  color: currentTheme === 'dark' ? '#ffffff' : '#1e293b',
                  fontSize: '14px',
                  transition: 'background 0.2s ease',
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = currentTheme === 'dark' ? '#334155' : '#f1f5f9';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <Download size={18} />
                <span>Export as Excel</span>
              </button>
            </div>

            {/* Settings */}
            <div style={{ marginBottom: '8px' }}>
              <div style={{
                fontSize: '11px',
                fontWeight: 600,
                textTransform: 'uppercase',
                color: currentTheme === 'dark' ? '#64748b' : '#94a3b8',
                padding: '8px 12px 4px 12px',
                letterSpacing: '0.5px'
              }}>
                Preferences
              </div>

              <button
                onClick={() => handleMenuClick(onSettingsClick)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: 'transparent',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  color: currentTheme === 'dark' ? '#ffffff' : '#1e293b',
                  fontSize: '14px',
                  transition: 'background 0.2s ease',
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = currentTheme === 'dark' ? '#334155' : '#f1f5f9';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <Settings size={18} />
                <span>Settings</span>
              </button>

              <button
                onClick={() => handleMenuClick(onThemeToggle)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: 'transparent',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  color: currentTheme === 'dark' ? '#ffffff' : '#1e293b',
                  fontSize: '14px',
                  transition: 'background 0.2s ease',
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = currentTheme === 'dark' ? '#334155' : '#f1f5f9';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                {currentTheme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                <span>{currentTheme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
              </button>
            </div>

            {/* Help & Support */}
            <div style={{
              paddingTop: '8px',
              borderTop: `1px solid ${currentTheme === 'dark' ? '#475569' : '#e2e8f0'}`
            }}>
              <button
                onClick={() => {
                  window.open('https://github.com/anthropics/claude-code/issues', '_blank');
                  setIsOpen(false);
                }}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: 'transparent',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  color: currentTheme === 'dark' ? '#ffffff' : '#1e293b',
                  fontSize: '14px',
                  transition: 'background 0.2s ease',
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = currentTheme === 'dark' ? '#334155' : '#f1f5f9';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <HelpCircle size={18} />
                <span>Help & Support</span>
              </button>

              {onLogout && (
                <button
                  onClick={() => handleMenuClick(onLogout)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    color: '#ef4444',
                    fontSize: '14px',
                    transition: 'background 0.2s ease',
                    textAlign: 'left'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = currentTheme === 'dark' ? '#334155' : '#fef2f2';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <LogOut size={18} />
                  <span>Logout</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HamburgerMenu;
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface DarkModeContextType {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

const DarkModeContext = createContext<DarkModeContextType | undefined>(undefined);

export const useDarkMode = () => {
  const context = useContext(DarkModeContext);
  if (!context) {
    throw new Error('useDarkMode must be used within a DarkModeProvider');
  }
  return context;
};

interface DarkModeProviderProps {
  children: ReactNode;
}

export const DarkModeProvider: React.FC<DarkModeProviderProps> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Check initial theme
    const checkTheme = () => {
      const isDark = document.documentElement.classList.contains('dark') ||
                    document.body.classList.contains('dark-mode') ||
                    document.body.style.backgroundColor === 'rgb(17, 24, 39)' ||
                    window.getComputedStyle(document.body).backgroundColor === 'rgb(17, 24, 39)';
      setIsDarkMode(isDark);
    };

    checkTheme();

    // Watch for theme changes
    const observer = new MutationObserver(checkTheme);
    
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
    
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['class', 'style']
    });

    // Also listen for custom theme change events
    const handleThemeChange = (e: CustomEvent) => {
      setIsDarkMode(e.detail?.isDarkMode || false);
    };

    window.addEventListener('themeChange' as any, handleThemeChange);

    return () => {
      observer.disconnect();
      window.removeEventListener('themeChange' as any, handleThemeChange);
    };
  }, []);

  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
    // Dispatch custom event for other components
    window.dispatchEvent(new CustomEvent('themeChange', { 
      detail: { isDarkMode: !isDarkMode } 
    }));
  };

  return (
    <DarkModeContext.Provider value={{ isDarkMode, toggleDarkMode }}>
      {children}
    </DarkModeContext.Provider>
  );
};
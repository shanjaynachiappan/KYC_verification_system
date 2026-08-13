import React, { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('app_theme') !== 'light';
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark-theme');
      document.documentElement.classList.remove('light-theme');
      localStorage.setItem('app_theme', 'dark');
    } else {
      document.documentElement.classList.add('light-theme');
      document.documentElement.classList.remove('dark-theme');
      localStorage.setItem('app_theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  return (
    <button 
      className="theme-toggle-btn" 
      onClick={toggleTheme} 
      aria-label="Toggle Theme"
      title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
    >
      {isDark ? <Sun size={18} className="theme-icon sun-icon" /> : <Moon size={18} className="theme-icon moon-icon" />}
    </button>
  );
}

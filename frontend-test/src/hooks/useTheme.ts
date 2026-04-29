import { useState, useEffect } from 'react';

export const useTheme = () => {
  const [isDark, setIsDark] = useState(() => {
    // Проверяем сохраненную тему в localStorage
    const savedTheme = localStorage.getItem('admin-theme');
    return savedTheme === 'dark';
  });

  useEffect(() => {
    // Сохраняем тему в localStorage
    localStorage.setItem('admin-theme', isDark ? 'dark' : 'light');
    
    // Применяем тему к body
    if (isDark) {
      document.body.classList.add('dark-theme');
      document.body.classList.remove('light-theme');
    } else {
      document.body.classList.add('light-theme');
      document.body.classList.remove('dark-theme');
    }
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  return {
    isDark,
    toggleTheme,
    setIsDark
  };
};


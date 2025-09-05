import { useEffect } from 'react';
import useLocalStorage from './useLocalStorage';

export default function useColorMode() {
  // Force dark mode always
  const colorMode = 'dark';
  const setColorMode = () => {}; // No-op function

  useEffect(() => {
    const className = 'dark';
    const bodyClass = window.document.body.classList;
    const htmlClass = window.document.documentElement.classList;
    
    // Clear any existing color theme from localStorage
    localStorage.removeItem('color-theme');
    
    // Always add dark class to both html and body
    bodyClass.add(className);
    htmlClass.add(className);
  }, []);

  return [colorMode, setColorMode];
};


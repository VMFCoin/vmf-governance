'use client';

import { useState, useEffect } from 'react';

interface UseMobileOptions {
  breakpoint?: number;
  debounceMs?: number;
}

export const useMobile = (options: UseMobileOptions = {}) => {
  const { breakpoint = 768, debounceMs = 100 } = options;
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [screenWidth, setScreenWidth] = useState(0);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const checkDevice = () => {
      const width = window.innerWidth;
      setScreenWidth(width);
      setIsMobile(width < breakpoint);
      setIsTablet(width >= breakpoint && width < 1024);
    };

    const debouncedCheck = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(checkDevice, debounceMs);
    };

    // Initial check
    checkDevice();

    // Add event listener
    window.addEventListener('resize', debouncedCheck);

    // Cleanup
    return () => {
      window.removeEventListener('resize', debouncedCheck);
      clearTimeout(timeoutId);
    };
  }, [breakpoint, debounceMs]);

  return {
    isMobile,
    isTablet,
    isDesktop: !isMobile && !isTablet,
    screenWidth,
    // Utility functions
    isMobileOrTablet: isMobile || isTablet,
    isSmallMobile: screenWidth < 480,
    isLargeMobile: screenWidth >= 480 && screenWidth < breakpoint,
  };
};

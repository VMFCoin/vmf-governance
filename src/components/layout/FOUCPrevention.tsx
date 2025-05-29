'use client';

import { useEffect, useState } from 'react';

export const FOUCPrevention: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isClient, setIsClient] = useState(false);
  const [stylesLoaded, setStylesLoaded] = useState(false);

  useEffect(() => {
    // Mark as client-side
    setIsClient(true);

    const checkStylesLoaded = () => {
      try {
        // Create a test element to check if Tailwind styles are applied
        const testEl = document.createElement('div');
        testEl.className =
          'bg-backgroundDark text-patriotWhite opacity-0 absolute pointer-events-none';
        testEl.style.position = 'absolute';
        testEl.style.top = '-9999px';
        testEl.style.left = '-9999px';
        testEl.style.visibility = 'hidden';

        document.body.appendChild(testEl);

        const styles = window.getComputedStyle(testEl);
        const bgColor = styles.backgroundColor;

        document.body.removeChild(testEl);

        // Check if our custom background color is applied
        if (
          bgColor &&
          bgColor !== 'rgba(0, 0, 0, 0)' &&
          bgColor !== 'transparent'
        ) {
          setStylesLoaded(true);
          return true;
        }
      } catch (error) {
        console.warn('Style check failed, assuming styles are loaded:', error);
        setStylesLoaded(true);
        return true;
      }
      return false;
    };

    // Initial check
    if (checkStylesLoaded()) {
      return;
    }

    // Fallback timer - shorter timeout for better UX
    const fallbackTimer = setTimeout(() => {
      setStylesLoaded(true);
    }, 300);

    // Check periodically
    const checkInterval = setInterval(() => {
      if (checkStylesLoaded()) {
        clearInterval(checkInterval);
        clearTimeout(fallbackTimer);
      }
    }, 100);

    // Cleanup
    return () => {
      clearTimeout(fallbackTimer);
      clearInterval(checkInterval);
    };
  }, []);

  // During SSR or before client hydration, render children immediately
  // This ensures server and client render the same initial structure
  if (!isClient) {
    return <>{children}</>;
  }

  // On client-side, show loading spinner while styles are loading
  if (!stylesLoaded) {
    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: '#0a1628',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          fontFamily:
            'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              border: '4px solid #1b2951',
              borderTop: '4px solid #b22234',
              borderRadius: '50%',
              animation: 'vmf-spin 1s linear infinite',
              margin: '0 auto',
            }}
          />
          <p
            style={{
              marginTop: '16px',
              color: '#9ca3af',
              fontSize: '14px',
              margin: '16px 0 0 0',
            }}
          >
            Loading VMF Voice...
          </p>
        </div>
      </div>
    );
  }

  // Once styles are loaded, render children normally
  return <>{children}</>;
};

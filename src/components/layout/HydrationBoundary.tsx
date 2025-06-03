'use client';

import React, { useState, useEffect } from 'react';
import { useWalletSecurity } from '@/hooks/useWalletSecurity';

interface HydrationBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const HydrationBoundary: React.FC<HydrationBoundaryProps> = ({
  children,
  fallback,
}) => {
  const [isClient, setIsClient] = useState(false);
  const { isHydrated, isSecure } = useWalletSecurity();

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Server-side rendering
  if (!isClient) {
    return (
      <div suppressHydrationWarning>
        {fallback || (
          <div className="animate-pulse">
            <div className="h-10 w-32 bg-backgroundLight/50 rounded-lg" />
          </div>
        )}
      </div>
    );
  }

  // Client-side hydration in progress
  if (!isHydrated || !isSecure) {
    return (
      <div className="transition-opacity duration-300 opacity-75">
        {fallback || (
          <div className="animate-pulse">
            <div className="h-10 w-32 bg-backgroundLight/50 rounded-lg" />
          </div>
        )}
      </div>
    );
  }

  // Fully hydrated and secure
  return <>{children}</>;
};

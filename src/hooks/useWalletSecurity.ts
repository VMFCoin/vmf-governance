'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';

interface WalletSecurityState {
  isHydrated: boolean;
  isSecure: boolean;
  isReady: boolean;
  securityLevel: 'loading' | 'hydrating' | 'ready' | 'secure';
}

export const useWalletSecurity = () => {
  const [securityState, setSecurityState] = useState<WalletSecurityState>({
    isHydrated: false,
    isSecure: false,
    isReady: false,
    securityLevel: 'loading',
  });

  const { isConnected, address } = useAccount();

  // Track hydration completion
  useEffect(() => {
    const timer = setTimeout(() => {
      setSecurityState(prev => ({
        ...prev,
        isHydrated: true,
        securityLevel: 'hydrating',
      }));
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // Track when wallet state is ready
  useEffect(() => {
    if (securityState.isHydrated) {
      const readyTimer = setTimeout(() => {
        setSecurityState(prev => ({
          ...prev,
          isReady: true,
          securityLevel: 'ready',
        }));
      }, 300);

      return () => clearTimeout(readyTimer);
    }
  }, [securityState.isHydrated]);

  // Final security verification
  useEffect(() => {
    if (securityState.isReady) {
      const securityTimer = setTimeout(() => {
        setSecurityState(prev => ({
          ...prev,
          isSecure: true,
          securityLevel: 'secure',
        }));
      }, 200);

      return () => clearTimeout(securityTimer);
    }
  }, [securityState.isReady]);

  const validateWalletState = useCallback(() => {
    return {
      isValid: securityState.isSecure && securityState.isReady,
      canInteract: securityState.securityLevel === 'secure',
      address: securityState.isSecure ? address : null,
      isConnected: securityState.isSecure ? isConnected : false,
    };
  }, [securityState, address, isConnected]);

  return {
    ...securityState,
    validateWalletState,
  };
};

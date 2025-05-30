import { useEffect, useState } from 'react';

/**
 * Hook to determine if the component has hydrated on the client side.
 * Useful for preventing SSR issues with client-side only libraries like Zustand.
 *
 * @returns boolean indicating if the component is running on the client side
 */
export const useClientOnly = (): boolean => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return isClient;
};

/**
 * Hook to safely access Zustand stores only on the client side.
 * Prevents SSR errors when using Zustand stores in components.
 *
 * IMPORTANT: This hook always calls the store hook to maintain hook order consistency,
 * but only returns the result when on the client side.
 *
 * @param storeHook - The Zustand store hook to use
 * @returns The store state or null if on server side
 */
export const useClientStore = <T extends Record<string, any>>(
  storeHook: () => T
): T | null => {
  const isClient = useClientOnly();

  // Always call the store hook to maintain hook order consistency
  const storeResult = storeHook();

  // Only return the result when on client side and store is properly initialized
  if (!isClient || !storeResult || typeof storeResult !== 'object') {
    return null;
  }

  return storeResult;
};

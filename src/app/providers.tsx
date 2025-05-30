'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { config } from '@/lib/wagmi';
import { baseSepolia, sepolia } from 'wagmi/chains';

// Configure QueryClient with comprehensive error handling
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Don't retry WebSocket connection errors
        if (error?.message?.includes('Connection interrupted')) {
          return false;
        }
        // Don't retry WalletConnect specific errors
        if (error?.message?.includes('expirer')) {
          return false;
        }
        return failureCount < 3;
      },
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false, // Prevent unnecessary refetches
    },
    mutations: {
      retry: false, // Don't retry mutations by default
    },
  },
});

// Enhanced error handling for Web3 and browser extension conflicts
if (typeof window !== 'undefined') {
  // Handle WebSocket errors globally
  window.addEventListener('unhandledrejection', event => {
    const errorMessage = event.reason?.message || '';

    // Suppress common Web3 development errors
    if (
      errorMessage.includes('Connection interrupted') ||
      errorMessage.includes('expirer') ||
      errorMessage.includes('message channel closed') ||
      errorMessage.includes('Extension context invalidated') ||
      errorMessage.includes('pino-pretty')
    ) {
      event.preventDefault();
      console.warn('Suppressed Web3/Extension error:', errorMessage);
      return;
    }
  });

  // Handle console errors from WalletConnect
  const originalConsoleError = console.error;
  console.error = (...args) => {
    const message = args.join(' ');

    // Suppress WalletConnect expirer warnings and pino-pretty errors
    if (
      message.includes('expirer') ||
      message.includes('pino-pretty') ||
      message.includes('Connection interrupted') ||
      message.includes('Module not found')
    ) {
      return; // Suppress these specific errors
    }

    originalConsoleError.apply(console, args);
  };

  // Handle browser extension conflicts
  window.addEventListener('error', event => {
    if (
      event.message.includes('Extension context invalidated') ||
      event.message.includes('message channel closed')
    ) {
      event.preventDefault();
      console.warn('Browser extension conflict detected and handled');
    }
  });
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          modalSize="compact"
          initialChain={sepolia}
          showRecentTransactions={true}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

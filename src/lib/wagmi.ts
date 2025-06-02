import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import {
  polygon,
  optimism,
  arbitrum,
  base,
  sepolia,
  baseSepolia,
} from 'wagmi/chains';

// Get project ID from environment or use a development fallback
const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID;

if (!projectId) {
  console.warn(
    '⚠️  WalletConnect Project ID not found. Some wallet features may not work properly.'
  );
}

export const config = getDefaultConfig({
  appName: 'VMF Voice',
  projectId: projectId || '2f05a7cdc2674bb905b88b5cd5854b2e', // Fallback for development
  chains: [baseSepolia, polygon, optimism, arbitrum, base, sepolia],
  ssr: true, // If your dApp uses server side rendering (SSR)
});

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

// Development-friendly project ID that allows localhost origins
const developmentProjectId = 'b1647c589ac18a28722c490d2f840895';

// Check if we're in development mode
const isDevelopment = process.env.NODE_ENV === 'development';

if (!projectId && isDevelopment) {
  console.info(
    '🔧 Using development WalletConnect Project ID. For production, set NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID'
  );
} else if (!projectId) {
  console.warn(
    '⚠️  WalletConnect Project ID not found. Some wallet features may not work properly.'
  );
}

export const config = getDefaultConfig({
  appName: 'VMF Voice',
  projectId: projectId || developmentProjectId,
  chains: [baseSepolia, polygon, optimism, arbitrum, base, sepolia],
  ssr: true, // If your dApp uses server side rendering (SSR)
});

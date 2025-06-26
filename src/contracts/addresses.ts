/**
 * Deployed VMF Gauge Plugin Contract Addresses
 * Phase 20: Real Smart Contract Integration Foundation
 */

export const DEPLOYED_CONTRACTS = {
  VMF_TOKEN: '0x1466bAaf1c87C28861884096252C1d7989322EF4',
  GAUGE_VOTER_PLUGIN: '0x6b4B4a84E7112E17ECcE753D150756fc6180808f',
  CURVE: '0x525a9bd92922309877e68DE98E0C925f708777D3',
  EXIT_QUEUE: '0x1453846050Be603F6A1A3aA1DB7d3C9CE251c231',
  VOTING_ESCROW: '0xB313D58f66CA40850b401Fd3737824E8e23F1040',
  CLOCK: '0x8d4c5a8020A5f0ab84019B84554a8e7548C3f100',
  NFT_LOCK: '0xa141eC665167DFBE1565530f81f5A458b8cdd683',
} as const;

export type ContractName = keyof typeof DEPLOYED_CONTRACTS;

/**
 * Get contract address by name
 */
export function getContractAddress(name: ContractName): string {
  return DEPLOYED_CONTRACTS[name];
}

/**
 * Validate that all required environment variables are set
 */
export function validateContractAddresses(): void {
  const requiredEnvVars = [
    'NEXT_PUBLIC_VMF_TOKEN_CONTRACT',
    'NEXT_PUBLIC_GAUGE_VOTER_CONTRACT',
    'NEXT_PUBLIC_VOTING_ESCROW_CONTRACT',
    'NEXT_PUBLIC_EXIT_QUEUE_CONTRACT',
    'NEXT_PUBLIC_NFT_LOCK_CONTRACT',
  ];

  const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`
    );
  }
}

/**
 * Get contract addresses from environment variables
 * This allows for different addresses in different environments
 */
export function getContractAddressFromEnv(name: ContractName): string {
  const envMap: Record<ContractName, string> = {
    VMF_TOKEN: process.env.NEXT_PUBLIC_VMF_TOKEN_CONTRACT!,
    GAUGE_VOTER_PLUGIN: process.env.NEXT_PUBLIC_GAUGE_VOTER_CONTRACT!,
    CURVE: process.env.NEXT_PUBLIC_CURVE_CONTRACT!,
    EXIT_QUEUE: process.env.NEXT_PUBLIC_EXIT_QUEUE_CONTRACT!,
    VOTING_ESCROW: process.env.NEXT_PUBLIC_VOTING_ESCROW_CONTRACT!,
    CLOCK: process.env.NEXT_PUBLIC_CLOCK_CONTRACT!,
    NFT_LOCK: process.env.NEXT_PUBLIC_NFT_LOCK_CONTRACT!,
  };

  return envMap[name] || DEPLOYED_CONTRACTS[name];
}

/**
 * Network configuration
 */
export const NETWORK_CONFIG = {
  CHAIN_ID: parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '1'),
  DEPLOYMENT_BLOCK: parseInt(
    process.env.NEXT_PUBLIC_DEPLOYMENT_BLOCK || '18500000'
  ),
  RPC_URL: process.env.NEXT_PUBLIC_RPC_URL,
} as const;

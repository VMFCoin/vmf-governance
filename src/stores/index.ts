// Store exports for centralized state management
export { useWalletStore } from './useWalletStore';
export type { WalletState } from './useWalletStore';

export { useProposalStore } from './useProposalStore';
export type { ProposalState } from './useProposalStore';

export { useCommunityStore } from './useCommunityStore';
export type { CommunityState } from './useCommunityStore';

export { useUserStore } from './useUserStore';
export type { UserState, UserPreferences } from './useUserStore';

export { useUIStore } from './useUIStore';
export type { UIState, Toast, Modal } from './useUIStore';

// Import stores for the combined hook
import { useWalletStore } from './useWalletStore';
import { useProposalStore } from './useProposalStore';
import { useCommunityStore } from './useCommunityStore';
import { useUserStore } from './useUserStore';
import { useUIStore } from './useUIStore';

// Combined store hook for components that need multiple stores
export const useVMFStores = () => ({
  wallet: useWalletStore(),
  proposals: useProposalStore(),
  community: useCommunityStore(),
  user: useUserStore(),
  ui: useUIStore(),
});

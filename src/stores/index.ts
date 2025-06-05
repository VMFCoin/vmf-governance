// Store exports for centralized state management
export { useWalletStore } from './useWalletStore';
export type { WalletState } from './useWalletStore';

export { useProposalStore } from './useProposalStore';
export type { ProposalState } from './useProposalStore';

export { useCommunityStore } from './useCommunityStore';
export type { CommunityState } from './useCommunityStore';

export { useUserStore } from './useUserStore';
export type { UserState, UserPreferences } from './useUserStore';

export { useUserProfileStore } from './useUserProfileStore';

export { useUIStore } from './useUIStore';
export type { UIState, Toast, Modal } from './useUIStore';

export { useCharityStore } from './useCharityStore';
export type { CharityState } from './useCharityStore';

export { useHolidayStore } from './useHolidayStore';
export type { HolidayState } from './useHolidayStore';

// Import stores for the combined hook
import { useWalletStore } from './useWalletStore';
import { useProposalStore } from './useProposalStore';
import { useCommunityStore } from './useCommunityStore';
import { useUserStore } from './useUserStore';
import { useUserProfileStore } from './useUserProfileStore';
import { useUIStore } from './useUIStore';
import { useCharityStore } from './useCharityStore';
import { useHolidayStore } from './useHolidayStore';

// Combined store hook for components that need multiple stores
export const useVMFStores = () => ({
  wallet: useWalletStore(),
  proposals: useProposalStore(),
  community: useCommunityStore(),
  user: useUserStore(),
  userProfile: useUserProfileStore(),
  ui: useUIStore(),
  charity: useCharityStore(),
  holiday: useHolidayStore(),
});

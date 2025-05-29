'use client';

import { create } from 'zustand';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface Modal {
  id: string;
  type:
    | 'vote'
    | 'proposal_submit'
    | 'community_post'
    | 'settings'
    | 'confirmation';
  title: string;
  content?: React.ReactNode;
  data?: any;
  onClose?: () => void;
  onConfirm?: () => void;
}

export interface UIState {
  // Loading states
  isLoading: boolean;
  loadingMessage: string;

  // Modal system
  modals: Modal[];
  activeModal: Modal | null;

  // Toast system
  toasts: Toast[];

  // Navigation
  sidebarOpen: boolean;
  mobileMenuOpen: boolean;

  // Search
  globalSearchOpen: boolean;
  globalSearchQuery: string;

  // Voting UI
  voteModalOpen: boolean;
  voteModalProposalId: string | null;

  // Actions
  setLoading: (loading: boolean, message?: string) => void;

  // Modal actions
  openModal: (modal: Omit<Modal, 'id'>) => void;
  closeModal: (id?: string) => void;
  closeAllModals: () => void;

  // Toast actions
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  clearAllToasts: () => void;

  // Navigation actions
  setSidebarOpen: (open: boolean) => void;
  setMobileMenuOpen: (open: boolean) => void;

  // Search actions
  setGlobalSearchOpen: (open: boolean) => void;
  setGlobalSearchQuery: (query: string) => void;

  // Voting actions
  openVoteModal: (proposalId: string) => void;
  closeVoteModal: () => void;

  // Utility actions
  showSuccessToast: (title: string, message?: string) => void;
  showErrorToast: (title: string, message?: string) => void;
  showWarningToast: (title: string, message?: string) => void;
  showInfoToast: (title: string, message?: string) => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  // Initial state
  isLoading: false,
  loadingMessage: '',
  modals: [],
  activeModal: null,
  toasts: [],
  sidebarOpen: false,
  mobileMenuOpen: false,
  globalSearchOpen: false,
  globalSearchQuery: '',
  voteModalOpen: false,
  voteModalProposalId: null,

  // Actions
  setLoading: (loading, message = '') => {
    set({ isLoading: loading, loadingMessage: message });
  },

  // Modal actions
  openModal: modal => {
    const newModal: Modal = {
      ...modal,
      id: `modal-${Date.now()}`,
    };

    set(state => ({
      modals: [...state.modals, newModal],
      activeModal: newModal,
    }));
  },

  closeModal: id => {
    if (id) {
      set(state => {
        const filteredModals = state.modals.filter(m => m.id !== id);
        return {
          modals: filteredModals,
          activeModal: filteredModals[filteredModals.length - 1] || null,
        };
      });
    } else {
      // Close the active modal
      set(state => {
        if (state.activeModal) {
          const filteredModals = state.modals.filter(
            m => m.id !== state.activeModal!.id
          );
          return {
            modals: filteredModals,
            activeModal: filteredModals[filteredModals.length - 1] || null,
          };
        }
        return state;
      });
    }
  },

  closeAllModals: () => {
    set({ modals: [], activeModal: null });
  },

  // Toast actions
  addToast: toast => {
    const newToast: Toast = {
      ...toast,
      id: `toast-${Date.now()}`,
      duration: toast.duration || 5000,
    };

    set(state => ({
      toasts: [...state.toasts, newToast],
    }));

    // Auto-remove toast after duration
    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        get().removeToast(newToast.id);
      }, newToast.duration);
    }
  },

  removeToast: id => {
    set(state => ({
      toasts: state.toasts.filter(t => t.id !== id),
    }));
  },

  clearAllToasts: () => {
    set({ toasts: [] });
  },

  // Navigation actions
  setSidebarOpen: open => set({ sidebarOpen: open }),
  setMobileMenuOpen: open => set({ mobileMenuOpen: open }),

  // Search actions
  setGlobalSearchOpen: open => {
    set({ globalSearchOpen: open });
    if (!open) {
      set({ globalSearchQuery: '' });
    }
  },
  setGlobalSearchQuery: query => set({ globalSearchQuery: query }),

  // Voting actions
  openVoteModal: proposalId => {
    set({ voteModalOpen: true, voteModalProposalId: proposalId });
  },
  closeVoteModal: () => {
    set({ voteModalOpen: false, voteModalProposalId: null });
  },

  // Utility toast methods
  showSuccessToast: (title, message) => {
    get().addToast({
      type: 'success',
      title,
      message,
      duration: 4000,
    });
  },

  showErrorToast: (title, message) => {
    get().addToast({
      type: 'error',
      title,
      message,
      duration: 6000,
    });
  },

  showWarningToast: (title, message) => {
    get().addToast({
      type: 'warning',
      title,
      message,
      duration: 5000,
    });
  },

  showInfoToast: (title, message) => {
    get().addToast({
      type: 'info',
      title,
      message,
      duration: 4000,
    });
  },
}));

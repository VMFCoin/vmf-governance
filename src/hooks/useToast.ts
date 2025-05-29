import { useUIStore } from '@/stores/useUIStore';

export const useToast = () => {
  const {
    showSuccessToast,
    showErrorToast,
    showWarningToast,
    showInfoToast,
    addToast,
    removeToast,
    clearAllToasts,
  } = useUIStore();

  return {
    success: showSuccessToast,
    error: showErrorToast,
    warning: showWarningToast,
    info: showInfoToast,
    custom: addToast,
    remove: removeToast,
    clear: clearAllToasts,
  };
};

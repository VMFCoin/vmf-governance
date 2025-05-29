'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toastVariants, buttonVariants } from '@/lib/animations';
import { cn } from '@/lib/utils';

export interface ToastProps {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  onClose: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({
  id,
  type,
  title,
  message,
  duration = 5000,
  onClose,
}) => {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (duration > 0) {
      const interval = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev - 100 / (duration / 100);
          if (newProgress <= 0) {
            clearInterval(interval);
            onClose(id);
            return 0;
          }
          return newProgress;
        });
      }, 100);

      return () => clearInterval(interval);
    }
  }, [duration, id, onClose]);

  const handleClose = () => {
    onClose(id);
  };

  const getIcon = () => {
    const iconProps = { className: 'w-5 h-5' };
    switch (type) {
      case 'success':
        return (
          <CheckCircle {...iconProps} className="w-5 h-5 text-green-500" />
        );
      case 'error':
        return <XCircle {...iconProps} className="w-5 h-5 text-red-500" />;
      case 'warning':
        return (
          <AlertCircle {...iconProps} className="w-5 h-5 text-yellow-500" />
        );
      case 'info':
        return <AlertCircle {...iconProps} className="w-5 h-5 text-blue-500" />;
    }
  };

  const getStyles = () => {
    const baseStyles = 'border-l-4';
    switch (type) {
      case 'success':
        return `${baseStyles} border-green-500 bg-green-500/10`;
      case 'error':
        return `${baseStyles} border-red-500 bg-red-500/10`;
      case 'warning':
        return `${baseStyles} border-yellow-500 bg-yellow-500/10`;
      case 'info':
        return `${baseStyles} border-blue-500 bg-blue-500/10`;
    }
  };

  const getProgressColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'info':
        return 'bg-blue-500';
    }
  };

  return (
    <motion.div
      layout
      variants={toastVariants}
      initial="initial"
      animate="enter"
      exit="exit"
      className={cn(
        'bg-backgroundLight backdrop-blur-sm rounded-lg shadow-lg',
        'border border-patriotBlue/30 max-w-sm w-full relative overflow-hidden',
        getStyles()
      )}
    >
      {/* Progress bar */}
      {duration > 0 && (
        <motion.div
          className={cn('absolute bottom-0 left-0 h-1', getProgressColor())}
          initial={{ width: '100%' }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.1, ease: 'linear' }}
        />
      )}

      <div className="p-4">
        <div className="flex items-start">
          <motion.div
            className="flex-shrink-0 mr-3 mt-0.5"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{
              type: 'spring',
              stiffness: 200,
              damping: 15,
              delay: 0.1,
            }}
          >
            {getIcon()}
          </motion.div>

          <div className="flex-1 min-w-0">
            <motion.h4
              className="text-sm font-medium text-patriotWhite"
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {title}
            </motion.h4>
            {message && (
              <motion.p
                className="text-sm text-textSecondary mt-1"
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                {message}
              </motion.p>
            )}
          </div>

          <motion.button
            onClick={handleClose}
            className="flex-shrink-0 ml-3 text-textSecondary hover:text-patriotWhite transition-colors"
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.4 }}
          >
            <X className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

// Toast Container Component
interface ToastContainerProps {
  toasts: ToastProps[];
  onClose: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  onClose,
}) => {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      <AnimatePresence mode="popLayout">
        {toasts.map(toast => (
          <Toast key={toast.id} {...toast} onClose={onClose} />
        ))}
      </AnimatePresence>
    </div>
  );
};

// Toast Hook for easy usage
export const useToast = () => {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const addToast = (toast: Omit<ToastProps, 'id' | 'onClose'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { ...toast, id, onClose: removeToast }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const showSuccess = (title: string, message?: string) => {
    addToast({ type: 'success', title, message });
  };

  const showError = (title: string, message?: string) => {
    addToast({ type: 'error', title, message });
  };

  const showWarning = (title: string, message?: string) => {
    addToast({ type: 'warning', title, message });
  };

  const showInfo = (title: string, message?: string) => {
    addToast({ type: 'info', title, message });
  };

  return {
    toasts,
    removeToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    ToastContainer: () => (
      <ToastContainer toasts={toasts} onClose={removeToast} />
    ),
  };
};

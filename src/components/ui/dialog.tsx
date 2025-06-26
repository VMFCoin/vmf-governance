'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DialogContextType {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DialogContext = createContext<DialogContextType | undefined>(undefined);

const useDialog = () => {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('Dialog components must be used within a Dialog');
  }
  return context;
};

interface DialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

export const Dialog: React.FC<DialogProps> = ({
  open = false,
  onOpenChange,
  children,
}) => {
  const [isOpen, setIsOpen] = useState(open);

  useEffect(() => {
    setIsOpen(open);
  }, [open]);

  const handleOpenChange = (newOpen: boolean) => {
    setIsOpen(newOpen);
    onOpenChange?.(newOpen);
  };

  return (
    <DialogContext.Provider
      value={{ open: isOpen, onOpenChange: handleOpenChange }}
    >
      {children}
    </DialogContext.Provider>
  );
};

interface DialogTriggerProps {
  asChild?: boolean;
  children: React.ReactNode;
}

export const DialogTrigger: React.FC<DialogTriggerProps> = ({
  asChild = false,
  children,
}) => {
  const { onOpenChange } = useDialog();

  const handleClick = () => {
    onOpenChange(true);
  };

  if (asChild) {
    return React.cloneElement(children as React.ReactElement, {
      onClick: handleClick,
    });
  }

  return <button onClick={handleClick}>{children}</button>;
};

interface DialogContentProps {
  className?: string;
  children: React.ReactNode;
}

export const DialogContent: React.FC<DialogContentProps> = ({
  className,
  children,
}) => {
  const { open, onOpenChange } = useDialog();

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onOpenChange(false);
      }
    };

    if (open) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [open, onOpenChange]);

  if (!open || typeof window === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-backgroundDark/80 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => onOpenChange(false)}
        />

        {/* Dialog */}
        <motion.div
          className={cn(
            'relative w-full max-w-lg bg-backgroundLight border border-patriotBlue/30 rounded-xl shadow-2xl',
            'backdrop-blur-sm p-6',
            className
          )}
          style={{
            background:
              'linear-gradient(135deg, rgba(27, 41, 81, 0.95) 0%, rgba(42, 59, 92, 0.9) 100%)',
          }}
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
        >
          {/* Close button */}
          <button
            onClick={() => onOpenChange(false)}
            className="absolute top-4 right-4 text-textSecondary hover:text-patriotRed transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>

          {children}
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
};

interface DialogHeaderProps {
  className?: string;
  children: React.ReactNode;
}

export const DialogHeader: React.FC<DialogHeaderProps> = ({
  className,
  children,
}) => {
  return <div className={cn('mb-6', className)}>{children}</div>;
};

interface DialogTitleProps {
  className?: string;
  children: React.ReactNode;
}

export const DialogTitle: React.FC<DialogTitleProps> = ({
  className,
  children,
}) => {
  return (
    <h2
      className={cn(
        'text-xl font-display font-semibold text-patriotWhite',
        className
      )}
    >
      {children}
    </h2>
  );
};

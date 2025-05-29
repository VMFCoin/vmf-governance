'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  className,
  size = 'md',
}) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-backgroundDark/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={cn(
          'relative w-full bg-backgroundLight border border-patriotBlue/30 rounded-xl shadow-2xl',
          'backdrop-blur-sm',
          sizeClasses[size],
          className
        )}
        style={{
          background:
            'linear-gradient(135deg, rgba(27, 41, 81, 0.95) 0%, rgba(42, 59, 92, 0.9) 100%)',
        }}
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between p-6 border-b border-patriotBlue/30">
            <h2 className="text-xl font-display font-semibold text-patriotWhite">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="text-textSecondary hover:text-patriotRed transition-colors p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Content */}
        <div className={cn('p-6', title && 'pt-0')}>{children}</div>
      </div>
    </div>
  );
};

'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { HelpTooltip } from './HelpTooltip';
import { formErrorVariants, getAnimationVariants } from '@/lib/animations';
import { useMobile } from '@/hooks/useMobile';

interface FormFieldProps {
  label: string;
  children: React.ReactNode;
  error?: string;
  helpText?: string;
  required?: boolean;
  className?: string;
  labelClassName?: string;
  mobileOptimized?: boolean;
  touchFriendly?: boolean;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  children,
  error,
  helpText,
  required = false,
  className,
  labelClassName,
  mobileOptimized = true,
  touchFriendly = true,
}) => {
  const [isFocused, setIsFocused] = React.useState(false);
  const { isMobile, isSmallMobile } = useMobile();

  // Enhanced mobile styles
  const mobileEnhancements =
    mobileOptimized && isMobile
      ? {
          container: isSmallMobile ? 'space-y-4' : 'space-y-3',
          label: isSmallMobile
            ? 'text-lg font-medium'
            : 'text-base font-medium',
          helpButton: 'p-2 -m-2', // Larger touch target
          errorText:
            'text-sm px-3 py-2 bg-patriotRed/10 border border-patriotRed/30 rounded-lg',
        }
      : {
          container: 'space-y-2',
          label: 'text-sm font-medium',
          helpButton: '',
          errorText: 'text-sm',
        };

  const handleFocus = () => {
    setIsFocused(true);

    // Mobile keyboard optimization
    if (isMobile && mobileOptimized) {
      // Scroll field into view on mobile when focused
      setTimeout(() => {
        const activeElement = document.activeElement as HTMLElement;
        if (activeElement) {
          activeElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'nearest',
          });
        }
      }, 300); // Wait for keyboard animation
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  // Clone children to add mobile-specific props
  const enhancedChildren = React.Children.map(children, child => {
    if (React.isValidElement(child)) {
      const mobileProps =
        mobileOptimized && isMobile
          ? {
              onFocus: handleFocus,
              onBlur: handleBlur,
              autoComplete: 'off',
              autoCorrect: 'off',
              autoCapitalize: 'off',
              spellCheck: false,
              // Larger touch targets for mobile
              className: cn(
                child.props.className,
                touchFriendly &&
                  (isSmallMobile
                    ? 'min-h-[52px] text-lg'
                    : 'min-h-[48px] text-base'),
                isFocused &&
                  'ring-2 ring-patriotBlue ring-offset-2 ring-offset-backgroundDark'
              ),
            }
          : {
              onFocus: handleFocus,
              onBlur: handleBlur,
            };

      return React.cloneElement(child, {
        ...child.props,
        ...mobileProps,
      });
    }
    return child;
  });

  return (
    <motion.div
      className={cn(mobileEnhancements.container, className)}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-center gap-2">
        <label
          className={cn(
            'block text-textBase transition-colors duration-200',
            mobileEnhancements.label,
            isFocused && 'text-patriotBlue',
            labelClassName
          )}
        >
          {label}
          {required && <span className="text-patriotRed ml-1">*</span>}
        </label>
        {helpText && (
          <div className={mobileEnhancements.helpButton}>
            <HelpTooltip
              content={helpText}
              position={isMobile ? 'bottom' : 'right'}
            />
          </div>
        )}
      </div>

      <motion.div
        animate={isFocused ? { scale: isMobile ? 1.005 : 1.01 } : { scale: 1 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
      >
        {enhancedChildren}
      </motion.div>

      <AnimatePresence>
        {error && (
          <motion.div
            className={cn('text-patriotRed', mobileEnhancements.errorText)}
            variants={getAnimationVariants(formErrorVariants)}
            initial="initial"
            animate="enter"
            exit="exit"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile-specific focus indicator */}
      {mobileOptimized && isMobile && isFocused && (
        <motion.div
          className="absolute inset-0 pointer-events-none border-2 border-patriotBlue rounded-lg"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 0.3, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
        />
      )}
    </motion.div>
  );
};

'use client';

import React, { forwardRef } from 'react';
import { motion, MotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useMobile } from '@/hooks/useMobile';

interface ButtonProps
  extends Omit<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    keyof MotionProps
  > {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  asChild?: boolean;
  children?: React.ReactNode;
}

const baseClasses =
  'font-medium rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-patriotRed focus:ring-offset-2 focus:ring-offset-backgroundDark disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center relative overflow-hidden group';

const variantClasses = {
  primary:
    'bg-patriotRed hover:bg-red-700 text-patriotWhite shadow-patriot-glow hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]',
  secondary:
    'bg-backgroundLight hover:bg-backgroundAccent text-textBase border border-patriotBlue hover:border-patriotRed/50 hover:shadow-lg',
  outline:
    'border-2 border-patriotRed text-patriotRed hover:bg-patriotRed hover:text-patriotWhite hover:shadow-patriot-glow',
  ghost:
    'text-patriotRed hover:text-red-400 hover:bg-patriotRed/10 hover:shadow-md',
  destructive:
    'bg-red-600 hover:bg-red-700 text-white shadow-lg hover:shadow-xl',
};

const sizeClasses = {
  sm: 'px-3 py-2 text-sm h-9',
  md: 'px-6 py-3 text-base h-11',
  lg: 'px-8 py-4 text-lg h-13',
  xl: 'px-12 py-5 text-xl h-16',
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      icon,
      iconPosition = 'left',
      fullWidth = false,
      asChild,
      className,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const { isMobile, isSmallMobile } = useMobile();

    // Adjust size for mobile
    const effectiveSize =
      isMobile && size === 'xl'
        ? 'lg'
        : isSmallMobile && (size === 'lg' || size === 'xl')
          ? 'md'
          : size;

    const buttonClasses = cn(
      baseClasses,
      variantClasses[variant],
      sizeClasses[effectiveSize],
      {
        'w-full': fullWidth,
        'opacity-50 cursor-not-allowed': disabled || loading,
        'active:scale-95': !disabled && !loading,
        // Enhanced mobile touch targets
        'min-h-[44px]': isMobile,
        'touch-manipulation': isMobile,
      },
      className
    );

    const motionProps: MotionProps = {
      whileTap:
        !disabled && !loading ? { scale: isMobile ? 0.98 : 0.95 } : undefined,
      transition: { duration: 0.1 },
    };

    if (asChild) {
      return React.cloneElement(children as React.ReactElement, {
        className: cn(
          (children as React.ReactElement).props.className,
          buttonClasses
        ),
        ...props,
      });
    }

    return (
      <motion.button
        ref={ref}
        className={buttonClasses}
        disabled={disabled || loading}
        {...motionProps}
        {...props}
      >
        {loading && (
          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        )}
        {icon && iconPosition === 'left' && !loading && (
          <span className={cn('flex items-center', children && 'mr-2')}>
            {icon}
          </span>
        )}
        {children}
        {icon && iconPosition === 'right' && !loading && (
          <span className={cn('flex items-center', children && 'ml-2')}>
            {icon}
          </span>
        )}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';

export { Button, type ButtonProps };

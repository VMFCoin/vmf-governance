'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  children: React.ReactNode;
  className?: string;
  asChild?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  className,
  asChild = false,
  ...props
}) => {
  const baseClasses =
    'font-medium rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-patriotRed focus:ring-offset-2 focus:ring-offset-backgroundDark disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center relative overflow-hidden group';

  const variantClasses = {
    primary:
      'bg-patriotRed hover:bg-red-700 text-patriotWhite shadow-patriot-glow hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]',
    secondary:
      'bg-backgroundLight hover:bg-backgroundAccent text-textBase border border-patriotBlue hover:border-patriotRed/50 hover:shadow-lg',
    ghost:
      'text-patriotRed hover:text-red-400 hover:bg-patriotRed/10 hover:shadow-md',
    outline:
      'border-2 border-patriotRed text-patriotRed hover:bg-patriotRed hover:text-patriotWhite hover:shadow-patriot-glow',
  };

  const sizeClasses = {
    sm: 'px-3 py-2 text-sm h-9',
    md: 'px-6 py-3 text-base h-11',
    lg: 'px-8 py-4 text-lg h-13',
    xl: 'px-12 py-5 text-xl h-16',
  };

  const combinedClasses = cn(
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    className
  );

  if (asChild) {
    return React.cloneElement(children as React.ReactElement, {
      className: cn(
        (children as React.ReactElement).props.className,
        combinedClasses
      ),
      ...props,
    });
  }

  return (
    <button className={combinedClasses} {...props}>
      <span className="relative z-10">{children}</span>
      {variant === 'primary' && (
        <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-red-800 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      )}
    </button>
  );
};

'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  className?: string;
  variant?: 'default' | 'search';
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  className,
  variant = 'default',
  id,
  ...props
}) => {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

  const baseClasses = cn(
    'w-full bg-backgroundLight border border-patriotBlue text-textBase rounded-lg',
    'focus:outline-none focus:ring-2 focus:ring-patriotRed focus:border-transparent',
    'placeholder:text-textSecondary transition-all duration-300',
    'hover:bg-backgroundAccent hover:border-patriotRed/50',
    error && 'border-patriotRed focus:ring-patriotRed',
    variant === 'default' && 'px-4 py-3',
    variant === 'search' &&
      'px-4 py-3 shadow-sm hover:shadow-md focus:shadow-lg'
  );

  return (
    <div className="space-y-2">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-semibold text-textBase"
        >
          {label}
        </label>
      )}
      <input id={inputId} className={cn(baseClasses, className)} {...props} />
      {error && (
        <p className="text-sm text-patriotRed font-medium flex items-center gap-1">
          <span className="w-1 h-1 bg-patriotRed rounded-full"></span>
          {error}
        </p>
      )}
    </div>
  );
};

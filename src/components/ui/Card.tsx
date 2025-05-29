'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'hover' | 'flag';
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({
  variant = 'default',
  children,
  className,
  ...props
}) => {
  const baseClasses =
    'bg-backgroundLight border border-patriotBlue/30 rounded-xl p-6 shadow-lg backdrop-blur-sm';

  const variantClasses = {
    default: '',
    hover:
      'card-hover transition-all duration-300 hover:transform hover:-translate-y-2 hover:shadow-patriot-glow',
    flag: 'flag-element relative',
  };

  const cardStyle = {
    background:
      'linear-gradient(135deg, rgba(27, 41, 81, 0.8) 0%, rgba(42, 59, 92, 0.6) 100%)',
  };

  return (
    <div
      className={cn(baseClasses, variantClasses[variant], className)}
      style={cardStyle}
      {...props}
    >
      {children}
    </div>
  );
};

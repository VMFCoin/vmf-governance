'use client';

import React from 'react';
import { AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AlertProps {
  variant?: 'default' | 'destructive' | 'warning' | 'success' | 'info';
  className?: string;
  children: React.ReactNode;
}

export const Alert: React.FC<AlertProps> = ({
  variant = 'default',
  className,
  children,
}) => {
  const variantStyles = {
    default: 'border-patriotBlue/30 bg-backgroundLight/50 text-textBase',
    destructive: 'border-patriotRed/30 bg-patriotRed/10 text-patriotRed',
    warning: 'border-starGold/30 bg-starGold/10 text-starGold',
    success: 'border-green-500/30 bg-green-500/10 text-green-400',
    info: 'border-patriotBlue/30 bg-patriotBlue/10 text-patriotBlue',
  };

  const getIcon = () => {
    switch (variant) {
      case 'destructive':
        return <AlertCircle className="h-4 w-4" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4" />;
      case 'success':
        return <CheckCircle className="h-4 w-4" />;
      case 'info':
        return <Info className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  return (
    <div
      className={cn(
        'relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground',
        variantStyles[variant],
        className
      )}
    >
      {getIcon()}
      {children}
    </div>
  );
};

interface AlertDescriptionProps {
  className?: string;
  children: React.ReactNode;
}

export const AlertDescription: React.FC<AlertDescriptionProps> = ({
  className,
  children,
}) => {
  return (
    <div className={cn('text-sm [&_p]:leading-relaxed', className)}>
      {children}
    </div>
  );
};

'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  className?: string;
  children: React.ReactNode;
}

export const Label: React.FC<LabelProps> = ({
  className,
  children,
  ...props
}) => {
  return (
    <label
      className={cn(
        'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-textBase',
        className
      )}
      {...props}
    >
      {children}
    </label>
  );
};

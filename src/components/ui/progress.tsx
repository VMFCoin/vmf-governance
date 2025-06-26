'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface ProgressProps {
  value?: number;
  max?: number;
  className?: string;
  indicatorClassName?: string;
}

export const Progress: React.FC<ProgressProps> = ({
  value = 0,
  max = 100,
  className,
  indicatorClassName,
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div
      className={cn(
        'relative h-4 w-full overflow-hidden rounded-full bg-backgroundAccent',
        className
      )}
    >
      <div
        className={cn(
          'h-full w-full flex-1 bg-patriotBlue transition-all duration-300 ease-in-out',
          indicatorClassName
        )}
        style={{
          transform: `translateX(-${100 - percentage}%)`,
        }}
      />
    </div>
  );
};

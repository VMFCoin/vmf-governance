'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface VotingPowerProps {
  percentage: number;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
}

export const VotingPower: React.FC<VotingPowerProps> = ({
  percentage,
  size = 'md',
  label = 'Your Voting Power',
  className,
}) => {
  const sizeClasses = {
    sm: { container: 'w-16 h-16', inner: 'inset-2', text: 'text-sm' },
    md: { container: 'w-32 h-32', inner: 'inset-4', text: 'text-2xl' },
    lg: { container: 'w-64 h-64', inner: 'inset-4', text: 'text-5xl' },
  };

  const currentSize = sizeClasses[size];

  // Calculate the angle for the conic gradient (percentage to degrees)
  const angle = (percentage / 100) * 360;

  const gradientStyle = {
    background: `conic-gradient(from 0deg, #B22234 0deg, #B22234 ${angle}deg, #1B2951 ${angle}deg, #1B2951 360deg)`,
  };

  return (
    <div className={cn('text-center', className)}>
      <div className={cn('relative mx-auto mb-6', currentSize.container)}>
        <div
          className="w-full h-full rounded-full border-8 border-patriotBlue relative overflow-hidden"
          style={gradientStyle}
        >
          <div
            className={cn(
              'absolute bg-backgroundDark rounded-full flex items-center justify-center',
              currentSize.inner
            )}
          >
            <span
              className={cn(
                'font-display font-bold text-patriotWhite',
                currentSize.text
              )}
            >
              {percentage}%
            </span>
          </div>
        </div>
      </div>
      {label && (
        <p className="text-xl font-semibold text-patriotWhite">{label}</p>
      )}
    </div>
  );
};

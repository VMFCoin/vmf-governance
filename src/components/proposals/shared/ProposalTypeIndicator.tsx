'use client';

import React from 'react';
import { Calendar, Building2, Settings, FileText } from 'lucide-react';
import { ProposalType } from '@/types';
import { cn } from '@/lib/utils';

interface ProposalTypeIndicatorProps {
  type: ProposalType;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export const ProposalTypeIndicator: React.FC<ProposalTypeIndicatorProps> = ({
  type,
  size = 'md',
  showLabel = true,
  className,
}) => {
  const getTypeConfig = (proposalType: ProposalType) => {
    switch (proposalType) {
      case 'holiday_charity':
        return {
          icon: Calendar,
          label: 'Holiday Charity',
          emoji: '🎖️',
          bgColor: 'bg-gradient-to-r from-patriotRed to-red-600',
          textColor: 'text-patriotWhite',
          borderColor: 'border-patriotRed',
          glowColor: 'shadow-patriot-glow',
        };
      case 'charity_directory':
        return {
          icon: Building2,
          label: 'Charity Directory',
          emoji: '🏛️',
          bgColor: 'bg-gradient-to-r from-blue-600 to-blue-700',
          textColor: 'text-white',
          borderColor: 'border-blue-500',
          glowColor: 'shadow-blue-glow',
        };
      case 'platform_feature':
        return {
          icon: Settings,
          label: 'Platform Feature',
          emoji: '⚙️',
          bgColor: 'bg-gradient-to-r from-purple-600 to-purple-700',
          textColor: 'text-white',
          borderColor: 'border-purple-500',
          glowColor: 'shadow-lg',
        };
      case 'legacy':
      default:
        return {
          icon: FileText,
          label: 'General Proposal',
          emoji: '📄',
          bgColor: 'bg-gradient-to-r from-backgroundLight to-backgroundAccent',
          textColor: 'text-textBase',
          borderColor: 'border-patriotBlue',
          glowColor: 'shadow-md',
        };
    }
  };

  const config = getTypeConfig(type);
  const Icon = config.icon;

  const sizeClasses = {
    sm: {
      container: 'px-2 py-1 text-xs',
      icon: 'w-3 h-3',
      emoji: 'text-xs',
    },
    md: {
      container: 'px-3 py-1.5 text-sm',
      icon: 'w-4 h-4',
      emoji: 'text-sm',
    },
    lg: {
      container: 'px-4 py-2 text-base',
      icon: 'w-5 h-5',
      emoji: 'text-base',
    },
  };

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-full font-semibold transition-all duration-300 hover:scale-105',
        config.bgColor,
        config.textColor,
        config.glowColor,
        sizeClasses[size].container,
        className
      )}
    >
      <span className={sizeClasses[size].emoji}>{config.emoji}</span>
      <Icon className={sizeClasses[size].icon} />
      {showLabel && <span>{config.label}</span>}
    </div>
  );
};

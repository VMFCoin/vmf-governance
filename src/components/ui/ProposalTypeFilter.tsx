'use client';

import React from 'react';
import { BarChart3, Heart, Building, Code, Archive } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ProposalTypeFilter } from '@/stores/useUserStore';

interface ProposalTypeFilterProps {
  selectedType: ProposalTypeFilter;
  onTypeChange: (type: ProposalTypeFilter) => void;
  typeCounts: Record<ProposalTypeFilter, number>;
  className?: string;
}

const proposalTypeOptions = [
  {
    value: 'all' as ProposalTypeFilter,
    label: 'All Types',
    icon: <BarChart3 className="w-4 h-4" />,
    shortLabel: 'All',
  },
  {
    value: 'holiday_charity' as ProposalTypeFilter,
    label: 'Holiday Charity',
    icon: <Heart className="w-4 h-4" />,
    shortLabel: 'Holiday',
  },
  {
    value: 'charity_directory' as ProposalTypeFilter,
    label: 'Charity Directory',
    icon: <Building className="w-4 h-4" />,
    shortLabel: 'Directory',
  },
  {
    value: 'platform_feature' as ProposalTypeFilter,
    label: 'Platform Features',
    icon: <Code className="w-4 h-4" />,
    shortLabel: 'Features',
  },
  {
    value: 'legacy' as ProposalTypeFilter,
    label: 'Legacy',
    icon: <Archive className="w-4 h-4" />,
    shortLabel: 'Legacy',
  },
];

export function ProposalTypeFilter({
  selectedType,
  onTypeChange,
  typeCounts,
  className,
}: ProposalTypeFilterProps) {
  return (
    <div className={cn('w-full', className)}>
      {/* Desktop Layout - Horizontal tabs */}
      <div className="hidden lg:flex items-center gap-3 overflow-x-auto scrollbar-hide">
        {proposalTypeOptions.map(option => (
          <button
            key={option.value}
            onClick={() => onTypeChange(option.value)}
            className={cn(
              'flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all whitespace-nowrap h-12 min-w-fit',
              selectedType === option.value
                ? 'bg-patriotRed text-white shadow-lg'
                : 'bg-backgroundLight text-textSecondary hover:bg-backgroundAccent hover:text-textBase border border-patriotBlue/20 hover:border-patriotBlue/40'
            )}
          >
            {option.icon}
            <span>{option.label}</span>
            <span className="px-2 py-1 bg-black/20 rounded-md text-xs font-semibold">
              {typeCounts[option.value]}
            </span>
          </button>
        ))}
      </div>

      {/* Tablet Layout - Compact horizontal */}
      <div className="hidden md:flex lg:hidden items-center gap-2 overflow-x-auto scrollbar-hide">
        {proposalTypeOptions.map(option => (
          <button
            key={option.value}
            onClick={() => onTypeChange(option.value)}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap h-10 min-w-fit',
              selectedType === option.value
                ? 'bg-patriotRed text-white'
                : 'bg-backgroundLight text-textSecondary hover:bg-backgroundAccent hover:text-textBase border border-patriotBlue/20'
            )}
          >
            {option.icon}
            <span className="hidden sm:inline">{option.shortLabel}</span>
            <span className="px-1.5 py-0.5 bg-black/20 rounded text-xs font-semibold">
              {typeCounts[option.value]}
            </span>
          </button>
        ))}
      </div>

      {/* Mobile Layout - Horizontal Scrollable */}
      <div className="flex md:hidden items-center gap-2 overflow-x-auto scrollbar-hide pb-2">
        {proposalTypeOptions.map(option => (
          <button
            key={option.value}
            onClick={() => onTypeChange(option.value)}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap h-10 min-w-fit flex-shrink-0',
              selectedType === option.value
                ? 'bg-patriotRed text-white'
                : 'bg-backgroundLight text-textSecondary hover:bg-backgroundAccent hover:text-textBase border border-patriotBlue/20'
            )}
          >
            {option.icon}
            <span className="truncate">{option.shortLabel}</span>
            <span className="px-1.5 py-0.5 bg-black/20 rounded text-xs font-semibold flex-shrink-0">
              {typeCounts[option.value]}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

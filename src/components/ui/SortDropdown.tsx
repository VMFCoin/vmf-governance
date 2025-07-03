'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Clock,
  BarChart3,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
} from 'lucide-react';
import { Button } from './Button';
import { cn } from '@/lib/utils';
import type { SortOption } from '@/stores/useUserStore';

interface SortDropdownProps {
  selectedSort: SortOption;
  onSortChange: (sort: SortOption) => void;
  className?: string;
}

const sortOptions = [
  {
    value: 'newest' as SortOption,
    label: 'Newest First',
    icon: <Calendar className="w-4 h-4" />,
    shortLabel: 'Newest',
  },
  {
    value: 'oldest' as SortOption,
    label: 'Oldest First',
    icon: <Calendar className="w-4 h-4" />,
    shortLabel: 'Oldest',
  },
  {
    value: 'mostVotes' as SortOption,
    label: 'Most Votes',
    icon: <BarChart3 className="w-4 h-4" />,
    shortLabel: 'Most Votes',
  },
  {
    value: 'timeLeft' as SortOption,
    label: 'Time Remaining',
    icon: <Clock className="w-4 h-4" />,
    shortLabel: 'Time Left',
  },
];

export function SortDropdown({
  selectedSort,
  onSortChange,
  className,
}: SortDropdownProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Click outside handler to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsExpanded(false);
      }
    };

    if (isExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
      return () =>
        document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isExpanded]);

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  const currentSortOption = sortOptions.find(
    option => option.value === selectedSort
  );
  const hasNonDefaultSort = selectedSort !== 'newest';

  return (
    <div ref={dropdownRef} className={cn('relative', className)}>
      {/* Sort Button */}
      <Button
        onClick={handleToggle}
        variant="ghost"
        size="sm"
        className="flex items-center gap-1 sm:gap-2 text-patriotWhite hover:text-patriotRed hover:bg-patriotRed/10 h-11 sm:h-12 px-3 sm:px-6 rounded-xl border border-patriotBlue/30 bg-backgroundLight text-sm sm:text-base"
      >
        <span className="font-medium">Sort</span>
        {hasNonDefaultSort && (
          <div className="w-2 h-2 bg-patriotRed rounded-full ml-1" />
        )}
        {isExpanded ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
      </Button>

      {/* Expandable Sort Dropdown */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="absolute top-full mt-2 left-0 sm:left-auto sm:right-0 w-[280px] bg-backgroundDark border border-patriotBlue/30 rounded-xl shadow-2xl z-50"
          >
            <div className="p-3 sm:p-4">
              {/* Header */}
              <div className="mb-3 sm:mb-4">
                <h3 className="text-sm font-semibold text-patriotWhite flex items-center gap-2">
                  <ArrowUpDown className="w-4 h-4" />
                  Sort Options
                </h3>
              </div>

              {/* Sort Options */}
              <div className="space-y-1 sm:space-y-2">
                {sortOptions.map(option => (
                  <Button
                    key={option.value}
                    onClick={() => {
                      onSortChange(option.value);
                      setIsExpanded(false);
                    }}
                    variant={
                      selectedSort === option.value ? 'primary' : 'ghost'
                    }
                    size="sm"
                    className={cn(
                      'w-full justify-start gap-2 sm:gap-3 text-left h-10 sm:h-11 rounded-lg text-sm',
                      selectedSort === option.value
                        ? 'bg-patriotRed text-patriotWhite hover:bg-patriotRed/90'
                        : 'text-textSecondary hover:text-patriotWhite hover:bg-patriotRed/10'
                    )}
                  >
                    {option.icon}
                    <span>{option.label}</span>
                  </Button>
                ))}
              </div>

              {/* Current Selection Indicator */}
              <div className="mt-3 sm:mt-4 pt-2 sm:pt-3 border-t border-patriotBlue/20">
                <div className="text-xs text-textSecondary">
                  Currently sorting by:{' '}
                  <span className="text-patriotWhite font-medium">
                    {currentSortOption?.label}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

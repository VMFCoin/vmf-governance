'use client';

import React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FilterChipProps {
  label: string;
  onRemove: () => void;
  className?: string;
}

export function FilterChip({ label, onRemove, className }: FilterChipProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 px-3 py-1 bg-patriotBlue/20 text-patriotBlue rounded-full text-sm font-medium border border-patriotBlue/30',
        className
      )}
    >
      <span>{label}</span>
      <button
        onClick={onRemove}
        className="ml-1 hover:bg-patriotBlue/30 rounded-full p-0.5 transition-colors"
        aria-label={`Remove ${label} filter`}
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}

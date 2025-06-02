'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, Check, AlertCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { fadeInVariants, getAnimationVariants } from '@/lib/animations';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface SaveStatusIndicatorProps {
  status: SaveStatus;
  lastSaved?: Date;
  className?: string;
  showText?: boolean;
}

export const SaveStatusIndicator: React.FC<SaveStatusIndicatorProps> = ({
  status,
  lastSaved,
  className,
  showText = true,
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'saving':
        return {
          icon: Save,
          text: 'Saving...',
          color: 'text-yellow-400',
          bgColor: 'bg-yellow-400/10',
          borderColor: 'border-yellow-400/30',
        };
      case 'saved':
        return {
          icon: Check,
          text: 'Saved',
          color: 'text-green-400',
          bgColor: 'bg-green-400/10',
          borderColor: 'border-green-400/30',
        };
      case 'error':
        return {
          icon: AlertCircle,
          text: 'Save failed',
          color: 'text-patriotRed',
          bgColor: 'bg-patriotRed/10',
          borderColor: 'border-patriotRed/30',
        };
      default:
        return {
          icon: Clock,
          text: 'Not saved',
          color: 'text-textSecondary',
          bgColor: 'bg-backgroundLight/30',
          borderColor: 'border-patriotBlue/30',
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  const formatLastSaved = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={status}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-200',
          config.bgColor,
          config.borderColor,
          className
        )}
        variants={getAnimationVariants(fadeInVariants)}
        initial="initial"
        animate="enter"
        exit="exit"
      >
        <motion.div
          animate={status === 'saving' ? { rotate: 360 } : { rotate: 0 }}
          transition={
            status === 'saving'
              ? { duration: 1, repeat: Infinity, ease: 'linear' }
              : { duration: 0.2 }
          }
        >
          <Icon className={cn('w-4 h-4', config.color)} />
        </motion.div>

        {showText && (
          <div className="flex flex-col">
            <span className={cn('text-sm font-medium', config.color)}>
              {config.text}
            </span>
            {status === 'saved' && lastSaved && (
              <span className="text-xs text-textSecondary">
                {formatLastSaved(lastSaved)}
              </span>
            )}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

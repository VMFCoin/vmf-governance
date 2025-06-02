'use client';

import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { fadeInVariants, getAnimationVariants } from '@/lib/animations';

interface HelpTooltipProps {
  content: string;
  className?: string;
  iconClassName?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export const HelpTooltip: React.FC<HelpTooltipProps> = ({
  content,
  className,
  iconClassName,
  position = 'top',
}) => {
  const [isVisible, setIsVisible] = useState(false);

  const getPositionClasses = () => {
    switch (position) {
      case 'bottom':
        return 'top-full left-1/2 transform -translate-x-1/2 mt-2';
      case 'left':
        return 'right-full top-1/2 transform -translate-y-1/2 mr-2';
      case 'right':
        return 'left-full top-1/2 transform -translate-y-1/2 ml-2';
      default: // top
        return 'bottom-full left-1/2 transform -translate-x-1/2 mb-2';
    }
  };

  const getArrowClasses = () => {
    switch (position) {
      case 'bottom':
        return 'top-0 left-1/2 transform -translate-x-1/2 -translate-y-full border-l-transparent border-r-transparent border-b-backgroundAccent border-t-0';
      case 'left':
        return 'right-0 top-1/2 transform translate-x-full -translate-y-1/2 border-t-transparent border-b-transparent border-l-backgroundAccent border-r-0';
      case 'right':
        return 'left-0 top-1/2 transform -translate-x-full -translate-y-1/2 border-t-transparent border-b-transparent border-r-backgroundAccent border-l-0';
      default: // top
        return 'top-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-t-backgroundAccent border-b-0';
    }
  };

  return (
    <div className={cn('relative inline-block', className)}>
      <button
        type="button"
        className={cn(
          'text-textSecondary hover:text-patriotBlue transition-colors duration-200 focus:outline-none focus:text-patriotBlue',
          iconClassName
        )}
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onFocus={() => setIsVisible(true)}
        onBlur={() => setIsVisible(false)}
        aria-label="Help information"
      >
        <HelpCircle className="w-4 h-4" />
      </button>

      <AnimatePresence>
        {isVisible && (
          <motion.div
            className={cn(
              'absolute z-50 px-3 py-2 text-sm text-textBase bg-backgroundAccent border border-patriotBlue/30 rounded-lg shadow-lg max-w-xs',
              getPositionClasses()
            )}
            variants={getAnimationVariants(fadeInVariants)}
            initial="initial"
            animate="enter"
            exit="exit"
            style={{ pointerEvents: 'none' }}
          >
            {content}

            {/* Tooltip Arrow */}
            <div
              className={cn('absolute w-0 h-0 border-4', getArrowClasses())}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

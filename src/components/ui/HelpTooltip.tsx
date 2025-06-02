import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { tooltipVariants } from '@/lib/animations';

interface HelpTooltipProps {
  content: string;
  className?: string;
}

export const HelpTooltip: React.FC<HelpTooltipProps> = ({
  content,
  className = '',
}) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className={`relative inline-block ${className}`}>
      <button
        type="button"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onFocus={() => setIsVisible(true)}
        onBlur={() => setIsVisible(false)}
        className="inline-flex items-center justify-center w-4 h-4 ml-1 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 rounded-full border border-gray-300 dark:border-gray-600 text-xs"
        aria-label="Help"
      >
        ?
      </button>
      <AnimatePresence>
        {isVisible && (
          <motion.div
            variants={tooltipVariants}
            initial="initial"
            animate="enter"
            exit="exit"
            className="absolute z-10 px-3 py-2 text-sm text-white bg-gray-900 dark:bg-gray-700 rounded-lg shadow-lg -top-2 left-6 w-64"
          >
            {content}
            <div className="absolute top-3 -left-1 w-2 h-2 bg-gray-900 dark:bg-gray-700 rotate-45"></div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

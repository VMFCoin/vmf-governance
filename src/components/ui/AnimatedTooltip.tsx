'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ReactNode, useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { tooltipVariants, getAnimationVariants } from '@/lib/animations';
import { cn } from '@/lib/utils';

interface TooltipProps {
  children: ReactNode;
  text: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  className?: string;
  disabled?: boolean;
}

export function SimpleTooltip({
  children,
  text,
  position = 'top',
  delay = 500,
  className = '',
  disabled = false,
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const showTooltip = () => {
    if (disabled) return;

    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
      updatePosition();
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  const updatePosition = () => {
    if (!triggerRef.current) return;

    const rect = triggerRef.current.getBoundingClientRect();
    const scrollX = window.pageXOffset;
    const scrollY = window.pageYOffset;

    let x = 0;
    let y = 0;

    switch (position) {
      case 'top':
        x = rect.left + scrollX + rect.width / 2;
        y = rect.top + scrollY - 10;
        break;
      case 'bottom':
        x = rect.left + scrollX + rect.width / 2;
        y = rect.bottom + scrollY + 10;
        break;
      case 'left':
        x = rect.left + scrollX - 10;
        y = rect.top + scrollY + rect.height / 2;
        break;
      case 'right':
        x = rect.right + scrollX + 10;
        y = rect.top + scrollY + rect.height / 2;
        break;
    }

    setTooltipPosition({ x, y });
  };

  useEffect(() => {
    const handleScroll = () => {
      if (isVisible) {
        updatePosition();
      }
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isVisible]);

  const getTransformOrigin = () => {
    switch (position) {
      case 'top':
        return 'bottom center';
      case 'bottom':
        return 'top center';
      case 'left':
        return 'right center';
      case 'right':
        return 'left center';
      default:
        return 'bottom center';
    }
  };

  const getTranslateValues = () => {
    switch (position) {
      case 'top':
        return { x: '-50%', y: '-100%' };
      case 'bottom':
        return { x: '-50%', y: '0%' };
      case 'left':
        return { x: '-100%', y: '-50%' };
      case 'right':
        return { x: '0%', y: '-50%' };
      default:
        return { x: '-50%', y: '-100%' };
    }
  };

  const tooltipVariants = {
    hidden: {
      opacity: 0,
      scale: 0.8,
      y: position === 'top' ? 10 : position === 'bottom' ? -10 : 0,
      x: position === 'left' ? 10 : position === 'right' ? -10 : 0,
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      x: 0,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 20,
        duration: 0.2,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      y: position === 'top' ? 10 : position === 'bottom' ? -10 : 0,
      x: position === 'left' ? 10 : position === 'right' ? -10 : 0,
      transition: {
        duration: 0.15,
      },
    },
  };

  const arrowVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { delay: 0.1 },
    },
    exit: { opacity: 0, scale: 0.8 },
  };

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
        className="inline-block"
      >
        {children}
      </div>

      {typeof window !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {isVisible && (
              <motion.div
                className={cn(
                  'fixed z-50 px-3 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg shadow-lg pointer-events-none',
                  'border border-gray-700 backdrop-blur-sm',
                  className
                )}
                style={{
                  left: tooltipPosition.x,
                  top: tooltipPosition.y,
                  transform: `translate(${getTranslateValues().x}, ${getTranslateValues().y})`,
                  transformOrigin: getTransformOrigin(),
                }}
                variants={tooltipVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                {text}

                {/* Arrow */}
                <motion.div
                  className={cn(
                    'absolute w-2 h-2 bg-gray-900 border border-gray-700 transform rotate-45',
                    position === 'top' &&
                      'bottom-[-5px] left-1/2 -translate-x-1/2 border-t-0 border-l-0',
                    position === 'bottom' &&
                      'top-[-5px] left-1/2 -translate-x-1/2 border-b-0 border-r-0',
                    position === 'left' &&
                      'right-[-5px] top-1/2 -translate-y-1/2 border-l-0 border-b-0',
                    position === 'right' &&
                      'left-[-5px] top-1/2 -translate-y-1/2 border-r-0 border-t-0'
                  )}
                  variants={arrowVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                />
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </>
  );
}

// Advanced tooltip with rich content support
interface AdvancedTooltipProps {
  children: ReactNode;
  content: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  className?: string;
  disabled?: boolean;
  maxWidth?: string;
}

export function AdvancedTooltip({
  children,
  content,
  position = 'top',
  delay = 500,
  className = '',
  disabled = false,
  maxWidth = '300px',
}: AdvancedTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const showTooltip = () => {
    if (disabled) return;

    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
      updatePosition();
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  const updatePosition = () => {
    if (!triggerRef.current) return;

    const rect = triggerRef.current.getBoundingClientRect();
    const scrollX = window.pageXOffset;
    const scrollY = window.pageYOffset;

    let x = 0;
    let y = 0;

    switch (position) {
      case 'top':
        x = rect.left + scrollX + rect.width / 2;
        y = rect.top + scrollY - 10;
        break;
      case 'bottom':
        x = rect.left + scrollX + rect.width / 2;
        y = rect.bottom + scrollY + 10;
        break;
      case 'left':
        x = rect.left + scrollX - 10;
        y = rect.top + scrollY + rect.height / 2;
        break;
      case 'right':
        x = rect.right + scrollX + 10;
        y = rect.top + scrollY + rect.height / 2;
        break;
    }

    setTooltipPosition({ x, y });
  };

  useEffect(() => {
    const handleScroll = () => {
      if (isVisible) {
        updatePosition();
      }
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isVisible]);

  const getTransformOrigin = () => {
    switch (position) {
      case 'top':
        return 'bottom center';
      case 'bottom':
        return 'top center';
      case 'left':
        return 'right center';
      case 'right':
        return 'left center';
      default:
        return 'bottom center';
    }
  };

  const getTranslateValues = () => {
    switch (position) {
      case 'top':
        return { x: '-50%', y: '-100%' };
      case 'bottom':
        return { x: '-50%', y: '0%' };
      case 'left':
        return { x: '-100%', y: '-50%' };
      case 'right':
        return { x: '0%', y: '-50%' };
      default:
        return { x: '-50%', y: '-100%' };
    }
  };

  const tooltipVariants = {
    hidden: {
      opacity: 0,
      scale: 0.8,
      y: position === 'top' ? 10 : position === 'bottom' ? -10 : 0,
      x: position === 'left' ? 10 : position === 'right' ? -10 : 0,
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      x: 0,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 20,
        duration: 0.2,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      y: position === 'top' ? 10 : position === 'bottom' ? -10 : 0,
      x: position === 'left' ? 10 : position === 'right' ? -10 : 0,
      transition: {
        duration: 0.15,
      },
    },
  };

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
        className="inline-block"
      >
        {children}
      </div>

      {typeof window !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {isVisible && (
              <motion.div
                className={cn(
                  'fixed z-50 p-4 bg-gray-900 rounded-lg shadow-xl pointer-events-none',
                  'border border-gray-700 backdrop-blur-sm',
                  className
                )}
                style={{
                  left: tooltipPosition.x,
                  top: tooltipPosition.y,
                  transform: `translate(${getTranslateValues().x}, ${getTranslateValues().y})`,
                  transformOrigin: getTransformOrigin(),
                  maxWidth,
                }}
                variants={tooltipVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                {content}

                {/* Arrow */}
                <motion.div
                  className={cn(
                    'absolute w-2 h-2 bg-gray-900 border border-gray-700 transform rotate-45',
                    position === 'top' &&
                      'bottom-[-5px] left-1/2 -translate-x-1/2 border-t-0 border-l-0',
                    position === 'bottom' &&
                      'top-[-5px] left-1/2 -translate-x-1/2 border-b-0 border-r-0',
                    position === 'left' &&
                      'right-[-5px] top-1/2 -translate-y-1/2 border-l-0 border-b-0',
                    position === 'right' &&
                      'left-[-5px] top-1/2 -translate-y-1/2 border-r-0 border-t-0'
                  )}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                    transition: { delay: 0.1 },
                  }}
                  exit={{ opacity: 0, scale: 0.8 }}
                />
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </>
  );
}

// Hook for programmatic tooltip control
export function useTooltip() {
  const [isVisible, setIsVisible] = useState(false);
  const [content, setContent] = useState<ReactNode>('');

  const show = (newContent: ReactNode) => {
    setContent(newContent);
    setIsVisible(true);
  };

  const hide = () => {
    setIsVisible(false);
  };

  const toggle = (newContent?: ReactNode) => {
    if (newContent) setContent(newContent);
    setIsVisible(!isVisible);
  };

  return {
    isVisible,
    content,
    show,
    hide,
    toggle,
  };
}

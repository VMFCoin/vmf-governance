'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Check,
  Clock,
  AlertCircle,
  Save,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMobile } from '@/hooks/useMobile';

export interface Step {
  id: string;
  title: string;
  description?: string;
  isCompleted?: boolean;
  isActive?: boolean;
  isError?: boolean;
  completionPercentage?: number;
  saveStatus?: 'idle' | 'saving' | 'saved' | 'error';
  lastSaved?: Date;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number;
  className?: string;
  showProgress?: boolean;
  showSaveStatus?: boolean;
  onStepClick?: (stepIndex: number) => void;
  variant?: 'vertical' | 'horizontal' | 'mobile';
  enableSwipeNavigation?: boolean;
  onSwipeNext?: () => void;
  onSwipePrevious?: () => void;
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({
  steps,
  currentStep,
  className,
  showProgress = true,
  showSaveStatus = true,
  onStepClick,
  variant = 'vertical',
  enableSwipeNavigation = false,
  onSwipeNext,
  onSwipePrevious,
}) => {
  const { isMobile } = useMobile();
  const [touchStart, setTouchStart] = React.useState<number | null>(null);
  const [touchEnd, setTouchEnd] = React.useState<number | null>(null);

  // Determine layout based on screen size and variant
  const isMobileLayout = variant === 'mobile' || isMobile;
  const layout = isMobileLayout ? 'horizontal' : variant;

  const formatLastSaved = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return date.toLocaleDateString();
  };

  const getSaveStatusIcon = (status: Step['saveStatus']) => {
    switch (status) {
      case 'saving':
        return <Save className="w-3 h-3 text-patriotBlue animate-pulse" />;
      case 'saved':
        return <Check className="w-3 h-3 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-3 h-3 text-patriotRed" />;
      default:
        return null;
    }
  };

  const getSaveStatusText = (status: Step['saveStatus']) => {
    switch (status) {
      case 'saving':
        return 'Saving...';
      case 'saved':
        return 'Saved';
      case 'error':
        return 'Save failed';
      default:
        return '';
    }
  };

  // Touch handlers for swipe navigation
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!enableSwipeNavigation) return;
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!enableSwipeNavigation) return;
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!enableSwipeNavigation || !touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && onSwipeNext) {
      onSwipeNext();
    }
    if (isRightSwipe && onSwipePrevious) {
      onSwipePrevious();
    }
  };

  // Mobile horizontal layout
  if (layout === 'horizontal') {
    return (
      <div
        className={cn('w-full', className)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Mobile Navigation Header */}
        <div className="flex items-center justify-between mb-4 md:hidden">
          <button
            onClick={onSwipePrevious}
            disabled={currentStep === 0}
            className="p-2 rounded-lg bg-backgroundLight disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
          >
            <ChevronLeft className="w-5 h-5 text-patriotBlue" />
          </button>

          <div className="text-center">
            <div className="text-sm font-medium text-patriotWhite">
              Step {currentStep + 1} of {steps.length}
            </div>
            <div className="text-xs text-textSecondary">
              {steps[currentStep]?.title}
            </div>
          </div>

          <button
            onClick={onSwipeNext}
            disabled={currentStep === steps.length - 1}
            className="p-2 rounded-lg bg-backgroundLight disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
          >
            <ChevronRight className="w-5 h-5 text-patriotBlue" />
          </button>
        </div>

        {/* Horizontal Step Indicators */}
        <div className="flex items-center justify-between mb-4 overflow-x-auto scrollbar-hide">
          {steps.map((step, index) => {
            const isActive = index === currentStep;
            const isCompleted = step.isCompleted || index < currentStep;
            const isClickable = onStepClick && (isCompleted || isActive);
            const hasError = step.isError;

            return (
              <div key={step.id} className="flex items-center flex-shrink-0">
                <motion.div
                  className={cn(
                    'flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full border-2 transition-all duration-300 touch-manipulation',
                    {
                      'bg-patriotBlue border-patriotBlue text-white':
                        isCompleted && !hasError,
                      'bg-patriotRed border-patriotRed text-white': hasError,
                      'border-patriotBlue bg-backgroundLight text-patriotBlue':
                        isActive && !hasError,
                      'border-gray-300 bg-backgroundAccent text-textSecondary':
                        !isActive && !isCompleted && !hasError,
                    }
                  )}
                  onClick={() => isClickable && onStepClick?.(index)}
                  whileHover={isClickable ? { scale: 1.05 } : {}}
                  whileTap={isClickable ? { scale: 0.95 } : {}}
                >
                  {hasError ? (
                    <AlertCircle className="w-4 h-4 md:w-5 md:h-5" />
                  ) : isCompleted ? (
                    <Check className="w-4 h-4 md:w-5 md:h-5" />
                  ) : isActive ? (
                    <motion.div
                      className="w-2 h-2 md:w-3 md:h-3 bg-patriotBlue rounded-full"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  ) : (
                    <span className="text-xs md:text-sm font-medium">
                      {index + 1}
                    </span>
                  )}
                </motion.div>

                {/* Connection Line */}
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      'w-8 md:w-12 h-0.5 mx-2 transition-colors duration-300',
                      isCompleted ? 'bg-patriotBlue' : 'bg-gray-300'
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Current Step Details */}
        <motion.div
          key={currentStep}
          className="bg-backgroundLight rounded-lg p-4 border border-patriotBlue/20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-base font-medium text-patriotWhite mb-1">
                {steps[currentStep]?.title}
              </h3>
              {steps[currentStep]?.description && (
                <p className="text-sm text-textSecondary mb-3">
                  {steps[currentStep].description}
                </p>
              )}

              {/* Progress for current step */}
              {showProgress &&
                steps[currentStep]?.completionPercentage !== undefined && (
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-xs text-textSecondary mb-1">
                      <span>Progress</span>
                      <span>{steps[currentStep].completionPercentage}%</span>
                    </div>
                    <div className="w-full bg-backgroundAccent rounded-full h-2">
                      <motion.div
                        className="bg-patriotBlue h-2 rounded-full"
                        initial={{ width: 0 }}
                        animate={{
                          width: `${steps[currentStep].completionPercentage}%`,
                        }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                  </div>
                )}
            </div>

            {/* Save Status */}
            {showSaveStatus &&
              steps[currentStep]?.saveStatus &&
              steps[currentStep].saveStatus !== 'idle' && (
                <div className="flex items-center gap-2 ml-4">
                  {getSaveStatusIcon(steps[currentStep].saveStatus)}
                  <div className="text-right">
                    <p className="text-xs text-textSecondary">
                      {getSaveStatusText(steps[currentStep].saveStatus)}
                    </p>
                    {steps[currentStep].saveStatus === 'saved' &&
                      steps[currentStep].lastSaved && (
                        <p className="text-xs text-textSecondary opacity-75">
                          {formatLastSaved(steps[currentStep].lastSaved!)}
                        </p>
                      )}
                  </div>
                </div>
              )}
          </div>

          {/* Error Message */}
          {steps[currentStep]?.isError && (
            <motion.div
              className="mt-3 text-xs text-patriotRed bg-patriotRed/10 border border-patriotRed/30 rounded px-3 py-2"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              Please review and correct the errors in this step
            </motion.div>
          )}
        </motion.div>

        {/* Overall Progress Summary */}
        {showProgress && (
          <motion.div
            className="mt-4 p-3 bg-backgroundLight rounded-lg border border-patriotBlue/20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-textBase font-medium">
                Overall Progress
              </span>
              <span className="text-textSecondary">
                {Math.round((currentStep / (steps.length - 1)) * 100)}% Complete
              </span>
            </div>
            <div className="w-full bg-backgroundAccent rounded-full h-2">
              <motion.div
                className="bg-gradient-to-r from-patriotBlue to-patriotRed h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{
                  width: `${(currentStep / (steps.length - 1)) * 100}%`,
                }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            </div>
            <div className="mt-2 flex justify-between text-xs text-textSecondary">
              <span>
                {steps.filter(step => step.isCompleted).length} completed
              </span>
              <span>{steps.length - currentStep - 1} remaining</span>
            </div>
          </motion.div>
        )}

        {/* Swipe Hint */}
        {enableSwipeNavigation && (
          <motion.div
            className="mt-3 text-center text-xs text-textSecondary md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            Swipe left or right to navigate steps
          </motion.div>
        )}
      </div>
    );
  }

  // Original vertical layout for desktop
  return (
    <div className={cn('w-full', className)}>
      <nav aria-label="Progress">
        <ol className="space-y-6">
          {steps.map((step, index) => {
            const isActive = index === currentStep;
            const isCompleted = step.isCompleted || index < currentStep;
            const isClickable = onStepClick && (isCompleted || isActive);
            const hasError = step.isError;

            return (
              <li key={step.id} className="relative">
                <motion.div
                  className={cn(
                    'group flex items-start',
                    isClickable && 'cursor-pointer'
                  )}
                  onClick={() => isClickable && onStepClick?.(index)}
                  whileHover={isClickable ? { scale: 1.01 } : {}}
                  whileTap={isClickable ? { scale: 0.99 } : {}}
                >
                  {/* Step Indicator */}
                  <div className="flex-shrink-0 relative">
                    <motion.div
                      className={cn(
                        'flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300',
                        {
                          'bg-patriotBlue border-patriotBlue text-white shadow-patriot-glow':
                            isCompleted && !hasError,
                          'bg-patriotRed border-patriotRed text-white shadow-lg':
                            hasError,
                          'border-patriotBlue bg-backgroundLight text-patriotBlue ring-4 ring-patriotBlue/20':
                            isActive && !hasError,
                          'border-gray-300 bg-backgroundAccent text-textSecondary':
                            !isActive && !isCompleted && !hasError,
                        }
                      )}
                      initial={false}
                      animate={{
                        scale: isActive ? 1.1 : 1,
                        boxShadow: isActive
                          ? '0 0 20px rgba(59, 130, 246, 0.5)'
                          : '0 0 0px rgba(0, 0, 0, 0)',
                      }}
                      transition={{ duration: 0.3 }}
                    >
                      {hasError ? (
                        <AlertCircle className="w-5 h-5" />
                      ) : isCompleted ? (
                        <Check className="w-5 h-5" />
                      ) : isActive ? (
                        <motion.div
                          className="w-3 h-3 bg-patriotBlue rounded-full"
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                      ) : (
                        <span className="text-sm font-medium">{index + 1}</span>
                      )}
                    </motion.div>

                    {/* Connection Line */}
                    {index < steps.length - 1 && (
                      <motion.div
                        className={cn(
                          'absolute top-10 left-5 w-0.5 h-6 transition-colors duration-500',
                          isCompleted ? 'bg-patriotBlue' : 'bg-gray-300'
                        )}
                        initial={false}
                        animate={{
                          scaleY: isCompleted ? 1 : 0.3,
                          opacity: isCompleted ? 1 : 0.3,
                        }}
                        transition={{ duration: 0.5 }}
                      />
                    )}
                  </div>

                  {/* Step Content */}
                  <div className="ml-4 flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3
                          className={cn(
                            'text-base font-medium transition-colors duration-300',
                            {
                              'text-patriotWhite': isActive,
                              'text-patriotBlue': isCompleted && !hasError,
                              'text-patriotRed': hasError,
                              'text-textSecondary': !isActive && !isCompleted,
                            }
                          )}
                        >
                          {step.title}
                        </h3>
                        {step.description && (
                          <p
                            className={cn(
                              'mt-1 text-sm transition-colors duration-300',
                              {
                                'text-textSecondary': isActive || isCompleted,
                                'text-textSecondary/70':
                                  !isActive && !isCompleted,
                              }
                            )}
                          >
                            {step.description}
                          </p>
                        )}

                        {/* Progress for current step */}
                        {showProgress &&
                          isActive &&
                          step.completionPercentage !== undefined && (
                            <div className="mt-3">
                              <div className="flex items-center justify-between text-xs text-textSecondary mb-1">
                                <span>Progress</span>
                                <span>{step.completionPercentage}%</span>
                              </div>
                              <div className="w-full bg-backgroundAccent rounded-full h-2">
                                <motion.div
                                  className="bg-patriotBlue h-2 rounded-full"
                                  initial={{ width: 0 }}
                                  animate={{
                                    width: `${step.completionPercentage}%`,
                                  }}
                                  transition={{ duration: 0.5 }}
                                />
                              </div>
                            </div>
                          )}
                      </div>

                      {/* Save Status */}
                      {showSaveStatus &&
                        step.saveStatus &&
                        step.saveStatus !== 'idle' && (
                          <div className="flex items-center gap-2 ml-4">
                            {getSaveStatusIcon(step.saveStatus)}
                            <div className="text-right">
                              <p className="text-xs text-textSecondary">
                                {getSaveStatusText(step.saveStatus)}
                              </p>
                              {step.saveStatus === 'saved' &&
                                step.lastSaved && (
                                  <p className="text-xs text-textSecondary opacity-75">
                                    {formatLastSaved(step.lastSaved)}
                                  </p>
                                )}
                            </div>
                          </div>
                        )}
                    </div>

                    {/* Error Message */}
                    {hasError && (
                      <motion.div
                        className="mt-2 text-xs text-patriotRed bg-patriotRed/10 border border-patriotRed/30 rounded px-2 py-1"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        Please review and correct the errors in this step
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              </li>
            );
          })}
        </ol>
      </nav>

      {/* Overall Progress Summary */}
      {showProgress && (
        <motion.div
          className="mt-6 p-4 bg-backgroundLight rounded-lg border border-patriotBlue/20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between text-sm">
            <span className="text-textBase font-medium">Overall Progress</span>
            <span className="text-textSecondary">
              {Math.round((currentStep / (steps.length - 1)) * 100)}% Complete
            </span>
          </div>
          <div className="mt-2 w-full bg-backgroundAccent rounded-full h-2">
            <motion.div
              className="bg-gradient-to-r from-patriotBlue to-patriotRed h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{
                width: `${(currentStep / (steps.length - 1)) * 100}%`,
              }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
          <div className="mt-2 flex justify-between text-xs text-textSecondary">
            <span>
              Step {currentStep + 1} of {steps.length}
            </span>
            <span>
              {steps.filter(step => step.isCompleted).length} completed
            </span>
          </div>
        </motion.div>
      )}
    </div>
  );
};

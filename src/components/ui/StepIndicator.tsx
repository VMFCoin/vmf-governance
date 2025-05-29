'use client';

import React from 'react';
import { Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeInVariants, springConfigs } from '@/lib/animations';
import { cn } from '@/lib/utils';

interface Step {
  id: number;
  title: string;
  description: string;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number;
  className?: string;
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({
  steps,
  currentStep,
  className,
}) => {
  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = currentStep > step.id;
          const isCurrent = currentStep === step.id;
          const isUpcoming = currentStep < step.id;

          return (
            <motion.div
              key={step.id}
              className="flex items-center flex-1"
              variants={fadeInVariants}
              initial="initial"
              animate="enter"
              transition={{ delay: index * 0.1 }}
            >
              {/* Step Circle */}
              <div className="flex flex-col items-center">
                <motion.div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center border-2 relative',
                    {
                      'bg-patriotRed border-patriotRed text-patriotWhite':
                        isCompleted,
                      'bg-patriotBlue border-patriotBlue text-patriotWhite':
                        isCurrent,
                      'bg-backgroundLight border-patriotBlue/30 text-textSecondary':
                        isUpcoming,
                    }
                  )}
                  whileHover={{
                    scale: 1.1,
                    transition: springConfigs.snappy,
                  }}
                  animate={{
                    scale: isCurrent ? [1, 1.1, 1] : 1,
                  }}
                  transition={{
                    scale: isCurrent
                      ? {
                          duration: 2,
                          repeat: Infinity,
                          ease: 'easeInOut',
                        }
                      : springConfigs.gentle,
                  }}
                >
                  {/* Pulse ring for current step */}
                  {isCurrent && (
                    <motion.div
                      className="absolute inset-0 rounded-full border-2 border-patriotBlue"
                      initial={{ scale: 1, opacity: 1 }}
                      animate={{
                        scale: [1, 1.5, 2],
                        opacity: [1, 0.5, 0],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'easeOut',
                      }}
                    />
                  )}

                  <AnimatePresence mode="wait">
                    {isCompleted ? (
                      <motion.div
                        key="check"
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0, rotate: 180 }}
                        transition={springConfigs.bouncy}
                      >
                        <Check className="w-5 h-5" />
                      </motion.div>
                    ) : (
                      <motion.span
                        key="number"
                        className="text-sm font-semibold"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        transition={springConfigs.gentle}
                      >
                        {step.id}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.div>

                {/* Step Info */}
                <motion.div
                  className="mt-3 text-center max-w-24"
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: index * 0.1 + 0.2 }}
                >
                  <motion.p
                    className={cn('text-sm font-medium transition-colors', {
                      'text-patriotWhite': isCurrent || isCompleted,
                      'text-textSecondary': isUpcoming,
                    })}
                    animate={{
                      color: isCurrent
                        ? ['#ffffff', '#ef4444', '#ffffff']
                        : undefined,
                    }}
                    transition={{
                      duration: 2,
                      repeat: isCurrent ? Infinity : 0,
                      ease: 'easeInOut',
                    }}
                  >
                    {step.title}
                  </motion.p>
                  <motion.p
                    className={cn('text-xs mt-1 transition-colors', {
                      'text-textSecondary': isCurrent || isCompleted,
                      'text-textSecondary/60': isUpcoming,
                    })}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.1 + 0.3 }}
                  >
                    {step.description}
                  </motion.p>
                </motion.div>
              </div>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="flex-1 h-0.5 mx-4 mt-[-2rem] relative">
                  {/* Background line */}
                  <div className="h-full bg-patriotBlue/30 rounded-full" />

                  {/* Progress line */}
                  <motion.div
                    className="absolute top-0 left-0 h-full bg-patriotRed rounded-full"
                    initial={{ width: '0%' }}
                    animate={{
                      width: currentStep > step.id ? '100%' : '0%',
                    }}
                    transition={{
                      duration: 0.8,
                      ease: 'easeInOut',
                      delay: currentStep > step.id ? index * 0.2 : 0,
                    }}
                  />

                  {/* Animated dots for active progress */}
                  {currentStep > step.id && (
                    <motion.div
                      className="absolute top-1/2 left-0 w-2 h-2 bg-patriotRed rounded-full transform -translate-y-1/2"
                      animate={{
                        x: ['0%', '100%'],
                        opacity: [1, 0.5, 1],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                    />
                  )}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

'use client';

import React from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';
import { cn } from '@/lib/utils';
import { PercentageCounter } from '@/components/ui/AnimatedCounter';

interface VoteChartProps {
  yesPercentage: number;
  noPercentage: number;
  abstainPercentage: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const VoteChart: React.FC<VoteChartProps> = ({
  yesPercentage,
  noPercentage,
  abstainPercentage,
  size = 'md',
  className,
}) => {
  const sizeMap = {
    sm: { width: 120, height: 120, strokeWidth: 8 },
    md: { width: 160, height: 160, strokeWidth: 12 },
    lg: { width: 200, height: 200, strokeWidth: 16 },
  };

  const { width, height, strokeWidth } = sizeMap[size];
  const radius = (width - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Animated values for smooth transitions
  const yesSpring = useSpring(0, { stiffness: 100, damping: 30 });
  const noSpring = useSpring(0, { stiffness: 100, damping: 30 });
  const abstainSpring = useSpring(0, { stiffness: 100, damping: 30 });

  // Transform springs to stroke dash arrays
  const yesLength = useTransform(
    yesSpring,
    value => (value / 100) * circumference
  );
  const noLength = useTransform(
    noSpring,
    value => (value / 100) * circumference
  );
  const abstainLength = useTransform(
    abstainSpring,
    value => (value / 100) * circumference
  );

  // Calculate rotation offsets
  const yesOffset = 0;
  const noOffset = useTransform(yesLength, (value: number) => value);
  const abstainOffset = useTransform(
    [yesLength, noLength],
    (values: number[]) => values[0] + values[1]
  );

  React.useEffect(() => {
    // Stagger the animations
    setTimeout(() => yesSpring.set(yesPercentage), 100);
    setTimeout(() => noSpring.set(noPercentage), 300);
    setTimeout(() => abstainSpring.set(abstainPercentage), 500);
  }, [
    yesPercentage,
    noPercentage,
    abstainPercentage,
    yesSpring,
    noSpring,
    abstainSpring,
  ]);

  const totalParticipation = yesPercentage + noPercentage + abstainPercentage;

  return (
    <motion.div
      className={cn('relative', className)}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <svg width={width} height={height} className="transform -rotate-90">
        {/* Background circle */}
        <motion.circle
          cx={width / 2}
          cy={height / 2}
          r={radius}
          fill="none"
          stroke="rgba(27, 41, 81, 0.3)"
          strokeWidth={strokeWidth}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
        />

        {/* Yes votes */}
        {yesPercentage > 0 && (
          <motion.circle
            cx={width / 2}
            cy={height / 2}
            r={radius}
            fill="none"
            stroke="#10B981"
            strokeWidth={strokeWidth}
            strokeDasharray={yesLength as any}
            strokeDashoffset={-yesOffset}
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1, delay: 0.2, ease: 'easeOut' }}
          />
        )}

        {/* No votes */}
        {noPercentage > 0 && (
          <motion.circle
            cx={width / 2}
            cy={height / 2}
            r={radius}
            fill="none"
            stroke="#EF4444"
            strokeWidth={strokeWidth}
            strokeDasharray={noLength as any}
            strokeDashoffset={noOffset as any}
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1, delay: 0.4, ease: 'easeOut' }}
          />
        )}

        {/* Abstain votes */}
        {abstainPercentage > 0 && (
          <motion.circle
            cx={width / 2}
            cy={height / 2}
            r={radius}
            fill="none"
            stroke="#6B7280"
            strokeWidth={strokeWidth}
            strokeDasharray={abstainLength as any}
            strokeDashoffset={abstainOffset as any}
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1, delay: 0.6, ease: 'easeOut' }}
          />
        )}
      </svg>

      {/* Center content */}
      <motion.div
        className="absolute top-0 left-0 flex items-center justify-center pointer-events-none"
        style={{ width: `${width}px`, height: `${height}px` }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.8, ease: 'backOut' }}
      >
        <div className="text-center">
          <div className="text-2xl font-display font-bold text-patriotWhite">
            <PercentageCounter
              value={totalParticipation}
              className="text-2xl font-display font-bold text-patriotWhite"
            />
          </div>
          <motion.div
            className="text-xs text-textSecondary"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 1 }}
          >
            Participation
          </motion.div>
        </div>
      </motion.div>

      {/* Legend */}
      <motion.div
        className="mt-4 flex justify-center gap-4 text-sm"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 1.2 }}
      >
        <motion.div
          className="flex items-center gap-2"
          whileHover={{ scale: 1.05 }}
          transition={{ type: 'spring', stiffness: 400, damping: 10 }}
        >
          <motion.div
            className="w-3 h-3 bg-green-500 rounded-full"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3, delay: 1.3, type: 'spring' }}
          />
          <span className="text-textSecondary">
            Yes (<PercentageCounter value={yesPercentage} />)
          </span>
        </motion.div>
        <motion.div
          className="flex items-center gap-2"
          whileHover={{ scale: 1.05 }}
          transition={{ type: 'spring', stiffness: 400, damping: 10 }}
        >
          <motion.div
            className="w-3 h-3 bg-red-500 rounded-full"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3, delay: 1.4, type: 'spring' }}
          />
          <span className="text-textSecondary">
            No (<PercentageCounter value={noPercentage} />)
          </span>
        </motion.div>
        {abstainPercentage > 0 && (
          <motion.div
            className="flex items-center gap-2"
            whileHover={{ scale: 1.05 }}
            transition={{ type: 'spring', stiffness: 400, damping: 10 }}
          >
            <motion.div
              className="w-3 h-3 bg-gray-500 rounded-full"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3, delay: 1.5, type: 'spring' }}
            />
            <span className="text-textSecondary">
              Abstain (<PercentageCounter value={abstainPercentage} />)
            </span>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
};

// Bar Chart Component
interface VoteBarChartProps {
  yesPercentage: number;
  noPercentage: number;
  abstainPercentage: number;
  className?: string;
}

export const VoteBarChart: React.FC<VoteBarChartProps> = ({
  yesPercentage,
  noPercentage,
  abstainPercentage,
  className,
}) => {
  return (
    <motion.div
      className={cn('space-y-4', className)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Yes Bar */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div className="flex justify-between text-sm mb-2">
          <span className="text-green-400 font-medium">Yes</span>
          <span className="text-patriotWhite">
            <PercentageCounter value={yesPercentage} />
          </span>
        </div>
        <div className="w-full bg-backgroundDark rounded-full h-3 overflow-hidden">
          <motion.div
            className="bg-green-500 h-3 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${yesPercentage}%` }}
            transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
          />
        </div>
      </motion.div>

      {/* No Bar */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <div className="flex justify-between text-sm mb-2">
          <span className="text-red-400 font-medium">No</span>
          <span className="text-patriotWhite">
            <PercentageCounter value={noPercentage} />
          </span>
        </div>
        <div className="w-full bg-backgroundDark rounded-full h-3 overflow-hidden">
          <motion.div
            className="bg-red-500 h-3 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${noPercentage}%` }}
            transition={{ duration: 1, delay: 0.5, ease: 'easeOut' }}
          />
        </div>
      </motion.div>

      {/* Abstain Bar */}
      {abstainPercentage > 0 && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-400 font-medium">Abstain</span>
            <span className="text-patriotWhite">
              <PercentageCounter value={abstainPercentage} />
            </span>
          </div>
          <div className="w-full bg-backgroundDark rounded-full h-3 overflow-hidden">
            <motion.div
              className="bg-gray-500 h-3 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${abstainPercentage}%` }}
              transition={{ duration: 1, delay: 0.7, ease: 'easeOut' }}
            />
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

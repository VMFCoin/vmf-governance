'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Timer,
  Clock,
  CheckCircle,
  Zap,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { Card } from '../ui';
import { TokenLock } from '@/types';
import { cn } from '@/lib/utils';
import { fadeInVariants } from '@/lib/animations';

interface WarmupTimerProps {
  lock: TokenLock;
  onWarmupComplete?: (lockId: number) => void;
  className?: string;
  compact?: boolean;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

export const WarmupTimer: React.FC<WarmupTimerProps> = ({
  lock,
  onWarmupComplete,
  className,
  compact = false,
}) => {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    total: 0,
  });
  const [isComplete, setIsComplete] = useState(false);

  const calculateTimeRemaining = (): TimeRemaining => {
    if (!lock.warmupEndsAt || lock.isWarmupComplete) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
    }

    const now = new Date().getTime();
    const warmupEnd = lock.warmupEndsAt.getTime();
    const total = warmupEnd - now;

    if (total <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
    }

    const days = Math.floor(total / (1000 * 60 * 60 * 24));
    const hours = Math.floor(
      (total % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );
    const minutes = Math.floor((total % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((total % (1000 * 60)) / 1000);

    return { days, hours, minutes, seconds, total };
  };

  const calculateProgress = (): number => {
    if (!lock.warmupEndsAt || lock.isWarmupComplete) return 100;

    const now = new Date().getTime();
    const start = lock.createdAt.getTime();
    const end = lock.warmupEndsAt.getTime();
    const elapsed = now - start;
    const total = end - start;

    return Math.max(0, Math.min(100, (elapsed / total) * 100));
  };

  useEffect(() => {
    const updateTimer = () => {
      const remaining = calculateTimeRemaining();
      setTimeRemaining(remaining);

      if (remaining.total <= 0 && !isComplete) {
        setIsComplete(true);
        if (onWarmupComplete) {
          onWarmupComplete(lock.id);
        }
      }
    };

    // Update immediately
    updateTimer();

    // Set up interval to update every second
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [lock, isComplete, onWarmupComplete]);

  const formatTokenAmount = (amount: bigint): string => {
    return (Number(amount) / 1e18).toLocaleString(undefined, {
      maximumFractionDigits: 2,
    });
  };

  const progress = calculateProgress();
  const isWarmupActive = !lock.isWarmupComplete && timeRemaining.total > 0;

  if (lock.isWarmupComplete || isComplete) {
    return (
      <motion.div
        variants={fadeInVariants}
        initial="initial"
        animate="enter"
        className={className}
      >
        <Card className={cn('p-4', compact && 'p-3')}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-patriotWhite">
                  Lock #{lock.id}
                </span>
                <span className="text-sm text-green-400 font-medium">
                  Warmup Complete
                </span>
              </div>
              <div className="text-sm text-textSecondary">
                Voting power is now active:{' '}
                {formatTokenAmount(lock.votingPower)} VMF
              </div>
            </div>
            <Zap className="w-5 h-5 text-yellow-400" />
          </div>
        </Card>
      </motion.div>
    );
  }

  if (!isWarmupActive) {
    return null;
  }

  if (compact) {
    return (
      <motion.div
        variants={fadeInVariants}
        initial="initial"
        animate="enter"
        className={className}
      >
        <Card className="p-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-orange-500/20 rounded-full flex items-center justify-center">
              <Timer className="w-4 h-4 text-orange-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-patriotWhite text-sm">
                  Lock #{lock.id}
                </span>
                <span className="text-xs text-orange-400">Warming Up</span>
              </div>
              <div className="text-xs text-textSecondary">
                {timeRemaining.days > 0 && `${timeRemaining.days}d `}
                {timeRemaining.hours}h {timeRemaining.minutes}m{' '}
                {timeRemaining.seconds}s
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-textSecondary">Progress</div>
              <div className="text-sm font-semibold text-orange-400">
                {Math.round(progress)}%
              </div>
            </div>
          </div>

          {/* Compact Progress Bar */}
          <div className="w-full bg-backgroundAccent rounded-full h-1.5 mt-2">
            <motion.div
              className="h-1.5 rounded-full bg-orange-400"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={fadeInVariants}
      initial="initial"
      animate="enter"
      className={className}
    >
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-orange-500/20 rounded-full flex items-center justify-center">
            <Timer className="w-6 h-6 text-orange-400" />
          </div>
          <div>
            <h3 className="text-lg font-display font-bold text-patriotWhite">
              Lock #{lock.id} Warming Up
            </h3>
            <p className="text-textSecondary">
              Voting power will be active when warmup completes
            </p>
          </div>
        </div>

        {/* Lock Details */}
        <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-backgroundAccent rounded-lg border border-patriotBlue/20">
          <div>
            <div className="text-sm text-textSecondary mb-1">Locked Amount</div>
            <div className="font-semibold text-patriotWhite">
              {formatTokenAmount(lock.amount)} VMF
            </div>
          </div>
          <div>
            <div className="text-sm text-textSecondary mb-1">
              Future Voting Power
            </div>
            <div className="font-semibold text-yellow-400">
              {formatTokenAmount(lock.votingPower)} VMF
            </div>
          </div>
        </div>

        {/* Countdown Timer */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-orange-400" />
            <span className="font-semibold text-patriotWhite">
              Time Remaining
            </span>
          </div>

          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Days', value: timeRemaining.days },
              { label: 'Hours', value: timeRemaining.hours },
              { label: 'Minutes', value: timeRemaining.minutes },
              { label: 'Seconds', value: timeRemaining.seconds },
            ].map(unit => (
              <div
                key={unit.label}
                className="text-center p-4 bg-gradient-to-b from-patriotBlue/10 to-patriotRed/10 rounded-lg border border-patriotBlue/30"
              >
                <motion.div
                  key={unit.value}
                  initial={{ scale: 1.2, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.2 }}
                  className="text-2xl font-bold text-patriotWhite mb-1"
                >
                  {unit.value.toString().padStart(2, '0')}
                </motion.div>
                <div className="text-xs text-textSecondary uppercase tracking-wide">
                  {unit.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm text-textSecondary mb-2">
            <span>Warmup Progress</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <div className="w-full bg-backgroundAccent rounded-full h-3">
            <motion.div
              className="h-3 rounded-full bg-gradient-to-r from-orange-400 to-yellow-400"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        {/* Completion Info */}
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-200">
              <p className="font-semibold mb-1">Warmup Period Information:</p>
              <ul className="space-y-1 text-yellow-200/80">
                <li>
                  • Your tokens are locked but voting power is not yet active
                </li>
                <li>
                  • Warmup completes on{' '}
                  {lock.warmupEndsAt?.toLocaleDateString()} at{' '}
                  {lock.warmupEndsAt?.toLocaleTimeString()}
                </li>
                <li>
                  • You'll be able to use your voting power for governance
                  proposals
                </li>
              </ul>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

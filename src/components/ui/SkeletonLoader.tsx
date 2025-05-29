'use client';

import { motion } from 'framer-motion';
import { skeletonVariants } from '@/lib/animations';
import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

export function Skeleton({
  className = '',
  variant = 'rectangular',
  width,
  height,
  animation = 'pulse',
}: SkeletonProps) {
  const baseClasses = 'bg-gray-300 dark:bg-gray-700';

  const variantClasses = {
    text: 'rounded-sm',
    circular: 'rounded-full',
    rectangular: 'rounded-none',
    rounded: 'rounded-lg',
  };

  const animationVariants = {
    pulse: {
      opacity: [0.6, 1, 0.6],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
    wave: {
      backgroundPosition: ['-200px 0', '200px 0'],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: 'linear',
      },
    },
    none: {},
  };

  const style = {
    width: width || '100%',
    height: height || (variant === 'text' ? '1em' : '20px'),
    ...(animation === 'wave' && {
      background:
        'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
      backgroundSize: '200px 100%',
    }),
  };

  return (
    <motion.div
      className={cn(baseClasses, variantClasses[variant], className)}
      style={style}
      animate={animation !== 'none' ? animationVariants[animation] : undefined}
    />
  );
}

// Specialized skeleton components
export function TextSkeleton({
  lines = 1,
  className = '',
  lastLineWidth = '75%',
}: {
  lines?: number;
  className?: string;
  lastLineWidth?: string;
}) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton
          key={i}
          variant="text"
          height="1em"
          width={i === lines - 1 && lines > 1 ? lastLineWidth : '100%'}
        />
      ))}
    </div>
  );
}

export function AvatarSkeleton({
  size = 40,
  className = '',
}: {
  size?: number;
  className?: string;
}) {
  return (
    <Skeleton
      variant="circular"
      width={size}
      height={size}
      className={className}
    />
  );
}

export function ButtonSkeleton({
  className = '',
  width = '120px',
  height = '40px',
}: {
  className?: string;
  width?: string;
  height?: string;
}) {
  return (
    <Skeleton
      variant="rounded"
      width={width}
      height={height}
      className={className}
    />
  );
}

// Complex skeleton layouts
export function ProposalCardSkeleton({
  className = '',
}: {
  className?: string;
}) {
  return (
    <div
      className={cn(
        'bg-backgroundCard border border-patriotBlue/30 rounded-xl p-6 space-y-4',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <Skeleton variant="rounded" width="80px" height="24px" />
        <Skeleton variant="text" width="60px" height="16px" />
      </div>

      {/* Title */}
      <TextSkeleton lines={2} />

      {/* Author */}
      <div className="flex items-center space-x-2">
        <AvatarSkeleton size={16} />
        <Skeleton variant="text" width="120px" height="14px" />
      </div>

      {/* Description */}
      <TextSkeleton lines={3} lastLineWidth="60%" />

      {/* Vote Chart and Progress */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="flex justify-center">
          <Skeleton variant="circular" width="120px" height="120px" />
        </div>
        <div className="space-y-4">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="space-y-2">
              <div className="flex justify-between">
                <Skeleton variant="text" width="40px" height="14px" />
                <Skeleton variant="text" width="30px" height="14px" />
              </div>
              <Skeleton variant="rounded" width="100%" height="10px" />
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-patriotBlue/40">
        <Skeleton variant="text" width="100px" height="14px" />
        <Skeleton variant="text" width="120px" height="14px" />
      </div>

      {/* Button */}
      <ButtonSkeleton width="100%" height="44px" />
    </div>
  );
}

export function CommunityPostSkeleton({
  className = '',
}: {
  className?: string;
}) {
  return (
    <div
      className={cn(
        'bg-backgroundCard border border-patriotBlue/30 rounded-xl p-6 space-y-4',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center space-x-3">
        <AvatarSkeleton size={40} />
        <div className="flex-1 space-y-1">
          <Skeleton variant="text" width="120px" height="16px" />
          <Skeleton variant="text" width="80px" height="14px" />
        </div>
      </div>

      {/* Content */}
      <TextSkeleton lines={4} lastLineWidth="80%" />

      {/* Actions */}
      <div className="flex items-center space-x-4 pt-2">
        <Skeleton variant="text" width="60px" height="14px" />
        <Skeleton variant="text" width="80px" height="14px" />
        <Skeleton variant="text" width="50px" height="14px" />
      </div>
    </div>
  );
}

export function DashboardStatsSkeleton({
  className = '',
}: {
  className?: string;
}) {
  return (
    <div
      className={cn(
        'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6',
        className
      )}
    >
      {Array.from({ length: 4 }, (_, i) => (
        <div
          key={i}
          className="bg-backgroundCard border border-patriotBlue/30 rounded-xl p-6 space-y-4"
        >
          <div className="flex items-center justify-between">
            <Skeleton variant="circular" width="40px" height="40px" />
            <Skeleton variant="text" width="60px" height="14px" />
          </div>
          <div className="space-y-2">
            <Skeleton variant="text" width="80px" height="24px" />
            <Skeleton variant="text" width="120px" height="14px" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({
  rows = 5,
  columns = 4,
  className = '',
}: {
  rows?: number;
  columns?: number;
  className?: string;
}) {
  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
      >
        {Array.from({ length: columns }, (_, i) => (
          <Skeleton key={i} variant="text" height="20px" />
        ))}
      </div>

      {/* Rows */}
      {Array.from({ length: rows }, (_, rowIndex) => (
        <div
          key={rowIndex}
          className="grid gap-4 py-3 border-b border-patriotBlue/20"
          style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
        >
          {Array.from({ length: columns }, (_, colIndex) => (
            <Skeleton
              key={colIndex}
              variant="text"
              height="16px"
              width={colIndex === 0 ? '80%' : '60%'}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

// Loading screen skeleton
export function LoadingScreenSkeleton() {
  return (
    <div className="min-h-screen bg-backgroundPrimary p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Skeleton variant="text" width="200px" height="32px" />
          <div className="flex items-center space-x-4">
            <Skeleton variant="rounded" width="120px" height="40px" />
            <AvatarSkeleton size={40} />
          </div>
        </div>

        {/* Stats */}
        <DashboardStatsSkeleton />

        {/* Main content */}
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {Array.from({ length: 3 }, (_, i) => (
              <ProposalCardSkeleton key={i} />
            ))}
          </div>
          <div className="space-y-6">
            {Array.from({ length: 4 }, (_, i) => (
              <CommunityPostSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Specific skeleton components for different UI elements
export function VoteChartSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
      <Skeleton variant="text" width="150px" height="1.5rem" className="mb-6" />

      <div className="space-y-4">
        {/* Vote options skeleton */}
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="space-y-2">
            <div className="flex justify-between items-center">
              <Skeleton variant="text" width="100px" height="1rem" />
              <Skeleton variant="text" width="60px" height="1rem" />
            </div>
            <Skeleton
              variant="rectangular"
              height="8px"
              className="rounded-full"
            />
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center">
          <Skeleton variant="text" width="120px" height="1rem" />
          <Skeleton variant="text" width="80px" height="1rem" />
        </div>
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton
            variant="text"
            width="200px"
            height="2rem"
            className="mb-2"
          />
          <Skeleton variant="text" width="300px" height="1rem" />
        </div>
        <Skeleton variant="rectangular" width="120px" height="40px" />
      </div>

      {/* Stats cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center justify-between mb-4">
              <Skeleton variant="text" width="100px" height="1rem" />
              <Skeleton variant="circular" width="40px" height="40px" />
            </div>
            <Skeleton
              variant="text"
              width="80px"
              height="2rem"
              className="mb-2"
            />
            <Skeleton variant="text" width="120px" height="0.875rem" />
          </div>
        ))}
      </div>

      {/* Main content skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <VoteChartSkeleton />
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <ProposalCardSkeleton key={index} />
          ))}
        </div>
      </div>
    </div>
  );
}

// Loading spinner with animation
export function LoadingSpinner({
  size = 'md',
  className = '',
}: {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <motion.div
      className={cn(
        'border-2 border-gray-200 border-t-blue-500 rounded-full',
        sizeClasses[size],
        className
      )}
      animate={{ rotate: 360 }}
      transition={{
        duration: 1,
        repeat: Infinity,
        ease: 'linear',
      }}
    />
  );
}

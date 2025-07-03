'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Clock,
  CheckCircle,
  AlertTriangle,
  Calendar,
  Vote,
  Timer,
  Play,
  Pause,
} from 'lucide-react';
import { Badge } from '@/components/ui';
import { SimpleTooltip } from '@/components/ui/AnimatedTooltip';
import { useHolidayStore } from '@/stores/useHolidayStore';
import { HolidayVotingStatus } from '@/stores/useHolidayStore';
import { cn } from '@/lib/utils';

interface VotingStatusIndicatorProps {
  holidayId?: string;
  proposalId?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
}

export const VotingStatusIndicator: React.FC<VotingStatusIndicatorProps> = ({
  holidayId,
  proposalId,
  className,
  size = 'md',
  showDetails = false,
}) => {
  const { getHolidayVotingStatus } = useHolidayStore();

  // Get voting status if we have a holiday ID
  const votingStatus: HolidayVotingStatus | null = holidayId
    ? getHolidayVotingStatus(holidayId)
    : null;

  if (!votingStatus) {
    return null;
  }

  const getStatusConfig = (phase: HolidayVotingStatus['phase']) => {
    switch (phase) {
      case 'waiting':
        return {
          icon: Timer,
          label: 'Waiting',
          color: 'bg-gray-500',
          textColor: 'text-gray-400',
          badgeVariant: 'secondary' as const,
          tooltip: 'Voting has not started yet',
        };
      case 'voting_soon':
        return {
          icon: AlertTriangle,
          label: 'Voting Soon',
          color: 'bg-yellow-500',
          textColor: 'text-yellow-400',
          badgeVariant: 'warning' as const,
          tooltip: `Voting starts in ${votingStatus.daysUntilVotingStarts} days`,
        };
      case 'voting_active':
        return {
          icon: Vote,
          label: 'Voting Active',
          color: 'bg-green-500',
          textColor: 'text-green-400',
          badgeVariant: 'success' as const,
          tooltip: `${votingStatus.daysUntilVotingEnds} days left to vote`,
        };
      case 'voting_ended':
        return {
          icon: Pause,
          label: 'Voting Ended',
          color: 'bg-blue-500',
          textColor: 'text-blue-400',
          badgeVariant: 'outline' as const,
          tooltip: 'Voting has ended, awaiting results',
        };
      case 'completed':
        return {
          icon: CheckCircle,
          label: 'Completed',
          color: 'bg-patriotBlue',
          textColor: 'text-patriotBlue',
          badgeVariant: 'default' as const,
          tooltip: 'Holiday has passed and voting is complete',
        };
      default:
        return {
          icon: Clock,
          label: 'Unknown',
          color: 'bg-gray-500',
          textColor: 'text-gray-400',
          badgeVariant: 'secondary' as const,
          tooltip: 'Status unknown',
        };
    }
  };

  const config = getStatusConfig(votingStatus.phase);
  const IconComponent = config.icon;

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  if (showDetails) {
    return (
      <motion.div
        className={cn(
          'flex flex-col space-y-2 p-3 rounded-lg border border-patriotBlue/30 bg-backgroundCard/50',
          className
        )}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <IconComponent className={cn(iconSizes[size], config.textColor)} />
            <span className={cn('font-medium', config.textColor)}>
              {config.label}
            </span>
          </div>
          <Badge variant={config.badgeVariant} className={sizeClasses[size]}>
            {votingStatus.phase.replace('_', ' ').toUpperCase()}
          </Badge>
        </div>

        {votingStatus.phase === 'voting_active' && (
          <div className="text-xs text-textSecondary">
            <div className="flex items-center space-x-1">
              <Clock className="w-3 h-3" />
              <span>Ends in {votingStatus.daysUntilVotingEnds} days</span>
            </div>
          </div>
        )}

        {votingStatus.phase === 'voting_soon' && (
          <div className="text-xs text-textSecondary">
            <div className="flex items-center space-x-1">
              <Calendar className="w-3 h-3" />
              <span>Starts in {votingStatus.daysUntilVotingStarts} days</span>
            </div>
          </div>
        )}

        {votingStatus.daysUntilHoliday > 0 && (
          <div className="text-xs text-textSecondary">
            <div className="flex items-center space-x-1">
              <Calendar className="w-3 h-3" />
              <span>Holiday in {votingStatus.daysUntilHoliday} days</span>
            </div>
          </div>
        )}
      </motion.div>
    );
  }

  return (
    <SimpleTooltip text={config.tooltip}>
      <motion.div
        className={cn('inline-flex items-center space-x-2', className)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Badge
          variant={config.badgeVariant}
          className={cn('flex items-center space-x-1', sizeClasses[size])}
        >
          <IconComponent className={iconSizes[size]} />
          <span>{config.label}</span>
        </Badge>
      </motion.div>
    </SimpleTooltip>
  );
};

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  Play,
  Pause,
  RefreshCw,
  Clock,
  CheckCircle,
  AlertTriangle,
  Zap,
  Gift,
} from 'lucide-react';
import { Button, Card } from '@/components/ui';
import { SimpleTooltip } from '@/components/ui/AnimatedTooltip';
import { useHolidayProposalService } from '@/hooks/useHolidayProposalService';
import { fadeInVariants } from '@/lib/animations';
import { cn } from '@/lib/utils';

export const HolidayProposalManager: React.FC = () => {
  const {
    status,
    isGenerating,
    upcomingHolidays,
    holidaysNeedingProposals,
    startService,
    stopService,
    generateProposal,
    checkAndGenerate,
    refreshData,
  } = useHolidayProposalService();

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(date));
  };

  const getDaysUntilText = (days: number) => {
    if (days === 0) return 'Today';
    if (days === 1) return 'Tomorrow';
    if (days < 0) return `${Math.abs(days)} days ago`;
    return `${days} days away`;
  };

  return (
    <div className="space-y-6">
      {/* Service Status */}
      <motion.div variants={fadeInVariants} initial="initial" animate="enter">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Calendar className="w-6 h-6 text-patriotRed mr-3" />
              <div>
                <h3 className="text-xl font-bold text-patriotWhite">
                  Holiday Proposal Generation Service
                </h3>
                <p className="text-textSecondary">
                  Automatically generates charity selection proposals for
                  upcoming holidays
                </p>
              </div>
            </div>
            <div
              className={cn(
                'px-4 py-2 rounded-lg border flex items-center gap-2',
                status.isRunning
                  ? 'bg-green-500/10 border-green-500/30 text-green-400'
                  : 'bg-gray-500/10 border-gray-500/30 text-gray-400'
              )}
            >
              <div
                className={cn(
                  'w-2 h-2 rounded-full',
                  status.isRunning ? 'bg-green-500' : 'bg-gray-500'
                )}
              />
              <span className="font-medium">
                {status.isRunning ? 'Running' : 'Stopped'}
              </span>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div className="bg-backgroundLight/50 border border-patriotBlue/30 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <Clock className="w-4 h-4 mr-2 text-patriotBlue" />
                <span className="font-semibold text-patriotWhite">
                  Next Check
                </span>
              </div>
              <p className="text-textSecondary">
                {status.nextCheck
                  ? formatDate(status.nextCheck)
                  : 'Not scheduled'}
              </p>
            </div>
            <div className="bg-backgroundLight/50 border border-patriotRed/30 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <AlertTriangle className="w-4 h-4 mr-2 text-patriotRed" />
                <span className="font-semibold text-patriotWhite">
                  Pending Proposals
                </span>
              </div>
              <p className="text-textSecondary">
                {holidaysNeedingProposals.length} holidays need proposals
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <SimpleTooltip
              text={
                status.isRunning
                  ? 'Stop automatic generation'
                  : 'Start automatic generation'
              }
            >
              <Button
                onClick={status.isRunning ? stopService : startService}
                variant={status.isRunning ? 'secondary' : 'primary'}
                className={cn(
                  'flex items-center gap-2',
                  status.isRunning && 'bg-red-600 hover:bg-red-700 text-white'
                )}
              >
                {status.isRunning ? (
                  <>
                    <Pause className="w-4 h-4" />
                    Stop Service
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Start Service
                  </>
                )}
              </Button>
            </SimpleTooltip>

            <SimpleTooltip text="Manually check for holidays and generate proposals">
              <Button
                onClick={checkAndGenerate}
                disabled={isGenerating}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Zap
                  className={cn('w-4 h-4', isGenerating && 'animate-spin')}
                />
                {isGenerating ? 'Generating...' : 'Generate Now'}
              </Button>
            </SimpleTooltip>

            <SimpleTooltip text="Refresh data">
              <Button
                onClick={refreshData}
                variant="ghost"
                size="sm"
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </Button>
            </SimpleTooltip>
          </div>
        </Card>
      </motion.div>

      {/* Upcoming Holidays */}
      <motion.div
        variants={fadeInVariants}
        initial="initial"
        animate="enter"
        transition={{ delay: 0.1 }}
      >
        <Card className="p-6">
          <div className="flex items-center mb-6">
            <Gift className="w-6 h-6 text-starGold mr-3" />
            <div>
              <h3 className="text-xl font-bold text-patriotWhite">
                Upcoming Holidays
              </h3>
              <p className="text-textSecondary">
                Military holidays eligible for charity selection proposals
              </p>
            </div>
          </div>

          {upcomingHolidays.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-textSecondary mx-auto mb-4 opacity-50" />
              <p className="text-textSecondary">No upcoming holidays found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingHolidays.map((item, index) => (
                <motion.div
                  key={item.holiday.id}
                  className={cn(
                    'border rounded-lg p-4 transition-all duration-200',
                    item.needsProposal
                      ? 'border-yellow-500/50 bg-yellow-500/5'
                      : 'border-patriotBlue/30 bg-patriotBlue/5'
                  )}
                  variants={fadeInVariants}
                  initial="initial"
                  animate="enter"
                  transition={{ delay: 0.1 + index * 0.05 }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="text-2xl mr-4">
                        {item.holiday.flagIcon}
                      </div>
                      <div>
                        <h4 className="font-semibold text-patriotWhite">
                          {item.holiday.name}
                        </h4>
                        <div className="flex items-center gap-4 text-sm text-textSecondary">
                          <span>{formatDate(item.holiday.date)}</span>
                          <span>•</span>
                          <span>{getDaysUntilText(item.daysUntil)}</span>
                          <span>•</span>
                          <span>
                            ${item.holiday.fundAllocation.toLocaleString()} fund
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {item.needsProposal ? (
                        <>
                          <div className="flex items-center text-yellow-400 text-sm">
                            <AlertTriangle className="w-4 h-4 mr-1" />
                            Needs Proposal
                          </div>
                          <Button
                            onClick={() => generateProposal(item.holiday.id)}
                            disabled={isGenerating}
                            size="sm"
                            className="bg-yellow-600 hover:bg-yellow-700"
                          >
                            Generate
                          </Button>
                        </>
                      ) : (
                        <div className="flex items-center text-green-400 text-sm">
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Proposal Ready
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </Card>
      </motion.div>
    </div>
  );
};

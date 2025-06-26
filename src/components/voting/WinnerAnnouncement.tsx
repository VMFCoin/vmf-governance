'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy,
  Crown,
  Share2,
  Download,
  Users,
  Vote,
  Calendar,
  Award,
  Sparkles,
  CheckCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import { useCharityStore } from '@/stores/useCharityStore';
import { formatTokenAmount } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { fadeInVariants, slideInVariants } from '@/lib/animations';
import { Address } from 'viem';

interface WinnerData {
  gaugeAddress: Address;
  charityId: string;
  charityName: string;
  totalVotes: bigint;
  percentage: number;
  votesFormatted: string;
  epochId?: number;
  rank?: number;
}

interface VotingPeriodData {
  startTime: Date;
  endTime: Date;
  duration: number;
  epochId?: number;
}

interface WinnerAnnouncementProps {
  winner: WinnerData;
  totalVotes: bigint;
  totalParticipants: number;
  votingPeriod: VotingPeriodData;
  onShare?: () => void;
  onExport?: () => void;
  className?: string;
}

export const WinnerAnnouncement: React.FC<WinnerAnnouncementProps> = ({
  winner,
  totalVotes,
  totalParticipants,
  votingPeriod,
  onShare,
  onExport,
  className,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const { showSuccess, showInfo } = useToast();
  const getCharityById = useCharityStore(state => state.getCharityById);

  const charity = getCharityById(winner.charityId);

  useEffect(() => {
    setIsVisible(true);
    const timer = setTimeout(() => setShowConfetti(true), 500);
    return () => clearTimeout(timer);
  }, []);

  const formatVotingPower = (amount: bigint): string => {
    return formatTokenAmount(amount, 18);
  };

  const handleShare = () => {
    const shareText = `🏆 Voting Results: ${winner.charityName} won with ${winner.percentage.toFixed(1)}% of votes (${winner.votesFormatted} voting power)! #VMFGovernance`;

    if (navigator.share) {
      navigator.share({
        title: 'VMF Governance Voting Results',
        text: shareText,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(shareText);
      showSuccess('Copied to clipboard', 'Results copied to clipboard!');
    }

    onShare?.();
  };

  const handleExport = () => {
    const exportData = {
      winner: {
        charity: winner.charityName,
        gaugeAddress: winner.gaugeAddress,
        votes: winner.votesFormatted,
        percentage: winner.percentage,
      },
      votingPeriod: {
        start: votingPeriod.startTime.toISOString(),
        end: votingPeriod.endTime.toISOString(),
        duration: votingPeriod.duration,
        epochId: votingPeriod.epochId,
      },
      totalStats: {
        totalVotes: formatVotingPower(totalVotes),
        totalParticipants,
      },
      timestamp: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vmf-voting-results-epoch-${votingPeriod.epochId || 'latest'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showInfo('Export Complete', 'Voting results exported successfully!');
    onExport?.();
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.5 }}
          className={cn('relative overflow-hidden', className)}
        >
          {showConfetti && (
            <div className="absolute inset-0 pointer-events-none z-10">
              {Array.from({ length: 20 }).map((_, i) => (
                <motion.div
                  key={i}
                  initial={{
                    opacity: 1,
                    y: -100,
                    x: Math.random() * 400,
                    rotate: 0,
                  }}
                  animate={{
                    opacity: 0,
                    y: 400,
                    rotate: 360,
                  }}
                  transition={{
                    duration: 3,
                    delay: Math.random() * 2,
                    ease: 'easeOut',
                  }}
                  className="absolute w-2 h-2 bg-gradient-to-r from-patriotBlue to-patriotRed rounded-full"
                />
              ))}
            </div>
          )}

          <Card className="relative bg-gradient-to-br from-patriotBlue/20 to-patriotRed/20 border-2 border-patriotGold/50">
            <CardHeader className="text-center pb-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                className="mx-auto mb-4"
              >
                <div className="relative">
                  <Crown className="h-16 w-16 text-patriotGold mx-auto" />
                  <Sparkles className="h-6 w-6 text-patriotGold absolute -top-2 -right-2 animate-pulse" />
                </div>
              </motion.div>

              <CardTitle className="text-3xl font-bold text-patriotWhite mb-2">
                🏆 Winner Announced!
              </CardTitle>

              <motion.div
                variants={slideInVariants}
                initial="hidden"
                animate="visible"
                transition={{ delay: 0.4 }}
              >
                <h2 className="text-2xl font-semibold text-patriotGold mb-2">
                  {winner.charityName}
                </h2>
                {charity && (
                  <p className="text-patriotWhite/80 text-sm max-w-md mx-auto">
                    {charity.description}
                  </p>
                )}
              </motion.div>
            </CardHeader>

            <CardContent className="space-y-6">
              <motion.div
                variants={fadeInVariants}
                initial="hidden"
                animate="visible"
                transition={{ delay: 0.6 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-4"
              >
                <div className="text-center p-4 bg-patriotBlue/30 rounded-lg border border-patriotGold/30">
                  <Trophy className="h-8 w-8 text-patriotGold mx-auto mb-2" />
                  <div className="text-2xl font-bold text-patriotWhite">
                    {winner.percentage.toFixed(1)}%
                  </div>
                  <div className="text-sm text-patriotWhite/70">Vote Share</div>
                </div>

                <div className="text-center p-4 bg-patriotBlue/30 rounded-lg border border-patriotGold/30">
                  <Vote className="h-8 w-8 text-patriotGold mx-auto mb-2" />
                  <div className="text-2xl font-bold text-patriotWhite">
                    {winner.votesFormatted}
                  </div>
                  <div className="text-sm text-patriotWhite/70">
                    Voting Power
                  </div>
                </div>

                <div className="text-center p-4 bg-patriotBlue/30 rounded-lg border border-patriotGold/30">
                  <Users className="h-8 w-8 text-patriotGold mx-auto mb-2" />
                  <div className="text-2xl font-bold text-patriotWhite">
                    {totalParticipants.toLocaleString()}
                  </div>
                  <div className="text-sm text-patriotWhite/70">
                    Participants
                  </div>
                </div>
              </motion.div>

              <motion.div
                variants={fadeInVariants}
                initial="hidden"
                animate="visible"
                transition={{ delay: 0.8 }}
                className="bg-patriotBlue/20 rounded-lg p-4 border border-patriotGold/30"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-patriotWhite flex items-center gap-2">
                    <Award className="h-5 w-5 text-patriotGold" />
                    Gauge Details
                  </h3>
                  <Badge
                    variant="outline"
                    className="bg-patriotGold/20 text-patriotGold border-patriotGold"
                  >
                    Winner
                  </Badge>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-patriotWhite/70">Gauge Address:</span>
                    <span className="text-patriotWhite font-mono text-xs">
                      {winner.gaugeAddress.slice(0, 8)}...
                      {winner.gaugeAddress.slice(-6)}
                    </span>
                  </div>
                  {votingPeriod.epochId && (
                    <div className="flex justify-between">
                      <span className="text-patriotWhite/70">Epoch ID:</span>
                      <span className="text-patriotWhite">
                        #{votingPeriod.epochId}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-patriotWhite/70">Voting Period:</span>
                    <span className="text-patriotWhite">
                      {votingPeriod.duration} days
                    </span>
                  </div>
                </div>
              </motion.div>

              <motion.div
                variants={fadeInVariants}
                initial="hidden"
                animate="visible"
                transition={{ delay: 1.0 }}
                className="bg-patriotBlue/20 rounded-lg p-4 border border-patriotGold/30"
              >
                <h3 className="text-lg font-semibold text-patriotWhite mb-3 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-patriotGold" />
                  Voting Period Summary
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-patriotWhite/70 mb-1">Started:</div>
                    <div className="text-patriotWhite">
                      {votingPeriod.startTime.toLocaleDateString()} at{' '}
                      {votingPeriod.startTime.toLocaleTimeString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-patriotWhite/70 mb-1">Ended:</div>
                    <div className="text-patriotWhite">
                      {votingPeriod.endTime.toLocaleDateString()} at{' '}
                      {votingPeriod.endTime.toLocaleTimeString()}
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-patriotGold/30">
                  <div className="flex justify-between items-center">
                    <span className="text-patriotWhite/70">
                      Total Voting Power Cast:
                    </span>
                    <span className="text-patriotWhite font-semibold">
                      {formatVotingPower(totalVotes)}
                    </span>
                  </div>
                </div>
              </motion.div>

              <motion.div
                variants={fadeInVariants}
                initial="hidden"
                animate="visible"
                transition={{ delay: 1.2 }}
                className="flex flex-col sm:flex-row gap-3 pt-4"
              >
                <Button
                  onClick={handleShare}
                  className="flex-1 bg-patriotBlue hover:bg-patriotBlue/80 text-patriotWhite"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Share Results
                </Button>

                <Button
                  onClick={handleExport}
                  variant="outline"
                  className="flex-1 border-patriotGold text-patriotGold hover:bg-patriotGold/20"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Data
                </Button>
              </motion.div>

              <motion.div
                variants={fadeInVariants}
                initial="hidden"
                animate="visible"
                transition={{ delay: 1.4 }}
                className="text-center pt-4 border-t border-patriotGold/30"
              >
                <div className="flex items-center justify-center gap-2 text-patriotGold">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-semibold">Voting Complete</span>
                </div>
                <p className="text-sm text-patriotWhite/70 mt-2">
                  Thank you to all participants for making your voices heard in
                  VMF governance!
                </p>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default WinnerAnnouncement;

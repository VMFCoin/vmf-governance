import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  TrendingUp,
  Users,
  Vote,
  Trophy,
  Activity,
  AlertCircle,
  CheckCircle,
  Loader2,
  BarChart3,
  Calendar,
  Timer,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LiveVotingResults } from './LiveVotingResults';
import { WinnerAnnouncement } from './WinnerAnnouncement';
import {
  useVotingPeriodStore,
  votingPeriodService,
  VotingPeriod,
} from '@/services/votingPeriodService';
import {
  useEventStore,
  EventType,
  eventMonitor,
} from '@/services/eventMonitor';
import { voteTrackingService } from '@/services/voteTrackingService';
import { formatTokenAmount } from '@/lib/utils';
import { useCharityStore } from '@/stores/useCharityStore';
import {
  deployedGaugeService,
  CharityGaugeMapping,
} from '@/services/deployedGaugeService';
import { useToast } from '@/components/ui/Toast';

interface VotingDashboardProps {
  showTopN?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface DashboardStats {
  totalVotes: bigint;
  totalParticipants: number;
  activeGauges: number;
  timeRemaining: string;
  votingProgress: number;
  isFinalized: boolean;
}

// Helper function to format voting power
const formatVotingPower = (amount: bigint): string => {
  return formatTokenAmount(amount, 18);
};

export const VotingDashboard: React.FC<VotingDashboardProps> = ({
  showTopN = 10,
  autoRefresh = true,
  refreshInterval = 30000, // 30 seconds
}) => {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'results' | 'history'
  >('overview');
  const [stats, setStats] = useState<DashboardStats>({
    totalVotes: BigInt(0),
    totalParticipants: 0,
    activeGauges: 0,
    timeRemaining: '0:00:00',
    votingProgress: 0,
    isFinalized: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showWinnerModal, setShowWinnerModal] = useState(false);
  const [isFinalizingPeriod, setIsFinalizingPeriod] = useState(false);
  const [charityMappings, setCharityMappings] = useState<CharityGaugeMapping[]>(
    []
  );

  // Zustand stores
  const {
    currentPeriod,
    isLoading: periodLoading,
    error: periodError,
    timeRemaining,
    finalizationInProgress,
    loadCurrentPeriod,
    finalizeCurrentPeriod,
  } = useVotingPeriodStore();

  const { getRecentEvents, getEventsByType } = useEventStore();
  const { showSuccess, showError, showInfo } = useToast();
  const getCharityById = useCharityStore(state => state.getCharityById);
  const charities = useCharityStore(state => state.charities);

  // Initialize dashboard
  useEffect(() => {
    const initializeDashboard = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Load current voting period
        await loadCurrentPeriod();

        // Load charity mappings for current holiday (using a default holiday ID)
        const holidayId = 'veterans-day-2024'; // This should come from current voting period or context
        const charityIds = charities.slice(0, 5).map(c => c.id); // Get first 5 charities as example

        if (charityIds.length > 0) {
          const mappings = await deployedGaugeService.mapCharitiesToGauges(
            holidayId,
            charityIds
          );
          setCharityMappings(mappings);
        }

        // Initialize monitoring
        await eventMonitor.startAllSubscriptions();
        votingPeriodService.startTimeUpdates();
      } catch (error) {
        console.error('Failed to initialize dashboard:', error);
        setError(
          error instanceof Error ? error.message : 'Failed to initialize'
        );
      } finally {
        setIsLoading(false);
      }
    };

    initializeDashboard();
  }, [loadCurrentPeriod]);

  // Update stats when period changes
  useEffect(() => {
    if (currentPeriod) {
      setStats({
        totalVotes: currentPeriod.totalVotes,
        totalParticipants: currentPeriod.totalParticipants,
        activeGauges: currentPeriod.finalResults?.length || 0,
        timeRemaining: votingPeriodService.getFormattedTimeRemaining(),
        votingProgress: votingPeriodService.getVotingProgress(),
        isFinalized: currentPeriod.isFinalized,
      });
    }
  }, [currentPeriod, timeRemaining]);

  // Auto-refresh data
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(async () => {
      try {
        await loadCurrentPeriod();
      } catch (err) {
        console.error('Error refreshing dashboard data:', err);
      }
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, loadCurrentPeriod]);

  // Handle vote finalization
  const handleFinalizePeriod = async () => {
    if (!currentPeriod || currentPeriod.isFinalized) return;

    try {
      await finalizeCurrentPeriod();
    } catch (err) {
      console.error('Error finalizing period:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to finalize voting period'
      );
    }
  };

  // Get recent voting events
  const recentVoteEvents = getEventsByType(EventType.VOTE_CAST).slice(0, 5);
  const finalizationEvents = getEventsByType(EventType.VOTE_FINALIZED);
  const winnerEvents = getEventsByType(EventType.WINNER_ANNOUNCED);

  if (isLoading || periodLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px] xs:min-h-[350px] sm:min-h-[400px] md:min-h-[450px] lg:min-h-[500px] xl:min-h-[550px]">
        <div className="text-center p-4 xs:p-5 sm:p-6 md:p-8">
          <Loader2 className="h-6 w-6 xs:h-7 xs:w-7 sm:h-8 sm:w-8 md:h-9 md:w-9 lg:h-10 lg:w-10 xl:h-12 xl:w-12 animate-spin mx-auto mb-3 xs:mb-4 sm:mb-5 md:mb-6" />
          <p className="text-muted-foreground text-xs xs:text-sm sm:text-base md:text-lg lg:text-xl">
            Loading voting dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (error || periodError) {
    return (
      <div className="p-3 xs:p-4 sm:p-5 md:p-6 lg:p-8 xl:p-10">
        <Alert variant="destructive">
          <AlertCircle className="h-3 w-3 xs:h-4 xs:w-4 sm:h-5 sm:w-5" />
          <AlertDescription className="text-xs xs:text-sm sm:text-base md:text-lg">
            {error || periodError}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!currentPeriod) {
    return (
      <div className="text-center p-6 xs:p-8 sm:p-10 md:p-12 lg:p-16 xl:p-20">
        <Calendar className="h-8 w-8 xs:h-10 xs:w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 lg:h-16 lg:w-16 xl:h-20 xl:w-20 mx-auto mb-3 xs:mb-4 sm:mb-5 md:mb-6 lg:mb-8 text-muted-foreground" />
        <h3 className="text-sm xs:text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-semibold mb-2 xs:mb-3 sm:mb-4">
          No Active Voting Period
        </h3>
        <p className="text-xs xs:text-sm sm:text-base md:text-lg text-muted-foreground">
          There is currently no active voting period. Check back later.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 xs:space-y-4 sm:space-y-5 md:space-y-6 lg:space-y-8 xl:space-y-10 p-3 xs:p-4 sm:p-5 md:p-6 lg:p-8 xl:p-10">
      {/* Header Section - Enhanced Mobile Layout with comprehensive responsive */}
      <motion.div
        className="flex flex-col xs:flex-row sm:flex-row items-start xs:items-center sm:items-center justify-between gap-3 xs:gap-4 sm:gap-5 md:gap-6 lg:gap-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex-1 w-full xs:w-auto min-w-0">
          <h1 className="text-lg xs:text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-patriotWhite mb-1 xs:mb-2 sm:mb-3">
            Live Voting Dashboard
          </h1>
          <p className="text-xs xs:text-sm sm:text-base md:text-lg lg:text-xl text-textSecondary">
            Real-time voting results and statistics
          </p>
        </div>

        {/* Action Buttons - Enhanced Mobile Layout */}
        <div className="flex flex-col xs:flex-row sm:flex-row gap-2 xs:gap-3 sm:gap-4 w-full xs:w-auto">
          {!stats.isFinalized && (
            <Button
              onClick={handleFinalizePeriod}
              disabled={finalizationInProgress || isFinalizingPeriod}
              className="w-full xs:w-auto min-h-[44px] sm:min-h-[48px] md:min-h-[52px] lg:min-h-[56px] xl:min-h-[60px] text-xs xs:text-sm sm:text-base md:text-lg lg:text-xl px-3 xs:px-4 sm:px-5 md:px-6 lg:px-8 touch-manipulation"
            >
              {finalizationInProgress ? (
                <>
                  <Loader2 className="w-3 h-3 xs:w-4 xs:h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 mr-2 animate-spin" />
                  <span className="xs:hidden sm:hidden md:inline">
                    Finalizing...
                  </span>
                  <span className="hidden xs:inline sm:inline md:hidden">
                    Finalizing
                  </span>
                </>
              ) : (
                <>
                  <Trophy className="w-3 h-3 xs:w-4 xs:h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 mr-2" />
                  <span className="xs:hidden sm:hidden md:inline">
                    Finalize Voting
                  </span>
                  <span className="hidden xs:inline sm:inline md:hidden">
                    Finalize
                  </span>
                </>
              )}
            </Button>
          )}

          <Button
            variant="outline"
            onClick={() => loadCurrentPeriod()}
            className="w-full xs:w-auto min-h-[44px] sm:min-h-[48px] md:min-h-[52px] lg:min-h-[56px] xl:min-h-[60px] text-xs xs:text-sm sm:text-base md:text-lg lg:text-xl px-3 xs:px-4 sm:px-5 md:px-6 lg:px-8 touch-manipulation"
          >
            <Activity className="w-3 h-3 xs:w-4 xs:h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 mr-2" />
            <span className="xs:hidden sm:hidden md:inline">Refresh Data</span>
            <span className="hidden xs:inline sm:inline md:hidden">
              Refresh
            </span>
          </Button>
        </div>
      </motion.div>

      {/* Stats Grid - Enhanced Mobile Layout with comprehensive responsive */}
      <motion.div
        className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 gap-3 xs:gap-4 sm:gap-5 md:gap-6 lg:gap-8 xl:gap-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        {/* Total Votes Card */}
        <Card className="bg-gradient-to-br from-patriotBlue/10 to-patriotBlue/5 border-patriotBlue/20 hover:border-patriotBlue/40 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 xs:pb-3 sm:pb-4 p-3 xs:p-4 sm:p-5 md:p-6">
            <CardTitle className="text-xs xs:text-sm sm:text-base md:text-lg font-medium text-textSecondary">
              Total Votes
            </CardTitle>
            <Vote className="h-3 w-3 xs:h-4 xs:w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 lg:h-7 lg:w-7 text-patriotBlue" />
          </CardHeader>
          <CardContent className="p-3 xs:p-4 sm:p-5 md:p-6 pt-0">
            <div className="text-lg xs:text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-patriotWhite">
              {formatVotingPower(stats.totalVotes)}
            </div>
            <p className="text-xs xs:text-sm sm:text-base text-textSecondary">
              Voting power cast
            </p>
          </CardContent>
        </Card>

        {/* Participants Card */}
        <Card className="bg-gradient-to-br from-starGold/10 to-starGold/5 border-starGold/20 hover:border-starGold/40 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 xs:pb-3 sm:pb-4 p-3 xs:p-4 sm:p-5 md:p-6">
            <CardTitle className="text-xs xs:text-sm sm:text-base md:text-lg font-medium text-textSecondary">
              Participants
            </CardTitle>
            <Users className="h-3 w-3 xs:h-4 xs:w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 lg:h-7 lg:w-7 text-starGold" />
          </CardHeader>
          <CardContent className="p-3 xs:p-4 sm:p-5 md:p-6 pt-0">
            <div className="text-lg xs:text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-patriotWhite">
              {stats.totalParticipants.toLocaleString()}
            </div>
            <p className="text-xs xs:text-sm sm:text-base text-textSecondary">
              Unique voters
            </p>
          </CardContent>
        </Card>

        {/* Active Gauges Card */}
        <Card className="bg-gradient-to-br from-patriotRed/10 to-patriotRed/5 border-patriotRed/20 hover:border-patriotRed/40 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 xs:pb-3 sm:pb-4 p-3 xs:p-4 sm:p-5 md:p-6">
            <CardTitle className="text-xs xs:text-sm sm:text-base md:text-lg font-medium text-textSecondary">
              Active Gauges
            </CardTitle>
            <BarChart3 className="h-3 w-3 xs:h-4 xs:w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 lg:h-7 lg:w-7 text-patriotRed" />
          </CardHeader>
          <CardContent className="p-3 xs:p-4 sm:p-5 md:p-6 pt-0">
            <div className="text-lg xs:text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-patriotWhite">
              {stats.activeGauges}
            </div>
            <p className="text-xs xs:text-sm sm:text-base text-textSecondary">
              Charity options
            </p>
          </CardContent>
        </Card>

        {/* Time Remaining Card */}
        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20 hover:border-green-500/40 transition-all duration-300 xs:col-span-2 sm:col-span-2 md:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 xs:pb-3 sm:pb-4 p-3 xs:p-4 sm:p-5 md:p-6">
            <CardTitle className="text-xs xs:text-sm sm:text-base md:text-lg font-medium text-textSecondary">
              Time Remaining
            </CardTitle>
            <Timer className="h-3 w-3 xs:h-4 xs:w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 lg:h-7 lg:w-7 text-green-500" />
          </CardHeader>
          <CardContent className="p-3 xs:p-4 sm:p-5 md:p-6 pt-0">
            <div className="text-lg xs:text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-patriotWhite font-mono">
              {stats.timeRemaining}
            </div>
            <div className="mt-1 xs:mt-2 sm:mt-3">
              <Progress
                value={stats.votingProgress}
                className="h-1 xs:h-2 sm:h-3 md:h-4"
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Main Content Tabs - Enhanced responsive */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Tabs
          value={activeTab}
          onValueChange={value => setActiveTab(value as any)}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-3 h-auto p-1 xs:p-2 sm:p-3 md:p-4 bg-backgroundLight/80 backdrop-blur-sm border border-patriotBlue/30 rounded-lg xs:rounded-xl sm:rounded-2xl">
            <TabsTrigger
              value="overview"
              className="text-xs xs:text-sm sm:text-base md:text-lg lg:text-xl py-2 xs:py-3 sm:py-4 md:py-5 lg:py-6 px-2 xs:px-3 sm:px-4 md:px-5 lg:px-6 data-[state=active]:bg-patriotRed data-[state=active]:text-white rounded-md xs:rounded-lg sm:rounded-xl transition-all duration-200"
            >
              <span className="hidden xs:inline">Overview</span>
              <span className="xs:hidden">Info</span>
            </TabsTrigger>
            <TabsTrigger
              value="results"
              className="text-xs xs:text-sm sm:text-base md:text-lg lg:text-xl py-2 xs:py-3 sm:py-4 md:py-5 lg:py-6 px-2 xs:px-3 sm:px-4 md:px-5 lg:px-6 data-[state=active]:bg-patriotRed data-[state=active]:text-white rounded-md xs:rounded-lg sm:rounded-xl transition-all duration-200"
            >
              <span className="hidden sm:inline">Live Results</span>
              <span className="hidden xs:inline sm:hidden">Results</span>
              <span className="xs:hidden">Live</span>
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="text-xs xs:text-sm sm:text-base md:text-lg lg:text-xl py-2 xs:py-3 sm:py-4 md:py-5 lg:py-6 px-2 xs:px-3 sm:px-4 md:px-5 lg:px-6 data-[state=active]:bg-patriotRed data-[state=active]:text-white rounded-md xs:rounded-lg sm:rounded-xl transition-all duration-200"
            >
              <span className="hidden xs:inline">History</span>
              <span className="xs:hidden">Past</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="overview"
            className="space-y-3 xs:space-y-4 sm:space-y-5 md:space-y-6 lg:space-y-8 mt-3 xs:mt-4 sm:mt-5 md:mt-6 lg:mt-8"
          >
            {/* Winner Announcement - Enhanced responsive */}
            {currentPeriod?.isFinalized && currentPeriod.winnerGaugeAddress && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <WinnerAnnouncement
                  winner={{
                    gaugeAddress: currentPeriod.winnerGaugeAddress,
                    charityId: currentPeriod.winnerCharityId || '',
                    charityName: 'Winner Charity',
                    totalVotes: currentPeriod.totalVotes,
                    percentage:
                      currentPeriod.finalResults?.[0]?.percentage || 0,
                    votesFormatted: formatVotingPower(currentPeriod.totalVotes),
                  }}
                  totalVotes={currentPeriod.totalVotes}
                  totalParticipants={currentPeriod.totalParticipants}
                  votingPeriod={{
                    startTime: currentPeriod.startTime,
                    endTime: currentPeriod.endTime,
                    duration: Math.floor(
                      (currentPeriod.endTime.getTime() -
                        currentPeriod.startTime.getTime()) /
                        (1000 * 60 * 60 * 24)
                    ),
                  }}
                  onShare={() => console.log('Share results')}
                  onExport={() => console.log('Export results')}
                />
              </motion.div>
            )}

            {/* Recent Activity - Enhanced responsive */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card className="bg-gradient-to-br from-backgroundLight/80 to-backgroundLight/60 backdrop-blur-sm border-patriotBlue/20 hover:border-patriotBlue/40 transition-all duration-300">
                <CardHeader className="p-3 xs:p-4 sm:p-5 md:p-6 lg:p-8">
                  <CardTitle className="flex items-center gap-2 xs:gap-3 sm:gap-4 text-sm xs:text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl text-patriotWhite">
                    <Activity className="h-3 w-3 xs:h-4 xs:w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 lg:h-7 lg:w-7 xl:h-8 xl:w-8 text-patriotBlue flex-shrink-0" />
                    <span className="hidden xs:inline">Recent Activity</span>
                    <span className="xs:hidden">Activity</span>
                  </CardTitle>
                  <p className="text-xs xs:text-sm sm:text-base md:text-lg text-textSecondary">
                    Latest voting events and updates
                  </p>
                </CardHeader>
                <CardContent className="p-3 xs:p-4 sm:p-5 md:p-6 lg:p-8 pt-0">
                  <div className="space-y-2 xs:space-y-3 sm:space-y-4 md:space-y-5">
                    {recentVoteEvents.length > 0 ? (
                      recentVoteEvents.map(event => (
                        <motion.div
                          key={event.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-2 xs:gap-3 sm:gap-4 p-2 xs:p-3 sm:p-4 md:p-5 bg-backgroundDark/30 rounded-md xs:rounded-lg sm:rounded-xl border border-patriotBlue/10 hover:border-patriotBlue/30 transition-all duration-200"
                        >
                          <div className="flex items-center gap-2 xs:gap-3 sm:gap-4 flex-1 min-w-0">
                            <Vote className="h-3 w-3 xs:h-4 xs:w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-patriotBlue flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="text-xs xs:text-sm sm:text-base md:text-lg font-medium text-patriotWhite truncate">
                                <span className="hidden sm:inline">
                                  Vote cast for gauge{' '}
                                </span>
                                <span className="sm:hidden">Gauge </span>
                                {event.data.gauge?.slice(0, 8)}...
                              </p>
                              <p className="text-xs xs:text-sm sm:text-base text-textSecondary">
                                {event.timestamp.toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                          <Badge
                            variant="outline"
                            className="text-xs xs:text-sm sm:text-base px-2 xs:px-3 sm:px-4 py-1 xs:py-2 border-starGold/30 text-starGold bg-starGold/10 flex-shrink-0"
                          >
                            {formatVotingPower(BigInt(event.data.weight || 0))}
                          </Badge>
                        </motion.div>
                      ))
                    ) : (
                      <div className="text-center py-6 xs:py-8 sm:py-10 md:py-12 lg:py-16">
                        <Vote className="h-8 w-8 xs:h-10 xs:w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 lg:h-16 lg:w-16 mx-auto mb-3 xs:mb-4 sm:mb-5 md:mb-6 text-muted-foreground/50" />
                        <p className="text-xs xs:text-sm sm:text-base md:text-lg text-muted-foreground">
                          No recent voting activity
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent
            value="results"
            className="mt-3 xs:mt-4 sm:mt-5 md:mt-6 lg:mt-8"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <LiveVotingResults
                charityMappings={charityMappings}
                showTopN={showTopN}
              />
            </motion.div>
          </TabsContent>

          <TabsContent
            value="history"
            className="space-y-3 xs:space-y-4 sm:space-y-5 md:space-y-6 lg:space-y-8 mt-3 xs:mt-4 sm:mt-5 md:mt-6 lg:mt-8"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="bg-gradient-to-br from-backgroundLight/80 to-backgroundLight/60 backdrop-blur-sm border-patriotBlue/20">
                <CardHeader className="p-3 xs:p-4 sm:p-5 md:p-6 lg:p-8">
                  <CardTitle className="text-sm xs:text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl text-patriotWhite">
                    Voting History
                  </CardTitle>
                  <p className="text-xs xs:text-sm sm:text-base md:text-lg text-textSecondary">
                    Previous voting periods and results
                  </p>
                </CardHeader>
                <CardContent className="p-3 xs:p-4 sm:p-5 md:p-6 lg:p-8 pt-0">
                  <div className="text-center py-6 xs:py-8 sm:py-10 md:py-12 lg:py-16">
                    <Calendar className="h-8 w-8 xs:h-10 xs:w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 lg:h-16 lg:w-16 mx-auto mb-3 xs:mb-4 sm:mb-5 md:mb-6 text-muted-foreground/50" />
                    <p className="text-xs xs:text-sm sm:text-base md:text-lg text-muted-foreground">
                      Voting history will be displayed here
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Event Notifications - Enhanced responsive */}
      <AnimatePresence>
        {finalizationEvents
          .filter(e => !e.processed)
          .map(event => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, scale: 0.9, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -50 }}
              className="fixed bottom-2 xs:bottom-3 sm:bottom-4 md:bottom-5 lg:bottom-6 right-2 xs:right-3 sm:right-4 md:right-5 lg:right-6 z-50 max-w-[calc(100vw-1rem)] xs:max-w-[calc(100vw-1.5rem)] sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl"
            >
              <Alert className="bg-green-50/95 border-green-200 backdrop-blur-sm shadow-lg p-3 xs:p-4 sm:p-5 md:p-6">
                <CheckCircle className="h-3 w-3 xs:h-4 xs:w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-green-600 flex-shrink-0" />
                <AlertDescription className="text-green-800 text-xs xs:text-sm sm:text-base md:text-lg ml-2 xs:ml-3 sm:ml-4">
                  <span className="hidden sm:inline">
                    Voting period has been finalized! Winner announced.
                  </span>
                  <span className="hidden xs:inline sm:hidden">
                    Voting finalized! Winner announced.
                  </span>
                  <span className="xs:hidden">Voting complete!</span>
                </AlertDescription>
              </Alert>
            </motion.div>
          ))}
      </AnimatePresence>
    </div>
  );
};

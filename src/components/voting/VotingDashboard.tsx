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
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading voting dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || periodError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error || periodError}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Voting Dashboard
          </h1>
          <p className="text-muted-foreground">
            Real-time voting results and analytics
          </p>
        </div>

        {currentPeriod && !currentPeriod.isFinalized && timeRemaining <= 0 && (
          <Button
            onClick={handleFinalizePeriod}
            disabled={finalizationInProgress}
            className="gap-2"
          >
            {finalizationInProgress ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Finalizing...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4" />
                Finalize Voting
              </>
            )}
          </Button>
        )}
      </div>

      {/* Voting Period Status */}
      {currentPeriod && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-lg">Current Voting Period</CardTitle>
              </div>
              <Badge
                variant={currentPeriod.isFinalized ? 'secondary' : 'default'}
              >
                {currentPeriod.isFinalized ? 'Finalized' : 'Active'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {stats.timeRemaining}
                </div>
                <p className="text-sm text-muted-foreground">Time Remaining</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {stats.votingProgress.toFixed(1)}%
                </div>
                <p className="text-sm text-muted-foreground">Progress</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {formatVotingPower(stats.totalVotes)}
                </div>
                <p className="text-sm text-muted-foreground">Total Votes</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {stats.totalParticipants}
                </div>
                <p className="text-sm text-muted-foreground">Participants</p>
              </div>
            </div>

            {!currentPeriod.isFinalized && (
              <div className="mt-4">
                <Progress value={stats.votingProgress} className="h-2" />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Votes</CardTitle>
            <Vote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatVotingPower(stats.totalVotes)}
            </div>
            <p className="text-xs text-muted-foreground">Across all gauges</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Participants</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalParticipants}</div>
            <p className="text-xs text-muted-foreground">Unique voters</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Gauges</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeGauges}</div>
            <p className="text-xs text-muted-foreground">With votes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.isFinalized ? (
                <Badge variant="secondary" className="text-base">
                  <Trophy className="h-4 w-4 mr-1" />
                  Complete
                </Badge>
              ) : (
                <Badge variant="default" className="text-base">
                  <Timer className="h-4 w-4 mr-1" />
                  Active
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">Voting period</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={value => setActiveTab(value as any)}
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="results">Live Results</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Winner Announcement */}
          {currentPeriod?.isFinalized && currentPeriod.winnerGaugeAddress && (
            <WinnerAnnouncement
              winner={{
                gaugeAddress: currentPeriod.winnerGaugeAddress,
                charityId: currentPeriod.winnerCharityId || '',
                charityName: 'Winner Charity', // Would be resolved from mapping
                totalVotes: currentPeriod.totalVotes,
                percentage: currentPeriod.finalResults?.[0]?.percentage || 0,
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
          )}

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Activity
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Latest voting events and updates
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentVoteEvents.length > 0 ? (
                  recentVoteEvents.map(event => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Vote className="h-4 w-4 text-primary" />
                        <div>
                          <p className="text-sm font-medium">
                            Vote cast for gauge {event.data.gauge?.slice(0, 8)}
                            ...
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {event.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline">
                        {formatVotingPower(BigInt(event.data.weight || 0))}
                      </Badge>
                    </motion.div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No recent voting activity
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results">
          <LiveVotingResults
            charityMappings={charityMappings}
            showTopN={showTopN}
          />
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Voting History</CardTitle>
              <p className="text-sm text-muted-foreground">
                Previous voting periods and results
              </p>
            </CardHeader>
            <CardContent>
              <p className="text-center text-muted-foreground py-8">
                Voting history will be displayed here
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Event Notifications */}
      <AnimatePresence>
        {finalizationEvents
          .filter(e => !e.processed)
          .map(event => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, scale: 0.9, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -50 }}
              className="fixed bottom-4 right-4 z-50"
            >
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Voting period has been finalized! Winner announced.
                </AlertDescription>
              </Alert>
            </motion.div>
          ))}
      </AnimatePresence>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Trophy,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Vote,
  Users,
  BarChart3,
  ArrowUpRight,
  Calendar,
  Medal,
  Loader2,
  Target,
  Percent,
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Charity } from '@/types';

// Temporary interfaces until service is properly integrated
interface VoteFinalizationResult {
  proposalId: string;
  holidayId: string;
  finalizedAt: Date;
  totalVotes: bigint;
  totalVoters: number;
  winner: {
    gaugeAddress: string;
    charity: Charity;
    totalVotes: bigint;
    percentage: number;
    rank: number;
  };
  results: Array<{
    gaugeAddress: string;
    charity: Charity;
    totalVotes: bigint;
    percentage: number;
    rank: number;
  }>;
  margin: number;
  isConclusive: boolean;
}

interface FinalizationStatus {
  proposalId: string;
  status: 'pending' | 'processing' | 'finalized' | 'failed';
  progress: number;
  message: string;
  startedAt: Date;
  completedAt?: Date;
  error?: string;
}

interface VotingStatistics {
  totalProposalsFinalized: number;
  totalVotesCast: bigint;
  totalVoters: number;
  averageParticipation: number;
  mostPopularCharity: {
    charity: Charity;
    wins: number;
    totalVotes: bigint;
  };
  closestRace: {
    proposalId: string;
    margin: number;
    winner: Charity;
    runnerUp: Charity;
  };
  participationTrend: Array<{
    proposalId: string;
    date: Date;
    totalVotes: bigint;
    uniqueVoters: number;
  }>;
}

// Helper function for time ago formatting
const formatTimeAgo = (date: Date): string => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  return `${Math.floor(diffInSeconds / 86400)}d ago`;
};

interface VoteFinalizationDashboardProps {
  className?: string;
}

export function VoteFinalizationDashboard({
  className,
}: VoteFinalizationDashboardProps) {
  const [finalizedResults, setFinalizedResults] = useState<
    VoteFinalizationResult[]
  >([]);
  const [activeFinalization, setActiveFinalization] =
    useState<FinalizationStatus | null>(null);
  const [votingStatistics, setVotingStatistics] =
    useState<VotingStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState('overview');

  useEffect(() => {
    loadDashboardData();

    // Set up polling for active finalization
    const interval = setInterval(() => {
      loadActiveFinalization();
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      // Temporary mock data until service is integrated
      const mockResults: VoteFinalizationResult[] = [];
      const mockStatistics: VotingStatistics = {
        totalProposalsFinalized: 0,
        totalVotesCast: BigInt(0),
        totalVoters: 0,
        averageParticipation: 0,
        mostPopularCharity: {
          charity: {
            id: 'mock',
            name: 'Mock Charity',
            description: 'Mock',
            logo: '/placeholder.png',
            category: 'Education',
            website: 'https://example.com',
          } as any,
          wins: 0,
          totalVotes: BigInt(0),
        },
        closestRace: {
          proposalId: '',
          margin: 0,
          winner: {
            id: 'mock',
            name: 'Mock Charity',
            description: 'Mock',
            logo: '/placeholder.png',
            category: 'Education',
            website: 'https://example.com',
          } as any,
          runnerUp: {
            id: 'mock',
            name: 'Mock Charity',
            description: 'Mock',
            logo: '/placeholder.png',
            category: 'Education',
            website: 'https://example.com',
          } as any,
        },
        participationTrend: [],
      };

      setFinalizedResults(mockResults);
      setVotingStatistics(mockStatistics);
      await loadActiveFinalization();
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to load dashboard data'
      );
    } finally {
      setLoading(false);
    }
  };

  const loadActiveFinalization = async () => {
    try {
      // In a real implementation, you would track active finalization IDs
      // For now, we'll check if there's any active finalization
      // This is a simplified approach
    } catch (err) {
      console.error('Error loading active finalization:', err);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'processing':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'finalized':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'finalized':
        return 'default';
      case 'processing':
        return 'secondary';
      case 'pending':
        return 'outline';
      case 'failed':
        return 'error';
      default:
        return 'outline';
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Medal className="h-5 w-5 text-amber-600" />;
      default:
        return <Target className="h-4 w-4 text-gray-400" />;
    }
  };

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`space-y-6 ${className}`}>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!votingStatistics) {
    return (
      <div className={`space-y-6 ${className}`}>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>No voting data available</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Vote Finalization Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor voting results and finalization status
          </p>
        </div>
        <Button onClick={loadDashboardData} variant="outline">
          <ArrowUpRight className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Vote className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Votes Cast
                </p>
                <p className="text-2xl font-bold">
                  {Number(votingStatistics.totalVotesCast).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Voters
                </p>
                <p className="text-2xl font-bold">
                  {votingStatistics.totalVoters.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Proposals Finalized
                </p>
                <p className="text-2xl font-bold">
                  {votingStatistics.totalProposalsFinalized}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Avg Participation
                </p>
                <p className="text-2xl font-bold">
                  {Math.round(votingStatistics.averageParticipation)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Finalization */}
      {activeFinalization && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Active Finalization</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(activeFinalization.status)}
                  <span className="font-medium">
                    Proposal {activeFinalization.proposalId}
                  </span>
                  <Badge
                    variant={
                      getStatusBadgeVariant(activeFinalization.status) as any
                    }
                  >
                    {activeFinalization.status}
                  </Badge>
                </div>
                <span className="text-sm text-muted-foreground">
                  {activeFinalization.progress}% complete
                </span>
              </div>

              <Progress value={activeFinalization.progress} className="mb-2" />

              <p className="text-sm text-muted-foreground mb-2">
                {activeFinalization.message}
              </p>

              {activeFinalization.error && (
                <Alert variant="destructive" className="mt-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {activeFinalization.error}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="results">Finalized Results</TabsTrigger>
          <TabsTrigger value="statistics">Statistics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Results */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Finalized Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {finalizedResults.slice(0, 5).map(result => (
                    <div
                      key={result.proposalId}
                      className="border rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <img
                            src={result.winner.charity.logo}
                            alt={result.winner.charity.name}
                            className="w-8 h-8 rounded-full"
                          />
                          <div>
                            <p className="font-medium">
                              {result.winner.charity.name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {formatTimeAgo(result.finalizedAt)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center space-x-1">
                            <Trophy className="h-4 w-4 text-yellow-500" />
                            <span className="font-medium">
                              {result.winner.percentage.toFixed(1)}%
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {Number(result.winner.totalVotes).toLocaleString()}{' '}
                            votes
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          Margin: {result.margin.toFixed(1)}%
                        </span>
                        <Badge
                          variant={result.isConclusive ? 'default' : 'outline'}
                        >
                          {result.isConclusive ? 'Conclusive' : 'Close Race'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Most Popular Charity */}
            <Card>
              <CardHeader>
                <CardTitle>Most Successful Charity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-4 mb-4">
                  <img
                    src={votingStatistics.mostPopularCharity.charity.logo}
                    alt={votingStatistics.mostPopularCharity.charity.name}
                    className="w-16 h-16 rounded-full"
                  />
                  <div>
                    <h3 className="text-lg font-semibold">
                      {votingStatistics.mostPopularCharity.charity.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {votingStatistics.mostPopularCharity.charity.category}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Wins</p>
                    <p className="text-2xl font-bold">
                      {votingStatistics.mostPopularCharity.wins}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Votes</p>
                    <p className="text-2xl font-bold">
                      {Number(
                        votingStatistics.mostPopularCharity.totalVotes
                      ).toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Closest Race */}
          {votingStatistics.closestRace.proposalId && (
            <Card>
              <CardHeader>
                <CardTitle>Closest Race</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <img
                        src={votingStatistics.closestRace.winner.logo}
                        alt={votingStatistics.closestRace.winner.name}
                        className="w-8 h-8 rounded-full"
                      />
                      <span className="font-medium">
                        {votingStatistics.closestRace.winner.name}
                      </span>
                      <Trophy className="h-4 w-4 text-yellow-500" />
                    </div>
                    <span className="text-muted-foreground">vs</span>
                    <div className="flex items-center space-x-2">
                      <img
                        src={votingStatistics.closestRace.runnerUp.logo}
                        alt={votingStatistics.closestRace.runnerUp.name}
                        className="w-8 h-8 rounded-full"
                      />
                      <span className="font-medium">
                        {votingStatistics.closestRace.runnerUp.name}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      Margin: {votingStatistics.closestRace.margin.toFixed(2)}%
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Proposal {votingStatistics.closestRace.proposalId}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Finalized Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {finalizedResults.map(result => (
                  <div
                    key={result.proposalId}
                    className="border rounded-lg p-6"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold">
                          Proposal {result.proposalId}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Holiday: {result.holidayId} • Finalized{' '}
                          {formatTimeAgo(result.finalizedAt)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">
                          Total Votes
                        </p>
                        <p className="text-lg font-bold">
                          {Number(result.totalVotes).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {/* Winner */}
                    <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Trophy className="h-6 w-6 text-yellow-500" />
                          <img
                            src={result.winner.charity.logo}
                            alt={result.winner.charity.name}
                            className="w-12 h-12 rounded-full"
                          />
                          <div>
                            <p className="font-semibold text-lg">
                              {result.winner.charity.name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {result.winner.charity.category}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-yellow-600">
                            {result.winner.percentage.toFixed(1)}%
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {Number(result.winner.totalVotes).toLocaleString()}{' '}
                            votes
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* All Results */}
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm text-muted-foreground">
                        All Results
                      </h4>
                      {result.results.map(charity => (
                        <div
                          key={charity.gaugeAddress}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div className="flex items-center space-x-3">
                            {getRankIcon(charity.rank)}
                            <img
                              src={charity.charity.logo}
                              alt={charity.charity.name}
                              className="w-8 h-8 rounded-full"
                            />
                            <div>
                              <p className="font-medium">
                                {charity.charity.name}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Rank #{charity.rank}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">
                              {charity.percentage.toFixed(1)}%
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {Number(charity.totalVotes).toLocaleString()}{' '}
                              votes
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Result Metadata */}
                    <div className="mt-4 pt-4 border-t grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Margin</p>
                        <p className="font-medium">
                          {result.margin.toFixed(2)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Total Voters</p>
                        <p className="font-medium">
                          {result.totalVoters.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Result Type</p>
                        <Badge
                          variant={result.isConclusive ? 'default' : 'outline'}
                        >
                          {result.isConclusive ? 'Conclusive' : 'Close'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="statistics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Participation Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Participation Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {votingStatistics.participationTrend.map((trend, index) => (
                    <div
                      key={trend.proposalId}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">
                          Proposal {trend.proposalId}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(trend.date)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          {trend.uniqueVoters.toLocaleString()} voters
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {Number(trend.totalVotes).toLocaleString()} votes
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Summary Statistics */}
            <Card>
              <CardHeader>
                <CardTitle>Summary Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Vote className="h-5 w-5 text-blue-500" />
                      <span>Average Votes per Proposal</span>
                    </div>
                    <span className="font-medium">
                      {votingStatistics.totalProposalsFinalized > 0
                        ? Math.round(
                            Number(votingStatistics.totalVotesCast) /
                              votingStatistics.totalProposalsFinalized
                          ).toLocaleString()
                        : '0'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Users className="h-5 w-5 text-green-500" />
                      <span>Average Participation</span>
                    </div>
                    <span className="font-medium">
                      {Math.round(votingStatistics.averageParticipation)} voters
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Percent className="h-5 w-5 text-purple-500" />
                      <span>Conclusive Results</span>
                    </div>
                    <span className="font-medium">
                      {finalizedResults.filter(r => r.isConclusive).length} /{' '}
                      {finalizedResults.length}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Target className="h-5 w-5 text-orange-500" />
                      <span>Close Races</span>
                    </div>
                    <span className="font-medium">
                      {finalizedResults.filter(r => !r.isConclusive).length}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

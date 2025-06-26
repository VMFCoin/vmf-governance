import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Gift,
  Users,
  BarChart3,
  ArrowUpRight,
  Calendar,
  Heart,
  Loader2,
} from 'lucide-react';
import {
  fundDistributionService,
  DistributionTransaction,
  DistributionStatus,
  DistributionHistory,
} from '@/services/fundDistributionService';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Charity } from '@/types';

// Helper function for time ago formatting
const formatTimeAgo = (date: Date): string => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  return `${Math.floor(diffInSeconds / 86400)}d ago`;
};

interface FundDistributionDashboardProps {
  className?: string;
}

export function FundDistributionDashboard({
  className,
}: FundDistributionDashboardProps) {
  const [distributionHistory, setDistributionHistory] =
    useState<DistributionHistory | null>(null);
  const [activeDistributions, setActiveDistributions] = useState<
    DistributionStatus[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState('overview');

  useEffect(() => {
    loadDashboardData();

    // Set up polling for active distributions
    const interval = setInterval(() => {
      loadActiveDistributions();
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [history] = await Promise.all([
        fundDistributionService.getDistributionHistory(),
      ]);

      setDistributionHistory(history);
      await loadActiveDistributions();
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to load dashboard data'
      );
    } finally {
      setLoading(false);
    }
  };

  const loadActiveDistributions = async () => {
    try {
      if (!distributionHistory) return;

      const activeStatuses = await Promise.all(
        distributionHistory.distributions
          .filter(d => d.status === 'pending' || d.status === 'processing')
          .map(async d => {
            const status = await fundDistributionService.getDistributionStatus(
              d.id
            );
            return status;
          })
      );

      setActiveDistributions(
        activeStatuses.filter(Boolean) as DistributionStatus[]
      );
    } catch (err) {
      console.error('Error loading active distributions:', err);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'processing':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'confirmed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'confirmed':
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

  if (!distributionHistory) {
    return (
      <div className={`space-y-6 ${className}`}>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>No distribution data available</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Fund Distribution Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor and manage charity fund distributions
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
              <DollarSign className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Distributed
                </p>
                <p className="text-2xl font-bold">
                  {formatCurrency(distributionHistory.totalDistributed)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Gift className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Distributions
                </p>
                <p className="text-2xl font-bold">
                  {distributionHistory.totalDistributions}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Heart className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Charities Supported
                </p>
                <p className="text-2xl font-bold">
                  {Object.keys(distributionHistory.charityStats).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Active Distributions
                </p>
                <p className="text-2xl font-bold">
                  {activeDistributions.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Distributions */}
      {activeDistributions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Active Distributions</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activeDistributions.map(distribution => (
                <div
                  key={distribution.distributionId}
                  className="border rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(distribution.status)}
                      <span className="font-medium">
                        Distribution {distribution.distributionId.slice(-8)}
                      </span>
                      <Badge
                        variant={
                          getStatusBadgeVariant(distribution.status) as any
                        }
                      >
                        {distribution.status}
                      </Badge>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {distribution.progress}% complete
                    </span>
                  </div>

                  <Progress value={distribution.progress} className="mb-2" />

                  <p className="text-sm text-muted-foreground mb-2">
                    {distribution.message}
                  </p>

                  {distribution.transactionHash && (
                    <p className="text-xs font-mono text-muted-foreground">
                      TX: {distribution.transactionHash}
                    </p>
                  )}

                  {distribution.error && (
                    <Alert variant="destructive" className="mt-2">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{distribution.error}</AlertDescription>
                    </Alert>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="history">Distribution History</TabsTrigger>
          <TabsTrigger value="charities">Charity Statistics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Distributions */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Distributions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {distributionHistory.distributions
                    .filter(d => d.status === 'confirmed')
                    .slice(0, 5)
                    .map(distribution => (
                      <div
                        key={distribution.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <img
                            src={distribution.winnerCharity.logo}
                            alt={distribution.winnerCharity.name}
                            className="w-8 h-8 rounded-full"
                          />
                          <div>
                            <p className="font-medium">
                              {distribution.winnerCharity.name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {formatTimeAgo(distribution.confirmedAt!)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            {formatCurrency(distribution.fundAmount)}
                          </p>
                          <Badge variant="default" className="text-xs">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Confirmed
                          </Badge>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Charities */}
            <Card>
              <CardHeader>
                <CardTitle>Top Beneficiary Charities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(distributionHistory.charityStats)
                    .sort(([, a], [, b]) => b.totalReceived - a.totalReceived)
                    .slice(0, 5)
                    .map(([charityId, stats]) => {
                      // Find charity details
                      const charity = distributionHistory.distributions.find(
                        d => d.winnerCharity.id === charityId
                      )?.winnerCharity;

                      if (!charity) return null;

                      return (
                        <div
                          key={charityId}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div className="flex items-center space-x-3">
                            <img
                              src={charity.logo}
                              alt={charity.name}
                              className="w-8 h-8 rounded-full"
                            />
                            <div>
                              <p className="font-medium">{charity.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {stats.distributionCount} distributions
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">
                              {formatCurrency(stats.totalReceived)}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Last: {formatTimeAgo(stats.lastDistribution)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Distribution History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {distributionHistory.distributions.map(distribution => (
                  <div key={distribution.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <img
                          src={distribution.winnerCharity.logo}
                          alt={distribution.winnerCharity.name}
                          className="w-10 h-10 rounded-full"
                        />
                        <div>
                          <p className="font-medium">
                            {distribution.winnerCharity.name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Holiday: {distribution.holidayId}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold">
                          {formatCurrency(distribution.fundAmount)}
                        </p>
                        <Badge
                          variant={
                            getStatusBadgeVariant(distribution.status) as any
                          }
                        >
                          {getStatusIcon(distribution.status)}
                          <span className="ml-1">{distribution.status}</span>
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Created</p>
                        <p>{formatDate(distribution.createdAt)}</p>
                      </div>
                      {distribution.confirmedAt && (
                        <div>
                          <p className="text-muted-foreground">Confirmed</p>
                          <p>{formatDate(distribution.confirmedAt)}</p>
                        </div>
                      )}
                      {distribution.transactionHash && (
                        <div>
                          <p className="text-muted-foreground">Transaction</p>
                          <p className="font-mono text-xs">
                            {distribution.transactionHash.slice(0, 10)}...
                          </p>
                        </div>
                      )}
                      {distribution.blockNumber && (
                        <div>
                          <p className="text-muted-foreground">Block</p>
                          <p>{distribution.blockNumber.toLocaleString()}</p>
                        </div>
                      )}
                    </div>

                    {distribution.error && (
                      <Alert variant="destructive" className="mt-3">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          {distribution.error}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="charities" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Charity Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(distributionHistory.charityStats).map(
                  ([charityId, stats]) => {
                    const charity = distributionHistory.distributions.find(
                      d => d.winnerCharity.id === charityId
                    )?.winnerCharity;

                    if (!charity) return null;

                    return (
                      <Card key={charityId}>
                        <CardContent className="p-4">
                          <div className="flex items-center space-x-3 mb-3">
                            <img
                              src={charity.logo}
                              alt={charity.name}
                              className="w-12 h-12 rounded-full"
                            />
                            <div>
                              <p className="font-medium">{charity.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {charity.category}
                              </p>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">
                                Total Received
                              </span>
                              <span className="font-medium">
                                {formatCurrency(stats.totalReceived)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">
                                Distributions
                              </span>
                              <span className="font-medium">
                                {stats.distributionCount}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">
                                Last Distribution
                              </span>
                              <span className="font-medium">
                                {formatTimeAgo(stats.lastDistribution)}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  }
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Play,
  Pause,
  CheckCircle,
  AlertCircle,
  Clock,
  ArrowRight,
  RefreshCw,
  Settings,
  DollarSign,
  Vote,
  Trophy,
  Users,
  Calendar,
  Activity,
  TrendingUp,
  Loader2,
} from 'lucide-react';
import { FundDistributionDashboard } from './FundDistributionDashboard';
import { VoteFinalizationDashboard } from './VoteFinalizationDashboard';

interface Phase22IntegrationProps {
  className?: string;
}

interface SystemStatus {
  voteFinalization: {
    status: 'idle' | 'running' | 'paused' | 'error';
    activeProposals: number;
    completedToday: number;
    lastFinalized?: Date;
  };
  fundDistribution: {
    status: 'idle' | 'running' | 'paused' | 'error';
    pendingDistributions: number;
    completedToday: number;
    lastDistribution?: Date;
  };
  system: {
    isHealthy: boolean;
    uptime: number;
    lastHealthCheck: Date;
    errors: string[];
  };
}

interface AutomationSettings {
  autoFinalization: boolean;
  autoDistribution: boolean;
  finalizationDelay: number; // minutes
  distributionDelay: number; // minutes
  maxConcurrentOperations: number;
  enableNotifications: boolean;
}

export function Phase22Integration({ className }: Phase22IntegrationProps) {
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    voteFinalization: {
      status: 'idle',
      activeProposals: 0,
      completedToday: 0,
    },
    fundDistribution: {
      status: 'idle',
      pendingDistributions: 0,
      completedToday: 0,
    },
    system: {
      isHealthy: true,
      uptime: 0,
      lastHealthCheck: new Date(),
      errors: [],
    },
  });

  const [automationSettings, setAutomationSettings] =
    useState<AutomationSettings>({
      autoFinalization: false,
      autoDistribution: false,
      finalizationDelay: 5,
      distributionDelay: 10,
      maxConcurrentOperations: 3,
      enableNotifications: true,
    });

  const [selectedTab, setSelectedTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSystemStatus();

    // Set up system monitoring
    const interval = setInterval(() => {
      loadSystemStatus();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const loadSystemStatus = async () => {
    try {
      setLoading(true);

      // Mock system status - in real implementation, this would query actual services
      const mockStatus: SystemStatus = {
        voteFinalization: {
          status: 'idle',
          activeProposals: 2,
          completedToday: 5,
          lastFinalized: new Date(Date.now() - 3600000), // 1 hour ago
        },
        fundDistribution: {
          status: 'idle',
          pendingDistributions: 1,
          completedToday: 3,
          lastDistribution: new Date(Date.now() - 1800000), // 30 minutes ago
        },
        system: {
          isHealthy: true,
          uptime: 86400, // 24 hours in seconds
          lastHealthCheck: new Date(),
          errors: [],
        },
      };

      setSystemStatus(mockStatus);
    } catch (err) {
      console.error('Error loading system status:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to load system status'
      );
    } finally {
      setLoading(false);
    }
  };

  const toggleAutomation = async (type: 'finalization' | 'distribution') => {
    try {
      if (type === 'finalization') {
        setAutomationSettings(prev => ({
          ...prev,
          autoFinalization: !prev.autoFinalization,
        }));
      } else {
        setAutomationSettings(prev => ({
          ...prev,
          autoDistribution: !prev.autoDistribution,
        }));
      }

      // In real implementation, this would update the backend automation settings
    } catch (err) {
      console.error('Error toggling automation:', err);
    }
  };

  const triggerManualFinalization = async () => {
    try {
      // In real implementation, this would trigger manual vote finalization
      console.log('Triggering manual vote finalization...');
    } catch (err) {
      console.error('Error triggering finalization:', err);
    }
  };

  const triggerManualDistribution = async () => {
    try {
      // In real implementation, this would trigger manual fund distribution
      console.log('Triggering manual fund distribution...');
    } catch (err) {
      console.error('Error triggering distribution:', err);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <Activity className="h-4 w-4 text-green-500 animate-pulse" />;
      case 'paused':
        return <Pause className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'running':
        return 'default';
      case 'paused':
        return 'secondary';
      case 'error':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
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

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            Phase 22.5: Vote Finalization & Fund Distribution
          </h1>
          <p className="text-muted-foreground">
            Automated voting finalization and fund distribution system
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={loadSystemStatus} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Badge variant={systemStatus.system.isHealthy ? 'default' : 'error'}>
            {systemStatus.system.isHealthy ? 'Healthy' : 'Issues Detected'}
          </Badge>
        </div>
      </div>

      {/* System Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Vote Finalization Status */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center space-x-2">
              <Vote className="h-5 w-5 text-blue-500" />
              <span>Vote Finalization</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                {getStatusIcon(systemStatus.voteFinalization.status)}
                <Badge
                  variant={
                    getStatusBadgeVariant(
                      systemStatus.voteFinalization.status
                    ) as any
                  }
                >
                  {systemStatus.voteFinalization.status}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-muted-foreground">Active</p>
                  <p className="font-medium">
                    {systemStatus.voteFinalization.activeProposals}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Today</p>
                  <p className="font-medium">
                    {systemStatus.voteFinalization.completedToday}
                  </p>
                </div>
              </div>

              {systemStatus.voteFinalization.lastFinalized && (
                <p className="text-xs text-muted-foreground">
                  Last:{' '}
                  {formatTimeAgo(systemStatus.voteFinalization.lastFinalized)}
                </p>
              )}

              <div className="flex items-center space-x-2">
                <Button
                  onClick={() => toggleAutomation('finalization')}
                  variant={
                    automationSettings.autoFinalization ? 'primary' : 'outline'
                  }
                  size="sm"
                  className="flex-1"
                >
                  {automationSettings.autoFinalization ? (
                    <Pause className="h-3 w-3 mr-1" />
                  ) : (
                    <Play className="h-3 w-3 mr-1" />
                  )}
                  Auto
                </Button>
                <Button
                  onClick={triggerManualFinalization}
                  variant="outline"
                  size="sm"
                >
                  Manual
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Fund Distribution Status */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-green-500" />
              <span>Fund Distribution</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                {getStatusIcon(systemStatus.fundDistribution.status)}
                <Badge
                  variant={
                    getStatusBadgeVariant(
                      systemStatus.fundDistribution.status
                    ) as any
                  }
                >
                  {systemStatus.fundDistribution.status}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-muted-foreground">Pending</p>
                  <p className="font-medium">
                    {systemStatus.fundDistribution.pendingDistributions}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Today</p>
                  <p className="font-medium">
                    {systemStatus.fundDistribution.completedToday}
                  </p>
                </div>
              </div>

              {systemStatus.fundDistribution.lastDistribution && (
                <p className="text-xs text-muted-foreground">
                  Last:{' '}
                  {formatTimeAgo(
                    systemStatus.fundDistribution.lastDistribution
                  )}
                </p>
              )}

              <div className="flex items-center space-x-2">
                <Button
                  onClick={() => toggleAutomation('distribution')}
                  variant={
                    automationSettings.autoDistribution ? 'primary' : 'outline'
                  }
                  size="sm"
                  className="flex-1"
                >
                  {automationSettings.autoDistribution ? (
                    <Pause className="h-3 w-3 mr-1" />
                  ) : (
                    <Play className="h-3 w-3 mr-1" />
                  )}
                  Auto
                </Button>
                <Button
                  onClick={triggerManualDistribution}
                  variant="outline"
                  size="sm"
                >
                  Manual
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Health */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center space-x-2">
              <Activity className="h-5 w-5 text-purple-500" />
              <span>System Health</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <Badge variant="default">Operational</Badge>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Uptime</span>
                  <span className="font-medium">
                    {formatUptime(systemStatus.system.uptime)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Errors</span>
                  <span className="font-medium">
                    {systemStatus.system.errors.length}
                  </span>
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                Last check: {formatTimeAgo(systemStatus.system.lastHealthCheck)}
              </p>

              <Button variant="outline" size="sm" className="w-full">
                <Settings className="h-3 w-3 mr-1" />
                Settings
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Errors */}
      {systemStatus.system.errors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              <p className="font-medium">System Issues Detected:</p>
              <ul className="list-disc list-inside space-y-1">
                {systemStatus.system.errors.map((error, index) => (
                  <li key={index} className="text-sm">
                    {error}
                  </li>
                ))}
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Automation Flow */}
      <Card>
        <CardHeader>
          <CardTitle>Automation Flow</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Vote className="h-5 w-5 text-blue-500" />
                <span className="font-medium">Vote Finalization</span>
                <Badge
                  variant={
                    automationSettings.autoFinalization ? 'default' : 'outline'
                  }
                >
                  {automationSettings.autoFinalization ? 'Auto' : 'Manual'}
                </Badge>
              </div>

              <ArrowRight className="h-4 w-4 text-muted-foreground" />

              <div className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5 text-green-500" />
                <span className="font-medium">Fund Distribution</span>
                <Badge
                  variant={
                    automationSettings.autoDistribution ? 'default' : 'outline'
                  }
                >
                  {automationSettings.autoDistribution ? 'Auto' : 'Manual'}
                </Badge>
              </div>
            </div>

            <div className="text-right text-sm text-muted-foreground">
              <p>Finalization delay: {automationSettings.finalizationDelay}m</p>
              <p>Distribution delay: {automationSettings.distributionDelay}m</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="finalization">Vote Finalization</TabsTrigger>
          <TabsTrigger value="distribution">Fund Distribution</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 p-3 border rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <div className="flex-1">
                      <p className="font-medium">
                        Vote finalized for Proposal #123
                      </p>
                      <p className="text-sm text-muted-foreground">
                        1 hour ago
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 p-3 border rounded-lg">
                    <DollarSign className="h-5 w-5 text-green-500" />
                    <div className="flex-1">
                      <p className="font-medium">
                        Funds distributed to Save the Whales
                      </p>
                      <p className="text-sm text-muted-foreground">
                        30 minutes ago
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 p-3 border rounded-lg">
                    <Vote className="h-5 w-5 text-blue-500" />
                    <div className="flex-1">
                      <p className="font-medium">
                        Vote finalized for Proposal #122
                      </p>
                      <p className="text-sm text-muted-foreground">
                        2 hours ago
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Performance Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Automation Success Rate</span>
                      <span className="font-medium">98.5%</span>
                    </div>
                    <Progress value={98.5} />
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Average Processing Time</span>
                      <span className="font-medium">2.3 min</span>
                    </div>
                    <Progress value={77} />
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>System Availability</span>
                      <span className="font-medium">99.9%</span>
                    </div>
                    <Progress value={99.9} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="finalization">
          <VoteFinalizationDashboard />
        </TabsContent>

        <TabsContent value="distribution">
          <FundDistributionDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
}

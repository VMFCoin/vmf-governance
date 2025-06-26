'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Download,
  RotateCcw,
  Eye,
  PieChart,
  BarChart3,
  Activity,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Shield,
  Users,
} from 'lucide-react';
import {
  Card,
  Button,
  Badge,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui';
import { formatEther, formatUnits } from 'viem';
import {
  treasuryService,
  TreasuryBalance,
  TreasuryTransaction,
  TreasuryPerformance,
  DistributionPlan,
} from '@/services/treasuryService';

interface TreasuryDashboardProps {
  className?: string;
}

export function TreasuryDashboard({ className }: TreasuryDashboardProps) {
  const [treasuryBalance, setTreasuryBalance] =
    useState<TreasuryBalance | null>(null);
  const [transactions, setTransactions] = useState<TreasuryTransaction[]>([]);
  const [performance, setPerformance] = useState<TreasuryPerformance | null>(
    null
  );
  const [distributionPlans, setDistributionPlans] = useState<
    DistributionPlan[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState('overview');

  // Load treasury data
  const loadTreasuryData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [balance, txHistory, perf, plans] = await Promise.all([
        treasuryService.getTreasuryBalance(),
        treasuryService.getTransactionHistory(20),
        treasuryService.getTreasuryPerformance(
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
          new Date()
        ),
        treasuryService.getDistributionPlans(),
      ]);

      setTreasuryBalance(balance);
      setTransactions(txHistory);
      setPerformance(perf);
      setDistributionPlans(plans);
      setLastUpdated(new Date());
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load treasury data'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Real-time transaction monitoring
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const setupMonitoring = async () => {
      unsubscribe = await treasuryService.monitorTreasuryTransactions(newTx => {
        setTransactions(prev => [newTx, ...prev.slice(0, 19)]);
        setLastUpdated(new Date());
      });
    };

    setupMonitoring();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  // Initial data load
  useEffect(() => {
    loadTreasuryData();
  }, []);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(loadTreasuryData, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatCurrency = (amount: bigint, decimals: number = 18): string => {
    const formatted = formatUnits(amount, decimals);
    const num = parseFloat(formatted);
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    }).format(num);
  };

  const formatUSD = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getTransactionIcon = (type: TreasuryTransaction['type']) => {
    switch (type) {
      case 'deposit':
        return <ArrowDownRight className="w-4 h-4 text-green-500" />;
      case 'withdrawal':
        return <ArrowUpRight className="w-4 h-4 text-red-500" />;
      case 'distribution':
        return <Users className="w-4 h-4 text-blue-500" />;
      case 'allocation':
        return <PieChart className="w-4 h-4 text-purple-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading && !treasuryBalance) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 border-4 border-patriotBlue border-t-transparent rounded-full animate-spin"></div>
          <span className="text-textSecondary">Loading treasury data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center space-x-2 text-red-600">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
        <Button onClick={loadTreasuryData} className="mt-4 mx-auto">
          <RotateCcw
            className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`}
          />
          Retry
        </Button>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-patriotWhite">
            Treasury Dashboard
          </h1>
          <p className="text-textSecondary mt-1">
            Monitor treasury balance, transactions, and distributions
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="text-sm text-textSecondary">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadTreasuryData}
            disabled={isLoading}
          >
            <RotateCcw
              className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* Treasury Status Banner */}
      <Card className="p-6 bg-gradient-to-r from-patriotBlue/10 to-patriotRed/10 border-patriotBlue/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-patriotBlue/20 rounded-full flex items-center justify-center">
              <Shield className="w-6 h-6 text-patriotBlue" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-patriotWhite">
                Treasury Status
              </h3>
              <p className="text-textSecondary">
                {treasuryService.isContractDeployed()
                  ? 'Connected to deployed treasury contract'
                  : 'Using mock data - Treasury contract not deployed'}
              </p>
            </div>
          </div>
          <Badge
            variant={
              treasuryService.isContractDeployed() ? 'default' : 'secondary'
            }
          >
            {treasuryService.isContractDeployed() ? 'Live' : 'Mock'}
          </Badge>
        </div>
      </Card>

      {/* Balance Overview Cards */}
      {treasuryBalance && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-textSecondary">Total Balance</p>
                <p className="text-2xl font-bold text-patriotWhite">
                  {formatCurrency(treasuryBalance.totalBalance)} ETH
                </p>
                <p className="text-sm text-green-400">
                  {formatUSD(
                    treasuryBalance.assets.reduce(
                      (sum, asset) => sum + asset.valueUSD,
                      0
                    )
                  )}
                </p>
              </div>
              <div className="w-12 h-12 bg-patriotBlue/20 rounded-full flex items-center justify-center">
                <Wallet className="w-6 h-6 text-patriotBlue" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-textSecondary">Available Balance</p>
                <p className="text-2xl font-bold text-patriotWhite">
                  {formatCurrency(treasuryBalance.availableBalance)} ETH
                </p>
                <p className="text-sm text-textSecondary">
                  {(
                    (Number(treasuryBalance.availableBalance) /
                      Number(treasuryBalance.totalBalance)) *
                    100
                  ).toFixed(1)}
                  % of total
                </p>
              </div>
              <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-500" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-textSecondary">Locked Balance</p>
                <p className="text-2xl font-bold text-patriotWhite">
                  {formatCurrency(treasuryBalance.lockedBalance)} ETH
                </p>
                <p className="text-sm text-textSecondary">
                  {(
                    (Number(treasuryBalance.lockedBalance) /
                      Number(treasuryBalance.totalBalance)) *
                    100
                  ).toFixed(1)}
                  % of total
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-500" />
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="distributions">Distributions</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {treasuryBalance && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Asset Allocation */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-patriotWhite mb-4">
                  Asset Allocation
                </h3>
                <div className="space-y-4">
                  {treasuryBalance.assets.map((asset, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-patriotBlue/20 rounded-full flex items-center justify-center">
                          <span className="text-sm font-bold text-patriotBlue">
                            {asset.symbol}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold text-patriotWhite">
                            {asset.name}
                          </p>
                          <p className="text-sm text-textSecondary">
                            {formatCurrency(asset.balance, asset.decimals)}{' '}
                            {asset.symbol}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-patriotWhite">
                          {formatUSD(asset.valueUSD)}
                        </p>
                        <p className="text-sm text-textSecondary">
                          {asset.percentage}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Recent Activity */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-patriotWhite mb-4">
                  Recent Activity
                </h3>
                <div className="space-y-3">
                  {transactions.slice(0, 5).map(tx => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between p-3 bg-backgroundAccent/30 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        {getTransactionIcon(tx.type)}
                        <div>
                          <p className="font-medium text-patriotWhite">
                            {tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}
                          </p>
                          <p className="text-sm text-textSecondary">
                            {tx.recipientName || tx.description}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-patriotWhite">
                          {formatCurrency(tx.amount)} {tx.tokenSymbol}
                        </p>
                        <Badge className={getStatusColor(tx.status)}>
                          {tx.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-patriotWhite">
                Transaction History
              </h3>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
            <div className="space-y-3">
              {transactions.map(tx => (
                <motion.div
                  key={tx.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-between p-4 bg-backgroundAccent/30 rounded-lg hover:bg-backgroundAccent/50 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    {getTransactionIcon(tx.type)}
                    <div>
                      <p className="font-medium text-patriotWhite">
                        {tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}
                      </p>
                      <p className="text-sm text-textSecondary">
                        {tx.recipientName || tx.description}
                      </p>
                      <p className="text-xs text-textSecondary">
                        {tx.timestamp.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="font-semibold text-patriotWhite">
                        {formatCurrency(tx.amount)} {tx.tokenSymbol}
                      </p>
                      <Badge className={getStatusColor(tx.status)}>
                        {tx.status}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {}}
                      disabled={isLoading}
                      className="text-textSecondary hover:text-patriotWhite"
                    >
                      <RotateCcw
                        className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`}
                      />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          {performance && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-patriotWhite mb-4">
                  Performance Metrics
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-textSecondary">Total Inflow</span>
                    <span className="font-semibold text-green-400">
                      +{formatCurrency(performance.totalInflow)} ETH
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-textSecondary">Total Outflow</span>
                    <span className="font-semibold text-red-400">
                      -{formatCurrency(performance.totalOutflow)} ETH
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-textSecondary">
                      Total Distributed
                    </span>
                    <span className="font-semibold text-patriotBlue">
                      {formatCurrency(performance.totalDistributed)} ETH
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-textSecondary">
                      Distribution Count
                    </span>
                    <span className="font-semibold text-patriotWhite">
                      {performance.distributionCount}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-textSecondary">
                      Average Distribution
                    </span>
                    <span className="font-semibold text-patriotWhite">
                      {formatCurrency(performance.averageDistribution)} ETH
                    </span>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold text-patriotWhite mb-4">
                  Monthly Statistics
                </h3>
                <div className="space-y-3">
                  {performance.monthlyStats.map((stat, index) => (
                    <div
                      key={index}
                      className="p-3 bg-backgroundAccent/30 rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-patriotWhite">
                          {stat.month}
                        </span>
                        <span
                          className={`font-semibold ${
                            Number(stat.netFlow) >= 0
                              ? 'text-green-400'
                              : 'text-red-400'
                          }`}
                        >
                          {Number(stat.netFlow) >= 0 ? '+' : ''}
                          {formatCurrency(stat.netFlow)} ETH
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm text-textSecondary">
                        <span>In: {formatCurrency(stat.inflow)} ETH</span>
                        <span>Out: {formatCurrency(stat.outflow)} ETH</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Distributions Tab */}
        <TabsContent value="distributions" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-patriotWhite mb-6">
              Scheduled Distributions
            </h3>
            <div className="space-y-4">
              {distributionPlans.map(plan => (
                <div
                  key={plan.id}
                  className="p-4 bg-backgroundAccent/30 rounded-lg"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <img
                        src={plan.charity.logo}
                        alt={plan.charity.name}
                        className="w-10 h-10 rounded-full"
                      />
                      <div>
                        <p className="font-semibold text-patriotWhite">
                          {plan.charity.name}
                        </p>
                        <p className="text-sm text-textSecondary">
                          {plan.holidayId.replace('-', ' ').toUpperCase()}
                        </p>
                      </div>
                    </div>
                    <Badge className={getStatusColor(plan.status)}>
                      {plan.status}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-textSecondary">Amount:</span>
                      <span className="ml-2 font-semibold text-patriotWhite">
                        {formatCurrency(plan.amount)} ETH
                      </span>
                    </div>
                    <div>
                      <span className="text-textSecondary">Scheduled:</span>
                      <span className="ml-2 font-semibold text-patriotWhite">
                        {plan.scheduledDate.toLocaleDateString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-textSecondary">Approvals:</span>
                      <span className="ml-2 font-semibold text-patriotWhite">
                        {plan.approvals}/{plan.requiredApprovals}
                      </span>
                    </div>
                    <div>
                      <span className="text-textSecondary">Status:</span>
                      <span className="ml-2 font-semibold text-patriotWhite">
                        {plan.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

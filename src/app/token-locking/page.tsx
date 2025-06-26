'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lock,
  BarChart3,
  Lightbulb,
  Settings,
  TrendingUp,
  Shield,
  Zap,
  ArrowLeft,
  Plus,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';
import { Header, Footer, Button, Card } from '@/components';
import {
  AdvancedTokenLocking,
  EnhancedLockInterface,
  LockAnalyticsDashboard,
  LockOptimizationRecommendations,
  VotingPowerChart,
} from '@/components/voting';
import { type OptimizationRecommendation } from '@/lib/votingPowerCalculations';
import { useWalletStore } from '@/stores/useWalletStore';
import { useTokenLockStore } from '@/stores/useTokenLockStore';
import { cn } from '@/lib/utils';
import {
  fadeInVariants,
  staggerContainer,
  slideInVariants,
} from '@/lib/animations';

type ActiveTab = 'locking' | 'analytics' | 'optimization' | 'advanced';

export default function TokenLockingPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('locking');
  const [selectedOptimization, setSelectedOptimization] =
    useState<OptimizationRecommendation | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { isConnected, address } = useWalletStore();
  const { userLocks, fetchUserLocks, isLoading } = useTokenLockStore();

  const tabs = [
    {
      id: 'locking' as ActiveTab,
      label: 'Token Locking',
      icon: Lock,
      description: 'Create and manage token locks',
      color: 'text-patriotBlue',
    },
    {
      id: 'analytics' as ActiveTab,
      label: 'Analytics',
      icon: BarChart3,
      description: 'Portfolio performance insights',
      color: 'text-green-400',
    },
    {
      id: 'optimization' as ActiveTab,
      label: 'Optimization',
      icon: Lightbulb,
      description: 'AI-powered recommendations',
      color: 'text-yellow-400',
    },
    {
      id: 'advanced' as ActiveTab,
      label: 'Advanced',
      icon: Settings,
      description: 'Advanced lock management',
      color: 'text-purple-400',
    },
  ];

  const handleOptimizationSelect = (
    recommendation: OptimizationRecommendation
  ) => {
    setSelectedOptimization(recommendation);
    // Switch to advanced tab to implement the recommendation
    setActiveTab('advanced');
  };

  const handleRefresh = async () => {
    if (!isConnected || !address) return;

    setIsRefreshing(true);
    try {
      await fetchUserLocks(address);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (isConnected && address) {
      fetchUserLocks(address);
    }
  }, [isConnected, address, fetchUserLocks]);

  return (
    <div className="min-h-screen bg-backgroundPrimary">
      <Header />

      <main className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <motion.div
          variants={fadeInVariants}
          initial="initial"
          animate="enter"
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Link href="/vote">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Voting
                </Button>
              </Link>

              <div>
                <h1 className="text-4xl font-display font-bold text-patriotWhite mb-2">
                  Token Locking Hub
                </h1>
                <p className="text-textSecondary text-lg">
                  Advanced token locking interface with analytics and
                  optimization
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {isConnected && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                >
                  <RefreshCw
                    className={cn(
                      'w-4 h-4 mr-2',
                      isRefreshing && 'animate-spin'
                    )}
                  />
                  Refresh
                </Button>
              )}

              <div className="text-right">
                <p className="text-sm text-textSecondary">Active Locks</p>
                <p className="text-xl font-bold text-patriotWhite">
                  {userLocks.length}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          {isConnected && userLocks.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-patriotBlue/20 rounded-full flex items-center justify-center">
                    <Lock className="w-5 h-5 text-patriotBlue" />
                  </div>
                  <div>
                    <p className="text-sm text-textSecondary">Total Locked</p>
                    <p className="text-lg font-bold text-patriotWhite">
                      {userLocks
                        .reduce((sum, lock) => sum + Number(lock.amount), 0)
                        .toLocaleString()}{' '}
                      VMF
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                    <Zap className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm text-textSecondary">Voting Power</p>
                    <p className="text-lg font-bold text-patriotWhite">
                      {userLocks
                        .reduce(
                          (sum, lock) => sum + Number(lock.votingPower),
                          0
                        )
                        .toLocaleString()}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-yellow-500/20 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-sm text-textSecondary">Avg Duration</p>
                    <p className="text-lg font-bold text-patriotWhite">
                      {userLocks.length > 0
                        ? Math.round(
                            userLocks.reduce(
                              (sum, lock) => sum + lock.lockDuration,
                              0
                            ) /
                              userLocks.length /
                              (24 * 60 * 60)
                          )
                        : 0}{' '}
                      days
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center">
                    <Shield className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm text-textSecondary">
                      Portfolio Health
                    </p>
                    <p className="text-lg font-bold text-green-400">Good</p>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </motion.div>

        {/* Tab Navigation */}
        <motion.div
          variants={slideInVariants}
          initial="initial"
          animate="enter"
          className="mb-8"
        >
          <div className="flex flex-wrap gap-2 p-1 bg-backgroundAccent rounded-lg">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-all',
                    'hover:bg-backgroundPrimary/50',
                    activeTab === tab.id
                      ? 'bg-patriotBlue text-patriotWhite shadow-sm'
                      : 'text-textSecondary hover:text-patriotWhite'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <div className="text-left">
                    <div className="font-semibold">{tab.label}</div>
                    <div className="text-xs opacity-75">{tab.description}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            variants={fadeInVariants}
            initial="initial"
            animate="enter"
            exit="exit"
            className="min-h-[600px]"
          >
            {activeTab === 'locking' && (
              <div className="space-y-8">
                <EnhancedLockInterface />

                {!isConnected && (
                  <Card className="p-8 text-center">
                    <div className="w-16 h-16 bg-patriotBlue/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Lock className="w-8 h-8 text-patriotBlue" />
                    </div>
                    <h3 className="text-xl font-display font-bold text-patriotWhite mb-2">
                      Connect Your Wallet
                    </h3>
                    <p className="text-textSecondary mb-4">
                      Connect your wallet to start creating token locks and
                      earning voting power
                    </p>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Get Started
                    </Button>
                  </Card>
                )}
              </div>
            )}

            {activeTab === 'analytics' && (
              <div className="space-y-8">
                <VotingPowerChart />
                <LockAnalyticsDashboard />
              </div>
            )}

            {activeTab === 'optimization' && (
              <LockOptimizationRecommendations
                onOptimizationSelect={handleOptimizationSelect}
              />
            )}

            {activeTab === 'advanced' && (
              <div className="space-y-8">
                {selectedOptimization && (
                  <Card className="p-6 border-patriotBlue/50">
                    <div className="flex items-center gap-3 mb-4">
                      <Lightbulb className="w-5 h-5 text-yellow-400" />
                      <h3 className="text-lg font-semibold text-patriotWhite">
                        Implementing Recommendation
                      </h3>
                    </div>
                    <div className="bg-backgroundAccent p-4 rounded-lg mb-4">
                      <h4 className="font-semibold text-patriotWhite mb-2">
                        {selectedOptimization.title}
                      </h4>
                      <p className="text-textSecondary text-sm">
                        {selectedOptimization.description}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedOptimization(null)}
                    >
                      Clear Recommendation
                    </Button>
                  </Card>
                )}

                <AdvancedTokenLocking />
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-patriotBlue"></div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

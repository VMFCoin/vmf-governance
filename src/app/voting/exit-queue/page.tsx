'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Info, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { Button, Card } from '@/components/ui';
import { useWalletStore } from '@/stores/useWalletStore';
import { useTokenLockStore } from '@/stores/useTokenLockStore';
import { ExitQueueInterface } from '@/components/voting/ExitQueueInterface';
import { QueueMonitor } from '@/components/voting/QueueMonitor';
import { cn } from '@/lib/utils';
import {
  fadeInVariants,
  slideInVariants,
  staggerContainer,
} from '@/lib/animations';

export default function ExitQueuePage() {
  const [selectedTokenId, setSelectedTokenId] = useState<number | undefined>();
  const [activeTab, setActiveTab] = useState<'interface' | 'monitor'>(
    'interface'
  );

  const { isConnected, address } = useWalletStore();
  const { userLocks, fetchUserLocks, isLoading } = useTokenLockStore();

  useEffect(() => {
    if (isConnected && address) {
      fetchUserLocks(address);
    }
  }, [isConnected, address]);

  const handleTokenSelect = (tokenId: number) => {
    setSelectedTokenId(tokenId);
    setActiveTab('interface');
  };

  const handleQueueEntered = (tokenId: number) => {
    console.log('Token entered queue:', tokenId);
    // Refresh user locks to update the UI
    if (address) {
      fetchUserLocks(address);
    }
  };

  const handleExitCompleted = (tokenId: number) => {
    console.log('Exit completed for token:', tokenId);
    // Refresh user locks and clear selection
    if (address) {
      fetchUserLocks(address);
    }
    setSelectedTokenId(undefined);
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-backgroundPrimary">
        <div className="container mx-auto px-4 py-8">
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="enter"
            className="max-w-2xl mx-auto"
          >
            <motion.div variants={slideInVariants} className="mb-8">
              <Link
                href="/voting"
                className="inline-flex items-center text-patriotBlue hover:text-patriotBlue/80 transition-colors mb-6"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Voting
              </Link>

              <h1 className="text-4xl font-bold text-patriotWhite mb-4">
                Exit Queue Management
              </h1>
              <p className="text-xl text-textSecondary">
                Manage your token lock exit queue and monitor system activity
              </p>
            </motion.div>

            <motion.div variants={fadeInVariants}>
              <Card className="p-8 text-center">
                <AlertTriangle className="w-16 h-16 text-yellow-400 mx-auto mb-6" />
                <h2 className="text-2xl font-semibold text-patriotWhite mb-4">
                  Wallet Connection Required
                </h2>
                <p className="text-textSecondary mb-6">
                  Please connect your wallet to access exit queue management
                  features.
                </p>
                <Button size="lg" className="w-full max-w-xs">
                  Connect Wallet
                </Button>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-backgroundPrimary">
      <div className="container mx-auto px-4 py-8">
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="enter"
          className="space-y-8"
        >
          {/* Header */}
          <motion.div variants={slideInVariants}>
            <Link
              href="/voting"
              className="inline-flex items-center text-patriotBlue hover:text-patriotBlue/80 transition-colors mb-6"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Voting
            </Link>

            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-4xl font-bold text-patriotWhite mb-4">
                  Exit Queue Management
                </h1>
                <p className="text-xl text-textSecondary">
                  Manage your token lock exit queue and monitor system activity
                </p>
              </div>
            </div>

            {/* Info Banner */}
            <Card className="p-4 bg-patriotBlue/10 border-patriotBlue/20">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-patriotBlue flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium text-patriotWhite mb-1">
                    About Exit Queue
                  </h3>
                  <p className="text-sm text-textSecondary">
                    The exit queue allows you to unlock your tokens after the
                    minimum lock period. Tokens must wait in queue before they
                    can be claimed, and a small fee is charged upon exit.
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Tab Navigation */}
          <motion.div variants={slideInVariants}>
            <div className="flex space-x-1 bg-backgroundAccent/20 p-1 rounded-lg w-fit">
              <button
                onClick={() => setActiveTab('interface')}
                className={cn(
                  'px-6 py-2 rounded-md text-sm font-medium transition-colors',
                  activeTab === 'interface'
                    ? 'bg-patriotBlue text-white'
                    : 'text-textSecondary hover:text-patriotWhite'
                )}
              >
                Queue Interface
              </button>
              <button
                onClick={() => setActiveTab('monitor')}
                className={cn(
                  'px-6 py-2 rounded-md text-sm font-medium transition-colors',
                  activeTab === 'monitor'
                    ? 'bg-patriotBlue text-white'
                    : 'text-textSecondary hover:text-patriotWhite'
                )}
              >
                Queue Monitor
              </button>
            </div>
          </motion.div>

          {/* Token Selection (only show for interface tab) */}
          {activeTab === 'interface' && userLocks.length > 0 && (
            <motion.div variants={slideInVariants}>
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-patriotWhite mb-4">
                  Select a Token Lock
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {userLocks.map(lock => (
                    <button
                      key={lock.id}
                      onClick={() => setSelectedTokenId(lock.id)}
                      className={cn(
                        'p-4 rounded-lg border-2 transition-all text-left',
                        selectedTokenId === lock.id
                          ? 'border-patriotBlue bg-patriotBlue/10'
                          : 'border-backgroundAccent hover:border-patriotBlue/50 bg-backgroundAccent/20'
                      )}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-patriotWhite">
                          Token #{lock.id}
                        </span>
                        <span
                          className={cn(
                            'text-xs px-2 py-1 rounded',
                            lock.isWarmupComplete
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-yellow-500/20 text-yellow-400'
                          )}
                        >
                          {lock.isWarmupComplete ? 'Active' : 'Warming Up'}
                        </span>
                      </div>
                      <p className="text-sm text-textSecondary mb-1">
                        Amount: {(Number(lock.amount) / 1e18).toFixed(2)} VMF
                      </p>
                      <p className="text-sm text-textSecondary">
                        Expires: {lock.expiresAt.toLocaleDateString()}
                      </p>
                    </button>
                  ))}
                </div>
              </Card>
            </motion.div>
          )}

          {/* Content */}
          <motion.div variants={slideInVariants}>
            {activeTab === 'interface' ? (
              <ExitQueueInterface
                tokenId={selectedTokenId}
                onQueueEntered={handleQueueEntered}
                onExitCompleted={handleExitCompleted}
              />
            ) : (
              <QueueMonitor onTokenSelect={handleTokenSelect} />
            )}
          </motion.div>

          {/* Empty State for Interface Tab */}
          {activeTab === 'interface' &&
            userLocks.length === 0 &&
            !isLoading && (
              <motion.div variants={fadeInVariants}>
                <Card className="p-8 text-center">
                  <AlertTriangle className="w-16 h-16 text-yellow-400 mx-auto mb-6" />
                  <h2 className="text-2xl font-semibold text-patriotWhite mb-4">
                    No Token Locks Found
                  </h2>
                  <p className="text-textSecondary mb-6">
                    You don't have any token locks yet. Create a token lock to
                    access exit queue features.
                  </p>
                  <Link href="/token-locking">
                    <Button size="lg">Create Token Lock</Button>
                  </Link>
                </Card>
              </motion.div>
            )}
        </motion.div>
      </div>
    </div>
  );
}

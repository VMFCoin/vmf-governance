'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Lock,
  Zap,
  Calendar,
  Info,
  ArrowRight,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import { Button, Card } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import { useTokenLockStore } from '@/stores/useTokenLockStore';
import { useWalletSync } from '@/hooks/useWalletSync';
import { mockEscrowService } from '@/services/mockEscrowService';
import { cn } from '@/lib/utils';
import { fadeInVariants, slideUpVariants } from '@/lib/animations';

interface TokenLockingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TokenLockingModal({ isOpen, onClose }: TokenLockingModalProps) {
  const [amount, setAmount] = useState('');
  const [duration, setDuration] = useState(90); // Default 90 days
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { address } = useWalletSync();
  const { showSuccess, showError } = useToast();
  const { refreshUserData } = useTokenLockStore();

  // Duration options in days
  const durationOptions = [
    { days: 30, label: '30 Days', multiplier: 1.0 },
    { days: 90, label: '90 Days', multiplier: 1.5 },
    { days: 180, label: '180 Days', multiplier: 2.0 },
    { days: 365, label: '1 Year', multiplier: 3.0 },
  ];

  // Calculate voting power based on amount and duration
  const calculateVotingPower = (
    tokenAmount: string,
    lockDays: number
  ): number => {
    const tokens = parseFloat(tokenAmount) || 0;
    const option = durationOptions.find(opt => opt.days === lockDays);
    const multiplier = option?.multiplier || 1.0;
    return tokens * multiplier;
  };

  const handleSubmit = async () => {
    if (!address) {
      showError('Wallet Not Connected', 'Please connect your wallet first.');
      return;
    }

    const tokenAmount = parseFloat(amount);
    if (!tokenAmount || tokenAmount <= 0) {
      showError('Invalid Amount', 'Please enter a valid token amount.');
      return;
    }

    setIsSubmitting(true);
    try {
      const amountWei = BigInt(Math.floor(tokenAmount * 1e18));
      const durationSeconds = duration * 24 * 60 * 60; // Convert days to seconds

      await mockEscrowService.createLock(amountWei, durationSeconds, address);

      showSuccess(
        'Tokens Locked Successfully!',
        `${tokenAmount} VMF tokens locked for ${duration} days. Voting power will be available after the 3-day warmup period.`
      );

      // Refresh user data to show the new lock
      await refreshUserData(address);

      onClose();
      setAmount('');
      setDuration(90);
    } catch (error) {
      console.error('Failed to lock tokens:', error);
      showError(
        'Lock Failed',
        'There was an error locking your tokens. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const votingPower = calculateVotingPower(amount, duration);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="relative w-full max-w-lg"
            variants={slideUpVariants}
            initial="initial"
            animate="enter"
            exit="exit"
          >
            <Card className="bg-gradient-to-br from-patriotBlue/10 via-patriotRed/5 to-starGold/10 border-white/20 p-6 rounded-2xl shadow-2xl backdrop-blur-md">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <motion.div
                    className="flex items-center justify-center w-12 h-12 bg-starGold/30 rounded-xl shadow-lg"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: 'spring', stiffness: 400 }}
                  >
                    <Lock className="w-6 h-6 text-starGold" />
                  </motion.div>
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      Lock VMF Tokens
                    </h2>
                    <p className="text-sm text-gray-400">
                      Gain voting power for governance
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Form */}
              <div className="space-y-6">
                {/* Amount Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Token Amount
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={amount}
                      onChange={e => setAmount(e.target.value)}
                      placeholder="Enter VMF amount"
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-starGold/50 focus:border-starGold/50"
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-400">
                      VMF
                    </div>
                  </div>
                </div>

                {/* Duration Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Lock Duration
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {durationOptions.map(option => (
                      <motion.button
                        key={option.days}
                        onClick={() => setDuration(option.days)}
                        className={cn(
                          'p-3 rounded-xl border transition-all duration-200',
                          duration === option.days
                            ? 'border-starGold/50 bg-starGold/20 text-starGold'
                            : 'border-white/20 bg-white/5 text-gray-300 hover:border-white/30 hover:bg-white/10'
                        )}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="text-sm font-medium">
                          {option.label}
                        </div>
                        <div className="text-xs opacity-80">
                          {option.multiplier}x multiplier
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Voting Power Preview */}
                {amount && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-gradient-to-r from-starGold/15 to-yellow-500/15 border border-starGold/30 rounded-xl"
                  >
                    <div className="flex items-center space-x-3">
                      <Zap className="w-5 h-5 text-starGold" />
                      <div>
                        <div className="text-sm text-gray-300">
                          Estimated Voting Power
                        </div>
                        <div className="text-lg font-bold text-starGold">
                          {votingPower.toLocaleString(undefined, {
                            maximumFractionDigits: 2,
                          })}{' '}
                          VMF
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Important Info */}
                <div className="p-4 bg-blue-500/15 border border-blue-500/30 rounded-xl">
                  <div className="flex items-start space-x-3">
                    <Info className="w-5 h-5 text-blue-400 mt-0.5" />
                    <div className="text-sm text-blue-300">
                      <div className="font-medium mb-1">
                        Important Information:
                      </div>
                      <ul className="space-y-1 text-xs">
                        <li>
                          • 3-day warmup period before voting power becomes
                          active
                        </li>
                        <li>• Tokens are locked for the selected duration</li>
                        <li>
                          • Voting power increases with longer lock periods
                        </li>
                        <li>
                          • You can create multiple locks with different
                          durations
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Warning */}
                <div className="p-4 bg-yellow-500/15 border border-yellow-500/30 rounded-xl">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5" />
                    <div className="text-sm text-yellow-300">
                      <div className="font-medium mb-1">Warning:</div>
                      <p className="text-xs">
                        Locked tokens cannot be withdrawn until the lock period
                        expires. Make sure you understand the commitment before
                        proceeding.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3 pt-2">
                  <Button
                    variant="outline"
                    onClick={onClose}
                    className="flex-1 border-white/20 text-gray-300 hover:bg-white/10"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={
                      !amount || parseFloat(amount) <= 0 || isSubmitting
                    }
                    className="flex-1 bg-gradient-to-r from-starGold to-yellow-500 hover:from-starGold/80 hover:to-yellow-500/80 text-black font-semibold"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                        <span>Locking...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <Lock className="w-4 h-4" />
                        <span>Lock Tokens</span>
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

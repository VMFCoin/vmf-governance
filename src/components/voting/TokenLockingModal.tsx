'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Lock,
  Zap,
  Info,
  ArrowRight,
  AlertTriangle,
  CheckCircle,
  Clock,
} from 'lucide-react';
import { Button, Card } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import { useTokenLockStore } from '@/stores/useTokenLockStore';
import { useWalletSync } from '@/hooks/useWalletSync';
import { realEscrowService } from '@/services/realEscrowService';
import { realTokenService } from '@/services/realTokenService';
import { DEPLOYED_CONTRACTS } from '@/contracts/addresses';
import { config } from '@/lib/wagmi';
import { getAccount } from '@wagmi/core';
import { cn } from '@/lib/utils';
import { fadeInVariants, slideUpVariants } from '@/lib/animations';

interface TokenLockingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLockCreated?: () => void;
}

type LockingStep = 'input' | 'approve' | 'lock' | 'success';

export function TokenLockingModal({
  isOpen,
  onClose,
  onLockCreated,
}: TokenLockingModalProps) {
  const [amount, setAmount] = useState('');
  const [currentStep, setCurrentStep] = useState<LockingStep>('input');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userBalance, setUserBalance] = useState<bigint>(BigInt(0));
  const [currentAllowance, setCurrentAllowance] = useState<bigint>(BigInt(0));
  const [approvalTxHash, setApprovalTxHash] = useState<string>('');
  const [lockTxHash, setLockTxHash] = useState<string>('');

  const { address } = useWalletSync();
  const { showSuccess, showError } = useToast();
  const { refreshUserData } = useTokenLockStore();

  const account = getAccount(config);

  const escrowAddress = DEPLOYED_CONTRACTS.VOTING_ESCROW;

  // Calculate initial voting power (1:1 ratio, increases over time via quadratic curve)
  const calculateInitialVotingPower = (tokenAmount: string): number => {
    const tokens = parseFloat(tokenAmount) || 0;
    return tokens; // Initial voting power is 1:1, increases over time automatically
  };

  // Load user balance and allowance when modal opens
  useEffect(() => {
    if (isOpen && account?.address) {
      loadUserData();
    }
  }, [isOpen, account?.address]);

  const loadUserData = async () => {
    if (!account.address) return;

    try {
      const [balance, allowance] = await Promise.all([
        realTokenService.getBalance(account?.address),
        realTokenService.getAllowance(account?.address, escrowAddress),
      ]);
      setUserBalance(balance);
      setCurrentAllowance(allowance);
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const handleSubmit = async () => {
    if (!account?.address) {
      showError('Wallet Not Connected', 'Please connect your wallet first.');
      return;
    }

    const tokenAmount = parseFloat(amount);
    if (!tokenAmount || tokenAmount <= 0) {
      showError('Invalid Amount', 'Please enter a valid token amount.');
      return;
    }

    const amountWei = BigInt(Math.floor(tokenAmount * 1e18));

    // Check if user has sufficient balance
    if (amountWei > userBalance) {
      showError(
        'Insufficient Balance',
        `You need ${tokenAmount} VMF tokens but only have ${(
          Number(userBalance) / 1e18
        ).toFixed(2)} VMF.`
      );
      return;
    }

    setIsSubmitting(true);

    try {
      // Step 1: Check if approval is needed
      if (currentAllowance < amountWei) {
        await handleApproval(amountWei);
      } else {
        // Skip approval step if sufficient allowance exists
        setCurrentStep('lock');
        await handleLocking(amountWei);
      }
    } catch (error) {
      console.error('Error in token locking process:', error);
      setCurrentStep('input');
      showError(
        'Transaction Failed',
        error instanceof Error
          ? error.message
          : 'There was an error processing your transaction. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApproval = async (amountWei: bigint) => {
    setCurrentStep('approve');

    try {
      // Request approval for the exact amount (or max for better UX)
      const approvalAmount = amountWei; // Could use type(uint256).max for unlimited approval
      const txHash = await realTokenService.approve(
        escrowAddress,
        approvalAmount
      );
      setApprovalTxHash(txHash);

      // Wait for approval transaction to be confirmed
      await realTokenService.waitForTransaction(txHash);

      // Update allowance after approval
      const newAllowance = await realTokenService.getAllowance(
        account?.address!,
        escrowAddress
      );
      setCurrentAllowance(newAllowance);

      // Proceed to locking step
      setCurrentStep('lock');
      await handleLocking(amountWei);
    } catch (error) {
      throw new Error(
        `Approval failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  };

  const handleLocking = async (amountWei: bigint) => {
    try {
      // Create the lock
      const txHash = await realEscrowService.createLock(amountWei);
      setLockTxHash(txHash);

      // Wait for lock transaction to be confirmed
      // Note: realEscrowService.createLock already waits for confirmation

      setCurrentStep('success');

      showSuccess(
        'Tokens Locked Successfully!',
        `${amount} VMF tokens locked. Voting power starts at 1x and increases over time via the quadratic curve. There's a 3-day warmup period before voting power becomes active.`
      );

      // Refresh user data to show the new lock
      await refreshUserData(account?.address!);

      // Auto-close modal after success
      setTimeout(() => {
        handleClose();
      }, 3000);

      // Call the callback if provided
      if (onLockCreated) {
        onLockCreated();
      }
    } catch (error) {
      throw new Error(
        `Locking failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  };

  const handleClose = () => {
    onClose();
    // Reset modal state
    setTimeout(() => {
      setAmount('');
      setCurrentStep('input');
      setApprovalTxHash('');
      setLockTxHash('');
      setIsSubmitting(false);
    }, 300);
  };

  const initialVotingPower = calculateInitialVotingPower(amount);
  const tokenAmount = parseFloat(amount) || 0;
  const amountWei = BigInt(Math.floor(tokenAmount * 1e18));
  const needsApproval = currentAllowance < amountWei;
  const hasInsufficientBalance = amountWei > userBalance;

  const getStepContent = () => {
    switch (currentStep) {
      case 'input':
        return (
          <>
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
                  disabled={isSubmitting}
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-400">
                  VMF
                </div>
              </div>
              {userBalance > 0 && (
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>
                    Balance: {(Number(userBalance) / 1e18).toFixed(2)} VMF
                  </span>
                  {needsApproval && tokenAmount > 0 && (
                    <span className="text-yellow-400">Approval required</span>
                  )}
                </div>
              )}
              {hasInsufficientBalance && (
                <div className="text-red-400 text-xs mt-1">
                  Insufficient balance
                </div>
              )}
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
                      Initial Voting Power
                    </div>
                    <div className="text-lg font-bold text-starGold">
                      {initialVotingPower.toLocaleString(undefined, {
                        maximumFractionDigits: 2,
                      })}{' '}
                      VMF
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      Increases over time via quadratic curve (up to 2x after 2
                      years)
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </>
        );

      case 'approve':
        return (
          <div className="text-center py-8">
            <motion.div
              className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4"
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            >
              <CheckCircle className="w-8 h-8 text-blue-400" />
            </motion.div>
            <h3 className="text-lg font-semibold text-white mb-2">
              Approving Token Spending
            </h3>
            <p className="text-gray-400 mb-4">
              Please confirm the approval transaction in your wallet to allow
              the escrow contract to spend your VMF tokens.
            </p>
            {approvalTxHash && (
              <div className="text-xs text-gray-500">
                Transaction: {approvalTxHash.slice(0, 10)}...
                {approvalTxHash.slice(-8)}
              </div>
            )}
          </div>
        );

      case 'lock':
        return (
          <div className="text-center py-8">
            <motion.div
              className="w-16 h-16 bg-starGold/20 rounded-full flex items-center justify-center mx-auto mb-4"
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            >
              <Lock className="w-8 h-8 text-starGold" />
            </motion.div>
            <h3 className="text-lg font-semibold text-white mb-2">
              Locking Tokens
            </h3>
            <p className="text-gray-400 mb-4">
              Please confirm the locking transaction in your wallet to create
              your veVMF position.
            </p>
            {lockTxHash && (
              <div className="text-xs text-gray-500">
                Transaction: {lockTxHash.slice(0, 10)}...{lockTxHash.slice(-8)}
              </div>
            )}
          </div>
        );

      case 'success':
        return (
          <div className="text-center py-8">
            <motion.div
              className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <CheckCircle className="w-8 h-8 text-green-400" />
            </motion.div>
            <h3 className="text-lg font-semibold text-white mb-2">
              Tokens Locked Successfully!
            </h3>
            <p className="text-gray-400 mb-4">
              Your {amount} VMF tokens have been locked. Your voting power will
              be active after the 3-day warmup period.
            </p>
            <div className="text-sm text-starGold">
              Initial Voting Power: {initialVotingPower.toLocaleString()} VMF
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const getActionButtons = () => {
    switch (currentStep) {
      case 'input':
        return (
          <div className="flex space-x-3 pt-2">
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1 border-white/20 text-gray-300 hover:bg-white/10"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={
                !amount ||
                parseFloat(amount) <= 0 ||
                isSubmitting ||
                hasInsufficientBalance
              }
              className="flex-1 bg-gradient-to-r from-starGold to-yellow-500 hover:from-starGold/80 hover:to-yellow-500/80 text-black font-semibold"
            >
              {isSubmitting ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  <span>Processing...</span>
                </div>
              ) : needsApproval && tokenAmount > 0 ? (
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4" />
                  <span>Approve & Lock</span>
                  <ArrowRight className="w-4 h-4" />
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
        );

      case 'approve':
      case 'lock':
        return (
          <div className="flex justify-center pt-2">
            <Button
              variant="outline"
              onClick={handleClose}
              className="border-white/20 text-gray-300 hover:bg-white/10"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </div>
        );

      case 'success':
        return (
          <div className="flex justify-center pt-2">
            <Button
              onClick={handleClose}
              className="bg-gradient-to-r from-starGold to-yellow-500 hover:from-starGold/80 hover:to-yellow-500/80 text-black font-semibold"
            >
              Close
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

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
            onClick={currentStep === 'input' ? handleClose : undefined}
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
                      {currentStep === 'success'
                        ? 'Success!'
                        : 'Lock VMF Tokens'}
                    </h2>
                    <p className="text-sm text-gray-400">
                      {currentStep === 'approve' &&
                        'Step 1: Approve token spending'}
                      {currentStep === 'lock' && 'Step 2: Lock your tokens'}
                      {(currentStep === 'input' || currentStep === 'success') &&
                        'Gain voting power for governance'}
                    </p>
                  </div>
                </div>
                {currentStep === 'input' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClose}
                    className="text-gray-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                )}
              </div>

              {/* Form Content */}
              <div className="space-y-6">
                {getStepContent()}

                {/* Info sections - only show on input step */}
                {currentStep === 'input' && (
                  <>
                    {/* Lock Duration Info */}
                    <div className="p-4 bg-blue-500/15 border border-blue-500/30 rounded-xl">
                      <div className="flex items-start space-x-3">
                        <Info className="w-5 h-5 text-blue-400 mt-0.5" />
                        <div className="text-sm text-blue-300">
                          <div className="font-medium mb-1">
                            How VMF Token Locking Works:
                          </div>
                          <ul className="space-y-1 text-xs">
                            <li>
                              • Voting power starts at 1x your locked amount
                            </li>
                            <li>
                              • Increases automatically over time via quadratic
                              curve
                            </li>
                            <li>
                              • Reaches maximum 2x voting power after 2 years
                            </li>
                            <li>
                              • 3-day warmup period before voting power becomes
                              active
                            </li>
                            <li>
                              • Lock duration is managed by the protocol's epoch
                              system
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
                            Locked tokens follow the protocol's epoch-based
                            withdrawal system. You'll need to queue an exit and
                            wait for the cooldown period before withdrawing.
                            Make sure you understand the commitment before
                            proceeding.
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Action Buttons */}
                {getActionButtons()}
              </div>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

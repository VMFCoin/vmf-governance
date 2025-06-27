'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sliders,
  Target,
  Zap,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  Heart,
  DollarSign,
  Loader2,
  RotateCcw,
  Lightbulb,
  Info,
  ArrowRight,
} from 'lucide-react';
import { Button, Card } from '@/components/ui';
import { SimpleTooltip } from '@/components/ui/AnimatedTooltip';
import { useToast } from '@/components/ui/Toast';
import { useCharityStore } from '@/stores/useCharityStore';
import { useTokenLockStore } from '@/stores/useTokenLockStore';
import {
  holidayCharityGaugeService,
  CharityVoteAllocation as CharityAllocation,
  HolidayGaugeVoteParams,
} from '@/services/holidayCharityGaugeService';
import {
  deployedGaugeService,
  CharityGaugeMapping,
} from '@/services/deployedGaugeService';
import { Charity } from '@/types';
import { cn, formatVMFSafe, formatNumberSafe } from '@/lib/utils';
import { fadeInVariants } from '@/lib/animations';
import { Address } from 'viem';

interface CharityVoteAllocationProps {
  charityMappings: CharityGaugeMapping[];
  tokenId: number;
  totalVotingPower: bigint;
  onVoteSubmitted?: (result: {
    success: boolean;
    transactionHash?: string;
  }) => void;
  onAllocationChange?: (allocations: CharityAllocation[]) => void;
  className?: string;
}

interface AllocationState {
  charityId: string;
  charityName: string;
  gaugeAddress: Address;
  weight: number; // 0-10000 (basis points)
  percentage: number; // 0-100 for display
}

export function CharityVoteAllocation({
  charityMappings,
  tokenId,
  totalVotingPower,
  onVoteSubmitted,
  onAllocationChange,
  className,
}: CharityVoteAllocationProps) {
  const [allocations, setAllocations] = useState<AllocationState[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [showOptimizations, setShowOptimizations] = useState(false);
  const [isAutoOptimizing, setIsAutoOptimizing] = useState(false);

  const { showSuccess, showError, showInfo } = useToast();
  const getCharityById = useCharityStore(state => state.getCharityById);

  // Initialize allocations from charity mappings
  useEffect(() => {
    if (charityMappings.length > 0 && allocations.length === 0) {
      const initialAllocations: AllocationState[] = charityMappings.map(
        mapping => ({
          charityId: mapping.charityId,
          charityName: mapping.charityName,
          gaugeAddress: mapping.gaugeAddress,
          weight: 0,
          percentage: 0,
        })
      );
      setAllocations(initialAllocations);
    }
  }, [charityMappings, allocations.length]);

  // Calculate total allocation percentage
  const totalPercentage = useMemo(() => {
    return allocations.reduce(
      (sum, allocation) => sum + allocation.percentage,
      0
    );
  }, [allocations]);

  // Calculate total weight (basis points)
  const totalWeight = useMemo(() => {
    return allocations.reduce((sum, allocation) => sum + allocation.weight, 0);
  }, [allocations]);

  // Validate allocations
  const validation = useMemo(() => {
    const errors: string[] = [];

    if (totalWeight > 10000) {
      errors.push('Total allocation cannot exceed 100%');
    }

    if (totalWeight === 0) {
      errors.push('At least one charity must receive votes');
    }

    const hasNegative = allocations.some(alloc => alloc.weight < 0);
    if (hasNegative) {
      errors.push('Allocation percentages cannot be negative');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }, [allocations, totalWeight]);

  // Update validation errors
  useEffect(() => {
    setValidationErrors(validation.errors);
  }, [validation.errors]);

  // Handle allocation change
  const handleAllocationChange = useCallback(
    (charityId: string, percentage: number) => {
      const weight = Math.round(percentage * 100); // Convert percentage to basis points

      setAllocations(prev =>
        prev.map(allocation =>
          allocation.charityId === charityId
            ? { ...allocation, percentage, weight }
            : allocation
        )
      );
    },
    []
  );

  // Handle slider change
  const handleSliderChange = useCallback(
    (charityId: string, value: number) => {
      handleAllocationChange(charityId, value);
    },
    [handleAllocationChange]
  );

  // Reset all allocations
  const handleReset = useCallback(() => {
    setAllocations(prev =>
      prev.map(allocation => ({
        ...allocation,
        weight: 0,
        percentage: 0,
      }))
    );
  }, []);

  // Equal distribution
  const handleEqualDistribution = useCallback(() => {
    const equalPercentage = 100 / allocations.length;
    setAllocations(prev =>
      prev.map(allocation => ({
        ...allocation,
        percentage: equalPercentage,
        weight: Math.round(equalPercentage * 100),
      }))
    );
  }, [allocations.length]);

  // Auto-optimize based on charity performance metrics
  const handleAutoOptimize = useCallback(async () => {
    setIsAutoOptimizing(true);
    try {
      // Get charity performance data and optimize allocation
      const optimizedAllocations = allocations.map(allocation => {
        const charity = getCharityById(allocation.charityId);
        if (!charity) return allocation;

        // Simple optimization based on impact metrics
        const impactScore = charity.impactMetrics.veteransServed / 1000;
        const efficiencyScore = 0.8; // Default efficiency score
        const score = (impactScore * efficiencyScore) / 10;

        return {
          ...allocation,
          percentage: Math.min(Math.max(score * 20, 5), 40), // 5-40% range
          weight: Math.round(Math.min(Math.max(score * 20, 5), 40) * 100),
        };
      });

      // Normalize to 100%
      const totalOptimized = optimizedAllocations.reduce(
        (sum, alloc) => sum + alloc.percentage,
        0
      );
      const normalizedAllocations = optimizedAllocations.map(allocation => ({
        ...allocation,
        percentage: (allocation.percentage / totalOptimized) * 100,
        weight: Math.round((allocation.percentage / totalOptimized) * 10000),
      }));

      setAllocations(normalizedAllocations);
      showInfo(
        'Optimization Complete',
        'Allocations optimized based on charity impact metrics'
      );
    } catch (error) {
      console.error('Error optimizing allocations:', error);
      showError('Optimization Failed', 'Failed to optimize allocations');
    } finally {
      setIsAutoOptimizing(false);
    }
  }, [allocations, getCharityById, showInfo, showError]);

  // Submit vote allocations
  const handleSubmitVote = useCallback(async () => {
    if (!validation.isValid) {
      showError('Invalid Allocation', validation.errors.join(', '));
      return;
    }

    setIsSubmitting(true);
    try {
      const voteAllocations: CharityAllocation[] = allocations
        .filter(allocation => allocation.weight > 0)
        .map(allocation => ({
          charityId: allocation.charityId,
          charityName: allocation.charityName,
          gaugeAddress: allocation.gaugeAddress,
          weight: allocation.weight,
        }));

      const params: HolidayGaugeVoteParams = {
        tokenId,
        allocations: voteAllocations,
      };

      const result =
        await holidayCharityGaugeService.submitHolidayCharityVote(params);

      if (result.success) {
        showSuccess(
          'Vote Submitted',
          'Your charity vote allocation has been submitted successfully'
        );
        onVoteSubmitted?.(result);
      } else {
        throw new Error(result.error || 'Vote submission failed');
      }
    } catch (error) {
      console.error('Error submitting vote:', error);
      showError(
        'Vote Failed',
        error instanceof Error ? error.message : 'Failed to submit vote'
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [
    validation,
    allocations,
    tokenId,
    showSuccess,
    showError,
    onVoteSubmitted,
  ]);

  // Notify parent of allocation changes
  useEffect(() => {
    if (onAllocationChange) {
      const charityAllocations: CharityAllocation[] = allocations.map(
        allocation => ({
          charityId: allocation.charityId,
          charityName: allocation.charityName,
          gaugeAddress: allocation.gaugeAddress,
          weight: allocation.weight,
        })
      );
      onAllocationChange(charityAllocations);
    }
  }, [allocations, onAllocationChange]);

  // Format voting power for display
  const formatVotingPower = (power: bigint): string => {
    const powerNumber = Number(power) / 1e18;
    if (powerNumber === 0) return '0';
    if (powerNumber < 1) return powerNumber.toFixed(4);
    return formatNumberSafe(powerNumber, { maximumFractionDigits: 2 });
  };

  if (allocations.length === 0) {
    return (
      <Card className="p-6 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-400" />
        <p className="text-slate-400">Loading charity allocations...</p>
      </Card>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg flex items-center justify-center border border-blue-500/30">
            <Sliders className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">
              Advanced Vote Allocation
            </h3>
            <p className="text-sm text-slate-400">
              Distribute your {formatVotingPower(totalVotingPower)} voting power
              across charities
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowOptimizations(!showOptimizations)}
            className="border-slate-600 text-slate-300 hover:border-blue-400 hover:text-blue-400"
          >
            <Lightbulb className="w-4 h-4 mr-1" />
            {showOptimizations ? 'Hide' : 'Show'} Tips
          </Button>
        </div>
      </div>

      {/* Optimization Tips */}
      <AnimatePresence>
        {showOptimizations && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="p-4 border-yellow-500/30 bg-yellow-500/5">
              <div className="flex items-start space-x-3">
                <Info className="w-5 h-5 text-yellow-400 mt-0.5" />
                <div className="space-y-2">
                  <h4 className="font-semibold text-yellow-400">
                    Optimization Tips
                  </h4>
                  <ul className="text-sm text-slate-300 space-y-1">
                    <li>
                      • Consider charity impact metrics and efficiency ratings
                    </li>
                    <li>• Diversify across different charity categories</li>
                    <li>• Review charity transparency and veteran focus</li>
                    <li>• Use auto-optimize for data-driven allocation</li>
                  </ul>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Allocation Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Button
            size="sm"
            variant="outline"
            onClick={handleReset}
            disabled={isSubmitting || totalWeight === 0}
            className="border-slate-600 text-slate-300 hover:border-red-400 hover:text-red-400"
          >
            <RotateCcw className="w-4 h-4 mr-1" />
            Reset
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleEqualDistribution}
            disabled={isSubmitting}
            className="border-slate-600 text-slate-300 hover:border-green-400 hover:text-green-400"
          >
            <Target className="w-4 h-4 mr-1" />
            Equal Split
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleAutoOptimize}
            disabled={isSubmitting || isAutoOptimizing}
            className="border-slate-600 text-slate-300 hover:border-purple-400 hover:text-purple-400"
          >
            {isAutoOptimizing ? (
              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
            ) : (
              <Zap className="w-4 h-4 mr-1" />
            )}
            Auto-Optimize
          </Button>
        </div>

        {/* Total Allocation Display */}
        <div className="text-right">
          <div
            className={cn(
              'text-lg font-bold',
              totalPercentage > 100
                ? 'text-red-400'
                : totalPercentage === 100
                  ? 'text-green-400'
                  : 'text-yellow-400'
            )}
          >
            {totalPercentage.toFixed(1)}%
          </div>
          <div className="text-xs text-slate-400">Total Allocated</div>
        </div>
      </div>

      {/* Charity Allocation Sliders */}
      <div className="space-y-4">
        {allocations.map((allocation, index) => {
          const charity = getCharityById(allocation.charityId);
          if (!charity) return null;

          return (
            <motion.div
              key={allocation.charityId}
              variants={fadeInVariants}
              initial="initial"
              animate="enter"
              transition={{ delay: index * 0.1 }}
            >
              <Card className="p-4 border-slate-700/50 bg-slate-800/50 hover:border-slate-600/50 transition-colors">
                <div className="space-y-4">
                  {/* Charity Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-slate-700/50 rounded-lg flex items-center justify-center border border-slate-600/30">
                        {charity.logo ? (
                          <img
                            src={charity.logo}
                            alt={charity.name}
                            className="w-5 h-5 rounded object-cover"
                          />
                        ) : (
                          <Heart className="w-4 h-4 text-red-400" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-semibold text-white">
                          {charity.name}
                        </h4>
                        <p className="text-xs text-slate-400">
                          {charity.impactMetrics.veteransServed.toLocaleString()}{' '}
                          veterans served
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-lg font-bold text-white">
                        {allocation.percentage.toFixed(1)}%
                      </div>
                      <div className="text-xs text-slate-400">
                        {(
                          Number(totalVotingPower * BigInt(allocation.weight)) /
                          10000 /
                          1e18
                        ).toFixed(2)}{' '}
                        votes
                      </div>
                    </div>
                  </div>

                  {/* Allocation Slider */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">Allocation</span>
                      <span className="text-slate-300">
                        {allocation.weight} basis points
                      </span>
                    </div>

                    <div className="relative">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="0.1"
                        value={allocation.percentage}
                        onChange={e =>
                          handleSliderChange(
                            allocation.charityId,
                            parseFloat(e.target.value)
                          )
                        }
                        disabled={isSubmitting}
                        className={cn(
                          'w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer',
                          'slider-thumb:appearance-none slider-thumb:w-4 slider-thumb:h-4 slider-thumb:rounded-full slider-thumb:bg-blue-500 slider-thumb:cursor-pointer',
                          'focus:outline-none focus:ring-2 focus:ring-blue-500/50',
                          isSubmitting && 'opacity-50 cursor-not-allowed'
                        )}
                        style={{
                          background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${allocation.percentage}%, #374151 ${allocation.percentage}%, #374151 100%)`,
                        }}
                      />
                    </div>

                    {/* Quick Percentage Buttons */}
                    <div className="flex items-center space-x-1">
                      {[5, 10, 25, 50].map(percent => (
                        <button
                          key={percent}
                          onClick={() =>
                            handleAllocationChange(
                              allocation.charityId,
                              percent
                            )
                          }
                          disabled={isSubmitting}
                          className={cn(
                            'px-2 py-1 text-xs rounded border transition-colors',
                            'border-slate-600 text-slate-400 hover:border-blue-400 hover:text-blue-400',
                            allocation.percentage === percent &&
                              'border-blue-400 text-blue-400 bg-blue-500/10',
                            isSubmitting && 'opacity-50 cursor-not-allowed'
                          )}
                        >
                          {percent}%
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Validation Errors */}
      <AnimatePresence>
        {validationErrors.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Card className="p-4 border-red-500/30 bg-red-500/5">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-red-400 mb-2">
                    Validation Errors
                  </h4>
                  <ul className="text-sm text-red-300 space-y-1">
                    {validationErrors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Submit Button */}
      <div className="flex justify-center">
        <Button
          onClick={handleSubmitVote}
          disabled={!validation.isValid || isSubmitting || totalWeight === 0}
          className={cn(
            'px-8 py-3 text-lg font-semibold rounded-xl transition-all duration-300',
            validation.isValid && totalWeight > 0
              ? 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-lg hover:shadow-xl'
              : 'bg-slate-700 text-slate-400 cursor-not-allowed'
          )}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Submitting Vote...
            </>
          ) : (
            <>
              <CheckCircle className="w-5 h-5 mr-2" />
              Submit Vote Allocation
              <ArrowRight className="w-5 h-5 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

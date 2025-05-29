'use client';

import { useState, useCallback } from 'react';

export type ConfettiType = 'standard' | 'burst' | 'fireworks';

interface ConfettiConfig {
  type?: ConfettiType;
  duration?: number;
  particleCount?: number;
  colors?: string[];
  origin?: { x: number; y: number };
  burstCount?: number;
}

interface ConfettiState {
  isActive: boolean;
  type: ConfettiType;
  config: ConfettiConfig;
}

export function useConfetti() {
  const [confettiState, setConfettiState] = useState<ConfettiState>({
    isActive: false,
    type: 'standard',
    config: {},
  });

  const triggerConfetti = useCallback((config: ConfettiConfig = {}) => {
    const {
      type = 'standard',
      duration = 3000,
      particleCount = 50,
      colors,
      origin,
      burstCount = 5,
    } = config;

    setConfettiState({
      isActive: true,
      type,
      config: {
        type,
        duration,
        particleCount,
        colors,
        origin,
        burstCount,
      },
    });
  }, []);

  const stopConfetti = useCallback(() => {
    setConfettiState(prev => ({
      ...prev,
      isActive: false,
    }));
  }, []);

  const triggerVoteSuccess = useCallback(() => {
    triggerConfetti({
      type: 'fireworks',
      duration: 4000,
      burstCount: 3,
      colors: ['#dc2626', '#ffffff', '#1e3a8a', '#fbbf24'],
    });
  }, [triggerConfetti]);

  const triggerProposalPassed = useCallback(() => {
    triggerConfetti({
      type: 'fireworks',
      duration: 5000,
      burstCount: 5,
      colors: ['#10b981', '#ffffff', '#fbbf24', '#dc2626'],
    });
  }, [triggerConfetti]);

  const triggerCelebration = useCallback(() => {
    triggerConfetti({
      type: 'standard',
      duration: 3000,
      particleCount: 100,
      colors: ['#dc2626', '#ffffff', '#1e3a8a', '#fbbf24', '#10b981'],
    });
  }, [triggerConfetti]);

  const triggerBurst = useCallback(
    (origin?: { x: number; y: number }) => {
      triggerConfetti({
        type: 'burst',
        particleCount: 30,
        origin,
        colors: ['#dc2626', '#ffffff', '#1e3a8a'],
      });
    },
    [triggerConfetti]
  );

  return {
    confettiState,
    triggerConfetti,
    stopConfetti,
    triggerVoteSuccess,
    triggerProposalPassed,
    triggerCelebration,
    triggerBurst,
  };
}

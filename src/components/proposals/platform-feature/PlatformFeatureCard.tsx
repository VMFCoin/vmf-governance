'use client';

import React from 'react';
import { BinaryVotingCard } from '../shared/BinaryVotingCard';
import { PlatformFeatureContent } from './PlatformFeatureContent';
import { PlatformFeatureProposal } from '@/types';

interface PlatformFeatureCardProps {
  proposal: PlatformFeatureProposal;
  className?: string;
}

export const PlatformFeatureCard: React.FC<PlatformFeatureCardProps> = ({
  proposal,
  className,
}) => {
  return (
    <BinaryVotingCard
      proposal={proposal}
      typeSpecificContent={<PlatformFeatureContent proposal={proposal} />}
      className={className}
    />
  );
};

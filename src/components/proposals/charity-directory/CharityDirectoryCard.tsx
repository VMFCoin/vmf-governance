'use client';

import React from 'react';
import { BinaryVotingCard } from '../shared/BinaryVotingCard';
import { CharityDirectoryContent } from './CharityDirectoryContent';
import { CharityDirectoryProposal } from '@/types';

interface CharityDirectoryCardProps {
  proposal: CharityDirectoryProposal;
  className?: string;
}

export const CharityDirectoryCard: React.FC<CharityDirectoryCardProps> = ({
  proposal,
  className,
}) => {
  return (
    <BinaryVotingCard
      proposal={proposal}
      typeSpecificContent={<CharityDirectoryContent proposal={proposal} />}
      className={className}
    />
  );
};

'use client';

import React from 'react';
import { Shield, ExternalLink, AlertCircle, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { CharityDirectoryProposal } from '@/types';
import { fadeInVariants } from '@/lib/animations';

interface CharityDirectoryContentProps {
  proposal: CharityDirectoryProposal;
}

export const CharityDirectoryContent: React.FC<
  CharityDirectoryContentProps
> = ({ proposal }) => {
  const getVerificationStatus = () => {
    if (
      proposal.verificationDocuments &&
      proposal.verificationDocuments.length > 0
    ) {
      return {
        icon: <CheckCircle className="w-4 h-4 text-green-500" />,
        text: 'Documents Provided',
        color: 'text-green-500',
        bgColor: 'bg-green-500/10 border-green-500/30',
      };
    }
    return {
      icon: <AlertCircle className="w-4 h-4 text-yellow-500" />,
      text: 'Pending Documentation',
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10 border-yellow-500/30',
    };
  };

  const verificationStatus = getVerificationStatus();

  return (
    <motion.div
      className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-4"
      variants={fadeInVariants}
      initial="initial"
      animate="enter"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-semibold text-blue-400 text-lg">
            {proposal.charityData.name}
          </h4>
          <p className="text-sm text-textSecondary capitalize">
            {proposal.charityData.category.replace('_', ' ')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-400" />
          <span className="text-xs font-medium text-blue-400">
            EIN: {proposal.charityData.ein}
          </span>
        </div>
      </div>

      <p className="text-sm text-textBase mb-3 line-clamp-2">
        {proposal.charityData.description}
      </p>

      <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-2 xs:gap-4">
        {proposal.charityData.website && (
          <div className="flex items-center text-xs text-blue-400 min-w-0 flex-1">
            <ExternalLink className="w-3 h-3 mr-1 flex-shrink-0" />
            <span className="truncate">{proposal.charityData.website}</span>
          </div>
        )}

        <div
          className={`flex items-center gap-1 px-2 py-1 rounded-full border text-xs flex-shrink-0 ${verificationStatus.bgColor} ${verificationStatus.color}`}
        >
          {verificationStatus.icon}
          <span className="whitespace-nowrap">{verificationStatus.text}</span>
        </div>
      </div>
    </motion.div>
  );
};

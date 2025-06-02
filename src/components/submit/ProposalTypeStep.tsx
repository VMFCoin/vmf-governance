'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui';
import { cn } from '@/lib/utils';
import {
  proposalTypeContainerVariants,
  proposalTypeCardVariants,
} from '@/lib/animations';

interface ProposalType {
  value: string;
  label: string;
  description: string;
}

interface ProposalTypeStepProps {
  selectedType: string;
  onTypeChange: (type: string) => void;
  isMobile?: boolean;
  isSmallMobile?: boolean;
}

const PROPOSAL_TYPES: ProposalType[] = [
  {
    value: 'charity_directory',
    label: 'Charity Directory Addition',
    description:
      'Propose adding a new charity to the VMF directory for holiday voting',
  },
  {
    value: 'platform_feature',
    label: 'Platform Feature Request',
    description: 'Suggest new features or improvements to the VMF platform',
  },
];

export const ProposalTypeStep: React.FC<ProposalTypeStepProps> = React.memo(
  ({ selectedType, onTypeChange, isMobile = false, isSmallMobile = false }) => {
    return (
      <motion.div
        variants={proposalTypeContainerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-patriotWhite mb-2">
            Choose Proposal Type
          </h2>
          <p className="text-textSecondary">
            Select the type of proposal you'd like to submit
          </p>
        </div>

        <div
          className={cn('grid gap-6', isMobile ? 'grid-cols-1' : 'grid-cols-2')}
        >
          {PROPOSAL_TYPES.map((type, index) => (
            <motion.div
              key={type.value}
              variants={proposalTypeCardVariants}
              custom={index}
              whileHover={!isMobile ? { scale: 1.02 } : {}}
              whileTap={{ scale: 0.98 }}
            >
              <Card
                className={cn(
                  'p-6 cursor-pointer transition-all duration-300 border-2',
                  selectedType === type.value
                    ? 'border-patriotBlue bg-patriotBlue/10'
                    : 'border-patriotBlue/30 hover:border-patriotBlue/60',
                  isMobile && 'touch-manipulation'
                )}
                onClick={() => onTypeChange(type.value)}
              >
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-patriotWhite">
                    {type.label}
                  </h3>
                  <p className="text-textSecondary text-sm leading-relaxed">
                    {type.description}
                  </p>
                  {selectedType === type.value && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex items-center text-patriotBlue text-sm font-medium"
                    >
                      <div className="w-2 h-2 bg-patriotBlue rounded-full mr-2" />
                      Selected
                    </motion.div>
                  )}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>
    );
  }
);

ProposalTypeStep.displayName = 'ProposalTypeStep';

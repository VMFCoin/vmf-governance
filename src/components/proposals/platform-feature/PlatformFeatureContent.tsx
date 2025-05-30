'use client';

import React from 'react';
import { Code, Zap, Target, Lightbulb, Timer, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { PlatformFeatureProposal } from '@/types';
import { fadeInVariants } from '@/lib/animations';

interface PlatformFeatureContentProps {
  proposal: PlatformFeatureProposal;
}

export const PlatformFeatureContent: React.FC<PlatformFeatureContentProps> = ({
  proposal,
}) => {
  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical':
        return <Zap className="w-4 h-4 text-red-500" />;
      case 'high':
        return <Target className="w-4 h-4 text-orange-500" />;
      case 'medium':
        return <Lightbulb className="w-4 h-4 text-yellow-500" />;
      case 'low':
        return <Code className="w-4 h-4 text-blue-500" />;
      default:
        return <Code className="w-4 h-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-500/10 border-red-500/30 text-red-400';
      case 'high':
        return 'bg-orange-500/10 border-orange-500/30 text-orange-400';
      case 'medium':
        return 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400';
      case 'low':
        return 'bg-blue-500/10 border-blue-500/30 text-blue-400';
      default:
        return 'bg-gray-500/10 border-gray-500/30 text-gray-400';
    }
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'high':
        return 'bg-red-500/10 border-red-500/30 text-red-400';
      case 'medium':
        return 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400';
      case 'low':
        return 'bg-green-500/10 border-green-500/30 text-green-400';
      default:
        return 'bg-gray-500/10 border-gray-500/30 text-gray-400';
    }
  };

  return (
    <motion.div
      className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4 mb-4"
      variants={fadeInVariants}
      initial="initial"
      animate="enter"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-semibold text-purple-400 text-lg">
            {proposal.featureSpecification.title}
          </h4>
          <p className="text-sm text-textSecondary">
            {proposal.featureSpecification.description}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {getPriorityIcon(proposal.featureSpecification.priority)}
          <span className="text-xs font-medium text-purple-400 capitalize">
            {proposal.featureSpecification.priority} Priority
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div
          className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs ${getPriorityColor(proposal.featureSpecification.priority)}`}
        >
          {getPriorityIcon(proposal.featureSpecification.priority)}
          <span className="font-medium capitalize">
            {proposal.featureSpecification.priority} Priority
          </span>
        </div>

        <div
          className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs ${getComplexityColor(proposal.implementationComplexity)}`}
        >
          <Code className="w-4 h-4" />
          <span className="font-medium capitalize">
            {proposal.implementationComplexity} Complexity
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center text-purple-400">
          <Timer className="w-3 h-3 mr-1" />
          <span>Timeline: {proposal.estimatedDevelopmentTime}</span>
        </div>

        <div className="flex items-center text-purple-400">
          <Users className="w-3 h-3 mr-1" />
          <span>
            Target: {proposal.featureSpecification.targetUsers.join(', ')}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

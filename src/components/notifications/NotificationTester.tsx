'use client';

import React, { useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Bell,
  TestTube,
  Trophy,
  Clock,
  TrendingUp,
  CheckCircle,
  Calendar,
} from 'lucide-react';
import { Button, Card } from '@/components/ui';
import { useRealTimeNotifications } from '@/hooks/useRealTimeNotifications';
import { VMFNotification } from '@/services/notificationService';
import { fadeInVariants } from '@/lib/animations';

interface NotificationTesterProps {
  className?: string;
}

export const NotificationTester: React.FC<NotificationTesterProps> = ({
  className,
}) => {
  // Memoize the callback to prevent infinite re-renders
  const handleNewNotification = useCallback((notification: VMFNotification) => {
    console.log('New notification received:', notification);
  }, []);

  const {
    sendTestNotification,
    simulateLiveVoteUpdate,
    notifications,
    unreadCount,
    isConnected,
  } = useRealTimeNotifications({
    enableWebSocket: false, // Use polling for testing
    pollingInterval: 3000,
    onNewNotification: handleNewNotification,
  });

  const testScenarios = [
    {
      type: 'holiday_proposal' as VMFNotification['type'],
      label: 'Holiday Proposal',
      icon: <Calendar className="w-4 h-4" />,
      description: 'Test holiday charity proposal notification',
      color: 'text-starGold',
    },
    {
      type: 'voting_reminder' as VMFNotification['type'],
      label: 'Voting Reminder',
      icon: <Clock className="w-4 h-4" />,
      description: 'Test voting deadline reminder',
      color: 'text-patriotRed',
    },
    {
      type: 'proposal_result' as VMFNotification['type'],
      label: 'Proposal Result',
      icon: <CheckCircle className="w-4 h-4" />,
      description: 'Test proposal outcome notification',
      color: 'text-green-400',
    },
    {
      type: 'live_update' as VMFNotification['type'],
      label: 'Live Update',
      icon: <TrendingUp className="w-4 h-4" />,
      description: 'Test real-time voting update',
      color: 'text-patriotBlue',
    },
    {
      type: 'milestone' as VMFNotification['type'],
      label: 'Milestone',
      icon: <Trophy className="w-4 h-4" />,
      description: 'Test milestone achievement',
      color: 'text-starGold',
    },
  ];

  const handleTestNotification = (type: VMFNotification['type']) => {
    sendTestNotification(type);
  };

  const handleLiveVoteTest = (voteType: 'for' | 'against') => {
    simulateLiveVoteUpdate('test-proposal-123', voteType);
  };

  const handleBulkTest = () => {
    // Send multiple notifications with delays
    testScenarios.forEach((scenario, index) => {
      setTimeout(() => {
        sendTestNotification(scenario.type);
      }, index * 1000);
    });
  };

  return (
    <motion.div
      className={className}
      variants={fadeInVariants}
      initial="initial"
      animate="enter"
    >
      <Card className="bg-backgroundDark/50 border-white/10 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <TestTube className="w-6 h-6 text-patriotBlue" />
          <div>
            <h3 className="text-lg font-semibold text-white">
              Notification Testing
            </h3>
            <p className="text-sm text-gray-400">
              Test different notification types and scenarios
            </p>
          </div>
        </div>

        {/* Status Info */}
        <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-white/5 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-patriotBlue">
              {notifications.length}
            </div>
            <div className="text-xs text-gray-400">Total</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-patriotRed">
              {unreadCount}
            </div>
            <div className="text-xs text-gray-400">Unread</div>
          </div>
          <div className="text-center">
            <div
              className={`text-2xl font-bold ${isConnected ? 'text-green-400' : 'text-gray-500'}`}
            >
              {isConnected ? '●' : '○'}
            </div>
            <div className="text-xs text-gray-400">Connection</div>
          </div>
        </div>

        {/* Individual Test Buttons */}
        <div className="space-y-3 mb-6">
          <h4 className="text-sm font-medium text-gray-300 mb-3">
            Individual Tests
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {testScenarios.map(scenario => (
              <Button
                key={scenario.type}
                variant="outline"
                size="sm"
                onClick={() => handleTestNotification(scenario.type)}
                className="flex items-center justify-start space-x-2 p-3 h-auto border-white/20 hover:border-white/40 hover:bg-white/10"
              >
                <span className={scenario.color}>{scenario.icon}</span>
                <div className="text-left">
                  <div className="text-sm font-medium text-white">
                    {scenario.label}
                  </div>
                  <div className="text-xs text-gray-400">
                    {scenario.description}
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </div>

        {/* Live Vote Tests */}
        <div className="space-y-3 mb-6">
          <h4 className="text-sm font-medium text-gray-300 mb-3">
            Live Vote Simulation
          </h4>
          <div className="flex space-x-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleLiveVoteTest('for')}
              className="flex-1 border-green-500/30 hover:border-green-500/50 hover:bg-green-500/10 text-green-400"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Vote FOR
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleLiveVoteTest('against')}
              className="flex-1 border-red-500/30 hover:border-red-500/50 hover:bg-red-500/10 text-red-400"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Vote AGAINST
            </Button>
          </div>
        </div>

        {/* Bulk Test */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-300 mb-3">
            Bulk Testing
          </h4>
          <Button
            variant="outline"
            size="sm"
            onClick={handleBulkTest}
            className="w-full border-patriotBlue/30 hover:border-patriotBlue/50 hover:bg-patriotBlue/10 text-patriotBlue"
          >
            <Bell className="w-4 h-4 mr-2" />
            Send All Test Notifications
          </Button>
        </div>

        {/* Development Note */}
        <div className="mt-6 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <p className="text-xs text-yellow-400">
            <strong>Development Tool:</strong> This component is for testing
            notifications during development. Remove from production builds.
          </p>
        </div>
      </Card>
    </motion.div>
  );
};

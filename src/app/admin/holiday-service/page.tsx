'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Play,
  Square,
  RefreshCw,
  Calendar,
  DollarSign,
  Users,
  CheckCircle,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { Button, Card } from '@/components/ui';
import { Header } from '@/components/layout/Header';
import { holidayProposalService } from '@/services/holidayProposalService';
import { notificationService } from '@/services/notificationService';
import { useHolidayStore } from '@/stores/useHolidayStore';
import { useCharityStore } from '@/stores/useCharityStore';
import { useProposalStore } from '@/stores/useProposalStore';
import { testHolidayService } from '@/scripts/test-holiday-service';

export default function HolidayServiceAdminPage() {
  const [serviceStatus, setServiceStatus] = useState(
    holidayProposalService.getStatus()
  );
  const [notifications, setNotifications] = useState(
    notificationService.getNotifications()
  );
  const [isLoading, setIsLoading] = useState(false);

  const { holidays } = useHolidayStore();
  const { charities, fetchCharities } = useCharityStore();
  const { proposals } = useProposalStore();

  // Refresh status every 5 seconds
  useEffect(() => {
    // Initialize client-side functionality
    notificationService.initializeClient();

    const interval = setInterval(() => {
      setServiceStatus(holidayProposalService.getStatus());
      setNotifications(notificationService.getNotifications());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleStartService = () => {
    holidayProposalService.start();
    setServiceStatus(holidayProposalService.getStatus());
  };

  const handleStopService = () => {
    holidayProposalService.stop();
    setServiceStatus(holidayProposalService.getStatus());
  };

  const handleManualCheck = async () => {
    setIsLoading(true);
    try {
      await holidayProposalService.checkAndGenerateProposals();
      setServiceStatus(holidayProposalService.getStatus());
    } catch (error) {
      console.error('Error during manual check:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateForHoliday = async (holidayId: string) => {
    setIsLoading(true);
    try {
      const success =
        await holidayProposalService.generateProposalForHoliday(holidayId);
      if (success) {
        setServiceStatus(holidayProposalService.getStatus());
      }
    } catch (error) {
      console.error('Error generating proposal:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshCharities = async () => {
    setIsLoading(true);
    try {
      await fetchCharities();
    } catch (error) {
      console.error('Error fetching charities:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunTest = async () => {
    setIsLoading(true);
    try {
      await testHolidayService();
      console.log('✅ Test completed - check console for results');
    } catch (error) {
      console.error('❌ Test failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const verifiedCharities = charities.filter(c => c.verification.is501c3);
  const holidayProposals = proposals.filter(p => p.type === 'holiday_charity');

  return (
    <div className="min-h-screen bg-backgroundDark">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-patriotWhite mb-2">
            🎖️ Holiday Proposal Service Admin
          </h1>
          <p className="text-textSecondary">
            Monitor and control the automated holiday proposal generation system
          </p>
        </div>

        {/* Service Control Panel */}
        <Card className="p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-patriotWhite mb-2">
                Service Status
              </h2>
              <div className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full ${serviceStatus.isRunning ? 'bg-green-500' : 'bg-red-500'}`}
                />
                <span className="text-textSecondary">
                  {serviceStatus.isRunning ? 'Running' : 'Stopped'}
                </span>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={handleStartService}
                disabled={serviceStatus.isRunning || isLoading}
                className="flex items-center gap-2"
              >
                <Play className="w-4 h-4" />
                Start Service
              </Button>
              <Button
                onClick={handleStopService}
                disabled={!serviceStatus.isRunning || isLoading}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Square className="w-4 h-4" />
                Stop Service
              </Button>
              <Button
                onClick={handleManualCheck}
                disabled={isLoading}
                variant="outline"
                className="flex items-center gap-2"
              >
                <RefreshCw
                  className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`}
                />
                Manual Check
              </Button>
              <Button
                onClick={handleRunTest}
                disabled={isLoading}
                variant="outline"
                className="flex items-center gap-2"
              >
                🧪 Run Test
              </Button>
            </div>
          </div>

          {/* System Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-backgroundLight rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-5 h-5 text-patriotBlue" />
                <span className="text-sm text-textSecondary">
                  Total Holidays
                </span>
              </div>
              <div className="text-2xl font-bold text-patriotWhite">
                {holidays.length}
              </div>
            </div>
            <div className="bg-backgroundLight rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-5 h-5 text-patriotGold" />
                <span className="text-sm text-textSecondary">
                  Verified Charities
                </span>
              </div>
              <div className="text-2xl font-bold text-patriotWhite">
                {verifiedCharities.length}
              </div>
            </div>
            <div className="bg-backgroundLight rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-5 h-5 text-patriotGreen" />
                <span className="text-sm text-textSecondary">
                  Holiday Proposals
                </span>
              </div>
              <div className="text-2xl font-bold text-patriotWhite">
                {holidayProposals.length}
              </div>
            </div>
            <div className="bg-backgroundLight rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <RefreshCw className="w-5 h-5 text-patriotRed" />
                <span className="text-sm text-textSecondary">
                  Notifications
                </span>
              </div>
              <div className="text-2xl font-bold text-patriotWhite">
                {notifications.length}
              </div>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Holiday Status */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-patriotWhite">
                Holiday Status
              </h3>
              <Button
                onClick={handleRefreshCharities}
                disabled={isLoading}
                variant="outline"
                size="sm"
              >
                Refresh Data
              </Button>
            </div>

            <div className="space-y-4">
              {serviceStatus.nextHolidays.slice(0, 5).map(item => (
                <motion.div
                  key={item.holiday.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-backgroundLight rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{item.holiday.flagIcon}</span>
                      <span className="font-medium text-patriotWhite">
                        {item.holiday.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.hasProposal ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : item.needsProposal ? (
                        <AlertCircle className="w-4 h-4 text-yellow-500" />
                      ) : (
                        <Clock className="w-4 h-4 text-textSecondary" />
                      )}
                    </div>
                  </div>

                  <div className="text-sm text-textSecondary mb-2">
                    {item.daysUntil > 0
                      ? `${item.daysUntil} days until holiday`
                      : item.daysUntil === 0
                        ? 'Today!'
                        : `${Math.abs(item.daysUntil)} days ago`}
                  </div>

                  <div className="text-sm text-textSecondary mb-3">
                    Fund: ${item.holiday.fundAllocation.toLocaleString()}
                  </div>

                  {item.needsProposal && (
                    <Button
                      onClick={() => handleGenerateForHoliday(item.holiday.id)}
                      disabled={isLoading}
                      size="sm"
                      className="w-full"
                    >
                      Generate Proposal
                    </Button>
                  )}
                </motion.div>
              ))}
            </div>
          </Card>

          {/* Recent Notifications */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-patriotWhite mb-4">
              Recent Notifications
            </h3>

            <div className="space-y-3">
              {notifications.slice(0, 8).map(notification => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-backgroundLight rounded-lg p-3"
                >
                  <div className="flex items-start justify-between mb-1">
                    <span className="font-medium text-patriotWhite text-sm">
                      {notification.title}
                    </span>
                    <span className="text-xs text-textSecondary">
                      {notification.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-sm text-textSecondary">
                    {notification.message}
                  </p>
                </motion.div>
              ))}

              {notifications.length === 0 && (
                <div className="text-center py-8 text-textSecondary">
                  No notifications yet
                </div>
              )}
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}

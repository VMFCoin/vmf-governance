'use client';

import { useState, useEffect, useCallback } from 'react';
import { holidayProposalService } from '@/services/holidayProposalService';

interface HolidayProposalServiceStatus {
  isRunning: boolean;
  nextCheck?: Date;
}

interface UpcomingHoliday {
  holiday: any;
  daysUntil: number;
  needsProposal: boolean;
}

export const useHolidayProposalService = () => {
  const [status, setStatus] = useState<HolidayProposalServiceStatus>({
    isRunning: false,
  });
  const [upcomingHolidays, setUpcomingHolidays] = useState<UpcomingHoliday[]>(
    []
  );
  const [isGenerating, setIsGenerating] = useState(false);

  // Update status and upcoming holidays
  const updateData = useCallback(() => {
    setStatus(holidayProposalService.getStatus());
    setUpcomingHolidays(
      holidayProposalService.getUpcomingHolidaysNeedingProposals()
    );
  }, []);

  // Start the service
  const startService = useCallback(() => {
    holidayProposalService.start();
    updateData();
  }, [updateData]);

  // Stop the service
  const stopService = useCallback(() => {
    holidayProposalService.stop();
    updateData();
  }, [updateData]);

  // Manually generate proposal for a holiday
  const generateProposal = useCallback(
    async (holidayId: string): Promise<boolean> => {
      setIsGenerating(true);
      try {
        const success =
          await holidayProposalService.generateProposalForHoliday(holidayId);
        if (success) {
          updateData(); // Refresh data after successful generation
        }
        return success;
      } catch (error) {
        console.error('Error generating proposal:', error);
        return false;
      } finally {
        setIsGenerating(false);
      }
    },
    [updateData]
  );

  // Check and generate proposals manually
  const checkAndGenerate = useCallback(async () => {
    setIsGenerating(true);
    try {
      await holidayProposalService.checkAndGenerateProposals();
      updateData();
    } catch (error) {
      console.error('Error checking and generating proposals:', error);
    } finally {
      setIsGenerating(false);
    }
  }, [updateData]);

  // Initialize data on mount
  useEffect(() => {
    updateData();

    // Set up interval to update data every minute
    const interval = setInterval(updateData, 60 * 1000);

    return () => clearInterval(interval);
  }, [updateData]);

  return {
    // Status
    status,
    isGenerating,

    // Data
    upcomingHolidays,
    holidaysNeedingProposals: upcomingHolidays.filter(h => h.needsProposal),

    // Actions
    startService,
    stopService,
    generateProposal,
    checkAndGenerate,
    refreshData: updateData,
  };
};

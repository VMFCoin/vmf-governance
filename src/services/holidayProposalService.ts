'use client';

import { useHolidayStore } from '@/stores/useHolidayStore';
import { useProposalStore } from '@/stores/useProposalStore';
import { useCharityStore } from '@/stores/useCharityStore';
import { HolidayCharityProposal, MilitaryHoliday } from '@/types';
import { notificationService } from './notificationService';

export class HolidayProposalService {
  private static instance: HolidayProposalService;
  private checkInterval: NodeJS.Timeout | null = null;
  private isRunning = false;

  private constructor() {}

  public static getInstance(): HolidayProposalService {
    if (!HolidayProposalService.instance) {
      HolidayProposalService.instance = new HolidayProposalService();
    }
    return HolidayProposalService.instance;
  }

  /**
   * Start the automated holiday proposal generation service
   * Checks daily for upcoming holidays that need proposals
   */
  public start(): void {
    if (this.isRunning) {
      console.log('🎖️ Holiday proposal service is already running');
      return;
    }

    this.isRunning = true;
    console.log('🚀 Starting VMF holiday proposal generation service...');

    // Run initial check
    this.checkAndGenerateProposals();

    // Set up interval to check daily (every 24 hours)
    this.checkInterval = setInterval(
      () => {
        this.checkAndGenerateProposals();
      },
      24 * 60 * 60 * 1000 // 24 hours
    );

    console.log('⏰ Service will check daily for upcoming holidays');
  }

  /**
   * Stop the automated holiday proposal generation service
   */
  public stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    this.isRunning = false;
    console.log('🛑 Holiday proposal generation service stopped');
  }

  /**
   * Check for upcoming holidays and generate proposals if needed
   * Generates proposals exactly 14 days before each holiday
   */
  public async checkAndGenerateProposals(): Promise<void> {
    try {
      console.log('🔍 Checking for VMF holidays needing charity proposals...');

      const holidayStore = useHolidayStore.getState();
      const proposalStore = useProposalStore.getState();
      const charityStore = useCharityStore.getState();

      // Ensure we have fresh charity data from Supabase
      if (charityStore.charities.length === 0) {
        console.log('📊 Fetching fresh charity data from Supabase...');
        await charityStore.fetchCharities();
      }

      const now = new Date();

      // Check each holiday to see if it needs a proposal
      for (const holiday of holidayStore.holidays) {
        if (!holiday.isVotingEligible) continue;

        const holidayDate = new Date(holiday.date);
        const proposalTriggerDate = new Date(
          holidayDate.getTime() - 14 * 24 * 60 * 60 * 1000
        );
        const daysUntilHoliday = Math.ceil(
          (holidayDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

        // Check if we should generate a proposal (exactly 14 days before)
        const shouldGenerate =
          Math.abs(now.getTime() - proposalTriggerDate.getTime()) <
          24 * 60 * 60 * 1000; // Within 24 hours of trigger

        if (!shouldGenerate) continue;

        // Check if proposal already exists for this holiday
        const existingProposal = proposalStore.proposals.find(
          (p): p is HolidayCharityProposal =>
            p.type === 'holiday_charity' &&
            (p as HolidayCharityProposal).holidayId === holiday.id
        );

        if (existingProposal) {
          console.log(`✅ Proposal already exists for ${holiday.name}`);
          continue;
        }

        // Get all verified charities from Supabase data
        const verifiedCharities = charityStore.charities
          .filter(charity => charity.verification.is501c3)
          .map(charity => ({
            id: charity.id,
            name: charity.name,
            logo: charity.logo,
          }));

        if (verifiedCharities.length < 2) {
          console.log(
            `⚠️ Not enough verified charities (${verifiedCharities.length}) for ${holiday.name}`
          );
          continue;
        }

        // Generate the proposal
        await this.generateHolidayCharityProposal(
          holiday.id,
          holiday.name,
          holiday.fundAllocation,
          verifiedCharities.map(c => c.id)
        );

        console.log(
          `🎉 Generated charity selection proposal for: ${holiday.name}`
        );
        console.log(
          `💰 Fund amount: $${holiday.fundAllocation.toLocaleString()}`
        );
        console.log(`🗳️ Voting on ${verifiedCharities.length} charities`);
        console.log(`📅 ${daysUntilHoliday} days until holiday`);
      }
    } catch (error) {
      console.error(
        '❌ Error checking and generating holiday proposals:',
        error
      );
    }
  }

  /**
   * Generate a holiday charity proposal (same format for all holidays)
   * The proposal is always: "Vote for which charities to send money using gauge voting"
   */
  private async generateHolidayCharityProposal(
    holidayId: string,
    holidayName: string,
    fundAmount: number,
    availableCharities: string[]
  ): Promise<void> {
    try {
      const proposalStore = useProposalStore.getState();

      // Create the standardized holiday charity proposal
      await proposalStore.createHolidayCharityProposal(
        holidayId,
        availableCharities,
        fundAmount
      );

      // Update holiday store to mark this holiday as having a generated proposal
      const holidayStore = useHolidayStore.getState();
      holidayStore.markProposalGenerated(`hcp-${holidayId}-${Date.now()}`);

      console.log(`✅ Successfully generated proposal for ${holidayName}`);
      console.log(`📊 Available charities: ${availableCharities.length}`);
      console.log(`💵 Fund allocation: $${fundAmount.toLocaleString()}`);
    } catch (error) {
      console.error(`❌ Error generating proposal for ${holidayName}:`, error);
      throw error;
    }
  }

  /**
   * Manually trigger proposal generation for a specific holiday
   */
  public async generateProposalForHoliday(holidayId: string): Promise<boolean> {
    try {
      const holidayStore = useHolidayStore.getState();
      const charityStore = useCharityStore.getState();

      const holiday = holidayStore.getHolidayById(holidayId);
      if (!holiday) {
        throw new Error(`Holiday not found: ${holidayId}`);
      }

      if (!holiday.isVotingEligible) {
        throw new Error(`Holiday is not eligible for voting: ${holiday.name}`);
      }

      // Ensure we have fresh charity data
      if (charityStore.charities.length === 0) {
        await charityStore.fetchCharities();
      }

      // Get all verified charities from Supabase
      const verifiedCharities = charityStore.charities
        .filter(charity => charity.verification.is501c3)
        .map(charity => charity.id);

      if (verifiedCharities.length < 2) {
        throw new Error(
          `Not enough verified charities (${verifiedCharities.length}) for ${holiday.name}`
        );
      }

      await this.generateHolidayCharityProposal(
        holiday.id,
        holiday.name,
        holiday.fundAllocation,
        verifiedCharities
      );

      return true;
    } catch (error) {
      console.error(
        `Error manually generating proposal for ${holidayId}:`,
        error
      );
      return false;
    }
  }

  /**
   * Get service status and upcoming holidays
   */
  public getStatus(): {
    isRunning: boolean;
    nextHolidays: Array<{
      holiday: MilitaryHoliday;
      daysUntil: number;
      proposalTriggerDate: Date;
      needsProposal: boolean;
      hasProposal: boolean;
    }>;
  } {
    const holidayStore = useHolidayStore.getState();
    const proposalStore = useProposalStore.getState();
    const now = new Date();

    const nextHolidays = holidayStore.holidays
      .filter(holiday => holiday.isVotingEligible)
      .map(holiday => {
        const holidayDate = new Date(holiday.date);
        const proposalTriggerDate = new Date(
          holidayDate.getTime() - 14 * 24 * 60 * 60 * 1000
        );
        const daysUntil = Math.ceil(
          (holidayDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );
        const daysUntilTrigger = Math.ceil(
          (proposalTriggerDate.getTime() - now.getTime()) /
            (1000 * 60 * 60 * 24)
        );

        const hasProposal = proposalStore.proposals.some(
          (p): p is HolidayCharityProposal =>
            p.type === 'holiday_charity' &&
            (p as HolidayCharityProposal).holidayId === holiday.id
        );

        const needsProposal =
          daysUntilTrigger <= 0 && daysUntil > 0 && !hasProposal;

        return {
          holiday,
          daysUntil,
          proposalTriggerDate,
          needsProposal,
          hasProposal,
        };
      })
      .filter(item => item.daysUntil > -30) // Show holidays from 30 days ago to future
      .sort((a, b) => a.daysUntil - b.daysUntil);

    return {
      isRunning: this.isRunning,
      nextHolidays,
    };
  }

  /**
   * Get upcoming holidays that need proposals
   */
  public getUpcomingHolidaysNeedingProposals(): Array<{
    holiday: MilitaryHoliday;
    daysUntil: number;
    needsProposal: boolean;
  }> {
    const status = this.getStatus();

    return status.nextHolidays
      .filter(item => item.needsProposal)
      .map(item => ({
        holiday: item.holiday,
        daysUntil: item.daysUntil,
        needsProposal: item.needsProposal,
      }));
  }
}

// Export singleton instance
export const holidayProposalService = HolidayProposalService.getInstance();

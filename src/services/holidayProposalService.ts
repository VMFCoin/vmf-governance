'use client';

import { useHolidayStore } from '@/stores/useHolidayStore';
import { useProposalStore } from '@/stores/useProposalStore';
import { useCharityStore } from '@/stores/useCharityStore';
import { HolidayCharityProposal, MilitaryHoliday } from '@/types';

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
   * Checks every hour for upcoming holidays that need proposals
   */
  public start(): void {
    if (this.isRunning) {
      console.log('Holiday proposal service is already running');
      return;
    }

    this.isRunning = true;
    console.log('Starting holiday proposal generation service...');

    // Run initial check
    this.checkAndGenerateProposals();

    // Set up interval to check every hour
    this.checkInterval = setInterval(
      () => {
        this.checkAndGenerateProposals();
      },
      60 * 60 * 1000
    ); // 1 hour
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
    console.log('Holiday proposal generation service stopped');
  }

  /**
   * Check for upcoming holidays and generate proposals if needed
   */
  public async checkAndGenerateProposals(): Promise<void> {
    try {
      console.log(
        'Checking for upcoming holidays that need charity proposals...'
      );

      const holidayStore = useHolidayStore.getState();
      const proposalStore = useProposalStore.getState();
      const charityStore = useCharityStore.getState();

      const now = new Date();
      const twoWeeksFromNow = new Date(
        now.getTime() + 14 * 24 * 60 * 60 * 1000
      );

      // Get all holidays in the next two weeks
      const upcomingHolidays = holidayStore.holidays.filter(holiday => {
        const holidayDate = new Date(holiday.date);
        return (
          holidayDate >= now &&
          holidayDate <= twoWeeksFromNow &&
          holiday.isVotingEligible
        );
      });

      console.log(
        `Found ${upcomingHolidays.length} upcoming holidays in the next 2 weeks`
      );

      for (const holiday of upcomingHolidays) {
        // Check if a proposal already exists for this holiday
        const existingProposal = proposalStore.proposals.find(
          (p): p is HolidayCharityProposal =>
            p.type === 'holiday_charity' &&
            (p as HolidayCharityProposal).holidayId === holiday.id
        );

        if (existingProposal) {
          console.log(`Proposal already exists for holiday: ${holiday.name}`);
          continue;
        }

        // Get verified charities for selection
        const verifiedCharities = charityStore.charities
          .filter(charity => charity.verification.is501c3)
          .slice(0, 5) // Limit to 5 charities for voting
          .map(charity => charity.id);

        if (verifiedCharities.length < 2) {
          console.log(
            `Not enough verified charities (${verifiedCharities.length}) for holiday: ${holiday.name}`
          );
          continue;
        }

        // Generate the proposal
        await this.generateHolidayCharityProposal(
          holiday.id,
          holiday.name,
          holiday.fundAllocation,
          verifiedCharities
        );

        console.log(
          `Generated charity selection proposal for: ${holiday.name}`
        );
      }
    } catch (error) {
      console.error('Error checking and generating holiday proposals:', error);
    }
  }

  /**
   * Generate a holiday charity proposal
   */
  private async generateHolidayCharityProposal(
    holidayId: string,
    holidayName: string,
    fundAmount: number,
    availableCharities: string[]
  ): Promise<void> {
    try {
      const proposalStore = useProposalStore.getState();
      await proposalStore.createHolidayCharityProposal(
        holidayId,
        availableCharities,
        fundAmount
      );

      // Update holiday store to mark this holiday as having a generated proposal
      const holidayStore = useHolidayStore.getState();
      holidayStore.markProposalGenerated(`hcp-${holidayId}-${Date.now()}`);

      console.log(
        `Successfully generated proposal for ${holidayName} with $${fundAmount.toLocaleString()} fund`
      );
    } catch (error) {
      console.error(`Error generating proposal for ${holidayName}:`, error);
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

      // Get verified charities
      const verifiedCharities = charityStore.charities
        .filter(charity => charity.verification.is501c3)
        .slice(0, 5)
        .map(charity => charity.id);

      if (verifiedCharities.length < 2) {
        throw new Error(
          `Not enough verified charities (${verifiedCharities.length}) for holiday: ${holiday.name}`
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
      console.error('Error manually generating holiday proposal:', error);
      return false;
    }
  }

  /**
   * Get the status of the service
   */
  public getStatus(): { isRunning: boolean; nextCheck?: Date } {
    return {
      isRunning: this.isRunning,
      nextCheck: this.checkInterval
        ? new Date(Date.now() + 60 * 60 * 1000)
        : undefined,
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
    const holidayStore = useHolidayStore.getState();
    const proposalStore = useProposalStore.getState();
    const now = new Date();

    return holidayStore.holidays
      .filter(holiday => {
        const holidayDate = new Date(holiday.date);
        return holidayDate >= now && holiday.isVotingEligible;
      })
      .map(holiday => {
        const holidayDate = new Date(holiday.date);
        const daysUntil = Math.ceil(
          (holidayDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

        const hasProposal = proposalStore.proposals.some(
          (p): p is HolidayCharityProposal =>
            p.type === 'holiday_charity' &&
            (p as HolidayCharityProposal).holidayId === holiday.id
        );

        return {
          holiday,
          daysUntil,
          needsProposal: !hasProposal && daysUntil <= 14,
        };
      })
      .sort((a, b) => a.daysUntil - b.daysUntil);
  }
}

// Export singleton instance
export const holidayProposalService = HolidayProposalService.getInstance();

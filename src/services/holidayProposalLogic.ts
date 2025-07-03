'use client';

import { HolidayCharityProposal, MilitaryHoliday } from '@/types';
import {
  getUpcomingHolidays,
  getHolidaysNeedingVoting,
  getNextHoliday,
  getCurrentYearHolidays,
} from '@/data/holidays';

export interface HolidayProposalStatus {
  holiday: MilitaryHoliday;
  daysUntilHoliday: number;
  daysUntilVotingStarts: number;
  daysUntilVotingEnds: number;
  votingStartDate: Date;
  votingEndDate: Date;
  isVotingActive: boolean;
  isVotingUpcoming: boolean;
  needsProposal: boolean;
  phase:
    | 'waiting'
    | 'voting_soon'
    | 'voting_active'
    | 'voting_ended'
    | 'completed';
}

export interface ActiveHolidayProposal {
  proposal: HolidayCharityProposal;
  status: HolidayProposalStatus;
  priority: 'high' | 'medium' | 'low';
}

/**
 * Core logic for managing dynamic holiday charity proposals
 */
export class HolidayProposalLogic {
  private static instance: HolidayProposalLogic;

  private constructor() {}

  public static getInstance(): HolidayProposalLogic {
    if (!HolidayProposalLogic.instance) {
      HolidayProposalLogic.instance = new HolidayProposalLogic();
    }
    return HolidayProposalLogic.instance;
  }

  /**
   * Calculate voting dates for a holiday
   */
  private getVotingDates(holidayDate: Date): { start: Date; end: Date } {
    const start = new Date(holidayDate);
    start.setDate(start.getDate() - 14); // 2 weeks before

    const end = new Date(holidayDate);
    end.setDate(end.getDate() - 1); // 1 day before holiday

    return { start, end };
  }

  /**
   * Get comprehensive status for a holiday
   */
  public getHolidayProposalStatus(
    holiday: MilitaryHoliday
  ): HolidayProposalStatus {
    const now = new Date();
    const holidayDate = new Date(holiday.date);
    const { start: votingStartDate, end: votingEndDate } =
      this.getVotingDates(holidayDate);

    const daysUntilHoliday = Math.ceil(
      (holidayDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    const daysUntilVotingStarts = Math.ceil(
      (votingStartDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    const daysUntilVotingEnds = Math.ceil(
      (votingEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    const isVotingActive = now >= votingStartDate && now <= votingEndDate;
    const isVotingUpcoming =
      daysUntilVotingStarts > 0 && daysUntilVotingStarts <= 7; // Show 1 week before voting starts
    const needsProposal =
      isVotingActive || (daysUntilVotingStarts <= 0 && daysUntilVotingEnds > 0);

    let phase: HolidayProposalStatus['phase'] = 'waiting';
    if (daysUntilHoliday < 0) {
      phase = 'completed';
    } else if (daysUntilVotingEnds < 0) {
      phase = 'voting_ended';
    } else if (isVotingActive) {
      phase = 'voting_active';
    } else if (isVotingUpcoming) {
      phase = 'voting_soon';
    }

    return {
      holiday,
      daysUntilHoliday,
      daysUntilVotingStarts,
      daysUntilVotingEnds,
      votingStartDate,
      votingEndDate,
      isVotingActive,
      isVotingUpcoming,
      needsProposal,
      phase,
    };
  }

  /**
   * Get all upcoming holidays that need proposal management
   */
  public getHolidaysNeedingAttention(): HolidayProposalStatus[] {
    const holidays = getUpcomingHolidays();

    return holidays
      .filter(holiday => holiday.isVotingEligible)
      .map(holiday => this.getHolidayProposalStatus(holiday))
      .filter(
        status =>
          status.phase === 'voting_soon' ||
          status.phase === 'voting_active' ||
          status.needsProposal
      )
      .sort((a, b) => a.daysUntilVotingStarts - b.daysUntilVotingStarts);
  }

  /**
   * Get the most urgent holiday proposal to display
   */
  public getPrimaryHolidayForDisplay(): HolidayProposalStatus | null {
    const holidaysNeedingAttention = this.getHolidaysNeedingAttention();

    // Priority: Active voting > Voting soon > Needs proposal
    const activeVoting = holidaysNeedingAttention.find(
      h => h.phase === 'voting_active'
    );
    if (activeVoting) return activeVoting;

    const votingSoon = holidaysNeedingAttention.find(
      h => h.phase === 'voting_soon'
    );
    if (votingSoon) return votingSoon;

    const needsProposal = holidaysNeedingAttention.find(h => h.needsProposal);
    if (needsProposal) return needsProposal;

    // If no urgent holidays, get the next upcoming holiday
    const nextHoliday = getNextHoliday();
    if (nextHoliday) {
      return this.getHolidayProposalStatus(nextHoliday);
    }

    return null;
  }

  /**
   * Generate a holiday charity proposal for a specific holiday
   */
  public generateHolidayProposal(
    holiday: MilitaryHoliday,
    availableCharities: string[]
  ): HolidayCharityProposal {
    const now = new Date();
    const holidayDate = new Date(holiday.date);
    const { start: votingStartDate, end: votingEndDate } =
      this.getVotingDates(holidayDate);
    const status = this.getHolidayProposalStatus(holiday);

    const proposalId = `hcp-${holiday.id}-${holidayDate.getFullYear()}`;

    // Calculate time left in a more user-friendly format
    const timeLeft = this.formatTimeLeft(status.daysUntilVotingEnds);

    const proposal: HolidayCharityProposal = {
      id: proposalId,
      type: 'holiday_charity',
      title: `${holiday.name} ${holidayDate.getFullYear()} - Charity Selection`,
      author: 'system',
      status: status.phase === 'voting_active' ? 'active' : 'pending',
      timeLeft,
      yesPercentage: 0,
      noPercentage: 0,
      abstainPercentage: 0,
      description: `Vote for your preferred charity to receive $${holiday.fundAllocation.toLocaleString()} in funding for ${holiday.name} ${holidayDate.getFullYear()}. ${holiday.description}`,
      createdAt: now,
      votingEndsAt: votingEndDate,
      holidayId: holiday.id,
      availableCharities,
      isAutoGenerated: true,
      fundAmount: holiday.fundAllocation,
      votingType: 'charity_selection',
      charityVotes: availableCharities.reduce(
        (acc, charityId) => {
          acc[charityId] = { votes: 0, percentage: 0 };
          return acc;
        },
        {} as Record<string, { votes: number; percentage: number }>
      ),
      totalVotes: 0,
      leadingCharity: availableCharities[0] || '',
    };

    return proposal;
  }

  /**
   * Check if a proposal should be displayed based on timing rules
   */
  public shouldDisplayProposal(holiday: MilitaryHoliday): boolean {
    const status = this.getHolidayProposalStatus(holiday);

    // Display if voting is active or starting within 2 weeks
    return status.isVotingActive || status.daysUntilVotingStarts <= 14;
  }

  /**
   * Get dynamic proposals that should replace mock data
   */
  public getDynamicHolidayProposals(
    availableCharities: string[]
  ): HolidayCharityProposal[] {
    const holidaysNeedingAttention = this.getHolidaysNeedingAttention();

    return holidaysNeedingAttention
      .filter(status => status.needsProposal || status.isVotingActive)
      .map(status =>
        this.generateHolidayProposal(status.holiday, availableCharities)
      );
  }

  /**
   * Get the next holiday information for UI display
   */
  public getUpcomingHolidayInfo(): {
    nextHoliday: MilitaryHoliday | null;
    status: HolidayProposalStatus | null;
    displayMessage: string;
  } {
    const primaryHoliday = this.getPrimaryHolidayForDisplay();

    if (!primaryHoliday) {
      return {
        nextHoliday: null,
        status: null,
        displayMessage: 'No upcoming holidays found',
      };
    }

    let displayMessage = '';
    const {
      holiday,
      phase,
      daysUntilVotingStarts,
      daysUntilVotingEnds,
      daysUntilHoliday,
    } = primaryHoliday;

    switch (phase) {
      case 'voting_active':
        displayMessage = `Voting active for ${holiday.name} - ${daysUntilVotingEnds} days left to vote!`;
        break;
      case 'voting_soon':
        displayMessage = `${holiday.name} voting starts in ${daysUntilVotingStarts} days`;
        break;
      case 'voting_ended':
        displayMessage = `${holiday.name} voting ended - results pending`;
        break;
      default:
        displayMessage = `Next holiday: ${holiday.name} in ${daysUntilHoliday} days`;
    }

    return {
      nextHoliday: holiday,
      status: primaryHoliday,
      displayMessage,
    };
  }

  /**
   * Format time left in a user-friendly way
   */
  private formatTimeLeft(days: number): string {
    if (days < 0) return 'Voting ended';
    if (days === 0) return 'Last day to vote';
    if (days === 1) return '1 day left';
    if (days <= 7) return `${days} days left`;

    const weeks = Math.floor(days / 7);
    const remainingDays = days % 7;

    if (weeks === 1 && remainingDays === 0) return '1 week left';
    if (weeks === 1) return `1 week, ${remainingDays} days left`;
    if (remainingDays === 0) return `${weeks} weeks left`;

    return `${weeks} weeks, ${remainingDays} days left`;
  }

  /**
   * Check if we need to transition from one holiday to the next
   */
  public checkForHolidayTransition(
    currentProposals: HolidayCharityProposal[]
  ): {
    shouldTransition: boolean;
    expiredProposals: string[];
    newHolidaysNeeded: MilitaryHoliday[];
  } {
    const now = new Date();
    const expiredProposals: string[] = [];
    const newHolidaysNeeded: MilitaryHoliday[] = [];

    // Check for expired proposals
    currentProposals.forEach(proposal => {
      if (new Date(proposal.votingEndsAt) < now) {
        expiredProposals.push(proposal.id);
      }
    });

    // Check for new holidays that need proposals
    const holidaysNeedingAttention = this.getHolidaysNeedingAttention();
    holidaysNeedingAttention.forEach(status => {
      const hasExistingProposal = currentProposals.some(
        proposal => proposal.holidayId === status.holiday.id
      );

      if (!hasExistingProposal && status.needsProposal) {
        newHolidaysNeeded.push(status.holiday);
      }
    });

    return {
      shouldTransition:
        expiredProposals.length > 0 || newHolidaysNeeded.length > 0,
      expiredProposals,
      newHolidaysNeeded,
    };
  }

  /**
   * Get all current year holidays for calendar display
   */
  public getCurrentYearHolidaysWithStatus(): HolidayProposalStatus[] {
    const holidays = getCurrentYearHolidays();
    return holidays.map(holiday => this.getHolidayProposalStatus(holiday));
  }
}

// Export singleton instance
export const holidayProposalLogic = HolidayProposalLogic.getInstance();

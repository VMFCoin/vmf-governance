'use client';

import Link from 'next/link';
import { Vote, Users, PlusCircle, Calendar, Clock } from 'lucide-react';
import {
  Header,
  Footer,
  Button,
  Card,
  VotingPower,
  ProposalCard,
} from '@/components';
import { TypeSpecificProposalCard } from '@/components/proposals';
import { HolidayCharityCard } from '@/components/proposals/holiday-charity';
import { CalendarSidebar } from '@/components/community';
import { mockProposals } from '@/data/mockData';
import { getUpcomingHolidayEvents } from '@/data/holidays';
import { holidayProposalLogic } from '@/services/holidayProposalLogic';
import { useCharityStore } from '@/stores/useCharityStore';
import { CalendarEvent, Proposal, HolidayCharityProposal } from '@/types';
import { useEffect, useState } from 'react';

export default function Home() {
  const { charities } = useCharityStore();
  const [displayProposals, setDisplayProposals] = useState<Proposal[]>([]);
  const [holidayInfo, setHolidayInfo] = useState<{
    nextHoliday: any;
    status: any;
    displayMessage: string;
  } | null>(null);

  // Get dynamic holiday events instead of static mock data
  const holidayEvents = getUpcomingHolidayEvents();

  // Smart proposal generation with calendar integration
  useEffect(() => {
    const availableCharityIds = charities
      .filter(charity => charity.verification.is501c3)
      .map(charity => charity.id);

    // Get upcoming holiday information for context
    const upcomingHolidayInfo = holidayProposalLogic.getUpcomingHolidayInfo();
    setHolidayInfo(upcomingHolidayInfo);

    // Get dynamic holiday proposals (these have highest priority)
    const dynamicHolidayProposals =
      holidayProposalLogic.getDynamicHolidayProposals(availableCharityIds);

    // Get non-holiday proposals from mock data (charity directory, platform features, etc.)
    const nonHolidayProposals = mockProposals.filter(
      proposal => proposal.type !== 'holiday_charity'
    );

    // Enhanced Smart prioritization logic - Holiday content ALWAYS comes first
    let finalProposals: Proposal[] = [];

    if (dynamicHolidayProposals.length > 0) {
      // Priority 1: Active holiday proposals (sync with calendar)
      // Show holiday proposals first, then fill remaining slots with other proposals
      finalProposals = [
        ...dynamicHolidayProposals,
        ...nonHolidayProposals.slice(0, 3 - dynamicHolidayProposals.length),
      ];
    } else {
      // Priority 2: No active holiday voting, but show upcoming holidays first
      // Reduce non-holiday proposals to make room for upcoming holiday card
      finalProposals = nonHolidayProposals.slice(0, 1);
    }

    setDisplayProposals(finalProposals);
  }, [charities]);

  const handleEventClick = (event: CalendarEvent) => {
    console.log('Event clicked:', event);
    // In a real app, this might open an event detail modal or navigate to event page
    // For now, we'll just log the event
  };

  // Create Next Holiday Card component
  const NextHolidayCard = () => {
    if (!holidayInfo?.nextHoliday || !holidayInfo?.status) {
      return null;
    }

    const { nextHoliday, status } = holidayInfo;

    // Only show upcoming card if no active voting
    if (status.phase === 'voting_active') {
      return null;
    }

    return (
      <HolidayCharityCard
        mode="upcoming"
        nextHoliday={{
          holiday: nextHoliday,
          daysUntil: status.daysUntilHoliday,
          status: status,
        }}
        className="hover:scale-105 transition-transform duration-200"
      />
    );
  };

  return (
    <main className="min-h-screen landing-page-flag">
      {/* Header */}
      <Header />

      {/* Hero Section - Enhanced Responsive Design */}
      <section className="py-16 xs:py-20 sm:py-24 lg:py-32 hero-section relative">
        <div className="max-w-7xl mx-auto px-4 xs:px-6 sm:px-8 lg:px-12 text-center relative z-10">
          <h1 className="text-hero-mobile xs:text-hero-tablet md:text-hero-desktop lg:text-7xl font-display font-bold mb-6 xs:mb-8 lg:mb-12 text-patriotWhite leading-tight">
            Support Veterans Through
            <br className="hidden xs:block" />
            <span className="text-patriotRed block xs:inline">
              Decisions That Matter
            </span>
          </h1>
          <p className="text-lg xs:text-xl md:text-2xl lg:text-3xl text-textSecondary mb-8 xs:mb-10 lg:mb-16 max-w-xs xs:max-w-2xl md:max-w-4xl lg:max-w-5xl mx-auto leading-relaxed font-medium px-2 xs:px-0">
            VMF Coin holders can propose and vote on key initiatives to help
            veterans across the nation.
          </p>
          <div className="flex flex-col xs:flex-row gap-3 xs:gap-4 lg:gap-6 justify-center items-center max-w-md xs:max-w-none mx-auto">
            <Button
              asChild
              size="lg"
              className="uppercase tracking-wide w-full xs:w-auto min-h-[48px] text-base xs:text-lg font-semibold px-8 xs:px-10 lg:px-12"
            >
              <Link href="/vote">Get Started</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* How it Works Section - Enhanced Mobile Layout */}
      <section className="py-16 xs:py-20 lg:py-24 bg-backgroundAccent/30">
        <div className="max-w-7xl mx-auto px-4 xs:px-6 sm:px-8 lg:px-12">
          <h2 className="text-section-mobile xs:text-section-tablet lg:text-section-desktop font-display font-bold text-center mb-8 xs:mb-12 lg:mb-20 text-patriotWhite">
            How it Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 xs:gap-8 lg:gap-12">
            <Card
              variant="flag"
              className="text-center p-6 xs:p-8 lg:p-10 hover:transform hover:scale-105 transition-all duration-300"
            >
              <div className="w-16 h-16 xs:w-20 xs:h-20 lg:w-24 lg:h-24 bg-patriotBlue rounded-full flex items-center justify-center mx-auto mb-4 xs:mb-6 lg:mb-8">
                <Vote className="w-8 h-8 xs:w-10 xs:h-10 lg:w-12 lg:h-12 text-patriotWhite" />
              </div>
              <h3 className="text-lg xs:text-xl lg:text-2xl font-semibold mb-3 xs:mb-4 lg:mb-6 text-patriotWhite">
                Get VMF Coin
              </h3>
              <p className="text-sm xs:text-base lg:text-lg text-textSecondary leading-relaxed">
                Buy and hold VMF Coin to participate in decisions
              </p>
            </Card>

            <Card
              variant="flag"
              className="text-center p-6 xs:p-8 lg:p-10 hover:transform hover:scale-105 transition-all duration-300"
            >
              <div className="w-16 h-16 xs:w-20 xs:h-20 lg:w-24 lg:h-24 bg-patriotRed rounded-full flex items-center justify-center mx-auto mb-4 xs:mb-6 lg:mb-8">
                <PlusCircle className="w-8 h-8 xs:w-10 xs:h-10 lg:w-12 lg:h-12 text-patriotWhite" />
              </div>
              <h3 className="text-lg xs:text-xl lg:text-2xl font-semibold mb-3 xs:mb-4 lg:mb-6 text-patriotWhite">
                Submit a Proposal
              </h3>
              <p className="text-sm xs:text-base lg:text-lg text-textSecondary leading-relaxed">
                Suggest initiatives to support our veterans
              </p>
            </Card>

            <Card
              variant="flag"
              className="text-center p-6 xs:p-8 lg:p-10 hover:transform hover:scale-105 transition-all duration-300"
            >
              <div className="w-16 h-16 xs:w-20 xs:h-20 lg:w-24 lg:h-24 bg-patriotBlue rounded-full flex items-center justify-center mx-auto mb-4 xs:mb-6 lg:mb-8">
                <Users className="w-8 h-8 xs:w-10 xs:h-10 lg:w-12 lg:h-12 text-patriotWhite" />
              </div>
              <h3 className="text-lg xs:text-xl lg:text-2xl font-semibold mb-3 xs:mb-4 lg:mb-6 text-patriotWhite">
                Make an Impact
              </h3>
              <p className="text-sm xs:text-base lg:text-lg text-textSecondary leading-relaxed">
                Help fund important causes and support the veteran community
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Community Voting Section - Enhanced Responsive Grid */}
      <section className="py-16 xs:py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 xs:px-6 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 xs:gap-12 lg:gap-16 items-center">
            <div className="text-center lg:text-left order-2 lg:order-1">
              <h2 className="text-section-mobile xs:text-section-tablet lg:text-section-desktop font-display font-bold mb-4 xs:mb-6 lg:mb-8 text-patriotWhite">
                Community Voting
              </h2>
              <p className="text-lg xs:text-xl lg:text-2xl text-textSecondary mb-6 xs:mb-8 lg:mb-12 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                VMF Coin holders can vote on key decisions to support veterans.
              </p>
              <div className="flex justify-center lg:justify-start">
                <Button
                  asChild
                  size="lg"
                  className="min-h-[48px] text-base xs:text-lg font-semibold px-8 xs:px-10 lg:px-12"
                >
                  <Link href="/vote">Vote Now</Link>
                </Button>
              </div>
            </div>
            <div className="flex justify-center order-1 lg:order-2">
              <VotingPower percentage={75} size="lg" />
            </div>
          </div>
        </div>
      </section>

      {/* Active Proposals Section - Enhanced Mobile-First Layout */}
      <section className="py-16 xs:py-20 lg:py-24 bg-backgroundAccent/20">
        <div className="max-w-7xl mx-auto px-4 xs:px-6 sm:px-8 lg:px-12">
          <div className="flex flex-col xs:flex-row xs:justify-between xs:items-start mb-8 xs:mb-12 lg:mb-16 gap-4 xs:gap-6">
            <div className="flex-1">
              <h2 className="text-section-mobile xs:text-section-tablet lg:text-4xl font-display font-bold text-patriotWhite mb-2 xs:mb-3">
                Active Proposals & Holiday Calendar
              </h2>
              {holidayInfo && holidayInfo.nextHoliday && (
                <p className="text-sm xs:text-base lg:text-lg text-textSecondary leading-relaxed">
                  {holidayInfo.displayMessage}
                </p>
              )}
            </div>
            <div className="flex-shrink-0">
              <Button
                variant="secondary"
                asChild
                size="md"
                className="w-full xs:w-auto min-h-[44px] text-sm xs:text-base font-semibold px-4 xs:px-6"
              >
                <Link href="/submit">
                  <span className="xs:hidden">Submit</span>
                  <span className="hidden xs:inline">+ Submit Proposal</span>
                </Link>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 xs:gap-8 lg:gap-12">
            {/* Left Column - Smart Prioritized Proposals */}
            <div className="space-y-4 xs:space-y-6 lg:space-y-8">
              {/* Priority 1: Next Holiday Card (upcoming holiday funding) - ALWAYS FIRST when available */}
              <NextHolidayCard />

              {/* Priority 2: Display regular proposals */}
              {displayProposals.length > 0
                ? displayProposals.map(proposal => (
                    <TypeSpecificProposalCard
                      key={proposal.id}
                      proposal={proposal}
                    />
                  ))
                : // Simple fallback when no proposals and no holiday info
                  !holidayInfo?.nextHoliday && (
                    <Card
                      variant="flag"
                      className="p-4 xs:p-6 lg:p-8 text-center"
                    >
                      <p className="text-sm xs:text-base lg:text-lg text-textSecondary leading-relaxed">
                        No active proposals at this time. Check back soon for
                        upcoming holiday charity selections!
                      </p>
                    </Card>
                  )}
            </div>

            {/* Right Column - Dynamic Holiday Calendar */}
            <div>
              <CalendarSidebar
                events={holidayEvents}
                onEventClick={handleEventClick}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </main>
  );
}

'use client';

import Link from 'next/link';
import { Vote, Users, PlusCircle } from 'lucide-react';
import {
  Header,
  Footer,
  Button,
  Card,
  VotingPower,
  ProposalCard,
} from '@/components';
import { TypeSpecificProposalCard } from '@/components/proposals';
import { mockProposals, mockHolidays } from '@/data/mockData';

export default function Home() {
  return (
    <main className="min-h-screen landing-page-flag">
      {/* Header */}
      <Header />

      {/* Hero Section */}
      <section className="py-24 hero-section relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h1 className="text-5xl md:text-7xl font-display font-bold mb-8 text-patriotWhite leading-tight">
            Support Veterans Through
            <br />
            <span className="text-patriotRed">Decisions That Matter</span>
          </h1>
          <p className="text-xl md:text-2xl text-textSecondary mb-12 max-w-4xl mx-auto leading-relaxed font-medium">
            VMF Coin holders can propose and vote on key initiatives to help
            veterans across the nation.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="uppercase tracking-wide">
              <Link href="/vote">Get Started</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-20 bg-backgroundAccent/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-display font-bold text-center mb-16 text-patriotWhite">
            How it Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card variant="flag" className="text-center">
              <div className="w-16 h-16 bg-patriotBlue rounded-full flex items-center justify-center mx-auto mb-6">
                <Vote className="w-8 h-8 text-patriotWhite" />
              </div>
              <h3 className="text-xl font-semibold mb-4 text-patriotWhite">
                Get VMF Coin
              </h3>
              <p className="text-textSecondary">
                Buy and hold VMF Coin to participate in decisions
              </p>
            </Card>

            <Card variant="flag" className="text-center">
              <div className="w-16 h-16 bg-patriotRed rounded-full flex items-center justify-center mx-auto mb-6">
                <PlusCircle className="w-8 h-8 text-patriotWhite" />
              </div>
              <h3 className="text-xl font-semibold mb-4 text-patriotWhite">
                Submit a Proposal
              </h3>
              <p className="text-textSecondary">
                Suggest initiatives to support our veterans
              </p>
            </Card>

            <Card variant="flag" className="text-center">
              <div className="w-16 h-16 bg-patriotBlue rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="w-8 h-8 text-patriotWhite" />
              </div>
              <h3 className="text-xl font-semibold mb-4 text-patriotWhite">
                Make an Impact
              </h3>
              <p className="text-textSecondary">
                Help fund important causes and support the veteran community
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Community Voting Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-display font-bold mb-6 text-patriotWhite">
                Community Voting
              </h2>
              <p className="text-xl text-textSecondary mb-8">
                VMF Coin holders can vote on key decisions to support veterans.
              </p>
              <Button asChild>
                <Link href="/vote">Vote Now</Link>
              </Button>
            </div>
            <div>
              <VotingPower percentage={75} size="lg" />
            </div>
          </div>
        </div>
      </section>

      {/* Active Proposals Section */}
      <section className="py-20 bg-backgroundAccent/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-12">
            <h2 className="text-3xl font-display font-bold text-patriotWhite">
              Active Proposals
            </h2>
            <Button variant="secondary" asChild>
              <Link href="/submit">+ Submit Proposal</Link>
            </Button>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Left Column - Proposals */}
            <div className="space-y-6">
              {mockProposals.slice(0, 3).map(proposal => (
                <TypeSpecificProposalCard
                  key={proposal.id}
                  proposal={proposal}
                />
              ))}
            </div>

            {/* Right Column - Holiday Schedule */}
            <Card>
              <h3 className="text-xl font-semibold mb-6 text-patriotWhite">
                National Holiday Giveaway Schedule
              </h3>
              <div className="space-y-4">
                {mockHolidays.map(holiday => (
                  <div key={holiday.id} className="flex items-center">
                    <div
                      className={`w-4 h-4 rounded-full mr-3 ${
                        holiday.isVotingDay
                          ? 'bg-patriotRed'
                          : 'border-2 border-patriotBlue'
                      }`}
                    ></div>
                    <span className="text-textSecondary">{holiday.name}</span>
                  </div>
                ))}
                <div className="mt-6 pt-4 border-t border-patriotBlue/30">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-patriotRed rounded-full mr-3"></div>
                    <span className="text-patriotWhite font-medium">
                      Voting Days
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </main>
  );
}

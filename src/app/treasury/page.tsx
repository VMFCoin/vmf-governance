'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Shield, AlertTriangle } from 'lucide-react';
import { Header, Footer, Button, Card } from '@/components';
import { TreasuryDashboard } from '@/components/governance';
import { treasuryService } from '@/services';

export default function TreasuryPage() {
  return (
    <main className="min-h-screen bg-backgroundPrimary">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation */}
        <div className="flex items-center space-x-4 mb-8">
          <Button variant="ghost" asChild>
            <Link href="/vote">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Voting
            </Link>
          </Button>
          <div className="h-6 w-px bg-border"></div>
          <nav className="flex items-center space-x-2 text-sm text-textSecondary">
            <Link href="/" className="hover:text-patriotWhite">
              Home
            </Link>
            <span>/</span>
            <Link href="/vote" className="hover:text-patriotWhite">
              Voting
            </Link>
            <span>/</span>
            <span className="text-patriotWhite">Treasury</span>
          </nav>
        </div>

        {/* Development Notice */}
        {!treasuryService.isContractDeployed() && (
          <Card className="p-4 mb-6 bg-yellow-500/10 border-yellow-500/20">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0" />
              <div>
                <p className="font-semibold text-yellow-200">
                  Development Mode
                </p>
                <p className="text-sm text-yellow-300">
                  Treasury contract not yet deployed. Currently displaying mock
                  data for development purposes. Once the treasury contract is
                  deployed, this dashboard will automatically switch to real
                  blockchain data.
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Treasury Dashboard */}
        <TreasuryDashboard />
      </div>

      <Footer />
    </main>
  );
}

'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Header, Footer, Button } from '@/components';
import { TreasuryIntegrationTest } from '@/components/governance';

export default function TreasuryDemoPage() {
  return (
    <main className="min-h-screen bg-backgroundPrimary">
      <Header />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation */}
        <div className="flex items-center space-x-4 mb-8">
          <Button variant="ghost" asChild>
            <Link href="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Link>
          </Button>
        </div>

        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-display font-bold text-patriotWhite mb-4">
            Treasury Integration Demo
          </h1>
          <p className="text-textSecondary max-w-2xl mx-auto">
            This page demonstrates the Phase 23.3 Treasury Integration
            functionality. The treasury service is currently using mock data but
            can be easily switched to real contract interactions once the
            treasury contract is deployed.
          </p>
        </div>

        {/* Demo Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h2 className="text-xl font-semibold text-patriotWhite mb-4">
              Treasury Service Test
            </h2>
            <TreasuryIntegrationTest />
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-patriotWhite mb-4">
              Available Features
            </h2>
            <div className="space-y-3">
              <div className="p-4 bg-backgroundAccent/30 rounded-lg">
                <h3 className="font-semibold text-patriotWhite">
                  Treasury Balance
                </h3>
                <p className="text-sm text-textSecondary">
                  View total, available, and locked treasury balances with asset
                  allocation
                </p>
              </div>
              <div className="p-4 bg-backgroundAccent/30 rounded-lg">
                <h3 className="font-semibold text-patriotWhite">
                  Transaction History
                </h3>
                <p className="text-sm text-textSecondary">
                  Monitor all treasury transactions including deposits,
                  withdrawals, and distributions
                </p>
              </div>
              <div className="p-4 bg-backgroundAccent/30 rounded-lg">
                <h3 className="font-semibold text-patriotWhite">
                  Performance Analytics
                </h3>
                <p className="text-sm text-textSecondary">
                  Track treasury performance with inflow/outflow metrics and
                  monthly statistics
                </p>
              </div>
              <div className="p-4 bg-backgroundAccent/30 rounded-lg">
                <h3 className="font-semibold text-patriotWhite">
                  Distribution Planning
                </h3>
                <p className="text-sm text-textSecondary">
                  View scheduled charity distributions with approval status and
                  timing
                </p>
              </div>
              <div className="p-4 bg-backgroundAccent/30 rounded-lg">
                <h3 className="font-semibold text-patriotWhite">
                  Real-time Updates
                </h3>
                <p className="text-sm text-textSecondary">
                  Monitor treasury transactions in real-time with automatic UI
                  updates
                </p>
              </div>
            </div>

            <div className="mt-6">
              <Button asChild className="w-full">
                <Link href="/treasury">View Full Treasury Dashboard</Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Implementation Notes */}
        <div className="mt-12 p-6 bg-backgroundAccent/20 rounded-lg">
          <h2 className="text-xl font-semibold text-patriotWhite mb-4">
            Implementation Notes
          </h2>
          <div className="space-y-3 text-sm text-textSecondary">
            <p>
              <strong className="text-patriotWhite">Mock Data:</strong>{' '}
              Currently using simulated treasury data with realistic values and
              transaction patterns.
            </p>
            <p>
              <strong className="text-patriotWhite">Contract Ready:</strong>{' '}
              Service architecture is designed to seamlessly switch to real
              contract interactions once deployed.
            </p>
            <p>
              <strong className="text-patriotWhite">Integration:</strong>{' '}
              Treasury service integrates with existing gauge voting results for
              automated fund distribution.
            </p>
            <p>
              <strong className="text-patriotWhite">Real-time:</strong> Supports
              real-time transaction monitoring and UI updates via event
              subscriptions.
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}

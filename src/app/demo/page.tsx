'use client';

import React, { useState } from 'react';
import {
  Header,
  Footer,
  Button,
  Card,
  Modal,
  Input,
  VotingPower,
  ProposalCard,
} from '@/components';
import { TypeSpecificProposalCard } from '@/components/proposals';
import { mockProposals } from '@/data/mockData';

export default function DemoPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');

  return (
    <main className="min-h-screen landing-page-flag">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-display font-bold text-patriotWhite mb-4">
            VMF Voice Component Demo
          </h1>
          <p className="text-xl text-textSecondary">
            Showcasing all Phase 2 components
          </p>
        </div>

        {/* Button Variants */}
        <section className="mb-12">
          <h2 className="text-2xl font-display font-semibold text-patriotWhite mb-6">
            Button Components
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <h3 className="text-lg font-semibold text-patriotWhite mb-4">
                Primary Buttons
              </h3>
              <div className="space-y-3">
                <Button size="sm">Small Primary</Button>
                <Button size="md">Medium Primary</Button>
                <Button size="lg">Large Primary</Button>
              </div>
            </Card>

            <Card>
              <h3 className="text-lg font-semibold text-patriotWhite mb-4">
                Secondary Buttons
              </h3>
              <div className="space-y-3">
                <Button variant="secondary" size="sm">
                  Small Secondary
                </Button>
                <Button variant="secondary" size="md">
                  Medium Secondary
                </Button>
                <Button variant="secondary" size="lg">
                  Large Secondary
                </Button>
              </div>
            </Card>

            <Card>
              <h3 className="text-lg font-semibold text-patriotWhite mb-4">
                Ghost Buttons
              </h3>
              <div className="space-y-3">
                <Button variant="ghost" size="sm">
                  Small Ghost
                </Button>
                <Button variant="ghost" size="md">
                  Medium Ghost
                </Button>
                <Button variant="ghost" size="lg">
                  Large Ghost
                </Button>
              </div>
            </Card>
          </div>
        </section>

        {/* Card Variants */}
        <section className="mb-12">
          <h2 className="text-2xl font-display font-semibold text-patriotWhite mb-6">
            Card Components
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <h3 className="text-lg font-semibold text-patriotWhite mb-2">
                Default Card
              </h3>
              <p className="text-textSecondary">
                This is a standard card with default styling.
              </p>
            </Card>

            <Card variant="hover">
              <h3 className="text-lg font-semibold text-patriotWhite mb-2">
                Hover Card
              </h3>
              <p className="text-textSecondary">
                This card has hover effects. Try hovering over it!
              </p>
            </Card>

            <Card variant="flag">
              <h3 className="text-lg font-semibold text-patriotWhite mb-2">
                Flag Card
              </h3>
              <p className="text-textSecondary">
                This card has patriotic flag elements.
              </p>
            </Card>
          </div>
        </section>

        {/* Voting Power Components */}
        <section className="mb-12">
          <h2 className="text-2xl font-display font-semibold text-patriotWhite mb-6">
            Voting Power Components
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="text-center">
              <h3 className="text-lg font-semibold text-patriotWhite mb-4">
                Small
              </h3>
              <VotingPower
                percentage={45}
                size="sm"
                label="Small Voting Power"
              />
            </Card>

            <Card className="text-center">
              <h3 className="text-lg font-semibold text-patriotWhite mb-4">
                Medium
              </h3>
              <VotingPower
                percentage={75}
                size="md"
                label="Medium Voting Power"
              />
            </Card>

            <Card className="text-center">
              <h3 className="text-lg font-semibold text-patriotWhite mb-4">
                Large
              </h3>
              <VotingPower
                percentage={90}
                size="lg"
                label="Large Voting Power"
              />
            </Card>
          </div>
        </section>

        {/* Input Components */}
        <section className="mb-12">
          <h2 className="text-2xl font-display font-semibold text-patriotWhite mb-6">
            Input Components
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <h3 className="text-lg font-semibold text-patriotWhite mb-4">
                Form Inputs
              </h3>
              <div className="space-y-4">
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="Enter your email"
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                />
                <Input
                  label="Password"
                  type="password"
                  placeholder="Enter your password"
                />
                <Input
                  label="Error State"
                  placeholder="This has an error"
                  error="This field is required"
                />
              </div>
            </Card>

            <Card>
              <h3 className="text-lg font-semibold text-patriotWhite mb-4">
                Modal Demo
              </h3>
              <p className="text-textSecondary mb-4">
                Click the button below to open a modal dialog.
              </p>
              <Button onClick={() => setIsModalOpen(true)}>Open Modal</Button>
            </Card>
          </div>
        </section>

        {/* Proposal Cards */}
        <section className="mb-12">
          <h2 className="text-2xl font-display font-semibold text-patriotWhite mb-6">
            Proposal Cards
          </h2>
          <div className="grid lg:grid-cols-2 gap-6">
            {mockProposals.slice(0, 6).map(proposal => (
              <TypeSpecificProposalCard key={proposal.id} proposal={proposal} />
            ))}
          </div>
        </section>
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Demo Modal"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-textSecondary">
            This is a demo modal showcasing the Modal component with VMF
            styling.
          </p>
          <Input label="Sample Input" placeholder="Type something here..." />
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setIsModalOpen(false)}>Confirm</Button>
          </div>
        </div>
      </Modal>

      <Footer />
    </main>
  );
}

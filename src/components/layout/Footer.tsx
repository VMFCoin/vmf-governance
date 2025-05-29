'use client';

import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface FooterProps {
  className?: string;
}

export const Footer: React.FC<FooterProps> = ({ className }) => {
  const footerLinks = [
    { href: '/vote', label: 'Vote' },
    { href: '/submit', label: 'Submit' },
    { href: '/community', label: 'Community' },
  ];

  return (
    <footer
      className={cn(
        'border-t border-patriotBlue/30 py-12 bg-backgroundLight/30',
        className
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <h3 className="text-xl font-display font-semibold text-patriotWhite">
              VMF Voice
            </h3>
          </div>

          <p className="text-textSecondary mb-4">
            Empowering U.S. Veterans through decentralized governance
          </p>

          <div className="flex justify-center space-x-6">
            {footerLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className="text-textSecondary hover:text-patriotRed transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

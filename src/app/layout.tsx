import type { Metadata } from 'next';
import { Inter, Sora } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { FOUCPrevention } from '@/components/layout/FOUCPrevention';
import PageTransition from '@/components/layout/PageTransition';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const sora = Sora({
  subsets: ['latin'],
  variable: '--font-sora',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'VMF Voice - Veterans DAO Governance',
  description:
    'A Web3 DAO platform for U.S. Veterans using VMF Coin. Vote on proposals, submit initiatives, and shape the future of veteran support.',
  keywords: [
    'VMF',
    'Veterans',
    'DAO',
    'Web3',
    'Governance',
    'Voting',
    'Blockchain',
  ],
  authors: [{ name: 'VMF Team' }],
  creator: 'VMF Team',
  publisher: 'VMF Voice',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://vmf-voice.com'),
  openGraph: {
    title: 'VMF Voice - Veterans DAO Governance',
    description: 'A Web3 DAO platform for U.S. Veterans using VMF Coin',
    url: 'https://vmf-voice.com',
    siteName: 'VMF Voice',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VMF Voice - Veterans DAO Governance',
    description: 'A Web3 DAO platform for U.S. Veterans using VMF Coin',
    creator: '@vmfvoice',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${sora.variable}`}>
      <body className={`${inter.className} antialiased`}>
        <FOUCPrevention>
          <Providers>
            <PageTransition>{children}</PageTransition>
          </Providers>
        </FOUCPrevention>
      </body>
    </html>
  );
}

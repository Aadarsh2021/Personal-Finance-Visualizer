import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { cn } from '@/lib/utils';
import Navigation from '@/components/Navigation';
import { AnalyticsWrapper } from '@/components/AnalyticsWrapper';

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: 'Finance Tracker - Personal Finance Management',
  description: 'Track your personal finances, manage budgets, and gain insights into your spending habits with our comprehensive finance tracker.',
  keywords: 'finance, budget, expense tracker, personal finance, money management',
  authors: [{ name: 'Finance Tracker Team' }],
  creator: 'Finance Tracker Team',
  publisher: 'Finance Tracker',
  robots: 'index, follow',
  openGraph: {
    type: 'website',
    title: 'Finance Tracker - Personal Finance Management',
    description: 'Track your personal finances, manage budgets, and gain insights into your spending habits.',
    siteName: 'Finance Tracker',
    images: [
      {
        url: '/og-image.svg',
        width: 1200,
        height: 630,
        alt: 'Finance Tracker',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Finance Tracker - Personal Finance Management',
    description: 'Track your personal finances, manage budgets, and gain insights into your spending habits.',
    images: ['/og-image.svg'],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#3b82f6',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className={cn("relative h-full font-sans antialiased", inter.variable)}>
        <AnalyticsWrapper>
          <div className="relative flex min-h-screen flex-col">
            <Navigation />
            <main className="flex-auto">{children}</main>
            <footer className="py-4 text-center text-sm text-muted-foreground">
              © {new Date().getFullYear()} Finance Tracker. All rights reserved.
            </footer>
          </div>
        </AnalyticsWrapper>
      </body>
    </html>
  );
}

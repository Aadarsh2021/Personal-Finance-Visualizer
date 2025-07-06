import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { cn } from '@/lib/utils';
import Navigation from '@/components/Navigation';

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Finance Tracker - Personal Finance Management',
  description: 'Track your personal finances, manage budgets, and gain insights into your spending habits with our comprehensive finance tracker.',
  keywords: 'finance, budget, expense tracker, personal finance, money management',
  authors: [{ name: 'Finance Tracker Team' }],
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
      <body className={cn(
        inter.variable,
        "min-h-screen bg-gradient-to-br from-background via-background to-muted/20",
        "font-sans antialiased"
      )}>
        <div className="relative min-h-screen flex flex-col">
        <Navigation />
          <main className="flex-1 container mx-auto px-4 py-6 md:py-8 lg:py-10">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
          <footer className="mt-auto py-6 border-t bg-card/50 backdrop-blur-sm">
            <div className="container mx-auto px-4 text-center">
              <p className="text-sm text-muted-foreground">
                © 2024 Finance Tracker. Built with Next.js and Tailwind CSS.
              </p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}

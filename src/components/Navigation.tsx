'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const Navigation = () => {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const links = [
    { 
      href: '/', 
      label: 'Dashboard',
      icon: '📊'
    },
    { 
      href: '/transactions', 
      label: 'Transactions',
      icon: '💰'
    },
    { 
      href: '/budgets', 
      label: 'Budgets',
      icon: '📋'
    },
  ];

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  if (!mounted) {
    return (
      <nav className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <div className="text-lg font-bold mr-8 text-gradient">Finance Tracker</div>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2 group">
              <div className="text-2xl">💳</div>
              <div className="text-xl font-bold text-gradient group-hover:scale-105 transition-transform">
                Finance Tracker
              </div>
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex ml-8 space-x-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                    'flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                  pathname === link.href
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent hover:shadow-sm'
                  )}
                >
                  <span className="text-base">{link.icon}</span>
                  <span>{link.label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={toggleMobileMenu}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              aria-label="Toggle mobile menu"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {mobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t bg-card/95 backdrop-blur-sm">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center space-x-3 px-3 py-3 rounded-lg text-base font-medium transition-colors',
                    pathname === link.href
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                )}
              >
                  <span className="text-lg">{link.icon}</span>
                  <span>{link.label}</span>
              </Link>
            ))}
          </div>
        </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation; 
'use client';

import { useState, useEffect } from 'react';
import { MonthlyChart } from '@/components/Charts';
import TransactionForm from './TransactionForm';
import TransactionList from './TransactionList';
import ErrorBoundary from '@/components/ErrorBoundary';

export default function TransactionsPage() {
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setMounted(true);
    // Test MongoDB connection
    fetch('/api/transactions')
      .then(res => {
        if (!res.ok) throw new Error('Failed to connect to database');
      })
      .catch(err => {
        console.error('Connection error:', err);
        setError(err);
      });
  }, []);

  if (error) {
    return (
      <div className="space-y-8">
        <div className="text-center space-y-2">
          <h1 className="heading-responsive font-bold text-gradient">Transaction Management</h1>
          <p className="text-muted-foreground text-responsive">
            Add, edit, and manage your financial transactions
          </p>
        </div>
        <div className="bg-destructive/10 border border-destructive/20 p-6 rounded-lg">
          <div className="flex items-center space-x-3">
            <div className="text-2xl">⚠️</div>
            <div>
              <p className="text-destructive font-medium">Connection Error</p>
              <p className="text-destructive/80 text-sm mt-1">{error.message}</p>
            </div>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 btn-primary px-4 py-2 rounded-lg text-sm font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!mounted) {
    return (
      <div className="space-y-8">
        <div className="text-center space-y-2">
          <h1 className="heading-responsive font-bold text-gradient">Transaction Management</h1>
          <p className="text-muted-foreground text-responsive">
            Add, edit, and manage your financial transactions
          </p>
        </div>
        <div className="animate-pulse space-y-8">
          <div className="h-[300px] bg-muted rounded-lg"></div>
          <div className="h-[400px] bg-muted rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="heading-responsive font-bold text-gradient">Transaction Management</h1>
          <p className="text-muted-foreground text-responsive">
            Add, edit, and manage your financial transactions
          </p>
        </div>
        
        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Chart Section */}
          <div className="lg:col-span-2">
            <div className="card-enhanced rounded-xl p-6">
              <div className="flex items-center space-x-2 mb-6">
                <span className="text-2xl">📊</span>
                <h2 className="text-xl font-semibold">Monthly Transaction Overview</h2>
              </div>
              <MonthlyChart />
            </div>
          </div>
          
          {/* Form Section */}
          <div className="lg:col-span-1">
            <div className="card-enhanced rounded-xl p-6">
              <div className="flex items-center space-x-2 mb-6">
                <span className="text-2xl">➕</span>
                <h2 className="text-xl font-semibold">Add Transaction</h2>
              </div>
              <TransactionForm />
            </div>
          </div>
        </div>

        {/* Transaction List */}
        <div className="card-enhanced rounded-xl p-6">
          <div className="flex items-center space-x-2 mb-6">
            <span className="text-2xl">📋</span>
            <h2 className="text-xl font-semibold">All Transactions</h2>
          </div>
          <TransactionList />
        </div>
      </div>
    </ErrorBoundary>
  );
} 
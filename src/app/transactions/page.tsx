'use client';

import { useState, useEffect } from 'react';
import { MonthlyChart } from '@/components/Charts';
import TransactionForm from './TransactionForm';
import TransactionList from './TransactionList';
import ErrorBoundary from '@/components/ErrorBoundary';

export default function TransactionsPage() {
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

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

  // Listen for transaction events
  useEffect(() => {
    const handleTransactionUpdate = () => {
      setRefreshKey(prev => prev + 1);
    };

    window.addEventListener('transaction-created', handleTransactionUpdate);
    window.addEventListener('transaction-updated', handleTransactionUpdate);
    window.addEventListener('transaction-deleted', handleTransactionUpdate);

    return () => {
      window.removeEventListener('transaction-created', handleTransactionUpdate);
      window.removeEventListener('transaction-updated', handleTransactionUpdate);
      window.removeEventListener('transaction-deleted', handleTransactionUpdate);
    };
  }, []);

  if (error) {
    return (
      <div className="space-y-8">
        <div className="dashboard-header">
          <h1 className="gradient-text heading-responsive">Transaction Management</h1>
          <p className="text-muted-foreground text-responsive mt-2">
            Add, edit, and manage your financial transactions
          </p>
        </div>
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6">
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
        <div className="dashboard-header">
          <h1 className="gradient-text heading-responsive">Transaction Management</h1>
          <p className="text-muted-foreground text-responsive mt-2">
            Add, edit, and manage your financial transactions
          </p>
        </div>
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="skeleton h-[400px] w-full"></div>
            </div>
            <div className="lg:col-span-1">
              <div className="skeleton h-[400px] w-full"></div>
            </div>
          </div>
          <div className="skeleton h-[500px] w-full"></div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="space-y-8">
        {/* Header */}
        <div className="dashboard-header">
          <h1 className="gradient-text heading-responsive">Transaction Management</h1>
          <p className="text-muted-foreground text-responsive mt-2">
            Add, edit, and manage your financial transactions
          </p>
        </div>
        
        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Chart Section */}
          <div className="lg:col-span-2">
            <div className="chart-card">
              <div className="flex items-center space-x-2 mb-6">
                <span className="stat-icon">📊</span>
                <h2 className="text-xl font-semibold">Monthly Transaction Overview</h2>
              </div>
              <MonthlyChart key={refreshKey} />
            </div>
          </div>
          
          {/* Form Section */}
          <div className="lg:col-span-1">
            <div className="dashboard-card">
              <div className="flex items-center space-x-2 mb-6">
                <span className="stat-icon">➕</span>
                <h2 className="text-xl font-semibold">Add Transaction</h2>
              </div>
              <TransactionForm />
            </div>
          </div>
        </div>

        {/* Transaction List */}
        <div className="dashboard-card">
          <div className="flex items-center space-x-2 mb-6">
            <span className="stat-icon">📋</span>
            <h2 className="text-xl font-semibold">All Transactions</h2>
          </div>
          <TransactionList key={refreshKey} />
        </div>
      </div>
    </ErrorBoundary>
  );
} 
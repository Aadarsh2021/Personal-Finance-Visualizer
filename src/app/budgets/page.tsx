'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import BudgetForm from './BudgetForm';
import BudgetList from './BudgetList';
import BudgetInsights from './BudgetInsights';
import BudgetSummary from './BudgetSummary';
import CompletedBudgets from './CompletedBudgets';
import { BudgetComparisonChart } from '@/components/Charts';
import ErrorBoundary from '@/components/ErrorBoundary';

export default function BudgetsPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setMounted(true);
    // Test MongoDB connection
    fetch('/api/budgets')
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
          <h1 className="heading-responsive font-bold text-gradient">Budget Management</h1>
          <p className="text-muted-foreground text-responsive">
            Set budgets, track spending, and manage your financial goals
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
          <h1 className="heading-responsive font-bold text-gradient">Budget Management</h1>
          <p className="text-muted-foreground text-responsive">
            Set budgets, track spending, and manage your financial goals
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
          <h1 className="heading-responsive font-bold text-gradient">Budget Management</h1>
          <p className="text-muted-foreground text-responsive">
            Set budgets, track spending, and manage your financial goals
          </p>
        </div>

        {/* Budget Form and Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Budget Form */}
          <div className="lg:col-span-1">
            <div className="card-enhanced rounded-xl p-6">
              <div className="flex items-center space-x-2 mb-6">
                <span className="text-2xl">➕</span>
                <h2 className="text-xl font-semibold">Create New Budget</h2>
              </div>
              <BudgetForm />
            </div>
          </div>

          {/* Budget Chart */}
          <div className="lg:col-span-2">
            <div className="card-enhanced rounded-xl p-6">
              <div className="flex items-center space-x-2 mb-6">
                <span className="text-2xl">📊</span>
                <h2 className="text-xl font-semibold">Budget vs Spending Comparison</h2>
              </div>
              <BudgetComparisonChart key={refreshKey} />
            </div>
          </div>
        </div>

        {/* Budget Summary */}
        <div className="card-enhanced rounded-xl p-6">
          <div className="flex items-center space-x-2 mb-6">
            <span className="text-2xl">📈</span>
            <h2 className="text-xl font-semibold">Budget Overview</h2>
          </div>
          <BudgetSummary />
        </div>

        {/* Active and Completed Budgets */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Active Budgets */}
          <div className="card-enhanced rounded-xl p-6">
            <div className="flex items-center space-x-2 mb-6">
              <span className="text-2xl">🎯</span>
              <h2 className="text-xl font-semibold">Active Budgets</h2>
            </div>
            <BudgetList />
          </div>
          
          {/* Completed Budgets */}
          <div className="card-enhanced rounded-xl p-6">
            <div className="flex items-center space-x-2 mb-6">
              <span className="text-2xl">✅</span>
              <h2 className="text-xl font-semibold">Completed Budgets</h2>
            </div>
            <CompletedBudgets />
          </div>
        </div>

        {/* Insights Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Budget Insights */}
          <div className="card-enhanced rounded-xl p-6">
            <div className="flex items-center space-x-2 mb-6">
              <span className="text-2xl">💡</span>
              <h2 className="text-xl font-semibold">Budget Insights</h2>
            </div>
            <BudgetInsights />
          </div>
          
          {/* Spending Insights */}
          <div className="card-enhanced rounded-xl p-6">
            <div className="flex items-center space-x-2 mb-6">
              <span className="text-2xl">📊</span>
              <h2 className="text-xl font-semibold">Spending Analysis</h2>
            </div>
            <SpendingInsights />
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}

function SpendingInsights() {
  const [insights, setInsights] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      fetchInsights();
    }
  }, [mounted]);

  async function fetchInsights() {
    try {
      setLoading(true);
      const response = await fetch('/api/statistics/insights');
      if (!response.ok) {
        throw new Error('Failed to fetch insights');
      }
      const data = await response.json();
      setInsights(data.insights);
    } catch (error: any) {
      console.error('Error fetching insights:', error);
      setError(error);
    } finally {
      setLoading(false);
    }
  }

  if (!mounted || loading) {
    return (
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="animate-shimmer h-4 bg-muted rounded"></div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-4">
        <div className="text-2xl mb-2">⚠️</div>
        <p className="text-destructive text-sm">Error loading insights</p>
      </div>
    );
  }

  if (insights.length === 0) {
    return (
      <div className="text-center py-4">
        <div className="text-2xl mb-2">📊</div>
        <p className="text-muted-foreground text-sm">No insights available yet</p>
        <p className="text-muted-foreground text-xs mt-1">Add more transactions to see insights</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {insights.map((insight, index) => (
        <div key={index} className="flex items-start space-x-3 p-3 bg-muted/30 rounded-lg">
          <div className="text-primary text-sm">💡</div>
          <p className="text-sm text-foreground leading-relaxed">{insight}</p>
        </div>
      ))}
    </div>
  );
} 
'use client';

import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { MonthlyChart, CategoryPieChart, SpendingInsights } from '@/components/Charts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Export from '@/components/Export';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

interface Transaction {
  _id: string;
  amount: number;
  description: string;
  date: string;
  category: string;
  type: 'expense' | 'income';
}

interface Summary {
  totalExpenses: number;
  totalIncome: number;
  balance: number;
  recentTransactions: Transaction[];
}

export default function DashboardPage() {
  const [summary, setSummary] = useState<Summary>({
    totalExpenses: 0,
    totalIncome: 0,
    balance: 0,
    recentTransactions: [],
  });
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchSummary = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/statistics/summary');
      if (!response.ok) {
        throw new Error('Failed to fetch summary');
      }
      const data = await response.json();
      setSummary(data);
    } catch (error) {
      console.error('Error fetching summary:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary, refreshKey]);

  // Listen for transaction updates
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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(value);
  };

  const StatCard = ({ title, value, type, icon }: { title: string; value: number; type: 'expense' | 'income' | 'balance'; icon: string; loading: boolean }) => (
    <Card className={cn(
      'stat-card',
      type === 'expense' ? 'stat-card-expense' : 
      type === 'income' ? 'stat-card-income' : 
      'stat-card-balance'
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <div className="stat-icon">{icon}</div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="skeleton h-8 w-full"></div>
        ) : (
          <p className={cn(
            "stat-value",
            type === 'expense' ? 'text-destructive' : 
            type === 'income' ? 'text-success' : 
            value >= 0 ? 'text-success' : 'text-destructive'
          )}>
            {formatCurrency(value)}
          </p>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="dashboard-header">
        <h1 className="gradient-text heading-responsive">Financial Dashboard</h1>
        <p className="text-muted-foreground text-responsive mt-2">
          Track your finances and gain insights into your spending habits
        </p>
        <div className="flex justify-center mt-6">
          <Export transactions={summary.recentTransactions} summary={summary} />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="Total Expenses" 
          value={summary.totalExpenses} 
          type="expense"
          icon="💸"
          loading={loading}
        />
        <StatCard 
          title="Total Income" 
          value={summary.totalIncome} 
          type="income"
          icon="💰"
          loading={loading}
        />
        <StatCard 
          title="Current Balance" 
          value={summary.balance} 
          type="balance"
          icon="🏦"
          loading={loading}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="chart-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span className="stat-icon">📈</span>
              <span>Monthly Spending Trend</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {loading ? (
              <div className="skeleton h-[300px] w-full"></div>
            ) : (
              <MonthlyChart key={refreshKey} />
            )}
          </CardContent>
        </Card>
        
        <Card className="chart-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span className="stat-icon">🥧</span>
              <span>Spending by Category</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {loading ? (
              <div className="skeleton h-[300px] w-full"></div>
            ) : (
              <CategoryPieChart key={refreshKey} />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Insights and Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="dashboard-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span className="stat-icon">💡</span>
              <span>Spending Insights</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="skeleton h-6 w-full"></div>
                ))}
              </div>
            ) : (
              <SpendingInsights key={refreshKey} />
            )}
          </CardContent>
        </Card>
        
        <Card className="dashboard-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span className="stat-icon">📝</span>
              <span>Recent Transactions</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="skeleton h-12 w-full"></div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {summary.recentTransactions.map((transaction) => (
                  <div key={transaction._id} className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors">
                    <div>
                      <p className="font-medium">{transaction.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(transaction.date), 'PPP')} • {transaction.category}
                      </p>
                    </div>
                    <p className={cn(
                      "font-bold",
                      transaction.type === 'expense' ? 'text-destructive' : 'text-success'
                    )}>
                      {formatCurrency(transaction.amount)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

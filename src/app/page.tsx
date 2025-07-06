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
    <Card className="card-enhanced card-hover">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
          <div className="text-2xl">{icon}</div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="animate-shimmer h-8 bg-muted rounded"></div>
        ) : (
          <p className={cn(
            "text-2xl font-bold",
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
      <div className="text-center space-y-2">
        <h1 className="heading-responsive font-bold text-gradient">Financial Dashboard</h1>
        <p className="text-muted-foreground text-responsive">
          Track your finances and gain insights into your spending habits
        </p>
        <div className="flex justify-center mt-4">
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
        <Card className="card-enhanced">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span>📈</span>
              <span>Monthly Spending Trend</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <MonthlyChart key={refreshKey} />
          </CardContent>
        </Card>
        
        <Card className="card-enhanced">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span>🥧</span>
              <span>Spending by Category</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CategoryPieChart key={refreshKey} />
          </CardContent>
        </Card>
      </div>

      {/* Insights and Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="card-enhanced">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span>💡</span>
              <span>Spending Insights</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SpendingInsights key={refreshKey} />
          </CardContent>
        </Card>
        
        <Card className="card-enhanced">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span>📝</span>
              <span>Recent Transactions</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="animate-shimmer h-12 bg-muted rounded"></div>
                ))}
              </div>
            ) : summary.recentTransactions.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <p>No recent transactions</p>
              </div>
            ) : (
              <div className="space-y-4">
                {summary.recentTransactions.map((transaction) => (
                  <div
                    key={transaction._id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{transaction.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(transaction.date), 'MMM d, yyyy')} • {transaction.category}
                      </p>
                    </div>
                    <p className={cn(
                      "font-medium",
                      transaction.amount < 0 ? "text-destructive" : "text-success"
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

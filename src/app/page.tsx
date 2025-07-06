'use client';

import { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { MonthlyChart, CategoryPieChart, SpendingInsights } from '@/components/Charts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TimePeriodSelector, TimeRange } from '@/components/TimePeriodSelector';
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
  const [timeRange, setTimeRange] = useState<TimeRange>(() => {
    const now = new Date();
    return {
      start: startOfMonth(subMonths(now, 1)),
      end: endOfMonth(now),
      period: '1m'
    };
  });

  useEffect(() => {
    fetchSummary();
  }, [timeRange]);

  // Listen for transaction updates
  useEffect(() => {
    const handleTransactionUpdate = () => {
      fetchSummary();
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

  async function fetchSummary() {
    try {
      setLoading(true);
      const response = await fetch(`/api/statistics/summary?start=${timeRange.start.toISOString()}&end=${timeRange.end.toISOString()}`);
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
  }

  const StatCard = ({ title, value, type, icon }: { title: string; value: number; type: 'expense' | 'income' | 'balance'; icon: string }) => (
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
            ${value.toFixed(2)}
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
        <div className="flex justify-center items-center gap-4 mt-4">
          <TimePeriodSelector
            value={timeRange}
            onChange={setTimeRange}
          />
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
        />
        <StatCard 
          title="Total Income" 
          value={summary.totalIncome} 
          type="income"
          icon="💰"
        />
        <StatCard 
          title="Current Balance" 
          value={summary.balance} 
          type="balance"
          icon="🏦"
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
            <MonthlyChart />
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
            <CategoryPieChart />
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
            <SpendingInsights />
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
              <div className="text-center py-8">
                <div className="text-4xl mb-4">📭</div>
                <p className="text-muted-foreground">No recent transactions</p>
                <p className="text-sm text-muted-foreground mt-1">Add your first transaction to get started</p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-medium">Date</TableHead>
                      <TableHead className="font-medium">Description</TableHead>
                      <TableHead className="font-medium">Category</TableHead>
                      <TableHead className="font-medium">Type</TableHead>
                      <TableHead className="text-right font-medium">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {summary.recentTransactions.map((transaction) => (
                      <TableRow key={transaction._id} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="font-medium">
                          {format(new Date(transaction.date), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {transaction.description}
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                            {transaction.category}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={cn(
                            "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium capitalize",
                            transaction.type === 'expense' 
                              ? 'bg-destructive/10 text-destructive' 
                              : 'bg-success/10 text-success'
                          )}>
                            {transaction.type}
                          </span>
                        </TableCell>
                        <TableCell
                          className={`text-right font-bold ${
                            transaction.type === 'expense'
                              ? 'text-destructive'
                              : 'text-success'
                          }`}
                        >
                          ${transaction.amount.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
            </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

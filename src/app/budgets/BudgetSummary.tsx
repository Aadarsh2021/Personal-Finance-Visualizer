'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface BudgetSummary {
  totalBudget: number;
  totalSpent: number;
  totalRemaining: number;
  budgetCount: number;
  overBudgetCount: number;
  warningCount: number;
  onTrackCount: number;
}

export default function BudgetSummary() {
  const [summary, setSummary] = useState<BudgetSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchBudgetSummary();
  }, [currentMonth, currentYear]);

  const fetchBudgetSummary = async () => {
    try {
      setLoading(true);
      
      // Fetch budgets for current month/year
      const budgetResponse = await fetch(`/api/budgets?month=${currentMonth}&year=${currentYear}`);
      if (!budgetResponse.ok) throw new Error('Failed to fetch budgets');
      const budgetData = await budgetResponse.json();
      
      // Fetch transactions for current month/year
      const transactionResponse = await fetch(`/api/transactions?month=${currentMonth}&year=${currentYear}`);
      if (!transactionResponse.ok) throw new Error('Failed to fetch transactions');
      const transactionData = await transactionResponse.json();
      
      const budgets = budgetData.budgets || [];
      const transactions = transactionData.transactions || [];
      
      // Calculate summary (exclude completed budgets)
      const activeBudgets = budgets.filter((budget: any) => !budget.completed);
      const totalBudget = activeBudgets.reduce((sum: number, budget: any) => sum + budget.amount, 0);
      
      let totalSpent = 0;
      let overBudgetCount = 0;
      let warningCount = 0;
      let onTrackCount = 0;
      
      activeBudgets.forEach((budget: any) => {
        const categoryTransactions = transactions.filter((t: any) => 
          t.category === budget.category && t.amount < 0
        );
        
        const spent = Math.abs(categoryTransactions.reduce((sum: number, t: any) => sum + t.amount, 0));
        totalSpent += spent;
        
        const percentage = (spent / budget.amount) * 100;
        
        if (percentage >= 100) {
          overBudgetCount++;
        } else if (percentage >= 80) {
          warningCount++;
        } else {
          onTrackCount++;
        }
      });
      
      const totalRemaining = totalBudget - totalSpent;
      
      setSummary({
        totalBudget,
        totalSpent,
        totalRemaining,
        budgetCount: activeBudgets.length,
        overBudgetCount,
        warningCount,
        onTrackCount
      });
    } catch (err) {
      console.error('Error fetching budget summary:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getMonthName = (month: number) => {
    return new Date(2000, month - 1).toLocaleString('default', { month: 'long' });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">Loading Budget Summary...</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="animate-pulse h-12 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-destructive/10 text-destructive p-4 rounded-lg">
        <p className="font-medium">Error loading budget summary</p>
        <p className="text-sm mt-1">{error}</p>
      </div>
    );
  }

  if (!summary || summary.budgetCount === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <p>No budgets set for {getMonthName(currentMonth)} {currentYear}</p>
        <p className="text-sm">Create budgets to see summary</p>
      </div>
    );
  }

  const percentageUsed = (summary.totalSpent / summary.totalBudget) * 100;
  const isOverBudget = summary.totalSpent > summary.totalBudget;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">
          {getMonthName(currentMonth)} {currentYear} Budget Summary
        </h3>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <span className="text-xl">💰</span>
              <div>
                <p className="text-sm text-muted-foreground">Total Budget</p>
                <p className="text-xl font-bold">{formatCurrency(summary.totalBudget)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <span className="text-xl">💸</span>
              <div>
                <p className="text-sm text-muted-foreground">Total Spent</p>
                <p className="text-xl font-bold">{formatCurrency(summary.totalSpent)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="sm:col-span-2 lg:col-span-1">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <span className="text-xl">{isOverBudget ? '⚠️' : '💵'}</span>
              <div>
                <p className="text-sm text-muted-foreground">Remaining</p>
                <p className={cn(
                  "text-xl font-bold",
                  isOverBudget ? "text-destructive" : "text-success"
                )}>
                  {formatCurrency(summary.totalRemaining)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Budget Usage</span>
          <span className="font-medium">{percentageUsed.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-muted rounded-full h-3">
          <div
            className={cn(
              "h-3 rounded-full transition-all duration-300",
              isOverBudget ? "bg-destructive" : 
              percentageUsed >= 80 ? "bg-warning" : "bg-success"
            )}
            style={{ width: `${Math.min(percentageUsed, 100)}%` }}
          />
        </div>
      </div>
      
      {/* Status breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="flex items-center space-x-2 p-3 bg-success/10 rounded-lg">
          <div className="w-3 h-3 bg-success rounded-full"></div>
          <div>
            <p className="text-sm text-muted-foreground">On Track</p>
            <p className="font-semibold text-success">{summary.onTrackCount}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 p-3 bg-warning/10 rounded-lg">
          <div className="w-3 h-3 bg-warning rounded-full"></div>
          <div>
            <p className="text-sm text-muted-foreground">Warning</p>
            <p className="font-semibold text-warning">{summary.warningCount}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 p-3 bg-destructive/10 rounded-lg">
          <div className="w-3 h-3 bg-destructive rounded-full"></div>
          <div>
            <p className="text-sm text-muted-foreground">Over Budget</p>
            <p className="font-semibold text-destructive">{summary.overBudgetCount}</p>
          </div>
        </div>
      </div>

      {/* Status message */}
      <div className="text-center text-muted-foreground">
        {isOverBudget ? (
          <p className="text-destructive">
            You are over budget by {formatCurrency(Math.abs(summary.totalRemaining))}
          </p>
        ) : (
          <p>
            You have {formatCurrency(summary.totalRemaining)} remaining in your budget
          </p>
        )}
      </div>
    </div>
  );
} 
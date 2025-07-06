'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, CheckCircle, TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface BudgetInsight {
  category: string;
  budget: number;
  spent: number;
  remaining: number;
  percentage: number;
  status: 'under' | 'over' | 'warning';
}

export default function BudgetInsights() {
  const [insights, setInsights] = useState<BudgetInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchBudgetInsights();
  }, [currentMonth, currentYear]);

  const fetchBudgetInsights = async () => {
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
      
      // Calculate insights (exclude completed budgets)
      const activeBudgets = budgets.filter((budget: any) => !budget.completed);
      const insights: BudgetInsight[] = activeBudgets.map((budget: any) => {
        const categoryTransactions = transactions.filter((t: any) => 
          t.category === budget.category && t.amount < 0
        );
        
        const spent = Math.abs(categoryTransactions.reduce((sum: number, t: any) => sum + t.amount, 0));
        const remaining = budget.amount - spent;
        const percentage = (spent / budget.amount) * 100;
        
        let status: 'under' | 'over' | 'warning' = 'under';
        if (percentage >= 100) {
          status = 'over';
        } else if (percentage >= 80) {
          status = 'warning';
        }
        
        return {
          category: budget.category,
          budget: budget.amount,
          spent,
          remaining,
          percentage,
          status
        };
      });
      
      setInsights(insights);
    } catch (err) {
      console.error('Error fetching budget insights:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'over':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <TrendingUp className="h-4 w-4 text-yellow-500" />;
      case 'under':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'over':
        return 'text-red-600';
      case 'warning':
        return 'text-yellow-600';
      case 'under':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  const getMonthName = (month: number) => {
    return new Date(2000, month - 1).toLocaleString('default', { month: 'long' });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Loading Budget Insights...</h3>
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="animate-pulse h-24 bg-muted rounded"></div>
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
        <p className="font-medium">Error loading budget insights</p>
        <p className="text-sm mt-1">{error}</p>
      </div>
    );
  }

  if (insights.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <p>No budgets set for {getMonthName(currentMonth)} {currentYear}</p>
        <p className="text-sm">Create budgets to see spending insights</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">
          Budget vs Spending - {getMonthName(currentMonth)} {currentYear}
        </h3>
      </div>
      
      <div className="space-y-3">
        {insights.map((insight) => (
          <Card key={insight.category} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start space-y-3 sm:space-y-0">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-xl">
                      {insight.status === 'over' ? '⚠️' : insight.status === 'warning' ? '⚡' : '✅'}
                    </span>
                    <h4 className="font-medium">{insight.category}</h4>
                  </div>
                  <div className="mt-2 space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Budget:</span>
                      <span className="font-medium">{formatCurrency(insight.budget)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Spent:</span>
                      <span className="font-medium">{formatCurrency(insight.spent)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Remaining:</span>
                      <span className={cn(
                        "font-medium",
                        insight.status === 'over' ? "text-destructive" :
                        insight.status === 'warning' ? "text-warning" : "text-success"
                      )}>
                        {formatCurrency(insight.remaining)}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="text-center sm:text-right">
                  <div className={cn(
                    "text-lg font-bold",
                    insight.status === 'over' ? "text-destructive" :
                    insight.status === 'warning' ? "text-warning" : "text-success"
                  )}>
                    {insight.percentage.toFixed(1)}%
                  </div>
                  <div className="text-xs text-muted-foreground">of budget used</div>
                </div>
              </div>
              
              {/* Progress bar */}
              <div className="mt-3">
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className={cn(
                      "h-2 rounded-full transition-all duration-300",
                      insight.status === 'over' ? "bg-destructive" :
                      insight.status === 'warning' ? "bg-warning" : "bg-success"
                    )}
                    style={{ width: `${Math.min(insight.percentage, 100)}%` }}
                  />
                </div>
              </div>
              
              {/* Status message */}
              <div className="mt-2 text-sm">
                {insight.status === 'over' ? (
                  <p className="text-destructive">
                    ⚠️ Over budget by {formatCurrency(Math.abs(insight.remaining))}
                  </p>
                ) : insight.status === 'warning' ? (
                  <p className="text-warning">
                    ⚡ {insight.percentage.toFixed(1)}% of budget used
                  </p>
                ) : (
                  <p className="text-success">
                    ✓ {formatCurrency(insight.remaining)} remaining
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
} 
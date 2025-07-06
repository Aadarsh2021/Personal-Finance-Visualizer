'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';

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
    return <div className="animate-pulse">Loading budget summary...</div>;
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  if (!summary || summary.budgetCount === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
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
              <DollarSign className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Total Budget</p>
                <p className="text-xl font-bold">${summary.totalBudget.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingDown className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-sm text-gray-600">Total Spent</p>
                <p className="text-xl font-bold">${summary.totalSpent.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="sm:col-span-2 lg:col-span-1">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className={`h-5 w-5 ${isOverBudget ? 'text-red-500' : 'text-green-500'}`} />
              <div>
                <p className="text-sm text-gray-600">Remaining</p>
                <p className={`text-xl font-bold ${isOverBudget ? 'text-red-600' : 'text-green-600'}`}>
                  ${summary.totalRemaining.toFixed(2)}
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
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all duration-300 ${
              isOverBudget ? 'bg-red-500' : percentageUsed >= 80 ? 'bg-yellow-500' : 'bg-green-500'
            }`}
            style={{ width: `${Math.min(percentageUsed, 100)}%` }}
          />
        </div>
      </div>
      
      {/* Status breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="flex items-center space-x-2 p-3 bg-green-50 rounded-lg">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <div>
            <p className="text-sm text-gray-600">On Track</p>
            <p className="font-semibold text-green-600">{summary.onTrackCount}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 p-3 bg-yellow-50 rounded-lg">
          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
          <div>
            <p className="text-sm text-gray-600">Warning</p>
            <p className="font-semibold text-yellow-600">{summary.warningCount}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 p-3 bg-red-50 rounded-lg">
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          <div>
            <p className="text-sm text-gray-600">Over Budget</p>
            <p className="font-semibold text-red-600">{summary.overBudgetCount}</p>
          </div>
        </div>
      </div>
      
      {/* Status message */}
      {isOverBudget && (
        <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertTriangle className="h-5 w-5 text-red-500" />
          <div>
            <p className="font-medium text-red-800">Over Budget</p>
            <p className="text-sm text-red-600">
              You've exceeded your total budget by ${Math.abs(summary.totalRemaining).toFixed(2)}
            </p>
          </div>
        </div>
      )}
      
      {!isOverBudget && percentageUsed >= 80 && (
        <div className="flex items-center space-x-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <AlertTriangle className="h-5 w-5 text-yellow-500" />
          <div>
            <p className="font-medium text-yellow-800">Budget Warning</p>
            <p className="text-sm text-yellow-600">
              You've used {percentageUsed.toFixed(1)}% of your total budget
            </p>
          </div>
        </div>
      )}
      
      {!isOverBudget && percentageUsed < 80 && (
        <div className="flex items-center space-x-2 p-3 bg-green-50 border border-green-200 rounded-lg">
          <TrendingUp className="h-5 w-5 text-green-500" />
          <div>
            <p className="font-medium text-green-800">On Track</p>
            <p className="text-sm text-green-600">
              You have ${summary.totalRemaining.toFixed(2)} remaining in your budget
            </p>
          </div>
        </div>
      )}
    </div>
  );
} 
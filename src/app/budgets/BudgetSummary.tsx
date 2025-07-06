'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { Budget } from '@/types';

export default function BudgetSummary() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  const fetchBudgets = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/budgets');
      if (!response.ok) {
        throw new Error('Failed to fetch budgets');
      }
      const data = await response.json();
      setBudgets(data.budgets || []);
    } catch (err) {
      console.error('Error fetching budgets:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  // Listen for budget events
  useEffect(() => {
    const handleBudgetUpdate = () => {
      fetchBudgets();
    };

    window.addEventListener('budget-created', handleBudgetUpdate);
    window.addEventListener('budget-updated', handleBudgetUpdate);
    window.addEventListener('budget-deleted', handleBudgetUpdate);
    window.addEventListener('budget-completed', handleBudgetUpdate);

    return () => {
      window.removeEventListener('budget-created', handleBudgetUpdate);
      window.removeEventListener('budget-updated', handleBudgetUpdate);
      window.removeEventListener('budget-deleted', handleBudgetUpdate);
      window.removeEventListener('budget-completed', handleBudgetUpdate);
    };
  }, [fetchBudgets]);

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

  if (budgets.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <p>No budgets set for {getMonthName(currentMonth)} {currentYear}</p>
        <p className="text-sm">Create budgets to see summary</p>
      </div>
    );
  }

  const totalBudget = budgets.reduce((sum, budget) => sum + budget.amount, 0);
  const activeBudgets = budgets.filter(budget => !budget.completed);
  const completedBudgets = budgets.filter(budget => budget.completed);
  const activeBudgetAmount = activeBudgets.reduce((sum, budget) => sum + budget.amount, 0);
  const completedBudgetAmount = completedBudgets.reduce((sum, budget) => sum + budget.amount, 0);

  const percentageUsed = (activeBudgetAmount / totalBudget) * 100;
  const isOverBudget = activeBudgetAmount > totalBudget;

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
                <p className="text-xl font-bold">{formatCurrency(totalBudget)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <span className="text-xl">💸</span>
              <div>
                <p className="text-sm text-muted-foreground">Active Budgets</p>
                <p className="text-xl font-bold">{formatCurrency(activeBudgetAmount)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="sm:col-span-2 lg:col-span-1">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <span className="text-xl">💸</span>
              <div>
                <p className="text-sm text-muted-foreground">Completed Budgets</p>
                <p className="text-xl font-bold">{formatCurrency(completedBudgetAmount)}</p>
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
            <p className="font-semibold text-success">{activeBudgets.length}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 p-3 bg-warning/10 rounded-lg">
          <div className="w-3 h-3 bg-warning rounded-full"></div>
          <div>
            <p className="text-sm text-muted-foreground">Warning</p>
            <p className="font-semibold text-warning">{budgets.filter(b => b.amount < 0).length}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 p-3 bg-destructive/10 rounded-lg">
          <div className="w-3 h-3 bg-destructive rounded-full"></div>
          <div>
            <p className="text-sm text-muted-foreground">Over Budget</p>
            <p className="font-semibold text-destructive">{budgets.filter(b => b.amount < 0).length}</p>
          </div>
        </div>
      </div>

      {/* Status message */}
      <div className="text-center text-muted-foreground">
        {isOverBudget ? (
          <p className="text-destructive">
            You are over budget by {formatCurrency(Math.abs(activeBudgetAmount - totalBudget))}
          </p>
        ) : (
          <p>
            You have {formatCurrency(Math.max(totalBudget - activeBudgetAmount, 0))} remaining in your budget
          </p>
        )}
      </div>
    </div>
  );
} 
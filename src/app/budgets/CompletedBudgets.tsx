'use client';

import { useState, useEffect, useCallback } from 'react';
import { Budget } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';

export default function CompletedBudgets() {
  const [completedBudgets, setCompletedBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCompletedBudgets = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/budgets');
      if (!response.ok) {
        throw new Error('Failed to fetch budgets');
      }
      const data = await response.json();
      const completed = (data.budgets || []).filter((budget: Budget) => budget.completed);
      setCompletedBudgets(completed);
    } catch (err) {
      console.error('Error fetching completed budgets:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCompletedBudgets();
  }, [fetchCompletedBudgets]);

  // Listen for custom events to refresh the list
  useEffect(() => {
    const handleBudgetUpdated = () => {
      fetchCompletedBudgets();
    };

    window.addEventListener('budget-created', handleBudgetUpdated);
    window.addEventListener('budget-updated', handleBudgetUpdated);
    window.addEventListener('budget-deleted', handleBudgetUpdated);
    window.addEventListener('budget-completed', handleBudgetUpdated);
    
    return () => {
      window.removeEventListener('budget-created', handleBudgetUpdated);
      window.removeEventListener('budget-updated', handleBudgetUpdated);
      window.removeEventListener('budget-deleted', handleBudgetUpdated);
      window.removeEventListener('budget-completed', handleBudgetUpdated);
    };
  }, [fetchCompletedBudgets]);

  const handleReopen = async (budgetId: string) => {
    try {
      const response = await fetch(`/api/budgets?id=${budgetId}&action=toggle-completed`, {
        method: 'PATCH',
      });

      if (!response.ok) {
        throw new Error('Failed to reopen budget');
      }

      await fetchCompletedBudgets();
      // Dispatch both updated and completed events to ensure all components refresh
      window.dispatchEvent(new CustomEvent('budget-updated'));
      window.dispatchEvent(new CustomEvent('budget-completed'));
    } catch (error) {
      console.error('Error reopening budget:', error);
      alert('Failed to reopen budget. Please try again.');
    }
  };

  const getMonthName = (month: number) => {
    return new Date(2000, month - 1).toLocaleString('default', { month: 'long' });
  };

  if (loading) {
    return <div className="animate-pulse">Loading completed budgets...</div>;
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  if (completedBudgets.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        <CheckCircle className="h-12 w-12 mx-auto text-gray-300 mb-4" />
        <p>No completed budgets</p>
        <p className="text-sm">Complete budgets will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Completed Budgets</h3>
        <span className="text-sm text-gray-500">{completedBudgets.length} completed</span>
      </div>
      
      <div className="space-y-3">
        {completedBudgets.map((budget) => (
          <Card key={budget._id} className="bg-gray-50 border-gray-200">
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <h4 className="font-medium text-gray-700">{budget.category}</h4>
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                      Completed
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {getMonthName(budget.month)} {budget.year}
                  </p>
                  <p className="text-sm text-gray-600">
                    Budget: {formatCurrency(budget.amount)}
                  </p>
                  <p className="text-xs text-red-600 font-medium mt-1">
                    ⚠️ No further payments allowed
                  </p>
                </div>
                
                <div className="flex items-center space-x-2">
                  <div className="text-right">
                    <div className="font-bold text-gray-500">
                      {formatCurrency(budget.amount)}
                    </div>
                    <div className="text-xs text-gray-400">Budget Amount</div>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleReopen(budget._id)}
                    className="text-blue-600 border-blue-200 hover:bg-blue-50"
                  >
                    <RotateCcw className="h-4 w-4 mr-1" />
                    Reopen
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
} 
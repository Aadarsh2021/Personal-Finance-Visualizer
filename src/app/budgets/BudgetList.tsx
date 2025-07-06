'use client';

import { useState, useEffect, useCallback } from 'react';
import { Budget } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { transactionCategories } from '@/types';
import { CheckCircle, XCircle } from 'lucide-react';

export default function BudgetList() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deleteBudget, setDeleteBudget] = useState<Budget | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    amount: '',
    category: '',
    month: '',
    year: '',
  });

  const fetchBudgets = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/budgets');
      if (!response.ok) {
        throw new Error('Failed to fetch budgets');
      }
      const data = await response.json();
      const activeBudgets = (data.budgets || []).filter((budget: Budget) => !budget.completed);
      setBudgets(activeBudgets);
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

  // Listen for custom events to refresh the list
  useEffect(() => {
    const handleBudgetCreated = () => {
      fetchBudgets();
    };

    window.addEventListener('budget-created', handleBudgetCreated);
    
    return () => {
      window.removeEventListener('budget-created', handleBudgetCreated);
    };
  }, [fetchBudgets]);

  const handleEdit = (budget: Budget) => {
    setEditingBudget(budget);
    setEditFormData({
      amount: budget.amount.toString(),
      category: budget.category,
      month: budget.month.toString(),
      year: budget.year.toString(),
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!editingBudget) return;

    try {
      const response = await fetch(`/api/budgets?id=${editingBudget._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: parseFloat(editFormData.amount),
          category: editFormData.category,
          month: parseInt(editFormData.month),
          year: parseInt(editFormData.year),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update budget');
      }

      setIsEditDialogOpen(false);
      setEditingBudget(null);
      fetchBudgets();
      // Dispatch event to refresh other components
      window.dispatchEvent(new CustomEvent('budget-updated'));
    } catch (error) {
      console.error('Error updating budget:', error);
      alert('Failed to update budget. Please try again.');
    }
  };

  const handleToggleCompleted = async (budgetId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/budgets?id=${budgetId}&action=toggle-completed`, {
        method: 'PATCH',
      });

      if (!response.ok) {
        throw new Error('Failed to toggle budget completion');
      }

      fetchBudgets();
      // Dispatch event to refresh other components
      window.dispatchEvent(new CustomEvent('budget-updated'));
    } catch (error) {
      console.error('Error toggling budget completion:', error);
      alert('Failed to toggle budget completion. Please try again.');
    }
  };

  const handleDelete = async (budgetId: string) => {
    try {
      const response = await fetch(`/api/budgets?id=${budgetId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete budget');
      }

      setIsDeleteDialogOpen(false);
      setDeleteBudget(null);
      fetchBudgets();
      // Dispatch event to refresh other components
      window.dispatchEvent(new CustomEvent('budget-updated'));
    } catch (error) {
      console.error('Error deleting budget:', error);
      alert('Failed to delete budget. Please try again.');
    }
  };

  const openDeleteDialog = (budget: Budget) => {
    setDeleteBudget(budget);
    setIsDeleteDialogOpen(true);
  };

  const getMonthName = (month: number) => {
    return new Date(2000, month - 1).toLocaleString('default', { month: 'long' });
  };

  if (loading) {
    return <div>Loading budgets...</div>;
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  if (!budgets || budgets.length === 0) {
    return <div>No budgets found.</div>;
  }

  return (
    <div className="space-y-4">
      {budgets.map((budget) => (
        <Card key={budget._id} className={`hover:shadow-md transition-shadow ${budget.completed ? 'bg-gray-50' : ''}`}>
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <h3 className="font-semibold">{budget.category}</h3>
                  {budget.completed && (
                    <div className="flex items-center space-x-1 text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-xs font-medium">Completed</span>
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-600">
                  {getMonthName(budget.month)} {budget.year}
                </p>
                <p className="text-sm text-gray-600">
                  Budget: ${budget.amount.toFixed(2)}
                </p>
                {budget.completed && (
                  <p className="text-xs text-red-600 font-medium">
                    ⚠️ No further payments allowed
                  </p>
                )}
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                <div className={`font-bold ${budget.completed ? 'text-gray-500' : 'text-blue-600'}`}>
                  ${budget.amount.toFixed(2)}
                </div>
                <div className="flex flex-wrap gap-1">
                  <Button
                    variant={budget.completed ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleToggleCompleted(budget._id, budget.completed)}
                    className={budget.completed ? "bg-green-600 hover:bg-green-700 text-white" : ""}
                  >
                    {budget.completed ? (
                      <>
                        <XCircle className="h-4 w-4 mr-1" />
                        Reopen
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Complete
                      </>
                    )}
                  </Button>
                  
                  <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(budget)}
                        disabled={budget.completed}
                      >
                        Edit
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit Budget</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Select
                            value={editFormData.category}
                            onValueChange={(value) => setEditFormData({
                              ...editFormData,
                              category: value
                            })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                            <SelectContent>
                              {transactionCategories.map((category) => (
                                <SelectItem key={category} value={category}>
                                  {category}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Input
                            type="number"
                            placeholder="Amount"
                            step="0.01"
                            value={editFormData.amount}
                            onChange={(e) => setEditFormData({
                              ...editFormData,
                              amount: e.target.value
                            })}
                          />
                        </div>
                        <div>
                          <Select
                            value={editFormData.month}
                            onValueChange={(value) => setEditFormData({
                              ...editFormData,
                              month: value
                            })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select month" />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from({ length: 12 }, (_, i) => ({
                                value: (i + 1).toString(),
                                label: new Date(2000, i).toLocaleString('default', { month: 'long' })
                              })).map(({ value, label }) => (
                                <SelectItem key={value} value={value}>
                                  {label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Input
                            type="number"
                            placeholder="Year"
                            min={2000}
                            value={editFormData.year}
                            onChange={(e) => setEditFormData({
                              ...editFormData,
                              year: e.target.value
                            })}
                          />
                        </div>
                        <div className="flex space-x-2">
                          <Button onClick={handleUpdate} className="flex-1">
                            Update
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setIsEditDialogOpen(false)}
                            className="flex-1"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => openDeleteDialog(budget)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Budget</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-600">
              Are you sure you want to delete this budget?
            </p>
            {deleteBudget && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="font-medium">{deleteBudget.category}</p>
                <p className="text-sm text-gray-600">
                  {getMonthName(deleteBudget.month)} {deleteBudget.year}
                </p>
                <p className="font-bold text-blue-600">
                  ${deleteBudget.amount.toFixed(2)}
                </p>
                {deleteBudget.completed && (
                  <p className="text-xs text-green-600 font-medium">
                    ✓ Completed Budget
                  </p>
                )}
              </div>
            )}
            <p className="text-sm text-red-600">
              This action cannot be undone. All budget data will be permanently deleted.
            </p>
            <div className="flex space-x-2">
              <Button
                variant="destructive"
                onClick={() => deleteBudget && handleDelete(deleteBudget._id)}
                className="flex-1"
              >
                Delete Budget
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsDeleteDialogOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 
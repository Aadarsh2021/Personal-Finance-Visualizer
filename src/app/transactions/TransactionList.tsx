'use client';

import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { Transaction } from '@/types';
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
import { formatCurrency, formatAmount } from '@/lib/utils';

export default function TransactionList() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    amount: '',
    description: '',
    date: '',
    category: '',
    type: 'expense' as 'income' | 'expense',
  });

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/transactions');
      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }
      const data = await response.json();
      setTransactions(data.transactions || []);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Listen for custom events to refresh the list
  useEffect(() => {
    const handleTransactionCreated = () => {
      fetchTransactions();
    };

    window.addEventListener('transaction-created', handleTransactionCreated);
    
    return () => {
      window.removeEventListener('transaction-created', handleTransactionCreated);
    };
  }, [fetchTransactions]);

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setEditFormData({
      amount: formatAmount(Math.abs(transaction.amount)),
      description: transaction.description,
      date: new Date(transaction.date).toISOString().split('T')[0],
      category: transaction.category,
      type: transaction.amount >= 0 ? 'income' : 'expense',
    });
    setIsEditDialogOpen(true);
  };

  const handleAmountChange = (value: string) => {
    // Remove all non-numeric characters except decimal point
    value = value.replace(/[^\d.]/g, '');
    
    // Handle multiple decimal points
    const decimalCount = (value.match(/\./g) || []).length;
    if (decimalCount > 1) {
      const parts = value.split('.');
      value = parts[0] + '.' + parts.slice(1).join('');
    }
    
    // Handle decimal places
    if (value.includes('.')) {
      const [whole, decimal] = value.split('.');
      // Limit whole number to 12 digits
      value = whole.slice(0, 12) + '.' + (decimal || '').slice(0, 2);
    } else {
      // Limit whole number to 12 digits when no decimal
      value = value.slice(0, 12);
    }

    // Format the display value
    const numericValue = parseFloat(value);
    if (!isNaN(numericValue)) {
      setEditFormData({
        ...editFormData,
        amount: formatAmount(numericValue),
      });
    } else {
      setEditFormData({
        ...editFormData,
        amount: value === '' ? '' : editFormData.amount,
      });
    }
  };

  const handleUpdate = async () => {
    if (!editingTransaction) return;

    try {
      const rawAmount = editFormData.amount.replace(/[₹,\s]/g, '');
      const numericAmount = parseFloat(parseFloat(rawAmount).toFixed(2));
      
      if (isNaN(numericAmount)) {
        throw new Error('Invalid amount');
      }

      if (numericAmount > 999999999999.99) {
        throw new Error('Amount is too large');
      }

      const finalAmount = editFormData.type === 'expense' 
        ? -Math.abs(numericAmount) 
        : Math.abs(numericAmount);

      const response = await fetch(`/api/transactions?id=${editingTransaction._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: finalAmount,
          description: editFormData.description,
          date: editFormData.date,
          category: editFormData.category,
          type: editFormData.type,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update transaction');
      }

      setIsEditDialogOpen(false);
      setEditingTransaction(null);
      fetchTransactions();
      
      // Dispatch custom event to refresh charts and dashboard
      window.dispatchEvent(new CustomEvent('transaction-updated'));
    } catch (error) {
      console.error('Error updating transaction:', error);
      alert('Failed to update transaction. Please try again.');
    }
  };

  const [deleteTransaction, setDeleteTransaction] = useState<Transaction | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleDelete = async (transactionId: string) => {
    try {
      const response = await fetch(`/api/transactions?id=${transactionId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete transaction');
      }

      setIsDeleteDialogOpen(false);
      setDeleteTransaction(null);
      fetchTransactions();
      
      // Dispatch custom event to refresh charts and dashboard
      window.dispatchEvent(new CustomEvent('transaction-deleted'));
    } catch (error) {
      console.error('Error deleting transaction:', error);
      // You could add a toast notification here instead of alert
      alert('Failed to delete transaction. Please try again.');
    }
  };

  const openDeleteDialog = (transaction: Transaction) => {
    setDeleteTransaction(transaction);
    setIsDeleteDialogOpen(true);
  };

  if (loading) {
    return <div>Loading transactions...</div>;
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  if (!transactions || transactions.length === 0) {
    return <div>No transactions found.</div>;
  }

  return (
    <div className="space-y-4">
      {transactions.map((transaction) => (
        <Card key={transaction._id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="font-semibold">{transaction.description}</h3>
                <p className="text-sm text-gray-600">
                  {format(new Date(transaction.date), 'PPP')}
                </p>
                <p className="text-sm text-gray-600">{transaction.category}</p>
              </div>
              <div className="flex items-center space-x-2">
                <div
                  className={`font-bold ${
                    transaction.amount >= 0
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}
                >
                  {transaction.amount >= 0 ? '+' : ''}
                  {formatCurrency(transaction.amount)}
                </div>
                <div className="flex space-x-1">
                  <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(transaction)}
                      >
                        Edit
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit Transaction</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                            <Input
                              type="text"
                              inputMode="decimal"
                              placeholder="0.00"
                              value={editFormData.amount}
                              onChange={(e) => handleAmountChange(e.target.value)}
                              className="pl-7"
                            />
                          </div>
                        </div>
                        <div>
                          <Input
                            type="text"
                            placeholder="Description"
                            value={editFormData.description}
                            onChange={(e) => setEditFormData({
                              ...editFormData,
                              description: e.target.value
                            })}
                          />
                        </div>
                        <div>
                          <Input
                            type="date"
                            value={editFormData.date}
                            onChange={(e) => setEditFormData({
                              ...editFormData,
                              date: e.target.value
                            })}
                          />
                        </div>
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
                          <Select
                            value={editFormData.type}
                            onValueChange={(value: 'income' | 'expense') => setEditFormData({
                              ...editFormData,
                              type: value
                            })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="expense">💸 Expense</SelectItem>
                              <SelectItem value="income">💰 Income</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            onClick={() => setIsEditDialogOpen(false)}
                          >
                            Cancel
                          </Button>
                          <Button onClick={handleUpdate}>Save Changes</Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => openDeleteDialog(transaction)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete this transaction?</p>
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteTransaction && handleDelete(deleteTransaction._id)}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 
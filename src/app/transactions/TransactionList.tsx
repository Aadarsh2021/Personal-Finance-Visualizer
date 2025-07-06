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
      amount: Math.abs(transaction.amount).toString(),
      description: transaction.description,
      date: new Date(transaction.date).toISOString().split('T')[0],
      category: transaction.category,
      type: transaction.amount >= 0 ? 'income' : 'expense',
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!editingTransaction) return;

    try {
      const finalAmount = editFormData.type === 'expense' 
        ? -Math.abs(parseFloat(editFormData.amount)) 
        : Math.abs(parseFloat(editFormData.amount));

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
                  {transaction.amount >= 0 ? '+' : ''}$
                  {Math.abs(transaction.amount).toFixed(2)}
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
                          <Input
                            type="text"
                            placeholder="Amount"
                            value={editFormData.amount}
                            onChange={(e) => setEditFormData({
                              ...editFormData,
                              amount: e.target.value.replace(/[^\d.-]/g, '')
                            })}
                          />
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
                            onValueChange={(value) => setEditFormData({
                              ...editFormData,
                              type: value as 'income' | 'expense'
                            })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="expense">Expense</SelectItem>
                              <SelectItem value="income">Income</SelectItem>
                            </SelectContent>
                          </Select>
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Transaction</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-600">
              Are you sure you want to delete this transaction?
            </p>
            {deleteTransaction && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="font-medium">{deleteTransaction.description}</p>
                <p className="text-sm text-gray-600">
                  {format(new Date(deleteTransaction.date), 'PPP')} • {deleteTransaction.category}
                </p>
                <p className={`font-bold ${
                  deleteTransaction.amount >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {deleteTransaction.amount >= 0 ? '+' : ''}${Math.abs(deleteTransaction.amount).toFixed(2)}
                </p>
              </div>
            )}
            <p className="text-sm text-red-600">
              This action cannot be undone.
            </p>
            <div className="flex space-x-2">
              <Button
                variant="destructive"
                onClick={() => deleteTransaction && handleDelete(deleteTransaction._id)}
                className="flex-1"
              >
                Delete
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
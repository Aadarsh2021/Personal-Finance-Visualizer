'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { transactionCategories } from '@/types';
import { cn } from '@/lib/utils';

const formSchema = z.object({
  amount: z.string()
    .min(1, 'Amount is required')
    .transform((val) => {
      const cleanVal = val.replace(/[$,]/g, '');
      const number = parseFloat(cleanVal);
      if (isNaN(number)) {
        throw new Error('Invalid amount');
      }
      return number;
    })
    .refine((val) => val !== 0, 'Amount cannot be zero'),
  description: z.string().min(1, 'Description is required'),
  date: z.string().min(1, 'Date is required'),
  category: z.string().min(1, 'Category is required'),
  type: z.enum(['income', 'expense']),
});

type RawFormData = {
  amount: string;
  description: string;
  date: string;
  category: string;
  type: 'income' | 'expense';
};

type TransactionFormData = z.infer<typeof formSchema>;

export default function TransactionForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const form = useForm<RawFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      type: 'expense',
      category: '',
      description: '',
      amount: '',
    },
    mode: 'onSubmit',
  });

  const onSubmit = async (data: TransactionFormData) => {
    console.log('Form submitted with data:', data);
    setIsSubmitting(true);
    setSubmitError(null);
    setHasSubmitted(true);
    
    try {
      // For expenses, make amount negative; for income, keep positive
      const finalAmount = data.type === 'expense' ? -Math.abs(data.amount) : Math.abs(data.amount);
      console.log('Final amount to send:', finalAmount);
      
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: finalAmount,
          description: data.description,
          date: data.date,
          category: data.category,
          type: data.type,
        }),
      });

      console.log('Response status:', response.status);
      const responseData = await response.json();
      console.log('Response data:', responseData);

      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to create transaction');
      }

      console.log('Transaction created successfully');
      form.reset({
        date: new Date().toISOString().split('T')[0],
        type: 'expense',
        category: '',
        description: '',
        amount: '',
      });
      setHasSubmitted(false);
      
      // Dispatch custom event to refresh transaction list
      window.dispatchEvent(new CustomEvent('transaction-created'));
    } catch (error) {
      console.error('Error creating transaction:', error);
      setSubmitError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    value = value.replace(/[^\d.-]/g, '');
    
    const parts = value.split('.');
    if (parts.length > 2) {
      value = parts[0] + '.' + parts.slice(1).join('');
    }
    
    if (parts.length === 2 && parts[1].length > 2) {
      value = parts[0] + '.' + parts[1].slice(0, 2);
    }

    form.setValue('amount', value);
  };

  const shouldShowError = (fieldName: keyof RawFormData) => {
    return hasSubmitted && form.formState.errors[fieldName];
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-6">
      {submitError && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="text-lg">⚠️</div>
            <p className="text-sm font-medium">{submitError}</p>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="amount" className="text-sm font-medium">
          Amount
        </Label>
        <Input
          id="amount"
          type="text"
          placeholder="0.00"
          {...form.register('amount')}
          onChange={handleAmountChange}
          className={cn(
            shouldShowError('amount') && "border-destructive focus-visible:ring-destructive/20"
          )}
        />
        {shouldShowError('amount') && (
          <p className="text-destructive text-xs">{form.formState.errors.amount?.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description" className="text-sm font-medium">
          Description
        </Label>
        <Input
          id="description"
          type="text"
          placeholder="Enter transaction description"
          {...form.register('description')}
          className={cn(
            shouldShowError('description') && "border-destructive focus-visible:ring-destructive/20"
          )}
        />
        {shouldShowError('description') && (
          <p className="text-destructive text-xs">{form.formState.errors.description?.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="date" className="text-sm font-medium">
          Date
        </Label>
        <Input
          id="date"
          type="date"
          {...form.register('date')}
          className={cn(
            shouldShowError('date') && "border-destructive focus-visible:ring-destructive/20"
          )}
        />
        {shouldShowError('date') && (
          <p className="text-destructive text-xs">{form.formState.errors.date?.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="category" className="text-sm font-medium">
          Category
        </Label>
        <Select 
          value={form.watch('category')} 
          onValueChange={(value) => form.setValue('category', value)}
        >
          <SelectTrigger 
            id="category"
            className={cn(
              shouldShowError('category') && "border-destructive focus-visible:ring-destructive/20"
            )}
          >
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
        {shouldShowError('category') && (
          <p className="text-destructive text-xs">{form.formState.errors.category?.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="type" className="text-sm font-medium">
          Type
        </Label>
        <Select 
          value={form.watch('type')} 
          onValueChange={(value) => form.setValue('type', value as 'income' | 'expense')}
        >
          <SelectTrigger 
            id="type"
            className={cn(
              shouldShowError('type') && "border-destructive focus-visible:ring-destructive/20"
            )}
          >
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="expense">💸 Expense</SelectItem>
            <SelectItem value="income">💰 Income</SelectItem>
          </SelectContent>
        </Select>
        {shouldShowError('type') && (
          <p className="text-destructive text-xs">{form.formState.errors.type?.message}</p>
        )}
      </div>

      <Button 
        type="submit" 
        disabled={isSubmitting}
        className="w-full"
        size="lg"
      >
        {isSubmitting ? (
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
            <span>Creating...</span>
          </div>
        ) : (
          'Create Transaction'
        )}
      </Button>
    </form>
  );
} 
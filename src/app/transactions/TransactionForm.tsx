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
import { cn, formatAmount, parseCurrencyString } from '@/lib/utils';
import { format } from 'date-fns';

const formSchema = z.object({
  amount: z.string()
    .min(1, 'Amount is required')
    .transform((val) => {
      const cleanVal = val.replace(/[₹,\s]/g, '');
      const number = parseFloat(cleanVal);
      if (isNaN(number)) {
        throw new Error('Invalid amount');
      }
      if (number > 999999999999.99) { // Limit to 12 digits before decimal
        throw new Error('Amount is too large');
      }
      return parseFloat(number.toFixed(2)); // Ensure 2 decimal places
    })
    .refine((val) => val !== 0, 'Amount cannot be zero'),
  description: z.string().min(1, 'Description is required'),
  date: z.string()
    .min(1, 'Date is required')
    .refine((date) => {
      const selectedDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return selectedDate <= today;
    }, 'Cannot select future dates'),
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
  const [displayAmount, setDisplayAmount] = useState('');

  // Get today's date in YYYY-MM-DD format for the max attribute
  const today = format(new Date(), 'yyyy-MM-dd');

  const form = useForm<RawFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: today,
      type: 'expense',
      category: '',
      description: '',
      amount: '',
    },
    mode: 'onSubmit',
  });

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    
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

    // Set the raw value for both display and form
    setDisplayAmount(value);
    form.setValue('amount', value);
  };

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
        date: today,
        type: 'expense',
        category: '',
        description: '',
        amount: '',
      });
      setDisplayAmount('');
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
          Amount (₹)
        </Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
          <Input
            id="amount"
            type="text"
            inputMode="decimal"
            placeholder="0.00"
            value={displayAmount}
            onChange={handleAmountChange}
            className={cn(
              "pl-7",
              shouldShowError('amount') && "border-destructive focus-visible:ring-destructive/20"
            )}
          />
        </div>
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
          max={today}
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
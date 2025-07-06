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

type RawFormData = {
  amount: string;
  description: string;
  date: string;
  category: string;
  type: 'income' | 'expense';
};

const formSchema = z.object({
  amount: z.string()
    .min(1, 'Amount is required')
    .refine((val) => {
      const cleanVal = val.replace(/[₹,\s]/g, '');
      const number = parseFloat(cleanVal);
      return !isNaN(number) && number > 0;
    }, 'Please enter a valid positive number')
    .transform((val) => {
      const cleanVal = val.replace(/[₹,\s]/g, '');
      const number = parseFloat(cleanVal);
      if (isNaN(number)) {
        throw new Error('Invalid amount');
      }
      if (number <= 0) {
        throw new Error('Amount must be positive');
      }
      if (number > 999999999999.99) {
        throw new Error('Amount is too large (max 12 digits before decimal)');
      }
      return parseFloat(number.toFixed(2));
    }),
  description: z.string().min(1, 'Description is required'),
  date: z.string()
    .min(1, 'Date is required')
    .refine((date) => {
      const selectedDate = new Date(date);
      return !isNaN(selectedDate.getTime());
    }, 'Invalid date format')
    .refine((date) => {
      const selectedDate = new Date(date);
      const minDate = new Date('2000-01-01');
      const maxDate = new Date('2100-12-31');
      return selectedDate >= minDate && selectedDate <= maxDate;
    }, 'Date must be between year 2000 and 2100'),
  category: z.string().min(1, 'Please select a category'),
  type: z.enum(['income', 'expense'], {
    required_error: 'Please select a transaction type',
  }),
});

type TransactionFormData = z.infer<typeof formSchema>;

export default function TransactionForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [displayAmount, setDisplayAmount] = useState('');

  const form = useForm<RawFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: format(new Date(), 'yyyy-MM-dd'),
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
    value = value.replace(/[^0-9.]/g, '');
    
    // Ensure only one decimal point
    const parts = value.split('.');
    if (parts.length > 2) {
      value = parts[0] + '.' + parts.slice(1).join('');
    }
    
    // Limit decimal places to 2
    if (parts.length === 2 && parts[1].length > 2) {
      value = parts[0] + '.' + parts[1].slice(0, 2);
    }

    // Format with commas for thousands
    if (value) {
      const number = parseFloat(value);
      if (!isNaN(number)) {
        // Use Indian number formatting
        const formattedNumber = new Intl.NumberFormat('en-IN', {
          maximumFractionDigits: 2,
          minimumFractionDigits: 0,
          useGrouping: true,
        }).format(number);
        setDisplayAmount(formattedNumber);
        // Store the raw number string without formatting
        form.setValue('amount', number.toString(), { shouldValidate: true });
      }
    } else {
      setDisplayAmount('');
      form.setValue('amount', '', { shouldValidate: true });
    }
  };

  const onSubmit = async (data: RawFormData) => {
    setIsSubmitting(true);
    setSubmitError(null);
    setHasSubmitted(true);
    
    try {
      // Parse amount and handle validation
      const cleanAmount = data.amount.toString().replace(/[₹,\s]/g, '');
      const parsedAmount = parseFloat(cleanAmount);
      if (isNaN(parsedAmount)) {
        throw new Error('Invalid amount format');
      }

      // Always store positive amount for income and negative for expense
      const finalAmount = data.type === 'expense' ? -Math.abs(parsedAmount) : Math.abs(parsedAmount);
      
      const requestBody = {
        amount: finalAmount,
        description: data.description.trim(),
        date: data.date,
        category: data.category,
        type: data.type,
      };

      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create transaction');
      }

      // Reset form
      form.reset({
        date: format(new Date(), 'yyyy-MM-dd'),
        type: 'expense', // Default to expense
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
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {submitError && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="text-lg">⚠️</div>
            <p className="text-sm font-medium">{submitError}</p>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label className="text-sm font-medium">Transaction Type</Label>
        <div className="flex gap-4">
          <div className="flex items-center space-x-2">
            <input
              type="radio"
              id="expense"
              value="expense"
              {...form.register('type')}
              className="radio-primary"
              defaultChecked
            />
            <Label htmlFor="expense" className="cursor-pointer">Expense</Label>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="radio"
              id="income"
              value="income"
              {...form.register('type')}
              className="radio-primary"
            />
            <Label htmlFor="income" className="cursor-pointer">Income</Label>
          </div>
        </div>
        {shouldShowError('type') && (
          <p className="text-destructive text-sm">{form.formState.errors.type?.message}</p>
        )}
      </div>

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
          <p className="text-destructive text-sm">{form.formState.errors.amount?.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">Category</Label>
        <Select 
          value={form.watch('category')} 
          onValueChange={(value) => form.setValue('category', value, { shouldValidate: true })}
        >
          <SelectTrigger className={cn(
            shouldShowError('category') && "border-destructive focus-visible:ring-destructive/20"
          )}>
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
          <p className="text-destructive text-sm">{form.formState.errors.category?.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description" className="text-sm font-medium">
          Description
        </Label>
        <Input
          id="description"
          type="text"
          {...form.register('description')}
          className={cn(
            shouldShowError('description') && "border-destructive focus-visible:ring-destructive/20"
          )}
        />
        {shouldShowError('description') && (
          <p className="text-destructive text-sm">{form.formState.errors.description?.message}</p>
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
          <p className="text-destructive text-sm">{form.formState.errors.date?.message}</p>
        )}
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Creating...' : 'Create Transaction'}
      </Button>
    </form>
  );
} 
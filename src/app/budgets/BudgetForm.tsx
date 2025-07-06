'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { transactionCategories } from '@/types';
import { formatAmount } from '@/lib/utils';
import { cn } from '@/lib/utils';

const formSchema = z.object({
  category: z.string().min(1, 'Category is required'),
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
      if (number <= 0) {
        throw new Error('Amount must be positive');
      }
      return parseFloat(number.toFixed(2)); // Ensure 2 decimal places
    }),
  month: z.coerce
    .number({ required_error: 'Month is required' })
    .min(1, 'Month must be between 1 and 12')
    .max(12, 'Month must be between 1 and 12'),
  year: z.coerce
    .number({ required_error: 'Year is required' })
    .min(2000, 'Year must be 2000 or later'),
  completed: z.boolean().default(false),
});

type RawFormData = {
  category: string;
  amount: string;
  month: number;
  year: number;
  completed: boolean;
};

type ProcessedFormData = {
  category: string;
  amount: number;
  month: number;
  year: number;
  completed: boolean;
};

export default function BudgetForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [displayAmount, setDisplayAmount] = useState('');

  const form = useForm<RawFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      category: '',
      amount: '',
      completed: false,
    },
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

  const onSubmit = async (data: RawFormData) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Parse the amount string to number
      const amount = parseFloat(data.amount.replace(/[₹,\s]/g, ''));
      if (isNaN(amount)) {
        throw new Error('Invalid amount');
      }

      const processedData: ProcessedFormData = {
        ...data,
        amount: amount,
      };

      const response = await fetch('/api/budgets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(processedData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create budget');
      }

      // Reset form but keep the month and year
      form.reset({
        month: data.month,
        year: data.year,
        category: '',
        amount: '',
        completed: false,
      });
      setDisplayAmount('');

      // Dispatch custom event to refresh budget list
      window.dispatchEvent(new CustomEvent('budget-created'));
    } catch (error) {
      console.error('Error creating budget:', error);
      setSubmitError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const months = Array.from({ length: 12 }, (_, i) => ({
    value: (i + 1).toString(),
    label: new Date(2000, i).toLocaleString('default', { month: 'long' })
  }));

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      {submitError && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-md">
          {submitError}
        </div>
      )}

      <div>
        <Select 
          value={form.watch('category')} 
          onValueChange={(value) => form.setValue('category', value, { shouldValidate: true, shouldTouch: true })}
        >
          <SelectTrigger className={form.formState.errors.category ? 'border-red-500' : ''}>
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
        {form.formState.errors.category && form.formState.touchedFields.category && (
          <p className="text-red-500 text-sm mt-1">{form.formState.errors.category.message}</p>
        )}
      </div>

      <div>
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
              form.formState.errors.amount ? "border-red-500" : ""
            )}
          />
        </div>
        {form.formState.errors.amount && form.formState.touchedFields.amount && (
          <p className="text-red-500 text-sm mt-1">{form.formState.errors.amount.message}</p>
        )}
      </div>

      <div>
        <Select 
          value={form.watch('month')?.toString()} 
          onValueChange={(value) => form.setValue('month', parseInt(value), { shouldValidate: true, shouldTouch: true })}
        >
          <SelectTrigger className={form.formState.errors.month ? 'border-red-500' : ''}>
            <SelectValue placeholder="Select month" />
          </SelectTrigger>
          <SelectContent>
            {months.map(({ value, label }) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {form.formState.errors.month && form.formState.touchedFields.month && (
          <p className="text-red-500 text-sm mt-1">{form.formState.errors.month.message}</p>
        )}
      </div>

      <div>
        <Input
          type="number"
          placeholder="Year"
          min={2000}
          {...form.register('year')}
          className={form.formState.errors.year ? 'border-red-500' : ''}
        />
        {form.formState.errors.year && form.formState.touchedFields.year && (
          <p className="text-red-500 text-sm mt-1">{form.formState.errors.year.message}</p>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="completed"
          checked={form.watch('completed')}
          onCheckedChange={(checked) => form.setValue('completed', checked as boolean)}
        />
        <Label htmlFor="completed" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          Mark as completed (no further payments allowed)
        </Label>
      </div>

      <Button 
        type="submit" 
        disabled={isSubmitting}
        className="w-full"
      >
        {isSubmitting ? 'Creating...' : 'Create Budget'}
      </Button>
    </form>
  );
} 
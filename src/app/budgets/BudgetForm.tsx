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
  month: z.coerce
    .number({ required_error: 'Month is required' })
    .min(1, 'Month must be between 1 and 12')
    .max(12, 'Month must be between 1 and 12')
    .int('Month must be a whole number'),
  year: z.coerce
    .number({ required_error: 'Year is required' })
    .min(2000, 'Year must be 2000 or later')
    .max(2100, 'Year must be 2100 or earlier')
    .int('Year must be a whole number'),
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
  const [hasSubmitted, setHasSubmitted] = useState(false);

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
      // Parse and validate amount
      const cleanAmount = data.amount.toString().replace(/[₹,\s]/g, '');
      const amount = parseFloat(cleanAmount);
      if (isNaN(amount)) {
        throw new Error('Invalid amount format');
      }

      // Validate month and year
      const currentDate = new Date();
      const budgetDate = new Date(data.year, data.month - 1);
      
      // Don't allow budgets more than 2 years in the future
      const maxDate = new Date();
      maxDate.setFullYear(currentDate.getFullYear() + 2);
      
      if (budgetDate < new Date(2000, 0)) {
        throw new Error('Budget date cannot be before year 2000');
      }
      
      if (budgetDate > maxDate) {
        throw new Error('Budget date cannot be more than 2 years in the future');
      }

      const processedData: ProcessedFormData = {
        ...data,
        amount: parseFloat(amount.toFixed(2)),
        month: Math.floor(data.month),
        year: Math.floor(data.year),
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
      setHasSubmitted(false);

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

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium">Month</Label>
          <Select 
            value={form.watch('month').toString()} 
            onValueChange={(value) => form.setValue('month', parseInt(value), { shouldValidate: true })}
          >
            <SelectTrigger className={cn(
              shouldShowError('month') && "border-destructive focus-visible:ring-destructive/20"
            )}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {months.map(({ value, label }) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {shouldShowError('month') && (
            <p className="text-destructive text-sm">{form.formState.errors.month?.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="year" className="text-sm font-medium">
            Year
          </Label>
          <Input
            id="year"
            type="number"
            min="2000"
            max="2100"
            {...form.register('year')}
            className={cn(
              shouldShowError('year') && "border-destructive focus-visible:ring-destructive/20"
            )}
          />
          {shouldShowError('year') && (
            <p className="text-destructive text-sm">{form.formState.errors.year?.message}</p>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="completed"
          checked={form.watch('completed')}
          onCheckedChange={(checked) => form.setValue('completed', checked as boolean)}
        />
        <Label htmlFor="completed" className="text-sm font-medium cursor-pointer">
          Mark as completed
        </Label>
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Creating...' : 'Create Budget'}
      </Button>
    </form>
  );
} 
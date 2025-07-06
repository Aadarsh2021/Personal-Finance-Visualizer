export const transactionCategories = [
  'Food & Dining',
  'Transportation',
  'Shopping',
  'Bills & Utilities',
  'Entertainment',
  'Health & Fitness',
  'Travel',
  'Education',
  'Investments',
  'Other'
] as const;

export type TransactionCategory = typeof transactionCategories[number];
export type TransactionType = 'income' | 'expense';

export interface Transaction {
  _id: string;
  amount: number;
  description: string;
  date: string;
  category: TransactionCategory;
  type: TransactionType;
  createdAt: string;
  updatedAt: string;
}

export interface Budget {
  _id: string;
  category: TransactionCategory;
  amount: number;
  month: number;
  year: number;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
} 
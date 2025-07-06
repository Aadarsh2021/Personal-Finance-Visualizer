'use client';

import { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TimePeriodSelect, TIME_PERIODS } from '@/components/ui/time-period-select';

interface MonthlyData {
  month: string;
  expenses: number;
  income: number;
}

interface CategoryData {
  category: string;
  amount: number;
}

interface BudgetComparisonData {
  category: string;
  budget: number;
  actual: number;
  remaining: number;
}

const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD', '#D4A5A5', '#9E579D', '#574B90'];

function LoadingChart() {
  return (
    <div className="h-[300px] flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
    </div>
  );
}

export function MonthlyChart() {
  const [data, setData] = useState<MonthlyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [timePeriod, setTimePeriod] = useState('1m');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      fetchMonthlyData();
    }
  }, [mounted, timePeriod]);

  // Listen for transaction updates
  useEffect(() => {
    const handleTransactionUpdate = () => {
      fetchMonthlyData();
    };

    window.addEventListener('transaction-created', handleTransactionUpdate);
    window.addEventListener('transaction-updated', handleTransactionUpdate);
    window.addEventListener('transaction-deleted', handleTransactionUpdate);
    
    return () => {
      window.removeEventListener('transaction-created', handleTransactionUpdate);
      window.removeEventListener('transaction-updated', handleTransactionUpdate);
      window.removeEventListener('transaction-deleted', handleTransactionUpdate);
    };
  }, [mounted]);

  async function fetchMonthlyData() {
    try {
      setLoading(true);
      const endDate = new Date();
      const months = TIME_PERIODS.find(p => p.value === timePeriod)?.months || 1;
      const startDate = subMonths(endDate, months);

      const response = await fetch(
        `/api/statistics?start=${startOfMonth(startDate).toISOString()}&end=${endDate.toISOString()}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch monthly data');
      }

      const monthlyData = await response.json();
      const formattedData = monthlyData.map((item: any) => ({
        month: format(new Date(item.month), 'MMM yyyy'),
        expenses: Math.abs(item.expenses),
        income: item.income,
      }));

      setData(formattedData);
    } catch (error) {
      console.error('Error fetching monthly data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (!mounted || loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Monthly Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <LoadingChart />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Monthly Overview</CardTitle>
        <TimePeriodSelect value={timePeriod} onValueChange={setTimePeriod} />
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip
                formatter={(value: number) => [`$${value.toFixed(2)}`, '']}
                labelFormatter={(label) => `Month: ${label}`}
              />
              <Bar dataKey="expenses" fill="#ef4444" name="Expenses" />
              <Bar dataKey="income" fill="#22c55e" name="Income" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export function CategoryPieChart() {
  const [data, setData] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [timePeriod, setTimePeriod] = useState('1m');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      fetchCategoryData();
    }
  }, [mounted, timePeriod]);

  // Listen for transaction updates
  useEffect(() => {
    const handleTransactionUpdate = () => {
      fetchCategoryData();
    };

    window.addEventListener('transaction-created', handleTransactionUpdate);
    window.addEventListener('transaction-updated', handleTransactionUpdate);
    window.addEventListener('transaction-deleted', handleTransactionUpdate);
    
    return () => {
      window.removeEventListener('transaction-created', handleTransactionUpdate);
      window.removeEventListener('transaction-updated', handleTransactionUpdate);
      window.removeEventListener('transaction-deleted', handleTransactionUpdate);
    };
  }, [mounted]);

  async function fetchCategoryData() {
    try {
      setLoading(true);
      const endDate = new Date();
      const months = TIME_PERIODS.find(p => p.value === timePeriod)?.months || 1;
      const startDate = subMonths(endDate, months);

      const response = await fetch(
        `/api/statistics/categories?start=${startOfMonth(startDate).toISOString()}&end=${endDate.toISOString()}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch category data');
      }

      const categoryData = await response.json();
      setData(categoryData);
    } catch (error) {
      console.error('Error fetching category data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div>Loading chart...</div>;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Expense Categories</CardTitle>
        <TimePeriodSelect value={timePeriod} onValueChange={setTimePeriod} />
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="amount"
                nameKey="category"
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="#8884d8"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export function BudgetComparisonChart() {
  const [data, setData] = useState<BudgetComparisonData[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [timePeriod, setTimePeriod] = useState('1m');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      fetchBudgetData();
    }
  }, [mounted, timePeriod]);

  // Listen for transaction and budget updates
  useEffect(() => {
    const handleUpdate = () => {
      fetchBudgetData();
    };

    window.addEventListener('transaction-created', handleUpdate);
    window.addEventListener('transaction-updated', handleUpdate);
    window.addEventListener('transaction-deleted', handleUpdate);
    window.addEventListener('budget-created', handleUpdate);
    window.addEventListener('budget-updated', handleUpdate);
    window.addEventListener('budget-deleted', handleUpdate);
    
    return () => {
      window.removeEventListener('transaction-created', handleUpdate);
      window.removeEventListener('transaction-updated', handleUpdate);
      window.removeEventListener('transaction-deleted', handleUpdate);
      window.removeEventListener('budget-created', handleUpdate);
      window.removeEventListener('budget-updated', handleUpdate);
      window.removeEventListener('budget-deleted', handleUpdate);
    };
  }, [mounted]);

  async function fetchBudgetData() {
    try {
      setLoading(true);
      const endDate = new Date();
      const months = TIME_PERIODS.find(p => p.value === timePeriod)?.months || 1;
      const startDate = subMonths(endDate, months);

      const response = await fetch(
        `/api/statistics/budget-comparison?start=${startOfMonth(startDate).toISOString()}&end=${endDate.toISOString()}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch budget comparison data');
      }

      const budgetData = await response.json();
      setData(budgetData);
    } catch (error) {
      console.error('Error fetching budget comparison data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (!mounted || loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Budget vs Actual</CardTitle>
        </CardHeader>
        <CardContent>
          <LoadingChart />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Budget vs Actual</CardTitle>
        <TimePeriodSelect value={timePeriod} onValueChange={setTimePeriod} />
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" />
              <YAxis />
              <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
              <Bar dataKey="budget" fill="#4ade80" name="Budget" />
              <Bar dataKey="actual" fill="#f87171" name="Actual" />
              <Bar dataKey="remaining" fill="#60a5fa" name="Remaining" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export function SpendingInsights() {
  const [insights, setInsights] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      fetchInsights();
    }
  }, [mounted]);

  // Listen for transaction and budget updates
  useEffect(() => {
    const handleUpdate = () => {
      fetchInsights();
    };

    window.addEventListener('transaction-created', handleUpdate);
    window.addEventListener('transaction-updated', handleUpdate);
    window.addEventListener('transaction-deleted', handleUpdate);
    window.addEventListener('budget-created', handleUpdate);
    window.addEventListener('budget-updated', handleUpdate);
    window.addEventListener('budget-deleted', handleUpdate);
    
    return () => {
      window.removeEventListener('transaction-created', handleUpdate);
      window.removeEventListener('transaction-updated', handleUpdate);
      window.removeEventListener('transaction-deleted', handleUpdate);
      window.removeEventListener('budget-created', handleUpdate);
      window.removeEventListener('budget-updated', handleUpdate);
      window.removeEventListener('budget-deleted', handleUpdate);
    };
  }, [mounted]);

  async function fetchInsights() {
    try {
      setLoading(true);
      const response = await fetch('/api/statistics/insights');
      if (!response.ok) {
        throw new Error('Failed to fetch insights');
      }
      const data = await response.json();
      setInsights(data.insights || []);
    } catch (error) {
      console.error('Error fetching insights:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Spending Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Spending Insights</CardTitle>
      </CardHeader>
      <CardContent>
        {insights.length > 0 ? (
          <div className="space-y-2">
            {insights.map((insight, index) => (
              <div key={index} className="text-sm text-gray-600 p-2 bg-gray-50 rounded">
                {insight}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-gray-500">
            No insights available yet. Add more transactions to see spending patterns.
          </div>
        )}
      </CardContent>
    </Card>
  );
} 
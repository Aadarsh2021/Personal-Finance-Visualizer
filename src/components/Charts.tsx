'use client';

import { useState, useEffect, useMemo, useCallback, memo } from 'react';
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
import { formatCurrency } from '@/lib/utils';

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

const LoadingChart = memo(function LoadingChart() {
  return (
    <div className="h-[300px] flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
    </div>
  );
});

const ErrorMessage = memo(function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="h-[300px] flex items-center justify-center">
      <div className="text-destructive text-center">
        <p className="text-lg">⚠️</p>
        <p>{message}</p>
      </div>
    </div>
  );
});

const NoDataMessage = memo(function NoDataMessage() {
  return (
    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
      No data available for the selected period
    </div>
  );
});

const ChartContainer = memo(function ChartContainer({ children }: { children: React.ReactElement }) {
  return (
    <div className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </div>
  );
});

export const MonthlyChart = memo(function MonthlyChart() {
  const [data, setData] = useState<MonthlyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [timePeriod, setTimePeriod] = useState('1m');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchMonthlyData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const endDate = new Date();
      const months = TIME_PERIODS.find(p => p.value === timePeriod)?.months || 1;
      const startDate = subMonths(endDate, months - 1);

      const response = await fetch(
        `/api/statistics?start=${startOfMonth(startDate).toISOString()}&end=${endOfMonth(endDate).toISOString()}`,
        { cache: 'no-store' }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch monthly data');
      }

      const monthlyData = await response.json();
      
      if (!Array.isArray(monthlyData) || monthlyData.length === 0) {
        setData([]);
        return;
      }

      const formattedData = monthlyData.map((item: any) => ({
        month: format(new Date(item.month), 'MMM yyyy'),
        expenses: Math.abs(item.expenses || 0),
        income: Math.abs(item.income || 0),
      }));

      setData(formattedData);
    } catch (error) {
      console.error('Error fetching monthly data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load chart data');
    } finally {
      setLoading(false);
    }
  }, [timePeriod]);

  useEffect(() => {
    if (mounted) {
      fetchMonthlyData();
    }
  }, [mounted, fetchMonthlyData, refreshKey]);

  useEffect(() => {
    const handleTransactionUpdate = () => {
      setRefreshKey(prev => prev + 1);
    };

    window.addEventListener('transaction-created', handleTransactionUpdate);
    window.addEventListener('transaction-updated', handleTransactionUpdate);
    window.addEventListener('transaction-deleted', handleTransactionUpdate);
    
    return () => {
      window.removeEventListener('transaction-created', handleTransactionUpdate);
      window.removeEventListener('transaction-updated', handleTransactionUpdate);
      window.removeEventListener('transaction-deleted', handleTransactionUpdate);
    };
  }, []);

  const chartContent = useMemo(() => {
    if (loading) return <LoadingChart />;
    if (error) return <ErrorMessage message={error} />;
    if (data.length === 0) return <NoDataMessage />;

    return (
      <ChartContainer>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis tickFormatter={(value) => formatCurrency(value).replace('₹', '₹ ')} />
          <Tooltip
            formatter={(value: number, name: string) => [formatCurrency(value), name]}
            labelFormatter={(label) => `Month: ${label}`}
          />
          <Bar dataKey="expenses" fill="#ef4444" name="Expenses" />
          <Bar dataKey="income" fill="#22c55e" name="Income" />
        </BarChart>
      </ChartContainer>
    );
  }, [loading, error, data]);

  if (!mounted) return null;
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Monthly Overview</CardTitle>
        <TimePeriodSelect value={timePeriod} onValueChange={setTimePeriod} />
      </CardHeader>
      <CardContent>
        {chartContent}
      </CardContent>
    </Card>
  );
});

export function CategoryPieChart() {
  const [data, setData] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [timePeriod, setTimePeriod] = useState('1m');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      fetchCategoryData();
    }
  }, [mounted, timePeriod, refreshKey]);

  useEffect(() => {
    const handleTransactionUpdate = () => {
      setRefreshKey(prev => prev + 1);
    };

    window.addEventListener('transaction-created', handleTransactionUpdate);
    window.addEventListener('transaction-updated', handleTransactionUpdate);
    window.addEventListener('transaction-deleted', handleTransactionUpdate);
    
    return () => {
      window.removeEventListener('transaction-created', handleTransactionUpdate);
      window.removeEventListener('transaction-updated', handleTransactionUpdate);
      window.removeEventListener('transaction-deleted', handleTransactionUpdate);
    };
  }, []);

  async function fetchCategoryData() {
    try {
      setLoading(true);
      setError(null);
      const endDate = new Date();
      const months = TIME_PERIODS.find(p => p.value === timePeriod)?.months || 1;
      const startDate = subMonths(endDate, months - 1); // Subtract (months - 1) to include current month

      const response = await fetch(
        `/api/statistics/categories?start=${startOfMonth(startDate).toISOString()}&end=${endOfMonth(endDate).toISOString()}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch category data');
      }

      const categoryData = await response.json();
      
      if (!Array.isArray(categoryData) || categoryData.length === 0) {
        setData([]);
        return;
      }

      setData(categoryData);
    } catch (error) {
      console.error('Error fetching category data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load chart data');
    } finally {
      setLoading(false);
    }
  }

  if (!mounted) return null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Expense by Category</CardTitle>
        <TimePeriodSelect value={timePeriod} onValueChange={setTimePeriod} />
      </CardHeader>
      <CardContent>
        {loading ? (
          <LoadingChart />
        ) : error ? (
          <ErrorMessage message={error} />
        ) : data.length === 0 ? (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            No data available for the selected period
          </div>
        ) : (
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="amount"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  label={(entry) => `${entry.category}: ${formatCurrency(entry.amount)}`}
                >
                  {data.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function BudgetComparisonChart() {
  const [data, setData] = useState<BudgetComparisonData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      fetchBudgetData();
    }
  }, [mounted, refreshKey]);

  useEffect(() => {
    const handleUpdate = () => {
      setRefreshKey(prev => prev + 1);
    };

    window.addEventListener('budget-created', handleUpdate);
    window.addEventListener('budget-updated', handleUpdate);
    window.addEventListener('budget-deleted', handleUpdate);
    window.addEventListener('transaction-created', handleUpdate);
    window.addEventListener('transaction-updated', handleUpdate);
    window.addEventListener('transaction-deleted', handleUpdate);
    
    return () => {
      window.removeEventListener('budget-created', handleUpdate);
      window.removeEventListener('budget-updated', handleUpdate);
      window.removeEventListener('budget-deleted', handleUpdate);
      window.removeEventListener('transaction-created', handleUpdate);
      window.removeEventListener('transaction-updated', handleUpdate);
      window.removeEventListener('transaction-deleted', handleUpdate);
    };
  }, []);

  async function fetchBudgetData() {
    try {
      setLoading(true);
      setError(null);

      // Get current month's date range
      const now = new Date();
      const startDate = startOfMonth(now);
      const endDate = endOfMonth(now);

      const response = await fetch(
        `/api/budgets/comparison?start=${startDate.toISOString()}&end=${endDate.toISOString()}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch budget data');
      }

      const budgetData = await response.json();
      
      if (!Array.isArray(budgetData) || budgetData.length === 0) {
        setData([]);
        return;
      }

      setData(budgetData);
    } catch (error) {
      console.error('Error fetching budget data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load chart data');
    } finally {
      setLoading(false);
    }
  }

  if (!mounted) return null;

  return (
    <div className="w-full">
      {loading ? (
        <LoadingChart />
      ) : error ? (
        <ErrorMessage message={error} />
      ) : data.length === 0 ? (
        <div className="h-[300px] flex items-center justify-center text-muted-foreground">
          No budget data available for this month
        </div>
      ) : (
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" />
              <YAxis tickFormatter={(value) => formatCurrency(value).replace('₹', '₹ ')} />
              <Tooltip
                formatter={(value: number, name: string) => [formatCurrency(value), name === 'actual' ? 'Spent' : name === 'budget' ? 'Budget' : 'Remaining']}
                labelFormatter={(label) => `Category: ${label}`}
              />
              <Bar dataKey="budget" fill="#22c55e" name="Budget" />
              <Bar dataKey="actual" fill="#ef4444" name="Spent" />
              <Bar dataKey="remaining" fill="#3b82f6" name="Remaining" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

export function SpendingInsights() {
  const [insights, setInsights] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [mounted, setMounted] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      fetchInsights();
    }
  }, [mounted, refreshKey]);

  useEffect(() => {
    const handleUpdate = () => {
      setRefreshKey(prev => prev + 1);
    };

    window.addEventListener('transaction-created', handleUpdate);
    window.addEventListener('transaction-updated', handleUpdate);
    window.addEventListener('transaction-deleted', handleUpdate);
    
    return () => {
      window.removeEventListener('transaction-created', handleUpdate);
      window.removeEventListener('transaction-updated', handleUpdate);
      window.removeEventListener('transaction-deleted', handleUpdate);
    };
  }, []);

  async function fetchInsights() {
    try {
      setLoading(true);
      const response = await fetch('/api/statistics/insights');
      if (!response.ok) {
        throw new Error('Failed to fetch insights');
      }
      const data = await response.json();
      setInsights(data.insights);
    } catch (error: any) {
      console.error('Error fetching insights:', error);
      setError(error);
    } finally {
      setLoading(false);
    }
  }

  if (!mounted) return null;

  return (
    <div>
      {loading ? (
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-6 bg-muted rounded"></div>
          ))}
        </div>
      ) : error ? (
        <div className="text-destructive">
          <p>Failed to load insights</p>
          <p className="text-sm">{error.message}</p>
        </div>
      ) : insights.length === 0 ? (
        <p className="text-muted-foreground">No insights available</p>
      ) : (
        <ul className="space-y-3">
          {insights.map((insight, index) => (
            <li key={index} className="flex items-start space-x-2">
              <span className="text-lg">💡</span>
              <span>{insight}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
} 
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Transaction } from '@/models/Transaction';
import { Budget } from '@/models/Budget';
import { startOfMonth, endOfMonth, getMonth, getYear } from 'date-fns';

interface BudgetAccumulator {
  [category: string]: {
    total: number;
    count: number;
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const start = searchParams.get('start');
    const end = searchParams.get('end');

    if (!start || !end) {
      return NextResponse.json(
        { error: 'Start and end dates are required' },
        { status: 400 }
      );
    }

    const startDate = new Date(start);
    const endDate = new Date(end);

    await connectToDatabase();

    // Get actual expenses by category (negative amounts)
    const actualExpenses = await Transaction.aggregate([
      {
        $match: {
          amount: { $lt: 0 }, // Only negative amounts (expenses)
          date: {
            $gte: startDate,
            $lte: endDate,
          },
        },
      },
      {
        $group: {
          _id: '$category',
          actual: { $sum: { $abs: '$amount' } }, // Sum absolute values
        },
      },
    ]);

    // Generate date range criteria for budgets
    const dateRangeCriteria = Array.from({ length: 12 }, (_, i) => {
      const date = new Date(startDate);
      date.setMonth(startDate.getMonth() + i);
      if (date > endDate) return null;
      return {
        month: getMonth(date) + 1,
        year: getYear(date),
      };
    }).filter((criteria): criteria is { month: number; year: number } => criteria !== null);

    // Get all budgets for the date range
    const budgets = await Budget.find({
      $or: dateRangeCriteria,
    });

    // Calculate average monthly budget for each category
    const monthCount = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30));
    const averageBudgets = budgets.reduce<BudgetAccumulator>((acc, budget) => {
      if (!acc[budget.category]) {
        acc[budget.category] = {
          total: 0,
          count: 0,
        };
      }
      acc[budget.category].total += budget.amount;
      acc[budget.category].count += 1;
      return acc;
    }, {});

    // Combine budget and actual data
    const comparisonData = Object.entries(averageBudgets).map(([category, { total, count }]) => {
      const averageBudget = total / count;
      const actual = actualExpenses.find((exp) => exp._id === category)?.actual || 0;
      return {
        category,
        budget: averageBudget * monthCount, // Scale budget to the selected time period
        actual,
        remaining: (averageBudget * monthCount) - actual,
      };
    });

    // Add categories with expenses but no budget
    actualExpenses
      .filter((exp) => !averageBudgets[exp._id])
      .forEach((exp) => {
        comparisonData.push({
          category: exp._id,
          budget: 0,
          actual: exp.actual,
          remaining: -exp.actual,
        });
      });

    // Sort by budget amount
    comparisonData.sort((a, b) => b.budget - a.budget);

    return NextResponse.json(comparisonData);
  } catch (error) {
    console.error('Error fetching budget comparison:', error);
    return NextResponse.json(
      { error: 'Failed to fetch budget comparison' },
      { status: 500 }
    );
  }
} 
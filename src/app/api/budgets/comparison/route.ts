import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Budget } from '@/models/Budget';
import { Transaction } from '@/models/Transaction';
import { startOfMonth, endOfMonth } from 'date-fns';

export async function GET(request: NextRequest) {
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

    await connectToDatabase();

    // Parse dates
    const startDate = startOfMonth(new Date(start));
    const endDate = endOfMonth(new Date(end));
    const month = startDate.getMonth() + 1;
    const year = startDate.getFullYear();

    // Get budgets for the month
    const budgets = await Budget.find({
      month,
      year,
    });

    // Get transactions for the month
    const transactions = await Transaction.aggregate([
      {
        $match: {
          date: {
            $gte: startDate,
            $lte: endDate,
          },
          amount: { $lt: 0 }, // Only consider expenses
        },
      },
      {
        $group: {
          _id: '$category',
          actual: { $sum: { $abs: '$amount' } },
        },
      },
    ]);

    // Create a map of actual spending by category
    const actualSpending = new Map(
      transactions.map(t => [t._id, t.actual])
    );

    // Combine budget and actual data
    const comparisonData = budgets.map(budget => {
      const actual = actualSpending.get(budget.category) || 0;
      const remaining = Math.max(0, budget.amount - actual);
      
      return {
        category: budget.category,
        budget: budget.amount,
        actual: actual,
        remaining: remaining,
      };
    });

    return NextResponse.json(comparisonData);
  } catch (error) {
    console.error('Error fetching budget comparison:', error);
    return NextResponse.json(
      { error: 'Failed to fetch budget comparison' },
      { status: 500 }
    );
  }
} 
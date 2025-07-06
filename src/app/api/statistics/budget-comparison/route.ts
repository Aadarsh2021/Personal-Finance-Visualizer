import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Transaction } from '@/models/Transaction';
import { Budget } from '@/models/Budget';
import { startOfMonth, endOfMonth } from 'date-fns';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const month = parseInt(searchParams.get('month') || (new Date().getMonth() + 1).toString());
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());

    await connectToDatabase();

    // Get the date range for the month
    const startDate = startOfMonth(new Date(year, month - 1));
    const endDate = endOfMonth(new Date(year, month - 1));

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

    // Get budgets for the month
    const budgets = await Budget.find({ month, year });

    // Combine budget and actual data
    const comparisonData = budgets.map((budget) => {
      const actual = actualExpenses.find((exp) => exp._id === budget.category)?.actual || 0;
      return {
        category: budget.category,
        budget: budget.amount,
        actual,
        remaining: budget.amount - actual,
      };
    });

    // Add categories with expenses but no budget
    actualExpenses
      .filter((exp) => !budgets.some((budget) => budget.category === exp._id))
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
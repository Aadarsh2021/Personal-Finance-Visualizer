import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Transaction } from '@/models/Transaction';
import { Budget } from '@/models/Budget';
import { startOfMonth, endOfMonth, subMonths } from 'date-fns';

// Helper function to format currency
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export async function GET() {
  try {
    await connectToDatabase();
    const insights: string[] = [];

    // Get current month's date range
    const now = new Date();
    const currentMonthStart = startOfMonth(now);
    const currentMonthEnd = endOfMonth(now);

    // Get last month's date range
    const lastMonthStart = startOfMonth(subMonths(now, 1));
    const lastMonthEnd = endOfMonth(subMonths(now, 1));

    // Get current month's totals (negative amounts)
    const currentMonthData = await Transaction.aggregate([
      {
        $match: {
          date: {
            $gte: currentMonthStart,
            $lte: currentMonthEnd,
          },
          amount: { $lt: 0 }, // Only negative amounts (expenses)
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: { $abs: '$amount' } }, // Sum absolute values
        },
      },
    ]);

    // Get last month's totals (negative amounts)
    const lastMonthData = await Transaction.aggregate([
      {
        $match: {
          date: {
            $gte: lastMonthStart,
            $lte: lastMonthEnd,
          },
          amount: { $lt: 0 }, // Only negative amounts (expenses)
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: { $abs: '$amount' } }, // Sum absolute values
        },
      },
    ]);

    const currentMonthTotal = currentMonthData[0]?.total || 0;
    const lastMonthTotal = lastMonthData[0]?.total || 0;

    // Compare with last month
    const difference = currentMonthTotal - lastMonthTotal;
    const percentChange = lastMonthTotal > 0 ? ((difference / lastMonthTotal) * 100).toFixed(1) : '0';
    
    if (difference > 0) {
      insights.push(`Spending is up ${percentChange}% compared to last month`);
    } else if (difference < 0) {
      insights.push(`Spending is down ${Math.abs(Number(percentChange))}% compared to last month`);
    }

    // Get category breakdown for current month
    const categoryBreakdown = await Transaction.aggregate([
      {
        $match: {
          date: {
            $gte: currentMonthStart,
            $lte: currentMonthEnd,
          },
          amount: { $lt: 0 }, // Only negative amounts (expenses)
        },
      },
      {
        $group: {
          _id: '$category',
          total: { $sum: { $abs: '$amount' } }, // Sum absolute values
        },
      },
      {
        $sort: { total: -1 },
      },
    ]);

    // Get budgets for the current month
    const budgets = await Budget.find({
      month: now.getMonth() + 1,
      year: now.getFullYear(),
    });

    // Identify categories over budget
    const overBudgetCategories = [];
    for (const budget of budgets) {
      const actual = categoryBreakdown.find((cat) => cat._id === budget.category)?.total || 0;
      if (actual > budget.amount) {
        const overage = ((actual - budget.amount) / budget.amount * 100).toFixed(1);
        overBudgetCategories.push({
          category: budget.category,
          overage,
        });
      }
    }

    if (overBudgetCategories.length > 0) {
      insights.push(
        `${overBudgetCategories.length} categories over budget: ${
          overBudgetCategories
            .map((cat) => `${cat.category} (${cat.overage}% over)`)
            .join(', ')
        }`
      );
    }

    // Identify top spending categories
    if (categoryBreakdown.length > 0) {
      const topCategory = categoryBreakdown[0];
      const percentage = currentMonthTotal > 0 ? ((topCategory.total / currentMonthTotal) * 100).toFixed(1) : '0';
      insights.push(
        `Highest spending in ${topCategory._id}: ${formatCurrency(topCategory.total)} (${percentage}% of total)`
      );
    }

    // Add budget status
    const totalBudget = budgets.reduce((sum, budget) => sum + budget.amount, 0);
    if (totalBudget > 0) {
      const remainingBudget = totalBudget - currentMonthTotal;
      const percentUsed = ((currentMonthTotal / totalBudget) * 100).toFixed(1);
      
      if (remainingBudget >= 0) {
        insights.push(`${percentUsed}% of total budget used, ${formatCurrency(remainingBudget)} remaining`);
      } else {
        insights.push(`Over total budget by ${formatCurrency(Math.abs(remainingBudget))}`);
      }
    }

    return NextResponse.json({ insights });
  } catch (error) {
    console.error('Error generating insights:', error);
    return NextResponse.json(
      { error: 'Failed to generate insights' },
      { status: 500 }
    );
  }
} 
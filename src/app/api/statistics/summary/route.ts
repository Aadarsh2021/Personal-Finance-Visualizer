import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Transaction } from '@/models/Transaction';
import { startOfMonth, endOfMonth, subMonths } from 'date-fns';

export async function GET() {
  try {
    await connectToDatabase();

    // Get last 3 months' date range
    const now = new Date();
    const threeMonthsAgo = subMonths(now, 3);
    const monthStart = startOfMonth(threeMonthsAgo);
    const monthEnd = endOfMonth(now);

    // Get monthly totals for last 3 months
    const monthlyTotals = await Transaction.aggregate([
      {
        $match: {
          date: {
            $gte: monthStart,
            $lte: monthEnd,
          },
        },
      },
      {
        $group: {
          _id: null,
          totalExpenses: {
            $sum: {
              $cond: [{ $lt: ['$amount', 0] }, { $abs: '$amount' }, 0],
            },
          },
          totalIncome: {
            $sum: {
              $cond: [{ $gte: ['$amount', 0] }, '$amount', 0],
            },
          },
        },
      },
    ]);

    // Get recent transactions (last 10 instead of 5 to show more data)
    const recentTransactions = await Transaction.find()
      .sort({ date: -1 })
      .limit(10);

    const summary = {
      totalExpenses: monthlyTotals[0]?.totalExpenses || 0,
      totalIncome: monthlyTotals[0]?.totalIncome || 0,
      balance: (monthlyTotals[0]?.totalIncome || 0) - (monthlyTotals[0]?.totalExpenses || 0),
      recentTransactions,
    };

    return NextResponse.json(summary);
  } catch (error) {
    console.error('Error fetching summary:', error);
    return NextResponse.json(
      { error: 'Failed to fetch summary' },
      { status: 500 }
    );
  }
} 
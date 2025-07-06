import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Transaction } from '@/models/Transaction';
import { startOfMonth, endOfMonth } from 'date-fns';

export async function GET() {
  try {
    await connectToDatabase();

    // Get current month's date range
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    // Get monthly totals
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

    // Get recent transactions
    const recentTransactions = await Transaction.find()
      .sort({ date: -1 })
      .limit(5);

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
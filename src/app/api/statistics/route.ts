import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Transaction } from '@/models/Transaction';
import { Budget } from '@/models/Budget';

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

    await connectToDatabase();

    const monthlyData = await Transaction.aggregate([
      {
        $match: {
          date: {
            $gte: new Date(start),
            $lte: new Date(end),
          },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
          },
          expenses: {
            $sum: {
              $cond: [{ $lt: ['$amount', 0] }, { $abs: '$amount' }, 0],
            },
          },
          income: {
            $sum: {
              $cond: [{ $gte: ['$amount', 0] }, '$amount', 0],
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          month: {
            $dateFromParts: {
              year: '$_id.year',
              month: '$_id.month',
              day: 1,
            },
          },
          expenses: 1,
          income: 1,
        },
      },
      {
        $sort: { month: 1 },
      },
    ]);

    return NextResponse.json(monthlyData);
  } catch (error) {
    console.error('Error fetching statistics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
} 
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Transaction } from '@/models/Transaction';

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

    const categoryData = await Transaction.aggregate([
      {
        $match: {
          date: {
            $gte: new Date(start),
            $lte: new Date(end),
          },
          amount: { $lt: 0 }, // Only negative amounts (expenses)
        },
      },
      {
        $group: {
          _id: '$category',
          amount: { $sum: { $abs: '$amount' } }, // Sum absolute values
        },
      },
      {
        $project: {
          _id: 0,
          category: '$_id',
          amount: 1,
        },
      },
      {
        $sort: { amount: -1 },
      },
    ]);

    return NextResponse.json(categoryData);
  } catch (error) {
    console.error('Error fetching category statistics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch category statistics' },
      { status: 500 }
    );
  }
} 
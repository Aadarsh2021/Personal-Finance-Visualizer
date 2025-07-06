import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Transaction } from '@/models/Transaction';
import { transactionCategories } from '@/types';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { amount, description, date, category, type } = body;

    console.log('Received transaction data:', { amount, description, date, category, type });

    // Validate amount
    let numericAmount: number;
    if (typeof amount === 'string') {
      // Handle string amount (with possible currency symbols and commas)
      const cleanAmount = amount.replace(/[₹,\s]/g, '');
      numericAmount = parseFloat(cleanAmount);
    } else if (typeof amount === 'number') {
      // Handle numeric amount directly
      numericAmount = amount;
    } else {
      console.error('Invalid amount type:', typeof amount);
      return NextResponse.json(
        { error: 'Invalid amount format' },
        { status: 400 }
      );
    }

    if (isNaN(numericAmount)) {
      console.error('Invalid amount:', amount);
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      );
    }

    // Validate amount range
    if (Math.abs(numericAmount) > 999999999999.99) {
      console.error('Amount out of range:', numericAmount);
      return NextResponse.json(
        { error: 'Amount must be between -999,999,999,999.99 and 999,999,999,999.99' },
        { status: 400 }
      );
    }

    // Validate category
    if (!transactionCategories.includes(category)) {
      console.error('Invalid category:', category);
      return NextResponse.json(
        { error: 'Invalid category' },
        { status: 400 }
      );
    }

    // Validate type
    if (!['income', 'expense'].includes(type)) {
      console.error('Invalid type:', type);
      return NextResponse.json(
        { error: 'Type must be either income or expense' },
        { status: 400 }
      );
    }

    // Validate date
    const transactionDate = new Date(date);
    if (isNaN(transactionDate.getTime())) {
      console.error('Invalid date:', date);
      return NextResponse.json(
        { error: 'Invalid date' },
        { status: 400 }
      );
    }

    console.log('Connecting to database...');
    await connectToDatabase();
    console.log('Connected to database');

    // Ensure consistent amount handling
    const finalAmount = parseFloat(numericAmount.toFixed(2));
    console.log('Creating transaction with amount:', finalAmount);

    const transaction = await Transaction.create({
      amount: finalAmount,
      description: description.trim(),
      date: transactionDate,
      category,
      type,
    });

    console.log('Transaction created successfully:', transaction);
    return NextResponse.json({ transaction });
  } catch (error) {
    console.error('Error creating transaction:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create transaction' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    await connectToDatabase();
    const transactions = await Transaction.find().sort({ date: -1 }).lean();
    return NextResponse.json({ transactions });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transactions', transactions: [] },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json(
        { error: 'Transaction ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    
    // Validate amount if it's being updated
    if (body.amount !== undefined) {
      const numericAmount = parseFloat(body.amount);
      if (isNaN(numericAmount)) {
        return NextResponse.json(
          { error: 'Invalid amount' },
          { status: 400 }
        );
      }

      if (numericAmount < -999999999999.99 || numericAmount > 999999999999.99) {
        return NextResponse.json(
          { error: 'Amount must be between -999,999,999,999.99 and 999,999,999,999.99' },
          { status: 400 }
        );
      }

      body.amount = parseFloat(numericAmount.toFixed(2)); // Ensure 2 decimal places
    }

    await connectToDatabase();

    const transaction = await Transaction.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true, // This ensures mongoose validations run on update
    });

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(transaction);
  } catch (error) {
    console.error('Error updating transaction:', error);
    return NextResponse.json(
      { error: 'Failed to update transaction' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json(
        { error: 'Transaction ID is required' },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const transaction = await Transaction.findByIdAndDelete(id);

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    return NextResponse.json(
      { error: 'Failed to delete transaction' },
      { status: 500 }
    );
  }
} 
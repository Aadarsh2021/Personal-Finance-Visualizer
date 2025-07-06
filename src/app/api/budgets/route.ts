import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Budget } from '@/models/Budget';
import { transactionCategories } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    const year = searchParams.get('year');

    await connectToDatabase();

    let query = {};
    
    // If month and year are provided, filter by them
    if (month && year) {
      const monthNum = parseInt(month);
      const yearNum = parseInt(year);
      
      if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
        return NextResponse.json(
          { error: 'Invalid month parameter' },
          { status: 400 }
        );
      }

      if (isNaN(yearNum) || yearNum < 2000) {
        return NextResponse.json(
          { error: 'Invalid year parameter' },
          { status: 400 }
        );
      }
      
      query = { month: monthNum, year: yearNum };
    }

    const budgets = await Budget.find(query).sort({ year: -1, month: -1, category: 1 });

    return NextResponse.json({ budgets });
  } catch (error) {
    console.error('Error fetching budgets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch budgets' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { category, amount, month, year, completed = false } = body;

    // Validate category
    if (!transactionCategories.includes(category)) {
      return NextResponse.json(
        { error: 'Invalid category' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Check for existing budget in the same month/year
    const existingBudget = await Budget.findOne({
      category,
      month,
      year,
    });

    if (existingBudget) {
      return NextResponse.json(
        { error: 'Budget already exists for this category in the specified month' },
        { status: 400 }
      );
    }

    const budget = await Budget.create({
      category,
      amount,
      month,
      year,
      completed,
    });

    return NextResponse.json(budget);
  } catch (error) {
    console.error('Error creating budget:', error);
    return NextResponse.json(
      { error: 'Failed to create budget' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Budget ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { category, amount, month, year, completed } = body;

    // Validate category
    if (!transactionCategories.includes(category)) {
      return NextResponse.json(
        { error: 'Invalid category' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Check for existing budget in the same month/year (excluding current budget)
    const existingBudget = await Budget.findOne({
      category,
      month,
      year,
      _id: { $ne: id },
    });

    if (existingBudget) {
      return NextResponse.json(
        { error: 'Budget already exists for this category in the specified month' },
        { status: 400 }
      );
    }

    const budget = await Budget.findByIdAndUpdate(
      id,
      { category, amount, month, year, completed },
      { new: true }
    );

    if (!budget) {
      return NextResponse.json(
        { error: 'Budget not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(budget);
  } catch (error) {
    console.error('Error updating budget:', error);
    return NextResponse.json(
      { error: 'Failed to update budget' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const action = searchParams.get('action');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Budget ID is required' },
        { status: 400 }
      );
    }

    if (action !== 'toggle-completed') {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }

    await connectToDatabase();
    
    // Get current budget to toggle the completed status
    const currentBudget = await Budget.findById(id);
    if (!currentBudget) {
      return NextResponse.json(
        { error: 'Budget not found' },
        { status: 404 }
      );
    }

    const budget = await Budget.findByIdAndUpdate(
      id,
      { completed: !currentBudget.completed },
      { new: true }
    );

    return NextResponse.json(budget);
  } catch (error) {
    console.error('Error toggling budget completion:', error);
    return NextResponse.json(
      { error: 'Failed to toggle budget completion' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Budget ID is required' },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const budget = await Budget.findByIdAndDelete(id);

    if (!budget) {
      return NextResponse.json(
        { error: 'Budget not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Budget deleted successfully' });
  } catch (error) {
    console.error('Error deleting budget:', error);
    return NextResponse.json(
      { error: 'Failed to delete budget' },
      { status: 500 }
    );
  }
} 
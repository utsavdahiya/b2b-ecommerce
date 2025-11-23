import { NextRequest, NextResponse } from 'next/server';
import { categoryConfigService } from '@/lib/services/categoryConfigService';

// GET /api/category-config?category=Visiting%20Cards
// GET /api/category-config (get all)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');

    if (category) {
      // Get specific category config
      const config = await categoryConfigService.getByCategory(category);
      
      if (!config) {
        return NextResponse.json(
          { error: 'Category configuration not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({ data: config });
    } else {
      // Get all category configs
      const configs = await categoryConfigService.getAll();
      return NextResponse.json({ data: configs });
    }
  } catch (error) {
    console.error('Error fetching category config:', error);
    return NextResponse.json(
      { error: 'Failed to fetch category configuration' },
      { status: 500 }
    );
  }
}

// POST /api/category-config
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { category, filters, description } = body;

    if (!category || !filters) {
      return NextResponse.json(
        { error: 'Category and filters are required' },
        { status: 400 }
      );
    }

    const config = await categoryConfigService.create(
      category,
      filters,
      description
    );

    return NextResponse.json({ data: config }, { status: 201 });
  } catch (error) {
    console.error('Error creating category config:', error);
    return NextResponse.json(
      { error: 'Failed to create category configuration' },
      { status: 500 }
    );
  }
}

// PUT /api/category-config
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { category, filters, description } = body;

    if (!category || !filters) {
      return NextResponse.json(
        { error: 'Category and filters are required' },
        { status: 400 }
      );
    }

    const config = await categoryConfigService.upsert(
      category,
      filters,
      description
    );

    return NextResponse.json({ data: config });
  } catch (error) {
    console.error('Error updating category config:', error);
    return NextResponse.json(
      { error: 'Failed to update category configuration' },
      { status: 500 }
    );
  }
}

// DELETE /api/category-config?category=Visiting%20Cards
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');

    if (!category) {
      return NextResponse.json(
        { error: 'Category parameter is required' },
        { status: 400 }
      );
    }

    const success = await categoryConfigService.delete(category);

    if (!success) {
      return NextResponse.json(
        { error: 'Category configuration not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Category configuration deleted' });
  } catch (error) {
    console.error('Error deleting category config:', error);
    return NextResponse.json(
      { error: 'Failed to delete category configuration' },
      { status: 500 }
    );
  }
}


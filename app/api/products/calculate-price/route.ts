import { NextResponse } from 'next/server';
import { calculatePrice, getProductById, validateConfiguration } from '@/lib/services/productService';

export async function POST(request: Request) {
  try {
    const { productId, configuration } = await request.json();

    if (!productId || !configuration) {
      return NextResponse.json(
        { error: 'Product ID and configuration are required' },
        { status: 400 }
      );
    }

    const product = await getProductById(productId);

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Validate configuration
    const validation = validateConfiguration(product, configuration);
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Invalid configuration', details: validation.errors },
        { status: 400 }
      );
    }

    // Calculate price
    const priceCalculation = calculatePrice(product, configuration);

    return NextResponse.json({
      success: true,
      price: priceCalculation,
    });
  } catch (error) {
    console.error('Calculate price API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/services/authService';
import { createOrderFromCart, getUserOrders, getOrderById, cancelOrder } from '@/lib/services/orderService';
import { cookies } from 'next/headers';

async function getUserIdFromToken(): Promise<number | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) return null;

    const decoded = verifyToken(token);
    return decoded?.userId || null;
  } catch (error) {
    return null;
  }
}

export async function GET(request: Request) {
  try {
    const userId = await getUserIdFromToken();

    if (!userId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('id');

    if (orderId) {
      const order = await getOrderById(parseInt(orderId), userId);

      if (!order) {
        return NextResponse.json(
          { error: 'Order not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({ order });
    }

    const orders = await getUserOrders(userId);
    return NextResponse.json({ orders });
  } catch (error) {
    console.error('Get orders API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getUserIdFromToken();

    if (!userId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { shippingAddress, gstNumber } = await request.json();

    if (!shippingAddress) {
      return NextResponse.json(
        { error: 'Shipping address is required' },
        { status: 400 }
      );
    }

    const result = await createOrderFromCart(userId, shippingAddress, gstNumber);

    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Create order API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const userId = await getUserIdFromToken();

    if (!userId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('id');

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    const result = await cancelOrder(parseInt(orderId), userId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Cancel order API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


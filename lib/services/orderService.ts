/**
 * Order Service
 * 
 * PORTABLE business logic for order management
 * No dependencies on Next.js
 */

import { query, getClient } from '../db/index';
import { getOrCreateCart, clearCart } from './cartService';

export interface Order {
  id: number;
  user_id: number;
  total_price: number;
  shipping_address: any;
  status: string;
  items?: OrderItem[];
  created_at: Date;
  updated_at: Date;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  product_name: string;
  configuration: any;
  unit_price: number;
  quantity: number;
  subtotal: number;
  created_at: Date;
}

export type OrderStatus =
  | 'pending'
  | 'payment_pending'
  | 'processing'
  | 'printing'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

/**
 * Create an order from the user's cart
 */
export async function createOrderFromCart(
  userId: number,
  shippingAddress: any
): Promise<{ success: boolean; message: string; order?: Order }> {
  const client = await getClient();

  try {
    await client.query('BEGIN');

    // Get current cart
    const cart = await getOrCreateCart(userId);

    if (!cart.items || cart.items.length === 0) {
      await client.query('ROLLBACK');
      return {
        success: false,
        message: 'Cart is empty',
      };
    }

    // Validate shipping address
    if (!shippingAddress || !shippingAddress.street || !shippingAddress.city) {
      await client.query('ROLLBACK');
      return {
        success: false,
        message: 'Valid shipping address is required',
      };
    }

    // Create order
    const orderResult = await client.query(
      `INSERT INTO orders (user_id, total_price, shipping_address, status)
       VALUES ($1, $2, $3, 'payment_pending')
       RETURNING *`,
      [userId, cart.total, shippingAddress]
    );

    const order = orderResult.rows[0];

    // Create order items
    for (const item of cart.items) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, product_name, configuration, unit_price, quantity, subtotal)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          order.id,
          item.product_id,
          item.product_name,
          item.configuration,
          item.unit_price,
          item.quantity,
          item.unit_price * item.quantity,
        ]
      );
    }

    // Clear the cart
    await client.query('DELETE FROM cart_items WHERE cart_id = $1', [cart.id]);

    await client.query('COMMIT');

    // Get complete order with items
    const completeOrder = await getOrderById(order.id, userId);

    return {
      success: true,
      message: 'Order created successfully',
      order: completeOrder || order,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create order error:', error);
    return {
      success: false,
      message: 'Failed to create order',
    };
  } finally {
    client.release();
  }
}

/**
 * Get all orders for a user
 */
export async function getUserOrders(userId: number): Promise<Order[]> {
  try {
    const result = await query(
      `SELECT * FROM orders
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );

    // Get items for each order
    const orders = result.rows;
    for (const order of orders) {
      const itemsResult = await query(
        'SELECT * FROM order_items WHERE order_id = $1',
        [order.id]
      );
      order.items = itemsResult.rows;
    }

    return orders;
  } catch (error) {
    console.error('Get user orders error:', error);
    return [];
  }
}

/**
 * Get a specific order by ID
 */
export async function getOrderById(
  orderId: number,
  userId?: number
): Promise<Order | null> {
  try {
    const sql = userId
      ? 'SELECT * FROM orders WHERE id = $1 AND user_id = $2'
      : 'SELECT * FROM orders WHERE id = $1';
    
    const params = userId ? [orderId, userId] : [orderId];
    
    const result = await query(sql, params);

    if (result.rows.length === 0) {
      return null;
    }

    const order = result.rows[0];

    // Get order items
    const itemsResult = await query(
      'SELECT * FROM order_items WHERE order_id = $1',
      [orderId]
    );
    order.items = itemsResult.rows;

    return order;
  } catch (error) {
    console.error('Get order error:', error);
    return null;
  }
}

/**
 * Update order status
 */
export async function updateOrderStatus(
  orderId: number,
  status: OrderStatus
): Promise<{ success: boolean; message: string; order?: Order }> {
  try {
    const result = await query(
      `UPDATE orders
       SET status = $1
       WHERE id = $2
       RETURNING *`,
      [status, orderId]
    );

    if (result.rows.length === 0) {
      return {
        success: false,
        message: 'Order not found',
      };
    }

    return {
      success: true,
      message: 'Order status updated',
      order: result.rows[0],
    };
  } catch (error) {
    console.error('Update order status error:', error);
    return {
      success: false,
      message: 'Failed to update order status',
    };
  }
}

/**
 * Cancel an order (only if not yet processing)
 */
export async function cancelOrder(
  orderId: number,
  userId: number
): Promise<{ success: boolean; message: string }> {
  try {
    const order = await getOrderById(orderId, userId);

    if (!order) {
      return {
        success: false,
        message: 'Order not found',
      };
    }

    // Check if order can be cancelled
    const cancellableStatuses = ['pending', 'payment_pending'];
    if (!cancellableStatuses.includes(order.status)) {
      return {
        success: false,
        message: 'Order cannot be cancelled at this stage',
      };
    }

    await query(
      `UPDATE orders SET status = 'cancelled' WHERE id = $1`,
      [orderId]
    );

    return {
      success: true,
      message: 'Order cancelled successfully',
    };
  } catch (error) {
    console.error('Cancel order error:', error);
    return {
      success: false,
      message: 'Failed to cancel order',
    };
  }
}

/**
 * Get order statistics for a user
 */
export async function getUserOrderStats(userId: number) {
  try {
    const result = await query(
      `SELECT 
         COUNT(*) as total_orders,
         SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as delivered_orders,
         SUM(CASE WHEN status IN ('pending', 'payment_pending', 'processing', 'printing', 'shipped') THEN 1 ELSE 0 END) as active_orders,
         SUM(total_price) as total_spent
       FROM orders
       WHERE user_id = $1`,
      [userId]
    );

    return result.rows[0] || {
      total_orders: 0,
      delivered_orders: 0,
      active_orders: 0,
      total_spent: 0,
    };
  } catch (error) {
    console.error('Get order stats error:', error);
    return {
      total_orders: 0,
      delivered_orders: 0,
      active_orders: 0,
      total_spent: 0,
    };
  }
}


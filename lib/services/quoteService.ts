/**
 * Quote Service
 * 
 * PORTABLE business logic for quote management
 * No dependencies on Next.js
 */

import { query } from '../db/index';
import { getOrCreateCart } from './cartService';

export interface Quote {
  id: number;
  user_id: number;
  quote_details: any;
  total_price: number;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  valid_until: Date | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * Create a quote from the user's current cart
 */
export async function createQuoteFromCart(
  userId: number,
  validDays: number = 30
): Promise<{ success: boolean; message: string; quote?: Quote }> {
  try {
    // Get current cart
    const cart = await getOrCreateCart(userId);

    if (!cart.items || cart.items.length === 0) {
      return {
        success: false,
        message: 'Cart is empty',
      };
    }

    // Calculate valid until date
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + validDays);

    // Prepare quote details
    const quoteDetails = {
      items: cart.items.map(item => ({
        product_id: item.product_id,
        product_name: item.product_name,
        configuration: item.configuration,
        quantity: item.quantity,
        unit_price: item.unit_price,
        subtotal: item.unit_price * item.quantity,
      })),
      created_from_cart_id: cart.id,
    };

    // Create quote
    const result = await query(
      `INSERT INTO quotes (user_id, quote_details, total_price, valid_until, status)
       VALUES ($1, $2, $3, $4, 'pending')
       RETURNING *`,
      [userId, quoteDetails, cart.total, validUntil]
    );

    return {
      success: true,
      message: 'Quote created successfully',
      quote: result.rows[0],
    };
  } catch (error) {
    console.error('Create quote error:', error);
    return {
      success: false,
      message: 'Failed to create quote',
    };
  }
}

/**
 * Create a custom quote (admin/sales function)
 */
export async function createCustomQuote(
  userId: number,
  quoteDetails: any,
  totalPrice: number,
  validDays: number = 30
): Promise<{ success: boolean; message: string; quote?: Quote }> {
  try {
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + validDays);

    const result = await query(
      `INSERT INTO quotes (user_id, quote_details, total_price, valid_until, status)
       VALUES ($1, $2, $3, $4, 'pending')
       RETURNING *`,
      [userId, quoteDetails, totalPrice, validUntil]
    );

    return {
      success: true,
      message: 'Custom quote created successfully',
      quote: result.rows[0],
    };
  } catch (error) {
    console.error('Create custom quote error:', error);
    return {
      success: false,
      message: 'Failed to create custom quote',
    };
  }
}

/**
 * Get all quotes for a user
 */
export async function getUserQuotes(
  userId: number
): Promise<Quote[]> {
  try {
    const result = await query(
      `SELECT * FROM quotes
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );

    return result.rows;
  } catch (error) {
    console.error('Get user quotes error:', error);
    return [];
  }
}

/**
 * Get a specific quote by ID
 */
export async function getQuoteById(
  quoteId: number,
  userId?: number
): Promise<Quote | null> {
  try {
    const sql = userId
      ? 'SELECT * FROM quotes WHERE id = $1 AND user_id = $2'
      : 'SELECT * FROM quotes WHERE id = $1';
    
    const params = userId ? [quoteId, userId] : [quoteId];
    
    const result = await query(sql, params);

    return result.rows[0] || null;
  } catch (error) {
    console.error('Get quote error:', error);
    return null;
  }
}

/**
 * Update quote status
 */
export async function updateQuoteStatus(
  quoteId: number,
  status: 'pending' | 'approved' | 'rejected' | 'expired'
): Promise<{ success: boolean; message: string; quote?: Quote }> {
  try {
    const result = await query(
      `UPDATE quotes
       SET status = $1
       WHERE id = $2
       RETURNING *`,
      [status, quoteId]
    );

    if (result.rows.length === 0) {
      return {
        success: false,
        message: 'Quote not found',
      };
    }

    return {
      success: true,
      message: 'Quote status updated',
      quote: result.rows[0],
    };
  } catch (error) {
    console.error('Update quote status error:', error);
    return {
      success: false,
      message: 'Failed to update quote status',
    };
  }
}

/**
 * Add quote items to cart
 */
export async function addQuoteToCart(
  userId: number,
  quoteId: number
): Promise<{ success: boolean; message: string }> {
  try {
    const quote = await getQuoteById(quoteId, userId);

    if (!quote) {
      return {
        success: false,
        message: 'Quote not found',
      };
    }

    if (quote.status === 'expired' || quote.status === 'rejected') {
      return {
        success: false,
        message: 'Quote is not valid',
      };
    }

    // Get or create cart
    const cart = await getOrCreateCart(userId);

    // Add each item from quote to cart
    const items = quote.quote_details.items || [];
    
    for (const item of items) {
      await query(
        `INSERT INTO cart_items (cart_id, product_id, configuration, unit_price, quantity)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          cart.id,
          item.product_id,
          item.configuration,
          item.unit_price,
          item.quantity,
        ]
      );
    }

    return {
      success: true,
      message: 'Quote items added to cart',
    };
  } catch (error) {
    console.error('Add quote to cart error:', error);
    return {
      success: false,
      message: 'Failed to add quote to cart',
    };
  }
}

/**
 * Check and update expired quotes
 */
export async function updateExpiredQuotes(): Promise<number> {
  try {
    const result = await query(
      `UPDATE quotes
       SET status = 'expired'
       WHERE status = 'pending'
         AND valid_until IS NOT NULL
         AND valid_until < NOW()
       RETURNING id`
    );

    return result.rows.length;
  } catch (error) {
    console.error('Update expired quotes error:', error);
    return 0;
  }
}


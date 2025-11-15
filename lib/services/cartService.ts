/**
 * Cart Service
 * 
 * PORTABLE business logic for shopping cart management
 * No dependencies on Next.js
 */

import { query, getClient } from '../db/index';
import { getProductById, calculatePrice } from './productService';

export interface CartItem {
  id: number;
  cart_id: number;
  product_id: number;
  product_name?: string;
  configuration: any;
  unit_price: number;
  quantity: number;
  created_at: Date;
  updated_at: Date;
}

export interface Cart {
  id: number;
  user_id: number;
  items: CartItem[];
  total: number;
  created_at: Date;
  updated_at: Date;
}

/**
 * Get or create cart for user
 */
export async function getOrCreateCart(userId: number): Promise<Cart> {
  try {
    // Check if cart exists
    let result = await query(
      'SELECT * FROM carts WHERE user_id = $1',
      [userId]
    );

    let cart;
    if (result.rows.length === 0) {
      // Create new cart
      result = await query(
        'INSERT INTO carts (user_id) VALUES ($1) RETURNING *',
        [userId]
      );
    }

    cart = result.rows[0];

    // Get cart items with product info
    const itemsResult = await query(
      `SELECT ci.*, p.name as product_name
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       WHERE ci.cart_id = $1
       ORDER BY ci.created_at DESC`,
      [cart.id]
    );

    cart.items = itemsResult.rows;
    cart.total = cart.items.reduce(
      (sum: number, item: CartItem) => sum + item.unit_price * item.quantity,
      0
    );

    return cart;
  } catch (error) {
    console.error('Get or create cart error:', error);
    throw error;
  }
}

/**
 * Add item to cart with server-side price validation
 */
export async function addToCart(
  userId: number,
  productId: number,
  configuration: any,
  quantity: number = 1
): Promise<{ success: boolean; message: string; cart?: Cart }> {
  try {
    // Get product
    const product = await getProductById(productId);
    if (!product) {
      return { success: false, message: 'Product not found' };
    }

    if (!product.is_active) {
      return { success: false, message: 'Product is not available' };
    }

    // Calculate server-side price (authoritative)
    const priceCalc = calculatePrice(product, { ...configuration, quantity });

    // Get or create cart
    const cart = await getOrCreateCart(userId);

    // Check if item with same configuration already exists
    const existingItem = cart.items.find(
      (item: CartItem) =>
        item.product_id === productId &&
        JSON.stringify(item.configuration) === JSON.stringify(configuration)
    );

    if (existingItem) {
      // Update quantity
      await query(
        `UPDATE cart_items
         SET quantity = quantity + $1,
             unit_price = $2
         WHERE id = $3`,
        [quantity, priceCalc.totalPrice, existingItem.id]
      );
    } else {
      // Add new item
      await query(
        `INSERT INTO cart_items (cart_id, product_id, configuration, unit_price, quantity)
         VALUES ($1, $2, $3, $4, $5)`,
        [cart.id, productId, configuration, priceCalc.totalPrice, quantity]
      );
    }

    // Get updated cart
    const updatedCart = await getOrCreateCart(userId);

    return {
      success: true,
      message: 'Item added to cart',
      cart: updatedCart,
    };
  } catch (error) {
    console.error('Add to cart error:', error);
    return {
      success: false,
      message: 'Failed to add item to cart',
    };
  }
}

/**
 * Update cart item quantity
 */
export async function updateCartItem(
  userId: number,
  cartItemId: number,
  quantity: number
): Promise<{ success: boolean; message: string; cart?: Cart }> {
  if (quantity <= 0) {
    return removeCartItem(userId, cartItemId);
  }

  try {
    // Verify ownership
    const cart = await getOrCreateCart(userId);
    const item = cart.items.find((i: CartItem) => i.id === cartItemId);

    if (!item) {
      return { success: false, message: 'Cart item not found' };
    }

    // Recalculate price with new quantity
    const product = await getProductById(item.product_id);
    if (product) {
      const priceCalc = calculatePrice(product, { ...item.configuration, quantity });

      await query(
        'UPDATE cart_items SET quantity = $1, unit_price = $2 WHERE id = $3',
        [quantity, priceCalc.totalPrice, cartItemId]
      );
    } else {
      // Product not found, just update quantity
      await query(
        'UPDATE cart_items SET quantity = $1 WHERE id = $2',
        [quantity, cartItemId]
      );
    }

    const updatedCart = await getOrCreateCart(userId);

    return {
      success: true,
      message: 'Cart updated',
      cart: updatedCart,
    };
  } catch (error) {
    console.error('Update cart item error:', error);
    return {
      success: false,
      message: 'Failed to update cart item',
    };
  }
}

/**
 * Remove item from cart
 */
export async function removeCartItem(
  userId: number,
  cartItemId: number
): Promise<{ success: boolean; message: string; cart?: Cart }> {
  try {
    // Verify ownership
    const cart = await getOrCreateCart(userId);
    const item = cart.items.find((i: CartItem) => i.id === cartItemId);

    if (!item) {
      return { success: false, message: 'Cart item not found' };
    }

    await query('DELETE FROM cart_items WHERE id = $1', [cartItemId]);

    const updatedCart = await getOrCreateCart(userId);

    return {
      success: true,
      message: 'Item removed from cart',
      cart: updatedCart,
    };
  } catch (error) {
    console.error('Remove cart item error:', error);
    return {
      success: false,
      message: 'Failed to remove cart item',
    };
  }
}

/**
 * Clear entire cart
 */
export async function clearCart(userId: number): Promise<{ success: boolean; message: string }> {
  try {
    const cart = await getOrCreateCart(userId);

    await query('DELETE FROM cart_items WHERE cart_id = $1', [cart.id]);

    return {
      success: true,
      message: 'Cart cleared',
    };
  } catch (error) {
    console.error('Clear cart error:', error);
    return {
      success: false,
      message: 'Failed to clear cart',
    };
  }
}


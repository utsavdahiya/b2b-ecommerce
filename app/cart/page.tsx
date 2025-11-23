'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface CartItem {
  id: number;
  product_id: number;
  product_name: string;
  configuration: any;
  unit_price: number;
  quantity: number;
}

interface Cart {
  id: number;
  items: CartItem[];
  total: number;
}

export default function CartPage() {
  const router = useRouter();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      const res = await fetch('/api/cart');
      const data = await res.json();
      
      if (res.ok) {
        setCart(data.cart);
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateItemQuantity = async (itemId: number, newQuantity: number) => {
    setUpdating(itemId);
    setMessage(null);

    try {
      const res = await fetch('/api/cart', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cartItemId: itemId, quantity: newQuantity }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update cart');
      }

      setCart(data.cart);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setUpdating(null);
    }
  };

  const removeItem = async (itemId: number) => {
    setUpdating(itemId);
    setMessage(null);

    try {
      const res = await fetch(`/api/cart?itemId=${itemId}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to remove item');
      }

      setCart(data.cart);
      setMessage({ type: 'success', text: 'Item removed from cart' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setUpdating(null);
    }
  };

  const clearCart = async () => {
    if (!confirm('Are you sure you want to clear your cart?')) return;

    setLoading(true);
    try {
      const res = await fetch('/api/cart?clear=true', {
        method: 'DELETE',
      });

      if (res.ok) {
        await fetchCart();
        setMessage({ type: 'success', text: 'Cart cleared' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to clear cart' });
    } finally {
      setLoading(false);
    }
  };

  const formatOptionName = (key: string) => {
    return key
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading cart...</p>
        </div>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <svg
            className="w-24 h-24 text-gray-300 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
          <p className="text-gray-600 mb-6">Add some products to get started</p>
          <Link
            href="/products"
            className="inline-block px-6 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors"
          >
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Shopping Cart</h1>

        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cart.items.map((item) => (
              <div key={item.id} className="bg-white rounded-lg shadow-md p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-1 mb-4 sm:mb-0">
                    <h3 className="text-lg font-semibold text-gray-900">{item.product_name}</h3>
                    
                    {/* Configuration Details */}
                    <div className="mt-2 space-y-1 text-sm text-gray-600">
                      <p>
                        <span className="font-medium">Quantity:</span> {item.configuration.quantity} units
                      </p>
                      {item.configuration.material && (
                        <p>
                          <span className="font-medium">Material:</span>{' '}
                          {formatOptionName(item.configuration.material)}
                        </p>
                      )}
                      {item.configuration.size && (
                        <p>
                          <span className="font-medium">Size:</span>{' '}
                          {item.configuration.size.toUpperCase()}
                        </p>
                      )}
                      {item.configuration.paper && (
                        <p>
                          <span className="font-medium">Paper:</span>{' '}
                          {formatOptionName(item.configuration.paper)}
                        </p>
                      )}
                      {item.configuration.finishing && item.configuration.finishing.length > 0 && (
                        <p>
                          <span className="font-medium">Finishing:</span>{' '}
                          {item.configuration.finishing.map(formatOptionName).join(', ')}
                        </p>
                      )}
                    </div>

                    <div className="mt-3 flex items-center space-x-4">
                      <button
                        onClick={() => removeItem(item.id)}
                        disabled={updating === item.id}
                        className="text-sm text-red-600 hover:text-red-700 disabled:opacity-50"
                      >
                        Remove
                      </button>
                      <Link
                        href={`/products/${item.product_id}`}
                        className="text-sm text-primary-600 hover:text-primary-700"
                      >
                        Edit Configuration
                      </Link>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary-600">
                      ₹{item.unit_price.toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      ₹{(item.unit_price / item.configuration.quantity).toFixed(2)} per unit
                    </p>
                  </div>
                </div>
              </div>
            ))}

            <button
              onClick={clearCart}
              className="text-sm text-red-600 hover:text-red-700"
            >
              Clear Cart
            </button>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Summary</h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal:</span>
                  <span className="font-medium">₹{cart.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Items:</span>
                  <span className="font-medium">{cart.items.length}</span>
                </div>
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-900">Total:</span>
                    <span className="text-3xl font-bold text-primary-600">
                      ₹{cart.total.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Link
                  href="/checkout"
                  className="block w-full py-3 px-6 bg-primary-600 text-white font-semibold text-center rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Proceed to Checkout
                </Link>

                <Link
                  href="/products"
                  className="block w-full py-3 px-6 text-center text-primary-600 hover:text-primary-700 transition-colors"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Order {
  id: number;
  total_price: number;
  status: string;
  shipping_address: any;
  gst_number?: string;
  items: any[];
  created_at: string;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders');
      const data = await res.json();
      
      if (res.ok) {
        setOrders(data.orders || []);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      payment_pending: 'bg-orange-100 text-orange-800',
      processing: 'bg-blue-100 text-blue-800',
      printing: 'bg-indigo-100 text-indigo-800',
      shipped: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatStatus = (status: string) => {
    return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4 sm:mb-0">My Orders</h1>
          <Link
            href="/products"
            className="inline-block px-6 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors text-center"
          >
            Shop Now
          </Link>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
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
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No orders yet</h2>
            <p className="text-gray-600 mb-6">Start shopping to see your orders here</p>
            <Link
              href="/products"
              className="inline-block px-6 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors"
            >
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow-md p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Order #{order.id}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Placed on {new Date(order.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="mt-3 sm:mt-0 flex items-center space-x-4">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                        order.status
                      )}`}
                    >
                      {formatStatus(order.status)}
                    </span>
                    <span className="text-xl font-bold text-primary-600">
                      ${Number(order.total_price).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Order Items */}
                <div className="border-t border-gray-200 pt-4 space-y-3">
                  {order.items && order.items.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <div>
                        <p className="font-medium text-gray-900">{item.product_name}</p>
                        <p className="text-gray-500">
                          Quantity: {item.quantity} × ${Number(item.unit_price).toFixed(2)}
                        </p>
                      </div>
                      <p className="font-medium text-gray-900">
                        ${Number(item.subtotal).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Shipping Address */}
                {order.shipping_address && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm font-medium text-gray-700 mb-1">Shipping Address:</p>
                    <p className="text-sm text-gray-600">
                      {order.shipping_address.street && `${order.shipping_address.street}, `}
                      {order.shipping_address.city && `${order.shipping_address.city}, `}
                      {order.shipping_address.state && `${order.shipping_address.state} `}
                      {order.shipping_address.postal_code}
                    </p>
                  </div>
                )}

                {/* GST Number */}
                {order.gst_number && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-sm font-medium text-gray-700 mb-1">GST Number:</p>
                    <p className="text-sm text-gray-600">{order.gst_number}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


// components/dashboard/RecentOrders.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Clock, Package, Truck, CheckCircle, XCircle, ChevronRight, AlertCircle } from 'lucide-react';

interface Order {
  id: number;
  orderNumber: string;
  buyer: {
    name: string;
    email: string;
  };
  product?: {
    name: string;
    image?: string;
  };
  total: number;
  status: string;
  createdAt: string;
}

const statusConfig: Record<string, { color: string; bg: string; icon: React.ReactNode }> = {
  PENDING: {
    color: 'text-yellow-600',
    bg: 'bg-yellow-50',
    icon: <Clock className="w-4 h-4" />,
  },
  PROCESSING: {
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    icon: <Package className="w-4 h-4" />,
  },
  SHIPPED: {
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    icon: <Truck className="w-4 h-4" />,
  },
  DELIVERED: {
    color: 'text-green-600',
    bg: 'bg-green-50',
    icon: <CheckCircle className="w-4 h-4" />,
  },
  CANCELLED: {
    color: 'text-red-600',
    bg: 'bg-red-50',
    icon: <XCircle className="w-4 h-4" />,
  },
};

export default function RecentOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRecentOrders();
  }, []);

  const fetchRecentOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/seller/orders?limit=5&sortBy=createdAt&sortOrder=desc');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch orders: ${response.status}`);
      }
      
      const data = await response.json();
      setOrders(data.orders || []);
    } catch (error) {
      console.error('Error fetching recent orders:', error);
      setError('Failed to load recent orders');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-7 bg-gray-200 rounded w-1/3 mb-6"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 rounded mb-3"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Recent Orders</h2>
        </div>
        <div className="text-center py-8">
          <AlertCircle className="w-12 h-12 text-red-300 mx-auto mb-3" />
          <p className="text-gray-600">{error}</p>
          <button
            onClick={fetchRecentOrders}
            className="mt-4 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors text-sm"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Recent Orders</h2>
        <Link 
          href="/dashboard/orders" 
          className="text-sm text-blue-600 hover:text-blue-700 flex items-center"
        >
          View all <ChevronRight className="w-4 h-4 ml-1" />
        </Link>
      </div>

      <div className="space-y-4">
        {orders.length > 0 ? (
          orders.map((order) => {
            const status = statusConfig[order.status] || statusConfig.PENDING;
            return (
              <Link
                key={order.id}
                href={`/dashboard/orders/${order.id}`}
                className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg transition-colors group border border-gray-100"
              >
                <div className="flex items-center space-x-4">
                  <div className={`p-2 rounded-lg ${status.bg}`}>
                    <div className={status.color}>{status.icon}</div>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">#{order.orderNumber}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <p className="text-sm text-gray-600">
                        {order.buyer?.name || 'Customer'}
                      </p>
                      <span className="text-xs text-gray-400">•</span>
                      <p className="text-xs text-gray-500">
                        {formatDate(order.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="font-bold text-gray-900">
                    ${order.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <div className="flex items-center justify-end mt-1">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>
                      {order.status}
                    </span>
                    <ChevronRight className="w-4 h-4 ml-2 text-gray-400 group-hover:text-gray-600 transition-colors" />
                  </div>
                </div>
              </Link>
            );
          })
        ) : (
          <div className="text-center py-8">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600">No orders yet</p>
            <p className="text-sm text-gray-500 mt-1">Start selling to see your orders here</p>
          </div>
        )}
      </div>
    </div>
  );
}
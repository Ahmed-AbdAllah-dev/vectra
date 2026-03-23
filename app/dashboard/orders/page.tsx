// app/dashboard/orders/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Search,
  Filter,
  Download,
  Trash2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  ShoppingCart,
  AlertCircle,
  RefreshCw,
  BarChart3,
  User,
  MapPin,
} from 'lucide-react';
import OrderStatusBadge from '@/app/components/OrderStatusBadge';

interface Order {
  id: number;
  orderNumber: string;
  buyer: {
    id: number;
    name: string;
    email: string;
  };
  product?: {
    id: number;
    name: string;
    image?: string;
  };
  variant?: {
    id: number;
    sku: string;
    image?: string;
  };
  quantity: number;
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  status: string;
  paymentMethod: string;
  shippingAddress?: {
    fullName: string;
    city: string;
    state: string;
    country: string;
    phone: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface OrderSummary {
  totalRevenue: number;
  totalOrders: number;
  pendingOrders: number;
  processingOrders: number;
  averageOrderValue: number;
}

export default function OrdersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [summary, setSummary] = useState<OrderSummary>({
    totalRevenue: 0,
    totalOrders: 0,
    pendingOrders: 0,
    processingOrders: 0,
    averageOrderValue: 0
  });
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const limit = 20;

  // Filters
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');
  const [dateFilter, setDateFilter] = useState({
    from: searchParams.get('dateFrom') || '',
    to: searchParams.get('dateTo') || ''
  });
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(searchParams.get('sortOrder') as 'asc' || 'desc');

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query params
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString(),
        sortBy,
        sortOrder
      });

      if (statusFilter && statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      if (dateFilter.from) {
        params.append('dateFrom', dateFilter.from);
      }
      if (dateFilter.to) {
        params.append('dateTo', dateFilter.to);
      }
      if (searchQuery) {
        params.append('search', searchQuery);
      }

      const response = await fetch(`/api/seller/orders?${params}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch orders: ${response.status}`);
      }

      const data = await response.json();
      
      setOrders(data.orders || []);
      setSummary(data.summary || {});
      setStatusCounts(data.filters?.statusCounts || {});
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalCount(data.pagination?.totalCount || 0);

      // Update URL with current filters
      const newSearchParams = new URLSearchParams(params);
      router.push(`/dashboard/orders?${newSearchParams}`, { scroll: false });
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError('Failed to load orders. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, statusFilter, dateFilter, searchQuery, sortBy, sortOrder, router]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchOrders();
  };

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  const handleDateFilterChange = (field: 'from' | 'to', value: string) => {
    setDateFilter(prev => ({ ...prev, [field]: value }));
  };

  const handleApplyDateFilter = () => {
    setCurrentPage(1);
    fetchOrders();
  };

  const handleClearFilters = () => {
    setStatusFilter('all');
    setDateFilter({ from: '', to: '' });
    setSearchQuery('');
    setSortBy('createdAt');
    setSortOrder('desc');
    setCurrentPage(1);
  };

  const handleExportOrders = async () => {
    try {
      const params = new URLSearchParams({
        page: '1',
        limit: '1000',
        sortBy,
        sortOrder
      });
  
      if (statusFilter && statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      if (dateFilter.from) {
        params.append('dateFrom', dateFilter.from);
      }
      if (dateFilter.to) {
        params.append('dateTo', dateFilter.to);
      }
      if (searchQuery) {
        params.append('search', searchQuery);
      }
  
      const response = await fetch(`/api/seller/orders?${params}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch orders: ${response.status}`);
      }
  
      const data = await response.json();
      const ordersData = data.orders || [];
  
      const exportData = {
        orders: ordersData.map((order: Order) => ({
          orderNumber: order.orderNumber,
          customerName: order.buyer.name,
          customerEmail: order.buyer.email,
          productName: order.product?.name || '',
          productSKU: order.variant?.sku || '',
          quantity: order.quantity,
          subtotal: order.subtotal,
          tax: order.tax,
          shipping: order.shipping,
          total: order.total,
          status: order.status,
          paymentMethod: order.paymentMethod,
          shippingAddress: order.shippingAddress ? 
            `${order.shippingAddress.fullName}, ${order.shippingAddress.city}, ${order.shippingAddress.state}, ${order.shippingAddress.country}` : '',
          createdAt: order.createdAt,
          updatedAt: order.updatedAt
        })),
        summary: {
          totalOrders: ordersData.length,
          totalRevenue: ordersData.reduce((sum: number, order: Order) => sum + order.total, 0),
          averageOrderValue: ordersData.length > 0 ? 
            ordersData.reduce((sum: number, order: Order) => sum + order.total, 0) / ordersData.length : 0
        },
        filters: {
          status: statusFilter,
          dateFrom: dateFilter.from,
          dateTo: dateFilter.to,
          searchQuery: searchQuery
        }
      };
  
      const exportResponse = await fetch('/api/seller/orders/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(exportData),
      });
  
      if (!exportResponse.ok) {
        const errorData = await exportResponse.json();
        throw new Error(errorData.error || 'Failed to generate export');
      }
  
      const blob = await exportResponse.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      const dateStr = new Date().toISOString().split('T')[0];
      let filename = `orders_${dateStr}`;
      if (statusFilter !== 'all') filename += `_${statusFilter}`;
      if (dateFilter.from) filename += `_from${dateFilter.from}`;
      if (dateFilter.to) filename += `_to${dateFilter.to}`;
      filename += '.xlsx';
      
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
    } catch (error: any) {
      console.error('Export error:', error);
      setError(error.message || 'Failed to export orders. Please try again.');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="w-4 h-4" />;
      case 'PROCESSING':
        return <Package className="w-4 h-4" />;
      case 'SHIPPED':
        return <Truck className="w-4 h-4" />;
      case 'DELIVERED':
        return <CheckCircle className="w-4 h-4" />;
      case 'CANCELLED':
        return <XCircle className="w-4 h-4" />;
      default:
        return <ShoppingCart className="w-4 h-4" />;
    }
  };

  const statusOptions = [
    { value: 'all', label: 'All Orders', count: totalCount },
    { value: 'PENDING', label: 'Pending', count: statusCounts.PENDING || 0 },
    { value: 'PROCESSING', label: 'Processing', count: statusCounts.PROCESSING || 0 },
    { value: 'SHIPPED', label: 'Shipped', count: statusCounts.SHIPPED || 0 },
    { value: 'DELIVERED', label: 'Delivered', count: statusCounts.DELIVERED || 0 },
    { value: 'CANCELLED', label: 'Cancelled', count: statusCounts.CANCELLED || 0 }
  ];

  if (loading && !orders.length) {
    return (
      <div className="space-y-6 p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-9 bg-gray-200 rounded w-48 animate-pulse mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-64 animate-pulse"></div>
          </div>
          <div className="h-10 bg-gray-200 rounded-lg w-32 animate-pulse"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="animate-pulse">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 border-b border-gray-200"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 max-w-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-600 mt-1">Manage and track your customer orders</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => router.push('/dashboard/analytics')}
            className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Analytics
          </button>
          <button
            onClick={handleExportOrders}
            className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-600 mr-3" />
              <p className="text-red-700">{error}</p>
            </div>
            <button
              onClick={fetchOrders}
              className="flex items-center text-sm text-red-600 hover:text-red-700"
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-50 rounded-lg mr-4">
              <ShoppingCart className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">
                {summary.totalOrders.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-50 rounded-lg mr-4">
              <CheckCircle className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(summary.totalRevenue)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-50 rounded-lg mr-4">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Pending Orders</p>
              <p className="text-2xl font-bold text-gray-900">
                {summary.pendingOrders.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-50 rounded-lg mr-4">
              <Package className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Avg. Order Value</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(summary.averageOrderValue)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex flex-col space-y-6">
          {/* Status Filters */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3">Filter by Status</h3>
            <div className="flex flex-wrap gap-2">
              {statusOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleStatusFilter(option.value)}
                  className={`
                    flex items-center px-4 py-2 rounded-lg transition-colors
                    ${statusFilter === option.value
                      ? 'bg-black text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }
                  `}
                >
                  <span className="mr-2">{getStatusIcon(option.value)}</span>
                  {option.label}
                  <span className={`
                    ml-2 px-1.5 py-0.5 text-xs rounded-full
                    ${statusFilter === option.value
                      ? 'bg-white/20'
                      : 'bg-gray-200'
                    }
                  `}>
                    {option.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Date Filter */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3">Filter by Date</h3>
            <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
              <div className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-gray-400" />
                <input
                  type="date"
                  value={dateFilter.from}
                  onChange={(e) => handleDateFilterChange('from', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                />
                <span className="text-gray-500">to</span>
                <input
                  type="date"
                  value={dateFilter.to}
                  onChange={(e) => handleDateFilterChange('to', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                />
                <button
                  onClick={handleApplyDateFilter}
                  className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>

          {/* Search and Sort */}
          <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
            <form onSubmit={handleSearch} className="flex items-center space-x-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="search"
                  placeholder="Search orders..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black w-full md:w-80"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                Search
              </button>
            </form>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-700">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm"
                >
                  <option value="createdAt">Date</option>
                  <option value="total">Amount</option>
                  <option value="customer">Customer</option>
                  <option value="product">Product</option>
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {sortOrder === 'desc' ? '↓' : '↑'}
                </button>
              </div>
              
              {(statusFilter !== 'all' || dateFilter.from || dateFilter.to || searchQuery) && (
                <button
                  onClick={handleClearFilters}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Orders Table - COMPACT VERSION */}
      <div className="bg-white rounded-xl border border-gray-200 p-0">
        {orders.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900">No orders found</h3>
            <p className="text-gray-600 mt-1">
              {searchQuery || statusFilter !== 'all' || dateFilter.from || dateFilter.to
                ? 'Try adjusting your filters'
                : 'No orders have been placed yet'
              }
            </p>
            {(searchQuery || statusFilter !== 'all' || dateFilter.from || dateFilter.to) && (
              <button
                onClick={handleClearFilters}
                className="mt-4 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[900px]">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm">Order</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm">Customer</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm">Product</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm">Date</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm">Amount</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm">Status</th>
                   
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {orders.map((order) => (
                    <tr 
                      key={order.id} 
                      className="hover:bg-gray-50 transition-colors cursor-pointer group"
                      onClick={() => router.push(`/dashboard/orders/${order.id}`)}
                    >
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-900 text-sm">
                          {order.orderNumber}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Qty: {order.quantity}
                        </div>
                      </td>
                      
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <div className="w-6 h-6 bg-gray-100 rounded-full mr-2 overflow-hidden flex-shrink-0 flex items-center justify-center">
                            <User className="w-3 h-3 text-gray-500" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 text-sm truncate max-w-[120px]">{order.buyer.name}</p>
                            <p className="text-xs text-gray-500 truncate max-w-[120px]">{order.buyer.email}</p>
                          </div>
                        </div>
                      </td>
                      
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <div className="w-6 h-6 bg-gray-100 rounded mr-2 overflow-hidden flex-shrink-0">
                            {order.product?.image ? (
                              <img
                                src={order.product.image}
                                alt={order.product.name}
                                className="w-full h-full object-cover"
                              />
                            ) : order.variant?.image ? (
                              <img
                                src={order.variant.image}
                                alt={order.product?.name || 'Product'}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                                <Package className="w-3 h-3 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 text-sm truncate max-w-[120px]">
                              {order.product?.name || 'Product'}
                            </p>
                            {order.variant?.sku && (
                              <p className="text-xs text-gray-500">SKU: {order.variant.sku}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      
                      <td className="py-3 px-4">
                        <div>
                          <p className="text-gray-900 text-sm">{formatDate(order.createdAt)}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </td>
                      
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-bold text-gray-900 text-sm">
                            {formatCurrency(order.total)}
                          </p>
                        </div>
                      </td>
                      
                      <td className="py-3 px-4">
                        <OrderStatusBadge status={order.status} />
                      </td>
                      
                      
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white rounded-xl border border-gray-200 p-4">
          <div>
            <p className="text-gray-600 text-sm">
              Showing {((currentPage - 1) * limit) + 1} to {Math.min(currentPage * limit, totalCount)} of {totalCount} orders
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="flex items-center px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors text-sm"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </button>
            
            <div className="flex items-center space-x-1">
              {(() => {
                const pages = [];
                const maxVisible = 5;
                
                if (totalPages <= maxVisible) {
                  for (let i = 1; i <= totalPages; i++) {
                    pages.push(i);
                  }
                } else {
                  if (currentPage <= 3) {
                    for (let i = 1; i <= 4; i++) {
                      pages.push(i);
                    }
                    pages.push('...');
                    pages.push(totalPages);
                  } else if (currentPage >= totalPages - 2) {
                    pages.push(1);
                    pages.push('...');
                    for (let i = totalPages - 3; i <= totalPages; i++) {
                      pages.push(i);
                    }
                  } else {
                    pages.push(1);
                    pages.push('...');
                    pages.push(currentPage - 1);
                    pages.push(currentPage);
                    pages.push(currentPage + 1);
                    pages.push('...');
                    pages.push(totalPages);
                  }
                }
                
                return pages.map((page, index) => (
                  <button
                    key={index}
                    onClick={() => typeof page === 'number' && setCurrentPage(page)}
                    disabled={page === '...'}
                    className={`
                      w-8 h-8 rounded-lg transition-colors text-sm
                      ${typeof page === 'number'
                        ? currentPage === page
                          ? 'bg-black text-white'
                          : 'border border-gray-300 hover:bg-gray-50'
                        : 'cursor-default'
                      }
                    `}
                  >
                    {page}
                  </button>
                ));
              })()}
            </div>
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="flex items-center px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors text-sm"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
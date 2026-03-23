// app/dashboard/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  TrendingUp, 
  Package, 
  ShoppingCart, 
  DollarSign,
  Users,
  AlertCircle,
  Clock,
  ChevronRight,
  BarChart3,
  TrendingDown,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import SalesChart from '../components/SalesChart';
import RecentOrders from '../components/RecentOrders';
import TopProducts from '../components/TopProducts';

interface DashboardStats {
  overview: {
    totalProducts: number;
    totalVariants: number;
    totalStock: number;
    outOfStockVariants: number;
    lowStockVariants: number;
  };
  sales: {
    totalRevenue: number;
    totalOrders: number;
    recentRevenue: number;
    averageOrderValue: number;
    pendingOrders: number;
  };
  performance: {
    averageRating: number;
    totalReviews: number;
    fulfillmentRate: string;
  };
  charts: {
    monthlyRevenue: Array<{ month: string; revenue: number }>;
  };
  topProducts: Array<{
    id: string;
    name: string;
    revenue: number;
    quantity: number;
    image?: string;
  }>;
  recentActivity: {
    lastOrder: {
      id: number;
      total: number;
      date: string;
      status: string;
    } | null;
    pendingOrdersCount: number;
  };
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/seller/dashboard/stats');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch stats: ${response.status}`);
      }
      
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Revenue',
      value: stats?.sales?.totalRevenue 
        ? `$${stats.sales.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        : '$0.00',
      change: '+12.5%',
      trend: 'up',
      icon: <DollarSign className="w-6 h-6" />,
      color: 'bg-green-50 text-green-700',
      iconColor: 'text-green-600',
    },
    {
      title: 'Total Orders',
      value: stats?.sales?.totalOrders?.toLocaleString() || '0',
      change: '+8.2%',
      trend: 'up',
      icon: <ShoppingCart className="w-6 h-6" />,
      color: 'bg-blue-50 text-blue-700',
      iconColor: 'text-blue-600',
    },
    {
      title: 'Products',
      value: stats?.overview?.totalProducts?.toLocaleString() || '0',
      change: '+5',
      trend: 'up',
      icon: <Package className="w-6 h-6" />,
      color: 'bg-purple-50 text-purple-700',
      iconColor: 'text-purple-600',
    },
    {
      title: 'Pending Orders',
      value: stats?.sales?.pendingOrders?.toLocaleString() || '0',
      change: '-2',
      trend: 'down',
      icon: <Clock className="w-6 h-6" />,
      color: 'bg-yellow-50 text-yellow-700',
      iconColor: 'text-yellow-600',
    },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'CANCELLED':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-600" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-9 bg-gray-200 rounded w-48 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-64 mt-2 animate-pulse"></div>
          </div>
          <div className="flex space-x-3">
            <div className="h-10 bg-gray-200 rounded-lg w-32 animate-pulse"></div>
            <div className="h-10 bg-gray-200 rounded-lg w-32 animate-pulse"></div>
          </div>
        </div>

        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                <div className="h-4 bg-gray-200 rounded w-16"></div>
              </div>
              <div className="h-8 bg-gray-200 rounded mt-4"></div>
              <div className="h-4 bg-gray-200 rounded mt-2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-center">
            <AlertCircle className="w-6 h-6 text-red-600 mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-red-800">Error Loading Dashboard</h3>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
          <button
            onClick={fetchDashboardStats}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
          <p className="text-gray-600 mt-1">
            {stats?.recentActivity?.lastOrder 
              ? `Last order: ${new Date(stats.recentActivity.lastOrder.date).toLocaleDateString()}`
              : 'No orders yet'}
          </p>
        </div>
        <div className="flex space-x-3">
          <Link
            href="/dashboard/products/new"
            className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center"
          >
            + Add Product
          </Link>
          <button 
            onClick={fetchDashboardStats}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Refresh Data
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => (
          <div key={index} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className={`p-3 rounded-lg ${card.color}`}>
                <div className={card.iconColor}>{card.icon}</div>
              </div>
              <div className={`flex items-center text-sm font-medium ${card.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                {card.trend === 'up' ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                {card.change}
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mt-4">{card.value}</h3>
            <p className="text-gray-600 mt-1">{card.title}</p>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Chart */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Revenue Overview</h2>
                <p className="text-gray-600">Monthly performance</p>
              </div>
              <div className="flex items-center space-x-2">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-sm text-gray-600">Revenue</span>
                </div>
              </div>
            </div>
            <SalesChart data={stats?.charts?.monthlyRevenue || []} />
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Performance Metrics</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <Activity className="w-5 h-5 text-green-600 mr-3" />
                <div>
                  <p className="font-medium text-gray-900">Fulfillment Rate</p>
                  <p className="text-sm text-gray-600">Orders delivered</p>
                </div>
              </div>
              <span className="text-lg font-bold text-gray-900">
                {stats?.performance?.fulfillmentRate || '0'}%
              </span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <BarChart3 className="w-5 h-5 text-blue-600 mr-3" />
                <div>
                  <p className="font-medium text-gray-900">Avg. Order Value</p>
                  <p className="text-sm text-gray-600">Per transaction</p>
                </div>
              </div>
              <span className="text-lg font-bold text-gray-900">
                ${stats?.sales?.averageOrderValue?.toFixed(2) || '0.00'}
              </span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <Users className="w-5 h-5 text-purple-600 mr-3" />
                <div>
                  <p className="font-medium text-gray-900">Customer Rating</p>
                  <p className="text-sm text-gray-600">Based on reviews</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-lg font-bold text-gray-900">
                  {stats?.performance?.averageRating?.toFixed(1) || '0.0'}/5
                </span>
                <p className="text-sm text-gray-600">
                  ({stats?.performance?.totalReviews?.toLocaleString() || 0} reviews)
                </p>
              </div>
            </div>

            {/* Last Order Status */}
            {stats?.recentActivity?.lastOrder && (
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  {getStatusIcon(stats.recentActivity.lastOrder.status)}
                  <div className="ml-3">
                    <p className="font-medium text-gray-900">Last Order</p>
                    <p className="text-sm text-gray-600">
                      #{stats.recentActivity.lastOrder.id}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold text-gray-900">
                    ${stats.recentActivity.lastOrder.total.toFixed(2)}
                  </span>
                  <p className="text-sm text-gray-600 capitalize">
                    {stats.recentActivity.lastOrder.status.toLowerCase()}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <RecentOrders />
        
        {/* Top Products */}
        <TopProducts products={stats?.topProducts || []} />
      </div>

      {/* Inventory Overview */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Inventory Overview</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">
              {stats?.overview?.totalStock?.toLocaleString() || '0'}
            </div>
            <p className="text-gray-600">Total Stock</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-red-600">
              {stats?.overview?.outOfStockVariants?.toLocaleString() || '0'}
            </div>
            <p className="text-gray-600">Out of Stock</p>
            {stats?.overview?.outOfStockVariants! > 0 && (
              <button className="mt-2 text-sm text-red-600 hover:text-red-700 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-4 h-4 mr-1" />
                Restock needed
              </button>
            )}
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-yellow-600">
              {stats?.overview?.lowStockVariants?.toLocaleString() || '0'}
            </div>
            <p className="text-gray-600">Low Stock</p>
            {stats?.overview?.lowStockVariants! > 0 && (
              <button className="mt-2 text-sm text-yellow-600 hover:text-yellow-700 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-4 h-4 mr-1" />
                Check inventory
              </button>
            )}
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">
              ${stats?.sales?.recentRevenue?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
            </div>
            <p className="text-gray-600">Recent Revenue (30d)</p>
          </div>
        </div>
      </div>
    </div>
  );
}
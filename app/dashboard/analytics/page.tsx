// app/dashboard/analytics/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  Download,
  Filter,
} from "lucide-react";

interface AnalyticsData {
  overview: {
    totalOrders: number;
    totalRevenue: number;
    pendingOrders: number;
    processingOrders: number;
    averageOrderValue: number;
    conversionRate: number;
  };
  charts: {
    dailyData: Array<{ date: string; order_count: number; revenue: number }>;
    monthlyRevenue: Array<{
      month: string;
      revenue: number;
      order_count: number;
    }>;
    categoryDistribution: Array<{
      category: string;
      order_count: number;
      revenue: number;
    }>;
    statusDistribution: Array<{ status: string; _count: number }>;
  };
  topProducts: Array<{
    id: string;
    name: string;
    image?: string;
    revenue: number;
    orders: number;
    quantity: number;
  }>;
  timeRange: {
    start: string;
    end: string;
    range: string;
  };
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("month");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(
        `/api/seller/orders/analytics?range=${timeRange}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch analytics: ${response.status}`);
      }

      const analyticsData = await response.json();
      setData(analyticsData);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      setError("Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  };
  const handleExportAnalytics = async () => {
    try {
      if (!data) return;

      // Prepare export data
      const exportData = {
        timeRange: data.timeRange,
        overview: data.overview,
        charts: {
          monthlyRevenue: data.charts.monthlyRevenue,
          categoryDistribution: data.charts.categoryDistribution,
          statusDistribution: data.charts.statusDistribution,
        },
        topProducts: data.topProducts.map((product) => ({
          name: product.name,
          revenue: product.revenue,
          orders: product.orders,
          quantity: product.quantity,
          image: product.image,
        })),
        exportDate: new Date().toISOString(),
      };

      // Send to API to generate Excel file
      const response = await fetch("/api/seller/orders/analytics/export", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(exportData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate export");
      }

      // Get the blob and create download link
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;

      // Create filename
      const dateStr = new Date().toISOString().split("T")[0];
      const filename = `analytics_${timeRange}_${dateStr}.xlsx`;

      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error: any) {
      console.error("Export error:", error);
      // Show error to user
      setError("Failed to export analytics data. Please try again.");
    }
  };
  const timeRangeOptions = [
    { value: "week", label: "Last 7 days" },
    { value: "month", label: "Last 30 days" },
    { value: "quarter", label: "Last 3 months" },
    { value: "year", label: "Last 12 months" },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-9 bg-gray-200 rounded w-48 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-64 mt-2 animate-pulse"></div>
          </div>
          <div className="h-10 bg-gray-200 rounded-lg w-40 animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse"
            >
              <div className="h-6 bg-gray-200 rounded w-3/4"></div>
              <div className="h-10 bg-gray-200 rounded mt-4"></div>
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
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-red-600" />
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-red-800">
                Error Loading Analytics
              </h3>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
          <button
            onClick={fetchAnalyticsData}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900">
            No Analytics Data
          </h3>
          <p className="text-gray-600 mt-1">
            Start selling to see your analytics
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Analytics Dashboard
          </h1>
          <p className="text-gray-600 mt-1">
            {data.timeRange && (
              <>
                <Calendar className="inline w-4 h-4 mr-1" />
                {new Date(data.timeRange.start).toLocaleDateString()} -{" "}
                {new Date(data.timeRange.end).toLocaleDateString()}
              </>
            )}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black appearance-none"
            >
              {timeRangeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={handleExportAnalytics}
            className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading || !data}
          >
            <Download className="w-4 h-4 mr-2" />
            {loading ? "Loading..." : "Export"}
          </button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-50 rounded-lg mr-4">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                $
                {data.overview.totalRevenue.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
              <div className="flex items-center text-green-600 text-sm mt-1">
                <TrendingUp className="w-4 h-4 mr-1" />
                <span>+12.5%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-50 rounded-lg mr-4">
              <ShoppingCart className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">
                {data.overview.totalOrders.toLocaleString()}
              </p>
              <div className="flex items-center text-green-600 text-sm mt-1">
                <TrendingUp className="w-4 h-4 mr-1" />
                <span>+8.2%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-50 rounded-lg mr-4">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Avg. Order Value</p>
              <p className="text-2xl font-bold text-gray-900">
                ${data.overview.averageOrderValue.toFixed(2)}
              </p>
              <div className="flex items-center text-red-600 text-sm mt-1">
                <TrendingDown className="w-4 h-4 mr-1" />
                <span>-1.2%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-50 rounded-lg mr-4">
              <Package className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Pending Orders</p>
              <p className="text-2xl font-bold text-gray-900">
                {data.overview.pendingOrders.toLocaleString()}
              </p>
              <div className="flex items-center text-green-600 text-sm mt-1">
                <TrendingDown className="w-4 h-4 mr-1" />
                <span>-5.4%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            Revenue Trend
          </h2>
          {data.charts.monthlyRevenue.length > 0 ? (
            <div className="space-y-2">
              {data.charts.monthlyRevenue.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg"
                >
                  <span className="text-gray-700">{item.month}</span>
                  <div className="flex items-center space-x-4">
                    <span className="font-medium text-gray-900">
                      {item.order_count} orders
                    </span>
                    <span className="font-bold text-green-600">
                      ${item.revenue.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600">No revenue data available</p>
            </div>
          )}
        </div>

        {/* Category Distribution */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            Top Categories
          </h2>
          {data.charts.categoryDistribution.length > 0 ? (
            <div className="space-y-4">
              {data.charts.categoryDistribution.map((category, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-gray-900">
                      {category.category}
                    </span>
                    <span className="text-sm text-gray-600">
                      {category.order_count} orders
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{
                        width: `${Math.min(
                          (category.revenue /
                            data.charts.categoryDistribution[0].revenue) *
                            100,
                          100
                        )}%`,
                      }}
                    ></div>
                  </div>
                  <div className="text-right mt-1">
                    <span className="text-sm font-medium text-gray-900">
                      ${category.revenue.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600">No category data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Order Status Distribution */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">
          Order Status Distribution
        </h2>
        {data.charts.statusDistribution.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {data.charts.statusDistribution.map((status) => {
              const totalOrders = data.charts.statusDistribution.reduce(
                (sum, s) => sum + s._count,
                0
              );
              const percentage = (status._count / totalOrders) * 100;

              const getStatusColor = (status: string) => {
                switch (status) {
                  case "PENDING":
                    return "bg-yellow-100 text-yellow-800";
                  case "PROCESSING":
                    return "bg-blue-100 text-blue-800";
                  case "SHIPPED":
                    return "bg-purple-100 text-purple-800";
                  case "DELIVERED":
                    return "bg-green-100 text-green-800";
                  case "CANCELLED":
                    return "bg-red-100 text-red-800";
                  default:
                    return "bg-gray-100 text-gray-800";
                }
              };

              return (
                <div key={status.status} className="text-center">
                  <div
                    className={`px-4 py-3 rounded-lg ${getStatusColor(
                      status.status
                    )} mb-2`}
                  >
                    <p className="text-lg font-bold">{status._count}</p>
                  </div>
                  <p className="text-sm font-medium text-gray-900 capitalize">
                    {status.status.toLowerCase()}
                  </p>
                  <p className="text-sm text-gray-600">
                    {percentage.toFixed(1)}%
                  </p>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600">No status data available</p>
          </div>
        )}
      </div>
    </div>
  );
}

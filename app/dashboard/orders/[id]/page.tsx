// app/dashboard/orders/[id]/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  Printer,
  Download,
  Mail,
  Phone,
  MapPin,
  Package,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  Edit,
  RefreshCw,
  AlertCircle,
  User,
  CreditCard,
  Calendar,
  DollarSign,
  Package2,
  Hash,
  Globe,
  ChevronRight
} from 'lucide-react';
import OrderStatusBadge from '@/app/components/OrderStatusBadge';
import OrderStatusTimeline from '@/app/components/OrderStatusTimeline';
import UpdateStatusModal from '@/app/components/UpdateStatusModal';


interface OrderDetails {
  id: number;
  orderNumber: string;
  buyer: {
    id: number;
    name: string;
    email: string;
    phone?: string;
    address?: string;
  };
  product?: {
    id: number;
    name: string;
    price: number;
    category: string;
    description?: string;
    images: Array<{
      url: string;
      altText?: string;
      isPrimary: boolean;
    }>;
  };
  variant?: {
    id: number;
    sku: string;
    currentStock: number;
    attributes?: Array<{
      attribute: {
        name: string;
        displayName: string;
      };
      value: {
        value: string;
        displayName: string;
        hexColor?: string;
      };
    }>;
    images: Array<{
      url: string;
      altText?: string;
      isPrimary: boolean;
    }>;
  };
  quantity: number;
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  status: string;
  notes?: string;
  paymentMethod: string;
  shippingAddress?: {
    fullName: string;
    email: string;
    phone: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  seller: {
    id: number;
    name: string;
    email: string;
    phone?: string;
    address?: string;
  };
  createdAt: string;
  updatedAt: string;
  variantAttributes?: Record<string, {
    displayName: string;
    value: string;
    color?: string;
  }>;
}

export default function OrderDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;

  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updateModalOpen, setUpdateModalOpen] = useState(false);

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/seller/orders/${orderId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Order not found');
        }
        throw new Error(`Failed to load order: ${response.status}`);
      }
      
      const data = await response.json();
      setOrder(data);
    } catch (error: any) {
      console.error('Error fetching order details:', error);
      setError(error.message || 'Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus: string, notes?: string) => {
    try {
      const response = await fetch(`/api/seller/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          notes
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update order status');
      }

      await fetchOrderDetails();
      setUpdateModalOpen(false);
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Failed to update order status');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-64 bg-gray-200 rounded"></div>
              <div className="h-48 bg-gray-200 rounded"></div>
            </div>
            <div className="space-y-6">
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-48 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-center">
            <AlertCircle className="w-6 h-6 text-red-600 mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-red-800">Error Loading Order</h3>
              <p className="text-red-700">{error || 'Order not found'}</p>
            </div>
          </div>
          <div className="flex space-x-3 mt-4">
            <button
              onClick={() => router.back()}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Go Back
            </button>
            <button
              onClick={fetchOrderDetails}
              className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const primaryImage = order.product?.images?.find(img => img.isPrimary)?.url ||
                      order.variant?.images?.find(img => img.isPrimary)?.url ||
                      order.product?.images?.[0]?.url;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Orders
          </button>
          <div className="flex items-center space-x-4">
            <h1 className="text-3xl font-bold text-gray-900">
              Order {order.orderNumber}
            </h1>
            <OrderStatusBadge status={order.status} size="lg" />
          </div>
          <p className="text-gray-600 mt-1">
            Placed on {formatDate(order.createdAt)}
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setUpdateModalOpen(true)}
            className="flex items-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            <Edit className="w-4 h-4 mr-2" />
            Update Status
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Printer className="w-4 h-4 mr-2" />
            Print
          </button>
          <button className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Order Items, Timeline, Shipping, Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Order Items</h2>
            
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg mr-4 overflow-hidden flex-shrink-0">
                      {primaryImage ? (
                        <img
                          src={primaryImage}
                          alt={order.product?.name || 'Product'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                          <Package className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{order.product?.name}</h3>
                      <p className="text-sm text-gray-600">{order.product?.category}</p>
                      {order.variant?.sku && (
                        <p className="text-sm text-gray-500 mt-1">
                          SKU: {order.variant.sku}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">
                      {formatCurrency(order.product?.price || 0)}
                    </p>
                    <p className="text-sm text-gray-600">Price</p>
                  </div>
                </div>
              </div>

              {/* Product Details */}
              <div className="p-4">
                {order.variantAttributes && Object.keys(order.variantAttributes).length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-900 mb-2">Variant Details</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {Object.entries(order.variantAttributes).map(([key, attr]) => (
                        <div key={key} className="bg-gray-50 rounded-lg p-3">
                          <p className="text-sm text-gray-600">{attr.displayName}</p>
                          <div className="flex items-center mt-1">
                            {attr.color && (
                              <div
                                className="w-4 h-4 rounded-full mr-2 border border-gray-300"
                                style={{ backgroundColor: attr.color }}
                              />
                            )}
                            <p className="font-medium text-gray-900">{attr.value}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quantity & Subtotal */}
                <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                  <div className="flex items-center">
                    <Package2 className="w-5 h-5 text-gray-400 mr-2" />
                    <span className="text-gray-700">Quantity:</span>
                    <span className="font-bold text-gray-900 ml-2">{order.quantity}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Subtotal</p>
                    <p className="font-bold text-gray-900">
                      {formatCurrency(order.subtotal)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Order Timeline */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Order Timeline</h2>
            <OrderStatusTimeline orderId={orderId} />
          </div>

          {/* Notes Section */}
          {order.notes && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Order Notes</h2>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-gray-800">{order.notes}</p>
              </div>
            </div>
          )}

          {/* Shipping Address (Moved Here) */}
          {order.shippingAddress && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Shipping Address</h2>
              
              <div className="space-y-4">
                <div className="flex items-center">
                  <User className="w-5 h-5 text-gray-400 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">{order.shippingAddress.fullName}</p>
                    <p className="text-sm text-gray-600">{order.shippingAddress.email}</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <Phone className="w-5 h-5 text-gray-400 mr-3" />
                  <span className="text-gray-700">{order.shippingAddress.phone}</span>
                </div>
                
                <div className="flex items-start">
                  <MapPin className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                  <div>
                    <p className="text-gray-700">{order.shippingAddress.street}</p>
                    <p className="text-gray-700">
                      {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
                    </p>
                    <p className="text-gray-700">{order.shippingAddress.country}</p>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <button className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  <Truck className="w-4 h-4 inline mr-2" />
                  Track Shipment
                </button>
              </div>
            </div>
          )}

          {/* Order Information (Moved Here) */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Order Information</h2>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Order ID</span>
                <span className="font-medium text-gray-900">{order.orderNumber}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Date Placed</span>
                <span className="font-medium text-gray-900">
                  {new Date(order.createdAt).toLocaleDateString()}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Last Updated</span>
                <span className="font-medium text-gray-900">
                  {new Date(order.updatedAt).toLocaleDateString()}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Order Type</span>
                <span className="font-medium text-gray-900">Standard</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Summary & Customer Info Only */}
        <div className="space-y-6">
          {/* Order Summary */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>
            
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium text-gray-900">{formatCurrency(order.subtotal)}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Tax</span>
                <span className="font-medium text-gray-900">{formatCurrency(order.tax)}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Shipping</span>
                <span className="font-medium text-gray-900">{formatCurrency(order.shipping)}</span>
              </div>
              
              <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-between">
                  <span className="font-bold text-gray-900">Total</span>
                  <span className="text-2xl font-bold text-gray-900">{formatCurrency(order.total)}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-600">Payment Method</span>
                  <span className="font-medium text-gray-900 capitalize">
                    {order.paymentMethod.toLowerCase().replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Payment Status</span>
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                    Paid
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Customer Information */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Customer Information</h2>
            
            <div className="space-y-4">
              <div className="flex items-center">
                <User className="w-5 h-5 text-gray-400 mr-3" />
                <div>
                  <p className="font-medium text-gray-900">{order.buyer.name}</p>
                  <p className="text-sm text-gray-600">{order.buyer.email}</p>
                </div>
              </div>
              
              {order.buyer.phone && (
                <div className="flex items-center">
                  <Phone className="w-5 h-5 text-gray-400 mr-3" />
                  <span className="text-gray-700">{order.buyer.phone}</span>
                </div>
              )}
              
              {order.buyer.address && (
                <div className="flex items-start">
                  <MapPin className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                  <span className="text-gray-700">{order.buyer.address}</span>
                </div>
              )}
            </div>

            <button className="w-full mt-6 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Mail className="w-4 h-4 inline mr-2" />
              Contact Customer
            </button>
          </div>
        </div>
      </div>

      {/* Update Status Modal */}
      <UpdateStatusModal
        isOpen={updateModalOpen}
        onClose={() => setUpdateModalOpen(false)}
        currentStatus={order.status}
        onStatusUpdate={handleStatusUpdate}
      />
    </div>
  );
}
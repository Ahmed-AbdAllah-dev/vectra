// components/orders/OrderStatusTimeline.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Package, 
  Truck, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  MoreVertical
} from 'lucide-react';

interface StatusHistory {
  id: number;
  status: string;
  notes?: string;
  changedBy: string;
  changedById?: number;
  changedByUser?: {
    name: string;
    email: string;
  };
  createdAt: string;
}

interface OrderStatusTimelineProps {
  orderId: string;
}

const statusConfig = {
  PENDING: {
    label: 'Pending',
    icon: <Clock className="w-4 h-4" />,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100'
  },
  PROCESSING: {
    label: 'Processing',
    icon: <Package className="w-4 h-4" />,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100'
  },
  SHIPPED: {
    label: 'Shipped',
    icon: <Truck className="w-4 h-4" />,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100'
  },
  DELIVERED: {
    label: 'Delivered',
    icon: <CheckCircle className="w-4 h-4" />,
    color: 'text-green-600',
    bgColor: 'bg-green-100'
  },
  CANCELLED: {
    label: 'Cancelled',
    icon: <XCircle className="w-4 h-4" />,
    color: 'text-red-600',
    bgColor: 'bg-red-100'
  }
};

export default function OrderStatusTimeline({ orderId }: OrderStatusTimelineProps) {
  const [history, setHistory] = useState<StatusHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStatusHistory();
  }, [orderId]);

  const fetchStatusHistory = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/seller/orders/${orderId}/status`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch status history');
      }
      
      const data = await response.json();
      setHistory(data.history || []);
    } catch (error) {
      console.error('Error fetching status history:', error);
      setError('Failed to load timeline');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-start mb-4">
            <div className="w-8 h-8 bg-gray-200 rounded-full mt-1"></div>
            <div className="ml-4 flex-1">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/4"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-600">{error}</p>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-8">
        <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-600">No status history available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {history.map((item, index) => {
        const config = statusConfig[item.status as keyof typeof statusConfig] || statusConfig.PENDING;
        const isLast = index === 0;
        
        return (
          <div key={item.id} className="flex items-start">
            {/* Timeline line */}
            {!isLast && (
              <div className="absolute left-4 top-8 bottom-0 w-0.5 bg-gray-200"></div>
            )}
            
            {/* Status icon */}
            <div className={`
              relative z-10 flex items-center justify-center w-8 h-8 rounded-full
              ${config.bgColor} ${config.color}
            `}>
              {config.icon}
            </div>
            
            {/* Content */}
            <div className="ml-4 flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">
                    {config.label}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {item.notes || `Status changed to ${item.status.toLowerCase()}`}
                  </p>
                </div>
                <span className="text-sm text-gray-500">
                  {formatDate(item.createdAt)}
                </span>
              </div>
              
              {/* Changed by info */}
              <div className="mt-2 flex items-center text-sm text-gray-500">
                <span>Changed by </span>
                {item.changedByUser ? (
                  <span className="font-medium text-gray-700 ml-1">
                    {item.changedByUser.name}
                  </span>
                ) : (
                  <span className="font-medium text-gray-700 ml-1 capitalize">
                    {item.changedBy}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
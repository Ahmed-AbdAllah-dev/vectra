// components/orders/OrderStatusBadge.tsx
'use client';

import React from 'react';
import { 
  Clock, 
  Package, 
  Truck, 
  CheckCircle, 
  XCircle 
} from 'lucide-react';

interface OrderStatusBadgeProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
}

const statusConfig = {
  PENDING: {
    label: 'Pending',
    color: 'bg-yellow-50 text-yellow-800 border-yellow-200',
    icon: <Clock className="w-3 h-3 md:w-4 md:h-4" />,
    dotColor: 'bg-yellow-500'
  },
  PROCESSING: {
    label: 'Processing',
    color: 'bg-blue-50 text-blue-800 border-blue-200',
    icon: <Package className="w-3 h-3 md:w-4 md:h-4" />,
    dotColor: 'bg-blue-500'
  },
  SHIPPED: {
    label: 'Shipped',
    color: 'bg-purple-50 text-purple-800 border-purple-200',
    icon: <Truck className="w-3 h-3 md:w-4 md:h-4" />,
    dotColor: 'bg-purple-500'
  },
  DELIVERED: {
    label: 'Delivered',
    color: 'bg-green-50 text-green-800 border-green-200',
    icon: <CheckCircle className="w-3 h-3 md:w-4 md:h-4" />,
    dotColor: 'bg-green-500'
  },
  CANCELLED: {
    label: 'Cancelled',
    color: 'bg-red-50 text-red-800 border-red-200',
    icon: <XCircle className="w-3 h-3 md:w-4 md:h-4" />,
    dotColor: 'bg-red-500'
  }
};

export default function OrderStatusBadge({ status, size = 'md' }: OrderStatusBadgeProps) {
  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING;
  
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base'
  };

  return (
    <div className={`
      inline-flex items-center ${sizeClasses[size]} rounded-full border
      ${config.color} font-medium
    `}>
      <span className="mr-1.5">{config.icon}</span>
      {config.label}
      <span className={`ml-1.5 w-1.5 h-1.5 rounded-full ${config.dotColor}`}></span>
    </div>
  );
}
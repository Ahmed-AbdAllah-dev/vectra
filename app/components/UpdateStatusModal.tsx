'use client';

import React, { useState } from 'react';
import { 
  X, 
  AlertCircle, 
  Clock, 
  Package, 
  Truck, 
  CheckCircle, 
  XCircle 
} from 'lucide-react';

interface UpdateStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStatus: string;
  onStatusUpdate: (status: string, notes?: string) => Promise<void>;
}

// 1. Define transitions exactly as they are in your Backend
const allowedTransitions: Record<string, string[]> = {
  'PENDING': ['PROCESSING', 'CANCELLED'],
  'PROCESSING': ['CANCELLED'], // <--- CRITICAL: REMOVED 'SHIPPED' to match backend restriction
  'SHIPPED': ['DELIVERED'],
  'DELIVERED': [],
  'CANCELLED': [],
};

const statusOptions = [
  {
    value: 'PENDING',
    label: 'Pending',
    description: 'Order has been placed but not processed',
    icon: <Clock className="w-5 h-5" />,
    color: 'bg-yellow-100 text-yellow-800',
    dotColor: 'bg-yellow-500'
  },
  {
    value: 'PROCESSING',
    label: 'Processing',
    description: 'Order is being prepared for shipment',
    icon: <Package className="w-5 h-5" />,
    color: 'bg-blue-100 text-blue-800',
    dotColor: 'bg-blue-500'
  },
  {
    value: 'SHIPPED',
    label: 'Shipped',
    description: 'Order has been shipped to customer',
    icon: <Truck className="w-5 h-5" />,
    color: 'bg-purple-100 text-purple-800',
    dotColor: 'bg-purple-500'
  },
  {
    value: 'DELIVERED',
    label: 'Delivered',
    description: 'Order has been delivered to customer',
    icon: <CheckCircle className="w-5 h-5" />,
    color: 'bg-green-100 text-green-800',
    dotColor: 'bg-green-500'
  },
  {
    value: 'CANCELLED',
    label: 'Cancelled',
    description: 'Order has been cancelled',
    icon: <XCircle className="w-5 h-5" />,
    color: 'bg-red-100 text-red-800',
    dotColor: 'bg-red-500'
  }
];

export default function UpdateStatusModal({
  isOpen,
  onClose,
  currentStatus,
  onStatusUpdate
}: UpdateStatusModalProps) {
  const [selectedStatus, setSelectedStatus] = useState('');
  const [notes, setNotes] = useState('');
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  // Filter options based on strict backend rules
  const availableStatuses = statusOptions.filter(option => {
    const isCurrent = option.value === currentStatus;
    
    // 1. Always show the current status (so we can see what it is)
    if (isCurrent) return true;

    // 2. Check if transition is allowed from CURRENT status
    const transitions = allowedTransitions[currentStatus] || [];
    return transitions.includes(option.value);
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedStatus) {
      setError('Please select a status');
      return;
    }

    if (selectedStatus === currentStatus) {
      onClose();
      return;
    }

    try {
      setUpdating(true);
      setError('');
      await onStatusUpdate(selectedStatus, notes);
    } catch (error) {
      setError('Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'PENDING': return { color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="w-4 h-4" /> };
      case 'PROCESSING': return { color: 'bg-blue-100 text-blue-800', icon: <Package className="w-4 h-4" /> };
      case 'SHIPPED': return { color: 'bg-purple-100 text-purple-800', icon: <Truck className="w-4 h-4" /> };
      case 'DELIVERED': return { color: 'bg-green-100 text-green-800', icon: <CheckCircle className="w-4 h-4" /> };
      case 'CANCELLED': return { color: 'bg-red-100 text-red-800', icon: <XCircle className="w-4 h-4" /> };
      default: return { color: 'bg-gray-100 text-gray-800', icon: <Clock className="w-4 h-4" /> };
    }
  };

  const currentStatusConfig = getStatusConfig(currentStatus);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative bg-white rounded-xl max-w-md w-full p-6 shadow-xl">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>

          {/* Current Status */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Update Order Status
            </h3>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <div className={`p-2 rounded-lg mr-3 ${currentStatusConfig.color}`}>
                  {currentStatusConfig.icon}
                </div>
                <div>
                  <p className="text-sm text-gray-600">Current Status</p>
                  <p className="font-medium text-gray-900 capitalize">
                    {currentStatus.toLowerCase()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Status Options */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-900 mb-3">
                Select New Status
              </label>
              <div className="space-y-2">
                {availableStatuses.map((option) => {
                  const config = getStatusConfig(option.value);
                  const isCurrent = option.value === currentStatus;
                  
                  return (
                    <label
                      key={option.value}
                      className={`
                        flex items-center p-3 border rounded-lg cursor-pointer transition-colors
                        ${selectedStatus === option.value
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:bg-gray-50'
                        }
                        ${isCurrent ? 'opacity-50 cursor-not-allowed' : ''}
                      `}
                    >
                      <input
                        type="radio"
                        name="status"
                        value={option.value}
                        checked={selectedStatus === option.value}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        disabled={isCurrent}
                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <div className="ml-3 flex items-center">
                        <div className={`p-2 rounded-lg mr-3 ${config.color}`}>
                          {config.icon}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{option.label}</p>
                          <p className="text-sm text-gray-600">{option.description}</p>
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Notes */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Add Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="Add notes about this status change..."
                rows={3}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                disabled={updating}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updating || selectedStatus === currentStatus}
                className="flex-1 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updating ? 'Updating...' : 'Update Status'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
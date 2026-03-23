'use client'
import React, { useState, useEffect } from 'react';
import { User, MapPin, CreditCard, Package, Heart, Settings, LogOut, Edit2, Plus, ChevronRight } from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navbar from '../components/Navbar';

interface BuyerData {
  id: number;
  name: string;
  email: string;
  phone: string;
  profileImage?: string | null;
  avatar: string;
  memberSince: string;
  address?: any[];
  recentOrders: any[];
  savedCards: any[];
  stats: {
    totalOrders: number;
    totalReviews: number;
    totalSpent: number;
  };
}

interface Order {
  id: number;
  date: string;
  status: string;
  total: number;
  items: number;
  image: string;
}

interface Address {
  id: number;
  type: string;
  isDefault: boolean;
  fullName: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone: string;
}

export default function BuyerProfilePage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [buyer, setBuyer] = useState<BuyerData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { data: session, status } = useSession();
  const router = useRouter();

  // Sync URL hash with active tab
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
      return;
    }

    if (status === 'authenticated') {
      fetchProfileData();
    }

    // Set initial tab from URL hash
    const hash = window.location.hash.replace('#', '');
    if (hash && ['overview', 'orders', 'address', 'settings'].includes(hash)) {
      setActiveTab(hash);
    }
  }, [status, router]);

  // Update URL hash when activeTab changes
  useEffect(() => {
    if (typeof window !== 'undefined' && buyer) {
      window.history.replaceState(null, '', `#${activeTab}`);
    }
  }, [activeTab, buyer]);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
  };

  const fetchProfileData = async () => {
    try {
      const response = await fetch('/api/buyer/profile');
      if (response.ok) {
        const data = await response.json();
        console.log('Profile API response:', data);
        console.log('Recent orders with images:', data.recentOrders?.map((order: any) => ({
          id: order.id,
          image: order.image
        })));
        setBuyer(data);
      } else {
        console.error('Failed to fetch profile data');
      }
    } catch (error) {
      console.error('Failed to fetch profile data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (profileData: { name: string; phone: string }) => {
    setSaving(true);
    try {
      const response = await fetch('/api/buyer/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });
      
      if (response.ok) {
        const result = await response.json();
        setBuyer(prev => prev ? { ...prev, ...result.buyer } : null);
        setIsEditing(false);
        return result;
      }
      throw new Error('Failed to update profile');
    } catch (error) {
      console.error('Profile update error:', error);
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const saveAddress = async (addressData: any) => {
    setSaving(true);
    try {
      const response = await fetch('/api/buyer/address', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          street: addressData.street,
          city: addressData.city,
          state: addressData.state,
          zipCode: addressData.zipCode,
          country: addressData.country
        }),
      });
      
      if (response.ok) {
        const result = await response.json();
        return result;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save address');
      }
    } catch (error) {
      console.error('Address save error:', error);
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    signOut({ callbackUrl: '/' });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return 'text-green-600 bg-green-100';
      case 'shipped':
        return 'text-blue-600 bg-blue-100';
      case 'processing':
        return 'text-yellow-600 bg-yellow-100';
      case 'cancelled':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  // Loading state
  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  if (!buyer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center text-red-600">
          <p>Failed to load profile data</p>
          <button 
            onClick={fetchProfileData}
            className="mt-4 px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Overview Tab
  const OverviewTab = () => (
    <div className="space-y-6">
      {/* Profile Card */}
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <img
              src={buyer.avatar}
              alt={buyer.name}
              className="w-20 h-20 rounded-full border-2 border-gray-200"
            />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{buyer.name}</h2>
              <p className="text-gray-600">{buyer.email}</p>
              <p className="text-sm text-gray-500 mt-1">
                Member since {new Date(buyer.memberSince).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>
          
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Total Orders</p>
            <p className="text-2xl font-bold text-gray-900">{buyer.stats.totalOrders}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Total Spent</p>
            <p className="text-2xl font-bold text-gray-900">
              ${buyer.stats.totalSpent.toFixed(2)}
            </p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Reviews</p>
            <p className="text-2xl font-bold text-gray-900">{buyer.stats.totalReviews}</p>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Recent Orders</h3>
          <button
            onClick={() => handleTabChange('orders')}
            className="text-black hover:text-gray-800 text-sm font-medium transition-colors"
          >
            View All
          </button>
        </div>
        <div className="space-y-3">
          {buyer.recentOrders.slice(0, 3).map((order) => (
            <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-4">
                {order.image ? (
                  <img 
                    src={order.image} 
                    alt={`Order ${order.id}`} 
                    className="w-16 h-16 rounded object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded bg-gray-200 flex items-center justify-center">
                    <Package className="w-8 h-8 text-gray-400" />
                  </div>
                )}
                <div>
                  <p className="font-medium text-gray-900">Order #{order.id}</p>
                  <p className="text-sm text-gray-600">{order.items} items • {order.date}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900">${order.total.toFixed(2)}</p>
                <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(order.status)}`}>
                  {order.status}
                </span>
              </div>
            </div>
          ))}
          {buyer.recentOrders.length === 0 && (
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No orders yet</p>
              <a href="/" className="inline-block mt-4 px-6 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors">
                Start Shopping
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={() => handleTabChange('address')}
          className="flex items-center justify-between p-4 bg-white border rounded-lg hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <MapPin className="w-5 h-5 text-gray-600" />
            <span className="font-medium">Manage Address</span>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </button>
      </div>
    </div>
  );

  // Orders Tab
 // Orders Tab
const OrdersTab = () => {
  const [orders, setOrders] = useState<Order[]>(buyer.recentOrders);
  const [loadingOrders, setLoadingOrders] = useState(false);

  const loadAllOrders = async () => {
    setLoadingOrders(true);
    try {
      // Use the same data source as overview - fetch profile data which includes recentOrders
      const response = await fetch('/api/buyer/profile');
      if (response.ok) {
        const data = await response.json();
        console.log('Profile data for orders:', data);
        // If you need more orders than what's in recentOrders, you might need to adjust your API
        setOrders(data.recentOrders || []);
      } else {
        console.error('Failed to load orders from profile');
        // Fallback to the existing recentOrders
        setOrders(buyer.recentOrders);
      }
    } catch (error) {
      console.error('Failed to load orders:', error);
      setOrders(buyer.recentOrders);
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'orders') {
      loadAllOrders();
    }
  }, [activeTab]);

  return (
    <div className="bg-white rounded-lg border">
      <div className="p-6 border-b">
        <h3 className="text-lg font-semibold">Order History</h3>
      </div>
      {loadingOrders ? (
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading orders...</p>
        </div>
      ) : (
        <div className="divide-y">
          {orders.map((order) => (
            <div key={order.id} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="font-semibold text-gray-900">Order #{order.id}</p>
                  <p className="text-sm text-gray-600">Placed on {order.date}</p>
                </div>
                <span className={`text-sm px-3 py-1 rounded-full ${getStatusColor(order.status)}`}>
                  {order.status}
                </span>
              </div>
              <div className="flex items-center gap-4 mb-4">
                {order.image ? (
                  <img 
                    src={order.image} 
                    alt={`Order ${order.id}`} 
                    className="w-20 h-20 rounded object-cover"
                  />
                ) : (
                  <div className="w-20 h-20 rounded bg-gray-200 flex items-center justify-center">
                    <Package className="w-10 h-10 text-gray-400" />
                  </div>
                )}
                <div className="flex-1">
                  <p className="text-sm text-gray-600">{order.items} items</p>
                  <p className="font-semibold text-gray-900 mt-1">${order.total.toFixed(2)}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50 transition-colors">
                  View Details
                </button>
                {order.status === 'Delivered' && (
                  <button className="px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50 transition-colors">
                    Leave Review
                  </button>
                )}
                <button className="px-4 py-2 bg-black text-white rounded-md text-sm hover:bg-gray-800 transition-colors">
                  Reorder
                </button>
              </div>
            </div>
          ))}
          {orders.length === 0 && (
            <div className="p-12 text-center">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No orders yet</h3>
              <p className="text-gray-600 mb-6">Start shopping to see your orders here</p>
              <a href="/" className="inline-block px-6 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors">
                Start Shopping
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

  // Address Tab
  // Address Tab - Updated
// Address Tab - Completely recoded
const AddressTab = () => {
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [addressForm, setAddressForm] = useState({
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'USA'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Safely get addresses array with default empty array
  const addresses = buyer.address || [];

  // Handle edit button click
  const handleEditClick = () => {
    if (addresses.length > 0) {
      const currentAddress = addresses[0];
      setAddressForm({
        street: currentAddress.street || '',
        city: currentAddress.city || '',
        state: currentAddress.state || '',
        zipCode: currentAddress.zipCode || '',
        country: currentAddress.country || 'USA'
      });
    }
    setIsEditingAddress(true);
    setError(null);
    setSuccess(null);
  };

  // Handle add button click
  const handleAddClick = () => {
    setAddressForm({
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'USA'
    });
    setIsEditingAddress(true);
    setError(null);
    setSuccess(null);
  };

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setAddressForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      // Validate required fields
      if (!addressForm.street.trim() || !addressForm.city.trim() || 
          !addressForm.state.trim() || !addressForm.zipCode.trim()) {
        throw new Error('Please fill in all required fields');
      }

      // Call save address API
      const response = await fetch('/api/buyer/address', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addressForm)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save address');
      }

      // Update buyer state with new address
      if (buyer) {
        const updatedAddress = {
          id: data.address?.id || Date.now(),
          type: 'home',
          isDefault: true,
          fullName: buyer.name,
          street: addressForm.street,
          city: addressForm.city,
          state: addressForm.state,
          zipCode: addressForm.zipCode,
          country: addressForm.country,
          phone: buyer.phone
        };

        setBuyer(prev => prev ? {
          ...prev,
          address: [updatedAddress]
        } : null);
      }

      setSuccess('Address saved successfully!');
      
      // Exit edit mode after a delay
      setTimeout(() => {
        setIsEditingAddress(false);
      }, 1500);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save address');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    setIsEditingAddress(false);
    setError(null);
    setSuccess(null);
  };

  // Check if we have an existing address
  const hasAddress = addresses.length > 0 && addresses[0].street;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Shipping Address</h3>
          <p className="text-sm text-gray-600 mt-1">
            Manage your shipping address for orders
          </p>
        </div>
        
        {!isEditingAddress && (
          <button
            onClick={hasAddress ? handleEditClick : handleAddClick}
            className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors"
          >
            <Edit2 className="w-4 h-4" />
            {hasAddress ? 'Edit Address' : 'Add Address'}
          </button>
        )}
      </div>

      {/* Messages */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700">{success}</p>
            </div>
          </div>
        </div>
      )}

      {/* Address Display or Form */}
      {isEditingAddress ? (
        // Edit Form
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h4 className="text-lg font-medium text-gray-900">
              {hasAddress ? 'Edit Address' : 'Add New Address'}
            </h4>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Street Address */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Street Address *
                </label>
                <input
                  type="text"
                  name="street"
                  value={addressForm.street}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-colors"
                  placeholder="123 Main Street, Apt 4B"
                  required
                  disabled={isSubmitting}
                />
              </div>

              {/* City */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City *
                </label>
                <input
                  type="text"
                  name="city"
                  value={addressForm.city}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-colors"
                  placeholder="New York"
                  required
                  disabled={isSubmitting}
                />
              </div>

              {/* State */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  State / Province *
                </label>
                <input
                  type="text"
                  name="state"
                  value={addressForm.state}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-colors"
                  placeholder="NY"
                  required
                  disabled={isSubmitting}
                />
              </div>

              {/* ZIP Code */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ZIP / Postal Code *
                </label>
                <input
                  type="text"
                  name="zipCode"
                  value={addressForm.zipCode}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-colors"
                  placeholder="10001"
                  required
                  disabled={isSubmitting}
                />
              </div>

              {/* Country */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Country *
                </label>
                <select
                  name="country"
                  value={addressForm.country}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-colors"
                  required
                  disabled={isSubmitting}
                >
                  <option value="USA">United States</option>
                  <option value="Canada">Canada</option>
                  <option value="UK">United Kingdom</option>
                  <option value="Australia">Australia</option>
                  <option value="Germany">Germany</option>
                  <option value="France">France</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <div className="text-sm text-gray-500">
                * Required fields
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </span>
                  ) : (
                    'Save Address'
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      ) : (
        // Address Display
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
          {hasAddress ? (
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <MapPin className="w-5 h-5 text-gray-400" />
                    <h4 className="text-lg font-medium text-gray-900">Primary Address</h4>
                    <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                      Default
                    </span>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="font-medium text-gray-900">{addresses[0].fullName || buyer.name}</p>
                      <p className="text-gray-600">{addresses[0].street}</p>
                      <p className="text-gray-600">
                        {addresses[0].city}, {addresses[0].state} {addresses[0].zipCode}
                      </p>
                      <p className="text-gray-600">{addresses[0].country}</p>
                    </div>
                    <div className="pt-3 border-t border-gray-100">
                      <p className="text-sm text-gray-500">
                        <span className="font-medium">Phone:</span> {addresses[0].phone || buyer.phone}
                      </p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleEditClick}
                  className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Edit
                </button>
              </div>
              <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-500">
                  This address will be used as your default shipping address
                </p>
              </div>
            </div>
          ) : (
            // Empty State
            <div className="p-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                <MapPin className="w-8 h-8 text-gray-400" />
              </div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">No Address Saved</h4>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Add a shipping address to make checkout faster and keep track of your orders more easily.
              </p>
              <button
                onClick={handleAddClick}
                className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
              >
                Add Your First Address
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

  // Settings Tab
 // Settings Tab
 const SettingsTab = () => {
  const [settingsForm, setSettingsForm] = useState({
    name: buyer.name,
    email: buyer.email,
    phone: buyer.phone
  });
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfile(settingsForm);
    } catch (error) {
      // handled in updateProfile
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type and size (optional)
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      alert('File too large (max 5MB)');
      return;
    }

    const formData = new FormData();
    formData.append('image', file);

    setUploading(true);
    try {
      const res = await fetch('/api/buyer/profile-image', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      // Update buyer state with new image
      setBuyer(prev => prev ? {
        ...prev,
        profileImage: data.url,
        avatar: data.url  // if you store avatar separately
      } : null);
    } catch (error) {
      console.error('Image upload error:', error);
      alert('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleImageRemove = async () => {
    if (!confirm('Are you sure you want to remove your profile picture?')) return;

    setRemoving(true);
    try {
      const res = await fetch('/api/buyer/profile-image', {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Remove failed');
      // Update buyer state to remove image
      setBuyer(prev => prev ? {
        ...prev,
        profileImage: null,
        avatar: '/default-avatar.png'  // fallback default image
      } : null);
    } catch (error) {
      console.error('Image remove error:', error);
      alert('Failed to remove image');
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Profile Image Section */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold mb-4">Profile Picture</h3>
        <div className="flex items-center gap-6">
          <div className="relative">
            <img
              src={buyer.avatar}
              alt="Profile"
              className="w-24 h-24 rounded-full border-2 border-gray-200 object-cover"
            />
            {uploading && (
              <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
              </div>
            )}
          </div>
          <div className="space-y-2">
            <div className="flex gap-2">
              <label className="cursor-pointer px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors">
                {uploading ? 'Uploading...' : 'Upload New'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
              {buyer.profileImage && (
                <button
                  onClick={handleImageRemove}
                  disabled={removing}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  {removing ? 'Removing...' : 'Remove'}
                </button>
              )}
            </div>
            <p className="text-sm text-gray-500">
              Max file size: 5MB. Supported formats: JPG, PNG, GIF
            </p>
          </div>
        </div>
      </div>

      {/* Account Settings Form (unchanged) */}
      <form onSubmit={handleSaveSettings} className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold mb-4">Account Settings</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
            <input
              type="text"
              value={settingsForm.name}
              onChange={(e) => setSettingsForm({...settingsForm, name: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={settingsForm.email}
              onChange={(e) => setSettingsForm({...settingsForm, email: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-transparent"
              required
              disabled
            />
            <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
            <input
              type="tel"
              value={settingsForm.phone}
              onChange={(e) => setSettingsForm({...settingsForm, phone: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-transparent"
            />
          </div>
          <button 
            type="submit" 
            disabled={saving}
            className="px-6 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>

      {/* Danger Zone */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold mb-4 text-red-600">Danger Zone</h3>
        <p className="text-sm text-gray-600 mb-4">
          Once you delete your account, there is no going back. Please be certain.
        </p>
        <button className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors">
          Delete Account
        </button>
      </div>
    </div>
  );
};

  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'orders', label: 'Orders', icon: Package },
    { id: 'address', label: 'Address', icon: MapPin },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar/>
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Account</h1>
          <p className="text-gray-600">Manage your profile, orders, and settings</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border p-4 sticky top-4">
              <nav className="space-y-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => handleTabChange(tab.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-md text-left transition-colors ${
                        activeTab === tab.id
                          ? 'bg-black text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{tab.label}</span>
                    </button>
                  );
                })}
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-md text-left text-red-600 hover:bg-red-50 transition-colors mt-4"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">Logout</span>
                </button>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {activeTab === 'overview' && <OverviewTab />}
            {activeTab === 'orders' && <OrdersTab />}
            {activeTab === 'address' && <AddressTab />}
            {activeTab === 'settings' && <SettingsTab />}
          </div>
        </div>
      </div>
    </div>
  );
}
'use client'

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { ArrowLeft, Lock, MapPin, Package } from 'lucide-react';

interface CartProduct {
  id: number;
  name: string;
  price: number;
  discountedPrice: number;
  category: string;
  image: string;
  imageAlt: string;
}

interface CartVariant {
  id: number;
  sku: string;
  currentStock: number;
  attributes: Record<string, {
    value: string;
    displayName: string;
    hexColor?: string;
  }>;
}

interface CartItem {
  id: number;
  quantity: number;
  variant: CartVariant;
  product: CartProduct;
  subtotal: number;
}

interface Cart {
  id: number;
  items: CartItem[];
  summary: {
    itemCount: number;
    subtotal: number;
    totalSavings: number;
  };
}

interface ShippingAddress {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export default function CheckoutPage() {
  const { data: session, status } = useSession();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [step, setStep] = useState<'shipping' | 'review'>('shipping');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [buyerId, setBuyerId] = useState<number | null>(null);
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'United States'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch cart data and user profile
  useEffect(() => {
    const fetchData = async () => {
      if (!session?.user?.email) {
        setLoading(false);
        return;
      }
  
      try {
        // Fetch buyer profile
        const profileResponse = await fetch('/api/buyer/profile');
        if (!profileResponse.ok) {
          throw new Error('Failed to fetch profile');
        }
        const userData = await profileResponse.json();
        
        // IMPORTANT: Store the buyer ID
        setBuyerId(userData.id);
  
        // Fetch cart using the buyer ID
        const cartResponse = await fetch(`/api/cart?buyerId=${userData.id}`);
        if (cartResponse.ok) {
          const cartData = await cartResponse.json();
          setCart(cartData);
        }
  
        // ... rest of your address parsing code stays the same
        let parsedAddress = {
          address: '',
          city: '',
          state: '',
          zipCode: '',
          country: 'United States'
        };
  
        if (userData.addresses && userData.addresses.length > 0) {
          const savedAddress = userData.addresses[0];
          parsedAddress = {
            address: savedAddress.street || '',
            city: savedAddress.city || '',
            state: savedAddress.state || '',
            zipCode: savedAddress.zipCode || '',
            country: savedAddress.country || 'United States'
          };
        }
  
        setShippingAddress({
          fullName: userData.name || session.user.name || '',
          email: userData.email || session.user.email || '',
          phone: userData.phone || '',
          address: parsedAddress.address,
          city: parsedAddress.city,
          state: parsedAddress.state,
          zipCode: parsedAddress.zipCode,
          country: parsedAddress.country
        });
  
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load profile data');
        setShippingAddress(prev => ({
          ...prev,
          fullName: session.user?.name || '',
          email: session.user?.email || ''
        }));
      } finally {
        setLoading(false);
      }
    };
  
    if (status !== 'loading') {
      fetchData();
    }
  }, [session, status]);
  
  

  // Calculate totals
  const subtotal = cart?.summary.subtotal || 0;
  const shipping = subtotal >= 50 ? 0 : 5.99;
  const tax = subtotal * 0.08; // 8% tax
  const total = subtotal + shipping + tax;

  // Validation function
  const validateShipping = () => {
    const newErrors: Record<string, string> = {};

    if (!shippingAddress.fullName.trim()) newErrors.fullName = 'Name is required';
    if (!shippingAddress.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(shippingAddress.email)) {
      newErrors.email = 'Invalid email format';
    }
    if (!shippingAddress.phone.trim()) {
      newErrors.phone = 'Phone is required';
    } else if (!/^\+?[\d\s\-()]+$/.test(shippingAddress.phone)) {
      newErrors.phone = 'Invalid phone format';
    }
    if (!shippingAddress.address.trim()) newErrors.address = 'Address is required';
    if (!shippingAddress.city.trim()) newErrors.city = 'City is required';
    if (!shippingAddress.state.trim()) newErrors.state = 'State is required';
    if (!shippingAddress.zipCode.trim()) {
      newErrors.zipCode = 'ZIP code is required';
    } else if (!/^\d{5}(-\d{4})?$/.test(shippingAddress.zipCode)) {
      newErrors.zipCode = 'Invalid ZIP code';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle step navigation
  const handleContinueToReview = () => {
    if (validateShipping()) {
      setStep('review');
      setErrors({});
    }
  };

  // Handle order placement (Pay on Delivery)
 
const handlePlaceOrder = async () => {
  if (!buyerId) {
    setError('User ID not found. Please refresh and try again.');
    console.error('Buyer ID is missing');
    return;
  }

  if (!cart || cart.items.length === 0) {
    setError('Cart is empty');
    return;
  }

  setProcessing(true);
  setError(null);

  try {
    console.log('Creating orders for', cart.items.length, 'items');
    console.log('Buyer ID:', buyerId);

    // Create orders for each cart item using the correct endpoint
    const orderPromises = cart.items.map((item, index) => {
      const orderData = {
        buyerId: buyerId,
        variantId: item.variant.id,
        productId: item.product.id,
        quantity: item.quantity,
        shippingAddress,
        paymentMethod: 'PAY_ON_DELIVERY'
      };
      
      console.log(`Order ${index + 1} data:`, orderData);
      
      // Use the correct endpoint: /api/buyer/orders
      return fetch('/api/buyer/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });
    });

    const responses = await Promise.all(orderPromises);
    
    // Check each response
    const results = await Promise.all(
      responses.map(async (res, index) => {
        try {
          // First check if response is OK
          if (!res.ok) {
            // Try to parse error as JSON
            let errorData;
            try {
              errorData = await res.json();
            } catch {
              // If not JSON, get text
              const text = await res.text();
              return { 
                ok: false, 
                status: res.status, 
                error: text || `Request failed with status ${res.status}` 
              };
            }
            return { ok: false, status: res.status, error: errorData.error || 'Unknown error' };
          }
          
          // Try to parse successful response as JSON
          const data = await res.json();
          console.log(`Order ${index + 1} response:`, { ok: res.ok, status: res.status, data });
          return { ok: true, data };
        } catch (parseError) {
          console.error(`Failed to parse response for order ${index + 1}:`, parseError);
          return { 
            ok: false, 
            status: res.status, 
            error: 'Invalid response format from server' 
          };
        }
      })
    );
    
    // Find failed orders
    const failedOrders = results.filter(r => !r.ok);
    
    if (failedOrders.length > 0) {
      console.error('Failed orders:', failedOrders);
      const errorMessage = failedOrders[0].error || 'Failed to create some orders';
      throw new Error(errorMessage);
    }

    console.log('All orders created successfully');

    // Clear cart after successful order
    const clearResponse = await fetch(`/api/cart?buyerId=${buyerId}&clearAll=true`, {
      method: 'DELETE'
    });
    
    if (!clearResponse.ok) {
      console.warn('Failed to clear cart, but orders were created');
    }

    setSuccess(true);
    
    // Redirect to orders page after delay
    setTimeout(() => {
      window.location.href = '/profile#orders';
    }, 3000);

  } catch (err) {
    console.error('Order creation error:', err);
    const errorMessage = err instanceof Error ? err.message : 'Failed to place order';
    setError(errorMessage + '. Please try again or contact support.');
    setProcessing(false);
  }
};


  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Lock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-2xl font-semibold mb-2">Please log in</h1>
          <p className="text-gray-600 mb-6">You need to be logged in to checkout</p>
          <a href="/cart" className="text-blue-600 hover:text-blue-800">
            Return to cart
          </a>
        </div>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-2xl font-semibold mb-2">Your cart is empty</h1>
          <p className="text-gray-600 mb-6">Add items to your cart before checking out</p>
          <a href="/" className="text-blue-600 hover:text-blue-800">
            Continue shopping
          </a>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center bg-white p-8 rounded-lg shadow-sm max-w-md">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold mb-2">Order Placed Successfully!</h1>
          <p className="text-gray-600 mb-2">Thank you for your purchase</p>
          <p className="text-sm text-gray-500 mb-4">Payment will be collected upon delivery</p>
          <p className="text-sm text-gray-500">Redirecting to your orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl sm:text-2xl font-semibold">Checkout</h1>
            <a href="/cart" className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" />
              Back to cart
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Progress Steps - Now only 2 steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between max-w-md mx-auto">
            {[
              { id: 'shipping', label: 'Shipping' },
              { id: 'review', label: 'Review' }
            ].map((s, idx) => (
              <React.Fragment key={s.id}>
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                    step === s.id ? 'bg-black text-white' :
                    step === 'review' && s.id === 'shipping' ? 'bg-green-600 text-white' :
                    'bg-gray-200 text-gray-600'
                  }`}>
                    {(step === 'review' && s.id === 'shipping') ? '✓' : idx + 1}
                  </div>
                  <span className="text-xs mt-2 font-medium">{s.label}</span>
                </div>
                {idx < 1 && (
                  <div className={`flex-1 h-0.5 mx-2 ${
                    step === 'review' ? 'bg-green-600' : 'bg-gray-200'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg max-w-2xl mx-auto">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content */}
          <div className="lg:flex-1">
            {/* Shipping Address Form */}
            {step === 'shipping' && (
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-6">
                  <MapPin className="w-5 h-5" />
                  <h2 className="text-lg font-semibold">Shipping Address</h2>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Full Name *</label>
                      <input
                        type="text"
                        value={shippingAddress.fullName}
                        onChange={(e) => setShippingAddress({...shippingAddress, fullName: e.target.value})}
                        className={`w-full px-3 py-2 border rounded-md ${errors.fullName ? 'border-red-500' : 'border-gray-300'}`}
                      />
                      {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Email *</label>
                      <input
                        type="email"
                        value={shippingAddress.email}
                        onChange={(e) => setShippingAddress({...shippingAddress, email: e.target.value})}
                        className={`w-full px-3 py-2 border rounded-md ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                      />
                      {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Phone *</label>
                    <input
                      type="tel"
                      value={shippingAddress.phone}
                      onChange={(e) => setShippingAddress({...shippingAddress, phone: e.target.value})}
                      className={`w-full px-3 py-2 border rounded-md ${errors.phone ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Street Address *</label>
                    <input
                      type="text"
                      value={shippingAddress.address}
                      onChange={(e) => setShippingAddress({...shippingAddress, address: e.target.value})}
                      className={`w-full px-3 py-2 border rounded-md ${errors.address ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">City *</label>
                      <input
                        type="text"
                        value={shippingAddress.city}
                        onChange={(e) => setShippingAddress({...shippingAddress, city: e.target.value})}
                        className={`w-full px-3 py-2 border rounded-md ${errors.city ? 'border-red-500' : 'border-gray-300'}`}
                      />
                      {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">State *</label>
                      <input
                        type="text"
                        value={shippingAddress.state}
                        onChange={(e) => setShippingAddress({...shippingAddress, state: e.target.value})}
                        className={`w-full px-3 py-2 border rounded-md ${errors.state ? 'border-red-500' : 'border-gray-300'}`}
                      />
                      {errors.state && <p className="text-red-500 text-xs mt-1">{errors.state}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">ZIP Code *</label>
                      <input
                        type="text"
                        value={shippingAddress.zipCode}
                        onChange={(e) => setShippingAddress({...shippingAddress, zipCode: e.target.value})}
                        className={`w-full px-3 py-2 border rounded-md ${errors.zipCode ? 'border-red-500' : 'border-gray-300'}`}
                      />
                      {errors.zipCode && <p className="text-red-500 text-xs mt-1">{errors.zipCode}</p>}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Country</label>
                    <input
                      type="text"
                      value={shippingAddress.country}
                      onChange={(e) => setShippingAddress({...shippingAddress, country: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                      readOnly
                    />
                  </div>
                </div>

                <button
                  onClick={handleContinueToReview}
                  className="w-full mt-6 bg-black text-white py-3 rounded-md font-medium hover:bg-gray-800"
                >
                  Continue to Review
                </button>
              </div>
            )}

            {/* Review & Place Order */}
            {step === 'review' && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <h2 className="text-lg font-semibold mb-4">Shipping Address</h2>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p className="font-medium text-gray-900">{shippingAddress.fullName}</p>
                    <p>{shippingAddress.address}</p>
                    <p>{shippingAddress.city}, {shippingAddress.state} {shippingAddress.zipCode}</p>
                    <p>{shippingAddress.country}</p>
                    <p className="pt-2">{shippingAddress.email}</p>
                    <p>{shippingAddress.phone}</p>
                  </div>
                  <button
                    onClick={() => setStep('shipping')}
                    className="mt-4 text-sm text-blue-600 hover:text-blue-800"
                  >
                    Edit
                  </button>
                </div>

                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <h2 className="text-lg font-semibold mb-4">Payment Method</h2>
                  <div className="text-sm text-gray-600">
                    <p className="font-medium text-gray-900">Pay on Delivery</p>
                    <p>Payment will be collected when your order is delivered</p>
                  </div>
                </div>

                <button
                  onClick={handlePlaceOrder}
                  disabled={processing}
                  className="w-full bg-black text-white py-3 rounded-md font-medium hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {processing ? 'Processing...' : `Place Order - $${total.toFixed(2)}`}
                </button>
              </div>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:w-96">
            <div className="bg-white rounded-lg p-6 shadow-sm sticky top-4">
              <h2 className="text-lg font-semibold mb-4">Order Summary</h2>

              <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                {cart.items.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <img
                      src={item.product.image}
                      alt={item.product.imageAlt}
                      className="w-16 h-16 object-cover rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.product.name}</p>
                      <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                      {Object.entries(item.variant.attributes).length > 0 && (
                        <p className="text-xs text-gray-500 truncate">
                          {Object.entries(item.variant.attributes).map(([k, v]) => `${k}: ${v.displayName}`).join(', ')}
                        </p>
                      )}
                    </div>
                    <p className="text-sm font-medium">${item.subtotal.toFixed(2)}</p>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>{shipping === 0 ? <span className="text-green-600">Free</span> : `$${shipping.toFixed(2)}`}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                {cart.summary.totalSavings > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Savings</span>
                    <span>-${cart.summary.totalSavings.toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t pt-2 flex justify-between font-semibold text-base">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>

              <div className="mt-4 p-3 bg-blue-50 rounded text-xs text-blue-800">
                <div className="flex items-start gap-2">
                  <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zm-11-1a1 1 0 11-2 0 1 1 0 012 0z" clipRule="evenodd" />
                  </svg>
                  <p>Complete payment with cash or card when your delivery arrives</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
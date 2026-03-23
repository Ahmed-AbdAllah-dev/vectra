'use client'

import React, { useState, useEffect } from 'react';
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft } from 'lucide-react';
import Navbar from '../components/Navbar';
import { signIn, useSession } from 'next-auth/react';

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
  addedAt: Date;
  updatedAt: Date;
  variant: CartVariant;
  product: CartProduct;
  subtotal: number;
}

interface CartSummary {
  itemCount: number;
  subtotal: number;
  totalSavings: number;
}

interface Cart {
  id: number;
  sessionId?: string;
  items: CartItem[];
  summary: CartSummary;
}

export default function CartPage() {
  const handleLogin = () => {
    signIn(undefined, { callbackUrl: '/cart' })
  }
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingItems, setUpdatingItems] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);
  
  // Get session from NextAuth
  const { data: session, status } = useSession();
  // Add this function to your CartPage component
const addToCart = async (variantId: number, quantity = 1) => {
  try {
    const requestBody = getCartRequestBody({
      variantId,
      quantity,
    });

    const response = await fetch('/api/cart', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (response.ok) {
      const data = await response.json();
      setCart(data.cart);
      return { success: true, cart: data.cart };
    } else {
      const errorData = await response.json();
      setError(errorData.error || 'Failed to add item to cart');
      return { success: false, error: errorData.error };
    }
  } catch (error) {
    console.error('Error adding to cart:', error);
    setError('Failed to add item to cart. Please try again.');
    return { success: false, error: 'Network error' };
  }
};
  // Helper function to get session ID for guest users
  const getSessionId = () => {
    let sessionId = localStorage.getItem('guestSessionId');
    if (!sessionId) {
      sessionId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('guestSessionId', sessionId);
    }
    return sessionId;
  };

  // Build cart API URL based on authentication status
  const getCartUrl = () => {
    if (session?.user?.id) {
      return `/api/cart?userId=${session.user.id}`; // Changed from buyerId to userId
    } else {
      const sessionId = getSessionId();
      return `/api/cart?sessionId=${sessionId}`;
    }
  };

  // Build request body for cart operations
 // Build request body for cart operations
 const getCartRequestBody = (additionalData: Record<string, any> = {}) => {
  const baseData = { ...additionalData };
  
  if (session?.user?.id) {
    baseData.userId = session.user.id; // Changed from buyerId to userId
  } else {
    baseData.sessionId = getSessionId();
  }
  
  return baseData;
};

  // Fetch cart data
  const fetchCart = async () => {
    try {
      setLoading(true);
      const url = getCartUrl();
      const response = await fetch(url);
      
      if (response.ok) {
        const cartData = await response.json();
        setCart(cartData);
      } else {
        throw new Error('Failed to fetch cart');
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
      setError('Failed to load cart. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Update item quantity
  const updateQuantity = async (cartItemId: number, newQuantity: number) => {
    if (newQuantity < 0) return;
    
    setUpdatingItems(prev => new Set(prev).add(cartItemId));
    
    try {
      const requestBody = getCartRequestBody({
        cartItemId,
        quantity: newQuantity,
      });

      const response = await fetch('/api/cart', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        const data = await response.json();
        setCart(data.cart);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update cart');
      }
    } catch (error) {
      console.error('Error updating cart:', error);
      setError('Failed to update cart. Please try again.');
    } finally {
      setUpdatingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(cartItemId);
        return newSet;
      });
    }
  };

  // Remove item from cart
  const removeItem = async (cartItemId: number) => {
    setUpdatingItems(prev => new Set(prev).add(cartItemId));
    
    try {
      const baseParams = session?.user?.id 
        ? `userId=${session.user.id}` // Changed from buyerId to userId
        : `sessionId=${getSessionId()}`;
      
      const response = await fetch(`/api/cart?cartItemId=${cartItemId}&${baseParams}`, {
        method: 'DELETE',
      });
  
      if (response.ok) {
        const data = await response.json();
        setCart(data.cart);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to remove item');
      }
    } catch (error) {
      console.error('Error removing item:', error);
      setError('Failed to remove item. Please try again.');
    } finally {
      setUpdatingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(cartItemId);
        return newSet;
      });
    }
  };
  

  // Clear entire cart
  const clearCart = async () => {
    if (!confirm('Are you sure you want to clear your entire cart?')) return;
    
    setLoading(true);
    try {
      const baseParams = session?.user?.id 
        ? `userId=${session.user.id}` // Changed from buyerId to userId
        : `sessionId=${getSessionId()}`;
      
      const response = await fetch(`/api/cart?clearAll=true&${baseParams}`, {
        method: 'DELETE',
      });
  
      if (response.ok) {
        setCart(null);
      } else {
        throw new Error('Failed to clear cart');
      }
    } catch (error) {
      console.error('Error clearing cart:', error);
      setError('Failed to clear cart. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch cart when session changes or component mounts
  useEffect(() => {
    fetchCart();
  }, [session]);

  // Show loading while checking authentication
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar/>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
        </div>
      </div>
    );
  }

  // Calculate shipping (free over $50)
  const shipping = cart && cart.summary.subtotal >= 50 ? 0 : 5.99;
  const total = cart ? cart.summary.subtotal + shipping : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar/>
        <div className="max-w-4xl mx-auto px-3 sm:px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-8 w-1/3"></div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3 p-3 border rounded-lg">
                  <div className="w-16 h-16 sm:w-24 sm:h-24 bg-gray-200 rounded"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar/>
        <div className="max-w-4xl mx-auto px-3 sm:px-4 py-8 text-center">
          <ShoppingBag className="w-16 h-16 sm:w-24 sm:h-24 text-gray-300 mx-auto mb-4 sm:mb-6" />
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-3 sm:mb-4">Your cart is empty</h1>
          <p className="text-gray-600 mb-6 sm:mb-8 text-sm sm:text-base">
            Looks like you haven't added anything to your cart yet.
          </p>
          <a
            href="/"
            className="inline-flex items-center gap-2 bg-black text-white px-4 sm:px-6 py-2 sm:py-3 rounded-md text-sm sm:text-base hover:bg-gray-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Continue Shopping
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar/>
      
      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
        {/* User Status Indicator */}
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs sm:text-sm text-blue-800">
            {session ? (
              <>Shopping as <span className="font-medium">{session.user?.name || session.user?.email}</span></>
            ) : (
              <>Shopping as guest. <button onClick={handleLogin} className="font-medium underline">login</button> to save your cart.</>
            )}
          </p>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">
            Shopping Cart ({cart.summary.itemCount} {cart.summary.itemCount === 1 ? 'item' : 'items'})
          </h1>
          <button
            onClick={clearCart}
            className="text-red-600 hover:text-red-800 text-xs sm:text-sm font-medium"
          >
            Clear Cart
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-xs sm:text-sm">{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-red-600 hover:text-red-800 text-xs mt-1"
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-6 sm:gap-8">
          {/* Cart Items */}
          <div className="lg:flex-1 space-y-3 sm:space-y-4">
            {cart.items.map((item) => {
              const isUpdating = updatingItems.has(item.id);
              const hasDiscount = item.product.price > item.product.discountedPrice;
              
              return (
                <div key={item.id} className="bg-white p-3 sm:p-4 border border-gray-200 rounded-lg">
                  <div className="flex gap-3 sm:gap-4">
                    {/* Product Image */}
                    <div className="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20">
                      <img
                        src={item.product.image}
                        alt={item.product.imageAlt}
                        className="w-full h-full object-cover rounded-md"
                      />
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      {/* Product Name and Price - Mobile Stacked */}
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2 gap-1 sm:gap-0">
                        <div className="min-w-0">
                          <h3 className="font-medium text-gray-900 text-sm sm:text-base truncate">
                            {item.product.name}
                          </h3>
                          <p className="text-gray-500 text-xs sm:text-sm truncate">{item.product.category}</p>
                        </div>
                        <div className="text-right sm:text-left">
                          <p className="font-semibold text-gray-900 text-sm sm:text-base">
                            ${item.product.discountedPrice.toFixed(2)}
                          </p>
                          {hasDiscount && (
                            <p className="text-gray-500 text-xs line-through">
                              ${item.product.price.toFixed(2)}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Variant Details */}
                      {Object.keys(item.variant.attributes).length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {Object.entries(item.variant.attributes).map(([key, attr]) => (
                            <span
                              key={key}
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-gray-100 rounded text-xs text-gray-700"
                            >
                              <span className="capitalize text-xs">{key}:</span>
                              <span className="font-medium text-xs">{attr.displayName}</span>
                              {attr.hexColor && (
                                <span
                                  className="w-2 h-2 rounded-full border border-gray-300"
                                  style={{ backgroundColor: attr.hexColor }}
                                ></span>
                              )}
                            </span>
                          ))}
                        </div>
                      )}

                      <p className="text-gray-500 text-xs mb-2">SKU: {item.variant.sku}</p>

                      {/* Quantity Controls and Subtotal */}
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-1 sm:gap-2">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            disabled={isUpdating || item.quantity <= 1}
                            className="w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                          >
                            <Minus className="w-3 h-3 sm:w-4 sm:h-4" />
                          </button>
                          
                          <span className="w-8 sm:w-12 text-center font-medium text-sm">
                            {isUpdating ? '...' : item.quantity}
                          </span>
                          
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            disabled={isUpdating || item.quantity >= item.variant.currentStock}
                            className="w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                          >
                            <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                          </button>
                          
                          <span className="text-gray-500 text-xs hidden sm:inline ml-1">
                            ({item.variant.currentStock} available)
                          </span>
                        </div>

                        <div className="flex items-center gap-2 sm:gap-4">
                          <p className="font-semibold text-gray-900 text-sm sm:text-base">
                            ${item.subtotal.toFixed(2)}
                          </p>
                          <button
                            onClick={() => removeItem(item.id)}
                            disabled={isUpdating}
                            className="text-red-600 hover:text-red-800 disabled:opacity-50 p-1"
                            title="Remove item"
                          >
                            <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                          </button>
                        </div>
                      </div>
                      
                      {/* Stock info for mobile */}
                      <div className="sm:hidden text-gray-500 text-xs mt-1">
                        {item.variant.currentStock} available
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Order Summary */}
          <div className="lg:w-80">
            <div className="bg-white rounded-lg p-4 sm:p-6 border border-gray-200 sticky top-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Order Summary</h2>
              
              <div className="space-y-2 sm:space-y-3 mb-3 sm:mb-4">
                <div className="flex justify-between text-sm">
                  <span>Subtotal ({cart.summary.itemCount} items)</span>
                  <span>${cart.summary.subtotal.toFixed(2)}</span>
                </div>
                
                {cart.summary.totalSavings > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Savings</span>
                    <span>-${cart.summary.totalSavings.toFixed(2)}</span>
                  </div>
                )}
                
                <div className="flex justify-between text-sm">
                  <span>Shipping</span>
                  <span>
                    {shipping === 0 ? (
                      <span className="text-green-600">Free</span>
                    ) : (
                      `$${shipping.toFixed(2)}`
                    )}
                  </span>
                </div>
                
                {cart.summary.subtotal < 50 && (
                  <p className="text-xs text-gray-500 bg-yellow-50 p-2 rounded">
                    Add ${(50 - cart.summary.subtotal).toFixed(2)} more for free shipping
                  </p>
                )}
              </div>
              
              <div className="border-t pt-3 sm:pt-4">
                <div className="flex justify-between font-semibold text-base sm:text-lg">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
              
              <button 
                className="w-full mt-4 sm:mt-6 bg-black text-white py-2 sm:py-3 rounded-md font-medium hover:bg-gray-800 transition-colors text-sm sm:text-base"
                onClick={() => {
                  if (!session) {
                    handleLogin()
                  } else {
                    window.location.href = '/checkout';
                  }
                }}
              >
                {session ? 'Proceed to Checkout' : 'login to Checkout'}
              </button>
              
              <a
                href="/"
                className="block text-center mt-3 text-blue-600 hover:text-blue-800 text-xs sm:text-sm"
              >
                Continue Shopping
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
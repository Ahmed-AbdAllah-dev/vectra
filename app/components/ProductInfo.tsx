// components/ProductInfo.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Product } from '@/types/product';
import { useSession } from 'next-auth/react';

interface ProductInfoProps {
  product: Product;
  onVariantChange?: (variant: any) => void;
}

interface SelectedAttributes {
  [key: string]: string;
}

export default function ProductInfo({ product, onVariantChange }: ProductInfoProps) {
  const [selectedAttributes, setSelectedAttributes] = useState<SelectedAttributes>({});
  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [addToCartMessage, setAddToCartMessage] = useState<string | null>(null);
  
  // Get session from NextAuth
  const { data: session, status } = useSession();

  // Helper function to generate or get session ID for guest users
  const getSessionId = () => {
    let sessionId = localStorage.getItem('guestSessionId');
    if (!sessionId) {
      sessionId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('guestSessionId', sessionId);
    }
    return sessionId;
  };

  // Function to add item to cart
  const addToCart = async () => {
    if (!selectedVariant) {
      setAddToCartMessage('Please select product options');
      setTimeout(() => setAddToCartMessage(null), 3000);
      return;
    }

    setIsAddingToCart(true);
    setAddToCartMessage(null);

    try {
      // Prepare cart data based on authentication status
      const cartData: any = {
        variantId: selectedVariant.id,
        quantity: quantity,
      };
      
      if (session?.user?.id) {
        // Send userId instead of buyerId - API will find/create the buyer
        cartData.userId = session.user.id;
      } else {
        // For guest users, use sessionId
        cartData.sessionId = getSessionId();
      }

      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cartData),
      });

      const data = await response.json();

      if (response.ok) {
        setAddToCartMessage('Added to cart successfully!');
        
        // Update cart count in header/navbar
        window.dispatchEvent(new CustomEvent('cartUpdated', { 
          detail: { cart: data.cart } 
        }));
        
        // Clear message after 3 seconds
        setTimeout(() => setAddToCartMessage(null), 3000);
        
        console.log('Item added to cart:', data);
      } else {
        throw new Error(data.error || 'Failed to add item to cart');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      setAddToCartMessage(
        error instanceof Error 
          ? error.message 
          : 'Failed to add item to cart. Please try again.'
      );
      
      // Clear error message after 5 seconds
      setTimeout(() => setAddToCartMessage(null), 5000);
    } finally {
      setIsAddingToCart(false);
    }
  };

  // Initialize with default variant attributes
  useEffect(() => {
    if (product.defaultVariant && product.defaultVariant.attributes) {
      const defaultAttrs: SelectedAttributes = {};
      Object.entries(product.defaultVariant.attributes).forEach(([key, value]: [string, any]) => {
        defaultAttrs[key] = value.value;
      });
      setSelectedAttributes(defaultAttrs);
    }
  }, [product.defaultVariant]);

  // Find current selected variant based on attributes
  const selectedVariant = useMemo(() => {
    if (!product.variants || product.variants.length === 0) return null;

    // If no attributes selected, return default variant
    if (Object.keys(selectedAttributes).length === 0) {
      return product.defaultVariant || product.variants[0];
    }

    // Find exact match
    const exactMatch = product.variants.find(variant => {
      return Object.entries(selectedAttributes).every(([attrName, attrValue]) => {
        if (!attrValue) return true;
        return variant.attributes[attrName]?.value === attrValue;
      });
    });

    if (exactMatch) return exactMatch;

    // Fallback to closest match or default
    return product.defaultVariant || product.variants[0];
  }, [selectedAttributes, product.variants, product.defaultVariant]);

  // Notify parent component when variant changes
  useEffect(() => {
    if (selectedVariant && onVariantChange) {
      onVariantChange(selectedVariant);
    }
  }, [selectedVariant, onVariantChange]);

  // Get available values for a specific attribute based on current selections
  const getAvailableValues = (targetAttribute: string) => {
    if (!product.availableAttributes || !product.variants) return [];

    // Get all possible values for this attribute
    const allValues = product.availableAttributes[targetAttribute] || [];
    
    // Filter to only show values that have variants available with current other selections
    return allValues.filter(value => {
      // Create test attributes with this value
      const testAttributes = { ...selectedAttributes, [targetAttribute]: value.value };
      
      // Check if any variant matches these attributes and has stock
      return product.variants.some(variant => {
        const matchesAttributes = Object.entries(testAttributes).every(([attrName, attrValue]) => {
          if (!attrValue) return true;
          return variant.attributes[attrName]?.value === attrValue;
        });
        return matchesAttributes && variant.currentStock > 0;
      });
    });
  };

  // Handle attribute selection
  const handleAttributeSelect = (attributeName: string, value: string) => {
    setSelectedAttributes(prev => ({
      ...prev,
      [attributeName]: value
    }));
    setQuantity(1); // Reset quantity when variant changes
  };

  // Calculate discount if exists
  const activeDiscount = product.activeDiscount || product.discounts?.find(
    discount => new Date() >= discount.startDate && new Date() <= discount.endDate
  );

  const discountedPrice = activeDiscount
    ? product.price * (1 - activeDiscount.percentage / 100)
    : product.price;

  const currentStock = selectedVariant?.currentStock || 0;
  const isInStock = currentStock > 0;

  // Get available attribute types from the product
  const availableColors = getAvailableValues('color');
  const availableSizes = getAvailableValues('size');
  const availableMaterials = getAvailableValues('material');

  return (
    <div className="space-y-6">
      {/* Category and Title */}
      <div>
        <p className="text-sm text-gray-500 mb-1">{product.category}</p>
        <h1 className="text-2xl font-semibold">{product.name}</h1>
        {selectedVariant && (
          <p className="text-sm text-gray-400 mt-1">SKU: {selectedVariant.sku}</p>
        )}
      </div>

      {/* Rating */}
      {product.averageRating > 0 && (
        <div className="flex items-center gap-2">
          <div className="flex text-yellow-400">
            {[...Array(5)].map((_, i) => (
              <span key={i} className={i < Math.floor(product.averageRating) ? '' : 'text-gray-300'}>
                ★
              </span>
            ))}
          </div>
          <span className="text-sm text-gray-600">
            {product.averageRating} ({product.reviewCount} reviews)
          </span>
        </div>
      )}

      {/* Price */}
      <div className="flex items-center gap-2">
        <span className="text-2xl font-bold">${discountedPrice.toFixed(2)}</span>
        {activeDiscount && (
          <>
            <span className="text-lg text-gray-500 line-through">${product.price.toFixed(2)}</span>
            <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded">
              {activeDiscount.percentage}% OFF
            </span>
          </>
        )}
      </div>

      {/* Stock Status */}
      <div className="flex items-center gap-2 text-sm">
        <span className={`w-2 h-2 rounded-full ${isInStock ? 'bg-green-500' : 'bg-red-500'}`}></span>
        <span className={isInStock ? 'text-green-600' : 'text-red-600'}>
          {isInStock ? `${currentStock} in stock` : 'Out of stock'}
        </span>
      </div>

      {/* Color Selection */}
      {availableColors.length > 0 && (
        <div>
          <h3 className="font-medium mb-3">
            Select Color
            {selectedAttributes.color && (
              <span className="text-sm text-gray-600 ml-2">
                ({availableColors.find(c => c.value === selectedAttributes.color)?.displayName})
              </span>
            )}
          </h3>
          <div className="flex gap-3 flex-wrap">
            {availableColors.map((color) => (
              <button
                key={color.value}
                onClick={() => handleAttributeSelect('color', color.value)}
                className={`relative w-12 h-12 rounded-full border-2 transition-all ${
                  selectedAttributes.color === color.value
                    ? 'border-black ring-2 ring-blue-200'
                    : 'border-gray-300 hover:border-gray-400'
                } ${color.hexColor ? '' : 'flex items-center justify-center text-xs font-medium'}`}
                style={color.hexColor ? { backgroundColor: color.hexColor } : { backgroundColor: '#f5f5f5' }}
                title={color.displayName}
              >
                {!color.hexColor && (
                  <span className="text-gray-700">{color.displayName.slice(0, 2).toUpperCase()}</span>
                )}
                {selectedAttributes.color === color.value && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className={`w-3 h-3 rounded-full ${color.hexColor && isLightColor(color.hexColor) ? 'bg-black' : 'bg-white'}`}></div>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Size Selection */}
      {availableSizes.length > 0 && (
        <div>
          <h3 className="font-medium mb-3">Select Size</h3>
          <div className="flex gap-2 flex-wrap">
            {availableSizes.map((size) => (
              <button
                key={size.value}
                onClick={() => handleAttributeSelect('size', size.value)}
                className={`px-4 py-2 border rounded-md transition-colors ${
                  selectedAttributes.size === size.value
                    ? 'bg-black text-white'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                {size.displayName}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Material Selection */}
      {availableMaterials.length > 0 && (
        <div>
          <h3 className="font-medium mb-3">Material</h3>
          <div className="flex gap-2 flex-wrap">
            {availableMaterials.map((material) => (
              <button
                key={material.value}
                onClick={() => handleAttributeSelect('material', material.value)}
                className={`px-3 py-2 border rounded-md text-sm transition-colors ${
                  selectedAttributes.material === material.value
                    ? 'bg-black text-white'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                {material.displayName}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quantity Selection */}
      {isInStock && (
        <div>
          <h3 className="font-medium mb-3">Quantity</h3>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={quantity <= 1}
              className="w-10 h-10 border border-gray-300 rounded-md flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              -
            </button>
            <div className="w-16 text-center">
              <input
                type="number"
                min="1"
                max={currentStock}
                value={quantity}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 1;
                  setQuantity(Math.min(currentStock, Math.max(1, val)));
                }}
                className="w-full text-center border border-gray-300 rounded px-2 py-1"
              />
            </div>
            <button
              onClick={() => setQuantity(Math.min(currentStock, quantity + 1))}
              disabled={quantity >= currentStock}
              className="w-10 h-10 border border-gray-300 rounded-md flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              +
            </button>
            <span className="text-sm text-gray-500 ml-2">
              Max: {currentStock}
            </span>
          </div>
        </div>
      )}

      {/* Add to Cart Message */}
      {addToCartMessage && (
        <div className={`p-3 rounded-md text-sm font-medium ${
          addToCartMessage.includes('success') 
            ? 'bg-green-100 text-green-800 border border-green-200'
            : 'bg-red-100 text-red-800 border border-red-200'
        }`}>
          {addToCartMessage}
        </div>
      )}

      {/* Add to Cart Button */}
      <button
        disabled={!isInStock || !selectedVariant || isAddingToCart}
        onClick={addToCart}
        className={`w-full py-3 rounded-md font-medium transition-colors ${
          isInStock && selectedVariant && !isAddingToCart
            ? 'bg-black text-white hover:bg-gray-800'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        }`}
      >
        {isAddingToCart ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></span>
            Adding to Cart...
          </span>
        ) : (
          isInStock ? 'Add to Cart' : 'Out of Stock'
        )}
      </button>

      {/* Add to Wishlist */}
      <button className="w-full py-2 border border-gray-300 rounded-md font-medium hover:bg-gray-50 transition-colors">
        Add to Wishlist
      </button>

      {/* Delivery Info */}
      {isInStock && (
        <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
          <span>📦</span>
          <div>
            <p className="font-medium">Free delivery</p>
            <p>Order by 2:30 PM for next day delivery</p>
          </div>
        </div>
      )}

      {/* Description */}
      <div>
        <h3 className="font-medium mb-2">Description & Fit</h3>
        <p className="text-gray-600 text-sm leading-relaxed">
          {product.description || 'High-quality product with attention to detail and craftsmanship. Perfect for everyday wear with comfort and style in mind.'}
        </p>
      </div>

      {/* Variant Information */}
      {selectedVariant && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-medium mb-2">Product Details</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p><span className="font-medium text-gray-700">SKU:</span> {selectedVariant.sku}</p>
              <p><span className="font-medium text-gray-700">Available:</span> {currentStock} units</p>
            </div>
            <div>
              <p><span className="font-medium text-gray-700">Sold:</span> {selectedVariant.soldQuantity} units</p>
              <p><span className="font-medium text-gray-700">Status:</span> 
                <span className={`ml-1 ${isInStock ? 'text-green-600' : 'text-red-600'}`}>
                  {isInStock ? 'In Stock' : 'Out of Stock'}
                </span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Care Instructions */}
      

      {/* Shipping & Returns */}
     
    </div>
  );
}

// Helper function to determine if a color is light
function isLightColor(hexColor: string): boolean {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5;
}
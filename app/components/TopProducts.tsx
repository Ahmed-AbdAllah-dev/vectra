// components/dashboard/TopProducts.tsx
'use client';

import React from 'react';
import { TrendingUp, Star, Package, AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface Product {
  id: string;
  name: string;
  revenue: number;
  quantity: number;
  image?: string;
}

interface TopProductsProps {
  products: Product[];
}

export default function TopProducts({ products }: TopProductsProps) {
  // If no products, show empty state
  if (!products || products.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Top Products</h2>
        <div className="text-center py-8">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600">No product sales data</p>
          <p className="text-sm text-gray-500 mt-1">Start selling to see your top products</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Top Products</h2>
        <Link 
          href="/dashboard/products" 
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          View all
        </Link>
      </div>
      
      <div className="space-y-4">
        {products.map((product, index) => (
          <Link
            key={product.id}
            href={`/dashboard/products/${product.id}`}
            className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors group"
          >
            <div className="flex items-center space-x-3">
              {/* Rank Badge */}
              <div className={`
                w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold
                ${index === 0 ? 'bg-yellow-50 text-yellow-700' : 
                  index === 1 ? 'bg-gray-100 text-gray-700' : 
                  index === 2 ? 'bg-amber-50 text-amber-700' : 
                  'bg-gray-50 text-gray-600'}
              `}>
                #{index + 1}
              </div>
              
              {/* Product Image */}
              <div className="w-12 h-12 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                {product.image ? (
                  <img 
                    src={product.image} 
                    alt={product.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                      const parent = (e.target as HTMLImageElement).parentElement;
                      if (parent) {
                        parent.innerHTML = `
                          <div class="w-full h-full flex items-center justify-center">
                            <span class="text-gray-600 text-xs">No image</span>
                          </div>
                        `;
                      }
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                    <Package className="w-6 h-6 text-gray-400" />
                  </div>
                )}
              </div>
              
              {/* Product Info */}
              <div className="min-w-0">
                <p className="font-medium text-gray-900 truncate max-w-[150px]">
                  {product.name}
                </p>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-sm text-gray-600">
                    {product.quantity} sold
                  </span>
                  <span className="text-xs text-gray-400">•</span>
                  <div className="flex items-center text-amber-500">
                    <Star className="w-3 h-3 fill-current" />
                    <span className="text-xs ml-1">4.5</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Revenue */}
            <div className="text-right">
              <p className="font-bold text-gray-900">
                ${product.revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <div className="flex items-center justify-end text-green-600 text-sm">
                <TrendingUp className="w-4 h-4 mr-1" />
                <span>+{Math.floor(Math.random() * 20) + 5}%</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
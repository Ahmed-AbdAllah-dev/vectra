// app/dashboard/products/[id]/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Package,
  DollarSign,
  ShoppingBag,
  TrendingUp,
  Star,
  Eye,
  AlertCircle,
  CheckCircle,
  XCircle,
  Calendar,
  Tag,
  Layers,
  BarChart3,
  Download,
  Share2,
  MoreVertical,
  ChevronRight,
  TrendingDown
} from 'lucide-react';

interface ProductDetail {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  bestSelling: boolean;
  createdAt: string;
  updatedAt: string;
  images: Array<{
    id: number;
    url: string;
    altText: string | null;
    isPrimary: boolean;
    sortOrder: number;
  }>;
  variants: Array<{
    id: number;
    sku: string;
    currentStock: number;
    soldQuantity: number;
    weight: number | null;
    
    isActive: boolean;
    attributes: Array<{
      attribute: {
        name: string;
        displayName: string;
        type: string;
      };
      value: {
        value: string;
        displayName: string;
        hexColor: string | null;
      };
    }>;
    images: Array<{
      id: number;
      url: string;
      altText: string | null;
      isPrimary: boolean;
    }>;
    orders: Array<{
      id: number;
      quantity: number;
      total: number;
      createdAt: string;
    }>;
  }>;
  reviews: Array<{
    id: number;
    star: number;
    content: string;
    createdAt: string;
    buyer: {
      name: string;
    };
  }>;
  discounts: Array<{
    id: number;
    percentage: number;
    startDate: string;
    endDate: string;
  }>;
  metrics: {
    totalStock: number;
    totalSold: number;
    totalRevenue: number;
    averageRating: number;
    reviewCount: number;
    variantCount: number;
    activeVariants: number;
    monthlySales: Array<{
      month: string;
      revenue: number;
    }>;
  };
}

export default function ProductDetailPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id;
  
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeImage, setActiveImage] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Fetch product details
  useEffect(() => {
    if (!productId) return;

    const fetchProduct = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/seller/products/${productId}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Product not found');
          }
          throw new Error('Failed to fetch product');
        }
        
        const data = await response.json();
        setProduct(data);
      } catch (error: any) {
        console.error('Error fetching product:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  // Handle delete
  const handleDelete = async () => {
    if (!product) return;
    
    setDeleting(true);
    try {
      const response = await fetch(`/api/seller/products/${productId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete product');
      }
      
      // Success - close modal and show success message briefly
      setShowDeleteConfirm(false);
      
      // Show success toast/message (optional)
      setError(null); // Clear any previous errors
      
      // Redirect after a short delay for better UX
      setTimeout(() => {
        router.replace('/dashboard/products'); // Use replace instead of push
        router.refresh();
      }, 500);
      
    } catch (error: any) {
      console.error('Error deleting product:', error);
      setError(error.message);
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  // Export to Excel function
  const exportToExcel = async () => {
    if (!product) return;
    
    setExporting(true);
    try {
      // Prepare data for export
      const exportData = {
        product: {
          id: product.id,
          name: product.name,
          description: product.description,
          price: product.price,
          category: product.category,
          bestSelling: product.bestSelling,
          createdAt: product.createdAt,
          updatedAt: product.updatedAt,
        },
        variants: product.variants.map(variant => ({
          sku: variant.sku,
          currentStock: variant.currentStock,
          soldQuantity: variant.soldQuantity,
          weight: variant.weight,
          isActive: variant.isActive,
          attributes: variant.attributes.map(attr => ({
            attribute: attr.attribute.displayName,
            value: attr.value.displayName
          })).join(', ')
        })),
        metrics: product.metrics,
        reviews: product.reviews.map(review => ({
          rating: review.star,
          content: review.content,
          buyer: review.buyer.name,
          date: review.createdAt
        }))
      };

      // Send to API to generate Excel file
      const response = await fetch('/api/seller/products/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(exportData),
      });

      if (!response.ok) {
        throw new Error('Failed to generate export');
      }

      // Get the blob and create download link
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `product_${product.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

    } catch (error: any) {
      console.error('Error exporting product:', error);
      setError(error.message || 'Failed to export product data');
    } finally {
      setExporting(false);
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 w-48 bg-gray-200 rounded mb-6"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <div className="h-[400px] bg-gray-200 rounded-lg"></div>
              <div className="flex gap-2 mt-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-20 w-20 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <div className="h-6 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 mr-3" />
            <div>
              <p className="text-red-800 font-medium">Error</p>
              <p className="text-red-700 text-sm mt-1">{error}</p>
            </div>
          </div>
        </div>
        <Link
          href="/dashboard/products"
          className="inline-flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Products
        </Link>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Product not found</h2>
          <p className="text-gray-600 mb-6">The product you're looking for doesn't exist.</p>
          <Link
            href="/dashboard/products"
            className="inline-flex items-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Products
          </Link>
        </div>
      </div>
    );
  }

  const primaryImage = product.images.find(img => img.isPrimary) || product.images[0];
  const totalStock = product.variants.reduce((sum, v) => sum + v.currentStock, 0);
  const totalSold = product.variants.reduce((sum, v) => sum + v.soldQuantity, 0);
  const status = totalStock > 10 ? 'in_stock' : totalStock > 0 ? 'low_stock' : 'out_of_stock';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8">
        <div>
          <Link
            href="/dashboard/products"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Products
          </Link>
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
            {product.bestSelling && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                <TrendingUp className="w-3 h-3 mr-1" />
                Best Seller
              </span>
            )}
          </div>
          <p className="text-gray-600 mt-2">{product.category} • Added {formatDate(product.createdAt)}</p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center gap-3">
          <Link
            href={`/dashboard/products/${productId}/edit`}
            className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit Product
          </Link>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            disabled={deleting}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center mb-4">
              <AlertCircle className="w-6 h-6 text-red-600 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">Delete Product</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete <span className="font-semibold">{product.name}</span>? 
              This action cannot be undone and will delete all associated variants and images.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Delete Product'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Images and Basic Info */}
        <div className="lg:col-span-2 space-y-8">
          {/* Images */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Product Images</h2>
            {product.images.length > 0 ? (
              <div className="space-y-4">
                <div className="relative h-96 rounded-lg overflow-hidden bg-gray-100">
                  <img
                    src={product.images[activeImage]?.url || '/placeholder.jpg'}
                    alt={product.images[activeImage]?.altText || product.name}
                    className="w-full h-full object-contain"
                  />
                </div>
                {product.images.length > 1 && (
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                    {product.images.map((image, index) => (
                      <button
                        key={image.id}
                        onClick={() => setActiveImage(index)}
                        className={`relative h-20 rounded-lg overflow-hidden border-2 ${
                          activeImage === index 
                            ? 'border-black' 
                            : 'border-transparent'
                        }`}
                      >
                        <img
                          src={image.url}
                          alt={image.altText || `${product.name} ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        {image.isPrimary && (
                          <div className="absolute top-1 left-1">
                            <span className="px-1.5 py-0.5 bg-black text-white text-xs rounded">
                              Primary
                            </span>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No images uploaded</p>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Description</h2>
            <div className="prose max-w-none">
              {product.description ? (
                <p className="text-gray-700 whitespace-pre-line">{product.description}</p>
              ) : (
                <p className="text-gray-500 italic">No description provided</p>
              )}
            </div>
          </div>

          {/* Variants */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Product Variants</h2>
              <span className="text-sm text-gray-600">
                {product.variants.length} variant{product.variants.length !== 1 ? 's' : ''}
              </span>
            </div>
            
            {product.variants.length > 0 ? (
              <div className="space-y-4">
                {product.variants.map((variant) => (
                  <div
                    key={variant.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-900">{variant.sku}</span>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            variant.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {variant.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        
                        {variant.attributes.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {variant.attributes.map((attr, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm"
                              >
                                {attr.value.hexColor && (
                                  <div
                                    className="w-3 h-3 rounded-full mr-1 border border-gray-300"
                                    style={{ backgroundColor: attr.value.hexColor }}
                                  ></div>
                                )}
                                {attr.attribute.displayName}: {attr.value.displayName}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      <div className="text-right">
                        <div className="font-medium text-gray-900">
                          {formatCurrency(product.price)}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          {variant.currentStock} in stock
                        </div>
                        {variant.soldQuantity > 0 && (
                          <div className="text-xs text-gray-500">
                            {variant.soldQuantity} sold
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Variant Images */}
                    {variant.images.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="flex gap-2 overflow-x-auto">
                          {variant.images.map((image) => (
                            <div
                              key={image.id}
                              className="relative h-16 w-16 flex-shrink-0 rounded border border-gray-200 overflow-hidden"
                            >
                              <img
                                src={image.url}
                                alt={image.altText || 'Variant image'}
                                className="w-full h-full object-cover"
                              />
                              {image.isPrimary && (
                                <div className="absolute top-0 left-0">
                                  <span className="px-1 py-0.5 bg-black text-white text-xs">P</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Layers className="w-8 h-8 mx-auto mb-2" />
                <p>No variants created</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Stats and Actions */}
        <div className="space-y-6 mr-0">
          {/* Stats */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Product Statistics</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                    <ShoppingBag className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Stock</p>
                    <p className="text-xl font-bold text-gray-900">{totalStock}</p>
                  </div>
                </div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  status === 'in_stock' 
                    ? 'bg-green-100 text-green-800' 
                    : status === 'low_stock'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {status === 'in_stock' && <CheckCircle className="w-3 h-3 mr-1" />}
                  {status === 'out_of_stock' && <XCircle className="w-3 h-3 mr-1" />}
                  {status === 'in_stock' ? 'In Stock' : 
                   status === 'low_stock' ? 'Low Stock' : 'Out of Stock'}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Sold</p>
                    <p className="text-xl font-bold text-gray-900">{totalSold}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Revenue</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {formatCurrency(product.metrics.totalRevenue)}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                    <Star className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Rating</p>
                    <div className="flex items-center">
                      <div className="flex text-yellow-400">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3 h-3 ${
                              i < Math.floor(product.metrics.averageRating)
                                ? 'fill-current'
                                : 'stroke-current'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="ml-2 text-gray-900 font-small">
                        {product.metrics.averageRating.toFixed(1)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Based on {product.metrics.reviewCount} review{product.metrics.reviewCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Reviews</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {product.metrics.reviewCount}
                  </p>
                </div>
              </div>
              
              <div className="pt-4 border-t border-gray-200">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Category</p>
                    <p className="font-medium text-gray-900">{product.category}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Price</p>
                    <p className="font-medium text-gray-900">{formatCurrency(product.price)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Created</p>
                    <p className="font-medium text-gray-900">
                      {new Date(product.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Last Updated</p>
                    <p className="font-medium text-gray-900">
                      {new Date(product.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <Link
                href={`/product/${productId}`}
                target="_blank"
                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center">
                  <Eye className="w-5 h-5 text-gray-600 mr-3" />
                  <span className="text-gray-900">View on Store</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </Link>
              
              <Link
                href={`/dashboard/products/${productId}/edit`}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center">
                  <Edit className="w-5 h-5 text-blue-600 mr-3" />
                  <span className="text-gray-900">Edit Product</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </Link>
              
              <button
                onClick={() => router.push(`/dashboard/orders?product=${productId}`)}
                className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center">
                  <BarChart3 className="w-5 h-5 text-green-600 mr-3" />
                  <span className="text-gray-900">View Orders</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </button>
              
              <button
                onClick={exportToExcel}
                disabled={exporting}
                className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center">
                  <Download className="w-5 h-5 text-purple-600 mr-3" />
                  <span className="text-gray-900">{exporting ? 'Exporting...' : 'Export to Excel'}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </div>

          {/* Reviews Preview */}
          {product.reviews.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Recent Reviews</h2>
                <Link
                  href={`/dashboard/reviews?product=${productId}`}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  View all
                </Link>
              </div>
              <div className="space-y-4">
                {product.reviews.slice(0, 3).map((review) => (
                  <div key={review.id} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <div className="flex text-yellow-400">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3 h-3 ${
                                i < review.star ? 'fill-current' : 'stroke-current'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="ml-2 text-sm font-medium text-gray-900">
                          {review.buyer.name}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 line-clamp-2">{review.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Discounts */}
          {product.discounts.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Active Discounts</h2>
              <div className="space-y-3">
                {product.discounts.map((discount) => {
                  const isActive = new Date(discount.startDate) <= new Date() && 
                                  new Date(discount.endDate) >= new Date();
                  return (
                    <div
                      key={discount.id}
                      className={`p-3 rounded-lg ${
                        isActive ? 'bg-green-50 border border-green-200' : 'bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-gray-900">
                          {discount.percentage}% OFF
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {isActive ? 'Active' : 'Expired'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {new Date(discount.startDate).toLocaleDateString()} -{' '}
                        {new Date(discount.endDate).toLocaleDateString()}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
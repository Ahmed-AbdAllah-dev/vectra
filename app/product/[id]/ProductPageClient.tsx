// app/product/[id]/ProductPageClient.tsx
'use client';

import { useState, useEffect } from 'react';
import ProductImageGallery from '@/app/components/ProductImageGallery';
import ProductInfo from '@/app/components/ProductInfo';

import ReviewSection from '@/app/components/ReviewSection';
import { Product } from '@/types/product';

// Function to fetch related products (Client-side)
const getRelatedProducts = async (category: string, excludeId: number) => {
  try {
    const res = await fetch(`/api/products?category=${encodeURIComponent(category)}&limit=4`, {
      cache: 'no-store'
    });
    
    if (res.ok) {
      const data = await res.json();
      // Filter out the current product and return up to 4 related products
      return data.products.filter((p: any) => p.id !== excludeId).slice(0, 4);
    }
  } catch (error) {
    console.error('Error fetching related products:', error);
  }
  
  // Fallback to mock data if API fails
  return [
    {
      id: 2,
      name: "Polo with Contrast Trims",
      price: 212,
      images: [{ url: `https://picsum.photos/300/300?random=2`, altText: "Polo with Contrast Trims" }],
      category: "Men Fashion",
      rating: 4.0,
      reviews: 25
    },
    {
      id: 3,
      name: "Gradient Graphic T-shirt",
      price: 145,
      images: [{ url: `https://picsum.photos/300/300?random=3`, altText: "Gradient Graphic T-shirt" }],
      category: "Men Fashion",
      rating: 3.66,
      reviews: 18
    },
    {
      id: 4,
      name: "Polo with Tipping Details",
      price: 680,
      images: [{ url: `https://picsum.photos/300/300?random=4`, altText: "Polo with Tipping Details" }],
      category: "Men Fashion",
      rating: 4.50,
      reviews: 32
    },
    {
      id: 5,
      name: "Striped Jacket",
      price: 120,
      images: [{ url: `https://picsum.photos/300/300?random=5`, altText: "Striped Jacket" }],
      category: "Men Fashion",
      rating: 5.0,
      reviews: 15
    }
  ];
};

interface ProductPageClientProps {
  product: Product;
}

export default function ProductPageClient({ product }: ProductPageClientProps) {
  const [selectedVariant, setSelectedVariant] = useState(product.defaultVariant || null);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [isLoadingRelated, setIsLoadingRelated] = useState(true);

  // Debug logging
  useEffect(() => {
    console.log('ProductPageClient received product:', {
      id: product.id,
      name: product.name,
      variants: product.variants?.length || 0,
      availableAttributes: Object.keys(product.availableAttributes || {}),
      defaultVariant: product.defaultVariant?.id,
      averageRating: product.averageRating
    });
  }, [product]);

  // Load related products
  useEffect(() => {
    const loadRelatedProducts = async () => {
      try {
        console.log("Loading related products for product id:", product.id);
        const related = await getRelatedProducts(product.category, product.id);
        setRelatedProducts(related);
      } catch (error) {
        console.error('Failed to load related products:', error);
      } finally {
        setIsLoadingRelated(false);
      }
    };

    loadRelatedProducts();
  }, [product.category, product.id]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      

      {/* Main Product Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
        <ProductImageGallery 
          images={product.images} 
          productName={product.name}
          selectedVariant={selectedVariant}
        />
        <ProductInfo 
          product={product} 
          onVariantChange={setSelectedVariant}
        />
      </div>

      {/* Product Specifications */}
      {selectedVariant && (
        <div className="mb-16 bg-gray-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Product Specifications</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <h3 className="font-medium text-gray-700 mb-3">Product Details</h3>
              <dl className="space-y-2 text-sm">
                <div>
                  <dt className="font-medium text-gray-600">SKU:</dt>
                  <dd className="text-gray-900">{selectedVariant.sku}</dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-600">Stock:</dt>
                  <dd className={`${selectedVariant.currentStock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {selectedVariant.currentStock} available
                  </dd>
                </div>
                {selectedVariant.weight && (
                  <div>
                    <dt className="font-medium text-gray-600">Weight:</dt>
                    <dd className="text-gray-900">{selectedVariant.weight}kg</dd>
                  </div>
                )}
                <div>
                  <dt className="font-medium text-gray-600">Units sold:</dt>
                  <dd className="text-gray-900">{selectedVariant.soldQuantity}</dd>
                </div>
              </dl>
            </div>
            
            {selectedVariant.attributes && Object.keys(selectedVariant.attributes).length > 0 && (
              <div>
                <h3 className="font-medium text-gray-700 mb-3">Selected Specifications</h3>
                <dl className="space-y-2 text-sm">
                  {Object.entries(selectedVariant.attributes).map(([key, value]: [string, any]) => (
                    <div key={key}>
                      <dt className="font-medium text-gray-600 capitalize">{key}:</dt>
                      <dd className="text-gray-900 flex items-center gap-2">
                        {value.displayName || value.value}
                        {value.hexColor && (
                          <span 
                            className="w-4 h-4 rounded-full border border-gray-300"
                            style={{ backgroundColor: value.hexColor }}
                            title={`Color: ${value.displayName}`}
                          ></span>
                        )}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}

            <div>
              <h3 className="font-medium text-gray-700 mb-3">Availability</h3>
              <dl className="space-y-2 text-sm">
                <div>
                  <dt className="font-medium text-gray-600">Status:</dt>
                  <dd className={selectedVariant.currentStock > 0 ? 'text-green-600' : 'text-red-600'}>
                    {selectedVariant.currentStock > 0 ? 'In Stock' : 'Out of Stock'}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-600">Variants available:</dt>
                  <dd className="text-gray-900">{product.variants?.length || 0}</dd>
                </div>
                {product.availableAttributes && (
                  <div>
                    <dt className="font-medium text-gray-600">Options:</dt>
                    <dd className="text-gray-900">
                      {Object.entries(product.availableAttributes)
                        .filter(([_, values]) => values.length > 1)
                        .map(([attr, values]) => `${values.length} ${attr}${values.length > 1 ? 's' : ''}`)
                        .join(', ') || 'Standard'
                      }
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          </div>

          {/* Variant Images Preview */}
          
        </div>
      )}

      {/* Product Features */}
      <div className="mb-16">
        <h2 className="text-xl font-semibold mb-6">Product Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-blue-600">✓</span>
            </div>
            <div>
              <h3 className="font-medium mb-1">Quality Materials</h3>
              <p className="text-sm text-gray-600">Made with premium materials for lasting comfort and durability.</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-green-600">🚚</span>
            </div>
            <div>
              <h3 className="font-medium mb-1">Free Shipping</h3>
              <p className="text-sm text-gray-600">Free delivery on orders over $50. Fast and reliable shipping.</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-purple-600">↩</span>
            </div>
            <div>
              <h3 className="font-medium mb-1">Easy Returns</h3>
              <p className="text-sm text-gray-600">30-day return policy with free return shipping.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="mb-16">
        <ReviewSection productId={product.id} />
      </div>

      {/* Related Products */}
      <div className="mb-16">
        <h2 className="text-xl font-semibold mb-6">You might also like</h2>
        {isLoadingRelated ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-100 aspect-square rounded-lg animate-pulse"></div>
            ))}
          </div>
        ) : relatedProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {relatedProducts.map((relatedProduct) => (
              <a
                key={relatedProduct.id}
                href={`/product/${relatedProduct.id}`}
                className="group block"
              >
                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-3 group-hover:opacity-75 transition-opacity">
                  <img
                    src={relatedProduct.images?.[0]?.url || `https://picsum.photos/300/300?random=${relatedProduct.id}`}
                    alt={relatedProduct.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="font-medium text-sm mb-1 group-hover:text-gray-600">{relatedProduct.name}</h3>
                <p className="text-sm font-semibold">${relatedProduct.price}</p>
                {relatedProduct.rating > 0 && (
                  <div className="flex items-center gap-1 mt-1">
                    <div className="flex text-yellow-400 text-xs">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className={i < Math.floor(relatedProduct.rating) ? '' : 'text-gray-300'}>
                          ★
                        </span>
                      ))}
                    </div>
                    <span className="text-xs text-gray-500">({relatedProduct.reviews})</span>
                  </div>
                )}
              </a>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No related products found.</p>
        )}
      </div>
    </div>
  );
}
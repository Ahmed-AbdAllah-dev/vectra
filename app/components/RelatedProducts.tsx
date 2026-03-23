// components/RelatedProducts.tsx
import Image from 'next/image';
import Link from 'next/link';

interface RelatedProduct {
  id: number;
  name: string;
  price: number;
  discountedPrice?: number;
  discount?: number;
  images: { url: string; altText?: string | null }[];
  category: string;
  averageRating: number;
  reviewCount: number;
  bestSelling?: boolean;
}

interface RelatedProductsProps {
  products: RelatedProduct[];
}

export default function RelatedProducts({ products }: RelatedProductsProps) {
  if (!products || products.length === 0) {
    return null;
  }

  return (
    <div className="mt-16">
      <h2 className="text-2xl font-semibold text-center mb-8">You might also like</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {products.map((product) => {
          const finalPrice = product.discountedPrice || product.price;
          const hasDiscount = product.discount && product.discount > 0;
          
          return (
            <Link key={product.id} href={`/product/${product.id}`} className="group">
              <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden mb-3">
                <Image
                  src={product.images[0]?.url || '/placeholder-product.jpg'}
                  alt={product.images[0]?.altText || product.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
                
                {/* Discount Badge */}
                {hasDiscount && (
                  <div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
                    -{product.discount}%
                  </div>
                )}
                
                {/* Best Selling Badge */}
                {product.bestSelling && (
                  <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                    Best Seller
                  </div>
                )}
              </div>
              
              <div className="space-y-1">
                <h3 className="font-medium text-sm group-hover:underline line-clamp-2">{product.name}</h3>
                
                <div className="flex items-center gap-2 text-xs">
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        className={`${star <= product.averageRating ? 'text-yellow-400' : 'text-gray-300'}`}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                  <span className="text-gray-600">{product.averageRating.toFixed(1)}</span>
                  <span className="text-gray-400">({product.reviewCount})</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">${finalPrice.toFixed(2)}</span>
                  {hasDiscount && (
                    <span className="text-xs text-gray-500 line-through">${product.price.toFixed(2)}</span>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
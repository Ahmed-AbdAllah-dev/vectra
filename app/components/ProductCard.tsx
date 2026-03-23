import { Star, StarHalf } from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";

const ProductCard: React.FC<{ product: any }> = ({ product }) => {
  const { data: session, status } = useSession();

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
      );
    }

    if (hasHalfStar) {
      stars.push(
        <StarHalf
          key="half"
          className="w-3 h-3 fill-yellow-400 text-yellow-400"
        />
      );
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<Star key={`empty-${i}`} className="w-3 h-3 text-gray-300" />);
    }

    return stars;
  };

  const originalPrice = product.discountPercentage
    ? product.price / (1 - product.discountPercentage / 100)
    : null;

  return (
    <Link href={`/product/${product.id}`}>
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-3 hover:shadow-md transition-shadow w-full h-full flex flex-col">
      {/* Badges - Fixed height container */}
      <div className="flex justify-between items-start mb-2 gap-2 min-h-[3rem]">
        <div className="flex flex-wrap gap-1 flex-1 min-w-0">
          <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full truncate">
            {product.category}
          </span>
          {product.isNewArrival && (
            <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap">
              New
            </span>
          )}
          {product.isBestSeller && (
            <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap">
              Best Seller
            </span>
          )}
          {product.currentStock <= 5 && product.currentStock > 0 && (
            <span className="bg-orange-100 text-orange-700 text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap">
              Low Stock
            </span>
          )}
        </div>
        {product.discountPercentage && (
          <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap flex-shrink-0">
            -{product.discountPercentage}%
          </span>
        )}
      </div>

      {/* Product Image - UPDATED SECTION */}
      
        <div className="aspect-square bg-gray-100 rounded-lg mb-3 overflow-hidden relative group">
          {product.image && (
            <Image
              src={product.image}
              alt={product.imageAlt || product.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
              placeholder="blur"
              blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaUMk8Ybf4Rf//Z"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = "none";
                target.nextElementSibling?.classList.remove("hidden");
              }}
            />
          )}
          {/* Fallback placeholder - shown if no image or image fails to load */}

          <div
            className={`w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-gray-500 text-xs p-2 text-center ${
              product.image ? "hidden" : ""
            }`}
          >
            {product.name.length > 20
              ? `${product.name.substring(0, 20)}...`
              : product.name}
          </div>
        </div>
      
      {/* Product Info */}
      <div className="space-y-2 flex-1 flex flex-col">
        <h3 className="font-medium text-gray-900 text-sm leading-tight line-clamp-2 min-h-[2.5rem]">
          {product.name}
        </h3>

        <div className="text-xs text-gray-500 truncate">
          by {product.sellerName}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1 min-w-0 flex-1">
            <div className="flex items-center space-x-1">
              {renderStars(product.rating)}
            </div>
            <span className="text-xs text-gray-500 truncate">
              {product.rating} ({product.reviews})
            </span>
          </div>
        </div>

        {/* Price */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 min-w-0">
            <div className="text-lg font-semibold text-gray-900">
              ${product.price.toFixed(2)}
            </div>
            {originalPrice && (
              <div className="text-sm text-gray-500 line-through">
                ${originalPrice.toFixed(2)}
              </div>
            )}
          </div>
        </div>

        {/* Stock Info */}
        <div className="text-xs text-gray-500">
          {product.currentStock > 0 ? (
            <span>
              {product.currentStock} in stock • {product.soldQuantity} sold
            </span>
          ) : (
            <span className="text-red-600 font-medium">Out of Stock</span>
          )}
        </div>

        {/* Action Buttons - Push to bottom */}
        <div className="space-y-2 pt-1 mt-auto">
          
          
        </div>
      </div>
    </div>
    </Link>
  );
};

export default ProductCard;

// components/ProductImageGallery.tsx
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { ProductImage } from '@/types/product';

interface ProductImageGalleryProps {
  images: ProductImage[];
  productName: string;
  selectedVariant?: {
    id: number;
    images: ProductImage[];
    attributes: Record<string, any>;
  } | null;
}

export default function ProductImageGallery({ 
  images, 
  productName, 
  selectedVariant 
}: ProductImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState(0);

  // Determine which images to show
  const displayImages = (() => {
    // If there's a selected variant with images, prioritize variant images
    if (selectedVariant && selectedVariant.images && selectedVariant.images.length > 0) {
      // Combine variant images with product images, variant images first
      return [
        ...selectedVariant.images.sort((a, b) => a.sortOrder - b.sortOrder),
        ...images.filter(img => !selectedVariant.images.some(vImg => vImg.id === img.id))
          .sort((a, b) => a.sortOrder - b.sortOrder)
      ];
    }
    
    // Fallback to product images only
    return images.sort((a, b) => a.sortOrder - b.sortOrder);
  })();

  // Reset selected image when variant changes
  useEffect(() => {
    if (selectedVariant) {
      setSelectedImage(0);
    }
  }, [selectedVariant?.id]);

  // Ensure we have at least a placeholder if no images
  const finalImages = displayImages.length > 0 ? displayImages : [{
    id: 0,
    url: `https://picsum.photos/500/500?random=${selectedVariant?.id || 'default'}`,
    altText: `${productName} placeholder`,
    sortOrder: 0,
    isPrimary: true,
    type: 'placeholder'
  }];

  return (
    <div className="flex flex-col">
      {/* Main Image */}
      <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-4 relative group">
        <Image
          src={finalImages[selectedImage]?.url || '/placeholder-product.jpg'}
          alt={finalImages[selectedImage]?.altText || productName}
          width={500}
          height={500}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          priority
        />
        
        {/* Image Counter */}
        {finalImages.length > 1 && (
          <div className="absolute bottom-4 right-4 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
            {selectedImage + 1} / {finalImages.length}
          </div>
        )}

        {/* Navigation Arrows */}
        {finalImages.length > 1 && (
          <>
            <button
              onClick={() => setSelectedImage(selectedImage > 0 ? selectedImage - 1 : finalImages.length - 1)}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-2 shadow-lg transition-all opacity-0 group-hover:opacity-100"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => setSelectedImage(selectedImage < finalImages.length - 1 ? selectedImage + 1 : 0)}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-2 shadow-lg transition-all opacity-0 group-hover:opacity-100"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}
      </div>
      
      {/* Variant Info Banner */}
      {selectedVariant && selectedVariant.attributes && Object.keys(selectedVariant.attributes).length > 0 && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800 font-medium">Current Selection:</p>
          <div className="flex flex-wrap gap-2 mt-1">
            {Object.entries(selectedVariant.attributes).map(([key, value]: [string, any]) => (
              <span 
                key={key}
                className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
              >
                <span className="capitalize">{key}:</span>
                <span className="ml-1 font-semibold">{value.displayName || value.value}</span>
                {value.hexColor && (
                  <span 
                    className="ml-2 w-3 h-3 rounded-full border border-gray-300"
                    style={{ backgroundColor: value.hexColor }}
                  ></span>
                )}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Thumbnail Images */}
      {finalImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {finalImages.map((image, index) => {
            const isVariantImage = selectedVariant?.images?.some(vImg => vImg.id === image.id);
            
            return (
              <button
                key={`${image.id}-${index}`}
                onClick={() => setSelectedImage(index)}
                className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                  selectedImage === index 
                    ? 'border-black ring-2 ring-blue-200' 
                    : 'border-gray-200 hover:border-gray-400'
                } ${isVariantImage ? 'ring-1 ring-blue-300' : ''}`}
                title={isVariantImage ? 'Variant specific image' : 'Product image'}
              >
                <Image
                  src={image.url}
                  alt={image.altText || `${productName} view ${index + 1}`}
                  width={80}
                  height={80}
                  className="w-full h-full object-cover"
                />
                
                {/* Variant indicator */}
                {isVariantImage && (
                  <div className="absolute bottom-0 right-0 w-2 h-2 bg-blue-500 rounded-full transform translate-x-1 translate-y-1"></div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Image Type Legend */}
      {selectedVariant && finalImages.some(img => selectedVariant.images?.some(vImg => vImg.id === img.id)) && (
        <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span>Variant specific</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
            <span>General product</span>
          </div>
        </div>
      )}

      {/* Zoom Hint */}
      <div className="mt-2 text-center">
        <p className="text-xs text-gray-400">
          Hover over main image to zoom • Click thumbnails to change view
        </p>
      </div>
    </div>
  );
}
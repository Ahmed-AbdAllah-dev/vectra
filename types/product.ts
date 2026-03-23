// types/product.ts
export interface ProductImage {
  id: number;
  url: string;
  altText?: string | null;
  caption?: string | null;
  sortOrder: number;
  isPrimary: boolean;
  type?: string | null;
}

export interface ProductVariant {
  id: number;
  sku: string;
  currentStock: number;
  soldQuantity: number;
  weight?: number;
  isActive: boolean;
  attributes: Record<string, {
    value: string;
    displayName: string;
    hexColor?: string | null;
  }>;
  images: ProductImage[];
}

// types/product.ts
export interface Review {
  id: number;
  star: number;
  content: string;
  productId: number;
  buyerId: number;
  createdAt: string;
  buyer: {
    id: number;
    name: string;
  };
}
export interface Discount {
  id: number;
  percentage: number;
  startDate: Date;
  endDate: Date;
}

export interface AttributeValue {
  value: string;
  displayName: string;
  hexColor?: string | null;
}

export interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  description?: string | null;
  averageRating: number;
  reviewCount: number;
  
  // Images
  images: ProductImage[];
  
  // Variants
  variants: ProductVariant[];
  defaultVariant?: ProductVariant | null;
  availableAttributes: Record<string, AttributeValue[]>;
  
  // Reviews
  reviews: Review[];
  
  // Discounts
  discounts: Discount[];
  activeDiscount?: Discount | null;
  
  // Seller
  seller: {
    name: string;
  };
  
  // Meta
  createdAt: Date;
  updatedAt: Date;
}

// For product listing pages
export interface ProductListItem {
  id: number;
  name: string;
  price: number;
  rating: number;
  reviews: number;
  image: string;
  imageAlt: string;
  category: string;
  description?: string;
  currentStock: number;
  soldQuantity: number;
  sellerName: string;
  isNewArrival: boolean;
  isBestSeller: boolean;
  discountPercentage?: number | null;
  dateAdded: Date;
  salesRank: number;
  
  // Variant info for filters
  availableVariants: number;
  variantCount: number;
  availableColors: AttributeValue[];
  availableSizes: AttributeValue[];
  availableMaterials: AttributeValue[];
  variants: Array<{
    id: number;
    sku: string;
    stock: number;
    isActive: boolean;
    attributes: Record<string, any>;
  }>;
}
// types/cart.ts

export interface CartProduct {
    id: number;
    name: string;
    price: number;
    discountedPrice: number;
    category: string;
    image: string;
    imageAlt: string;
  }
  
  export interface CartVariant {
    id: number;
    sku: string;
    currentStock: number;
    attributes: Record<string, {
      value: string;
      displayName: string;
      hexColor?: string;
    }>;
  }
  
  export interface CartItem {
    id: number;
    quantity: number;
    addedAt: Date;
    updatedAt: Date;
    variant: CartVariant;
    product: CartProduct;
    subtotal: number;
  }
  
  export interface CartSummary {
    itemCount: number;
    subtotal: number;
    totalSavings: number;
  }
  
  export interface Cart {
    id: number;
    buyerId?: number;
    sessionId?: string;
    items: CartItem[];
    summary: CartSummary;
    createdAt: Date;
    updatedAt: Date;
    expiresAt?: Date;
  }
  
  // API Request/Response Types
  export interface AddToCartRequest {
    variantId: number;
    quantity?: number;
    buyerId?: number;
    sessionId?: string;
  }
  
  export interface UpdateCartItemRequest {
    cartItemId: number;
    quantity: number;
    buyerId?: number;
    sessionId?: string;
  }
  
  export interface CartResponse {
    message?: string;
    cart: Cart;
  }
  
  export interface CartError {
    error: string;
  }
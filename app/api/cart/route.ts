// app/api/cart/route.ts
import  prisma  from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

// Helper function to get or create cart
// Helper function to get or create cart
async function getOrCreateCart(buyerId?: number, sessionId?: string) {
  let cart;
  
  if (buyerId && !isNaN(buyerId) && buyerId > 0) {
    // For logged-in users, get their cart
    cart = await prisma.cart.findFirst({
      where: { buyerId },
      include: {
        items: {
          include: {
            variant: {
              include: {
                attributes: {
                  include: {
                    attribute: true,
                    value: true
                  }
                },
                product: {
                  include: {
                    images: true,
                    discounts: {
                      where: {
                        startDate: { lte: new Date() },
                        endDate: { gte: new Date() }
                      }
                    }
                  }
                },
                images: true // <--- CRITICAL: Include variant images
              }
            }
          }
        }
      }
    });
    
    if (!cart) {
      cart = await prisma.cart.create({
        data: { buyerId }
        // Note: 'create' does not respect 'include'. 
        // We rely on the refetch below or the fact that items are empty here.
      });
    }
  } else if (sessionId) {
    // For guest users, get their cart by session
    cart = await prisma.cart.findFirst({
      where: { sessionId },
      include: {
        items: {
          include: {
            variant: {
              include: {
                attributes: {
                  include: {
                    attribute: true,
                    value: true
                  }
                },
                product: {
                  include: {
                    images: true,
                    discounts: {
                      where: {
                        startDate: { lte: new Date() },
                        endDate: { gte: new Date() }
                      }
                    }
                  }
                },
                images: true // <--- CRITICAL: Include variant images
              }
            }
          }
        }
      }
    });
    
    if (!cart) {
      // Set expiry for guest carts (7 days)
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      
      cart = await prisma.cart.create({
        data: { sessionId, expiresAt }
        // Note: 'create' does not respect 'include'.
      });
    }
  } else {
    throw new Error('Either buyerId or sessionId must be provided');
  }
  
  return cart;
}

// Helper function to transform cart data
function transformCartData(cart: any) {
  return {
    id: cart.id,
    buyerId: cart.buyerId,
    sessionId: cart.sessionId,
    createdAt: cart.createdAt,
    updatedAt: cart.updatedAt,
    expiresAt: cart.expiresAt,
    items: cart.items.map((item: any) => {
      const variant = item.variant;
      const product = variant.product;
      
      // Get active discount
      const activeDiscount = product.discounts?.[0];
      const discountedPrice = activeDiscount
        ? product.price * (1 - activeDiscount.percentage / 100)
        : product.price;
      
      // Get main image (variant image first, then product image)
      const mainImage = variant.images.find((img: any) => img.isPrimary) ||
                       variant.images[0] ||
                       product.images.find((img: any) => img.isPrimary) ||
                       product.images[0];
      
      // Transform variant attributes
      const attributes: Record<string, any> = {};
      variant.attributes.forEach((attr: any) => {
        attributes[attr.attribute.name] = {
          value: attr.value.value,
          displayName: attr.value.displayName,
          hexColor: attr.value.hexColor
        };
      });
      
      return {
        id: item.id,
        quantity: item.quantity,
        addedAt: item.addedAt,
        updatedAt: item.updatedAt,
        variant: {
          id: variant.id,
          sku: variant.sku,
          currentStock: variant.currentStock,
          attributes
        },
        product: {
          id: product.id,
          name: product.name,
          price: product.price,
          discountedPrice,
          category: product.category,
          image: mainImage?.url || `https://picsum.photos/300/300?random=${product.id}`,
          imageAlt: mainImage?.altText || product.name
        },
        subtotal: discountedPrice * item.quantity
      };
    }),
    summary: {
      itemCount: cart.items.reduce((sum: number, item: any) => sum + item.quantity, 0),
      subtotal: cart.items.reduce((sum: number, item: any) => {
        const product = item.variant.product;
        const activeDiscount = product.discounts?.[0];
        const discountedPrice = activeDiscount
          ? product.price * (1 - activeDiscount.percentage / 100)
          : product.price;
        return sum + (discountedPrice * item.quantity);
      }, 0),
      totalSavings: cart.items.reduce((sum: number, item: any) => {
        const product = item.variant.product;
        const activeDiscount = product.discounts?.[0];
        if (activeDiscount) {
          const savings = (product.price * activeDiscount.percentage / 100) * item.quantity;
          return sum + savings;
        }
        return sum;
      }, 0)
    }
  };
}

// GET /api/cart - Get user's cart
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const buyerId = searchParams.get('buyerId');
    const sessionId = searchParams.get('sessionId');
    const userId = searchParams.get('userId'); // Added userId parameter
    
    if (!buyerId && !sessionId && !userId) {
      return NextResponse.json(
        { error: 'Either buyerId, userId, or sessionId is required' },
        { status: 400 }
      );
    }
    
    let actualBuyerId: number | undefined;
    
    if (buyerId) {
      // If buyerId is provided directly
      const parsedBuyerId = Number(buyerId);
      if (isNaN(parsedBuyerId) || parsedBuyerId <= 0) {
        return NextResponse.json(
          { error: 'Invalid buyerId' },
          { status: 400 }
        );
      }
      actualBuyerId = parsedBuyerId;
    } else if (userId) {
      // If userId is provided, find the buyer
      const parsedUserId = Number(userId);
      if (isNaN(parsedUserId) || parsedUserId <= 0) {
        return NextResponse.json(
          { error: 'Invalid userId' },
          { status: 400 }
        );
      }
      
      const buyer = await prisma.buyer.findUnique({
        where: { userId: parsedUserId }
      });
      
      if (!buyer) {
        // Create buyer if doesn't exist
        const user = await prisma.user.findUnique({
          where: { id: parsedUserId }
        });
        
        if (!user) {
          return NextResponse.json(
            { error: 'User not found' },
            { status: 404 }
          );
        }
        
        const newBuyer = await prisma.buyer.create({
          data: {
            userId: parsedUserId,
            email: user.email,
            name: user.name || user.email.split('@')[0],
            password: 'TEMPORARY_PASSWORD' // You should handle passwords better in production
          }
        });
        
        actualBuyerId = newBuyer.id;
      } else {
        actualBuyerId = buyer.id;
      }
    }
    
    const cart = await getOrCreateCart(actualBuyerId, sessionId || undefined);
    
    const transformedCart = transformCartData(cart);
    
    return NextResponse.json(transformedCart);
    
  } catch (error) {
    console.error('Error fetching cart:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cart' },
      { status: 500 }
    );
  }
}

// POST /api/cart - Add item to cart
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { variantId, quantity = 1, buyerId, userId, sessionId } = body; // Added userId
    
    if (!variantId) {
      return NextResponse.json(
        { error: 'variantId is required' },
        { status: 400 }
      );
    }
    
    if (!buyerId && !userId && !sessionId) {
      return NextResponse.json(
        { error: 'Either buyerId, userId, or sessionId is required' },
        { status: 400 }
      );
    }
    
    // Check if variant exists and has stock
    const variant = await prisma.productVariant.findUnique({
      where: { id: variantId },
      select: { id: true, currentStock: true, isActive: true }
    });
    
    if (!variant || !variant.isActive) {
      return NextResponse.json(
        { error: 'Product variant not found or inactive' },
        { status: 404 }
      );
    }
    
    if (variant.currentStock < quantity) {
      return NextResponse.json(
        { error: `Only ${variant.currentStock} items available in stock` },
        { status: 400 }
      );
    }
    
    let actualBuyerId: number | undefined;
    
    if (buyerId) {
      // If buyerId is provided directly
      const parsedBuyerId = Number(buyerId);
      if (isNaN(parsedBuyerId) || parsedBuyerId <= 0) {
        return NextResponse.json(
          { error: 'Invalid buyerId' },
          { status: 400 }
        );
      }
      actualBuyerId = parsedBuyerId;
    } else if (userId) {
      // If userId is provided, find the buyer
      const parsedUserId = Number(userId);
      if (isNaN(parsedUserId) || parsedUserId <= 0) {
        return NextResponse.json(
          { error: 'Invalid userId' },
          { status: 400 }
        );
      }
      
      const buyer = await prisma.buyer.findUnique({
        where: { userId: parsedUserId }
      });
      
      if (!buyer) {
        // Create buyer if doesn't exist
        const user = await prisma.user.findUnique({
          where: { id: parsedUserId }
        });
        
        if (!user) {
          return NextResponse.json(
            { error: 'User not found' },
            { status: 404 }
          );
        }
        
        const newBuyer = await prisma.buyer.create({
          data: {
            userId: parsedUserId,
            email: user.email,
            name: user.name || user.email.split('@')[0],
            password: 'TEMPORARY_PASSWORD' // You should handle passwords better in production
          }
        });
        
        actualBuyerId = newBuyer.id;
      } else {
        actualBuyerId = buyer.id;
      }
    }
    
    const cart = await getOrCreateCart(actualBuyerId, sessionId);
    
    // Check if item already exists in cart
    const existingItem = await prisma.cartItem.findUnique({
      where: { cartId_variantId: { cartId: cart.id, variantId } }
    });
    
    let cartItem;
    if (existingItem) {
      // Update quantity
      const newQuantity = existingItem.quantity + quantity;
      
      if (variant.currentStock < newQuantity) {
        return NextResponse.json(
          { error: `Cannot add ${quantity} more. Only ${variant.currentStock - existingItem.quantity} more available` },
          { status: 400 }
        );
      }
      
      cartItem = await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQuantity, updatedAt: new Date() }
      });
    } else {
      // Create new cart item
      cartItem = await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          variantId,
          quantity
        }
      });
    }
    
    // Return updated cart
    const updatedCart = await getOrCreateCart(actualBuyerId, sessionId);
    
    const transformedCart = transformCartData(updatedCart);
    
    return NextResponse.json({
      message: 'Item added to cart successfully',
      cart: transformedCart
    });
    
  } catch (error) {
    console.error('Error adding to cart:', error);
    return NextResponse.json(
      { error: 'Failed to add item to cart' },
      { status: 500 }
    );
  }
}

// PUT /api/cart - Update cart item quantity
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { cartItemId, quantity, buyerId, userId, sessionId } = body; // Added userId
    
    if (!cartItemId || quantity === undefined) {
      return NextResponse.json(
        { error: 'cartItemId and quantity are required' },
        { status: 400 }
      );
    }
    
    if (quantity < 0) {
      return NextResponse.json(
        { error: 'Quantity cannot be negative' },
        { status: 400 }
      );
    }
    
    // Find cart item and verify ownership
    const cartItem = await prisma.cartItem.findUnique({
      where: { id: cartItemId },
      include: {
        cart: true,
        variant: {
          select: { currentStock: true, isActive: true }
        }
      }
    });
    
    if (!cartItem) {
      return NextResponse.json(
        { error: 'Cart item not found' },
        { status: 404 }
      );
    }
    
    // Verify cart ownership
    let isOwner = false;
    
    if (buyerId) {
      const parsedBuyerId = Number(buyerId);
      if (!isNaN(parsedBuyerId) && cartItem.cart.buyerId === parsedBuyerId) {
        isOwner = true;
      }
    } else if (userId) {
      const parsedUserId = Number(userId);
      if (!isNaN(parsedUserId)) {
        const buyer = await prisma.buyer.findUnique({
          where: { userId: parsedUserId }
        });
        
        if (buyer && cartItem.cart.buyerId === buyer.id) {
          isOwner = true;
        }
      }
    } else if (sessionId && cartItem.cart.sessionId === sessionId) {
      isOwner = true;
    }
    
    if (!isOwner) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    if (quantity === 0) {
      // Remove item from cart
      await prisma.cartItem.delete({
        where: { id: cartItemId }
      });
    } else {
      // Check stock availability
      if (cartItem.variant.currentStock < quantity) {
        return NextResponse.json(
          { error: `Only ${cartItem.variant.currentStock} items available` },
          { status: 400 }
        );
      }
      
      // Update quantity
      await prisma.cartItem.update({
        where: { id: cartItemId },
        data: { quantity, updatedAt: new Date() }
      });
    }
    
    // Return updated cart - need to get the appropriate parameters
    let actualBuyerId: number | undefined;
    
    if (buyerId) {
      actualBuyerId = Number(buyerId);
    } else if (userId) {
      const parsedUserId = Number(userId);
      const buyer = await prisma.buyer.findUnique({
        where: { userId: parsedUserId }
      });
      actualBuyerId = buyer?.id;
    }
    
    const updatedCart = await getOrCreateCart(actualBuyerId, sessionId);
    
    const transformedCart = transformCartData(updatedCart);
    
    return NextResponse.json({
      message: quantity === 0 ? 'Item removed from cart' : 'Cart updated successfully',
      cart: transformedCart
    });
    
  } catch (error) {
    console.error('Error updating cart:', error);
    return NextResponse.json(
      { error: 'Failed to update cart' },
      { status: 500 }
    );
  }
}

// DELETE /api/cart - Clear entire cart or remove specific item
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cartItemId = searchParams.get('cartItemId');
    const buyerId = searchParams.get('buyerId');
    const userId = searchParams.get('userId'); // Added userId
    const sessionId = searchParams.get('sessionId');
    const clearAll = searchParams.get('clearAll') === 'true';
    
    if (!buyerId && !userId && !sessionId) {
      return NextResponse.json(
        { error: 'Either buyerId, userId, or sessionId is required' },
        { status: 400 }
      );
    }
    
    if (clearAll) {
      // Clear entire cart
      let cart;
      
      if (buyerId) {
        cart = await prisma.cart.findFirst({
          where: { buyerId: parseInt(buyerId) }
        });
      } else if (userId) {
        const parsedUserId = Number(userId);
        const buyer = await prisma.buyer.findUnique({
          where: { userId: parsedUserId }
        });
        
        if (buyer) {
          cart = await prisma.cart.findFirst({
            where: { buyerId: buyer.id }
          });
        }
      } else {
        cart = await prisma.cart.findFirst({
          where: { sessionId }
        });
      }
      
      if (cart) {
        await prisma.cartItem.deleteMany({
          where: { cartId: cart.id }
        });
      }
      
      return NextResponse.json({
        message: 'Cart cleared successfully'
      });
    } else if (cartItemId) {
      // Remove specific item
      const cartItem = await prisma.cartItem.findUnique({
        where: { id: parseInt(cartItemId) },
        include: { cart: true }
      });
      
      if (!cartItem) {
        return NextResponse.json(
          { error: 'Cart item not found' },
          { status: 404 }
        );
      }
      
      // Verify ownership
      let isOwner = false;
      
      if (buyerId) {
        const parsedBuyerId = Number(buyerId);
        if (!isNaN(parsedBuyerId) && cartItem.cart.buyerId === parsedBuyerId) {
          isOwner = true;
        }
      } else if (userId) {
        const parsedUserId = Number(userId);
        if (!isNaN(parsedUserId)) {
          const buyer = await prisma.buyer.findUnique({
            where: { userId: parsedUserId }
          });
          
          if (buyer && cartItem.cart.buyerId === buyer.id) {
            isOwner = true;
          }
        }
      } else if (sessionId && cartItem.cart.sessionId === sessionId) {
        isOwner = true;
      }
      
      if (!isOwner) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
      
      await prisma.cartItem.delete({
        where: { id: parseInt(cartItemId) }
      });
      
      // Return updated cart
      let actualBuyerId: number | undefined;
      
      if (buyerId) {
        actualBuyerId = Number(buyerId);
      } else if (userId) {
        const parsedUserId = Number(userId);
        const buyer = await prisma.buyer.findUnique({
          where: { userId: parsedUserId }
        });
        actualBuyerId = buyer?.id;
      }
      
      const updatedCart = await getOrCreateCart(actualBuyerId, sessionId || undefined);
      
      const transformedCart = transformCartData(updatedCart);
      
      return NextResponse.json({
        message: 'Item removed from cart',
        cart: transformedCart
      });
    } else {
      return NextResponse.json(
        { error: 'Either clearAll=true or cartItemId is required' },
        { status: 400 }
      );
    }
    
  } catch (error) {
    console.error('Error deleting from cart:', error);
    return NextResponse.json(
      { error: 'Failed to delete from cart' },
      { status: 500 }
    );
  }
}
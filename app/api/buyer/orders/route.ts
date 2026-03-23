import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import  prisma  from '@/lib/prisma';

// GET /api/buyer/orders - Fetch order history
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Get buyer ID first
    const buyer = await prisma.buyer.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!buyer) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get orders with pagination
    const [orders, totalCount] = await Promise.all([
      prisma.order.findMany({
        where: { buyerId: buyer.id },
        include: {
          variant: {
            include: {
              product: {
                include: {
                  images: {
                    where: { isPrimary: true },
                    take: 1
                  },
                  seller: {
                    select: {
                      name: true
                    }
                  }
                }
              },
              attributes: {
                include: {
                  attribute: true,
                  value: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.order.count({
        where: { buyerId: buyer.id }
      })
    ]);

    const formattedOrders = orders.map((order) => {
      // Extract variant attributes (size, color, etc.)
      const attributes = order.variant?.attributes.reduce((acc, attr) => {
        acc[attr.attribute.name] = attr.value.displayName || attr.value.value;
        return acc;
      }, {} as Record<string, string>) || {};

      return {
        id: order.id,
        date: order.createdAt.toISOString().split('T')[0],
        status: order.status,
        total: order.total,
        quantity: order.quantity,
        product: {
          name: order.variant?.product.name || 'Product',
          image: order.variant?.product.images[0]?.url || 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=100&h=100&fit=crop',
          seller: order.variant?.product.seller.name || 'Seller'
        },
        attributes,
        variant: order.variant ? {
          sku: order.variant.sku,
          attributes
        } : null
      };
    });

    return NextResponse.json({
      orders: formattedOrders,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error('Orders API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/buyer/orders - Create a new order
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      buyerId, 
      variantId, 
      productId, 
      quantity, 
      shippingAddress, 
      paymentMethod = 'PAY_ON_DELIVERY' 
    } = body;

    // Validate required fields
    if (!buyerId || !variantId || !productId || !quantity || !shippingAddress) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate shipping address fields
    if (!shippingAddress.fullName || !shippingAddress.email || 
        !shippingAddress.phone || !shippingAddress.address || 
        !shippingAddress.city || !shippingAddress.state || 
        !shippingAddress.zipCode) {
      return NextResponse.json(
        { error: 'Missing required shipping address fields' },
        { status: 400 }
      );
    }

    // Verify the user making the request matches the buyerId
    const buyer = await prisma.buyer.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!buyer || buyer.id !== buyerId) {
      return NextResponse.json(
        { error: 'Unauthorized to create order for this user' },
        { status: 403 }
      );
    }

    // Get product price from ProductVariant (not variant)
   
const productVariant = await prisma.productVariant.findUnique({
  where: { id: variantId },
  include: {
    product: {
      select: {
        id: true,
        price: true,
        sellerId: true  // Make sure to get sellerId
      }
    }
  }
});

if (!productVariant) {
  return NextResponse.json(
    { error: 'Product variant not found' },
    { status: 404 }
  );
}

// Calculate totals

const sellerId = productVariant.product.sellerId; // Get sellerId here

// Calculate totals - just use price
const price = productVariant!.product.price; // No discountedPrice check
const subtotal = price * quantity;

    if (!productVariant) {
      return NextResponse.json(
        { error: 'Product variant not found' },
        { status: 404 }
      );
    }

    // Check stock availability
    if (productVariant.currentStock < quantity) {
      return NextResponse.json(
        { error: `Insufficient stock. Only ${productVariant.currentStock} available.` },
        { status: 400 }
      );
    }

    // Calculate totals
    //const price = productVariant.product.discountedPrice || productVariant.product.price;
    //const subtotal = price * quantity;
    const tax = subtotal * 0.08; // 8% tax
    const shippingCost = subtotal >= 50 ? 0 : 5.99;
    const total = subtotal + tax + shippingCost;

    // Use Prisma transaction to ensure atomicity
    // Use Prisma transaction to ensure atomicity
const result = await prisma.$transaction(async (tx) => {
  // Create or find shipping address
  let shippingAddressRecord;
  
  // Check if address already exists for this buyer
  const existingAddress = await tx.shippingAddress.findFirst({
    where: {
      buyerId: buyerId,
      street: shippingAddress.address,
      city: shippingAddress.city,
      state: shippingAddress.state,
      zipCode: shippingAddress.zipCode,
      country: shippingAddress.country || 'United States'
    }
  });

  if (existingAddress) {
    // Update existing address with latest info
    shippingAddressRecord = await tx.shippingAddress.update({
      where: { id: existingAddress.id },
      data: {
        fullName: shippingAddress.fullName,
        email: shippingAddress.email,
        phone: shippingAddress.phone
      }
    });
  } else {
    // Create new shipping address
    shippingAddressRecord = await tx.shippingAddress.create({
      data: {
        fullName: shippingAddress.fullName,
        email: shippingAddress.email,
        phone: shippingAddress.phone,
        street: shippingAddress.address,
        city: shippingAddress.city,
        state: shippingAddress.state,
        zipCode: shippingAddress.zipCode,
        country: shippingAddress.country || 'United States',
        buyerId: buyerId
      }
    });
  }

  // Get seller ID from product
  const product = await tx.product.findUnique({
    where: { id: productId },
    select: { sellerId: true }
  });

  if (!product) {
    throw new Error('Product not found');
  }

  const sellerId = product.sellerId;

  // Create order with proper relations
  // In your POST method in /api/buyer/orders/route.ts

// Create order
const order = await tx.order.create({
  data: {
    buyer: {
      connect: { id: buyerId } // Connect buyer relation
    },
    seller: {
      connect: { id: sellerId } // Connect seller relation
    },
    variant: variantId ? {
      connect: { id: variantId }
    } : undefined,
    product: productId ? {
      connect: { id: productId }
    } : undefined,
    shippingAddress: {
      connect: { id: shippingAddressRecord.id }
    },
    quantity,
    subtotal,
    tax,
    shipping: shippingCost,
    total,
    status: 'PENDING',
    paymentMethod,
  },
  include: {
    buyer: true,
    seller: true,
    shippingAddress: true,
    variant: {
      include: {
        product: true
      }
    }
  }
});

  // Update ProductVariant stock
  if (variantId) {
    await tx.productVariant.update({
      where: { id: variantId },
      data: {
        currentStock: {
          decrement: quantity
        },
        soldQuantity: {
          increment: quantity
        }
      }
    });
  }

  return { order, shippingAddress: shippingAddressRecord };
});

    return NextResponse.json(
      { 
        success: true, 
        orderId: result.order.id,
        shippingAddressId: result.shippingAddress.id,
        message: 'Order created successfully' 
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Create order error:', error);
    
    // Handle specific errors
    if (error instanceof Error) {
      if (error.message.includes('Insufficient stock')) {
        return NextResponse.json(
          { error: 'Insufficient stock available' },
          { status: 400 }
        );
      }
      
      // Handle Prisma unique constraint errors
      if (error.message.includes('Unique constraint failed')) {
        return NextResponse.json(
          { error: 'Duplicate entry detected' },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to create order. Please try again.' },
      { status: 500 }
    );
  }
}
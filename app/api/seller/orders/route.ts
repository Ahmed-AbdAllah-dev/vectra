
// app/api/seller/orders/route.ts
import { NextRequest, NextResponse } from 'next/server';
import  prisma  from '@/lib/prisma';
import { verifySeller } from '../middleware';
import { format } from 'date-fns';

interface OrderQueryParams {
  page?: number;
  limit?: number;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export async function GET(request: NextRequest) {
  try {
    // Verify seller
    const auth = await verifySeller(request);
    if (auth.error) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.status || 401 }
      );
    }

    const { sellerId } = auth;

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build where clause
    const where: any = {
      sellerId: sellerId,
    };

    if (status && status !== 'all') {
      where.status = status;
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.createdAt.lte = new Date(dateTo);
      }
    }

    if (search) {
      where.OR = [
        {
          buyer: {
            name: {
              contains: search,
              mode: 'insensitive',
            },
          },
        },
        {
          buyer: {
            email: {
              contains: search,
              mode: 'insensitive',
            },
          },
        },
        {
          product: {
            name: {
              contains: search,
              mode: 'insensitive',
            },
          },
        },
        {
          variant: {
            sku: {
              contains: search,
              mode: 'insensitive',
            },
          },
        },
      ];
    }

    // Get total count for pagination
    const totalCount = await prisma.order.count({ where });

    // Determine order by
    const orderBy: any = {};
    if (sortBy === 'customer') {
      orderBy.buyer = {
        name: sortOrder,
      };
    } else if (sortBy === 'product') {
      orderBy.product = {
        name: sortOrder,
      };
    } else {
      orderBy[sortBy] = sortOrder;
    }

    // Get orders with related data
    const orders = await prisma.order.findMany({
      where,
      include: {
        buyer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            images: {
              take: 1,
              select: {
                url: true,
              },
            },
          },
        },
        variant: {
          select: {
            id: true,
            sku: true,
            images: {
              take: 1,
              select: {
                url: true,
              },
            },
          },
        },
        shippingAddress: {
          select: {
            id: true,
            fullName: true,
            city: true,
            state: true,
            country: true,
            phone: true,
            email: true,
          },
        },
        seller: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    });

    // Transform orders for frontend
    const transformedOrders = orders.map((order) => ({
      id: order.id,
      orderNumber: `ORD-${String(order.id).padStart(6, '0')}`,
      buyer: {
        id: order.buyer.id,
        name: order.buyer.name,
        email: order.buyer.email,
      },
      product: order.product ? {
        id: order.product.id,
        name: order.product.name,
        image: order.product.images[0]?.url,
      } : null,
      variant: order.variant ? {
        id: order.variant.id,
        sku: order.variant.sku,
        image: order.variant.images[0]?.url,
      } : null,
      quantity: order.quantity,
      subtotal: order.subtotal,
      tax: order.tax,
      shipping: order.shipping,
      total: order.total,
      status: order.status,
      paymentMethod: order.paymentMethod,
      shippingAddress: order.shippingAddress,
      seller: order.seller,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      
    }));

    // Get status counts for filters
    const statusCounts = await prisma.order.groupBy({
      by: ['status'],
      where: { sellerId: sellerId },
      _count: true,
    });

    // Calculate summary statistics
    const summary = {
      totalRevenue: await prisma.order.aggregate({
        where: { ...where, status: 'DELIVERED' },
        _sum: { total: true },
      }),
      totalOrders: totalCount,
      pendingOrders: await prisma.order.count({
        where: { ...where, status: 'PENDING' },
      }),
      processingOrders: await prisma.order.count({
        where: { ...where, status: 'PROCESSING' },
      }),
      averageOrderValue: await prisma.order.aggregate({
        where: { ...where, status: 'DELIVERED' },
        _avg: { total: true },
      }),
    };

    return NextResponse.json({
      orders: transformedOrders,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hasMore: page * limit < totalCount,
        limit,
      },
      filters: {
        statusCounts: statusCounts.reduce((acc, item) => {
          acc[item.status] = item._count;
          return acc;
        }, {} as Record<string, number>),
      },
      summary: {
        totalRevenue: summary.totalRevenue._sum.total || 0,
        totalOrders: summary.totalOrders,
        pendingOrders: summary.pendingOrders,
        processingOrders: summary.processingOrders,
        averageOrderValue: summary.averageOrderValue._avg.total || 0,
      },
    });
  } catch (error) {
    console.error('Error fetching seller orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify seller
    const auth = await verifySeller(request);
    if (auth.error) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.status || 401 }
      );
    }

    const { sellerId } = auth;
    const data = await request.json();

    // Validate required fields
    if (!data.buyerId || !data.productId || !data.quantity || !data.total) {
      return NextResponse.json(
        { error: 'Missing required fields: buyerId, productId, quantity, total' },
        { status: 400 }
      );
    }

    // Check if product belongs to seller
    const product = await prisma.product.findFirst({
      where: {
        id: data.productId,
        sellerId: sellerId,
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found or does not belong to you' },
        { status: 404 }
      );
    }

    // Check if variant belongs to product
    if (data.variantId) {
      const variant = await prisma.productVariant.findFirst({
        where: {
          id: data.variantId,
          productId: data.productId,
        },
      });

      if (!variant) {
        return NextResponse.json(
          { error: 'Variant not found for this product' },
          { status: 404 }
        );
      }

      // Check stock availability
      if (variant.currentStock < data.quantity) {
        return NextResponse.json(
          { error: `Insufficient stock. Available: ${variant.currentStock}` },
          { status: 400 }
        );
      }
    }

    // Create order with transaction
    const order = await prisma.$transaction(async (tx) => {
      // Create the order
      const newOrder = await tx.order.create({
        data: {
          buyerId: data.buyerId,
          productId: data.productId,
          variantId: data.variantId,
          sellerId: sellerId!,
          quantity: data.quantity,
          subtotal: data.subtotal || data.total,
          tax: data.tax || 0,
          shipping: data.shipping || 0,
          total: data.total,
          status: data.status || 'PENDING',
          paymentMethod: data.paymentMethod || 'PAY_ON_DELIVERY',
          
          shippingAddressId: data.shippingAddressId,
        },
      });

      // Update variant stock if ordered
      if (data.variantId) {
        await tx.productVariant.update({
          where: { id: data.variantId },
          data: {
            currentStock: {
              decrement: data.quantity,
            },
          },
        });
      }

      return newOrder;
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Order created successfully',
        order: {
          id: order.id,
          orderNumber: `ORD-${String(order.id).padStart(6, '0')}`,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating order:', error);
    
    if (error.code === 'P2003') {
      return NextResponse.json(
        { error: 'Invalid buyer, product, or variant ID' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to create order' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Verify seller
    const auth = await verifySeller(request);
    if (auth.error) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.status || 401 }
      );
    }

    const { sellerId } = auth;
    const data = await request.json();

    if (!data.orderIds || !Array.isArray(data.orderIds)) {
      return NextResponse.json(
        { error: 'Missing or invalid orderIds array' },
        { status: 400 }
      );
    }

    if (!data.status) {
      return NextResponse.json(
        { error: 'Status is required for bulk update' },
        { status: 400 }
      );
    }

    // Valid statuses
    const validStatuses = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
    if (!validStatuses.includes(data.status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    // Update multiple orders
    const updatedOrders = await prisma.$transaction(async (tx) => {
      const updates = data.orderIds.map(async (orderId: number) => {
        // Verify order belongs to seller
        const order = await tx.order.findFirst({
          where: {
            id: orderId,
            sellerId: sellerId,
          },
        });

        if (!order) {
          throw new Error(`Order ${orderId} not found or does not belong to you`);
        }

        // If status is changing to DELIVERED and there's a variant, update sold quantity
        if (data.status === 'DELIVERED' && order.variantId) {
          await tx.productVariant.update({
            where: { id: order.variantId },
            data: {
              soldQuantity: {
                increment: order.quantity,
              },
            },
          });
        }

        // Update order status
        return tx.order.update({
          where: { id: orderId },
          data: { status: data.status },
        });
      });

      return Promise.all(updates);
    });

    return NextResponse.json({
      success: true,
      message: `${updatedOrders.length} order(s) updated successfully`,
      updatedCount: updatedOrders.length,
    });
  } catch (error: any) {
    console.error('Error updating orders:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update orders' },
      { status: 500 }
    );
  }
}


// app/api/seller/orders/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import  prisma  from '@/lib/prisma';
import { verifySeller } from '../../middleware';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const { id } = await params;
    const orderId = parseInt(id);

    if (isNaN(orderId)) {
      return NextResponse.json(
        { error: 'Invalid order ID' },
        { status: 400 }
      );
    }

    // Get order with all details
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        sellerId: sellerId,
      },
      include: {
        buyer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            address: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            price: true,
            category: true,
            description: true,
            images: {
              select: {
                url: true,
                altText: true,
                isPrimary: true,
              },
              orderBy: {
                isPrimary: 'desc',
              },
            },
          },
        },
        variant: {
          select: {
            id: true,
            sku: true,
            currentStock: true,
            attributes: {
              include: {
                attribute: {
                  select: {
                    name: true,
                    displayName: true,
                  },
                },
                value: {
                  select: {
                    value: true,
                    displayName: true,
                    hexColor: true,
                  },
                },
              },
            },
            images: {
              select: {
                url: true,
                altText: true,
                isPrimary: true,
              },
              orderBy: {
                isPrimary: 'desc',
              },
            },
          },
        },
        shippingAddress: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            street: true,
            city: true,
            state: true,
            zipCode: true,
            country: true,
          },
        },
        seller: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            address: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found or you do not have permission' },
        { status: 404 }
      );
    }

    // Calculate additional order details
    const orderDetails = {
      ...order,
      orderNumber: `ORD-${String(order.id).padStart(6, '0')}`,
      variantAttributes: order.variant?.attributes.reduce((acc: any, attr: { attribute: { name: string | number; displayName: any; }; value: { displayName: any; hexColor: any; }; }) => {
        acc[attr.attribute.name] = {
          displayName: attr.attribute.displayName,
          value: attr.value.displayName,
          color: attr.value.hexColor,
        };
        return acc;
      }, {}),
    };

    return NextResponse.json(orderDetails);
  } catch (error) {
    console.error('Error fetching order details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order details' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const { id } = await params;
    const orderId = parseInt(id);
    const data = await request.json();

    if (isNaN(orderId)) {
      return NextResponse.json(
        { error: 'Invalid order ID' },
        { status: 400 }
      );
    }

    // Check if order exists and belongs to seller
    const existingOrder = await prisma.order.findFirst({
      where: {
        id: orderId,
        sellerId: sellerId,
      },
    });

    if (!existingOrder) {
      return NextResponse.json(
        { error: 'Order not found or you do not have permission' },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: any = {};

    if (data.status) {
      const validStatuses = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
      if (!validStatuses.includes(data.status)) {
        return NextResponse.json(
          { error: 'Invalid status' },
          { status: 400 }
        );
      }
      updateData.status = data.status;
    }

    if (data.notes !== undefined) {
      updateData.notes = data.notes;
    }

    if (data.shippingAddressId) {
      updateData.shippingAddressId = data.shippingAddressId;
    }

    if (data.paymentMethod) {
      updateData.paymentMethod = data.paymentMethod;
    }

    // Update order
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: updateData,
    });

    // If status changed to DELIVERED and there's a variant, update sold quantity
    if (data.status === 'DELIVERED' && existingOrder.variantId) {
      await prisma.productVariant.update({
        where: { id: existingOrder.variantId },
        data: {
          soldQuantity: {
            increment: existingOrder.quantity,
          },
        },
      });
    }

    // If status changed to CANCELLED and there's a variant, restore stock
    if (data.status === 'CANCELLED' && existingOrder.variantId && existingOrder.status !== 'CANCELLED') {
      await prisma.productVariant.update({
        where: { id: existingOrder.variantId },
        data: {
          currentStock: {
            increment: existingOrder.quantity,
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Order updated successfully',
      order: updatedOrder,
    });
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    
    // Await params before using it
    const { id } = await params;
    const orderId = parseInt(id);

    if (isNaN(orderId)) {
      return NextResponse.json(
        { error: 'Invalid order ID' },
        { status: 400 }
      );
    }

    // Check if order exists and belongs to seller
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        sellerId: sellerId,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found or you do not have permission to delete it' },
        { status: 404 }
      );
    }

    // Only allow deletion of delivered orders (as per your frontend logic)
    // Or cancelled orders if you want to allow that too
    if (order.status !== 'DELIVERED' && order.status !== 'CANCELLED') {
      return NextResponse.json(
        { 
          error: 'Only delivered or cancelled orders can be deleted',
          allowedStatuses: ['DELIVERED', 'CANCELLED']
        },
        { status: 400 }
      );
    }

    // Delete the order
    await prisma.order.delete({
      where: {
        id: orderId,
        sellerId: sellerId, // Ensure seller owns the order
      },
    });

    return NextResponse.json(
      { message: 'Order deleted successfully' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error deleting order:', error);
    return NextResponse.json(
      { error: 'Failed to delete order' },
      { status: 500 }
    );
  }
}


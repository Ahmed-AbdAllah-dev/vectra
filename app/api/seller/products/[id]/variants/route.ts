
// app/api/seller/products/[id]/variants/route.ts
import { NextRequest, NextResponse } from 'next/server';
import  prisma  from '@/lib/prisma';
import { verifySeller } from '../../../middleware';

// Get all variants for a product
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
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
    const productId = parseInt(params.id);

    if (isNaN(productId)) {
      return NextResponse.json(
        { error: 'Invalid product ID' },
        { status: 400 }
      );
    }

    // Verify product belongs to seller
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        sellerId: sellerId,
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found or you do not have permission' },
        { status: 404 }
      );
    }

    // Get variants with images
    const variants = await prisma.productVariant.findMany({
      where: { productId: productId },
      include: {
        images: {
          orderBy: [
            { isPrimary: 'desc' },
            { sortOrder: 'asc' },
          ],
        },
        attributes: {
          include: {
            attribute: true,
            value: true,
          },
        },
        orders: {
          select: {
            quantity: true,
            total: true,
            createdAt: true,
            status: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return NextResponse.json({ variants });
  } catch (error) {
    console.error('Error fetching variants:', error);
    return NextResponse.json(
      { error: 'Failed to fetch variants' },
      { status: 500 }
    );
  }
}

// Add a new variant to product
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
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
    const productId = parseInt(params.id);
    const data = await request.json();

    if (isNaN(productId)) {
      return NextResponse.json(
        { error: 'Invalid product ID' },
        { status: 400 }
      );
    }

    // Verify product belongs to seller
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        sellerId: sellerId,
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found or you do not have permission' },
        { status: 404 }
      );
    }

    // Validate required fields
    if (!data.sku) {
      return NextResponse.json(
        { error: 'SKU is required' },
        { status: 400 }
      );
    }

    // Check if SKU already exists
    const existingVariant = await prisma.productVariant.findUnique({
      where: { sku: data.sku },
    });

    if (existingVariant) {
      return NextResponse.json(
        { error: 'SKU already exists' },
        { status: 400 }
      );
    }

    // Create variant
    const variant = await prisma.productVariant.create({
      data: {
        sku: data.sku,
        currentStock: data.currentStock || 0,
        weight: data.weight,
        isActive: data.isActive !== false,
        productId: productId,
      },
    });

    // Add images if provided
    if (data.images && data.images.length > 0) {
      await prisma.variantImage.createMany({
        data: data.images.map((image: any, index: number) => ({
          url: image.url,
          altText: image.altText || `${product.name} variant image ${index + 1}`,
          caption: image.caption,
          sortOrder: index,
          isPrimary: index === 0,
          type: image.type || 'gallery',
          variantId: variant.id,
        })),
      });
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Variant created successfully',
        variant,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating variant:', error);
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'SKU already exists' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to create variant' },
      { status: 500 }
    );
  }
}

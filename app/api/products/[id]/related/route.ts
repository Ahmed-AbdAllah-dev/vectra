// app/api/products/[id]/related/route.ts
import  prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const productId = parseInt(params.id, 10);

  if (isNaN(productId)) {
    return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
  }

  try {
    // First get the current product to know its category
    const currentProduct = await prisma.product.findUnique({
      where: { id: productId },
      select: { category: true }
    });

    if (!currentProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Get related products from the same category, excluding current product
    const relatedProducts = await prisma.product.findMany({
      where: {
        category: currentProduct.category,
        id: { not: productId }
      },
      include: {
        images: {
          where: { isPrimary: true },
          take: 1
        },
        reviews: {
          select: { star: true }
        }
      },
      take: 4,
      orderBy: {
        soldQuantity: 'desc' // Order by popularity
      }
    });

    // Transform data to include average rating and review count
    const transformedProducts = relatedProducts.map((product: { id: any; name: any; price: any; category: any; images: string | any[]; reviews: any[]; }) => ({
      id: product.id,
      name: product.name,
      price: product.price,
      category: product.category,
      images: product.images.length > 0 ? product.images : [{ url: '/placeholder-product.jpg', altText: product.name }],
      averageRating: product.reviews.length > 0 
        ? product.reviews.reduce((sum, review) => sum + review.star, 0) / product.reviews.length 
        : 0,
      reviewCount: product.reviews.length
    }));

    return NextResponse.json(transformedProducts);
  } catch (error) {
    console.error('Error fetching related products:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
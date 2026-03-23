// app/api/products/[id]/route.ts
import  prisma  from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';



export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const productId = parseInt(params.id);

    if (isNaN(productId)) {
      return NextResponse.json(
        { error: 'Invalid product ID' },
        { status: 400 }
      );
    }

    // Fetch the product with all related data
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        seller: {
          select: {
            name: true
          }
        },
        reviews: {
          select: {
            id: true,
            star: true,
            content: true,
            createdAt: true,
            buyer: {
              select: {
                name: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        discounts: {
          where: {
            startDate: { lte: new Date() },
            endDate: { gte: new Date() }
          },
          orderBy: {
            percentage: 'desc'
          }
        },
        variants: {
          where: { isActive: true },
          include: {
            orders: {
              where: {
                status: 'DELIVERED'
              },
              select: {
                quantity: true,
                createdAt: true
              }
            },
            images: {
              select: {
                id: true,
                url: true,
                altText: true,
                caption: true,
                isPrimary: true,
                sortOrder: true,
                type: true
              },
              orderBy: [
                { isPrimary: 'desc' },
                { sortOrder: 'asc' }
              ]
            },
            attributes: {
              include: {
                attribute: {
                  select: {
                    name: true,
                    displayName: true,
                    type: true
                  }
                },
                value: {
                  select: {
                    value: true,
                    displayName: true,
                    hexColor: true
                  }
                }
              }
            }
          },
          orderBy: [
            { isActive: 'desc' },
            { currentStock: 'desc' }
          ]
        },
        images: {
          select: {
            id: true,
            url: true,
            altText: true,
            caption: true,
            isPrimary: true,
            sortOrder: true,
            type: true
          },
          orderBy: [
            { isPrimary: 'desc' },
            { sortOrder: 'asc' }
          ]
        }
      }
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Calculate average rating
    const averageRating = product.reviews.length > 0
      ? product.reviews.reduce((sum, review) => sum + review.star, 0) / product.reviews.length
      : 0;

    // Get active discount
    const activeDiscount = product.discounts[0];

    // Transform variants to include structured attributes
    const transformedVariants = product.variants.map(variant => {
      const attributes: Record<string, any> = {};
      
      variant.attributes.forEach(attr => {
        attributes[attr.attribute.name] = {
          value: attr.value.value,
          displayName: attr.value.displayName,
          hexColor: attr.value.hexColor
        };
      });

      return {
        id: variant.id,
        sku: variant.sku,
        currentStock: variant.currentStock,
        soldQuantity: variant.soldQuantity,
        isActive: variant.isActive,
        attributes,
        images: variant.images
      };
    });

    // Get available attributes for filtering
    const availableAttributes: Record<string, any[]> = {};
    
    product.variants.forEach(variant => {
      variant.attributes.forEach(attr => {
        const attrName = attr.attribute.name;
        if (!availableAttributes[attrName]) {
          availableAttributes[attrName] = [];
        }
        
        const existing = availableAttributes[attrName].find(
          item => item.value === attr.value.value
        );
        
        if (!existing) {
          availableAttributes[attrName].push({
            value: attr.value.value,
            displayName: attr.value.displayName,
            hexColor: attr.value.hexColor
          });
        }
      });
    });

    // Find default variant (first available variant or one with highest stock)
    const defaultVariant = transformedVariants.find(v => v.currentStock > 0) || transformedVariants[0];

    // Transform the product data
    const transformedProduct = {
      id: product.id,
      name: product.name,
      price: product.price,
      category: product.category,
      description: product.description,
      averageRating: Number(averageRating.toFixed(1)),
      reviewCount: product.reviews.length,
      
      // Images
      images: product.images,
      
      // Variants
      variants: transformedVariants,
      defaultVariant,
      availableAttributes,
      
      // Reviews
      reviews: product.reviews,
      
      // Discounts
      discounts: product.discounts,
      activeDiscount,
      
      // Meta
      seller: product.seller,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt
    };

    console.log('Returning product:', {
      id: transformedProduct.id,
      variants: transformedProduct.variants.length,
      availableAttributes: Object.keys(transformedProduct.availableAttributes),
      defaultVariant: transformedProduct.defaultVariant?.id
    });

    return NextResponse.json(transformedProduct);

  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}
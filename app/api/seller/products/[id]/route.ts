
// app/api/seller/products/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import  prisma  from '@/lib/prisma';
import { verifySeller } from '../../middleware';


import { put } from '@vercel/blob';

// Vercel Blob upload function
async function uploadImage(file: File): Promise<string> {
  try {
    if (!file || file.size === 0) {
      throw new Error('Empty file provided');
    }

    // Upload to Vercel Blob
    const filename = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
    const blob = await put(filename, file, {
      access: 'public',
    });

    console.log('Image uploaded to Vercel Blob:', blob.url);
    return blob.url;
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
}

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
    const productId = parseInt(id);

    if (isNaN(productId)) {
      return NextResponse.json(
        { error: 'Invalid product ID' },
        { status: 400 }
      );
    }

    // Get product with all details
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        sellerId: sellerId, // Ensure seller owns this product
      },
      include: {
        images: {
          orderBy: [
            { isPrimary: 'desc' },
            { sortOrder: 'asc' },
          ],
        },
        variants: {
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
              where: {
                status: 'DELIVERED',
              },
              select: {
                id: true,
                quantity: true,
                total: true,
                createdAt: true,
              },
              orderBy: {
                createdAt: 'desc',
              },
              take: 10,
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
        discounts: {
          orderBy: {
            startDate: 'desc',
          },
        },
        reviews: {
          include: {
            buyer: {
              select: {
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found or you do not have permission' },
        { status: 404 }
      );
    }

    // Calculate metrics
    let totalStock = 0;
    let totalSold = 0;
    let totalRevenue = 0;
    const monthlySales: Record<string, number> = {};

    product.variants.forEach((variant: any) => {
      totalStock += variant.currentStock;
      totalSold += variant.soldQuantity;

      variant.orders.forEach((order: any) => {
        totalRevenue += order.total || 0;
        
        // Group by month for sales chart
        const month = order.createdAt.toISOString().slice(0, 7); // YYYY-MM
        monthlySales[month] = (monthlySales[month] || 0) + (order.total || 0);
      });
    });

    // Calculate average rating
    const avgRating = product.reviews.length > 0
      ? product.reviews.reduce((sum: number, review: any) => sum + review.star, 0) / product.reviews.length
      : 0;

    // Type assertion to include metrics
    const productWithMetrics = {
      ...product,
      metrics: {
        totalStock,
        totalSold,
        totalRevenue,
        averageRating: Number(avgRating.toFixed(1)),
        reviewCount: product.reviews.length,
        variantCount: product.variants.length,
        activeVariants: product.variants.filter((v: any) => v.isActive).length,
        monthlySales: Object.entries(monthlySales)
          .map(([month, revenue]) => ({ month, revenue }))
          .sort((a, b) => a.month.localeCompare(b.month)),
      },
    };

    return NextResponse.json(productWithMetrics);
  } catch (error) {
    console.error('Error fetching seller product:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}

// Simplified PUT route for updating product
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
    const productId = parseInt(id);
    
    if (isNaN(productId)) {
      return NextResponse.json(
        { error: 'Invalid product ID' },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    
    // Parse basic product info
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const category = formData.get('category') as string;
    const price = formData.get('price') as string;

    // Validate required fields
    if (!name || !category || !price) {
      return NextResponse.json(
        { error: 'Missing required fields: name, category, price' },
        { status: 400 }
      );
    }

    // Check if product exists and belongs to seller
    const existingProduct = await prisma.product.findFirst({
      where: {
        id: productId,
        sellerId: sellerId,
      },
      include: {
        images: true,
        variants: {
          include: {
            images: true,
          },
        },
      },
    });

    if (!existingProduct) {
      return NextResponse.json(
        { error: 'Product not found or you do not have permission' },
        { status: 404 }
      );
    }

    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update product
      const product = await tx.product.update({
        where: { id: productId },
        data: {
          name,
          description: description || '',
          category,
          price: parseFloat(price),
        },
      });

      // Handle product images - SIMPLIFIED
      // Get all product images from form data
      const productImageFiles: File[] = [];
      const productImageMetas: any[] = [];
      
      // Collect all product images and their metadata
      for (const [key, value] of formData.entries()) {
        if (key === 'productImages' && value instanceof File && value.size > 0) {
          productImageFiles.push(value);
        } else if (key.startsWith('productImageMeta_')) {
          try {
            const index = key.replace('productImageMeta_', '');
            const meta = JSON.parse(value as string);
            productImageMetas.push({ ...meta, index });
          } catch (e) {
            console.error('Failed to parse product image metadata:', e);
          }
        }
      }
      
      // Sort metas by index
      productImageMetas.sort((a, b) => parseInt(a.index) - parseInt(b.index));
      
      // Process product images
      const processedProductImageIds = new Set<number>();
      
      // Process existing images (update metadata)
      for (const meta of productImageMetas) {
        if (meta.existingId) {
          await tx.productImage.update({
            where: { id: meta.existingId },
            data: {
              isPrimary: meta.isPrimary || false,
              sortOrder: meta.sortOrder || 0,
            },
          });
          processedProductImageIds.add(meta.existingId);
        }
      }
      
      // Process new images (upload and create)
      for (let i = 0; i < productImageFiles.length; i++) {
        const file = productImageFiles[i];
        const meta = productImageMetas[i] || {};
        
        const imageUrl = await uploadImage(file);
        
        await tx.productImage.create({
          data: {
            url: imageUrl,
            altText: `${name} image`,
            sortOrder: meta.sortOrder || i,
            isPrimary: meta.isPrimary || (i === 0 && productImageMetas.length === 0),
            type: 'gallery',
            productId: product.id,
            width: 800,
            height: 800,
            format: file.type.split('/')[1] || 'jpg',
            fileSize: file.size,
          },
        });
      }
      
      // Delete product images that were removed from the UI
      // (existing images not included in the metadata)
      const existingImageIds = existingProduct.images.map(img => img.id);
      const imagesToDelete = existingImageIds.filter(id => !processedProductImageIds.has(id));
      
      if (imagesToDelete.length > 0) {
        await tx.productImage.deleteMany({
          where: {
            id: {
              in: imagesToDelete,
            },
          },
        });
      }

      // Handle variants
      const variantsDataStr = formData.get('variants') as string;
      if (variantsDataStr) {
        const variantsData = JSON.parse(variantsDataStr);
        
        // Get existing variant IDs to track what to delete
        const existingVariants = await tx.productVariant.findMany({
          where: { productId: productId },
          select: { id: true },
        });
        
        const processedVariantIds = new Set<number>();
        
        for (const variantData of variantsData) {
          if (variantData.id) {
            // Update existing variant
            const variant = await tx.productVariant.update({
              where: { id: variantData.id },
              data: {
                sku: variantData.sku,
                currentStock: variantData.currentStock || 0,
               
                isActive: variantData.isActive !== false,
              },
            });
            
            processedVariantIds.add(variant.id);
            
            // Handle variant attributes
            if (variantData.attributes && variantData.attributes.length > 0) {
              // Delete existing attributes
              await tx.variantAttribute.deleteMany({
                where: { variantId: variant.id },
              });
              
              // Create new attributes
              for (const attr of variantData.attributes) {
                await tx.variantAttribute.create({
                  data: {
                    variantId: variant.id,
                    attributeId: attr.attributeId,
                    valueId: attr.valueId,
                  },
                });
              }
            }
          } else {
            // Create new variant
            const variant = await tx.productVariant.create({
              data: {
                sku: variantData.sku,
                currentStock: variantData.currentStock || 0,
                
                isActive: variantData.isActive !== false,
                productId: product.id,
              },
            });
            
            processedVariantIds.add(variant.id);
            
            // Create variant attributes
            if (variantData.attributes && variantData.attributes.length > 0) {
              for (const attr of variantData.attributes) {
                await tx.variantAttribute.create({
                  data: {
                    variantId: variant.id,
                    attributeId: attr.attributeId,
                    valueId: attr.valueId,
                  },
                });
              }
            }
          }
        }
        
        // Delete variants that were removed
        const existingVariantIds = existingVariants.map(v => v.id);
        const variantsToDelete = existingVariantIds.filter(id => !processedVariantIds.has(id));
        
        if (variantsToDelete.length > 0) {
          await tx.productVariant.deleteMany({
            where: {
              id: {
                in: variantsToDelete,
              },
            },
          });
        }
      }

      return product;
    });

    return NextResponse.json({
      success: true,
      message: 'Product updated successfully',
      productId: result.id,
    });
  } catch (error: any) {
    console.error('Error updating product:', error);
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'SKU already exists' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to update product' },
      { status: 500 }
    );
  }
}
// app/api/seller/products/[id]/route.ts - UPDATE DELETE METHOD
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
    const { id } = await params;
    const productId = parseInt(id);

    if (isNaN(productId)) {
      return NextResponse.json(
        { error: 'Invalid product ID' },
        { status: 400 }
      );
    }

    // Check if product exists and belongs to seller
    const existingProduct = await prisma.product.findFirst({
      where: {
        id: productId,
        sellerId: sellerId,
      },
    });

    if (!existingProduct) {
      return NextResponse.json(
        { error: 'Product not found or you do not have permission' },
        { status: 404 }
      );
    }

    // Delete product (cascade will delete related records)
    await prisma.product.delete({
      where: { id: productId },
    });

    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    );
  }
}
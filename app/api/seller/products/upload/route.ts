// app/api/seller/products/[id]/route.ts - COMPLETE WORKING VERSION
import { NextRequest, NextResponse } from 'next/server';
import  prisma  from '@/lib/prisma';
import { verifySeller } from '../../middleware';
import fs from 'fs';
import path from 'path';

// Upload image function
async function uploadImage(file: File): Promise<string> {
  try {
    console.log('Uploading image:', file.name, file.type, file.size);
    
    if (!file || file.size === 0) {
      throw new Error('Empty file provided');
    }

    // Convert to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate unique filename
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const extension = file.name.split('.').pop() || file.type.split('/')[1] || 'jpg';
    const filename = `${timestamp}-${randomStr}.${extension}`;

    // Save to public/uploads directory
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filepath = path.join(uploadDir, filename);
    
    // Write file
    await fs.promises.writeFile(filepath, buffer);
    console.log('File saved to:', filepath);

    // Construct public URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const imageUrl = `/uploads/${filename}`;
    
    console.log('Image URL:', imageUrl);
    return imageUrl;
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
        sellerId: sellerId,
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
        const month = order.createdAt.toISOString().slice(0, 7);
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
    
    // Log form data keys for debugging
    console.log('PUT Form data keys:', Array.from(formData.keys()));
    
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
        images: true
      }
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

      // ====== Handle product images ======
      const productImageFiles: File[] = [];
      let i = 0;
      
      // Get all product image files
      while (true) {
        const file = formData.get(`productImages[${i}]`) as File || 
                    formData.get(`productImages_${i}`) as File ||
                    formData.get('productImages') as File;
        
        if (!file || typeof file === 'string') {
          break;
        }
        
        productImageFiles.push(file);
        i++;
      }
      
      console.log('PUT: Found product images:', productImageFiles.length);
      
      // If we have new images, replace the old ones
      if (productImageFiles.length > 0) {
        console.log('Deleting existing images and uploading new ones');
        
        // Delete existing images
        await tx.productImage.deleteMany({
          where: { productId: productId }
        });
        
        // Upload and create new images
        for (let i = 0; i < productImageFiles.length; i++) {
          const file = productImageFiles[i];
          
          if (!file || file.size === 0) {
            console.log(`Skipping empty file at index ${i}`);
            continue;
          }
          
          console.log(`Processing new product image ${i + 1}`);
          
          try {
            // Get metadata
            let isPrimary = i === 0;
            let sortOrder = i;
            
            // Try to get metadata from form data
            const metaKeys = [
              `productImageMeta_${i}`,
              `productImageMeta[${i}]`,
              'productImageMeta'
            ];
            
            let metaStr = '';
            for (const key of metaKeys) {
              const value = formData.get(key);
              if (value && typeof value === 'string') {
                metaStr = value;
                break;
              }
            }
            
            if (metaStr) {
              try {
                const meta = JSON.parse(metaStr);
                isPrimary = meta.isPrimary || isPrimary;
                sortOrder = meta.sortOrder || sortOrder;
                console.log(`Parsed metadata for image ${i}:`, meta);
              } catch (metaError) {
                console.error(`Failed to parse metadata:`, metaError);
              }
            }
            
            // Upload image
            const imageUrl = await uploadImage(file);
            console.log(`Image uploaded successfully: ${imageUrl}`);
            
            // Create product image record
            await tx.productImage.create({
              data: {
                url: imageUrl,
                altText: `${name} image ${i + 1}`,
                sortOrder: sortOrder,
                isPrimary: isPrimary,
                type: 'gallery',
                width: 800,
                height: 800,
                format: file.type.split('/')[1] || 'jpg',
                fileSize: file.size,
                productId: product.id,
              },
            });
            
            console.log(`New product image ${i + 1} saved to database`);
            
          } catch (imageError) {
            console.error(`Failed to process product image ${i}:`, imageError);
          }
        }
      } else {
        console.log('No new product images uploaded, keeping existing ones');
      }
      // ====== END product images ======

      // Handle variants
      const variantsDataStr = formData.get('variants') as string;
      if (variantsDataStr) {
        try {
          const variantsData = JSON.parse(variantsDataStr);
          console.log('PUT: Parsed variants data:', variantsData.length, 'variants');
          
          // Delete existing variants and attributes
          await tx.variantAttribute.deleteMany({
            where: {
              variant: {
                productId: productId
              }
            }
          });
          
          await tx.variantImage.deleteMany({
            where: {
              variant: {
                productId: productId
              }
            }
          });
          
          await tx.productVariant.deleteMany({
            where: { productId: productId }
          });
          
          // Create new variants
          for (const variantData of variantsData) {
            // Create variant
            const variant = await tx.productVariant.create({
              data: {
                sku: variantData.sku || `SKU-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                currentStock: variantData.currentStock || 0,
                isActive: variantData.isActive !== false,
                productId: product.id,
              },
            });

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
        } catch (e) {
          console.error('Failed to process variants data:', e);
        }
      }

      // Verify images were saved
      const productWithImages = await tx.product.findUnique({
        where: { id: product.id },
        include: { images: true }
      });
      
      console.log('PUT Product verification - Images saved:', productWithImages?.images?.length || 0);

      return product;
    });

    return NextResponse.json({
      success: true,
      message: 'Product updated successfully',
      productId: result.id,
    });
  } catch (error: any) {
    console.error('Error updating product:', error);
    console.error('Error stack:', error.stack);
    
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
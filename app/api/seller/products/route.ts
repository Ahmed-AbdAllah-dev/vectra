// app/api/seller/products/route.ts - FIXED VERSION
import { NextRequest, NextResponse } from 'next/server';
import  prisma  from '@/lib/prisma';
import { verifySeller } from '../middleware';
import fs from 'fs';
import path from 'path';

// Upload image function
async function uploadImage(file: File): Promise<string> {
  try {
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

    // Return relative URL
    return `/uploads/${filename}`;
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  console.log('Starting product creation...');
  
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
    
    const formData = await request.formData();
    
    // Parse basic product info
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const category = formData.get('category') as string;
    const basePrice = formData.get('basePrice') as string;
    const productType = formData.get('productType') as 'simple' | 'variable';
    const simpleStock = formData.get('simpleProductStock') as string;
    
    // Validate required fields
    if (!name || !category || !basePrice) {
      return NextResponse.json(
        { error: 'Missing required fields: name, category, basePrice' },
        { status: 400 }
      );
    }

    // Parse variants data
    const variantsDataStr = formData.get('variants') as string;
    let variantsData = [];
    if (variantsDataStr) {
      try {
        variantsData = JSON.parse(variantsDataStr);
      } catch (e) {
        console.error('Failed to parse variants data:', e);
      }
    }

    // ========================================================
    // FIX: PRE-PROCESS VARIANT IMAGES FROM FORM DATA
    // ========================================================
    const variantFilesMap = new Map<string, File[]>();

    // Iterate over all formData entries to find variant images
    // Keys look like: variantImages_temp-123
    for (const [key, value] of formData.entries()) {
      if (value instanceof File && key.startsWith('variantImages_')) {
        // Extract tempId: 'variantImages_temp-123' -> 'temp-123'
        const tempId = key.replace('variantImages_', '');
        
        if (!variantFilesMap.has(tempId)) {
          variantFilesMap.set(tempId, []);
        }
        variantFilesMap.get(tempId)!.push(value);
      }
    }
    // ========================================================

    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create base product
      const product = await tx.product.create({
        data: {
          name,
          description: description || '',
          category,
          price: parseFloat(basePrice),
          sellerId: sellerId!,
        },
      });

      console.log('Product created with ID:', product.id);

      // Handle product images upload
      const productImages = [];
      
      for (const [key, value] of formData.entries()) {
        if (key.startsWith('productImages') && value instanceof File && value.size > 0) {
          productImages.push(value);
        }
      }
      
      console.log('Found product images:', productImages.length);
      
      for (let i = 0; i < productImages.length; i++) {
        const file = productImages[i];
        
        try {
          const imageUrl = await uploadImage(file);
          
          let isPrimary = i === 0;
          let sortOrder = i;
          
          const metaKeys = [`productImageMeta_${i}`, `productImageMeta[${i}]`, 'productImageMeta'];
          
          for (const metaKey of metaKeys) {
            const metaValue = formData.get(metaKey);
            if (metaValue && typeof metaValue === 'string') {
              try {
                const meta = JSON.parse(metaValue);
                if (Array.isArray(meta)) {
                  if (meta[i]) {
                    isPrimary = meta[i].isPrimary || isPrimary;
                    sortOrder = meta[i].sortOrder || sortOrder;
                  }
                } else {
                  isPrimary = meta.isPrimary || isPrimary;
                  sortOrder = meta.sortOrder || sortOrder;
                }
                break;
              } catch (e) {
                // Ignore parse errors
              }
            }
          }
          
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
          
          console.log(`Product image ${i + 1} saved to database`);
          
        } catch (imageError) {
          console.error(`Failed to process product image ${i}:`, imageError);
        }
      }

      // Handle variants for variable products
      if (productType === 'variable' && variantsData.length > 0) {
        for (const variantData of variantsData) {
          console.log(`Processing variant: ${variantData.tempId}`);
          
          // Create variant
          const variant = await tx.productVariant.create({
            data: {
              sku: variantData.sku || `SKU-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              currentStock: variantData.currentStock || 0,
              weight: variantData.weight,
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

          // ========================================================
          // FIX: HANDLE VARIANT IMAGES
          // ========================================================
          // Retrieve the files mapped to this variant's tempId
          const variantFiles = variantFilesMap.get(variantData.tempId) || [];

          for (let i = 0; i < variantFiles.length; i++) {
            const file = variantFiles[i];

            if (!file || file.size === 0) continue;

            try {
              console.log(`Uploading image for variant ${variantData.tempId}, index ${i}`);
              
              // Upload file
              const imageUrl = await uploadImage(file);
              
              // Get Metadata
              // Keys look like: variantImageMeta_temp-123_0
              const metaKey = `variantImageMeta_${variantData.tempId}_${i}`;
              const metaStr = formData.get(metaKey) as string;
              
              let isPrimary = i === 0;
              let sortOrder = i;

              if (metaStr) {
                try {
                  const meta = JSON.parse(metaStr);
                  isPrimary = meta.isPrimary || isPrimary;
                  sortOrder = meta.sortOrder || sortOrder;
                } catch (e) {
                  console.error(`Failed to parse variant meta:`, e);
                }
              }

              // Create VariantImage record
              await tx.variantImage.create({
                data: {
                  variantId: variant.id,
                  url: imageUrl,
                  altText: `${name} variant ${variantData.sku}`,
                  caption: `Variant ${i + 1}`,
                  sortOrder: sortOrder,
                  isPrimary: isPrimary,
                  type: 'gallery',
                  width: 800,
                  height: 800,
                  format: file.type.split('/')[1] || 'jpg',
                  fileSize: file.size,
                },
              });

              console.log(`Variant image ${i + 1} saved to database`);
            } catch (imageError) {
              console.error(`Failed to process variant image ${i}:`, imageError);
            }
          }
          // ========================================================

        }
      } else {
        // For simple products, create a default variant
        const defaultVariant = await tx.productVariant.create({
          data: {
            sku: `SKU-${Date.now()}-SIMPLE`,
            currentStock: parseInt(simpleStock || '0'),
            isActive: true,
            productId: product.id,
          },
        });
      }

      return product;
    });

    console.log('Product creation transaction completed successfully');
    
    return NextResponse.json(
      {
        success: true,
        message: 'Product created successfully',
        productId: result.id,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating product:', error);
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'SKU already exists' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to create product' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  // ... (Keep existing GET logic as is) ...
  try {
    const auth = await verifySeller(request);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status || 401 });
    }

    const { sellerId } = auth;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    const where: any = { sellerId: sellerId };

    if (category && category !== 'all') {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    const totalCount = await prisma.product.count({ where });

    const products = await prisma.product.findMany({
      where,
      include: {
        reviews: { select: { star: true } },
        variants: {
          select: { id: true, currentStock: true, soldQuantity: true, isActive: true },
        },
        images: {
          select: { id: true, url: true, isPrimary: true },
          orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }],
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const productsWithMetrics = products.map((product) => {
      let totalStock = 0;
      let totalSold = 0;
      let activeVariants = 0;

      product.variants.forEach((variant: any) => {
        totalStock += variant.currentStock;
        totalSold += variant.soldQuantity || 0;
        activeVariants += variant.isActive ? 1 : 0;
      });

      const avgRating = product.reviews.length > 0
        ? product.reviews.reduce((sum: number, review: any) => sum + review.star, 0) / product.reviews.length
        : 0;

      let status: 'in_stock' | 'out_of_stock' | 'low_stock' = 'out_of_stock';
      if (totalStock > 10) status = 'in_stock';
      else if (totalStock > 0) status = 'low_stock';

      return {
        id: product.id,
        name: product.name,
        price: product.price,
        category: product.category,
        description: product.description,
        image: product.images.length > 0 ? product.images[0].url : null,
        stock: totalStock,
        sold: totalSold,
        revenue: 0,
        activeVariants,
        totalVariants: product.variants.length,
        averageRating: Number(avgRating.toFixed(1)),
        reviewCount: product.reviews.length,
        discount: null,
        status,
        createdAt: product.createdAt.toISOString(),
        updatedAt: product.updatedAt.toISOString(),
      };
    });

    const categories = await prisma.product.findMany({
      where: { sellerId: sellerId },
      select: { category: true },
      distinct: ['category'],
    });

    return NextResponse.json({
      success: true,
      products: productsWithMetrics,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hasMore: page * limit < totalCount,
      },
      filters: {
        categories: categories.map((c) => c.category).filter(Boolean),
      },
      stats: {
        totalProducts: totalCount,
        totalStock: productsWithMetrics.reduce((sum, p) => sum + p.stock, 0),
        totalRevenue: productsWithMetrics.reduce((sum, p) => sum + p.revenue, 0),
        outOfStock: productsWithMetrics.filter(p => p.stock === 0).length
      }
    });
  } catch (error) {
    console.error('Error fetching seller products:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch products',
        products: [],
        pagination: { currentPage: 1, totalPages: 0, totalCount: 0, hasMore: false },
        filters: { categories: [] },
        stats: { totalProducts: 0, totalStock: 0, totalRevenue: 0, outOfStock: 0 }
      },
      { status: 500 }
    );
  }
}

export const config = {
  api: { bodyParser: false },
};
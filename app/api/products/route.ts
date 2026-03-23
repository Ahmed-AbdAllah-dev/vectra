// app/api/products/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { ensurePrismaConnection } from '@/utils/prisma-connection';
import  prisma  from '@/lib/prisma';

// Define types for better type safety
type ProductWithRelations = {
  id: number;
  name: string;
  price: number;
  category: string;
  description: string;
  createdAt: Date;
  
  seller: { name: string };
  reviews: { star: number }[];
  discounts: { percentage: number; startDate: Date; endDate: Date }[];
  variants: {
    id: number;
    sku: string;
    currentStock: number;
    soldQuantity: number;
    isActive: boolean;
    orders: { quantity: number; createdAt: Date }[];
    images: {
      id: number;
      url: string;
      altText: string | null;
      isPrimary: boolean;
      sortOrder: number;
    }[];
    attributes: {
      attribute: { name: string; displayName: string };
      value: { value: string; displayName: string; hexColor?: string | null };
    }[];
  }[];
  images: {
    id: number;
    url: string;
    altText: string | null;
    isPrimary: boolean;
    sortOrder: number;
  }[];
};

type SalesMetrics = {
  thisMonth: number;
  past3Months: number;
  past6Months: number;
  thisYear: number;
  allTime: number;
};

type ProductWithMetrics = ProductWithRelations & {
  salesMetrics: SalesMetrics;
  totalStock: number;
  totalSoldQuantity: number;
  availableVariants: number;
};

export async function GET(request: NextRequest) {
  try {
    const prisma = await ensurePrismaConnection();
    await prisma.$connect();
    
    console.log('Prisma connected successfully');
    
    
   
    const { searchParams } = new URL(request.url);
    
    // Filter parameters
    const category = searchParams.get('category');
    const newArrival = searchParams.get('newArrival');
    const bestSeller = searchParams.get('bestSeller');
    const discount = searchParams.get('discount');
    const color = searchParams.get('color');
    const size = searchParams.get('size');
    const material = searchParams.get('material');
    const inStock = searchParams.get('inStock');
    const sortBy = searchParams.get('sortBy') || 'default';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '21');

    // Build where clause
    const where: any = {};

    // Category filter
    if (category && category !== '') {
      where.category = category;
    }

    // New arrival filter
    if (newArrival && newArrival !== '') {
      const now = new Date();
      let daysBack = 30;

      switch (newArrival) {
        case 'This Week':
          daysBack = 7;
          break;
        case 'This Month':
        case 'Last 30 Days':
          daysBack = 30;
          break;
        case 'Last 90 Days':
          daysBack = 90;
          break;
      }

      const cutoffDate = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000));
      where.createdAt = {
        gte: cutoffDate
      };
    }

    // Discount filter - only include products with active discounts
    if (discount && discount !== '') {
      const requiredDiscount = parseInt(discount.match(/\d+/)?.[0] || '0');
      const now = new Date();
      
      where.discounts = {
        some: {
          percentage: {
            gte: requiredDiscount
          },
          startDate: {
            lte: now
          },
          endDate: {
            gte: now
          }
        }
      };
    }

    // Variant-based filters
    const variantFilters: any = {
      isActive: true
    };

    // Color filter
    if (color && color !== '') {
      variantFilters.attributes = {
        some: {
          attribute: { name: 'color' },
          value: { value: color.toLowerCase() }
        }
      };
    }

    // Size filter
    if (size && size !== '') {
      const sizeFilter = {
        some: {
          attribute: { name: 'size' },
          value: { value: size.toLowerCase() }
        }
      };
      
      if (variantFilters.attributes) {
        // If color filter exists, combine with AND logic
        variantFilters.AND = [
          { attributes: variantFilters.attributes },
          { attributes: sizeFilter }
        ];
        delete variantFilters.attributes;
      } else {
        variantFilters.attributes = sizeFilter;
      }
    }

    // Material filter
    if (material && material !== '') {
      const materialFilter = {
        some: {
          attribute: { name: 'material' },
          value: { value: material.toLowerCase() }
        }
      };
      
      if (variantFilters.AND) {
        variantFilters.AND.push({ attributes: materialFilter });
      } else if (variantFilters.attributes) {
        variantFilters.AND = [
          { attributes: variantFilters.attributes },
          { attributes: materialFilter }
        ];
        delete variantFilters.attributes;
      } else {
        variantFilters.attributes = materialFilter;
      }
    }

    // In stock filter
    if (inStock === 'true') {
      variantFilters.currentStock = { gt: 0 };
    }

    // Add variant filters to main where clause
    if (Object.keys(variantFilters).length > 1) { // More than just isActive
      where.variants = {
        some: variantFilters
      };
    }

    let bestSellerFilter = bestSeller;

    // Get total count for pagination
    const totalCount = await prisma.product.count({ where });

    // Get products with all related data including variants
    const products = await prisma.product.findMany({
      where,
      include: {
        seller: {
          select: {
            name: true
          }
        },
        reviews: {
          select: {
            star: true
          }
        },
        discounts: {
          where: {
            startDate: { lte: new Date() },
            endDate: { gte: new Date() }
          },
          orderBy: {
            percentage: 'desc'
          },
          take: 1
        },
        variants: {
          where: variantFilters,
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
                isPrimary: true,
                sortOrder: true
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
                    displayName: true
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
          }
        },
        images: {
          select: {
            id: true,
            url: true,
            altText: true,
            isPrimary: true,
            sortOrder: true
          },
          orderBy: [
            { isPrimary: 'desc' },
            { sortOrder: 'asc' }
          ]
        }
      }
    }) as ProductWithRelations[];

    // Calculate metrics for each product based on all variants
    const productsWithMetrics: ProductWithMetrics[] = products.map((product) => {
      const now = new Date();
      
      // Aggregate data from all variants
      let totalStock = 0;
      let totalSoldQuantity = 0;
      const availableVariants = product.variants.filter(v => v.isActive).length;
      
      const salesMetrics: SalesMetrics = {
        thisMonth: 0,
        past3Months: 0,
        past6Months: 0,
        thisYear: 0,
        allTime: 0
      };

      product.variants.forEach((variant) => {
        totalStock += variant.currentStock;
        totalSoldQuantity += variant.soldQuantity;

        variant.orders.forEach((order) => {
          const orderDate = new Date(order.createdAt);
          const daysDiff = Math.floor((now.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24));
          
          salesMetrics.allTime += order.quantity;
          
          if (daysDiff <= 30) {
            salesMetrics.thisMonth += order.quantity;
          }
          if (daysDiff <= 90) {
            salesMetrics.past3Months += order.quantity;
          }
          if (daysDiff <= 180) {
            salesMetrics.past6Months += order.quantity;
          }
          if (daysDiff <= 365) {
            salesMetrics.thisYear += order.quantity;
          }
        });
      });

      return {
        ...product,
        salesMetrics,
        totalStock,
        totalSoldQuantity,
        availableVariants
      };
    });

    // Apply best seller filter if specified
    let filteredProducts = productsWithMetrics;
    if (bestSellerFilter && bestSellerFilter !== '') {
      const salesValues = productsWithMetrics.map((product) => {
        switch (bestSellerFilter) {
          case 'This Month':
            return product.salesMetrics.thisMonth;
          case 'Past 3 Months':
            return product.salesMetrics.past3Months;
          case 'Past 6 Months':
            return product.salesMetrics.past6Months;
          case 'This Year':
            return product.salesMetrics.thisYear;
          case 'All Time':
            return product.salesMetrics.allTime;
          default:
            return product.salesMetrics.allTime;
        }
      }).sort((a, b) => b - a);

      const top20PercentIndex = Math.floor(salesValues.length * 0.2);
      const threshold = salesValues[Math.max(0, top20PercentIndex - 1)] || 0;

      filteredProducts = productsWithMetrics.filter((product) => {
        const salesValue = (() => {
          switch (bestSellerFilter) {
            case 'This Month':
              return product.salesMetrics.thisMonth;
            case 'Past 3 Months':
              return product.salesMetrics.past3Months;
            case 'Past 6 Months':
              return product.salesMetrics.past6Months;
            case 'This Year':
              return product.salesMetrics.thisYear;
            case 'All Time':
              return product.salesMetrics.allTime;
            default:
              return product.salesMetrics.allTime;
          }
        })();
        
        return salesValue >= threshold && salesValue > 0;
      });
    }

    // Apply sorting
    const sortedProducts = (() => {
      const sorted = [...filteredProducts];
      
      switch (sortBy) {
        case 'price-low':
          return sorted.sort((a, b) => a.price - b.price);
        case 'price-high':
          return sorted.sort((a, b) => b.price - a.price);
        case 'newest':
          return sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        case 'best-seller':
          return sorted.sort((a, b) => b.salesMetrics.allTime - a.salesMetrics.allTime);
        case 'name':
          return sorted.sort((a, b) => a.name.localeCompare(b.name));
        case 'stock':
          return sorted.sort((a, b) => b.totalStock - a.totalStock);
        default:
          return sorted.sort((a, b) => a.id - b.id);
      }
    })();

    // Apply pagination
    const paginatedProducts = sortedProducts.slice((page - 1) * limit, page * limit);

    // Transform data to match frontend interface
    const transformedProducts = paginatedProducts.map(product => {
      // Calculate average rating
      const avgRating = product.reviews.length > 0
        ? product.reviews.reduce((sum, review) => sum + review.star, 0) / product.reviews.length
        : 0;

      // Get active discount
      const activeDiscount = product.discounts[0];

      // Calculate days since creation
      const daysSinceCreated = Math.floor(
        (new Date().getTime() - new Date(product.createdAt).getTime()) / (1000 * 60 * 60 * 24)
      );

      // Determine if it's a best seller
      const isBestSeller = product.salesMetrics.thisMonth > 0 || 
                          product.salesMetrics.past3Months > 0 ||
                          product.salesMetrics.allTime > 0;

      // Get the main product image
      let mainImage = null;
      
      // First try to get a variant image (more specific)
      if (product.variants.length > 0) {
        for (const variant of product.variants) {
          if (variant.images.length > 0) {
            mainImage = variant.images.find(img => img.isPrimary) || variant.images[0];
            break;
          }
        }
      }
      
      // Fallback to product-level image
      if (!mainImage && product.images.length > 0) {
        mainImage = product.images.find(img => img.isPrimary) || product.images[0];
      }
      
      // Ultimate fallback to placeholder
      if (!mainImage) {
        mainImage = {
          url: `https://picsum.photos/400/400?random=${product.id}`,
          altText: `${product.name} placeholder image`
        };
      }

      // Get available colors, sizes, materials from variants
      const availableColors = Array.from(new Set(
        product.variants.flatMap(v => 
          v.attributes
            .filter(a => a.attribute.name === 'color')
            .map(a => ({
              value: a.value.value,
              displayName: a.value.displayName,
              hexColor: a.value.hexColor
            }))
        )
      ));

      const availableSizes = Array.from(new Set(
        product.variants.flatMap(v => 
          v.attributes
            .filter(a => a.attribute.name === 'size')
            .map(a => ({
              value: a.value.value,
              displayName: a.value.displayName
            }))
        )
      ));

      const availableMaterials = Array.from(new Set(
        product.variants.flatMap(v => 
          v.attributes
            .filter(a => a.attribute.name === 'material')
            .map(a => ({
              value: a.value.value,
              displayName: a.value.displayName
            }))
        )
      ));

      return {
        id: product.id,
        name: product.name,
        price: product.price,
        rating: Number(avgRating.toFixed(1)),
        reviews: product.reviews.length,
        image: mainImage.url,
        imageAlt: mainImage.altText || `${product.name} product image`,
        category: product.category,
        description: product.description,
        currentStock: product.totalStock,
        soldQuantity: product.totalSoldQuantity,
        sellerName: product.seller.name,
        isNewArrival: daysSinceCreated <= 7,
        isBestSeller: isBestSeller,
        discountPercentage: activeDiscount ? activeDiscount.percentage : null,
        dateAdded: product.createdAt,
        salesRank: product.salesMetrics.allTime,
        
        // Variant-specific data
        availableVariants: product.availableVariants,
        variantCount: product.variants.length,
        availableColors,
        availableSizes,
        availableMaterials,
        
        // Additional variant info for frontend
        variants: product.variants.map(variant => ({
          id: variant.id,
          sku: variant.sku,
          stock: variant.currentStock,
          isActive: variant.isActive,
          attributes: variant.attributes.reduce((acc, attr) => {
            acc[attr.attribute.name] = {
              value: attr.value.value,
              displayName: attr.value.displayName,
              hexColor: attr.value.hexColor
            };
            return acc;
          }, {} as Record<string, any>)
        }))
      };
    });

    // Get filter options from all products (for filter UI)
    const allProducts = await prisma.product.findMany({
      include: {
        variants: {
          where: { isActive: true },
          include: {
            attributes: {
              include: {
                attribute: true,
                value: true
              }
            }
          }
        },
        discounts: {
          where: {
            startDate: { lte: new Date() },
            endDate: { gte: new Date() }
          }
        }
      }
    });

    // Extract filter options
    const filterOptions = {
      categories: Array.from(new Set(allProducts.map((p: { category: any; }) => p.category))).sort(),
      colors: Array.from(new Set(
        allProducts.flatMap((p: { variants: any[]; }) => 
          p.variants.flatMap((v: { attributes: any[]; }) => 
            v.attributes
              .filter((a: { attribute: { name: string; }; }) => a.attribute.name === 'color')
              .map((a: { value: { value: any; displayName: any; hexColor: any; }; }) => ({
                value: a.value.value,
                displayName: a.value.displayName,
                hexColor: a.value.hexColor
              }))
          )
        )
      )),
      sizes: Array.from(new Set(
        allProducts.flatMap((p: { variants: any[]; }) => 
          p.variants.flatMap((v: { attributes: any[]; }) => 
            v.attributes
              .filter((a: { attribute: { name: string; }; }) => a.attribute.name === 'size')
              .map((a: { value: { value: any; displayName: any; }; }) => ({
                value: a.value.value,
                displayName: a.value.displayName
              }))
          )
        )
      )),
      materials: Array.from(new Set(
        allProducts.flatMap((p: { variants: any[]; }) => 
          p.variants.flatMap((v: { attributes: any[]; }) => 
            v.attributes
              .filter((a: { attribute: { name: string; }; }) => a.attribute.name === 'material')
              .map((a: { value: { value: any; displayName: any; }; }) => ({
                value: a.value.value,
                displayName: a.value.displayName
              }))
          )
        )
      )),
      priceRange: {
        min: Math.min(...allProducts.map((p: { price: any; }) => p.price)),
        max: Math.max(...allProducts.map((p: { price: any; }) => p.price))
      }
    };

    // Calculate filter statistics
    const filterStats = {
      totalProducts: allProducts.length,
      filteredCount: transformedProducts.length,
      filteredOut: allProducts.length - transformedProducts.length,
      categoryDistribution: transformedProducts.reduce((acc: Record<string, number>, product) => {
        acc[product.category] = (acc[product.category] || 0) + 1;
        return acc;
      }, {}),
      priceRange: transformedProducts.length > 0 ? {
        min: Math.min(...transformedProducts.map(p => p.price)),
        max: Math.max(...transformedProducts.map(p => p.price)),
        average: transformedProducts.reduce((sum, p) => sum + p.price, 0) / transformedProducts.length
      } : null,
      discountedCount: transformedProducts.filter(p => p.discountPercentage).length,
      averageDiscount: (() => {
        const discounted = transformedProducts.filter(p => p.discountPercentage);
        return discounted.length > 0 
          ? discounted.reduce((sum, p) => sum + (p.discountPercentage || 0), 0) / discounted.length
          : 0;
      })(),
      averageRating: transformedProducts.length > 0
        ? transformedProducts.reduce((sum, p) => sum + p.rating, 0) / transformedProducts.length
        : 0,
      inStockCount: transformedProducts.filter(p => p.currentStock > 0).length,
      averageVariants: transformedProducts.length > 0
        ? transformedProducts.reduce((sum, p) => sum + p.variantCount, 0) / transformedProducts.length
        : 0
    };

    return NextResponse.json({
      products: transformedProducts,
      filterStats,
      filterOptions,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hasMore: page * limit < totalCount
      }
    });

  } catch (error) {
    console.error('Prisma connection error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}
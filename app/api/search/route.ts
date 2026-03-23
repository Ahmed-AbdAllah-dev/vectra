// app/api/search/route.ts
// app/api/search/route.ts
import { NextResponse } from 'next/server';

// Define types for the products API response
interface Product {
  createdAt: string | undefined;
  id: string | number;
  name: string;
  description?: string;
  price: number;
  category: string;
  imageUrl?: string;
  rating?: number;
  reviews?: number;
  currentStock?: number;
  soldQuantity?: number;
  isNewArrival?: boolean;
  isBestSeller?: boolean;
  discountPercentage?: number;
  sellerName?: string;
  dateAdded?: string;
  salesRank?: number;
}

interface ProductsApiResponse {
  products: Product[];
  filterStats?: any;
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasMore: boolean;
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  
  // Extract all parameters from the search request
  const query = searchParams.get('q') || '';
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const sortBy = searchParams.get('sortBy') || 'default';
  
  // Filter parameters
  const category = searchParams.get('category');
  const newArrival = searchParams.get('newArrival');
  const bestSeller = searchParams.get('bestSeller');
  const discount = searchParams.get('discount');

  try {
    // Call the products API to get ALL products (no pagination for local filtering)
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const productsUrl = `${baseUrl}/api/products?limit=1000`; // Get all products
    
    console.log('Fetching all products from:', productsUrl);
    
    const productsResponse = await fetch(productsUrl, {
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store'
    });
    
    if (!productsResponse.ok) {
      const errorText = await productsResponse.text();
      console.error('Products API error:', productsResponse.status, errorText);
      throw new Error(`Products API returned ${productsResponse.status}: ${errorText}`);
    }
    
    const productsData: ProductsApiResponse = await productsResponse.json();
    let allProducts = productsData.products || [];

    // Apply search query filter
    if (query) {
      const searchTerm = query.toLowerCase();
      allProducts = allProducts.filter(product =>
        product.name.toLowerCase().includes(searchTerm) ||
        (product.description && product.description.toLowerCase().includes(searchTerm)) ||
        product.category.toLowerCase().includes(searchTerm)
      );
    }

    // Apply category filter
    if (category) {
      allProducts = allProducts.filter(product =>
        product.category.toLowerCase() === category.toLowerCase()
      );
    }

    // Apply new arrival filter
    if (newArrival) {
      const now = new Date();
      let daysThreshold = 0;

      switch (newArrival) {
        case 'This Week':
          daysThreshold = 7;
          break;
        case 'This Month':
        case 'Last 30 Days':
          daysThreshold = 30;
          break;
        case 'Last 90 Days':
          daysThreshold = 90;
          break;
        default:
          daysThreshold = 30;
      }

      allProducts = allProducts.filter(product => {
        const productDate = new Date(product.dateAdded || product.createdAt || now);
        const daysDiff = Math.floor((now.getTime() - productDate.getTime()) / (1000 * 60 * 60 * 24));
        return daysDiff <= daysThreshold;
      });
    }

    // Apply best seller filter
    if (bestSeller) {
      let salesThreshold = 0;

      switch (bestSeller) {
        case 'This Month':
          salesThreshold = 10;
          break;
        case 'Past 3 Months':
          salesThreshold = 30;
          break;
        case 'Past 6 Months':
          salesThreshold = 50;
          break;
        case 'This Year':
          salesThreshold = 100;
          break;
        case 'All Time':
          salesThreshold = 200;
          break;
        default:
          salesThreshold = 10;
      }

      allProducts = allProducts.filter(product => 
        product.soldQuantity && product.soldQuantity >= salesThreshold
      );
    }

    // Apply discount filter
    if (discount) {
      const discountThreshold = parseInt(discount.replace(/\D/g, '')) || 0;
      allProducts = allProducts.filter(product =>
        product.discountPercentage !== null && product.discountPercentage as any >= discountThreshold
      );
    }

    // Apply sorting
    let sortedProducts = [...allProducts];
    switch (sortBy) {
      case 'price-low':
        sortedProducts.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        sortedProducts.sort((a, b) => b.price - a.price);
        break;
      case 'newest':
        sortedProducts.sort((a, b) => {
          const dateA = new Date(a.dateAdded || a.createdAt || 0);
          const dateB = new Date(b.dateAdded || b.createdAt || 0);
          return dateB.getTime() - dateA.getTime();
        });
        break;
      case 'best-seller':
        sortedProducts.sort((a, b) => (b.soldQuantity || 0) - (a.soldQuantity || 0));
        break;
      case 'name':
        sortedProducts.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        // Default sorting (by relevance for search)
        if (query) {
          sortedProducts.sort((a, b) => {
            // Sort by relevance to search query
            const aNameMatch = a.name.toLowerCase().includes(query.toLowerCase());
            const bNameMatch = b.name.toLowerCase().includes(query.toLowerCase());
            const aDescMatch = a.description?.toLowerCase().includes(query.toLowerCase());
            const bDescMatch = b.description?.toLowerCase().includes(query.toLowerCase());
            
            if (aNameMatch && !bNameMatch) return -1;
            if (!aNameMatch && bNameMatch) return 1;
            if (aDescMatch && !bDescMatch) return -1;
            if (!aDescMatch && bDescMatch) return 1;
            return (b.soldQuantity || 0) - (a.soldQuantity || 0);
          });
        } else {
          sortedProducts.sort((a, b) => (b.soldQuantity || 0) - (a.soldQuantity || 0));
        }
    }

    // Apply pagination
    const totalCount = sortedProducts.length;
    const totalPages = Math.ceil(totalCount / limit);
    const skip = (page - 1) * limit;
    const paginatedProducts = sortedProducts.slice(skip, skip + limit);

    // Calculate filter stats
    const categoryDistribution = sortedProducts.reduce((acc, product) => {
      acc[product.category] = (acc[product.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const prices = sortedProducts.map(p => p.price).filter(p => p > 0);
    const priceRange = prices.length > 0 ? {
      min: Math.min(...prices),
      max: Math.max(...prices),
      average: prices.reduce((a, b) => a + b, 0) / prices.length
    } : null;

    const discountedProducts = sortedProducts.filter(p => p.discountPercentage !== null && p.discountPercentage as any > 0);
    const averageDiscount = discountedProducts.length > 0 
      ? discountedProducts.reduce((acc, p) => acc + (p.discountPercentage || 0), 0) / discountedProducts.length
      : 0;

    const averageRating = sortedProducts.length > 0
      ? sortedProducts.reduce((acc, p) => acc + (p.rating || 0), 0) / sortedProducts.length
      : 0;

    // Prepare response
    const response = {
      products: paginatedProducts,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
        limit
      },
      filterStats: {
        totalProducts: productsData.products?.length || 0,
        filteredCount: totalCount,
        filteredOut: (productsData.products?.length || 0) - totalCount,
        categoryDistribution,
        priceRange,
        discountedCount: discountedProducts.length,
        averageDiscount,
        averageRating
      }
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to search products',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
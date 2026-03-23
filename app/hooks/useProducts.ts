// hooks/useProducts.ts
import { useState, useEffect } from 'react';
import { useSelectedFilters } from '../store/filterStore';

export interface Product {
  id: number;
  name: string;
  price: number;
  rating: number;
  reviews: number;
  image: string;
  category: string;
  description?: string;
  currentStock: number;
  soldQuantity: number;
  sellerName: string;
  isNewArrival?: boolean;
  isBestSeller?: boolean;
  discountPercentage?: number;
  dateAdded?: Date;
  salesRank?: number;
}

export interface FilterStats {
  totalProducts: number;
  filteredCount: number;
  filteredOut: number;
  categoryDistribution: Record<string, number>;
  priceRange: {
    min: number;
    max: number;
    average: number;
  } | null;
  discountedCount: number;
  averageDiscount: number;
  averageRating: number;
}

export interface ProductsResponse {
  products: Product[];
  filterStats: FilterStats;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasMore: boolean;
  };
}

interface UseProductsOptions {
  sortBy?: string;
  page?: number;
  limit?: number;
}

export const useProducts = (options: UseProductsOptions = {}) => {
  const [data, setData] = useState<ProductsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  
  const filters = useSelectedFilters();
  const { sortBy = 'default', page = 1, limit = 20 } = options;

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);

        // Build query parameters
        const params = new URLSearchParams();
        
        if (filters.selectedCategory) {
          params.append('category', filters.selectedCategory);
        }
        if (filters.selectedNewArrival) {
          params.append('newArrival', filters.selectedNewArrival);
        }
        if (filters.selectedBestSeller) {
          params.append('bestSeller', filters.selectedBestSeller);
        }
        if (filters.selectedDiscount) {
          params.append('discount', filters.selectedDiscount);
        }
        if (sortBy !== 'default') {
          params.append('sortBy', sortBy);
        }
        params.append('page', page.toString());
        params.append('limit', limit.toString());

        const response = await fetch(`/api/products?${params.toString()}`);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        setData(result);
        setRetryCount(0); // Reset retry count on success
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An error occurred';
        setError(errorMessage);
        console.error('Error fetching products:', err);
        
        // Auto-retry on connection errors
        if (errorMessage.includes('Engine is not yet connected') || 
            errorMessage.includes('Database connection failed')) {
          if (retryCount < 3) {
            setTimeout(() => {
              setRetryCount(prev => prev + 1);
            }, 1000 * Math.pow(2, retryCount)); // Exponential backoff
          }
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [
    filters.selectedCategory,
    filters.selectedNewArrival,
    filters.selectedBestSeller,
    filters.selectedDiscount,
    sortBy,
    page,
    limit,
    retryCount // Add retryCount to dependencies
  ]);

  const refetch = () => {
    setData(null);
    setLoading(true);
    setError(null);
  };

  return {
    products: data?.products || [],
    filterStats: data?.filterStats || null,
    pagination: data?.pagination || null,
    loading,
    error,
    refetch,
    hasActiveFilters: Object.values(filters).some(Boolean),
    isEmpty: data?.products.length === 0
  };
};

// Hook for getting available filter options based on current data
export const useFilterOptions = () => {
  const [options, setOptions] = useState({
    categories: [] as string[],
    discountRanges: [] as string[],
    hasNewArrivals: false,
    hasBestSellers: false
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        // Fetch all products to determine available options
        const response = await fetch('/api/products?limit=1000');
        const data = await response.json();
        
        const products = data.products || [];
        
        // Get unique categories
        const categories: string[] = [...new Set<string>(products.map((p: Product) => p.category))];

        
        // Get available discount ranges
        const discountRanges: string[] = [
            ...new Set<string>(
              products
                .filter((p: Product) => p.discountPercentage && p.discountPercentage > 0)
                .map((p: Product) => {
                  const discount = p.discountPercentage!;
                  if (discount >= 70) return '70% or more';
                  if (discount >= 50) return '50% or more';
                  if (discount >= 30) return '30% or more';
                  if (discount >= 20) return '20% or more';
                  if (discount >= 10) return '10% or more';
                  return null;
                })
                .filter((val: any): val is string => val !== null) // type guard
            ),
          ];
          

        // Check for new arrivals and best sellers
        const hasNewArrivals = products.some((p: Product) => p.isNewArrival);
        const hasBestSellers = products.some((p: Product) => p.isBestSeller);

        setOptions({
          categories,
          discountRanges,
          hasNewArrivals,
          hasBestSellers
        });
      } catch (error) {
        console.error('Error fetching filter options:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFilterOptions();
  }, []);

  return { ...options, loading };
};
'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

import { 
  Star, 
  StarHalf, 
  Filter, 
  SortAsc, 
  BarChart3, 
  Info, 
  Loader2, 
  AlertCircle, 
  RefreshCw, 
  Search, 
  X,
  ChevronDown,
  Home,
  Smartphone,
  Clock,
  TrendingUp,
  Percent,
  Sparkles,
  ShoppingBasket,
  Dumbbell,
  Shirt,
  BookOpen,
  ToyBrick,
  Check
} from 'lucide-react';
import ProductCard from '../components/ProductCard';
import Navbar from '../components/Navbar';
import ProductSidebarFilter from '../components/ProductSidebarFilter';
import SearchGrid from '../components/SearchGrid';

// Types
interface Product {
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
  seller?: {
    id: string;
    name: string;
  };
  sellerName?: string;
  discounts?: Array<{
    id: string;
    percentage: number;
    startDate: string;
    endDate: string;
  }>;
}

interface SearchResponse {
  products: Product[];
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    limit: number;
  };
  filterStats?: {
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
  };
}

// Custom Hook for Search Products
const useSearchProducts = (
  query: string,
  page: number,
  sortBy: string,
  filters: Record<string, string>
) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<SearchResponse['pagination'] | null>(null);
  const [filterStats, setFilterStats] = useState<SearchResponse['filterStats'] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!query) {
      setProducts([]);
      setPagination(null);
      setFilterStats(null);
      return;
    }

    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const params = new URLSearchParams({
          q: query,
          page: page.toString(),
          limit: '21'
        });
        
        if (sortBy !== 'default') {
          params.append('sortBy', sortBy);
        }
        
        Object.entries(filters).forEach(([key, value]) => {
          if (value) params.append(key, value);
        });
        
        const response = await fetch(`/api/search?${params.toString()}`);
        if (!response.ok) {
          throw new Error('Failed to fetch products');
        }
        
        const data: SearchResponse = await response.json();
        
        if (data.products) {
          setProducts(data.products);
          setPagination(data.pagination || null);
          setFilterStats(data.filterStats || null);
        } else if (Array.isArray(data)) {
          setProducts(data);
          setPagination({
            currentPage: page,
            totalPages: Math.ceil(data.length / 21),
            totalCount: data.length,
            hasNextPage: false,
            hasPreviousPage: false,
            limit: 21
          });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('Error fetching products:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [query, page, sortBy, filters]);

  const refetch = () => {
    setLoading(true);
    setError(null);
  };

  return {
    products,
    pagination,
    filterStats,
    loading,
    error,
    refetch,
    hasActiveFilters: Object.values(filters).some(Boolean),
    isEmpty: products.length === 0
  };
};

// Search Header Component
const SearchHeader: React.FC<{ 
  searchQuery: string; 
  resultsCount: number; 
  totalCount: number;
  onClear: () => void;
  loading: boolean;
}> = ({ searchQuery, resultsCount, totalCount, onClear, loading }) => {
  if (!searchQuery) return null;
  
  return (
    <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start space-x-3 min-w-0 flex-1">
          <Search className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="font-medium text-blue-800 text-sm break-words">
              Search results for: "{searchQuery}"
            </div>
            <div className="text-xs text-gray-600 mt-1">
              {loading ? 'Searching...' : `${totalCount} ${totalCount === 1 ? 'result' : 'results'} found`}
            </div>
          </div>
        </div>
        <button
          onClick={onClear}
          className="text-blue-600 hover:text-blue-800 text-xs flex items-center whitespace-nowrap flex-shrink-0"
        >
          <X className="w-3 h-3 mr-1" />
          Clear
        </button>
      </div>
    </div>
  );
};

// Filter Stats Component
const FilterStats: React.FC<{ stats: SearchResponse['filterStats'] }> = ({ stats }) => {
  const [showStats, setShowStats] = useState(false);

  if (!stats || stats.filteredCount === 0) return null;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 min-w-0 flex-1">
          <BarChart3 className="w-4 h-4 text-blue-600 flex-shrink-0" />
          <span className="text-sm font-medium text-blue-800 truncate">Filter Results</span>
        </div>
        <button
          onClick={() => setShowStats(!showStats)}
          className="text-blue-600 hover:text-blue-800 text-sm whitespace-nowrap flex-shrink-0 ml-2"
        >
          {showStats ? 'Hide' : 'Show'} Stats
        </button>
      </div>
      
      {showStats && (
        <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
          <div>
            <div className="text-blue-600 font-medium text-xs">Products</div>
            <div className="text-gray-700 text-sm">{stats.filteredCount} found</div>
          </div>
          {stats.priceRange && (
            <div>
              <div className="text-blue-600 font-medium text-xs">Price Range</div>
              <div className="text-gray-700 text-sm">
                ${stats.priceRange.min.toFixed(0)} - ${stats.priceRange.max.toFixed(0)}
              </div>
            </div>
          )}
          <div>
            <div className="text-blue-600 font-medium text-xs">Avg Rating</div>
            <div className="text-gray-700 text-sm">{stats.averageRating.toFixed(1)} ⭐</div>
          </div>
          {stats.discountedCount > 0 && (
            <div>
              <div className="text-blue-600 font-medium text-xs">On Sale</div>
              <div className="text-gray-700 text-sm">
                {stats.discountedCount} items ({stats.averageDiscount.toFixed(0)}% avg)
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Main Search Page Content
const SearchPageContent: React.FC = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('default');
  const [filters, setFilters] = useState<Record<string, string>>({});

  const query = searchParams.get('q') || '';
  const currentPage = parseInt(searchParams.get('page') || '1');

  const sortOptions = [
    { value: 'default', label: 'Default' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' },
    { value: 'newest', label: 'Newest First' },
    { value: 'best-seller', label: 'Best Sellers' },
    { value: 'name', label: 'Name A-Z' }
  ];

  // Initialize state from URL
  useEffect(() => {
    setSearchQuery(query);
    setSortBy(searchParams.get('sortBy') || 'default');
    
    // Initialize filters from URL params
    const urlFilters: Record<string, string> = {};
    ['category', 'newArrival', 'bestSeller', 'discount'].forEach(key => {
      const value = searchParams.get(key);
      if (value) urlFilters[key] = value;
    });
    setFilters(urlFilters);
    
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Initial check
    checkMobile();

    // Add event listener
    window.addEventListener('resize', checkMobile);

    // Cleanup
    return () => window.removeEventListener('resize', checkMobile);
  }, [query, searchParams]);

  // Use the custom hook
  const { 
    products, 
    pagination, 
    filterStats, 
    loading, 
    error, 
    refetch, 
    hasActiveFilters, 
    isEmpty 
  } = useSearchProducts(query, currentPage, sortBy, filters);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      updateURL({ q: searchQuery.trim(), page: '1' });
    }
  };

  const handleSortChange = (newSort: string) => {
    setSortBy(newSort);
    updateURL({ sortBy: newSort === 'default' ? undefined : newSort, page: '1' });
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };
  
  const handleClearFilters = () => {
    setFilters({});
    updateURL({ category: undefined, newArrival: undefined, bestSeller: undefined, discount: undefined, page: '1' });
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setFilters({});
    router.push('/search');
  };

  const updatePage = (newPage: number) => {
    updateURL({ page: newPage.toString() });
  };

  const updateURL = (updates: Record<string, string | undefined>) => {
    const newParams = new URLSearchParams(searchParams);
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        newParams.set(key, value);
      } else {
        newParams.delete(key);
      }
    });
    
    router.push(`/search?${newParams.toString()}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full max-w-7xl mx-auto">
        <div className="px-4 sm:px-6 lg:px-8">
          <Navbar/>
        </div>
        
        {/* Search Header - Full width container */}
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="mb-6 pb-4 pt-6">
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6">
              <div className="flex-1 relative">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                  <Search className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for products..."
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                />
              </div>
              <button
                type="submit"
                className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors font-medium whitespace-nowrap"
              >
                Search
              </button>
            </form>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-col lg:flex-row gap-0 lg:gap-8">
          {/* Sidebar Filters - Hidden on mobile, shown as modal */}
          <div className="lg:block">
            <ProductSidebarFilter 
              searchMode={true}
              filters={filters}
              onFilterChange={handleFilterChange}
              onClearFilters={handleClearFilters}
              isMobile={isMobile}
            />
          </div>

          {/* Main Content Area - Full width on mobile */}
          <main className="flex-1 min-w-0 w-full overflow-hidden">
            {query ? (
              <>
                {/* Search Header */}
                <SearchHeader 
                  searchQuery={query} 
                  resultsCount={products.length}
                  totalCount={pagination?.totalCount || products.length}
                  onClear={handleClearSearch}
                  loading={loading}
                />

                {/* Filter Stats */}
                <FilterStats stats={filterStats} />

                {/* Results Header - Improved mobile layout */}
                <div className="flex flex-col gap-4 mb-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex flex-col space-y-2">
                      {pagination && (
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">{products.length}</span> of{' '}
                          <span className="font-medium">{pagination.totalCount}</span> products
                          {currentPage > 1 && (
                            <span className="block text-xs text-gray-500 mt-1">
                              Page {currentPage} of {pagination.totalPages}
                            </span>
                          )}
                        </div>
                      )}
                      <div className="flex items-center space-x-3 text-sm">
                        {hasActiveFilters && (
                          <div className="flex items-center space-x-1 text-blue-600">
                            <Filter className="w-3 h-3" />
                            <span className="text-xs">{Object.values(filters).filter(Boolean).length} filter{Object.values(filters).filter(Boolean).length !== 1 ? 's' : ''}</span>
                          </div>
                        )}
                        {loading && (
                          <div className="flex items-center space-x-1 text-gray-500">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            <span className="text-xs">Updating...</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Sort Dropdown - Better mobile styling */}
                    <div className="flex items-center space-x-2">
                      <SortAsc className="w-4 h-4 text-gray-500 flex-shrink-0" />
                      <select
                        value={sortBy}
                        onChange={(e) => handleSortChange(e.target.value)}
                        disabled={loading}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500 w-full sm:w-auto min-w-[160px]"
                      >
                        {sortOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Error State */}
                {error && (
                  <div className="text-center py-8">
                    <div className="bg-red-50 rounded-lg p-6 max-w-sm mx-auto">
                      <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
                      <div className="text-red-600 text-lg mb-2">Error Loading Products</div>
                      <div className="text-red-500 text-sm mb-4 break-words">{error}</div>
                      <button
                        onClick={refetch}
                        className="inline-flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm"
                      >
                        <RefreshCw className="w-4 h-4" />
                        <span>Try Again</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Loading State */}
                {loading && products.length === 0 && (
                  <div className="text-center py-8">
                    <Loader2 className="w-8 h-8 text-gray-400 mx-auto mb-4 animate-spin" />
                    <div className="text-gray-500">Loading products...</div>
                  </div>
                )}

                {/* No Results */}
                {!loading && !error && isEmpty && (
                  <div className="text-center py-8">
                    <div className="bg-gray-50 rounded-lg p-6 max-w-sm mx-auto">
                      <Info className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                      <div className="text-gray-400 text-lg mb-2">No products found</div>
                      <div className="text-gray-500 text-sm mb-4">
                        {hasActiveFilters 
                          ? 'Try adjusting your filters to see more results'
                          : 'Try adjusting your search terms to see more results'
                        }
                      </div>
                      {hasActiveFilters && filterStats && (
                        <div className="text-gray-400 text-xs">
                          {filterStats.filteredOut} products were filtered out
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Products Grid - Fixed mobile grid layout */}
                {!loading && !error && products.length > 0 && (
                  <>
                    <div className="grid grid-cols-2 gap-3 mb-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 sm:gap-4 lg:gap-5">
                      {products.map((product) => (
                        <ProductCard key={product.id} product={product} />
                      ))}
                    </div>

                    {/* Pagination - Improved mobile layout */}
                    {pagination && pagination.totalPages > 1 && (
                      <div className="flex flex-col items-center space-y-4 mt-8 pb-6">
                        <div className="text-sm text-gray-600 sm:hidden">
                          Page {currentPage} of {pagination.totalPages}
                        </div>
                        
                        <div className="flex justify-center items-center space-x-2 w-full max-w-sm">
                          <button
                            onClick={() => updatePage(currentPage - 1)}
                            disabled={!pagination.hasPreviousPage || loading}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed flex-shrink-0"
                          >
                            Prev
                          </button>
                          
                          <div className="flex items-center space-x-1 overflow-hidden">
                            {Array.from({ length: Math.min(3, pagination.totalPages) }, (_, i) => {
                              const pageNum = Math.max(1, Math.min(
                                pagination.totalPages - 2,
                                currentPage - 1
                              )) + i;
                              
                              if (pageNum > pagination.totalPages) return null;
                              
                              return (
                                <button
                                  key={pageNum}
                                  onClick={() => updatePage(pageNum)}
                                  disabled={loading}
                                  className={`px-3 py-2 text-sm font-medium rounded-lg flex-shrink-0 min-w-[40px] ${
                                    currentPage === pageNum
                                      ? 'bg-blue-600 text-white'
                                      : 'text-gray-700 hover:bg-gray-50 disabled:text-gray-400'
                                  }`}
                                >
                                  {pageNum}
                                </button>
                              );
                            })}
                            
                            {pagination.totalPages > 3 && currentPage < pagination.totalPages - 1 && (
                              <>
                                <span className="text-gray-500 text-sm px-1">...</span>
                                <button
                                  onClick={() => updatePage(pagination.totalPages)}
                                  disabled={loading}
                                  className="px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:text-gray-400 rounded-lg flex-shrink-0 min-w-[40px]"
                                >
                                  {pagination.totalPages}
                                </button>
                              </>
                            )}
                          </div>
                          
                          <button
                            onClick={() => updatePage(currentPage + 1)}
                            disabled={!pagination.hasNextPage || loading}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed flex-shrink-0"
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </>
            ) : (
              /* Default state when no search - Better mobile layout */
              <div className="text-center py-12 px-4">
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8 max-w-md mx-auto">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-gray-400" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    Search for Products
                  </h2>
                  <p className="text-gray-600 mb-4">
                    Enter a search term above to find products in our catalog
                  </p>
                  <div className="text-sm text-gray-500">
                    Try searching for categories like "electronics", "clothing", or specific product names
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

// Main Search Page with Suspense
export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
          </div>
        </div>
      </div>
    }>
      <SearchPageContent />
    </Suspense>
  );
}
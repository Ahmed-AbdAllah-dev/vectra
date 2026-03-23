'use client'
import React, { useState, useEffect } from 'react';
import { Star, StarHalf, Filter, SortAsc, BarChart3, Info, Loader2, AlertCircle, RefreshCw, Search, X } from 'lucide-react';
import { useProducts } from '../hooks/useProducts';
import { useActiveFiltersCount } from '../store/filterStore';
import { useSearchStore } from '../store/searchStore';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import ProductCard from './ProductCard';



const FilterStats: React.FC<{ stats: any }> = ({ stats }) => {
  const [showStats, setShowStats] = useState(false);

  if (!stats || stats.filteredCount === 0) return null;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 mx-3 sm:mx-0">
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

const ErrorState: React.FC<{ error: string; onRetry: () => void }> = ({ error, onRetry }) => (
  <div className="text-center py-8 px-3">
    <div className="bg-red-50 rounded-lg p-6 max-w-sm mx-auto">
      <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
      <div className="text-red-600 text-lg mb-2">Error Loading Products</div>
      <div className="text-red-500 text-sm mb-4 break-words">{error}</div>
      <button
        onClick={onRetry}
        className="inline-flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm"
      >
        <RefreshCw className="w-4 h-4" />
        <span>Try Again</span>
      </button>
    </div>
  </div>
);

const LoadingState: React.FC = () => (
  <div className="text-center py-8 px-3">
    <Loader2 className="w-8 h-8 text-gray-400 mx-auto mb-4 animate-spin" />
    <div className="text-gray-500">Loading products...</div>
  </div>
);

const SearchHeader: React.FC<{ searchQuery: string; resultsCount: number; onClear: () => void }> = ({ 
  searchQuery, 
  resultsCount,
  onClear 
}) => {
  if (!searchQuery) return null;
  
  return (
    <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-3 mx-3 sm:mx-0">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start space-x-2 min-w-0 flex-1">
          <Search className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="font-medium text-blue-800 text-sm break-words">
              Search results for: "{searchQuery}"
            </div>
            <div className="text-xs text-gray-600 mt-1">
              ({resultsCount} {resultsCount === 1 ? 'result' : 'results'})
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
}

const ProductGrid: React.FC = () => {
  const [sortBy, setSortBy] = useState('default');
  const [page, setPage] = useState(1);
  const [mounted, setMounted] = useState(false);
  const { searchQuery, setSearchQuery, clearSearchQuery } = useSearchStore();

  // Fix hydration issue by ensuring component only renders after mounting
  useEffect(() => {
    setMounted(true);
  }, []);

  // Initialize search query from URL on component mount
  useEffect(() => {
    if (!mounted) return;
    
    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get('q') || '';
    if (query) {
      setSearchQuery(query);
    }
  }, [setSearchQuery, mounted]);

  const { 
    products, 
    filterStats, 
    pagination, 
    loading, 
    error, 
    refetch, 
    hasActiveFilters, 
    isEmpty 
  } = useProducts({ 
    sortBy, 
    page, 
    limit: 20
  });
  
  const activeFiltersCount = useActiveFiltersCount();

  const sortOptions = [
    { value: 'default', label: 'Default' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' },
    { value: 'newest', label: 'Newest First' },
    { value: 'best-seller', label: 'Best Sellers' },
    { value: 'name', label: 'Name A-Z' }
  ];

  const handleSortChange = (newSortBy: string) => {
    setSortBy(newSortBy);
    setPage(1); // Reset to first page when sorting changes
  };

  const handleClearSearch = () => {
    clearSearchQuery();
    // Remove the query parameter from URL without reload
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('q');
      window.history.pushState({}, '', url.toString());
    }
    setPage(1); // Reset to first page when clearing search
  };

  // Don't render anything until mounted to prevent hydration mismatch
  if (!mounted) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState error={error} onRetry={refetch} />;
  }

  return (
    <div className="w-full max-w-full overflow-x-hidden">
      {/* Search Header */}
      <SearchHeader 
        searchQuery={searchQuery} 
        resultsCount={products.length}
        onClear={handleClearSearch}
      />

      {/* Filter Stats */}
      {filterStats && <FilterStats stats={filterStats} />}

      {/* Results header */}
      <div className="flex flex-col gap-3 mb-4 px-3 sm:px-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex flex-col space-y-2">
            {pagination && (
              <div className="text-sm text-gray-600">
                <span className="font-medium">{products.length}</span> of{' '}
                <span className="font-medium">{pagination.totalCount}</span> products
                {page > 1 && (
                  <span className="block text-xs text-gray-500 mt-1">
                    Page {page} of {pagination.totalPages}
                  </span>
                )}
              </div>
            )}
            <div className="flex items-center space-x-3 text-sm">
              {hasActiveFilters && (
                <div className="flex items-center space-x-1 text-blue-600">
                  <Filter className="w-3 h-3" />
                  <span className="text-xs">{activeFiltersCount} filter{activeFiltersCount !== 1 ? 's' : ''}</span>
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

          {/* Sort Dropdown */}
          <div className="flex items-center space-x-2">
            <SortAsc className="w-4 h-4 text-gray-500 flex-shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value)}
              disabled={loading}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500 w-full sm:w-auto min-w-0"
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

      {/* Loading state */}
      {loading && products.length === 0 ? (
        <LoadingState />
      ) : isEmpty ? (
        /* Empty state */
        <div className="text-center py-8 px-3">
          <div className="bg-gray-50 rounded-lg p-6 max-w-sm mx-auto">
            <Info className="w-10 h-10 text-gray-400 mx-auto mb-3" />
            <div className="text-gray-400 text-lg mb-2">No products found</div>
            <div className="text-gray-500 text-sm mb-4">
              {hasActiveFilters 
                ? 'Try adjusting your filters to see more results'
                : 'No products available at the moment'
              }
            </div>
            {hasActiveFilters && filterStats && (
              <div className="text-gray-400 text-xs">
                {filterStats.filteredOut} products were filtered out
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Products grid */
        <>
          <div className="grid grid-cols-2 gap-3 px-3 sm:px-0 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 sm:gap-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex flex-col items-center space-y-3 mt-6 px-3">
              {/* Page info for mobile */}
              <div className="text-sm text-gray-600 sm:hidden">
                Page {page} of {pagination.totalPages}
              </div>
              
              <div className="flex justify-center items-center space-x-2 w-full">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1 || loading}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed flex-shrink-0"
                >
                  Prev
                </button>
                
                <div className="flex items-center space-x-1 overflow-x-auto scrollbar-hide">
                  {/* Show fewer page numbers on mobile */}
                  {Array.from({ length: Math.min(3, pagination.totalPages) }, (_, i) => {
                    const pageNum = Math.max(1, Math.min(
                      pagination.totalPages - 2,
                      page - 1
                    )) + i;
                    
                    if (pageNum > pagination.totalPages) return null;
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        disabled={loading}
                        className={`px-3 py-2 text-sm font-medium rounded-lg flex-shrink-0 ${
                          page === pageNum
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-700 hover:bg-gray-50 disabled:text-gray-400'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  
                  {pagination.totalPages > 3 && page < pagination.totalPages - 1 && (
                    <>
                      <span className="text-gray-500 text-sm">...</span>
                      <button
                        onClick={() => setPage(pagination.totalPages)}
                        disabled={loading}
                        className="px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:text-gray-400 rounded-lg flex-shrink-0"
                      >
                        {pagination.totalPages}
                      </button>
                    </>
                  )}
                </div>
                
                <button
                  onClick={() => setPage(Math.min(pagination.totalPages, page + 1))}
                  disabled={page === pagination.totalPages || loading}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed flex-shrink-0"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ProductGrid;
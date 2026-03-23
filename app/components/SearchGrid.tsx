'use client';
import React, { useState, useEffect } from 'react';
import { Loader2, Info, RefreshCw, AlertCircle, Search, X } from 'lucide-react';

import { useSearchStore } from '../store/searchStore';
import { useSearch } from '../hooks/useSearch';
import ProductCard from './ProductCard';

const ErrorState: React.FC<{ error: string; onRetry: () => void }> = ({ error, onRetry }) => (
  <div className="text-center py-8 px-3">
    <div className="bg-red-50 rounded-lg p-6 max-w-sm mx-auto">
      <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
      <div className="text-red-600 text-lg mb-2">Error Loading Search</div>
      <div className="text-red-500 text-sm mb-4 break-words">{error}</div>
      <button
        onClick={onRetry}
        className="inline-flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 text-sm"
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
    <div className="text-gray-500">Searching...</div>
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

const SearchGrid: React.FC = () => {
  const [page, setPage] = useState(1);
  const { searchQuery, clearSearchQuery } = useSearchStore();
  const { products, pagination, loading, error, isEmpty } = useSearch({ 
    query: searchQuery, 
    page, 
    limit: 21 
  });

  const handleClearSearch = () => {
    clearSearchQuery();
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('q');
      window.history.pushState({}, '', url.toString());
    }
    setPage(1);
  };

  if (error) {
    return <ErrorState error={error} onRetry={() => setPage(1)} />;
  }

  return (
    <div className="w-full max-w-full overflow-x-hidden">
      {/* Search Header */}
      <SearchHeader 
        searchQuery={searchQuery} 
        resultsCount={products.length}
        onClear={handleClearSearch}
      />

      {/* Loading state */}
      {loading && products.length === 0 ? (
        <LoadingState />
      ) : isEmpty ? (
        /* Empty state */
        <div className="text-center py-8 px-3">
          <div className="bg-gray-50 rounded-lg p-6 max-w-sm mx-auto">
            <Info className="w-10 h-10 text-gray-400 mx-auto mb-3" />
            <div className="text-gray-400 text-lg mb-2">No results found</div>
            <div className="text-gray-500 text-sm mb-4">
              Try searching with different keywords
            </div>
          </div>
        </div>
      ) : (
        /* Results grid */
        <>
          <div className="grid grid-cols-2 gap-2 px-2 sm:px-0 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 sm:gap-4">
            {products.map((product) => (
              <div key={product.id} className="min-w-0"> {/* Ensures proper grid behavior */}
                <ProductCard product={product} />
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex justify-center items-center space-x-2 w-full mt-6 px-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1 || loading}
                className="px-3 py-2 border rounded-lg text-sm bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                Prev
              </button>
              <div className="text-sm text-gray-600">
                Page {pagination.currentPage} of {pagination.totalPages}
              </div>
              <button
                onClick={() => setPage(Math.min(pagination.totalPages, page + 1))}
                disabled={page === pagination.totalPages || loading}
                className="px-3 py-2 border rounded-lg text-sm bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SearchGrid;
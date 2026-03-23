// components/ReviewSection.tsx
'use client';

import { Review } from '@/types/product';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface ReviewsResponse {
  reviews: Review[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  statistics: {
    averageRating: number;
    totalReviews: number;
    ratingDistribution: {
      5: number;
      4: number;
      3: number;
      2: number;
      1: number;
    };
  };
}

interface ReviewFormData {
  star: number;
  content: string;
}

export default function ReviewSection({ productId }: { productId: number }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [statistics, setStatistics] = useState({
    averageRating: 0,
    totalReviews: 0,
    ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStarFilter, setSelectedStarFilter] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<'createdAt' | 'star'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [reviewForm, setReviewForm] = useState<ReviewFormData>({
    star: 5,
    content: ''
  });

  const { data: session, status } = useSession();

  const toggleShowAllReviews = () => {
    setShowAllReviews(!showAllReviews);
  };

  const fetchReviews = async (page: number = 1, starFilter: number | null = null) => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '5',
        sortBy,
        sortOrder,
      });
      
      if (starFilter) {
        params.append('star', starFilter.toString());
      }

      const response = await fetch(`/api/products/${productId}/reviews?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch reviews');
      }

      const data: ReviewsResponse = await response.json();
      
      if (page === 1) {
        setReviews(data.reviews);
      } else {
        setReviews(prev => [...prev, ...data.reviews]);
      }
      
      setStatistics(data.statistics);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch reviews');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [productId, sortBy, sortOrder]);

  const handleStarFilter = (star: number | null) => {
    setSelectedStarFilter(star);
    fetchReviews(1, star);
  };

  const handleLoadMore = () => {
    if (pagination.hasNextPage) {
      fetchReviews(pagination.currentPage + 1, selectedStarFilter);
    }
  };

  const handleSortChange = (newSortBy: 'createdAt' | 'star', newSortOrder: 'asc' | 'desc') => {
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
  };

  const handleClearFilter = () => {
    setSelectedStarFilter(null);
    fetchReviews(1, null);
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    setFormSuccess(null);

    try {
      const response = await fetch(`/api/products/${productId}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reviewForm),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit review');
      }

      setFormSuccess('Review submitted successfully!');
      setReviewForm({ star: 5, content: '' });
      setShowReviewForm(false);
      
      // Refresh reviews
      fetchReviews(1, selectedStarFilter);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const reviewsToShow = showAllReviews ? reviews : reviews.slice(0, 3);

  if (loading && reviews.length === 0) {
    return (
      <div className="mt-12">
        <h2 className="text-xl font-semibold mb-6">Rating & Reviews</h2>
        <div className="text-center py-8">
          <p>Loading reviews...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-12">
        <h2 className="text-xl font-semibold mb-6">Rating & Reviews</h2>
        <div className="text-center py-8">
          <p className="text-red-600">Error loading reviews: {error}</p>
          <button 
            onClick={() => fetchReviews(1, selectedStarFilter)}
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-12">
      <h2 className="text-xl font-semibold mb-6">Rating & Reviews</h2>
      
      {/* Add Review Button */}
      <div className="mb-6">
        {status === 'loading' ? (
          <div className="animate-pulse">Checking authentication...</div>
        ) : session ? (
          <button
            onClick={() => setShowReviewForm(!showReviewForm)}
            className="px-4 py-2 bg-black text-white rounded hover:bg-blue-600 transition-colors"
          >
            {showReviewForm ? 'Cancel Review' : 'Write a Review'}
          </button>
        ) : (
          <p className="text-gray-600">
            Please log in to write a review.
          </p>
        )}
      </div>

      {/* Review Form */}
      {showReviewForm && (
        <div className="mb-8 p-6 border rounded-lg bg-gray-50">
          <h3 className="text-lg font-semibold mb-4">Write Your Review</h3>
          {formError && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {formError}
            </div>
          )}
          {formSuccess && (
            <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
              {formSuccess}
            </div>
          )}
          <form onSubmit={handleReviewSubmit}>
            {/* Star Rating */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rating
              </label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewForm(prev => ({ ...prev, star }))}
                    className={`text-2xl ${
                      star <= reviewForm.star ? 'text-yellow-400' : 'text-gray-300'
                    } hover:text-yellow-300 transition-colors`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            {/* Review Content */}
            <div className="mb-4">
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                Review
              </label>
              <textarea
                id="content"
                value={reviewForm.content}
                onChange={(e) => setReviewForm(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Share your experience with this product..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                maxLength={1000}
                required
              />
              <div className="text-xs text-gray-500 mt-1 text-right">
                {reviewForm.content.length}/1000 characters
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || !reviewForm.content.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </form>
        </div>
      )}

      {/* Rest of the component remains the same */}
      <div className="flex items-start gap-8 mb-8">
        {/* Average Rating */}
        <div className="text-center">
          <div className="text-6xl font-bold mb-2">{statistics.averageRating.toFixed(1)}</div>
          <div className="flex items-center gap-1 mb-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <span
                key={star}
                className={`text-lg ${star <= Math.round(statistics.averageRating) ? 'text-yellow-400' : 'text-gray-300'}`}
              >
                ★
              </span>
            ))}
          </div>
          <p className="text-sm text-gray-600">({statistics.totalReviews} Reviews)</p>
        </div>

        {/* Rating Distribution */}
        <div className="flex-1 max-w-sm">
          {[5, 4, 3, 2, 1].map((star) => (
            <div key={star} className="flex items-center gap-2 mb-1">
              <button
                onClick={() => handleStarFilter(selectedStarFilter === star ? null : star)}
                className={`flex items-center gap-2 hover:bg-gray-100 px-2 py-1 rounded transition-colors ${
                  selectedStarFilter === star ? 'bg-blue-100' : ''
                }`}
              >
                <span className="text-sm w-4">{star}</span>
                <span className="text-yellow-400">★</span>
                <div className="flex-1 bg-gray-200 rounded-full h-2 w-32">
                  <div
                    className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: statistics.totalReviews > 0 
                        ? `${(statistics.ratingDistribution[star as keyof typeof statistics.ratingDistribution] / statistics.totalReviews) * 100}%` 
                        : '0%'
                    }}
                  ></div>
                </div>
                <span className="text-sm text-gray-600 w-8">
                  {statistics.ratingDistribution[star as keyof typeof statistics.ratingDistribution]}
                </span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Filter and Sort Controls */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Sort by:</span>
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [newSortBy, newSortOrder] = e.target.value.split('-') as ['createdAt' | 'star', 'asc' | 'desc'];
              handleSortChange(newSortBy, newSortOrder);
            }}
            className="text-sm border rounded px-2 py-1"
          >
            <option value="createdAt-desc">Newest First</option>
            <option value="createdAt-asc">Oldest First</option>
            <option value="star-desc">Highest Rating</option>
            <option value="star-asc">Lowest Rating</option>
          </select>
        </div>
        
        {selectedStarFilter && (
          <button
            onClick={handleClearFilter}
            className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-full hover:bg-blue-200"
          >
            Clear {selectedStarFilter} star filter ✕
          </button>
        )}
      </div>

      {/* Individual Reviews */}
      <div className="space-y-6">
        {reviewsToShow.map((review) => (
          <div key={review.id} className="border-b pb-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-gray-300 rounded-full overflow-hidden">
                <Image
                  src="/placeholder-avatar.jpg"
                  alt={review.buyer.name}
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium">{review.buyer.name}</h4>
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        className={`text-sm ${star <= review.star ? 'text-yellow-400' : 'text-gray-300'}`}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                </div>
                <p className="text-gray-600 text-sm mb-2">{review.content}</p>
                <p className="text-xs text-gray-400">
                  {new Date(review.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Show/Hide Reviews Button */}
      {!showAllReviews && statistics.totalReviews > 3 && (
        <div className="text-center mt-6">
          <button
            onClick={toggleShowAllReviews}
            className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Show All {statistics.totalReviews} Reviews
          </button>
        </div>
      )}

      {/* Load More Button - only show when in extended view */}
      {showAllReviews && pagination.hasNextPage && (
        <div className="text-center mt-6">
          <button
            onClick={handleLoadMore}
            disabled={loading}
            className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Load More Reviews'}
          </button>
        </div>
      )}

      {/* Hide Reviews Button - only show when in extended view */}
      {showAllReviews && (
        <div className="text-center mt-4">
          <button
            onClick={toggleShowAllReviews}
            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
          >
            Hide Extended Reviews
          </button>
        </div>
      )}

      {reviews.length === 0 && !loading && (
        <div className="text-center py-8">
          <p className="text-gray-600">No reviews found.</p>
        </div>
      )}
    </div>
  );
}
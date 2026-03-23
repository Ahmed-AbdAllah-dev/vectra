
import { useEffect, useState } from "react";

interface Pagination {
  [x: string]: ReactNode;
  page: number;
  totalPages: number;
  totalCount: number;
  hasMore: boolean;
}

interface SearchResult {
  products: any[];
  pagination: Pagination;
}

export function useSearch({ query, page, limit }: { query: string; page: number; limit: number }) {
  const [products, setProducts] = useState<any[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEmpty, setIsEmpty] = useState(false);

  useEffect(() => {
    if (!query) return;
    setLoading(true);
    setError(null);

    fetch(`/api/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`)
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then((data: SearchResult) => {
        setProducts(data.products);
        setPagination(data.pagination);
        setIsEmpty(data.products.length === 0);
      })
      .catch(() => setError("Failed to fetch products"))
      .finally(() => setLoading(false));
  }, [query, page, limit]);

  return { products, pagination, loading, error, isEmpty };
}

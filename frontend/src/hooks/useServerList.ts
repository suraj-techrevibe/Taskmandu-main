import { useCallback, useEffect, useRef, useState } from 'react';
import type { PaginationMeta } from '../services/http';

export interface ServerListQuery {
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  filters: Record<string, string>;
}

export type ListFetcher<T> = (params: ServerListQuery) => Promise<{ items: T[]; pagination: PaginationMeta }>;

export interface UseServerListOptions<T> {
  fetcher: ListFetcher<T>;
  defaultLimit?: number;
  defaultSortBy?: string;
  defaultSortOrder?: 'asc' | 'desc';
  initialFilters?: Record<string, string>;
}

export interface UseServerListResult<T> {
  items: T[];
  pagination: PaginationMeta;
  loading: boolean;
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  filters: Record<string, string>;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  setSort: (sortBy: string, sortOrder?: 'asc' | 'desc') => void;
  setFilter: (key: string, value: string) => void;
  setFilters: (filters: Record<string, string>) => void;
  reset: () => void;
  refresh: () => void;
}

/**
 * Drives a server-side paginated list: owns page/limit/sort/filter state,
 * fetches the matching page from the API and exposes the pagination metadata.
 * Changing any filter resets to page 1; `refresh()` re-fetches the current page
 * (used after create/update/delete mutations).
 */
export function useServerList<T>(options: UseServerListOptions<T>): UseServerListResult<T> {
  const { fetcher } = options;
  const [page, setPageState] = useState(1);
  const [limit, setLimitState] = useState(options.defaultLimit ?? 10);
  const [sortBy, setSortBy] = useState(options.defaultSortBy ?? 'createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(options.defaultSortOrder ?? 'desc');
  const [filters, setFiltersState] = useState<Record<string, string>>(options.initialFilters ?? {});
  const [items, setItems] = useState<T[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    totalItems: 0,
    totalPages: 0,
    currentPage: 1,
    limit,
  });
  const [loading, setLoading] = useState(false);
  const [tick, setTick] = useState(0);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetcherRef
      .current({ page, limit, sortBy, sortOrder, filters })
      .then((res) => {
        if (cancelled) return;
        setItems(res.items);
        setPagination(res.pagination);
      })
      .catch(() => {
        // Error toast is surfaced by the HTTP layer — keep the previous page
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [page, limit, sortBy, sortOrder, filters, tick]);

  const setPage = useCallback((next: number) => setPageState(Math.max(1, next)), []);
  const setLimit = useCallback((next: number) => {
    setLimitState(Math.max(1, Math.min(100, next)));
    setPageState(1);
  }, []);
  const setSort = useCallback((nextSortBy: string, nextOrder?: 'asc' | 'desc') => {
    setSortBy(nextSortBy);
    if (nextOrder) setSortOrder(nextOrder);
  }, []);
  const setFilter = useCallback((key: string, value: string) => {
    setFiltersState((prev) => ({ ...prev, [key]: value }));
    setPageState(1);
  }, []);
  const setFilters = useCallback((next: Record<string, string>) => {
    setFiltersState(next);
    setPageState(1);
  }, []);
  const reset = useCallback(() => {
    setFiltersState({});
    setSortBy(options.defaultSortBy ?? 'createdAt');
    setSortOrder(options.defaultSortOrder ?? 'desc');
    setPageState(1);
  }, [options.defaultSortBy, options.defaultSortOrder]);
  const refresh = useCallback(() => setTick((t) => t + 1), []);

  return {
    items,
    pagination,
    loading,
    page,
    limit,
    sortBy,
    sortOrder,
    filters,
    setPage,
    setLimit,
    setSort,
    setFilter,
    setFilters,
    reset,
    refresh,
  };
}

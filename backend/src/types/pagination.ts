import type { Request } from 'express';

export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 1 | -1;
}

export interface PaginatedResult<T> {
  items: T[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  limit: number;
}

export function parsePagination(query: Request['query']): PaginationOptions {
  const page = Math.max(1, parseInt(String(query.page ?? '1'), 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(String(query.limit ?? '10'), 10) || 10));
  const sortBy = typeof query.sortBy === 'string' && query.sortBy ? query.sortBy : 'createdAt';
  const sortOrder = query.sortOrder === 'asc' ? (1 as const) : (-1 as const);

  return { page, limit, sortBy, sortOrder };
}

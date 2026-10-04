import { StatusCodes } from 'http-status-codes';

export interface PaginationMeta {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  limit: number;
}

export class ApiResponse<T = unknown> {
  public readonly success: boolean;
  public readonly message: string;
  public readonly data: T | null;
  public readonly pagination?: PaginationMeta;

  constructor(
    public readonly statusCode: number = StatusCodes.OK,
    message: string,
    data: T | null = null,
    pagination?: PaginationMeta,
  ) {
    this.success = statusCode >= 200 && statusCode < 300;
    this.message = message;
    this.data = data;
    if (pagination) {
      this.pagination = {
        totalItems: pagination.totalItems,
        totalPages: pagination.totalPages,
        currentPage: pagination.currentPage,
        limit: pagination.limit,
      };
    }
  }

  static ok<T>(data: T, message = 'Success'): ApiResponse<T> {
    return new ApiResponse<T>(StatusCodes.OK, message, data);
  }

  static created<T>(data: T, message = 'Created successfully'): ApiResponse<T> {
    return new ApiResponse<T>(StatusCodes.CREATED, message, data);
  }

  static noContent(message = 'No content'): ApiResponse<null> {
    return new ApiResponse<null>(StatusCodes.NO_CONTENT, message, null);
  }
}

import { toast } from './toast';

export const API_BASE_URL: string =
  import.meta.env.VITE_API_URL ?? 'http://localhost:5001/api/v1';

export const AUTH_EXPIRED_EVENT = 'auth:expired';

const ACCESS_TOKEN_KEY = 'wms_access_token';
const REFRESH_TOKEN_KEY = 'wms_refresh_token';

export class ApiError extends Error {
  statusCode: number;
  fieldErrors: Record<string, string>;

  constructor(message: string, statusCode: number, fieldErrors: Record<string, string> = {}) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.fieldErrors = fieldErrors;
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
  skipErrorToast?: boolean;
  skipAuth?: boolean;
  skipRetry?: boolean;
}

export interface ApiEnvelope<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  pagination?: unknown;
}

export interface PaginationMeta {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: PaginationMeta;
}

/**
 * Backend list endpoints return a plain array; some future endpoints may
 * return `{ items: [...] }`. This helper accepts either shape.
 */
export function unwrapItems<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  const items = (data as { items?: unknown } | null)?.items;
  return Array.isArray(items) ? (items as T[]) : [];
}

/**
 * Fetches a server-side paginated list and returns both the items and the
 * pagination metadata (`totalItems`, `totalPages`, `currentPage`, `limit`).
 * Falls back to `{ items: [], pagination: empty }` when the payload has no
 * pagination envelope (e.g. self-scoped endpoints).
 */
export async function apiList<T>(path: string, options?: RequestOptions): Promise<PaginatedResponse<T>> {
  const payload = await request<T>(path, { ...options, method: 'GET' });
  const pagination = (payload?.pagination ?? {}) as Partial<PaginationMeta>;
  return {
    items: unwrapItems<T>(payload?.data),
    pagination: {
      totalItems: pagination.totalItems ?? 0,
      totalPages: pagination.totalPages ?? 0,
      currentPage: pagination.currentPage ?? 1,
      limit: pagination.limit ?? 10,
    },
  };
}

interface ErrorDetails {
  errors?: Array<{ field?: string; message?: string }>;
}

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function setSessionTokens(accessToken: string, refreshToken: string): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  sessionExpiredNotified = false;
}

export function clearSessionTokens(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

let sessionExpiredNotified = false;

function notifyAuthExpired(): void {
  if (sessionExpiredNotified) return;
  sessionExpiredNotified = true;
  window.dispatchEvent(new CustomEvent(AUTH_EXPIRED_EVENT));
}

function extractMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return 'An unexpected error occurred';
}

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  if (!refreshPromise) {
    refreshPromise = fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })
      .then(async (res) => {
        const payload = (await res.json()) as ApiEnvelope<{ tokens: { accessToken: string; refreshToken: string } }>;
        if (!res.ok || !payload.success || !payload.data) return null;
        setSessionTokens(payload.data.tokens.accessToken, payload.data.tokens.refreshToken);
        return payload.data.tokens.accessToken;
      })
      .catch(() => null)
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

/**
 * Raw request returning the full API envelope (data + pagination metadata).
 */
async function request<T>(path: string, options: RequestOptions = {}): Promise<ApiEnvelope<T>> {
  const {
    method = 'GET',
    body,
    headers = {},
    skipErrorToast = false,
    skipAuth = false,
    skipRetry = false,
  } = options;

  const doFetch = async (token?: string | null): Promise<Response> => {
    const finalHeaders: Record<string, string> = { ...headers };
    if (body !== undefined && !(body instanceof FormData)) {
      finalHeaders['Content-Type'] = 'application/json';
    }
    if (!skipAuth && token) {
      finalHeaders['Authorization'] = `Bearer ${token}`;
    }

    return fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: finalHeaders,
      body: body instanceof FormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
    });
  };

  const showError = (message: string): void => {
    if (!skipErrorToast) toast.error(message);
  };

  // Login/refresh failures are credential problems, not expired sessions.
  const isAuthEndpoint = path.startsWith('/auth/login') || path.startsWith('/auth/refresh');
  const canHandle401 = !skipAuth && !skipRetry && !isAuthEndpoint;

  let res: Response;
  try {
    res = await doFetch(getAccessToken());
  } catch {
    showError('Unable to reach the server. Please check your connection and try again.');
    throw new ApiError('Unable to reach the server', 0);
  }

  if (res.status === 401 && canHandle401) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      res = await doFetch(newToken);
    } else {
      notifyAuthExpired();
      clearSessionTokens();
      throw new ApiError('Your session has expired', 401);
    }
  }

  let payload: ApiEnvelope<T> | null = null;
  try {
    payload = (await res.json()) as ApiEnvelope<T>;
  } catch {
    // Non-JSON response (e.g. CSV download) — caller handles raw text
  }

  if (!res.ok || !payload?.success) {
    const details = (payload as unknown as { details?: ErrorDetails })?.details;
    const firstErr = details?.errors?.[0];
    const specificMsg = firstErr?.field
      ? `${firstErr.field}: ${firstErr.message}`
      : firstErr?.message;
    const message = specificMsg || payload?.message || `Request failed with status ${res.status}`;
    const fieldErrors: Record<string, string> = {};
    details?.errors?.forEach((err) => {
      if (err.field && err.message) fieldErrors[err.field] = err.message;
    });

    if (res.status === 401 && canHandle401) {
      // The 401-refresh branch above already handled refresh; reaching here
      // means the retried request also failed. Let the app-level
      // `auth:expired` listener surface the toast to avoid duplicates.
      throw new ApiError(message, res.status, fieldErrors);
    }
    showError(message);

    throw new ApiError(message, res.status, fieldErrors);
  }

  return payload;
}

export function apiGet<T>(path: string, options?: RequestOptions): Promise<T> {
  return request<T>(path, { ...options, method: 'GET' }).then((p) => p.data);
}

export function apiPost<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
  return request<T>(path, { ...options, method: 'POST', body }).then((p) => p.data);
}

export function apiPatch<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
  return request<T>(path, { ...options, method: 'PATCH', body }).then((p) => p.data);
}

export function apiDelete<T>(path: string, options?: RequestOptions): Promise<T> {
  return request<T>(path, { ...options, method: 'DELETE' }).then((p) => p.data);
}

export { extractMessage };

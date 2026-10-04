import { apiGet, apiPatch, apiPost, clearSessionTokens, setSessionTokens } from './http';
import type { AuthTokens, AuthUser, Role } from '../types';

const USER_KEY = 'wms_user';

export interface LoginResponse {
  user: AuthUser;
  tokens: AuthTokens;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  role?: Role;
}

/**
 * The backend serializes users with `_id`; map it to the frontend's `id`
 * shape so identifiers like `req.user.id` match the chat `senderId`.
 */
export function mapUser(doc: Record<string, any>): AuthUser {
  const { _id, ...rest } = doc;
  return { ...rest, id: _id ?? doc.id } as AuthUser;
}

export function saveSession(user: AuthUser, tokens: AuthTokens): void {
  setSessionTokens(tokens.accessToken, tokens.refreshToken);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession(): void {
  clearSessionTokens();
  localStorage.removeItem(USER_KEY);
}

export function getStoredUser(): AuthUser | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function updateStoredUser(user: AuthUser): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export interface UpdateProfileInput {
  name?: string;
  email?: string;
  phone?: string | null;
}

export async function updateMyProfile(input: UpdateProfileInput): Promise<AuthUser> {
  return mapUser(await apiPatch<Record<string, any>>('/auth/profile', input));
}

export async function updateMyAvatar(file: File): Promise<AuthUser> {
  const form = new FormData();
  form.append('avatar', file);
  return mapUser(await apiPost<Record<string, any>>('/auth/avatar', form));
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const res = await apiPost<{ user: Record<string, any>; tokens: AuthTokens }>('/auth/login', {
    email,
    password,
  });
  return { user: mapUser(res.user), tokens: res.tokens };
}

export async function register(input: RegisterInput): Promise<LoginResponse> {
  const res = await apiPost<{ user: Record<string, any>; tokens: AuthTokens }>('/auth/register', input);
  return { user: mapUser(res.user), tokens: res.tokens };
}

export async function logout(refreshToken: string | null): Promise<void> {
  try {
    await apiPost<{ success: boolean }>(
      '/auth/logout',
      { refreshToken },
      { skipAuth: true, skipErrorToast: true },
    );
  } catch {
    // Server-side revocation is best-effort; local session is cleared regardless.
  }
}

export async function me(): Promise<AuthUser> {
  return mapUser(await apiGet<Record<string, any>>('/auth/me', { skipErrorToast: true }));
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  await apiPost<{ success: boolean }>('/auth/change-password', {
    currentPassword,
    newPassword,
  });
}

export interface ForgotPasswordResponse {
  resetToken: string | null;
}

export async function forgotPassword(email: string): Promise<ForgotPasswordResponse> {
  return apiPost<ForgotPasswordResponse>('/auth/forgot-password', { email });
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  await apiPost<{ success: boolean }>('/auth/reset-password', { token, newPassword });
}

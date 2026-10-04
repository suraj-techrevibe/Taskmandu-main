import type { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { env } from '../../config/env';
import { ApiResponse } from '../../utils/ApiResponse';
import { ApiError } from '../../utils/ApiError';
import { catchAsync } from '../../utils/catchAsync';
import {
  changeUserPassword,
  getUserProfile,
  listUsers,
  loginUser,
  logoutUser,
  refreshTokens,
  registerUser,
  requestPasswordReset,
  resetUserPassword,
  softDeleteUser,
  updateMyAvatar,
  updateMyProfile,
  updateUser,
  type TokenPair,
} from './auth.service';
import { CookieNames } from '../../constants/cookies';

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.isProduction,
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/api/v1/auth',
};

function setRefreshCookie(res: Response, token: string): void {
  res.cookie(CookieNames.REFRESH_TOKEN, token, REFRESH_COOKIE_OPTIONS);
}

function clearRefreshCookie(res: Response): void {
  res.clearCookie(CookieNames.REFRESH_TOKEN, { ...REFRESH_COOKIE_OPTIONS, maxAge: 0 });
}

export const register = catchAsync(async (req: Request, res: Response) => {
  const { user, tokens } = await registerUser(req.body);
  setRefreshCookie(res, tokens.refreshToken);
  res
    .status(StatusCodes.CREATED)
    .json(new ApiResponse(StatusCodes.CREATED, 'Account created successfully', { user, tokens }));
});

export const login = catchAsync(async (req: Request, res: Response) => {
  const { email, password } = req.body as { email: string; password: string };
  const { user, tokens } = await loginUser(email, password);
  setRefreshCookie(res, tokens.refreshToken);
  res
    .status(StatusCodes.OK)
    .json(new ApiResponse(StatusCodes.OK, 'Login successful', { user, tokens }));
});

export const refresh = catchAsync(async (req: Request, res: Response) => {
  const bodyToken = (req.body as { refreshToken?: string }).refreshToken;
  const cookieToken = (req.cookies as Record<string, string | undefined>)[CookieNames.REFRESH_TOKEN];
  const refreshToken = bodyToken ?? cookieToken;

  if (!refreshToken) {
    throw ApiError.unauthorized('Refresh token missing');
  }

  const { user, tokens } = await refreshTokens(refreshToken);
  setRefreshCookie(res, tokens.refreshToken);
  res
    .status(StatusCodes.OK)
    .json(new ApiResponse(StatusCodes.OK, 'Tokens refreshed', { user, tokens }));
});

export const logout = catchAsync(async (req: Request, res: Response) => {
  if (req.user?.id) {
    await logoutUser(req.user.id);
  }
  clearRefreshCookie(res);
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, 'Logged out successfully'));
});

export const forgotPassword = catchAsync(async (req: Request, res: Response) => {
  const { email } = req.body as { email: string };
  const { resetToken } = await requestPasswordReset(email);
  res.status(StatusCodes.OK).json(
    new ApiResponse(
      StatusCodes.OK,
      'If an account exists for this email, a password reset token has been generated',
      { resetToken },
    ),
  );
});

export const resetPassword = catchAsync(async (req: Request, res: Response) => {
  const { token, newPassword } = req.body as { token: string; newPassword: string };
  await resetUserPassword(token, newPassword);
  res
    .status(StatusCodes.OK)
    .json(new ApiResponse(StatusCodes.OK, 'Password reset successfully. You can now sign in.'));
});

export const me = catchAsync(async (req: Request, res: Response) => {
  const user = await getUserProfile(req.user!.id);
  if (!user) {
    throw ApiError.notFound('User not found');
  }
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, 'Profile fetched', user));
});

export const changePassword = catchAsync(async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body as {
    currentPassword: string;
    newPassword: string;
  };
  await changeUserPassword(req.user!.id, currentPassword, newPassword);
  clearRefreshCookie(res);
  res
    .status(StatusCodes.OK)
    .json(new ApiResponse(StatusCodes.OK, 'Password changed successfully. Please log in again.'));
});

export const updateProfile = catchAsync(async (req: Request, res: Response) => {
  const user = await updateMyProfile(req.user!.id, req.body);
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, 'Profile updated successfully', user));
});

export const updateAvatar = catchAsync(async (req: Request, res: Response) => {
  if (!req.file) {
    throw ApiError.badRequest('No image file uploaded');
  }
  const origin = `${req.protocol}://${req.get('host')}`;
  const user = await updateMyAvatar(req.user!.id, `${origin}/uploads/avatars/${req.file.filename}`);
  res
    .status(StatusCodes.OK)
    .json(new ApiResponse(StatusCodes.OK, 'Profile photo updated successfully', user));
});

export const getUsers = catchAsync(async (_req: Request, res: Response) => {
  const users = await listUsers();
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, 'Users fetched successfully', { users }));
});

export const patchUser = catchAsync(async (req: Request, res: Response) => {
  const user = await updateUser(req.params.id, req.body);
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, 'User updated successfully', { user }));
});

export const deleteUser = catchAsync(async (req: Request, res: Response) => {
  await softDeleteUser(req.params.id, req.user!.id);
  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, 'User deleted successfully'));
});

export const tokensResponse = (tokens: TokenPair): TokenPair => tokens;

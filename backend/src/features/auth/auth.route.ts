import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate';
import { requirePermission } from '../../middlewares/requirePermission';
import { authRateLimiter } from '../../middlewares/rate-limiter';
import { avatarUpload } from '../../middlewares/upload';
import { validate } from '../../middlewares/validate';
import * as authController from './auth.controller';
import * as authValidation from './auth.validation';

const router = Router();

router.post('/register', authRateLimiter, validate(authValidation.registerSchema), authController.register);
router.post('/login', authRateLimiter, validate(authValidation.loginSchema), authController.login);
router.post(
  '/forgot-password',
  authRateLimiter,
  validate(authValidation.forgotPasswordSchema),
  authController.forgotPassword,
);
router.post(
  '/reset-password',
  authRateLimiter,
  validate(authValidation.resetPasswordSchema),
  authController.resetPassword,
);
router.post('/refresh', validate(authValidation.refreshTokenSchema), authController.refresh);
router.post('/logout', validate(authValidation.logoutSchema), authController.logout);

router.get('/me', authenticate, authController.me);
router.patch(
  '/profile',
  authenticate,
  validate(authValidation.updateProfileSchema),
  authController.updateProfile,
);
router.post(
  '/avatar',
  authenticate,
  avatarUpload.single('avatar'),
  authController.updateAvatar,
);
router.post(
  '/change-password',
  authenticate,
  validate(authValidation.changePasswordSchema),
  authController.changePassword,
);

router.get('/users', authenticate, requirePermission('users:view'), validate(authValidation.getUsersSchema), authController.getUsers);
router.patch(
  '/users/:id',
  authenticate,
  requirePermission('users:update'),
  validate(authValidation.updateUserSchema),
  authController.patchUser,
);
router.delete(
  '/users/:id',
  authenticate,
  requirePermission('users:delete'),
  validate(authValidation.deleteUserSchema),
  authController.deleteUser,
);

export default router;

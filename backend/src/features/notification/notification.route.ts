import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate';
import { requirePermission } from '../../middlewares/requirePermission';
import { validate } from '../../middlewares/validate';
import * as notificationController from './notification.controller';
import * as notificationValidation from './notification.validation';

const router = Router();

router.use(authenticate);

router.get('/', validate(notificationValidation.getNotificationsSchema), notificationController.getNotifications);
router.patch('/read-all', validate(notificationValidation.markAllReadSchema), notificationController.markAllRead);
router.delete('/clear-all', validate(notificationValidation.clearAllSchema), notificationController.clearAll);

router.get('/:id', validate(notificationValidation.getNotificationSchema), notificationController.getNotification);
router.patch('/:id/read', validate(notificationValidation.markReadSchema), notificationController.markRead);
router.delete('/:id', validate(notificationValidation.deleteNotificationSchema), notificationController.deleteNotification);

router.post('/', requirePermission('notifications:manage'), validate(notificationValidation.createNotificationSchema), notificationController.createNotification);

export default router;

import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate';
import { requirePermission } from '../../middlewares/requirePermission';
import { authRateLimiter } from '../../middlewares/rate-limiter';
import { validate } from '../../middlewares/validate';
import * as invitationController from './invitation.controller';
import * as invitationValidation from './invitation.validation';

const router = Router();

router.get('/:token', authRateLimiter, validate(invitationValidation.invitationTokenParamSchema), invitationController.getInvitationByToken);
router.post('/:token/accept', authRateLimiter, validate(invitationValidation.acceptInvitationSchema), invitationController.acceptInvitation);
router.post('/:token/reject', authRateLimiter, validate(invitationValidation.invitationTokenParamSchema), invitationController.rejectInvitation);

router.use(authenticate);

router.get('/', requirePermission('users:view'), invitationController.getInvitations);
router.post('/', requirePermission('users:invite'), validate(invitationValidation.createInvitationSchema), invitationController.createInvitation);
router.delete('/:id', requirePermission('users:invite'), validate(invitationValidation.idParamSchema), invitationController.cancelInvitation);

export default router;

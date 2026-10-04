import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate';
import { requirePermission } from '../../middlewares/requirePermission';
import { validate } from '../../middlewares/validate';
import * as leaveController from './leave.controller';
import * as leaveValidation from './leave.validation';

const router = Router();

router.use(authenticate);

router.post('/', validate(leaveValidation.createLeaveSchema), leaveController.createLeave);
router.get('/my', validate(leaveValidation.getMyLeavesSchema), leaveController.getMyLeaves);

router.get('/', requirePermission('leaves:view'), validate(leaveValidation.getLeavesSchema), leaveController.getLeaves);
router.get('/:id', requirePermission('leaves:view'), validate(leaveValidation.getLeaveSchema), leaveController.getLeave);
router.patch('/:id', requirePermission('leaves:approve'), validate(leaveValidation.updateLeaveSchema), leaveController.updateLeave);
router.patch('/:id/action', requirePermission('leaves:approve'), validate(leaveValidation.actionLeaveSchema), leaveController.actionLeave);
router.delete('/:id', requirePermission('leaves:approve'), validate(leaveValidation.deleteLeaveSchema), leaveController.deleteLeave);

export default router;

import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate';
import { requirePermission } from '../../middlewares/requirePermission';
import { validate } from '../../middlewares/validate';
import * as reportController from './report.controller';
import * as reportValidation from './report.validation';

const router = Router();

router.use(authenticate);

router.get('/attendance', requirePermission('attendance:view'), validate(reportValidation.getAttendanceReportSchema), reportController.getAttendanceReport);
router.get('/tasks', requirePermission('tasks:view'), validate(reportValidation.getTaskReportSchema), reportController.getTaskReport);
router.get('/hr', requirePermission('reports:view'), validate(reportValidation.getHrReportSchema), reportController.getHrReport);
router.get('/export/:type', requirePermission('reports:export'), validate(reportValidation.exportReportSchema), reportController.exportReport);

export default router;

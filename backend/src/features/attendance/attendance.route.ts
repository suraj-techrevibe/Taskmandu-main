import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate';
import { requirePermission } from '../../middlewares/requirePermission';
import { validate } from '../../middlewares/validate';
import * as attendanceController from './attendance.controller';
import * as attendanceValidation from './attendance.validation';

const router = Router();

router.use(authenticate);

router.post('/check-in', validate(attendanceValidation.checkInSchema), attendanceController.checkIn);
router.post('/check-out', validate(attendanceValidation.checkOutSchema), attendanceController.checkOut);
router.get('/my', validate(attendanceValidation.getMyAttendanceSchema), attendanceController.getMyAttendance);
router.get('/my-stats', validate(attendanceValidation.getMyStatsSchema), attendanceController.getMyStats);
router.get('/my-history', validate(attendanceValidation.getMyHistorySchema), attendanceController.getMyHistory);
router.get('/today-sessions', attendanceController.getTodaySessions);

router.get('/', requirePermission('attendance:view'), validate(attendanceValidation.getAttendancesSchema), attendanceController.getAttendances);
router.get('/:id', requirePermission('attendance:view'), validate(attendanceValidation.getAttendanceSchema), attendanceController.getAttendance);
router.patch('/:id', requirePermission('attendance:manage'), validate(attendanceValidation.updateAttendanceSchema), attendanceController.updateAttendance);
router.delete('/:id', requirePermission('attendance:manage'), validate(attendanceValidation.deleteAttendanceSchema), attendanceController.deleteAttendance);

export default router;

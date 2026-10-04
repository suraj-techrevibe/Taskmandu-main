import { Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import { isDatabaseConnected } from '../config/database';
import { env } from '../config/env';
import authRoutes from '../features/auth/auth.route';
import employeeRoutes from '../features/employee/employee.route';
import rosterRoutes from '../features/roster/roster.route';
import attendanceRoutes from '../features/attendance/attendance.route';
import onboardingRoutes from '../features/onboarding/onboarding.route';
import offboardingRoutes from '../features/offboarding/offboarding.route';
import taskRoutes from '../features/task/task.route';
import leaveRoutes from '../features/leave/leave.route';
import recruitmentRoutes from '../features/recruitment/recruitment.route';
import notificationRoutes from '../features/notification/notification.route';
import noteRoutes from '../features/note/note.route';
import chatRoutes from '../features/chat/chat.route';
import projectRoutes from '../features/project/project.route';
import dashboardRoutes from '../features/dashboard/dashboard.route';
import reportRoutes from '../features/report/report.route';
import roleRoutes from '../features/role/role.route';
import departmentRoutes from '../features/department/department.route';
import invitationRoutes from '../features/invitation/invitation.route';

const router = Router();

router.get('/health', (_req, res) => {
  res.status(StatusCodes.OK).json({
    success: true,
    status: 'ok',
    service: 'taskmandu-api',
    environment: env.NODE_ENV,
    database: isDatabaseConnected() ? 'connected' : 'disconnected',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

router.use('/auth', authRoutes);
router.use('/employees', employeeRoutes);
router.use('/rosters', rosterRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/onboarding', onboardingRoutes);
router.use('/offboarding', offboardingRoutes);
router.use('/tasks', taskRoutes);
router.use('/leaves', leaveRoutes);
router.use('/recruitment', recruitmentRoutes);
router.use('/notifications', notificationRoutes);
router.use('/notes', noteRoutes);
router.use('/chat', chatRoutes);
router.use('/projects', projectRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/reports', reportRoutes);
router.use('/roles', roleRoutes);
router.use('/departments', departmentRoutes);
router.use('/invitations', invitationRoutes);

export default router;

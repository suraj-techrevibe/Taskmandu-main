import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate';
import { validate } from '../../middlewares/validate';
import * as dashboardController from './dashboard.controller';
import * as dashboardValidation from './dashboard.validation';

const router = Router();

router.use(authenticate);

router.get('/summary', validate(dashboardValidation.getDashboardSummarySchema), dashboardController.getSummary);

export default router;

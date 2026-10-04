import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate';
import { requirePermission } from '../../middlewares/requirePermission';
import { validate } from '../../middlewares/validate';
import * as recruitmentController from './recruitment.controller';
import * as recruitmentValidation from './recruitment.validation';

const router = Router();

router.use(authenticate);

// Jobs (declared before `/:id` application routes to avoid path capture)
router.get('/jobs', requirePermission('recruitment:view'), validate(recruitmentValidation.getJobsSchema), recruitmentController.getJobs);
router.get('/jobs/:id', requirePermission('recruitment:view'), validate(recruitmentValidation.getJobSchema), recruitmentController.getJob);
router.post('/jobs', requirePermission('recruitment:manage'), validate(recruitmentValidation.createJobSchema), recruitmentController.createJob);
router.patch('/jobs/:id', requirePermission('recruitment:manage'), validate(recruitmentValidation.updateJobSchema), recruitmentController.updateJob);
router.delete('/jobs/:id', requirePermission('recruitment:manage'), validate(recruitmentValidation.deleteJobSchema), recruitmentController.deleteJob);

// Interviews
router.get('/interviews', requirePermission('recruitment:view'), validate(recruitmentValidation.getInterviewsSchema), recruitmentController.getInterviews);
router.get('/interviews/:id', requirePermission('recruitment:view'), validate(recruitmentValidation.getInterviewSchema), recruitmentController.getInterview);

// Applications
router.get('/', requirePermission('recruitment:view'), validate(recruitmentValidation.getApplicationsSchema), recruitmentController.getApplications);
router.get('/:id', requirePermission('recruitment:view'), validate(recruitmentValidation.getApplicationSchema), recruitmentController.getApplication);

// Write operations restricted to HR and above
router.post('/interviews', requirePermission('recruitment:manage'), validate(recruitmentValidation.createInterviewSchema), recruitmentController.createInterview);
router.patch('/interviews/:id', requirePermission('recruitment:manage'), validate(recruitmentValidation.updateInterviewSchema), recruitmentController.updateInterview);
router.delete('/interviews/:id', requirePermission('recruitment:manage'), validate(recruitmentValidation.deleteInterviewSchema), recruitmentController.deleteInterview);

router.post('/', requirePermission('recruitment:manage'), validate(recruitmentValidation.createApplicationSchema), recruitmentController.createApplication);
router.patch('/:id', requirePermission('recruitment:manage'), validate(recruitmentValidation.updateApplicationSchema), recruitmentController.updateApplication);
router.patch('/:id/stage', requirePermission('recruitment:manage'), validate(recruitmentValidation.updateApplicationStageSchema), recruitmentController.updateApplicationStage);
router.delete('/:id', requirePermission('recruitment:manage'), validate(recruitmentValidation.deleteApplicationSchema), recruitmentController.deleteApplication);

export default router;

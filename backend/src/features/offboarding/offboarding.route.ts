import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate';
import { requirePermission } from '../../middlewares/requirePermission';
import { validate } from '../../middlewares/validate';
import * as offboardingController from './offboarding.controller';
import * as offboardingValidation from './offboarding.validation';

const router = Router();

router.use(authenticate);

router.get('/', requirePermission('offboarding:view'), validate(offboardingValidation.getOffboardingsSchema), offboardingController.getOffboardings);
router.get('/:id', requirePermission('offboarding:view'), validate(offboardingValidation.getOffboardingSchema), offboardingController.getOffboarding);

router.post('/', requirePermission('offboarding:manage'), validate(offboardingValidation.createOffboardingSchema), offboardingController.createOffboarding);
router.patch('/:id', requirePermission('offboarding:manage'), validate(offboardingValidation.updateOffboardingSchema), offboardingController.updateOffboarding);
router.patch('/:id/clearance', requirePermission('offboarding:manage'), validate(offboardingValidation.updateClearanceSchema), offboardingController.updateClearance);
router.post('/:id/archive', requirePermission('offboarding:manage'), validate(offboardingValidation.archiveOffboardingSchema), offboardingController.archiveEmployee);
router.delete('/:id', requirePermission('offboarding:manage'), validate(offboardingValidation.deleteOffboardingSchema), offboardingController.deleteOffboarding);

export default router;

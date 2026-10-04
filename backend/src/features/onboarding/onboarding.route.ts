import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate';
import { requirePermission } from '../../middlewares/requirePermission';
import { authRateLimiter } from '../../middlewares/rate-limiter';
import { validate } from '../../middlewares/validate';
import * as onboardingController from './onboarding.controller';
import * as onboardingValidation from './onboarding.validation';

const router = Router();

// Public onboarding decision endpoints (accept / reject invite)
router.get(
  '/decision/:token',
  authRateLimiter,
  validate(onboardingValidation.getOnboardingDecisionSchema),
  onboardingController.getOnboardingDecision,
);
router.post(
  '/decision/:token/accept',
  authRateLimiter,
  validate(onboardingValidation.acceptOnboardingDecisionSchema),
  onboardingController.acceptOnboarding,
);

router.use(authenticate, requirePermission('onboarding:manage'));

router.get('/', validate(onboardingValidation.getOnboardingsSchema), onboardingController.getOnboardings);
router.get('/:id', validate(onboardingValidation.getOnboardingSchema), onboardingController.getOnboarding);

router.post('/', validate(onboardingValidation.createOnboardingSchema), onboardingController.createOnboarding);
router.patch('/:id', validate(onboardingValidation.updateOnboardingSchema), onboardingController.updateOnboarding);
router.patch('/:id/step', validate(onboardingValidation.advanceStepSchema), onboardingController.advanceStep);
router.post('/:id/activate', validate(onboardingValidation.activateOnboardingSchema), onboardingController.activateOnboarding);
router.delete('/:id', validate(onboardingValidation.deleteOnboardingSchema), onboardingController.deleteOnboarding);

export default router;
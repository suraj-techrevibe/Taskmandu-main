import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate';
import { requirePermission } from '../../middlewares/requirePermission';
import { validate } from '../../middlewares/validate';
import * as rosterController from './roster.controller';
import * as rosterValidation from './roster.validation';

const router = Router();

router.use(authenticate);

router.get('/', requirePermission('rosters:view'), validate(rosterValidation.getRostersSchema), rosterController.getRosters);
router.get('/:id', requirePermission('rosters:view'), validate(rosterValidation.getRosterSchema), rosterController.getRoster);

router.post('/', requirePermission('rosters:manage'), validate(rosterValidation.createRosterSchema), rosterController.createRoster);
router.post('/copy', requirePermission('rosters:manage'), validate(rosterValidation.copyRostersSchema), rosterController.copyRosters);
router.patch('/:id', requirePermission('rosters:manage'), validate(rosterValidation.updateRosterSchema), rosterController.updateRoster);
router.delete('/:id', requirePermission('rosters:manage'), validate(rosterValidation.deleteRosterSchema), rosterController.deleteRoster);

export default router;

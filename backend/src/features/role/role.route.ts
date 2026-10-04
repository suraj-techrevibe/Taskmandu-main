import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate';
import { requirePermission } from '../../middlewares/requirePermission';
import { validate } from '../../middlewares/validate';
import * as roleController from './role.controller';
import * as roleValidation from './role.validation';

const router = Router();

router.use(authenticate);

router.get('/permissions', requirePermission('roles:view'), roleController.getPermissionCatalog);
router.get('/', requirePermission('roles:view'), roleController.getRoles);
router.post('/', requirePermission('roles:create'), validate(roleValidation.createRoleSchema), roleController.createRole);
router.patch('/:id', requirePermission('roles:update'), validate(roleValidation.updateRoleSchema), roleController.updateRole);
router.delete('/:id', requirePermission('roles:delete'), validate(roleValidation.idParamSchema), roleController.deleteRole);

export default router;

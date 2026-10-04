import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate';
import { requirePermission } from '../../middlewares/requirePermission';
import { validate } from '../../middlewares/validate';
import * as departmentController from './department.controller';
import * as departmentValidation from './department.validation';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  requirePermission('departments:view'),
  validate(departmentValidation.getDepartmentsSchema),
  departmentController.getDepartments,
);
router.post(
  '/',
  requirePermission('departments:manage'),
  validate(departmentValidation.createDepartmentSchema),
  departmentController.createDepartment,
);
router.patch(
  '/:id',
  requirePermission('departments:manage'),
  validate(departmentValidation.updateDepartmentSchema),
  departmentController.updateDepartment,
);
router.delete(
  '/:id',
  requirePermission('departments:manage'),
  validate(departmentValidation.deleteDepartmentSchema),
  departmentController.deleteDepartment,
);

export default router;

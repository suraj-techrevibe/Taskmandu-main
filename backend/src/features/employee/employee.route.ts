import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate';
import { requirePermission } from '../../middlewares/requirePermission';
import { validate } from '../../middlewares/validate';
import * as employeeController from './employee.controller';
import * as employeeValidation from './employee.validation';

const router = Router();

router.use(authenticate);

router.get('/', requirePermission('employees:view'), validate(employeeValidation.getEmployeesSchema), employeeController.getEmployees);
router.get('/departments', requirePermission('employees:view'), employeeController.getDepartments);
router.get('/:id', requirePermission('employees:view'), validate(employeeValidation.getEmployeeSchema), employeeController.getEmployee);

router.post('/', requirePermission('employees:create'), validate(employeeValidation.createEmployeeSchema), employeeController.createEmployee);
router.patch('/:id', requirePermission('employees:update'), validate(employeeValidation.updateEmployeeSchema), employeeController.updateEmployee);
router.patch('/:id/status', requirePermission('employees:update'), validate(employeeValidation.updateEmployeeStatusSchema), employeeController.updateEmployeeStatus);
router.delete('/:id', requirePermission('employees:delete'), validate(employeeValidation.deleteEmployeeSchema), employeeController.deleteEmployee);

export default router;

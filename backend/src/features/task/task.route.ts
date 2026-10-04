import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate';
import { requirePermission } from '../../middlewares/requirePermission';
import { validate } from '../../middlewares/validate';
import * as taskController from './task.controller';
import * as taskValidation from './task.validation';

const router = Router();

router.use(authenticate);

router.get('/', requirePermission('tasks:view'), validate(taskValidation.getTasksSchema), taskController.getTasks);
router.get('/:id', requirePermission('tasks:view'), validate(taskValidation.getTaskSchema), taskController.getTask);

router.post('/', requirePermission('tasks:create'), validate(taskValidation.createTaskSchema), taskController.createTask);
router.patch('/:id', requirePermission('tasks:update'), validate(taskValidation.updateTaskSchema), taskController.updateTask);
router.patch('/:id/status', requirePermission('tasks:update'), validate(taskValidation.updateTaskStatusSchema), taskController.updateTaskStatus);
router.post('/:id/comments', requirePermission('tasks:update'), validate(taskValidation.addCommentSchema), taskController.addComment);
router.delete('/:id', requirePermission('tasks:delete'), validate(taskValidation.deleteTaskSchema), taskController.deleteTask);

export default router;

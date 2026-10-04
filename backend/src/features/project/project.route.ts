import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate';
import { requirePermission } from '../../middlewares/requirePermission';
import { requireProjectMember } from '../../middlewares/requireProjectMember';
import { validate } from '../../middlewares/validate';
import { projectFileUpload } from '../../middlewares/upload';
import * as projectController from './project.controller';
import * as projectValidation from './project.validation';

const router = Router();

router.use(authenticate);

router.get('/', requirePermission('projects:view'), validate(projectValidation.getProjectsSchema), projectController.getProjects);
router.get('/:id', requirePermission('projects:view'), validate(projectValidation.getProjectSchema), projectController.getProject);

router.post('/', requirePermission('projects:create'), validate(projectValidation.createProjectSchema), projectController.createProject);
router.patch('/:id', requirePermission('projects:update'), validate(projectValidation.updateProjectSchema), projectController.updateProject);
router.delete('/:id', requirePermission('projects:delete'), validate(projectValidation.deleteProjectSchema), projectController.deleteProject);

router.post('/:id/documents', requirePermission('projects:update'), projectFileUpload.single('file'), projectController.addDocument);
router.patch('/:id/documents/:subId', requirePermission('projects:update'), validate(projectValidation.updateDocumentSchema), projectController.updateDocument);
router.delete('/:id/documents/:subId', requirePermission('projects:update'), validate(projectValidation.deleteDocumentSchema), projectController.deleteDocument);

router.post('/:id/variables', requirePermission('projects:update'), validate(projectValidation.addVariableSchema), projectController.addVariable);
router.patch('/:id/variables/:subId', requirePermission('projects:update'), validate(projectValidation.updateVariableSchema), projectController.updateVariable);
router.delete('/:id/variables/:subId', requirePermission('projects:update'), validate(projectValidation.deleteVariableSchema), projectController.deleteVariable);

router.post('/:id/tasks', requirePermission('projects:update'), validate(projectValidation.addTaskSchema), projectController.addTask);
router.patch('/:id/tasks/:subId', requirePermission('projects:update'), validate(projectValidation.updateTaskSchema), projectController.updateTask);
router.post('/:id/tasks/:subId/comments', requirePermission('projects:update'), validate(projectValidation.addCommentSchema), projectController.addComment);
router.delete('/:id/tasks/:subId', requirePermission('projects:update'), validate(projectValidation.deleteTaskSchema), projectController.deleteTask);

router.post('/:id/tasks/:subId/subtasks', requirePermission('projects:update'), validate(projectValidation.addSubTaskSchema), projectController.addSubTask);
router.patch('/:id/tasks/:subId/subtasks/:subSubId', requirePermission('projects:update'), validate(projectValidation.updateSubTaskSchema), projectController.updateSubTask);
router.post('/:id/tasks/:subId/subtasks/:subSubId/comments', requirePermission('projects:update'), validate(projectValidation.addSubTaskCommentSchema), projectController.addSubTaskComment);
router.delete('/:id/tasks/:subId/subtasks/:subSubId', requirePermission('projects:update'), validate(projectValidation.deleteSubTaskSchema), projectController.deleteSubTask);

router.get('/:id/members', requirePermission('projects:view'), validate(projectValidation.getProjectSchema), projectController.listMembers);
router.post('/:id/members', requireProjectMember, validate(projectValidation.addMemberSchema), projectController.addMember);
router.delete('/:id/members/:subId', requireProjectMember, validate(projectValidation.removeMemberSchema), projectController.removeMember);

export default router;

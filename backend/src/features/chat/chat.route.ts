import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate';
import { requirePermission } from '../../middlewares/requirePermission';
import { validate } from '../../middlewares/validate';
import * as chatController from './chat.controller';
import * as chatValidation from './chat.validation';

const router = Router();

router.use(authenticate);

router.get('/', validate(chatValidation.getGroupsSchema), chatController.getGroups);
router.get('/:id', validate(chatValidation.getGroupSchema), chatController.getGroup);
router.get('/:id/messages', validate(chatValidation.getMessagesSchema), chatController.getMessages);
router.post('/:id/messages', validate(chatValidation.sendMessageSchema), chatController.sendMessage);
router.post('/:id/join', validate(chatValidation.joinGroupSchema), chatController.joinGroup);
router.post('/:id/leave', validate(chatValidation.leaveGroupSchema), chatController.leaveGroup);
router.patch('/messages/:messageId', validate(chatValidation.editMessageSchema), chatController.editMessage);
router.delete('/messages/:messageId', validate(chatValidation.deleteMessageSchema), chatController.deleteMessage);

router.delete('/:id', requirePermission('chat:manage'), validate(chatValidation.deleteGroupSchema), chatController.deleteGroup);
router.post('/', requirePermission('chat:manage'), validate(chatValidation.createGroupSchema), chatController.createGroup);
router.patch('/:id', requirePermission('chat:manage'), validate(chatValidation.updateGroupSchema), chatController.updateGroup);

export default router;

import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate';
import { requirePermission } from '../../middlewares/requirePermission';
import { validate } from '../../middlewares/validate';
import * as noteController from './note.controller';
import * as noteValidation from './note.validation';

const router = Router();

router.use(authenticate);

router.get('/', requirePermission('notes:view'), validate(noteValidation.getNotesSchema), noteController.getNotes);
router.get('/:id', requirePermission('notes:view'), validate(noteValidation.getNoteSchema), noteController.getNote);

router.post('/', requirePermission('notes:manage'), validate(noteValidation.createNoteSchema), noteController.createNote);
router.patch('/:id', requirePermission('notes:manage'), validate(noteValidation.updateNoteSchema), noteController.updateNote);
router.delete('/:id', requirePermission('notes:manage'), validate(noteValidation.deleteNoteSchema), noteController.deleteNote);

export default router;

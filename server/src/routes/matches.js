import { Router } from 'express';
import { body } from 'express-validator';
import { requireAuth } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { handleValidation } from '../middleware/validate.js';
import * as ctrl from '../controllers/matchController.js';

const router = Router();

router.get('/', ctrl.list);
router.get('/:id', ctrl.getById);

router.post(
  '/',
  requireAuth,
  upload.single('opponentLogo'),
  body('opponent').isString().trim().notEmpty().withMessage('Nasprotnik je obvezen.'),
  body('date').notEmpty().withMessage('Datum je obvezen.'),
  handleValidation,
  ctrl.create
);

router.put('/:id', requireAuth, upload.single('opponentLogo'), ctrl.update);
router.delete('/:id', requireAuth, ctrl.remove);

export default router;

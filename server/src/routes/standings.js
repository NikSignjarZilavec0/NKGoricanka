import { Router } from 'express';
import { body } from 'express-validator';
import { requireAuth } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { handleValidation } from '../middleware/validate.js';
import * as ctrl from '../controllers/standingController.js';

const router = Router();

router.get('/', ctrl.list);

router.post(
  '/',
  requireAuth,
  upload.single('teamLogo'),
  body('season').isString().trim().notEmpty().withMessage('Sezona je obvezna.'),
  body('team').isString().trim().notEmpty().withMessage('Ekipa je obvezna.'),
  handleValidation,
  ctrl.create
);

router.put('/:id', requireAuth, upload.single('teamLogo'), ctrl.update);
router.delete('/:id', requireAuth, ctrl.remove);

export default router;

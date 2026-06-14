import { Router } from 'express';
import { body } from 'express-validator';
import { requireAuth } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { handleValidation } from '../middleware/validate.js';
import { POSITIONS } from '../models/Player.js';
import * as ctrl from '../controllers/playerController.js';

const router = Router();

router.get('/', ctrl.list);
router.get('/:id', ctrl.getById);

router.post(
  '/',
  requireAuth,
  upload.single('photo'),
  body('name').isString().trim().notEmpty().withMessage('Ime je obvezno.'),
  body('position').isIn(POSITIONS).withMessage('Neveljavna pozicija.'),
  handleValidation,
  ctrl.create
);

router.put('/:id', requireAuth, upload.single('photo'), ctrl.update);
router.delete('/:id', requireAuth, ctrl.remove);

export default router;

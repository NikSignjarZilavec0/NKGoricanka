import { Router } from 'express';
import { body } from 'express-validator';
import { requireAuth } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { handleValidation } from '../middleware/validate.js';
import * as ctrl from '../controllers/newsController.js';

const router = Router();

// Public
router.get('/', ctrl.listPublished);

// Admin — declared before "/:slug" so they are not captured as a slug
router.get('/admin/all', requireAuth, ctrl.listAll);
router.get('/admin/:id', requireAuth, ctrl.getById);

router.post(
  '/',
  requireAuth,
  upload.single('coverImage'),
  body('title').isString().trim().notEmpty().withMessage('Naslov je obvezen.'),
  body('content').isString().trim().notEmpty().withMessage('Vsebina je obvezna.'),
  handleValidation,
  ctrl.create
);

router.put('/:id', requireAuth, upload.single('coverImage'), ctrl.update);
router.delete('/:id', requireAuth, ctrl.remove);

// Public single (slug) — keep last
router.get('/:slug', ctrl.getBySlug);

export default router;

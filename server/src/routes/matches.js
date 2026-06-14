import { Router } from 'express';
import { body } from 'express-validator';
import { requireAuth } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { handleValidation } from '../middleware/validate.js';
import * as ctrl from '../controllers/matchController.js';

const router = Router();

// Public: real-time stream of match updates (must precede "/:id").
router.get('/stream', ctrl.stream);

router.get('/', ctrl.list);
router.get('/:id', ctrl.getById);

// Live update from a contributor (auth via live key OR admin session — handled in controller).
router.patch('/:id/live', ctrl.liveUpdate);

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
router.post('/:id/live-key', requireAuth, ctrl.generateLiveKey);
router.delete('/:id', requireAuth, ctrl.remove);

export default router;

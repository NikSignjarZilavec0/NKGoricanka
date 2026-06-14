import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import * as ctrl from '../controllers/clubController.js';

const router = Router();

router.get('/', ctrl.get);
router.put(
  '/',
  requireAuth,
  upload.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'teamPhoto', maxCount: 1 },
  ]),
  ctrl.update
);

export default router;

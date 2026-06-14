import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import * as ctrl from '../controllers/clubController.js';

const router = Router();

router.get('/', ctrl.get);
router.put('/', requireAuth, upload.single('logo'), ctrl.update);

export default router;

import { Router } from 'express';
import authRoutes from './auth.js';
import newsRoutes from './news.js';
import playerRoutes from './players.js';
import matchRoutes from './matches.js';
import clubRoutes from './club.js';
import standingRoutes from './standings.js';
import { seasons } from '../controllers/clubController.js';

const router = Router();

router.get('/health', (req, res) => res.json({ ok: true }));
router.get('/seasons', seasons);
router.use('/auth', authRoutes);
router.use('/news', newsRoutes);
router.use('/players', playerRoutes);
router.use('/matches', matchRoutes);
router.use('/club', clubRoutes);
router.use('/standings', standingRoutes);

export default router;

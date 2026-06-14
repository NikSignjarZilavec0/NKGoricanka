import { Router } from 'express';
import { body } from 'express-validator';
import { handleValidation } from '../middleware/validate.js';
import { login, logout, me } from '../controllers/authController.js';

const router = Router();

router.post(
  '/login',
  body('username').isString().trim().notEmpty().withMessage('Uporabniško ime je obvezno.'),
  body('password').isString().notEmpty().withMessage('Geslo je obvezno.'),
  handleValidation,
  login
);

router.post('/logout', logout);
router.get('/me', me);

export default router;

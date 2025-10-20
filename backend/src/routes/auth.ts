import { Router } from 'express';
import {
  login,
  register,
  refreshAccessToken,
  logout,
  getCurrentUser,
} from '../controllers/auth';
import { validateLogin, validateRegister } from '../middlewares/validations';
import auth from '../middlewares/auth';

const router = Router();

router.post('/login', validateLogin, login);
router.post('/register', validateRegister, register);
router.get('/token', refreshAccessToken);
router.get('/logout', auth, logout);
router.get('/user', auth, getCurrentUser);

export default router;

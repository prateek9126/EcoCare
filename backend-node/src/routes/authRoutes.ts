import { Router } from 'express';
import { authController } from '../controllers/authController.js';

const router = Router();

router.post('/send-otp', (req, res) => authController.sendOtp(req, res));
router.post('/register', (req, res) => authController.register(req, res));
router.post('/login', (req, res) => authController.login(req, res));

export default router;

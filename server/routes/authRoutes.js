import express from 'express';
import {
    registerController,
    loginController,
    sendOtpController,
    getUserProfile,
} from '../controllers/authController.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import { authLimiter } from '../middlewares/rateLimiter.js';

const router = express.Router();

router.post('/send-otp', authLimiter, sendOtpController);
router.post('/register', authLimiter, registerController);
router.post('/login', authLimiter, loginController);

router.get('/me', authMiddleware, getUserProfile);

export default router;

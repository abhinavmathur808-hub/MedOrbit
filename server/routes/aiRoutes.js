import express from 'express';
import { getHealthAdvice } from '../controllers/aiController.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import { aiLimiter } from '../middlewares/rateLimiter.js';

const router = express.Router();

router.post('/analyze', authMiddleware, aiLimiter, getHealthAdvice);

export default router;
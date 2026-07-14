import express from 'express';
import { getHealthAdvice, generateSoapNote, getSoapDraft } from '../controllers/aiController.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import doctorMiddleware from '../middlewares/doctorMiddleware.js';
import { aiLimiter } from '../middlewares/rateLimiter.js';

const router = express.Router();

router.post('/analyze', authMiddleware, aiLimiter, getHealthAdvice);

// AI medical scribe — doctor-only. Generation is rate-limited (Gemini call);
// fetching the stored draft is a cheap Redis read.
router.post('/soap', authMiddleware, doctorMiddleware, aiLimiter, generateSoapNote);
router.get('/soap/:appointmentId', authMiddleware, doctorMiddleware, getSoapDraft);

export default router;
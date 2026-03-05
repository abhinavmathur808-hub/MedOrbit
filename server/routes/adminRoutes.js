import express from 'express';
import { verifyDoctor, getUnverifiedDoctors, getAllDoctors, getDashboardStats, getRecentActivity } from '../controllers/adminController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();

const adminMiddleware = (req, res, next) => {
    if (req.userRole !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Admin only.',
        });
    }
    next();
};

router.get('/stats', authMiddleware, adminMiddleware, getDashboardStats);

router.get('/recent-activity', authMiddleware, adminMiddleware, getRecentActivity);

router.get('/doctors', authMiddleware, adminMiddleware, getAllDoctors);

router.put('/verify-doctor', authMiddleware, adminMiddleware, verifyDoctor);

router.get('/unverified-doctors', authMiddleware, adminMiddleware, getUnverifiedDoctors);

export default router;


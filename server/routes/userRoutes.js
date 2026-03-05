import express from 'express';
import { getProfile, updateProfile, getUserAppointments, addMedicalHistory } from '../controllers/userController.js';
import { cancelAppointment } from '../controllers/appointmentController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/profile', authMiddleware, getProfile);

router.put('/update-profile', authMiddleware, updateProfile);

router.post('/medical-history', authMiddleware, addMedicalHistory);

router.get('/appointments', authMiddleware, getUserAppointments);

router.post('/cancel-appointment', authMiddleware, cancelAppointment);

export default router;

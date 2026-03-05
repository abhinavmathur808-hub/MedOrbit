import express from 'express';
import {
    getDoctorProfile,
    updateDoctorProfile,
    getAllDoctors,
    getDoctorById,
    addReview,
    addPrescription,
    getPrescription,
    getRelatedDoctors,
} from '../controllers/doctorController.js';
import { cancelAppointment } from '../controllers/appointmentController.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import doctorMiddleware from '../middlewares/doctorMiddleware.js';

const router = express.Router();

router.get('/', getAllDoctors);

router.get('/profile', authMiddleware, getDoctorProfile);

router.put('/profile', authMiddleware, doctorMiddleware, updateDoctorProfile);

router.post('/add-review', authMiddleware, addReview);

router.post('/prescription', authMiddleware, doctorMiddleware, addPrescription);

router.get('/prescription/:appointmentId', authMiddleware, getPrescription);

router.get('/related', getRelatedDoctors);

router.get('/:id', getDoctorById);

router.post('/cancel-appointment', authMiddleware, doctorMiddleware, cancelAppointment);

export default router;


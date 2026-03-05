import express from 'express';
import {
    getMyAppointments,
    createAppointment,
    getDoctorAppointments,
    updateAppointmentStatus,
} from '../controllers/appointmentController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/', authMiddleware, getMyAppointments);

router.post('/', authMiddleware, createAppointment);

router.get('/doctor', authMiddleware, getDoctorAppointments);

router.put('/:id', authMiddleware, updateAppointmentStatus);

export default router;

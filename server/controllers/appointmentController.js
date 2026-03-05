import Appointment from '../models/Appointment.js';
import Doctor from '../models/Doctor.js';
import User from '../models/User.js';
import Prescription from '../models/Prescription.js';
import nodemailer from 'nodemailer';
import { escapeHtml } from '../utils/escapeHtml.js';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.PAYMENT_EMAIL_USER,
        pass: process.env.PAYMENT_EMAIL_PASS,
    },
});

const sendAppointmentEmails = async (doctorEmail, doctorName, patientEmail, patientName, date, slotTime) => {
    try {
        const formattedDate = new Date(date).toLocaleDateString('en-IN', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });

        const doctorMailOptions = {
            from: process.env.PAYMENT_EMAIL_USER,
            to: doctorEmail,
            subject: '🏥 New Appointment Request - MedOrbit',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: linear-gradient(to right, #f43f5e, #8b5cf6); padding: 20px; text-align: center;">
                        <h1 style="color: white; margin: 0;">MedOrbit</h1>
                    </div>
                    <div style="padding: 30px; background: #fff;">
                        <h2 style="color: #333;">Hello Dr. ${escapeHtml(doctorName)},</h2>
                        <p style="color: #666; font-size: 16px;">You have a new appointment request!</p>
                        <div style="background: #f9fafb; padding: 20px; border-radius: 10px; margin: 20px 0;">
                            <p style="margin: 10px 0;"><strong>Patient:</strong> ${escapeHtml(patientName)}</p>
                            <p style="margin: 10px 0;"><strong>Date:</strong> ${formattedDate}</p>
                            <p style="margin: 10px 0;"><strong>Time:</strong> ${escapeHtml(slotTime)}</p>
                            <p style="margin: 10px 0;"><strong>Status:</strong> <span style="color: #f59e0b;">Pending Approval</span></p>
                        </div>
                        <p style="color: #666;">Please log in to your dashboard to approve or reschedule this appointment.</p>
                    </div>
                    <div style="background: #1f2937; padding: 15px; text-align: center;">
                        <p style="color: #9ca3af; margin: 0; font-size: 12px;">© 2026 MedOrbit. All rights reserved.</p>
                    </div>
                </div>
            `,
        };

        const patientMailOptions = {
            from: process.env.PAYMENT_EMAIL_USER,
            to: patientEmail,
            subject: '✅ Appointment Booked - MedOrbit',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: linear-gradient(to right, #f43f5e, #8b5cf6); padding: 20px; text-align: center;">
                        <h1 style="color: white; margin: 0;">MedOrbit</h1>
                    </div>
                    <div style="padding: 30px; background: #fff;">
                        <h2 style="color: #333;">Hello ${escapeHtml(patientName)},</h2>
                        <p style="color: #666; font-size: 16px;">Your appointment has been successfully booked!</p>
                        <div style="background: #f9fafb; padding: 20px; border-radius: 10px; margin: 20px 0;">
                            <p style="margin: 10px 0;"><strong>Doctor:</strong> Dr. ${escapeHtml(doctorName)}</p>
                            <p style="margin: 10px 0;"><strong>Date:</strong> ${formattedDate}</p>
                            <p style="margin: 10px 0;"><strong>Time:</strong> ${escapeHtml(slotTime)}</p>
                            <p style="margin: 10px 0;"><strong>Status:</strong> <span style="color: #f59e0b;">Awaiting Doctor Confirmation</span></p>
                        </div>
                        <p style="color: #666;">You will receive a confirmation email once the doctor approves your appointment.</p>
                    </div>
                    <div style="background: #1f2937; padding: 15px; text-align: center;">
                        <p style="color: #9ca3af; margin: 0; font-size: 12px;">© 2026 MedOrbit. All rights reserved.</p>
                    </div>
                </div>
            `,
        };

        await transporter.sendMail(doctorMailOptions);

        await transporter.sendMail(patientMailOptions);

    } catch (error) {
    }
};

export const getMyAppointments = async (req, res) => {
    try {
        const userId = req.userId;
        const userRole = req.userRole;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID not found',
            });
        }

        let appointments = [];
        let formattedAppointments = [];

        if (userRole === 'doctor') {
            appointments = await Appointment.find({ doctorId: userId })
                .populate({
                    path: 'patientId',
                    select: 'name email phone photo',
                })
                .sort({ date: -1 });

            formattedAppointments = appointments.map((appt) => ({
                _id: appt._id,
                patientName: appt.patientId?.name || 'Patient',
                patientEmail: appt.patientId?.email || '',
                patientPhone: appt.patientId?.phone || '',
                patientPhoto: appt.patientId?.photo || '',
                date: appt.date,
                slotTime: appt.slotTime,
                status: appt.status,
                paymentStatus: appt.paymentStatus,
                createdAt: appt.createdAt,
                isDoctor: true,
            }));
        } else {
            appointments = await Appointment.find({ patientId: userId })
                .populate({
                    path: 'doctorId',
                    select: 'name email phone photo',
                })
                .sort({ date: -1 });

            formattedAppointments = await Promise.all(
                appointments.map(async (appt) => {
                    const doctorProfile = await Doctor.findOne({ userId: appt.doctorId?._id });

                    return {
                        _id: appt._id,
                        doctorName: appt.doctorId?.name || 'Doctor',
                        doctorEmail: appt.doctorId?.email || '',
                        doctorPhone: appt.doctorId?.phone || '',
                        doctorPhoto: appt.doctorId?.photo || '',
                        specialization: doctorProfile?.specialization || 'General',
                        date: appt.date,
                        slotTime: appt.slotTime,
                        status: appt.status,
                        paymentStatus: appt.paymentStatus,
                        createdAt: appt.createdAt,
                        isDoctor: false,
                    };
                })
            );

            const appointmentIds = formattedAppointments.map(a => a._id);
            const prescriptions = await Prescription.find({ appointmentId: { $in: appointmentIds } }).select('appointmentId');
            const prescribedSet = new Set(prescriptions.map(p => p.appointmentId.toString()));

            formattedAppointments = formattedAppointments.map(a => ({
                ...a,
                hasPrescription: prescribedSet.has(a._id.toString()),
            }));
        }

        res.status(200).json({
            success: true,
            count: formattedAppointments.length,
            appointments: formattedAppointments,
            role: userRole,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error fetching appointments',
        });
    }
};

export const createAppointment = async (req, res) => {
    try {
        const patientId = req.userId;
        const { doctorId, date, slotTime, reason, paymentId, orderId } = req.body;

        if (!patientId || !doctorId || !date || !slotTime) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: doctorId, date, slotTime',
            });
        }

        const existingAppointment = await Appointment.findOne({
            doctorId,
            date: new Date(date),
            slotTime,
            status: { $ne: 'cancelled' },
        });

        if (existingAppointment) {
            return res.status(400).json({
                success: false,
                message: 'This time slot is already booked',
            });
        }

        const [y, m, d] = date.split('-');
        const slotDateKey = `${parseInt(d)}_${parseInt(m)}_${y}`;

        let doctorData = await Doctor.findOne({ userId: doctorId });
        if (!doctorData) {
            doctorData = await Doctor.findById(doctorId);
        }
        if (doctorData) {
            const slotsForDate = doctorData.slots_booked?.[slotDateKey] || [];
            if (slotsForDate.includes(slotTime)) {
                return res.status(400).json({
                    success: false,
                    message: 'Slot not available',
                });
            }
        }

        const appointment = new Appointment({
            patientId,
            doctorId,
            date: new Date(date),
            slotTime,
            status: 'pending',
            paymentStatus: !!paymentId,
        });

        await appointment.save();

        let updateResult = await Doctor.findOneAndUpdate(
            { userId: doctorId },
            { $push: { [`slots_booked.${slotDateKey}`]: slotTime } },
            { new: true }
        );

        if (!updateResult) {
            updateResult = await Doctor.findByIdAndUpdate(
                doctorId,
                { $push: { [`slots_booked.${slotDateKey}`]: slotTime } },
                { new: true }
            );
        }




        const patient = await User.findById(patientId);
        const doctor = await User.findById(doctorId);

        if (doctor?.email && patient?.email) {
            sendAppointmentEmails(
                doctor.email,
                doctor.name,
                patient.email,
                patient.name,
                date,
                slotTime
            );
        }

        res.status(201).json({
            success: true,
            message: 'Appointment booked successfully',
            appointment,
        });
    } catch (error) {

        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'This time slot is already booked',
            });
        }

        res.status(500).json({
            success: false,
            message: 'Server error creating appointment',
        });
    }
};

export const getDoctorAppointments = async (req, res) => {
    try {
        const doctorUserId = req.userId;

        const appointments = await Appointment.find({ doctorId: doctorUserId })
            .populate({
                path: 'patientId',
                select: 'name email phone',
            })
            .sort({ date: -1 });

        res.status(200).json({
            success: true,
            count: appointments.length,
            appointments,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error fetching appointments',
        });
    }
};

export const updateAppointmentStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const userId = req.userId;

        const allowedStatuses = ['pending', 'confirmed', 'cancelled', 'completed'];
        if (!status || !allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Invalid status. Allowed values: ${allowedStatuses.join(', ')}`,
            });
        }

        const appointment = await Appointment.findById(id);

        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: 'Appointment not found',
            });
        }

        const isDoctorOfAppt = appointment.doctorId.toString() === userId.toString();
        const isPatientOfAppt = appointment.patientId.toString() === userId.toString();

        if (!isDoctorOfAppt && !isPatientOfAppt) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to update this appointment',
            });
        }

        appointment.status = status;
        await appointment.save();

        res.status(200).json({
            success: true,
            message: 'Appointment status updated',
            appointment,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error updating appointment',
        });
    }
};

const sendCancellationEmail = async (recipientEmail, recipientName, cancellerRole, cancellerName, date, slotTime, reason) => {
    try {
        const formattedDate = new Date(date).toLocaleDateString('en-IN', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });

        const cancelledBy = cancellerRole === 'doctor'
            ? `Dr. ${cancellerName}`
            : cancellerName;

        const mailOptions = {
            from: process.env.PAYMENT_EMAIL_USER,
            to: recipientEmail,
            subject: '❌ Appointment Cancelled - MedOrbit',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: linear-gradient(to right, #f43f5e, #8b5cf6); padding: 20px; text-align: center;">
                        <h1 style="color: white; margin: 0;">MedOrbit</h1>
                    </div>
                    <div style="padding: 30px; background: #fff;">
                        <h2 style="color: #333;">Hello ${escapeHtml(recipientName)},</h2>
                        <p style="color: #666; font-size: 16px;">An appointment has been cancelled.</p>
                        <div style="background: #fef2f2; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #ef4444;">
                            <p style="margin: 10px 0;"><strong>Cancelled By:</strong> ${escapeHtml(cancelledBy)}</p>
                            <p style="margin: 10px 0;"><strong>Date:</strong> ${formattedDate}</p>
                            <p style="margin: 10px 0;"><strong>Time:</strong> ${escapeHtml(slotTime)}</p>
                            <p style="margin: 10px 0;"><strong>Status:</strong> <span style="color: #ef4444;">Cancelled</span></p>
                            ${reason ? `<p style="margin: 10px 0;"><strong>Reason:</strong> ${escapeHtml(reason)}</p>` : ''}
                        </div>
                        <p style="color: #666;">If you have any questions, please contact support.</p>
                    </div>
                    <div style="background: #1f2937; padding: 15px; text-align: center;">
                        <p style="color: #9ca3af; margin: 0; font-size: 12px;">© 2026 MedOrbit. All rights reserved.</p>
                    </div>
                </div>
            `,
        };

        await transporter.sendMail(mailOptions);
    } catch (error) {
    }
};

export const cancelAppointment = async (req, res) => {
    try {
        const userId = req.userId;
        const { appointmentId, reason } = req.body;

        if (!appointmentId) {
            return res.status(400).json({
                success: false,
                message: 'Appointment ID is required',
            });
        }

        const appointment = await Appointment.findById(appointmentId);

        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: 'Appointment not found',
            });
        }

        const isDoctorOfAppt = appointment.doctorId.toString() === userId.toString();
        const isPatientOfAppt = appointment.patientId.toString() === userId.toString();

        if (!isDoctorOfAppt && !isPatientOfAppt) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to cancel this appointment',
            });
        }

        if (appointment.status === 'cancelled') {
            return res.status(400).json({
                success: false,
                message: 'Appointment is already cancelled',
            });
        }
        if (appointment.status === 'completed') {
            return res.status(400).json({
                success: false,
                message: 'Cannot cancel a completed appointment',
            });
        }

        appointment.status = 'cancelled';
        await appointment.save();

        const cancelDate = appointment.date;
        const cancelDateKey = `${cancelDate.getDate()}_${cancelDate.getMonth() + 1}_${cancelDate.getFullYear()}`;
        await Doctor.findOneAndUpdate(
            { userId: appointment.doctorId },
            { $pull: { [`slots_booked.${cancelDateKey}`]: appointment.slotTime } }
        );

        const patient = await User.findById(appointment.patientId);
        const doctor = await User.findById(appointment.doctorId);

        if (isPatientOfAppt && doctor?.email) {
            sendCancellationEmail(
                doctor.email,
                doctor.name,
                'patient',
                patient?.name || 'Patient',
                appointment.date,
                appointment.slotTime,
                reason
            );
        } else if (isDoctorOfAppt && patient?.email) {
            sendCancellationEmail(
                patient.email,
                patient.name,
                'doctor',
                doctor?.name || 'Doctor',
                appointment.date,
                appointment.slotTime,
                reason
            );
        }

        res.status(200).json({
            success: true,
            message: 'Appointment cancelled successfully',
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error cancelling appointment',
        });
    }
};

import Razorpay from "razorpay";
import crypto from "crypto";
import { sendPaymentReceiptEmail } from "../utils/sendEmail.js";
import { sendAppointmentEmails } from "./appointmentController.js";
import User from "../models/User.js";
import Doctor from "../models/Doctor.js";
import Appointment from "../models/Appointment.js";

let razorpayInstance = null;

const getRazorpayInstance = () => {
    if (!razorpayInstance) {
        const keyId = process.env.RAZORPAY_KEY_ID;
        const keySecret = process.env.RAZORPAY_KEY_SECRET;

        if (!keyId || !keySecret) {
            throw new Error('Razorpay API keys are not configured. Check RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your .env file.');
        }

        razorpayInstance = new Razorpay({
            key_id: keyId,
            key_secret: keySecret,
        });
    }
    return razorpayInstance;
};

export const checkout = async (req, res) => {
    try {
        const { doctorId } = req.body;

        if (!doctorId) {
            return res.status(400).json({
                success: false,
                message: "Doctor ID is required to create a payment order.",
            });
        }

        const doctorProfile = await Doctor.findOne({ userId: doctorId });

        if (!doctorProfile) {
            return res.status(404).json({
                success: false,
                message: "Doctor profile not found. Cannot create payment order.",
            });
        }

        if (!doctorProfile.fees || doctorProfile.fees <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid doctor fee structure. Cannot create payment order.",
            });
        }

        const paymentAmount = doctorProfile.fees * 100; // Convert rupees to paise

        const options = {
            amount: paymentAmount,
            currency: "INR",
            receipt: `receipt_${Date.now()}`,
        };

        const razorpay = getRazorpayInstance();
        const order = await razorpay.orders.create(options);

        res.status(200).json({
            success: true,
            order,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to create payment order",
        });
    }
};

export const paymentVerification = async (req, res) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            doctorName,
            appointmentDate,
            appointmentTime,
            amount,
            appointmentId
        } = req.body;

        const body = razorpay_order_id + "|" + razorpay_payment_id;

        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest("hex");

        const isAuthentic = expectedSignature === razorpay_signature;

        if (isAuthentic) {
            const userId = req.userId;
            let appointment = null;

            if (appointmentId) {
                try {
                    appointment = await Appointment.findById(appointmentId);

                    // Only the patient who owns the appointment can mark it paid
                    if (appointment && userId && appointment.patientId.toString() === userId.toString()) {
                        appointment.paymentStatus = true;
                        await appointment.save();
                    } else {
                        appointment = null;
                    }
                } catch (err) {
                    appointment = null;
                }
            }

            // The payment is genuine but the appointment could not be marked paid —
            // most likely its unpaid hold expired and was removed by the sweeper.
            // Report failure so the client tells the user to contact support
            // instead of showing a false booking confirmation.
            if (appointmentId && !appointment) {
                return res.status(409).json({
                    success: false,
                    message: 'Payment received, but the appointment hold had expired. Please contact support with your payment reference for a refund or rebooking.',
                    paymentId: razorpay_payment_id,
                    orderId: razorpay_order_id,
                });
            }

            let user = null;
            let emailToSend = null;
            let patientName = 'there';

            if (userId) {
                user = await User.findById(userId).select('name email');
                if (user) {
                    emailToSend = user.email;
                    patientName = user.name;
                }
            }

            // Booking confirmation emails go out only after payment is verified,
            // using the appointment stored in the database as the source of truth.
            if (appointment) {
                const doctorUser = await User.findById(appointment.doctorId).select('name email');
                if (doctorUser?.email && user?.email) {
                    sendAppointmentEmails(
                        doctorUser.email,
                        doctorUser.name,
                        user.email,
                        user.name,
                        appointment.date,
                        appointment.slotTime
                    );
                }
            }

            if (emailToSend) {
                const emailDetails = {
                    doctorName: doctorName || 'Your Doctor',
                    date: appointmentDate || new Date().toLocaleDateString(),
                    time: appointmentTime || 'As scheduled',
                    amount: amount ? (amount / 100) : 500,
                    patientName: patientName,
                };

                sendPaymentReceiptEmail(emailToSend, emailDetails, razorpay_payment_id)
                    .catch(() => { });
            }

            res.status(200).json({
                success: true,
                message: "Payment verified successfully",
                paymentId: razorpay_payment_id,
                orderId: razorpay_order_id,
            });
        } else {
            res.status(400).json({
                success: false,
                message: "Payment verification failed",
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Payment verification failed",
        });
    }
};

export const getKey = (req, res) => {
    res.status(200).json({
        success: true,
        key: process.env.RAZORPAY_KEY_ID,
    });
};

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
        const userId = req.userId;
        const { appointmentId } = req.body;

        if (!appointmentId) {
            return res.status(400).json({
                success: false,
                message: "Appointment ID is required to create a payment order.",
            });
        }

        // The order must be tied to a real, owned, unpaid appointment. Amount is
        // derived server-side from the doctor's fee, never trusted from the client.
        const appointment = await Appointment.findById(appointmentId);

        if (!appointment || appointment.patientId.toString() !== userId.toString()) {
            return res.status(404).json({
                success: false,
                message: "Appointment not found.",
            });
        }

        if (appointment.status === 'cancelled') {
            return res.status(400).json({
                success: false,
                message: "This appointment has been cancelled and cannot be paid for.",
            });
        }

        if (appointment.paymentStatus) {
            return res.status(400).json({
                success: false,
                message: "This appointment has already been paid for.",
            });
        }

        // doctorId is normally a User id, with a fallback to a Doctor document id
        let doctorProfile = await Doctor.findOne({ userId: appointment.doctorId });
        if (!doctorProfile) {
            doctorProfile = await Doctor.findById(appointment.doctorId);
        }

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
            receipt: `rcpt_${appointmentId}`,
        };

        const razorpay = getRazorpayInstance();
        const order = await razorpay.orders.create(options);

        // Bind this order (and the expected amount) to the appointment so
        // verification can reject any signature from a different/cheaper order.
        appointment.razorpayOrderId = order.id;
        appointment.paymentAmount = paymentAmount;
        await appointment.save();

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

        if (!isAuthentic) {
            return res.status(400).json({
                success: false,
                message: "Payment verification failed",
            });
        }

        const userId = req.userId;

        if (!appointmentId) {
            return res.status(400).json({
                success: false,
                message: "Appointment reference is required to verify payment.",
            });
        }

        const appointment = await Appointment.findById(appointmentId);

        // The payment is genuine but the appointment could not be resolved —
        // most likely its unpaid hold expired and was removed by the sweeper, or
        // it does not belong to this user. Report failure so the client tells the
        // user to contact support instead of showing a false booking confirmation.
        if (!appointment || appointment.patientId.toString() !== userId.toString()) {
            return res.status(409).json({
                success: false,
                message: 'Payment received, but the appointment hold had expired. Please contact support with your payment reference for a refund or rebooking.',
                paymentId: razorpay_payment_id,
                orderId: razorpay_order_id,
            });
        }

        // Strict binding check: the signed order must be the exact order created
        // for THIS appointment at checkout. This blocks replaying one payment
        // across appointments and paying an expensive slot with a cheap order.
        if (!appointment.razorpayOrderId || appointment.razorpayOrderId !== razorpay_order_id) {
            return res.status(400).json({
                success: false,
                message: "Payment does not match this appointment's order. Verification denied.",
            });
        }

        // Idempotent: a replayed verification for an already-paid appointment
        // succeeds without re-marking or re-sending confirmation emails.
        const alreadyPaid = appointment.paymentStatus;
        if (!alreadyPaid) {
            appointment.paymentStatus = true;
            await appointment.save();
        }

        // Only send confirmation/receipt emails on the first successful
        // verification, not on idempotent replays.
        if (!alreadyPaid) {
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

            if (emailToSend) {
                const emailDetails = {
                    doctorName: doctorName || 'Your Doctor',
                    date: appointmentDate || new Date().toLocaleDateString(),
                    time: appointmentTime || 'As scheduled',
                    // Trust the amount bound to the appointment, not the client
                    amount: (appointment.paymentAmount || 0) / 100,
                    patientName: patientName,
                };

                sendPaymentReceiptEmail(emailToSend, emailDetails, razorpay_payment_id)
                    .catch(() => { });
            }
        }

        res.status(200).json({
            success: true,
            message: "Payment verified successfully",
            paymentId: razorpay_payment_id,
            orderId: razorpay_order_id,
        });
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

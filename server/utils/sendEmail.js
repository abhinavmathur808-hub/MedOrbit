import nodemailer from 'nodemailer';
import { escapeHtml } from './escapeHtml.js';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.PAYMENT_EMAIL_USER,
        pass: process.env.PAYMENT_EMAIL_PASS,
    },
});

export const sendPaymentReceiptEmail = async (email, details, paymentId) => {
    try {
        const { doctorName, date, time, amount, patientName } = details;
        const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

        const mailOptions = {
            from: process.env.PAYMENT_EMAIL_USER,
            to: email,
            subject: '💳 Payment Receipt - MedOrbit',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: linear-gradient(to right, #f43f5e, #8b5cf6); padding: 20px; text-align: center;">
                        <h1 style="color: white; margin: 0;">MedOrbit</h1>
                    </div>
                    <div style="padding: 30px; background: #fff;">
                        <h2 style="color: #333;">Payment Received ✅</h2>
                        <p style="color: #666; font-size: 16px;">Hello ${escapeHtml(patientName)},</p>
                        <p style="color: #666;">Your payment has been processed successfully. Here are the details:</p>

                        <div style="background: #f9fafb; padding: 20px; border-radius: 10px; margin: 20px 0;">
                            <p style="margin: 10px 0;"><strong>Doctor:</strong> Dr. ${escapeHtml(doctorName)}</p>
                            <p style="margin: 10px 0;"><strong>Date:</strong> ${escapeHtml(date)}</p>
                            <p style="margin: 10px 0;"><strong>Time:</strong> ${escapeHtml(time)}</p>
                            <p style="margin: 10px 0;"><strong>Amount Paid:</strong> ₹${escapeHtml(String(amount))}</p>
                            <p style="margin: 10px 0;"><strong>Payment ID:</strong> ${escapeHtml(paymentId)}</p>
                            <p style="margin: 10px 0;"><strong>Status:</strong> <span style="color: #22c55e;">Paid</span></p>
                        </div>

                        <p style="color: #666;">You can view your appointments here:</p>
                        <a href="${clientUrl}/appointments" style="display: inline-block; padding: 12px 24px; background: linear-gradient(to right, #f43f5e, #8b5cf6); color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">View My Appointments</a>
                    </div>
                    <div style="background: #1f2937; padding: 15px; text-align: center;">
                        <p style="color: #9ca3af; margin: 0; font-size: 12px;">© 2026 MedOrbit. All rights reserved.</p>
                    </div>
                </div>
            `,
        };

        const info = await transporter.sendMail(mailOptions);
        return info;
    } catch (error) {
        throw error; // Let caller handle
    }
};

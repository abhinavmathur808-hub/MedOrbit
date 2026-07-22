import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Resend } from 'resend';
import User from '../models/User.js';
import Doctor from '../models/Doctor.js';
import Otp from '../models/otpModel.js';

let _resend;
const getResend = () => {
    if (!_resend) {
        if (!process.env.RESEND_API_KEY) {
            throw new Error('RESEND_API_KEY is not set in environment variables');
        }
        _resend = new Resend(process.env.RESEND_API_KEY);
    }
    return _resend;
};

export const sendOtpController = async (req, res) => {
    try {
        // Explicit string cast: a non-string previously reached .toLowerCase() and
        // threw, surfacing as a 500 instead of a clean validation error.
        const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required',
            });
        }

        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User already exists with this email',
            });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        const salt = await bcrypt.genSalt(10);
        const hashedOtp = await bcrypt.hash(otp, salt);

        await Otp.deleteMany({ email: email.toLowerCase() });

        await Otp.create({
            email: email.toLowerCase(),
            otp: hashedOtp,
        });

        const { data, error } = await getResend().emails.send({
            from: 'MedOrbit <noreply@medorbit.live>',
            to: email,
            subject: '🔐 Your MedOrbit Verification Code',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: linear-gradient(to right, #f43f5e, #8b5cf6); padding: 20px; text-align: center;">
                        <h1 style="color: white; margin: 0;">MedOrbit</h1>
                    </div>
                    <div style="padding: 30px; background: #fff; text-align: center;">
                        <h2 style="color: #333;">Email Verification</h2>
                        <p style="color: #666; font-size: 16px;">Your verification code is:</p>
                        <div style="background: #f9fafb; padding: 20px; border-radius: 10px; margin: 20px 0;">
                            <h1 style="color: #f43f5e; font-size: 36px; letter-spacing: 8px; margin: 0;">${otp}</h1>
                        </div>
                        <p style="color: #666; font-size: 14px;">This code expires in 10 minutes.</p>
                        <p style="color: #999; font-size: 12px;">If you didn't request this code, please ignore this email.</p>
                    </div>
                    <div style="background: #1f2937; padding: 15px; text-align: center;">
                        <p style="color: #9ca3af; margin: 0; font-size: 12px;">© 2026 MedOrbit. All rights reserved.</p>
                    </div>
                </div>
            `,
        });

        if (error) throw new Error(error.message);

        res.status(200).json({
            success: true,
            message: 'OTP sent successfully to your email',
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to send OTP',
            error: error.message,
        });
    }
};

export const registerController = async (req, res) => {
    try {
        const { name, password, gender, phone } = req.body;

        // Same string-cast discipline as login: these two are the only body values
        // that reach a query (Otp/User lookups) or bcrypt.compare.
        const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
        const otp = typeof req.body.otp === 'string' ? req.body.otp.trim() : '';

        const allowedRoles = ['patient', 'doctor'];
        const role = allowedRoles.includes(req.body.role?.toLowerCase())
            ? req.body.role.toLowerCase()
            : 'patient';

        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide name, email and password',
            });
        }

        if (!otp) {
            return res.status(400).json({
                success: false,
                message: 'OTP is required for registration',
            });
        }

        const otpRecord = await Otp.findOne({ email: email.toLowerCase() });
        if (!otpRecord) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired OTP',
            });
        }

        const isOtpValid = await bcrypt.compare(otp, otpRecord.otp);
        if (!isOtpValid) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired OTP',
            });
        }

        await Otp.deleteOne({ _id: otpRecord._id });

        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User already exists with this email',
            });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            role,
            gender,
            phone,
        });

        if (role === 'doctor') {
            try {
                await Doctor.create({
                    userId: user._id,
                });
            } catch (doctorError) {
                // A doctor account without a Doctor profile is broken (profile
                // editing 404s, admin verification silently no-ops), so roll the
                // registration back and fail loudly instead of swallowing it.
                await User.findByIdAndDelete(user._id).catch(() => { });
                return res.status(500).json({
                    success: false,
                    message: 'Could not create the doctor profile. Registration was rolled back — please try again.',
                });
            }
        }

        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        const userResponse = {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            gender: user.gender,
            phone: user.phone,
            photo: user.photo,
        };

        res.status(201).json({
            success: true,
            message: 'Registration successful',
            token,
            user: userResponse,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error during registration',
        });
    }
};

export const loginController = async (req, res) => {
    try {
        // Cast to a string BEFORE the value can reach a query. Without this, a body
        // of {"email":{"$ne":null}} passes the truthy check below (objects are
        // truthy) and injects a MongoDB operator into findOne (CWE-943) — allowing
        // arbitrary record selection, $regex user-enumeration via the bcrypt timing
        // difference, and ReDoS against the users collection.
        const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
        const password = typeof req.body.password === 'string' ? req.body.password : '';

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password',
            });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password',
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password',
            });
        }

        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        const userResponse = {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            gender: user.gender,
            phone: user.phone,
            photo: user.photo,
        };

        res.status(200).json({
            success: true,
            message: 'Login successful',
            token,
            user: userResponse,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error during login',
        });
    }
};

export const getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.userId).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        res.status(200).json({
            success: true,
            user,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error fetching profile',
        });
    }
};

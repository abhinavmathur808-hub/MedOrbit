import User from '../models/User.js';

export const getProfile = async (req, res) => {
    try {
        const userId = req.userId;

        const user = await User.findById(userId).select('-password');

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

export const updateProfile = async (req, res) => {
    try {
        const userId = req.userId;
        const { name, phone, photo, gender, dob, address } = req.body;

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        if (name) user.name = name;
        if (phone !== undefined) user.phone = phone;
        if (photo) user.photo = photo;
        if (gender !== undefined) user.gender = gender;
        if (dob !== undefined) user.dob = dob;
        if (address) {
            user.address = {
                line1: address.line1 || user.address?.line1 || '',
                line2: address.line2 || user.address?.line2 || '',
            };
        }

        await user.save();

        const updatedUser = await User.findById(userId).select('-password');

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            user: updatedUser,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error updating profile',
        });
    }
};

export const addMedicalHistory = async (req, res) => {
    try {
        const userId = req.userId;
        const { diagnosis, date, treatment, doctorName } = req.body;

        if (!diagnosis || !date) {
            return res.status(400).json({
                success: false,
                message: 'Diagnosis and date are required',
            });
        }

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        user.medicalHistory.push({
            diagnosis,
            date,
            treatment: treatment || '',
            doctorName: doctorName || '',
        });

        await user.save();

        res.status(201).json({
            success: true,
            message: 'Medical history added successfully',
            medicalHistory: user.medicalHistory,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error adding medical history',
        });
    }
};

export const getUserAppointments = async (req, res) => {
    try {
        const userId = req.userId;

        const Appointment = (await import('../models/Appointment.js')).default;
        const Doctor = (await import('../models/Doctor.js')).default;

        const appointments = await Appointment.find({ patientId: userId })
            .populate({
                path: 'doctorId',
                select: 'specialization fees hospitalAddress',
                populate: {
                    path: 'userId',
                    select: 'name email photo',
                },
            })
            .sort({ date: -1, createdAt: -1 });

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

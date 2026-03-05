import User from '../models/User.js';
import Appointment from '../models/Appointment.js';
import Doctor from '../models/Doctor.js';

export const verifyDoctor = async (req, res) => {
    try {
        const { doctorId } = req.body;

        if (!doctorId) {
            return res.status(400).json({
                success: false,
                message: 'Doctor ID is required',
            });
        }

        const doctor = await User.findById(doctorId);

        if (!doctor) {
            return res.status(404).json({
                success: false,
                message: 'Doctor not found',
            });
        }

        if (doctor.role !== 'doctor') {
            return res.status(400).json({
                success: false,
                message: 'User is not a doctor',
            });
        }

        doctor.isVerified = true;
        await doctor.save();

        await Doctor.findOneAndUpdate({ userId: doctorId }, { isVerified: true });

        res.status(200).json({
            success: true,
            message: `Dr. ${doctor.name} has been verified successfully`,
            doctor: {
                _id: doctor._id,
                name: doctor.name,
                email: doctor.email,
                isVerified: doctor.isVerified,
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error verifying doctor',
        });
    }
};

export const getUnverifiedDoctors = async (req, res) => {
    try {
        const doctors = await User.find({
            role: 'doctor',
            isVerified: false,
        }).select('-password');

        res.status(200).json({
            success: true,
            count: doctors.length,
            doctors,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error fetching unverified doctors',
        });
    }
};

export const getAllDoctors = async (req, res) => {
    try {
        const doctors = await User.find({
            role: 'doctor',
        }).select('-password').sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: doctors.length,
            doctors,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error fetching doctors',
        });
    }
};

export const getDashboardStats = async (req, res) => {
    try {
        const totalPatients = await User.countDocuments({ role: 'patient' });

        const totalDoctors = await User.countDocuments({ role: 'doctor' });

        const totalAppointments = await Appointment.countDocuments();

        res.status(200).json({
            success: true,
            stats: {
                totalPatients,
                totalDoctors,
                totalAppointments,
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error fetching stats',
        });
    }
};

export const getRecentActivity = async (req, res) => {
    try {
        const recentAppointments = await Appointment.find()
            .populate('patientId', 'name email')
            .populate('doctorId', 'name email')
            .sort({ createdAt: -1 })
            .limit(5);

        res.status(200).json({
            success: true,
            appointments: recentAppointments,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error fetching recent activity',
        });
    }
};

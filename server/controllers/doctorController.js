import Doctor from '../models/Doctor.js';
import User from '../models/User.js';
import Review from '../models/Review.js';
import Appointment from '../models/Appointment.js';
import Prescription from '../models/Prescription.js';
import redisClient from '../config/redis.js';
import { invalidateDoctorsListCache } from '../utils/doctorsCache.js';

export const getDoctorProfile = async (req, res) => {
    try {
        const userId = req.userId;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID not found in request',
            });
        }

        const doctor = await Doctor.findOne({ userId }).populate('userId', 'name email phone gender photo');

        if (!doctor) {
            return res.status(200).json({
                success: true,
                message: 'No doctor profile found',
                doctor: null,
            });
        }

        res.status(200).json({
            success: true,
            doctor,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error fetching doctor profile',
        });
    }
};

export const updateDoctorProfile = async (req, res) => {
    try {
        const userId = req.userId;
        const {
            name,
            phone,
            photo,
            specialization,
            experience,
            fees,
            hospitalAddress,
            qualifications,
            availability,
        } = req.body;

        const doctor = await Doctor.findOne({ userId });

        if (!doctor) {
            return res.status(404).json({
                success: false,
                message: 'Doctor profile not found. Only registered doctors can update their profile.',
            });
        }

        if (specialization !== undefined) doctor.specialization = specialization;
        if (experience !== undefined) doctor.experience = Number(experience) || 0;
        if (fees !== undefined) doctor.fees = Number(fees) || 0;
        if (hospitalAddress !== undefined) doctor.hospitalAddress = hospitalAddress;

        if (qualifications !== undefined) {
            if (typeof qualifications === 'string') {
                doctor.qualifications = qualifications.split(',').map(q => q.trim()).filter(q => q);
            } else if (Array.isArray(qualifications)) {
                doctor.qualifications = qualifications;
            }
        }

        if (availability !== undefined && Array.isArray(availability)) {
            doctor.availability = availability;
        }

        await doctor.save();

        if (name || phone || photo) {
            const userUpdate = {};
            if (name) userUpdate.name = name;
            if (phone) userUpdate.phone = phone;
            if (photo) userUpdate.photo = photo;

            const updatedUser = await User.findByIdAndUpdate(userId, userUpdate, { new: true });
        }

        const updatedDoctor = await Doctor.findOne({ userId }).populate('userId', 'name email phone gender photo');

        // The cached doctors list embeds fees, specialization, and populated
        // user data — drop it so the change shows immediately
        await invalidateDoctorsListCache();

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            doctor: updatedDoctor,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error updating doctor profile',
        });
    }
};

export const getAllDoctors = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
        const skip = (page - 1) * limit;

        // Optional specialty filter — accepts one OR several. Express parses a
        // repeated query (?specialization=a&specialization=b) into an array and
        // a single one into a string, so normalise both into a clean list. Each
        // specialty is matched with an anchored, case-insensitive, regex-escaped
        // exact match via $in, so the multi-select faceted sidebar stays
        // COMPLETE and paginated server-side rather than collapsing to whatever
        // specialists happened to land on the first unfiltered page. A single
        // value stays backward-compatible with the hero / related-doctors flows.
        const rawSpec = req.query.specialization;
        const specializations = (Array.isArray(rawSpec) ? rawSpec : rawSpec ? [rawSpec] : [])
            .map((s) => String(s).trim())
            .filter(Boolean);

        const query = { isVerified: true };
        if (specializations.length) {
            query.specialization = {
                $in: specializations.map(
                    (s) => new RegExp(`^${s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i')
                ),
            };
        }

        // Cache key must vary by the (order-independent) specialty set so
        // filtered and unfiltered pages don't collide
        // (invalidateDoctorsListCache clears all doctorsList:*)
        const specKey = specializations.length
            ? specializations.map((s) => s.toLowerCase()).sort().join(',')
            : 'all';
        const CACHE_KEY = `doctorsList:spec:${specKey}:page:${page}:limit:${limit}`;

        // Cache is optional — when Redis is down, isReady is false and we go
        // straight to the database without throwing on every request
        if (redisClient.isReady) {
            try {
                const cached = await redisClient.get(CACHE_KEY);
                if (cached) {
                    const parsed = JSON.parse(cached);
                    return res.status(200).json({
                        success: true,
                        count: parsed.doctors.length,
                        doctors: parsed.doctors,
                        hasMore: parsed.hasMore,
                        totalCount: parsed.totalCount,
                        source: 'cache',
                    });
                }
            } catch (cacheErr) {
                console.error('Redis read error:', cacheErr.message);
            }
        }

        const doctors = await Doctor.find(query)
            // Stable sort on a unique key: skip/limit over MongoDB's natural
            // order can repeat or drop a document at a page boundary, which
            // surfaces as duplicate React keys and missing doctors once pages
            // are stitched together. _id ordering makes pagination deterministic.
            .sort({ _id: 1 })
            .populate('userId', 'name email phone photo isVerified')
            .select('-__v')
            .skip(skip)
            .limit(limit + 1)
            .lean();

        const hasMore = doctors.length > limit;
        const paginatedDoctors = hasMore ? doctors.slice(0, limit) : doctors;

        const safeDoctors = paginatedDoctors.map(doc => ({
            ...doc,
            slots_booked: doc.slots_booked || {},
        }));

        // Full size of the filtered set (ignores skip/limit) so the client can
        // show an accurate "N doctors" before paginating through the results.
        const totalCount = await Doctor.countDocuments(query);

        if (redisClient.isReady) {
            try {
                await redisClient.set(
                    CACHE_KEY,
                    JSON.stringify({ doctors: safeDoctors, hasMore, totalCount }),
                    { EX: 3600 }
                );
            } catch (cacheErr) {
                console.error('Redis write error:', cacheErr.message);
            }
        }

        res.status(200).json({
            success: true,
            count: safeDoctors.length,
            doctors: safeDoctors,
            hasMore,
            totalCount,
            source: 'db',
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error fetching doctors',
        });
    }
};

// Distinct specialties that actually have a verified doctor behind them, so the
// faceted sidebar can be data-driven instead of a hardcoded list — and never
// offers a facet that would return zero results. NOTE: the schema field is
// `specialization` (not `speciality`/`specialty`).
export const getSpecialties = async (req, res) => {
    try {
        const specialties = (await Doctor.distinct('specialization', { isVerified: true }))
            .map((s) => (s || '').trim())
            .filter(Boolean)
            .sort((a, b) => a.localeCompare(b));

        res.status(200).json({
            success: true,
            count: specialties.length,
            specialties,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error fetching specialties',
        });
    }
};

export const getDoctorById = async (req, res) => {
    try {
        const doctor = await Doctor.findById(req.params.id)
            .populate('userId', 'name email phone photo isVerified')
            .lean();

        if (!doctor) {
            return res.status(404).json({
                success: false,
                message: 'Doctor not found',
            });
        }

        const safeDoctor = {
            ...doctor,
            slots_booked: doctor.slots_booked || {},
        };

        res.status(200).json({
            success: true,
            doctor: safeDoctor,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error fetching doctor',
        });
    }
};

export const addReview = async (req, res) => {
    try {
        const userId = req.userId;
        const { appointmentId, rating, comment } = req.body;

        if (!appointmentId || !rating) {
            return res.status(400).json({
                success: false,
                message: 'Appointment ID and rating are required',
            });
        }

        if (rating < 1 || rating > 5) {
            return res.status(400).json({
                success: false,
                message: 'Rating must be between 1 and 5',
            });
        }

        const appointment = await Appointment.findById(appointmentId);

        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: 'Appointment not found',
            });
        }

        if (appointment.patientId.toString() !== userId.toString()) {
            return res.status(403).json({
                success: false,
                message: 'You can only review your own appointments',
            });
        }

        if (appointment.status !== 'completed' && !appointment.paymentStatus) {
            return res.status(400).json({
                success: false,
                message: 'You can only review completed or paid appointments',
            });
        }

        const existingReview = await Review.findOne({ appointmentId });

        if (existingReview) {
            return res.status(400).json({
                success: false,
                message: 'You have already reviewed this appointment',
            });
        }

        const doctorUserId = appointment.doctorId;

        const review = new Review({
            doctorId: doctorUserId,
            userId,
            appointmentId,
            rating: Number(rating),
            comment: comment || '',
        });

        await review.save();

        const allReviews = await Review.find({ doctorId: doctorUserId });
        const totalRatings = allReviews.length;
        const sumRatings = allReviews.reduce((sum, r) => sum + r.rating, 0);
        const averageRating = totalRatings > 0 ? (sumRatings / totalRatings) : 0;

        await Doctor.findOneAndUpdate(
            { userId: doctorUserId },
            {
                averageRating: Math.round(averageRating * 10) / 10,
                totalRatings,
            }
        );

        res.status(201).json({
            success: true,
            message: 'Review submitted successfully',
            review: {
                _id: review._id,
                rating: review.rating,
                comment: review.comment,
            },
            doctorStats: {
                averageRating: Math.round(averageRating * 10) / 10,
                totalRatings,
            },
        });

    } catch (error) {

        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'You have already reviewed this appointment',
            });
        }

        res.status(500).json({
            success: false,
            message: 'Server error adding review',
        });
    }
};

export const addPrescription = async (req, res) => {
    try {
        const userId = req.userId;
        const { appointmentId, diagnosis, medicines, notes } = req.body;

        if (!appointmentId || !diagnosis) {
            return res.status(400).json({
                success: false,
                message: 'Appointment ID and diagnosis are required',
            });
        }

        const appointment = await Appointment.findById(appointmentId);

        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: 'Appointment not found',
            });
        }

        if (appointment.doctorId.toString() !== userId.toString()) {
            return res.status(403).json({
                success: false,
                message: 'You can only prescribe for your own appointments',
            });
        }

        if (appointment.status !== 'completed') {
            return res.status(400).json({
                success: false,
                message: 'You can only prescribe for completed appointments',
            });
        }

        const existingPrescription = await Prescription.findOne({ appointmentId });

        if (existingPrescription) {
            return res.status(400).json({
                success: false,
                message: 'A prescription already exists for this appointment',
            });
        }

        const prescription = new Prescription({
            appointmentId,
            doctorId: userId,
            patientId: appointment.patientId,
            diagnosis,
            medicines: medicines || [],
            notes: notes || '',
        });

        await prescription.save();

        res.status(201).json({
            success: true,
            message: 'Prescription created successfully',
            prescription,
        });

    } catch (error) {

        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'A prescription already exists for this appointment',
            });
        }

        res.status(500).json({
            success: false,
            message: 'Server error adding prescription',
        });
    }
};

export const getPrescription = async (req, res) => {
    try {
        const userId = req.userId;
        const { appointmentId } = req.params;

        const prescription = await Prescription.findOne({ appointmentId })
            .populate('doctorId', 'name email phone photo')
            .populate('patientId', 'name email phone photo');

        if (!prescription) {
            return res.status(404).json({
                success: false,
                message: 'No prescription found for this appointment',
            });
        }

        const isDoctor = prescription.doctorId._id.toString() === userId.toString();
        const isPatient = prescription.patientId._id.toString() === userId.toString();

        if (!isDoctor && !isPatient) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to view this prescription',
            });
        }

        res.status(200).json({
            success: true,
            prescription,
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error fetching prescription',
        });
    }
};

export const getRelatedDoctors = async (req, res) => {
    try {
        const { specialization, excludeId } = req.query;

        if (!specialization) {
            return res.status(400).json({
                success: false,
                message: 'Specialization is required',
            });
        }

        const query = {
            specialization: specialization,
            isVerified: true,
        };

        if (excludeId) {
            query._id = { $ne: excludeId };
        }

        const doctors = await Doctor.find(query)
            .populate('userId', 'name email photo isVerified')
            .limit(3)
            .select('specialization qualifications experience fees hospitalAddress averageRating totalRatings');

        res.status(200).json({
            success: true,
            count: doctors.length,
            doctors,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error fetching related doctors',
        });
    }
};

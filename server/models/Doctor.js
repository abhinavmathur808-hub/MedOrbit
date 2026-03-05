import mongoose from 'mongoose';

const doctorSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true, // One doctor profile per user
        },
        specialization: {
            type: String,
            trim: true,
            default: '',
        },
        qualifications: {
            type: [String], // Array of qualification strings (e.g., ['MBBS', 'MD'])
            default: [],
        },
        experience: {
            type: Number, // Years of experience
            min: [0, 'Experience cannot be negative'],
            default: 0,
        },
        fees: {
            type: Number, // Consultation fees
            min: [0, 'Fees cannot be negative'],
            default: 0,
        },
        hospitalAddress: {
            type: String,
            trim: true,
            default: '',
        },

        availability: {
            type: [
                {
                    day: {
                        type: String,
                        enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
                    },
                    startTime: {
                        type: String, // Format: 'HH:MM'
                    },
                    endTime: {
                        type: String, // Format: 'HH:MM'
                    },
                },
            ],
            default: [],
        },
        averageRating: {
            type: Number,
            default: 0,
            min: 0,
            max: 5,
        },
        totalRatings: {
            type: Number,
            default: 0,
            min: 0,
        },

        slots_booked: {
            type: Object,
            default: {},
        },
        isVerified: {
            type: Boolean,
            default: false, // Admin must verify doctor before they can practice
        },
    },
    {
        timestamps: true,
    }
);

const Doctor = mongoose.model('Doctor', doctorSchema);

export default Doctor;

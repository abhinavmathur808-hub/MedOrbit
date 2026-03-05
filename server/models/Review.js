import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
    {
        doctorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User', // References the doctor's User account
            required: [true, 'Doctor ID is required'],
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User', // References the patient's User account
            required: [true, 'User ID is required'],
        },
        appointmentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Appointment',
            required: [true, 'Appointment ID is required'],
            unique: true, // Prevents duplicate reviews for same appointment
        },
        rating: {
            type: Number,
            required: [true, 'Rating is required'],
            min: [1, 'Rating must be at least 1'],
            max: [5, 'Rating cannot exceed 5'],
        },
        comment: {
            type: String,
            trim: true,
            maxlength: [500, 'Comment cannot exceed 500 characters'],
            default: '',
        },
    },
    {
        timestamps: true, // Adds createdAt and updatedAt
    }
);

reviewSchema.index({ doctorId: 1 });
reviewSchema.index({ userId: 1 });

const Review = mongoose.model('Review', reviewSchema);

export default Review;

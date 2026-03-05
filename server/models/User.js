import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Name is required'],
            trim: true,
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            minlength: [6, 'Password must be at least 6 characters'],
        },
        googleId: {
            type: String,
            unique: true,
            sparse: true, // Allows multiple null values
        },
        role: {
            type: String,
            enum: ['patient', 'doctor', 'admin'],
            default: 'patient',
        },
        gender: {
            type: String,
            enum: ['male', 'female', 'other', ''],
            default: '',
        },
        phone: {
            type: String,
            trim: true,
            default: '',
        },
        photo: {
            type: String, // Cloudinary URL or Base64
            default: '',
        },
        dob: {
            type: String, // Date of birth as string (YYYY-MM-DD)
            default: '',
        },
        address: {
            line1: { type: String, default: '' },
            line2: { type: String, default: '' },
        },
        medicalHistory: [
            {
                diagnosis: { type: String, required: true },
                date: { type: String, required: true },
                treatment: { type: String, default: '' },
                doctorName: { type: String, default: '' },
                createdAt: { type: Date, default: Date.now },
            },
        ],
        isVerified: {
            type: Boolean, // Blue tick for verified doctors
            default: false,
        },
    },
    {
        timestamps: true, // Adds createdAt and updatedAt fields
    }
);

const User = mongoose.model('User', userSchema);

export default User;

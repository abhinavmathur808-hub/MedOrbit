import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema(
    {
        patientId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Patient is required'],
        },
        doctorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Doctor is required'],
        },
        date: {
            type: Date,
            required: [true, 'Appointment date is required'],
        },
        slotTime: {
            type: String, // Format: 'HH:MM' (e.g., '10:30')
            required: [true, 'Slot time is required'],
        },
        status: {
            type: String,
            enum: ['pending', 'confirmed', 'cancelled', 'completed'],
            default: 'pending',
        },
        paymentStatus: {
            type: Boolean,
            default: false, // false = unpaid, true = paid
        },
    },
    {
        timestamps: true,
    }
);

appointmentSchema.index({ doctorId: 1, date: 1, slotTime: 1 }, { unique: true });

const Appointment = mongoose.model('Appointment', appointmentSchema);

export default Appointment;

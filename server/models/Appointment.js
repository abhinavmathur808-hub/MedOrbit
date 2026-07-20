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
            // Canonical format: 'hh:mm A' (e.g., '09:30 AM'). Enforced by
            // normalizeSlotTime() in appointmentController before any save.
            type: String,
            required: [true, 'Slot time is required'],
        },
        status: {
            type: String,
            // 'no-show' is a terminal state for a PAID appointment whose time
            // passed without the doctor ever confirming it. It is derived for
            // display on read (the client owns local-time logic); this enum makes
            // it a legal value for future persistence via the background sweeper.
            enum: ['pending', 'confirmed', 'cancelled', 'completed', 'no-show'],
            default: 'pending',
        },
        paymentStatus: {
            type: Boolean,
            default: false, // false = unpaid, true = paid
        },
        razorpayOrderId: {
            type: String,
            default: null, // Razorpay order bound to this appointment at checkout
        },
        paymentAmount: {
            type: Number,
            default: 0, // Expected amount in paise, set server-side at checkout
        },
    },
    {
        timestamps: true,
    }
);

appointmentSchema.index({ doctorId: 1, date: 1, slotTime: 1 }, { unique: true });

const Appointment = mongoose.model('Appointment', appointmentSchema);

export default Appointment;

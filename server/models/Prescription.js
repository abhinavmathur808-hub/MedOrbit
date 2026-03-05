import mongoose from 'mongoose';

const prescriptionSchema = new mongoose.Schema(
    {
        appointmentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Appointment',
            required: [true, 'Appointment ID is required'],
            unique: true, // One prescription per appointment
        },
        doctorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User', // Doctor's user account
            required: [true, 'Doctor ID is required'],
        },
        patientId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User', // Patient's user account
            required: [true, 'Patient ID is required'],
        },
        diagnosis: {
            type: String,
            required: [true, 'Diagnosis is required'],
            trim: true,
        },
        medicines: {
            type: [
                {
                    name: {
                        type: String,
                        required: true,
                        trim: true,
                    },
                    dosage: {
                        type: String,
                        required: true,
                        trim: true,
                    },
                    frequency: {
                        type: String,
                        required: true,
                        trim: true,
                    },
                },
            ],
            default: [],
        },
        notes: {
            type: String,
            trim: true,
            default: '',
        },
    },
    {
        timestamps: true, // Adds createdAt and updatedAt
    }
);

prescriptionSchema.index({ doctorId: 1 });
prescriptionSchema.index({ patientId: 1 });

const Prescription = mongoose.model('Prescription', prescriptionSchema);

export default Prescription;

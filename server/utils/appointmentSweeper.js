import Appointment from '../models/Appointment.js';
import Doctor from '../models/Doctor.js';
import { slotKeyForDate } from './slotKey.js';

const SWEEP_INTERVAL_MS = 5 * 60 * 1000;  // run every 5 minutes
const MAX_UNPAID_AGE_MS = 15 * 60 * 1000; // unpaid holds older than this are removed
const FIRST_SWEEP_DELAY_MS = 30 * 1000;   // first pass shortly after boot

let sweeping = false;

// Removes 'zombie' appointments: pending, unpaid holds whose checkout was
// abandoned in a way the client could not clean up (closed tab, crashed
// browser). Frees the doctor's slot, then deletes the document so the
// unique (doctorId, date, slotTime) index cannot block a rebooking.
export const sweepUnpaidAppointments = async () => {
    if (sweeping) return; // don't overlap slow runs
    sweeping = true;

    try {
        const cutoff = new Date(Date.now() - MAX_UNPAID_AGE_MS);

        // Age by updatedAt, not createdAt: rebooking reuses cancelled documents
        // (see createAppointment), which keep their original createdAt. updatedAt
        // is refreshed on every save/findOneAndUpdate, so it marks when the
        // current hold actually started.
        const staleAppointments = await Appointment.find({
            status: 'pending',
            paymentStatus: false,
            updatedAt: { $lt: cutoff },
        });

        for (const appointment of staleAppointments) {
            const slotKey = slotKeyForDate(appointment.date);
            const pullSlot = {
                $pull: { [`slots_booked.${slotKey}`]: appointment.slotTime },
            };

            // Same lookup fallback as createAppointment: doctorId is normally a
            // User id, but may be a Doctor document id
            const released = await Doctor.findOneAndUpdate(
                { userId: appointment.doctorId },
                pullSlot
            );
            if (!released) {
                await Doctor.findByIdAndUpdate(appointment.doctorId, pullSlot);
            }

            await Appointment.deleteOne({ _id: appointment._id });
        }

        if (staleAppointments.length > 0) {
            console.log(`Appointment sweeper: removed ${staleAppointments.length} expired unpaid hold(s)`);
        }
    } catch (error) {
        console.error('Appointment sweeper error:', error.message);
    } finally {
        sweeping = false;
    }
};

export const startAppointmentSweeper = () => {
    // Production only. This sweeper DELETES appointment documents, and a local
    // .env points MONGO_URI at the same Atlas cluster production uses — so a dev
    // machine left running would silently reap live unpaid holds. The guard sits
    // here rather than at the call site so no future caller can bypass it.
    if (process.env.NODE_ENV !== 'production') {
        console.log('Appointment sweeper disabled (NODE_ENV is not "production")');
        return;
    }

    // unref() so the timers never keep the process alive on their own
    setTimeout(sweepUnpaidAppointments, FIRST_SWEEP_DELAY_MS).unref();
    setInterval(sweepUnpaidAppointments, SWEEP_INTERVAL_MS).unref();
};

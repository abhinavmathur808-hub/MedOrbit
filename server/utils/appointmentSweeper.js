import Appointment from '../models/Appointment.js';
import Doctor from '../models/Doctor.js';
import { slotKeyForDate } from './slotKey.js';

const SWEEP_INTERVAL_MS = 5 * 60 * 1000;  // run every 5 minutes
const MAX_UNPAID_AGE_MS = 15 * 60 * 1000; // unpaid holds older than this are removed
const FIRST_SWEEP_DELAY_MS = 30 * 1000;   // first pass shortly after boot

// Removes 'zombie' appointments: pending, UNPAID holds whose checkout was
// abandoned in a way the client could not clean up (closed tab, crashed
// browser). Frees the doctor's slot, then deletes the document so the unique
// (doctorId, date, slotTime) index cannot block a rebooking. Returns the count.
export const sweepUnpaidAppointments = async () => {
    const cutoff = new Date(Date.now() - MAX_UNPAID_AGE_MS);

    // Age by updatedAt, not createdAt: rebooking reuses cancelled documents (see
    // createAppointment), which keep their original createdAt. updatedAt is
    // refreshed on every save/findOneAndUpdate, so it marks when the current hold
    // actually started.
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

        // Same lookup fallback as createAppointment: doctorId is normally a User
        // id, but may be a Doctor document id.
        const released = await Doctor.findOneAndUpdate(
            { userId: appointment.doctorId },
            pullSlot
        );
        if (!released) {
            await Doctor.findByIdAndUpdate(appointment.doctorId, pullSlot);
        }

        await Appointment.deleteOne({ _id: appointment._id });
    }

    return staleAppointments.length;
};

// Transitions PAID appointments that sat in the past without ever being confirmed
// by the doctor to the terminal 'no-show' status, so the database agrees with the
// status the client already derives on read.
//
// Day-granular and timezone-agnostic on purpose: slotTime is a local-time string
// with no stored timezone, so — exactly like getRoomAccess — we only act once the
// entire appointment DAY is behind us (date < today 00:00 UTC). That boundary is
// unambiguous in every timezone and can never mislabel a still-upcoming visit; the
// trade-off is that a same-day past appointment is marked on a later pass rather
// than the instant its time passes (the client shows it immediately regardless).
// A bulk updateMany is used — the status change is terminal and idempotent
// (already-'no-show' rows no longer match), and there are no future slots to free
// for what are, by definition, past dates. Returns the count.
export const sweepNoShowAppointments = async () => {
    const now = new Date();
    const startOfTodayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

    const result = await Appointment.updateMany(
        { status: 'pending', paymentStatus: true, date: { $lt: startOfTodayUTC } },
        { $set: { status: 'no-show' } }
    );

    return result.modifiedCount || 0;
};

// One guarded pass runs both routines on every tick and never overlaps a slow run
// with itself. Each routine is isolated so a failure in one still lets the other
// run this cycle.
let sweeping = false;
const runScheduledSweep = async () => {
    if (sweeping) return;
    sweeping = true;

    try {
        try {
            const removed = await sweepUnpaidAppointments();
            if (removed > 0) {
                console.log(`Appointment sweeper: removed ${removed} expired unpaid hold(s)`);
            }
        } catch (error) {
            console.error('Appointment sweeper (unpaid holds) error:', error.message);
        }

        try {
            const noShows = await sweepNoShowAppointments();
            if (noShows > 0) {
                console.log(`Appointment sweeper: marked ${noShows} paid past-due appointment(s) as no-show`);
            }
        } catch (error) {
            console.error('Appointment sweeper (no-show) error:', error.message);
        }
    } finally {
        sweeping = false;
    }
};

export const startAppointmentSweeper = () => {
    // Production only. This sweeper DELETES unpaid holds and MUTATES paid
    // appointments to 'no-show', and a local .env points MONGO_URI at the same
    // Atlas cluster production uses — so a dev machine left running would silently
    // reap live holds and no-show live appointments. The guard sits here rather
    // than at the call site so no future caller can bypass it.
    if (process.env.NODE_ENV !== 'production') {
        console.log('Appointment sweeper disabled (NODE_ENV is not "production")');
        return;
    }

    // unref() so the timers never keep the process alive on their own
    setTimeout(runScheduledSweep, FIRST_SWEEP_DELAY_MS).unref();
    setInterval(runScheduledSweep, SWEEP_INTERVAL_MS).unref();
};

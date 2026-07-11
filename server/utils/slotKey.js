// Build the slots_booked key (d_m_yyyy) from a stored appointment date.
// Uses UTC getters because dates are stored as UTC midnight (new Date('YYYY-MM-DD')),
// so this matches the key built from the raw date string at creation on any server timezone.
export const slotKeyForDate = (date) =>
    `${date.getUTCDate()}_${date.getUTCMonth() + 1}_${date.getUTCFullYear()}`;

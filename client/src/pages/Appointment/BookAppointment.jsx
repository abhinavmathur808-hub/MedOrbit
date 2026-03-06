const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
    ArrowLeft,
    Clock,
    DollarSign,
    MapPin,
    Calendar,
    CheckCircle,
    XCircle,
    AlertCircle,
    BadgeCheck,
    Users,
    ChevronLeft,
    ChevronRight,
    Copy,
    Check
} from 'lucide-react';

import { handlePayment } from '../../utils/paymentHandler';
import { optimizeCloudinaryUrl } from '../../utils/cloudinaryUrl';
import DoctorCard from '../../components/DoctorCard';
import PageHeader from '../../components/PageHeader';
import CurvedWrapper from '../../components/CurvedWrapper';

const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const TIME_SLOTS = [
    '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM',
    '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM',
    '01:00 PM', '01:30 PM', '02:00 PM', '02:30 PM',
    '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM',
    '05:00 PM'
];

const toDateString = (d) => {
    return `${d.getDate()}_${d.getMonth() + 1}_${d.getFullYear()}`;
};

const toISODate = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
};

const isSameDay = (a, b) =>
    a && b &&
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

const slotToMinutes = (slot) => {
    const [time, period] = slot.split(' ');
    let [h, m] = time.split(':').map(Number);
    if (period === 'AM' && h === 12) h = 0;
    else if (period === 'PM' && h !== 12) h += 12;
    return h * 60 + m;
};

const formatDoctorName = (name) => {
    if (!name) return 'Doctor';
    return name.match(/^dr\.?\s/i) ? name : `Dr. ${name}`;
};

const BookAppointment = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);

    const [doctor, setDoctor] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [booking, setBooking] = useState(false);
    const [success, setSuccess] = useState(false);
    const [relatedDoctors, setRelatedDoctors] = useState([]);

    const today = useMemo(() => {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        return d;
    }, []);
    const [currentMonth, setCurrentMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
    const [selectedDate, setSelectedDate] = useState(null);

    const [selectedTime, setSelectedTime] = useState(null);

    const [reason, setReason] = useState('');

    const [confirmedTime, setConfirmedTime] = useState(null);
    const [confirmedDate, setConfirmedDate] = useState(null);

    const [copied, setCopied] = useState(false);
    const handleCopyUPI = () => {
        navigator.clipboard.writeText('success@razorpay');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const fetchDoctor = async () => {
        try {
            const response = await fetch(`${API_BASE}/api/doctor/${id}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });
            const data = await response.json();
            if (data.success) {
                setDoctor(data.doctor);
                return data.doctor;
            } else {
                setError(data.message || 'Failed to fetch doctor details');
            }
        } catch (err) {
            setError('Failed to connect to server');
        } finally {
            setLoading(false);
        }
        return null;
    };

    useEffect(() => {
        const fetchRelatedDoctors = async (specialization, doctorId) => {
            try {
                const response = await fetch(
                    `${API_BASE}/api/doctor/related?specialization=${encodeURIComponent(specialization)}&excludeId=${doctorId}`
                );
                const data = await response.json();
                if (data.success) setRelatedDoctors(data.doctors);
            } catch (err) {
            }
        };

        if (id) {
            fetchDoctor().then((doc) => {
                if (doc?.specialization) {
                    fetchRelatedDoctors(doc.specialization, doc._id);
                }
            });
        }
    }, [id]);

    const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
    const firstDayOfWeek = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();

    const prevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    };
    const nextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    };

    const canGoPrev = currentMonth.getFullYear() > today.getFullYear() ||
        (currentMonth.getFullYear() === today.getFullYear() && currentMonth.getMonth() > today.getMonth());

    const isDayDisabled = (dayNum) => {
        const d = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), dayNum);
        return d < today;
    };

    const handleDayClick = (dayNum) => {
        if (isDayDisabled(dayNum)) return;
        const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), dayNum);
        setSelectedDate(newDate);

        if (selectedTime) {
            const newDateKey = toDateString(newDate);
            const bookedSlots = doctor?.slots_booked?.[newDateKey];
            const isBooked = Array.isArray(bookedSlots) && bookedSlots.includes(selectedTime);
            const now = new Date();
            const isPast = isSameDay(newDate, today) && slotToMinutes(selectedTime) <= now.getHours() * 60 + now.getMinutes();
            if (isBooked || isPast) {
                setSelectedTime(null);
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!user) { navigate('/login'); return; }
        if (!selectedDate || !selectedTime) { setError('Please select both date and time'); return; }

        setBooking(true);
        setError('');

        const token = localStorage.getItem('token');
        const fees = doctor?.fees || 500;
        const doctorId = doctor?.userId?._id || id;
        const name = doctor?.userId?.name || 'Doctor';

        const userDetails = {
            name: user.name || '',
            email: user.email || '',
            phone: user.phone || '',
        };

        const dateStr = toISODate(selectedDate);

        const onPaymentSuccess = async (paymentData) => {
            const payload = {
                doctorId: doctor?.userId?._id || id,
                date: dateStr,
                slotTime: selectedTime,
                reason,
                paymentId: paymentData.paymentId,
                orderId: paymentData.orderId,
            };

            try {
                const response = await fetch(`${API_BASE}/api/appointments`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify(payload),
                });
                const data = await response.json();
                if (!response.ok) throw new Error(data.message || 'Booking failed');
                if (data.success) {
                    await fetchDoctor();
                    setConfirmedTime(selectedTime);
                    setConfirmedDate(toISODate(selectedDate));
                    setSelectedTime(null);
                    setSuccess(true);
                }
                else throw new Error(data.message || 'Booking failed');
            } catch (err) {
                setError(err.message || 'Failed to book appointment');
            } finally {
                setBooking(false);
            }
        };

        const onPaymentError = (error) => {
            setError(error.message || 'Payment failed. Please try again.');
            setBooking(false);
        };

        const appointmentDetails = { doctorName: name, date: dateStr, time: selectedTime };

        handlePayment(
            fees * 100,
            userDetails,
            appointmentDetails,
            onPaymentSuccess,
            onPaymentError,
            token,
            doctorId
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#09090b]">
                <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
                    <div className="text-center">
                        <div className="w-12 h-12 border-4 border-rose-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-zinc-400">Loading doctor details...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error && !doctor) {
        return (
            <div className="min-h-screen bg-[#09090b]">
                <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
                    <div className="text-center rounded-2xl p-8 max-w-md" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', boxShadow: 'var(--card-shadow)' }}>
                        <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                        <h2 className="text-xl font-bold text-white mb-2">Doctor Not Found</h2>
                        <p className="text-zinc-400 mb-6">{error}</p>
                        <Link to="/doctors" className="inline-block bg-rose-600 hover:bg-rose-700 text-white px-6 py-3 rounded-xl transition-all">
                            Back to Doctors
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    if (success) {
        return (
            <div className="min-h-screen bg-[#09090b]">
                <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
                    <div className="text-center rounded-2xl p-8 max-w-md" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', boxShadow: 'var(--card-shadow)' }}>
                        <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                        <h2 className="text-xl font-bold text-white mb-2">Booking Confirmed!</h2>
                        <p className="text-zinc-400 mb-2">
                            Your appointment with {formatDoctorName(doctor?.userId?.name)} has been scheduled.
                        </p>
                        <p className="font-medium mb-6 text-rose-400">
                            {confirmedDate} at {confirmedTime}
                        </p>
                        <div className="flex flex-col space-y-3">
                            <Link to="/appointments" className="bg-rose-600 hover:bg-rose-700 text-white px-6 py-3 rounded-xl transition-all">
                                View My Appointments
                            </Link>
                            <Link to="/doctors" className="bg-white/[0.05] hover:bg-white/[0.1] text-zinc-300 border border-zinc-700 px-6 py-3 rounded-xl transition-all">
                                Book Another
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const name = doctor?.userId?.name || 'Doctor';
    const photo = doctor?.userId?.photo || '';
    const specialization = doctor?.specialization || 'General Practice';
    const experience = doctor?.experience || 0;
    const fees = doctor?.fees || 0;
    const hospitalAddress = doctor?.hospitalAddress || 'Not specified';
    const isVerified = doctor?.userId?.isVerified || false;

    const isFormReady = selectedDate && selectedTime && user && !booking;



    return (
        <div className="min-h-screen bg-[#09090b]">
            <PageHeader title="Book Appointment" subtitle={`Schedule a visit with ${formatDoctorName(name)}`} />
            <CurvedWrapper>
                <div className="max-w-5xl mx-auto">
                    <Link to="/doctors" className="inline-flex items-center space-x-2 text-zinc-500 hover:text-rose-400 mb-6 transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                        <span>Back to Doctors</span>
                    </Link>

                    <div className="grid lg:grid-cols-[340px_1fr] gap-6">

                        <div className="rounded-2xl p-6 h-fit" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', boxShadow: 'var(--card-shadow)' }}>
                            <h2 className="text-lg font-semibold text-white mb-4">Doctor Details</h2>

                            <div className="flex items-center space-x-4 mb-6">
                                <div className="w-16 h-16 bg-gradient-to-br from-rose-600 to-rose-800 rounded-xl flex items-center justify-center text-white text-xl font-bold">
                                    {photo ? (
                                        <img src={optimizeCloudinaryUrl(photo)} alt={name} className="w-full h-full object-cover rounded-xl" loading="lazy" />
                                    ) : (
                                        name.charAt(0).toUpperCase()
                                    )}
                                </div>
                                <div>
                                    <div className="flex items-center gap-1">
                                        <h3 className="text-xl font-bold text-white">{name}</h3>
                                        {isVerified && <BadgeCheck className="w-5 h-5 text-blue-400" />}
                                    </div>
                                    <p className="text-rose-400 font-medium">{specialization}</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center space-x-3 text-zinc-400">
                                    <Clock className="w-5 h-5 text-rose-500" />
                                    <span>{experience} years experience</span>
                                </div>
                                <div className="flex items-center space-x-3 text-zinc-400">
                                    <DollarSign className="w-5 h-5 text-rose-500" />
                                    <span>₹{fees} consultation fee</span>
                                </div>
                                <div className="flex items-center space-x-3 text-zinc-400">
                                    <MapPin className="w-5 h-5 text-zinc-600" />
                                    <span className="text-sm">{hospitalAddress}</span>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-2xl p-6" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', boxShadow: 'var(--card-shadow)' }}>
                            <h2 className="text-lg font-semibold text-white mb-5 flex items-center space-x-2">
                                <Calendar className="w-5 h-5 text-rose-500" />
                                <span>Book Appointment</span>
                            </h2>

                            {!user && (
                                <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex items-start space-x-3">
                                    <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                                    <p className="text-yellow-400 text-sm">
                                        Please <Link to="/login" className="text-rose-400 font-medium hover:underline">login</Link> to book an appointment.
                                    </p>
                                </div>
                            )}

                            {error && (
                                <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm">
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-6">

                                <div>
                                    <label className="booking-label block text-sm font-semibold text-white mb-3 flex items-center gap-2">
                                        <Calendar className="booking-label-icon w-4 h-4" />
                                        Select Date
                                    </label>

                                    <div className="border border-zinc-800 rounded-xl p-4">
                                        <div className="flex items-center justify-between mb-4">
                                            <button
                                                type="button"
                                                onClick={prevMonth}
                                                disabled={!canGoPrev}
                                                className="p-1.5 rounded-lg hover:bg-white/[0.06] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                            >
                                                <ChevronLeft className="w-5 h-5 text-zinc-400" />
                                            </button>
                                            <h3 className="text-base font-bold text-white">
                                                {MONTH_NAMES[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                                            </h3>
                                            <button
                                                type="button"
                                                onClick={nextMonth}
                                                className="p-1.5 rounded-lg hover:bg-white/[0.06] transition-colors"
                                            >
                                                <ChevronRight className="w-5 h-5 text-zinc-400" />
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-7 mb-2">
                                            {DAY_LABELS.map((d) => (
                                                <div key={d} className="text-center text-xs font-semibold text-zinc-600 py-1">
                                                    {d}
                                                </div>
                                            ))}
                                        </div>

                                        <div className="grid grid-cols-7 gap-1">
                                            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                                                <div key={`empty-${i}`} />
                                            ))}

                                            {Array.from({ length: daysInMonth }, (_, i) => {
                                                const dayNum = i + 1;
                                                const thisDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), dayNum);
                                                const disabled = isDayDisabled(dayNum);
                                                const selected = isSameDay(selectedDate, thisDate);
                                                const isToday = isSameDay(today, thisDate);

                                                return (
                                                    <button
                                                        key={dayNum}
                                                        type="button"
                                                        disabled={disabled}
                                                        onClick={() => handleDayClick(dayNum)}
                                                        className={`
                                                            relative w-full aspect-square flex items-center justify-center
                                                            text-sm font-medium rounded-lg transition-all duration-150
                                                            ${disabled
                                                                ? 'text-zinc-700 cursor-not-allowed'
                                                                : selected
                                                                    ? 'bg-rose-600 text-white shadow-md'
                                                                    : 'text-zinc-300 hover:bg-white/[0.06] cursor-pointer'
                                                            }
                                                        `}
                                                    >
                                                        {dayNum}
                                                        {isToday && !selected && (
                                                            <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-rose-500" />
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="booking-label block text-sm font-semibold text-white mb-3 flex items-center gap-2">
                                        <Clock className="booking-label-icon w-4 h-4" />
                                        Select Time
                                    </label>

                                    {(() => {
                                        const now = new Date();
                                        const nowMinutes = now.getHours() * 60 + now.getMinutes();
                                        const isSelectedToday = selectedDate && isSameDay(selectedDate, today);
                                        const hasAvailable = TIME_SLOTS.some((slot) => {
                                            if (isSelectedToday && slotToMinutes(slot) <= nowMinutes) return false;
                                            const dateKey = selectedDate ? toDateString(selectedDate) : null;
                                            if (dateKey && doctor?.slots_booked?.[dateKey]?.includes(slot)) return false;
                                            return true;
                                        });

                                        if (isSelectedToday && !hasAvailable) {
                                            return (
                                                <div className="flex flex-col items-center justify-center py-8 text-center">
                                                    <Clock className="w-10 h-10 text-zinc-600 mb-3" />
                                                    <p className="text-zinc-400 font-medium">No more slots available for today</p>
                                                    <p className="text-zinc-600 text-sm mt-1">Please select another date to continue booking.</p>
                                                </div>
                                            );
                                        }

                                        return (
                                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                                {TIME_SLOTS.map((slot) => {
                                                    const dateKey = selectedDate ? toDateString(selectedDate) : null;
                                                    const isBooked = dateKey && doctor?.slots_booked?.[dateKey]?.includes(slot);
                                                    const isPast = isSelectedToday && slotToMinutes(slot) <= nowMinutes;
                                                    const isUnavailable = isBooked || isPast;
                                                    const selected = !isUnavailable && selectedTime === slot;

                                                    return (
                                                        <button
                                                            key={slot}
                                                            type="button"
                                                            disabled={isUnavailable}
                                                            title={isBooked ? 'Already booked' : isPast ? 'This time has passed' : ''}
                                                            onClick={() => {
                                                                if (isUnavailable) return;
                                                                setSelectedTime(slot);
                                                            }}
                                                            className={`text-sm font-medium px-3 py-2.5 rounded-full border transition-all duration-150 ${isUnavailable
                                                                ? 'bg-zinc-900 border-zinc-800 text-zinc-600 cursor-not-allowed line-through opacity-50'
                                                                : selected
                                                                    ? 'bg-rose-600 border-rose-600 text-white shadow-md'
                                                                    : 'border-zinc-700 text-zinc-300 hover:border-rose-500 hover:bg-white/[0.03]'
                                                                }`}
                                                        >
                                                            {slot}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        );
                                    })()}
                                </div>

                                <div>
                                    <label className="booking-label block text-sm font-semibold text-white mb-2">
                                        Reason for Visit (Optional)
                                    </label>
                                    <textarea
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                        rows="3"
                                        placeholder="Briefly describe your symptoms or reason for consultation..."
                                        className="w-full px-4 py-3 bg-black/50 border border-zinc-800 rounded-xl focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition-all outline-none resize-none text-white placeholder-zinc-600"
                                    />
                                </div>

                                <div className="w-full bg-[#121212] border border-zinc-800 border-l-4 border-l-rose-600 rounded-lg p-5 my-6 relative overflow-hidden shadow-lg">
                                    <div className="flex items-start gap-3">
                                        <AlertCircle className="text-rose-500 w-5 h-5 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-rose-500 font-bold tracking-wide flex items-center gap-2 mb-3">
                                                🧪 TEST MODE ENABLED
                                            </p>
                                            <p className="text-zinc-400 text-sm mb-4">
                                                No real money is required. To simulate a successful payment:
                                            </p>
                                            <div className="space-y-2">
                                                <ol className="text-zinc-300 text-sm space-y-2 list-decimal list-inside">
                                                    <li>Click <strong className="font-semibold text-zinc-100">Confirm Booking</strong> → Select <strong className="font-semibold text-zinc-100">UPI</strong></li>
                                                    <li>Enter UPI ID:
                                                        <span className="inline-flex items-center gap-2 bg-rose-950/40 border border-rose-900/50 rounded-md px-2 py-1 mx-1">
                                                            <span className="font-mono text-xs text-rose-400">success@razorpay</span>
                                                            <button
                                                                type="button"
                                                                onClick={handleCopyUPI}
                                                                className="text-zinc-400 hover:text-rose-400 transition-colors focus:outline-none"
                                                                title="Copy UPI ID"
                                                            >
                                                                {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                                                            </button>
                                                        </span>
                                                    </li>
                                                    <li>Click <strong className="font-semibold text-zinc-100">Pay Now</strong></li>
                                                </ol>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white/[0.03] border border-zinc-800 rounded-xl p-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-zinc-400">Consultation Fee</span>
                                        <span className="text-xl font-bold text-white">₹{fees}</span>
                                    </div>
                                </div>

                                {(selectedDate || selectedTime) && (
                                    <div className="flex flex-wrap items-center gap-2 text-sm">
                                        {selectedDate && (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-600 text-white text-xs font-medium">
                                                <Calendar className="w-3 h-3" />
                                                {selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                            </span>
                                        )}
                                        {selectedTime && (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-600 text-white text-xs font-medium">
                                                <Clock className="w-3 h-3" />
                                                {selectedTime}
                                            </span>
                                        )}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={!isFormReady}
                                    className={`w-full py-3.5 rounded-xl font-semibold text-white transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl ${isFormReady ? 'bg-rose-600 hover:bg-rose-700' : 'bg-zinc-700'}`}
                                >
                                    {booking ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            <span>Processing...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Calendar className="w-5 h-5" />
                                            <span>Confirm Booking</span>
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>

                    {relatedDoctors.length > 0 && (
                        <div className="mt-8">
                            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                <Users className="w-5 h-5 text-rose-500" />
                                Related {doctor?.specialization} Specialists
                            </h2>
                            <div className="grid md:grid-cols-3 gap-6">
                                {relatedDoctors.map((relDoc) => (
                                    <DoctorCard key={relDoc._id} doctor={relDoc} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </CurvedWrapper>
        </div>
    );
};

export default BookAppointment;

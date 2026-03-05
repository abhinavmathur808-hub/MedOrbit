const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
    Calendar,
    Clock,
    User,
    CheckCircle,
    XCircle,
    AlertCircle,
    RefreshCw,
    Stethoscope,
    Phone,
    Check,
    X,
    Video,
    Star,
    FileText
} from 'lucide-react';
import ReviewModal from '../../components/ReviewModal';
import ViewPrescriptionModal from '../../components/ViewPrescriptionModal';
import CancelModal from '../../components/CancelModal';
import PageHeader from '../../components/PageHeader';
import CurvedWrapper from '../../components/CurvedWrapper';

const MyAppointments = () => {
    const { user } = useSelector((state) => state.auth);
    const navigate = useNavigate();

    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [updating, setUpdating] = useState(null); // Track which appointment is being updated
    const [reviewModalOpen, setReviewModalOpen] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [reviewedAppointments, setReviewedAppointments] = useState(new Set());
    const [prescriptionModalOpen, setPrescriptionModalOpen] = useState(false);
    const [selectedAppointmentForPrescription, setSelectedAppointmentForPrescription] = useState(null);
    const [cancelModalOpen, setCancelModalOpen] = useState(false);
    const [cancelAppointmentId, setCancelAppointmentId] = useState(null);
    const [activeTab, setActiveTab] = useState('upcoming');

    useEffect(() => {
        const fetchAppointments = async () => {

            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    setLoading(false);
                    return;
                }

                const response = await fetch(`${API_BASE}/api/appointments`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                });

                const data = await response.json();

                if (data.success) {
                    setAppointments(data.appointments || []);
                } else {
                    setError(data.message || 'Failed to fetch appointments');
                }
            } catch (err) {
                setError('Failed to connect to server');
            } finally {
                setLoading(false);
            }
        };

        fetchAppointments();
    }, []);

    const handleStatusChange = async (appointmentId, newStatus) => {
        setUpdating(appointmentId);

        try {
            const token = localStorage.getItem('token');

            const response = await fetch(`${API_BASE}/api/appointments/${appointmentId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ status: newStatus }),
            });

            const data = await response.json();

            if (data.success) {
                setAppointments(prev =>
                    prev.map(appt =>
                        appt._id === appointmentId
                            ? { ...appt, status: newStatus }
                            : appt
                    )
                );
            } else {
                setError(data.message || 'Failed to update status');
            }
        } catch (err) {
            setError('Failed to update appointment status');
        } finally {
            setUpdating(null);
        }
    };

    const openCancelModal = (appointmentId) => {
        setCancelAppointmentId(appointmentId);
        setCancelModalOpen(true);
    };

    const confirmCancellation = async (reason) => {
        const appointmentId = cancelAppointmentId;
        setCancelModalOpen(false);
        setCancelAppointmentId(null);

        setUpdating(appointmentId);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE}/api/users/cancel-appointment`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ appointmentId, reason }),
            });

            const data = await response.json();

            if (data.success) {
                setAppointments(prev =>
                    prev.map(appt =>
                        appt._id === appointmentId
                            ? { ...appt, status: 'cancelled' }
                            : appt
                    )
                );
            } else {
                setError(data.message || 'Failed to cancel appointment');
            }
        } catch (err) {
            setError('Failed to cancel appointment');
        } finally {
            setUpdating(null);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-IN', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'confirmed':
                return 'bg-green-100 text-green-700 border-green-200';
            case 'pending':
                return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'cancelled':
                return 'bg-red-100 text-red-700 border-red-200';
            case 'completed':
                return 'bg-blue-100 text-blue-700 border-blue-200';
            default:
                return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'confirmed':
                return <CheckCircle className="w-4 h-4" />;
            case 'pending':
                return <AlertCircle className="w-4 h-4" />;
            case 'cancelled':
                return <XCircle className="w-4 h-4" />;
            default:
                return <Clock className="w-4 h-4" />;
        }
    };

    if (!user) {
        return (
            <div className="min-h-screen bg-[#09090b]">
                <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
                    <div className="text-center rounded-2xl p-8 max-w-md" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', boxShadow: 'var(--card-shadow)' }}>
                        <XCircle className="w-16 h-16 text-rose-500 mx-auto mb-4" />
                        <h2 className="text-xl font-bold text-white mb-2">Not Logged In</h2>
                        <p className="text-zinc-400 mb-6">Please login to view your appointments.</p>
                        <Link to="/login" className="inline-block bg-rose-600 hover:bg-rose-700 text-white px-6 py-3 rounded-xl transition-all">Go to Login</Link>
                    </div>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-[#09090b]">
                <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
                    <div className="text-center">
                        <RefreshCw className="w-12 h-12 text-rose-500 animate-spin mx-auto mb-4" />
                        <p className="text-zinc-400">Loading appointments...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#09090b]">
            <PageHeader title="My Appointments" subtitle={`${appointments.length} appointment${appointments.length !== 1 ? 's' : ''} found`} />
            <CurvedWrapper>
                <div className="max-w-4xl mx-auto">
                    <div className="mb-8">
                        <Link to="/doctors" className="w-full bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-xl transition-all flex items-center justify-center space-x-2">
                            <Calendar className="w-4 h-4" />
                            <span>Book New Appointment</span>
                        </Link>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl">
                            {error}
                        </div>
                    )}

                    {appointments.length === 0 && !error && (
                        <div className="text-center py-16 rounded-2xl" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', boxShadow: 'var(--card-shadow)' }}>
                            <Calendar className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-zinc-400 mb-2">No appointments yet</h3>
                            <p className="text-zinc-600 mb-6">Book your first appointment with a doctor</p>
                            <Link to="/doctors" className="inline-block bg-rose-600 hover:bg-rose-700 text-white px-6 py-3 rounded-xl transition-all">Find Doctors</Link>
                        </div>
                    )}

                    {appointments.length > 0 && (() => {
                        const now = new Date();
                        const nowMs = now.getTime();

                        const getTimestamp = (appt) => {
                            const d = new Date(appt.date);
                            if (isNaN(d.getTime())) {
                                return 0; // Send to past if unparseable
                            }
                            const localDate = new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());

                            if (appt.slotTime) {
                                const [time, period] = appt.slotTime.split(' ');
                                if (time) {
                                    let [h, m] = time.split(':').map(Number);
                                    if (period === 'AM' && h === 12) h = 0;
                                    else if (period === 'PM' && h !== 12) h += 12;
                                    if (!isNaN(h) && !isNaN(m)) {
                                        localDate.setHours(h, m, 0, 0);
                                    }
                                }
                            }
                            return localDate.getTime();
                        };

                        const sorted = [...appointments].sort((a, b) => getTimestamp(b) - getTimestamp(a));

                        const upcomingAppointments = sorted.filter(
                            (appt) => getTimestamp(appt) >= nowMs && appt.status !== 'cancelled'
                        );
                        const pastAppointments = sorted.filter(
                            (appt) => getTimestamp(appt) < nowMs || appt.status === 'cancelled'
                        );

                        const displayList = activeTab === 'upcoming' ? upcomingAppointments : pastAppointments;

                        return (
                            <>
                                <div className="flex mb-6 rounded-xl overflow-hidden border border-zinc-800">
                                    <button
                                        onClick={() => setActiveTab('upcoming')}
                                        className={`flex-1 py-3 text-sm font-semibold transition-all ${activeTab === 'upcoming'
                                            ? 'bg-rose-600 text-white'
                                            : 'bg-zinc-900 text-zinc-400 hover:text-white'
                                            }`}
                                    >
                                        Upcoming ({upcomingAppointments.length})
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('past')}
                                        className={`flex-1 py-3 text-sm font-semibold transition-all ${activeTab === 'past'
                                            ? 'bg-rose-600 text-white'
                                            : 'bg-zinc-900 text-zinc-400 hover:text-white'
                                            }`}
                                    >
                                        Past ({pastAppointments.length})
                                    </button>
                                </div>

                                {displayList.length === 0 && (
                                    <div className="text-center py-12 rounded-2xl" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', boxShadow: 'var(--card-shadow)' }}>
                                        <Calendar className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
                                        <p className="text-zinc-400">
                                            {activeTab === 'upcoming' ? 'No upcoming appointments.' : 'No past appointments.'}
                                        </p>
                                    </div>
                                )}

                                {displayList.length > 0 && (
                                    <div className="space-y-4">
                                        {displayList.map((appt) => {
                                            const isDoctor = appt.isDoctor;
                                            const displayName = isDoctor
                                                ? (appt.patientName || 'Patient')
                                                : (appt.doctorName || 'Doctor');
                                            const displayPhoto = isDoctor
                                                ? appt.patientPhoto
                                                : appt.doctorPhoto;
                                            const displayPhone = isDoctor
                                                ? appt.patientPhone
                                                : appt.doctorPhone;
                                            const subtitle = isDoctor
                                                ? 'Patient'
                                                : (appt.specialization || 'Doctor');

                                            return (
                                                <div
                                                    key={appt._id}
                                                    className="rounded-2xl p-6 transition-all"
                                                    style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', boxShadow: 'var(--card-shadow)' }}
                                                >
                                                    <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                                                        <div className="flex items-center space-x-4">
                                                            <div className="w-14 h-14 bg-gradient-to-br from-rose-600 to-rose-800 rounded-xl flex items-center justify-center text-white text-xl font-bold">
                                                                {displayPhoto ? (
                                                                    <img
                                                                        src={displayPhoto}
                                                                        alt={displayName}
                                                                        className="w-full h-full object-cover rounded-xl"
                                                                    />
                                                                ) : (
                                                                    displayName?.charAt(0)?.toUpperCase() || 'U'
                                                                )}
                                                            </div>
                                                            <div>
                                                                <h3 className="font-bold text-white">{displayName}</h3>
                                                                <p className={`text-sm ${isDoctor ? 'text-purple-600' : 'text-rose-600'}`}>
                                                                    {subtitle}
                                                                </p>
                                                                {isDoctor && displayPhone && (
                                                                    <p className="text-gray-500 text-sm flex items-center space-x-1">
                                                                        <Phone className="w-3 h-3" />
                                                                        <span>{displayPhone}</span>
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center space-x-6">
                                                            <div className="text-center">
                                                                <p className="text-zinc-600 text-xs uppercase">Date</p>
                                                                <p className="font-semibold text-white">{formatDate(appt.date)}</p>
                                                            </div>
                                                            <div className="text-center">
                                                                <p className="text-zinc-600 text-xs uppercase">Time</p>
                                                                <p className="font-semibold text-white">{appt.slotTime || 'N/A'}</p>
                                                            </div>

                                                            <div className={`flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium border ${getStatusBadge(appt.status)}`}>
                                                                {getStatusIcon(appt.status)}
                                                                <span className="capitalize">{appt.status}</span>
                                                            </div>

                                                            {isDoctor && appt.status === 'pending' && (
                                                                <div className="flex items-center space-x-2 ml-4">
                                                                    <button
                                                                        onClick={() => handleStatusChange(appt._id, 'confirmed')}
                                                                        disabled={updating === appt._id}
                                                                        className="flex items-center space-x-1 bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
                                                                    >
                                                                        {updating === appt._id ? (
                                                                            <RefreshCw className="w-4 h-4 animate-spin" />
                                                                        ) : (
                                                                            <Check className="w-4 h-4" />
                                                                        )}
                                                                        <span>Approve</span>
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleStatusChange(appt._id, 'cancelled')}
                                                                        disabled={updating === appt._id}
                                                                        className="flex items-center space-x-1 bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
                                                                    >
                                                                        <X className="w-4 h-4" />
                                                                        <span>Cancel</span>
                                                                    </button>
                                                                </div>
                                                            )}

                                                            {!isDoctor && appt.status !== 'cancelled' && appt.status !== 'completed' && activeTab === 'upcoming' && (
                                                                <button
                                                                    onClick={() => openCancelModal(appt._id)}
                                                                    disabled={updating === appt._id}
                                                                    className="text-sm text-stone-500 text-center sm:min-w-48 py-2 border rounded hover:bg-red-600 hover:text-white transition-all duration-300 ml-4 px-4 disabled:opacity-50"
                                                                >
                                                                    {updating === appt._id ? (
                                                                        <RefreshCw className="w-4 h-4 animate-spin inline mr-1" />
                                                                    ) : null}
                                                                    Cancel Appointment
                                                                </button>
                                                            )}

                                                            {!isDoctor && appt.status === 'cancelled' && (
                                                                <span className="text-red-500 font-medium border border-red-500 rounded px-2 py-1 text-sm ml-4">
                                                                    Cancelled
                                                                </span>
                                                            )}

                                                            {appt.status === 'confirmed' && (() => {
                                                                const apptTs = getTimestamp(appt);
                                                                const startTime = apptTs - (5 * 60 * 1000); // 5 min before
                                                                const endTime = apptTs + (30 * 60 * 1000);  // 30 min after
                                                                const canJoin = apptTs > 0 && nowMs >= startTime && nowMs <= endTime;
                                                                const expired = apptTs > 0 && nowMs > endTime;
                                                                if (expired) return null; // Hide button after session window
                                                                return (
                                                                    <button
                                                                        onClick={() => canJoin && navigate(`/room/${appt._id}`)}
                                                                        disabled={!canJoin}
                                                                        className={`flex items-center space-x-1 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ml-4 ${canJoin
                                                                            ? 'bg-blue-500 hover:bg-blue-600 text-white cursor-pointer'
                                                                            : 'bg-zinc-700/50 text-zinc-500 cursor-not-allowed'
                                                                            }`}
                                                                        title={canJoin ? 'Join Video Call' : 'Available 5 min before appointment'}
                                                                    >
                                                                        <Video className="w-4 h-4" />
                                                                        <span>{canJoin ? 'Join Video Call' : 'Not Yet'}</span>
                                                                    </button>
                                                                );
                                                            })()}

                                                            {!isDoctor && appt.status === 'completed' && !reviewedAppointments.has(appt._id) && (
                                                                <button
                                                                    onClick={() => {
                                                                        setSelectedAppointment(appt);
                                                                        setReviewModalOpen(true);
                                                                    }}
                                                                    className="flex items-center space-x-1 bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-all ml-4"
                                                                >
                                                                    <Star className="w-4 h-4" />
                                                                    <span>Leave Review</span>
                                                                </button>
                                                            )}

                                                            {!isDoctor && appt.status === 'completed' && reviewedAppointments.has(appt._id) && (
                                                                <div className="flex items-center space-x-1 bg-green-100 text-green-700 px-3 py-1.5 rounded-lg text-sm font-medium ml-4">
                                                                    <CheckCircle className="w-4 h-4" />
                                                                    <span>Reviewed</span>
                                                                </div>
                                                            )}

                                                            {!isDoctor && appt.status === 'completed' && appt.hasPrescription && (
                                                                <button
                                                                    onClick={() => {
                                                                        setSelectedAppointmentForPrescription(appt._id);
                                                                        setPrescriptionModalOpen(true);
                                                                    }}
                                                                    className="flex items-center space-x-1 bg-purple-500 hover:bg-purple-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-all ml-4"
                                                                >
                                                                    <FileText className="w-4 h-4" />
                                                                    <span>View Prescription</span>
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </>
                        );
                    })()}
                </div>
            </CurvedWrapper>

            <ReviewModal
                isOpen={reviewModalOpen}
                onClose={() => {
                    setReviewModalOpen(false);
                    setSelectedAppointment(null);
                }}
                appointment={selectedAppointment}
                onReviewSubmitted={(appointmentId) => {
                    setReviewedAppointments(prev => new Set([...prev, appointmentId]));
                }}
            />

            <ViewPrescriptionModal
                isOpen={prescriptionModalOpen}
                onClose={() => {
                    setPrescriptionModalOpen(false);
                    setSelectedAppointmentForPrescription(null);
                }}
                appointmentId={selectedAppointmentForPrescription}
            />

            <CancelModal
                isOpen={cancelModalOpen}
                onClose={() => {
                    setCancelModalOpen(false);
                    setCancelAppointmentId(null);
                }}
                onConfirm={confirmCancellation}
                loading={updating === cancelAppointmentId}
            />
        </div>
    );
};

export default MyAppointments;

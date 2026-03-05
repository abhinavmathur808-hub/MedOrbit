const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
    Calendar,
    Clock,
    User,
    CheckCircle,
    XCircle,
    AlertCircle,
    Loader2,
    Check,
    X,
    DollarSign,
    Video,
    RefreshCw,
    FileText,
} from 'lucide-react';
import PrescriptionModal from '../../components/PrescriptionModal';
import CancelModal from '../../components/CancelModal';
import PageHeader from '../../components/PageHeader';
import CurvedWrapper from '../../components/CurvedWrapper';

const DoctorDashboard = () => {
    const navigate = useNavigate();
    const { user, token } = useSelector((state) => state.auth);
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [updating, setUpdating] = useState(null);
    const [filter, setFilter] = useState('all');
    const [prescriptionModalOpen, setPrescriptionModalOpen] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [prescribedAppointments, setPrescribedAppointments] = useState(new Set());
    const [cancelModalOpen, setCancelModalOpen] = useState(false);
    const [cancelAppointmentId, setCancelAppointmentId] = useState(null);

    useEffect(() => {
        if (!user) {
            navigate('/login');
        } else if (user.role !== 'doctor') {
            navigate('/');
        }
    }, [user, navigate]);

    const fetchAppointments = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_BASE}/api/appointments`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await response.json();

            if (data.success) {
                setAppointments(data.appointments);
            } else {
                setError(data.message || 'Failed to fetch appointments');
            }
        } catch (err) {
            setError('Failed to connect to server');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token && user?.role === 'doctor') {
            fetchAppointments();
        }
    }, [token, user]);

    const updateStatus = async (appointmentId, newStatus) => {
        setUpdating(appointmentId);
        try {
            const response = await fetch(`${API_BASE}/api/appointments/${appointmentId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ status: newStatus }),
            });

            const data = await response.json();

            if (data.success) {
                setAppointments((prev) =>
                    prev.map((apt) =>
                        apt._id === appointmentId ? { ...apt, status: newStatus } : apt
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
            const response = await fetch(`${API_BASE}/api/doctor/cancel-appointment`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ appointmentId, reason }),
            });

            const data = await response.json();

            if (data.success) {
                setAppointments((prev) =>
                    prev.map((apt) =>
                        apt._id === appointmentId ? { ...apt, status: 'cancelled' } : apt
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
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-IN', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    const getTimestamp = (appt) => {
        const d = new Date(appt.date);
        if (isNaN(d.getTime())) return 0;
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

    const nowMs = new Date().getTime();

    const filteredAppointments = appointments.filter((apt) => {
        if (filter === 'all') return true;
        return apt.status === filter;
    });

    const stats = {
        total: appointments.length,
        pending: appointments.filter((a) => a.status === 'pending').length,
        confirmed: appointments.filter((a) => a.status === 'confirmed').length,
        completed: appointments.filter((a) => a.status === 'completed').length,
    };

    const statusColors = {
        pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
        confirmed: 'bg-green-500/10 text-green-400 border-green-500/20',
        cancelled: 'bg-red-500/10 text-red-400 border-red-500/20',
        completed: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#09090b]">
                <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
                    <div className="text-center">
                        <Loader2 className="w-12 h-12 text-rose-500 animate-spin mx-auto mb-4" />
                        <p className="text-zinc-400">Loading appointments...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#09090b]">
            <PageHeader title="Doctor Dashboard" subtitle="Manage your patient appointments" />
            <CurvedWrapper>
                <div className="max-w-7xl mx-auto">

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                        <div className="rounded-xl p-4" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', boxShadow: 'var(--card-shadow)' }}>
                            <p className="text-zinc-500 text-sm">Total</p>
                            <p className="text-2xl font-bold text-white">{stats.total}</p>
                        </div>
                        <div className="rounded-xl p-4 bg-yellow-500/5 border border-yellow-500/10">
                            <p className="text-yellow-400 text-sm">Pending</p>
                            <p className="text-2xl font-bold text-yellow-400">{stats.pending}</p>
                        </div>
                        <div className="rounded-xl p-4 bg-green-500/5 border border-green-500/10">
                            <p className="text-green-400 text-sm">Confirmed</p>
                            <p className="text-2xl font-bold text-green-400">{stats.confirmed}</p>
                        </div>
                        <div className="rounded-xl p-4 bg-blue-500/5 border border-blue-500/10">
                            <p className="text-blue-400 text-sm">Completed</p>
                            <p className="text-2xl font-bold text-blue-400">{stats.completed}</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 mb-6">
                        <div className="flex gap-2">
                            {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map((f) => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === f
                                        ? 'bg-rose-600 text-white'
                                        : 'bg-white/[0.06] text-zinc-400 hover:bg-white/[0.1] border border-zinc-800'
                                        }`}
                                >
                                    {f.charAt(0).toUpperCase() + f.slice(1)}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={fetchAppointments}
                            className="ml-auto flex items-center gap-2 px-4 py-2 bg-white/[0.06] border border-zinc-800 rounded-lg text-zinc-400 hover:bg-white/[0.1] transition-all"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Refresh
                        </button>
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mb-6 flex items-center gap-3">
                            <AlertCircle className="w-5 h-5" />
                            {error}
                            <button onClick={() => setError('')} className="ml-auto">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    )}

                    {filteredAppointments.length === 0 && (
                        <div className="rounded-2xl p-12 text-center" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', boxShadow: 'var(--card-shadow)' }}>
                            <Calendar className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
                            <h2 className="text-xl font-semibold text-white mb-2">No Appointments</h2>
                            <p className="text-zinc-400">
                                {filter === 'all'
                                    ? "You don't have any appointments yet."
                                    : `No ${filter} appointments found.`}
                            </p>
                        </div>
                    )}

                    {filteredAppointments.length > 0 && (
                        <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', boxShadow: 'var(--card-shadow)' }}>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-white/[0.03] border-b border-zinc-800">
                                        <tr>
                                            <th className="text-left px-6 py-4 text-sm font-semibold text-zinc-400">Patient</th>
                                            <th className="text-left px-6 py-4 text-sm font-semibold text-zinc-400">Date & Time</th>
                                            <th className="text-left px-6 py-4 text-sm font-semibold text-zinc-400">Payment</th>
                                            <th className="text-left px-6 py-4 text-sm font-semibold text-zinc-400">Status</th>
                                            <th className="text-left px-6 py-4 text-sm font-semibold text-zinc-400">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-800/50">
                                        {filteredAppointments.map((appointment) => {
                                            const patientName = appointment.patientName || appointment.patientId?.name || 'Unknown Patient';
                                            const patientEmail = appointment.patientEmail || appointment.patientId?.email || '';
                                            const patientPhoto = appointment.patientPhoto || appointment.patientId?.photo || '';
                                            const isPaid = appointment.paymentStatus;

                                            return (
                                                <tr key={appointment._id} className="hover:bg-white/[0.03] transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            {patientPhoto ? (
                                                                <img
                                                                    src={patientPhoto}
                                                                    alt={patientName}
                                                                    className="w-10 h-10 rounded-full object-cover"
                                                                />
                                                            ) : (
                                                                <div className="w-10 h-10 bg-rose-600/20 rounded-full flex items-center justify-center text-rose-400 font-bold">
                                                                    {patientName.charAt(0).toUpperCase()}
                                                                </div>
                                                            )}
                                                            <div>
                                                                <p className="font-medium text-white">{patientName}</p>
                                                                <p className="text-xs text-zinc-500">{patientEmail}</p>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2 text-zinc-400">
                                                            <Calendar className="w-4 h-4 text-rose-500" />
                                                            <span className="text-sm">{formatDate(appointment.date)}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-zinc-500 mt-1">
                                                            <Clock className="w-4 h-4 text-purple-400" />
                                                            <span className="text-sm">{appointment.slotTime}</span>
                                                        </div>
                                                    </td>

                                                    <td className="px-6 py-4">
                                                        {isPaid ? (
                                                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-500/10 text-green-400 rounded-full text-xs font-medium">
                                                                <CheckCircle className="w-3 h-3" />
                                                                Paid
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-500/10 text-yellow-400 rounded-full text-xs font-medium">
                                                                <AlertCircle className="w-3 h-3" />
                                                                Pending
                                                            </span>
                                                        )}
                                                    </td>

                                                    <td className="px-6 py-4">
                                                        <span
                                                            className={`px-3 py-1 rounded-full text-xs font-medium border ${statusColors[appointment.status] || statusColors.pending
                                                                }`}
                                                        >
                                                            {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                                                        </span>
                                                    </td>

                                                    <td className="px-6 py-4">
                                                        <div className="flex gap-2">
                                                            {appointment.status === 'pending' && (
                                                                <>
                                                                    <button
                                                                        onClick={() => updateStatus(appointment._id, 'confirmed')}
                                                                        disabled={updating === appointment._id}
                                                                        className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs rounded-lg transition-all disabled:opacity-50"
                                                                    >
                                                                        {updating === appointment._id ? (
                                                                            <Loader2 className="w-3 h-3 animate-spin" />
                                                                        ) : (
                                                                            <Check className="w-3 h-3" />
                                                                        )}
                                                                        Approve
                                                                    </button>
                                                                    <button
                                                                        onClick={() => openCancelModal(appointment._id)}
                                                                        disabled={updating === appointment._id}
                                                                        className="flex items-center gap-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs rounded-lg transition-all disabled:opacity-50"
                                                                    >
                                                                        <X className="w-3 h-3" />
                                                                        Cancel
                                                                    </button>
                                                                </>
                                                            )}
                                                            {appointment.status === 'confirmed' && (() => {
                                                                const apptTs = getTimestamp(appointment);
                                                                const canComplete = apptTs > 0 && nowMs >= apptTs;
                                                                return (
                                                                    <>
                                                                        <button
                                                                            onClick={() => canComplete && updateStatus(appointment._id, 'completed')}
                                                                            disabled={updating === appointment._id || !canComplete}
                                                                            className={`flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg transition-all disabled:opacity-50 ${canComplete
                                                                                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                                                                : 'bg-zinc-700/50 text-zinc-500 cursor-not-allowed'
                                                                                }`}
                                                                            title={canComplete ? 'Mark as complete' : 'Available after appointment time'}
                                                                        >
                                                                            <CheckCircle className="w-3 h-3" />
                                                                            {canComplete ? 'Complete' : 'Not Yet'}
                                                                        </button>
                                                                        <button
                                                                            onClick={() => openCancelModal(appointment._id)}
                                                                            disabled={updating === appointment._id}
                                                                            className="flex items-center gap-1 px-3 py-1.5 bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-600 hover:text-white text-xs rounded-lg transition-all disabled:opacity-50"
                                                                        >
                                                                            <X className="w-3 h-3" />
                                                                            Cancel
                                                                        </button>
                                                                        {(() => {
                                                                            const apptTs = getTimestamp(appointment);
                                                                            const startTime = apptTs - (5 * 60 * 1000); // 5 min before
                                                                            const endTime = apptTs + (30 * 60 * 1000);  // 30 min after
                                                                            const canJoinCall = apptTs > 0 && nowMs >= startTime && nowMs <= endTime;
                                                                            const expired = apptTs > 0 && nowMs > endTime;
                                                                            if (expired) return null; // Hide button after session window
                                                                            return (
                                                                                <button
                                                                                    onClick={() => canJoinCall && navigate(`/room/${appointment._id}`)}
                                                                                    disabled={!canJoinCall}
                                                                                    className={`flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg transition-all ${canJoinCall
                                                                                        ? 'bg-blue-500 hover:bg-blue-600 text-white cursor-pointer'
                                                                                        : 'bg-zinc-700/50 text-zinc-500 cursor-not-allowed'
                                                                                        }`}
                                                                                    title={canJoinCall ? 'Join Video Call' : 'Available 5 min before appointment'}
                                                                                >
                                                                                    <Video className="w-3 h-3" />
                                                                                    {canJoinCall ? 'Join Call' : 'Not Yet'}
                                                                                </button>
                                                                            );
                                                                        })()}
                                                                    </>
                                                                );
                                                            })()}
                                                            {appointment.status === 'completed' && (
                                                                <>
                                                                    {prescribedAppointments.has(appointment._id) ? (
                                                                        <span className="flex items-center gap-1 px-3 py-1.5 bg-green-500/10 text-green-400 text-xs rounded-lg">
                                                                            <FileText className="w-3 h-3" />
                                                                            Prescribed
                                                                        </span>
                                                                    ) : (
                                                                        <button
                                                                            onClick={() => {
                                                                                setSelectedAppointment(appointment);
                                                                                setPrescriptionModalOpen(true);
                                                                            }}
                                                                            className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded-lg transition-all"
                                                                        >
                                                                            <FileText className="w-3 h-3" />
                                                                            Prescribe
                                                                        </button>
                                                                    )}
                                                                </>
                                                            )}
                                                            {appointment.status === 'cancelled' && (
                                                                <span className="text-zinc-600 text-xs">Cancelled</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </CurvedWrapper>

            <PrescriptionModal
                isOpen={prescriptionModalOpen}
                onClose={() => {
                    setPrescriptionModalOpen(false);
                    setSelectedAppointment(null);
                }}
                appointment={selectedAppointment}
                onPrescriptionSubmitted={(appointmentId) => {
                    setPrescribedAppointments(prev => new Set([...prev, appointmentId]));
                }}
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

export default DoctorDashboard;

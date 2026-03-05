import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
    Shield,
    Users,
    CheckCircle,
    XCircle,
    BadgeCheck,
    Search,
    AlertCircle,
    Loader2,
    Mail,
    Calendar,
    Stethoscope,
    Activity,
    Clock,
    TrendingUp
} from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import CurvedWrapper from '../../components/CurvedWrapper';

const AdminDashboard = () => {
    const { user, token } = useSelector((state) => state.auth);
    const [doctors, setDoctors] = useState([]);
    const [stats, setStats] = useState({ totalPatients: 0, totalDoctors: 0, totalAppointments: 0 });
    const [recentActivity, setRecentActivity] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [verifyingId, setVerifyingId] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

                const [statsRes, activityRes, doctorsRes] = await Promise.all([
                    fetch('http://localhost:5000/api/admin/stats', { headers }),
                    fetch('http://localhost:5000/api/admin/recent-activity', { headers }),
                    fetch('http://localhost:5000/api/admin/doctors', { headers }),
                ]);

                const [statsData, activityData, doctorsData] = await Promise.all([
                    statsRes.json(),
                    activityRes.json(),
                    doctorsRes.json(),
                ]);

                if (statsData.success) setStats(statsData.stats);
                if (activityData.success) setRecentActivity(activityData.appointments || []);
                if (doctorsData.success) setDoctors(doctorsData.doctors || []);
            } catch (err) {
                setError('Failed to connect to server');
            } finally {
                setLoading(false);
            }
        };

        if (token) fetchData();
    }, [token]);

    const handleVerify = async (doctorId) => {
        setVerifyingId(doctorId);
        try {
            const response = await fetch('http://localhost:5000/api/admin/verify-doctor', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ doctorId }),
            });
            const data = await response.json();
            if (data.success) {
                setDoctors((prev) => prev.map((doc) => doc._id === doctorId ? { ...doc, isVerified: true } : doc));
            }
        } catch (err) {
        } finally {
            setVerifyingId(null);
        }
    };

    const filteredDoctors = doctors.filter((doctor) => {
        const name = doctor.name?.toLowerCase() || '';
        const email = doctor.email?.toLowerCase() || '';
        return name.includes(searchTerm.toLowerCase()) || email.includes(searchTerm.toLowerCase());
    });

    const verifiedCount = doctors.filter((d) => d.isVerified).length;
    const unverifiedCount = doctors.filter((d) => !d.isVerified).length;

    const getStatusBadge = (status) => {
        switch (status) {
            case 'completed': return <span className="px-2 py-1 bg-green-500/10 text-green-400 rounded-full text-xs font-medium">Completed</span>;
            case 'confirmed': return <span className="px-2 py-1 bg-blue-500/10 text-blue-400 rounded-full text-xs font-medium">Confirmed</span>;
            case 'pending': return <span className="px-2 py-1 bg-yellow-500/10 text-yellow-400 rounded-full text-xs font-medium">Pending</span>;
            case 'cancelled': return <span className="px-2 py-1 bg-red-500/10 text-red-400 rounded-full text-xs font-medium">Cancelled</span>;
            default: return <span className="px-2 py-1 bg-zinc-800 text-zinc-400 rounded-full text-xs font-medium">{status}</span>;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#09090b]">
                <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
                    <Loader2 className="w-12 h-12 text-rose-500 animate-spin" />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#09090b]">
            <PageHeader title="Admin Command Center" subtitle={`Welcome back, ${user?.name}`} />
            <CurvedWrapper>
                <div className="max-w-7xl mx-auto">

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                        <div className="rounded-2xl p-6 hover:-translate-y-0.5 transition-all duration-200" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', boxShadow: 'var(--card-shadow)' }}>
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-blue-500/10 rounded-xl flex items-center justify-center">
                                    <Users className="w-7 h-7 text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-3xl font-bold text-white">{stats.totalPatients}</p>
                                    <p className="text-zinc-500 text-sm">Total Patients</p>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-2xl p-6 hover:-translate-y-0.5 transition-all duration-200" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', boxShadow: 'var(--card-shadow)' }}>
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-purple-500/10 rounded-xl flex items-center justify-center">
                                    <Stethoscope className="w-7 h-7 text-purple-400" />
                                </div>
                                <div>
                                    <p className="text-3xl font-bold text-white">{stats.totalDoctors}</p>
                                    <p className="text-zinc-500 text-sm">Total Doctors</p>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-2xl p-6 hover:-translate-y-0.5 transition-all duration-200" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', boxShadow: 'var(--card-shadow)' }}>
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-rose-500/10 rounded-xl flex items-center justify-center">
                                    <Calendar className="w-7 h-7 text-rose-400" />
                                </div>
                                <div>
                                    <p className="text-3xl font-bold text-white">{stats.totalAppointments}</p>
                                    <p className="text-zinc-500 text-sm">Appointments</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid lg:grid-cols-3 gap-6 mb-8">
                        <div className="lg:col-span-2 rounded-2xl p-6" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', boxShadow: 'var(--card-shadow)' }}>
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                    <Activity className="w-5 h-5 text-rose-500" />
                                    Recent Activity
                                </h2>
                                <span className="text-sm text-zinc-600">Last 5 bookings</span>
                            </div>

                            {recentActivity.length === 0 ? (
                                <div className="text-center py-8 text-zinc-600">
                                    <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                    <p>No recent activity</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="border-b border-zinc-800">
                                            <tr className="text-left text-sm text-zinc-500">
                                                <th className="pb-3 font-medium">Date</th>
                                                <th className="pb-3 font-medium">Doctor</th>
                                                <th className="pb-3 font-medium">Patient</th>
                                                <th className="pb-3 font-medium">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-zinc-800/50">
                                            {recentActivity.map((apt) => (
                                                <tr key={apt._id} className="hover:bg-white/[0.03]">
                                                    <td className="py-3 text-sm text-zinc-400">
                                                        {new Date(apt.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                                    </td>
                                                    <td className="py-3 text-sm font-medium text-white">
                                                        {apt.doctorId?.userId?.name || 'Unknown'}
                                                    </td>
                                                    <td className="py-3 text-sm text-zinc-400">
                                                        {apt.patientId?.name || 'Unknown'}
                                                    </td>
                                                    <td className="py-3">
                                                        {getStatusBadge(apt.status)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        <div className="rounded-2xl p-6" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', boxShadow: 'var(--card-shadow)' }}>
                            <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-6">
                                <TrendingUp className="w-5 h-5 text-purple-400" />
                                Doctor Status
                            </h2>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 bg-green-500/10 rounded-xl border border-green-500/20">
                                    <div className="flex items-center gap-3">
                                        <CheckCircle className="w-5 h-5 text-green-400" />
                                        <span className="text-zinc-300">Verified</span>
                                    </div>
                                    <span className="text-2xl font-bold text-green-400">{verifiedCount}</span>
                                </div>
                                <div className="flex items-center justify-between p-4 bg-orange-500/10 rounded-xl border border-orange-500/20">
                                    <div className="flex items-center gap-3">
                                        <AlertCircle className="w-5 h-5 text-orange-400" />
                                        <span className="text-zinc-300">Pending</span>
                                    </div>
                                    <span className="text-2xl font-bold text-orange-400">{unverifiedCount}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', boxShadow: 'var(--card-shadow)' }}>
                        <div className="p-6 border-b border-zinc-800">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <h2 className="text-lg font-bold text-white">Doctor Management</h2>
                                <div className="relative max-w-xs w-full">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                                    <input
                                        type="text"
                                        placeholder="Search doctors..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 bg-black/50 border border-zinc-800 rounded-lg focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 outline-none text-sm text-white placeholder-zinc-600"
                                    />
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-500/10 border-b border-red-500/20 text-red-400 p-4 flex items-center gap-2">
                                <XCircle className="w-5 h-5" /> {error}
                            </div>
                        )}

                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-white/[0.03] border-b border-zinc-800">
                                    <tr>
                                        <th className="text-left py-4 px-6 font-semibold text-zinc-400">Doctor</th>
                                        <th className="text-left py-4 px-6 font-semibold text-zinc-400">Email</th>
                                        <th className="text-left py-4 px-6 font-semibold text-zinc-400">Joined</th>
                                        <th className="text-left py-4 px-6 font-semibold text-zinc-400">Status</th>
                                        <th className="text-center py-4 px-6 font-semibold text-zinc-400">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredDoctors.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="py-12 text-center text-zinc-600">
                                                <Users className="w-10 h-10 mx-auto mb-2 text-zinc-700" />
                                                No doctors found
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredDoctors.map((doctor) => (
                                            <tr key={doctor._id} className="border-b border-zinc-800/50 hover:bg-white/[0.03]">
                                                <td className="py-4 px-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-gradient-to-br from-rose-600 to-rose-800 rounded-full flex items-center justify-center text-white font-semibold">
                                                            {doctor.photo ? (
                                                                <img src={doctor.photo} alt={doctor.name} className="w-full h-full rounded-full object-cover" />
                                                            ) : (
                                                                doctor.name?.charAt(0).toUpperCase()
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <span className="font-medium text-white">{doctor.name}</span>
                                                            {doctor.isVerified && <BadgeCheck className="w-4 h-4 text-blue-400" />}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6 text-zinc-400 text-sm">{doctor.email}</td>
                                                <td className="py-4 px-6 text-zinc-500 text-sm">
                                                    {new Date(doctor.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </td>
                                                <td className="py-4 px-6">
                                                    {doctor.isVerified ? (
                                                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-500/10 text-green-400 rounded-full text-xs font-medium">
                                                            <CheckCircle className="w-3 h-3" /> Verified
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-500/10 text-orange-400 rounded-full text-xs font-medium">
                                                            <AlertCircle className="w-3 h-3" /> Pending
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-4 px-6 text-center">
                                                    {doctor.isVerified ? (
                                                        <span className="text-zinc-600 text-sm">—</span>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleVerify(doctor._id)}
                                                            disabled={verifyingId === doctor._id}
                                                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
                                                        >
                                                            {verifyingId === doctor._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <BadgeCheck className="w-4 h-4" />}
                                                            Verify
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </CurvedWrapper>
        </div>
    );
};

export default AdminDashboard;

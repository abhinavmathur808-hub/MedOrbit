import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import {
    User,
    Mail,
    Phone,
    Award,
    Clock,
    DollarSign,
    MapPin,
    Calendar,
    CheckCircle,
    XCircle,
    Edit,
    RefreshCw
} from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import CurvedWrapper from '../../components/CurvedWrapper';

const DoctorProfile = () => {
    const { user, isLoading: authLoading } = useSelector((state) => state.auth);

    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState('');

    useEffect(() => {
        const fetchProfile = async () => {

            try {
                const token = localStorage.getItem('token');

                if (!token) {
                    setLoading(false);
                    return;
                }

                const response = await fetch('http://localhost:5000/api/doctor/profile', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                });

                const data = await response.json();

                if (data.success && data.doctor) {
                    setProfile(data.doctor);
                } else {
                }
            } catch (err) {
                setFetchError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, []);

    if (authLoading) {
        return (
            <div className="min-h-screen bg-[#09090b]">
                <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
                    <div className="text-center">
                        <div className="w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-zinc-400">Checking authentication...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-[#09090b]">
                <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
                    <div className="text-center rounded-2xl p-8 max-w-md" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', boxShadow: 'var(--card-shadow)' }}>
                        <XCircle className="w-16 h-16 text-rose-500 mx-auto mb-4" />
                        <h2 className="text-xl font-bold text-white mb-2">Not Logged In</h2>
                        <p className="text-zinc-400 mb-6">Please login to view your profile.</p>
                        <Link
                            to="/login"
                            className="inline-block bg-rose-600 hover:bg-rose-700 text-white px-6 py-3 rounded-xl transition-all"
                        >
                            Go to Login
                        </Link>
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
                        <p className="text-zinc-400">Loading fresh data...</p>
                    </div>
                </div>
            </div>
        );
    }

    const name = profile?.userId?.name || user?.name || 'Doctor';
    const email = profile?.userId?.email || user?.email || '';
    const phone = profile?.userId?.phone || user?.phone || 'Not provided';
    const photo = profile?.userId?.photo || user?.photo || '';
    const role = user?.role || 'doctor';

    const specialization = profile?.specialization || user?.doctorProfile?.specialization || 'Not specified';
    const qualifications = profile?.qualifications || user?.doctorProfile?.qualifications || [];
    const experience = profile?.experience ?? user?.doctorProfile?.experience ?? 0;
    const fees = profile?.fees ?? user?.doctorProfile?.fees ?? 0;
    const hospitalAddress = profile?.hospitalAddress || user?.doctorProfile?.hospitalAddress || 'Not provided';
    const availability = profile?.availability || user?.doctorProfile?.availability || [];
    const isVerified = profile?.isVerified ?? user?.doctorProfile?.isVerified ?? false;

    return (
        <div className="min-h-screen bg-[#09090b]">
            <PageHeader title="Doctor Profile" subtitle={specialization} />
            <CurvedWrapper>
                <div className="max-w-4xl mx-auto">
                    <div className="mb-4 text-sm text-center">
                        {profile ? (
                            <span className="text-green-400 bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20">
                                ✅ Showing fresh data from database
                            </span>
                        ) : (
                            <span className="text-yellow-400 bg-yellow-500/10 px-3 py-1 rounded-full border border-yellow-500/20">
                                ⚠️ Showing cached data (API unavailable)
                            </span>
                        )}
                    </div>

                    <div className="rounded-2xl p-6 mb-6" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', boxShadow: 'var(--card-shadow)' }}>
                        <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6">
                            <div className="w-24 h-24 bg-gradient-to-br from-rose-600 to-rose-800 rounded-2xl flex items-center justify-center text-white text-3xl font-bold shadow-lg overflow-hidden">
                                {photo && photo.startsWith('http') ? (
                                    <img src={photo} alt={name} className="w-full h-full object-cover" />
                                ) : (
                                    name?.charAt(0)?.toUpperCase() || 'D'
                                )}
                            </div>

                            <div className="flex-1 text-center md:text-left">
                                <div className="flex items-center justify-center md:justify-start space-x-2 mb-1">
                                    <h1 className="text-2xl font-bold text-white">{name}</h1>
                                    {isVerified ? (
                                        <CheckCircle className="w-5 h-5 text-green-400" />
                                    ) : (
                                        <span className="text-xs bg-yellow-500/10 text-yellow-400 px-2 py-1 rounded-full border border-yellow-500/20">
                                            Pending Verification
                                        </span>
                                    )}
                                </div>
                                <p className="text-zinc-500 capitalize">{role}</p>
                                <p className="text-rose-400 font-medium">{specialization}</p>
                            </div>

                            <Link
                                to="/doctor/profile/edit"
                                className="flex items-center space-x-2 bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 px-4 py-2 rounded-xl transition-all border border-rose-600/20"
                            >
                                <Edit className="w-4 h-4" />
                                <span>Edit Profile</span>
                            </Link>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="rounded-xl p-4 text-center" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', boxShadow: 'var(--card-shadow)' }}>
                            <Clock className="w-8 h-8 text-rose-500 mx-auto mb-2" />
                            <p className="text-2xl font-bold text-white">{experience}</p>
                            <p className="text-zinc-500 text-sm">Years Exp.</p>
                        </div>
                        <div className="rounded-xl p-4 text-center" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', boxShadow: 'var(--card-shadow)' }}>
                            <DollarSign className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                            <p className="text-2xl font-bold text-white">₹{fees}</p>
                            <p className="text-zinc-500 text-sm">Consultation</p>
                        </div>
                        <div className="rounded-xl p-4 text-center" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', boxShadow: 'var(--card-shadow)' }}>
                            <Award className="w-8 h-8 text-green-400 mx-auto mb-2" />
                            <p className="text-2xl font-bold text-white">{qualifications?.length || 0}</p>
                            <p className="text-zinc-500 text-sm">Qualifications</p>
                        </div>
                        <div className="rounded-xl p-4 text-center" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', boxShadow: 'var(--card-shadow)' }}>
                            <Calendar className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                            <p className="text-2xl font-bold text-white">{availability?.length || 0}</p>
                            <p className="text-zinc-500 text-sm">Days Available</p>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="rounded-2xl p-6" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', boxShadow: 'var(--card-shadow)' }}>
                            <h2 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                                <User className="w-5 h-5 text-rose-500" />
                                <span>Contact Information</span>
                            </h2>
                            <div className="space-y-3">
                                <div className="flex items-center space-x-3 text-zinc-400">
                                    <Mail className="w-5 h-5 text-zinc-400" />
                                    <span>{email}</span>
                                </div>
                                <div className="flex items-center space-x-3 text-zinc-400">
                                    <Phone className="w-5 h-5 text-zinc-400" />
                                    <span>{phone}</span>
                                </div>
                                <div className="flex items-center space-x-3 text-zinc-400">
                                    <MapPin className="w-5 h-5 text-zinc-400" />
                                    <span>{hospitalAddress}</span>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-2xl p-6" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', boxShadow: 'var(--card-shadow)' }}>
                            <h2 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                                <Award className="w-5 h-5 text-purple-400" />
                                <span>Qualifications</span>
                            </h2>
                            {qualifications && qualifications.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {qualifications.map((qual, index) => (
                                        <span
                                            key={index}
                                            className="bg-purple-500/10 text-purple-400 px-3 py-1 rounded-full text-sm border border-purple-500/20"
                                        >
                                            {qual}
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-zinc-600 italic">No qualifications added yet</p>
                            )}
                        </div>

                        <div className="rounded-2xl p-6 md:col-span-2" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', boxShadow: 'var(--card-shadow)' }}>
                            <h2 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                                <Calendar className="w-5 h-5 text-green-400" />
                                <span>Availability</span>
                            </h2>
                            {availability && availability.length > 0 ? (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {availability.map((slot, index) => (
                                        <div
                                            key={index}
                                            className="bg-green-500/10 text-green-400 px-4 py-3 rounded-xl text-center border border-green-500/20"
                                        >
                                            <p className="font-medium">{slot?.day || 'Day'}</p>
                                            <p className="text-sm text-green-400/70">
                                                {slot?.startTime || '00:00'} - {slot?.endTime || '00:00'}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-zinc-600 italic">No availability schedule set</p>
                            )}
                        </div>
                    </div>
                </div>
            </CurvedWrapper>
        </div>
    );
};

export default DoctorProfile;

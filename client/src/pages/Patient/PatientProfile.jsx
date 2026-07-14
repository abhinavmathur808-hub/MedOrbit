import { useSelector } from 'react-redux';
import { optimizeCloudinaryUrl } from '../../utils/cloudinaryUrl';
import { Link } from 'react-router-dom';
import {
    User,
    Mail,
    Phone,
    Calendar,
    Edit,
    XCircle
} from 'lucide-react';

const PatientProfile = () => {
    const { user, isLoading } = useSelector((state) => state.auth);

    if (isLoading) {
        return (
            <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-neutral-950">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-burgundy-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-neutral-400">Loading profile...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-neutral-950">
                <div className="text-center bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl shadow-black/60 p-8 max-w-md">
                    <XCircle className="w-16 h-16 text-burgundy-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-neutral-100 mb-2">Not Logged In</h2>
                    <p className="text-neutral-400 mb-6">Please login to view your profile.</p>
                    <Link
                        to="/login"
                        className="inline-block bg-burgundy-600 hover:bg-burgundy-700 text-white px-6 py-3 rounded-xl transition-all"
                    >
                        Go to Login
                    </Link>
                </div>
            </div>
        );
    }

    const name = user?.name || 'Patient';
    const email = user?.email || '';
    const phone = user?.phone || 'Not provided';
    const gender = user?.gender || 'Not specified';
    const role = user?.role || 'patient';
    const photo = user?.photo || '';

    return (
        <div className="min-h-[calc(100vh-64px)] bg-neutral-950 pt-28 py-8 px-4">
            <div className="max-w-2xl mx-auto">
                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl shadow-black/60 p-8 border border-neutral-800">
                    <div className="flex flex-col items-center mb-8">
                        <div className="w-24 h-24 bg-gradient-to-br from-burgundy-500 to-burgundy-800 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg mb-4 overflow-hidden">
                            {photo && photo.startsWith('http') ? (
                                <img src={optimizeCloudinaryUrl(photo)} alt={name} className="w-full h-full object-cover" loading="lazy" />
                            ) : (
                                name?.charAt(0)?.toUpperCase() || 'P'
                            )}
                        </div>
                        <h1 className="text-2xl font-bold text-neutral-100">{name}</h1>
                        <p className="text-neutral-400 capitalize">{role}</p>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center space-x-4 p-4 bg-neutral-950 rounded-xl">
                            <Mail className="w-5 h-5 text-burgundy-500" />
                            <div>
                                <p className="text-xs text-neutral-500">Email</p>
                                <p className="text-neutral-100">{email}</p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-4 p-4 bg-neutral-950 rounded-xl">
                            <Phone className="w-5 h-5 text-burgundy-500" />
                            <div>
                                <p className="text-xs text-neutral-500">Phone</p>
                                <p className="text-neutral-100">{phone}</p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-4 p-4 bg-neutral-950 rounded-xl">
                            <User className="w-5 h-5 text-burgundy-500" />
                            <div>
                                <p className="text-xs text-neutral-500">Gender</p>
                                <p className="text-neutral-100 capitalize">{gender}</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 flex flex-col sm:flex-row gap-4">
                        <Link
                            to="/profile/edit"
                            className="flex-1 flex items-center justify-center space-x-2 bg-burgundy-600 hover:bg-burgundy-700 text-white px-6 py-3 rounded-xl transition-all"
                        >
                            <Edit className="w-5 h-5" />
                            <span>Edit Profile</span>
                        </Link>
                        <Link
                            to="/appointments"
                            className="flex-1 flex items-center justify-center space-x-2 bg-burgundy-600 hover:bg-burgundy-500 text-white px-6 py-3 rounded-xl transition-all"
                        >
                            <Calendar className="w-5 h-5" />
                            <span>My Appointments</span>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PatientProfile;

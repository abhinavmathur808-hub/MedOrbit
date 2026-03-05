import { useSelector } from 'react-redux';
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
            <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-rose-50">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading profile...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-rose-50">
                <div className="text-center bg-white rounded-2xl shadow-xl p-8 max-w-md">
                    <XCircle className="w-16 h-16 text-rose-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-gray-800 mb-2">Not Logged In</h2>
                    <p className="text-gray-600 mb-6">Please login to view your profile.</p>
                    <Link
                        to="/login"
                        className="inline-block bg-rose-600 hover:bg-rose-700 text-white px-6 py-3 rounded-xl transition-all"
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
        <div className="min-h-[calc(100vh-64px)] bg-gradient-to-br from-rose-50 via-white to-purple-50 pt-28 py-8 px-4">
            <div className="max-w-2xl mx-auto">
                <div className="bg-white rounded-2xl shadow-xl p-8 border border-rose-100">
                    <div className="flex flex-col items-center mb-8">
                        <div className="w-24 h-24 bg-gradient-to-br from-rose-500 to-purple-600 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg mb-4 overflow-hidden">
                            {photo && photo.startsWith('http') ? (
                                <img src={photo} alt={name} className="w-full h-full object-cover" />
                            ) : (
                                name?.charAt(0)?.toUpperCase() || 'P'
                            )}
                        </div>
                        <h1 className="text-2xl font-bold text-gray-800">{name}</h1>
                        <p className="text-gray-500 capitalize">{role}</p>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl">
                            <Mail className="w-5 h-5 text-rose-500" />
                            <div>
                                <p className="text-xs text-gray-400">Email</p>
                                <p className="text-gray-800">{email}</p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl">
                            <Phone className="w-5 h-5 text-rose-500" />
                            <div>
                                <p className="text-xs text-gray-400">Phone</p>
                                <p className="text-gray-800">{phone}</p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl">
                            <User className="w-5 h-5 text-rose-500" />
                            <div>
                                <p className="text-xs text-gray-400">Gender</p>
                                <p className="text-gray-800 capitalize">{gender}</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 flex flex-col sm:flex-row gap-4">
                        <Link
                            to="/profile/edit"
                            className="flex-1 flex items-center justify-center space-x-2 bg-rose-600 hover:bg-rose-700 text-white px-6 py-3 rounded-xl transition-all"
                        >
                            <Edit className="w-5 h-5" />
                            <span>Edit Profile</span>
                        </Link>
                        <Link
                            to="/appointments"
                            className="flex-1 flex items-center justify-center space-x-2 bg-purple-100 hover:bg-purple-200 text-purple-600 px-6 py-3 rounded-xl transition-all"
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

import { useSelector } from 'react-redux';
import Avatar from '../../components/ui/Avatar';
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
            <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-zinc-950">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-zinc-400">Loading profile...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-zinc-950">
                <div className="text-center bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl shadow-black/60 p-8 max-w-md">
                    <XCircle className="w-16 h-16 text-rose-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-zinc-100 mb-2">Not Logged In</h2>
                    <p className="text-zinc-400 mb-6">Please login to view your profile.</p>
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
        <div className="min-h-[calc(100vh-64px)] bg-zinc-950 pt-28 py-8 px-4">
            <div className="max-w-2xl mx-auto">
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl shadow-black/60 p-8 border border-zinc-800">
                    <div className="flex flex-col items-center mb-8">
                        <Avatar
                            src={photo && photo.startsWith('http') ? photo : ''}
                            name={name}
                            size={96}
                            className="shadow-lg mb-4"
                        />
                        <h1 className="text-2xl font-bold text-zinc-100">{name}</h1>
                        <p className="text-zinc-400 capitalize">{role}</p>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center space-x-4 p-4 bg-zinc-950 rounded-xl">
                            <Mail className="w-5 h-5 text-rose-500" />
                            <div>
                                <p className="text-xs text-zinc-500">Email</p>
                                <p className="text-zinc-100">{email}</p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-4 p-4 bg-zinc-950 rounded-xl">
                            <Phone className="w-5 h-5 text-rose-500" />
                            <div>
                                <p className="text-xs text-zinc-500">Phone</p>
                                <p className="text-zinc-100">{phone}</p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-4 p-4 bg-zinc-950 rounded-xl">
                            <User className="w-5 h-5 text-rose-500" />
                            <div>
                                <p className="text-xs text-zinc-500">Gender</p>
                                <p className="text-zinc-100 capitalize">{gender}</p>
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
                            className="flex-1 flex items-center justify-center space-x-2 bg-rose-600 hover:bg-rose-500 text-white px-6 py-3 rounded-xl transition-all"
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

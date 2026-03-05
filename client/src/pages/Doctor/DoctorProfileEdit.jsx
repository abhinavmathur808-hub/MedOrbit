import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import {
    User,
    Stethoscope,
    Award,
    Clock,
    DollarSign,
    MapPin,
    Save,
    X,
    ArrowLeft,
    XCircle,
    RefreshCw,
    Camera,
    Loader2
} from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import CurvedWrapper from '../../components/CurvedWrapper';

const DoctorProfileEdit = () => {
    const navigate = useNavigate();
    const { user, isLoading: authLoading } = useSelector((state) => state.auth);

    const CLOUDINARY_URL = 'https://api.cloudinary.com/v1_1/difkkqubw/image/upload';
    const UPLOAD_PRESET = 'healthconnect_preset';

    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        photo: '',
        specialization: '',
        experience: '',
        fees: '',
        hospitalAddress: '',
        qualifications: '',
    });

    const [isSaving, setIsSaving] = useState(false);
    const [isFetching, setIsFetching] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        const fetchProfile = async () => {

            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    setFormData({
                        name: user?.name || '',
                        phone: user?.phone || '',
                        photo: user?.photo || '',
                        specialization: user?.doctorProfile?.specialization || '',
                        experience: user?.doctorProfile?.experience ?? '',
                        fees: user?.doctorProfile?.fees ?? '',
                        hospitalAddress: user?.doctorProfile?.hospitalAddress || '',
                        qualifications: user?.doctorProfile?.qualifications?.join(', ') || '',
                    });
                    setIsFetching(false);
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
                    setFormData({
                        name: data.doctor.userId?.name || user?.name || '',
                        phone: data.doctor.userId?.phone || user?.phone || '',
                        photo: data.doctor.userId?.photo || user?.photo || '',
                        specialization: data.doctor.specialization || '',
                        experience: data.doctor.experience ?? '',
                        fees: data.doctor.fees ?? '',
                        hospitalAddress: data.doctor.hospitalAddress || '',
                        qualifications: Array.isArray(data.doctor.qualifications)
                            ? data.doctor.qualifications.join(', ')
                            : '',
                    });
                } else {
                    setFormData({
                        name: user?.name || '',
                        phone: user?.phone || '',
                        photo: user?.photo || '',
                        specialization: '',
                        experience: '',
                        fees: '',
                        hospitalAddress: '',
                        qualifications: '',
                    });
                }
            } catch (err) {
                setFormData({
                    name: user?.name || '',
                    phone: user?.phone || '',
                    photo: user?.photo || '',
                    specialization: user?.doctorProfile?.specialization || '',
                    experience: user?.doctorProfile?.experience ?? '',
                    fees: user?.doctorProfile?.fees ?? '',
                    hospitalAddress: user?.doctorProfile?.hospitalAddress || '',
                    qualifications: user?.doctorProfile?.qualifications?.join(', ') || '',
                });
            } finally {
                setIsFetching(false);
            }
        };

        fetchProfile();
    }, [user]);

    if (authLoading) {
        return (
            <div className="min-h-screen bg-[#09090b]">
                <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
                    <div className="text-center">
                        <div className="w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-zinc-400">Loading...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (isFetching) {
        return (
            <div className="min-h-screen bg-[#09090b]">
                <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
                    <div className="text-center">
                        <RefreshCw className="w-12 h-12 text-rose-500 animate-spin mx-auto mb-4" />
                        <p className="text-zinc-400">Loading profile data...</p>
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
                        <p className="text-zinc-400 mb-6">Please login to edit your profile.</p>
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

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value || '',
        }));
        setError('');
    };

    const handleNumericChange = (e) => {
        const { name, value } = e.target;
        const cleanValue = value === '' ? '' : Number(value).toString();
        setFormData((prev) => ({
            ...prev,
            [name]: cleanValue,
        }));
        setError('');
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        setError('');

        try {
            const formDataUpload = new FormData();
            formDataUpload.append('file', file);
            formDataUpload.append('upload_preset', UPLOAD_PRESET);

            const response = await fetch(CLOUDINARY_URL, { method: 'POST', body: formDataUpload });
            const data = await response.json();

            if (data.secure_url) {
                setFormData((prev) => ({ ...prev, photo: data.secure_url }));

                const token = localStorage.getItem('token');
                await fetch('http://localhost:5000/api/users/update-profile', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify({ photo: data.secure_url }),
                });
            } else {
                setError('Upload failed. Please try again.');
            }
        } catch (err) {
            setError('Failed to upload image');
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        setError('');

        try {
            const token = localStorage.getItem('token');

            const response = await fetch('http://localhost:5000/api/doctor/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    name: formData.name,
                    phone: formData.phone,
                    photo: formData.photo,
                    specialization: formData.specialization,
                    experience: formData.experience,
                    fees: formData.fees,
                    hospitalAddress: formData.hospitalAddress,
                    qualifications: formData.qualifications,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to update profile');
            }

            if (formData.photo) {
                await fetch('http://localhost:5000/api/users/update-profile', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify({ photo: formData.photo }),
                });
            }

            setSuccess('Profile updated successfully!');
            setTimeout(() => {
                navigate('/doctor/profile');
            }, 1500);
        } catch (err) {
            setError(err?.message || 'Failed to update profile');
        } finally {
            setIsSaving(false);
        }
    };

    const inputClasses = "w-full px-4 py-3 bg-black/50 border border-zinc-800 rounded-xl focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition-all outline-none text-white placeholder-zinc-600";

    return (
        <div className="min-h-screen bg-[#09090b]">
            <PageHeader title="Edit Profile" subtitle="Update your professional information" />
            <CurvedWrapper>
                <div className="max-w-2xl mx-auto">
                    <div className="flex items-center justify-between mb-6">
                        <Link
                            to="/doctor/profile"
                            className="flex items-center space-x-2 text-zinc-400 hover:text-rose-400 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            <span>Back to Profile</span>
                        </Link>
                    </div>

                    <div className="rounded-2xl p-8" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', boxShadow: 'var(--card-shadow)' }}>
                        <h1 className="text-2xl font-bold text-white mb-6">Edit Profile</h1>

                        {error && (
                            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm">
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 text-green-400 rounded-xl text-sm">
                                {success}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="flex flex-col items-center mb-2">
                                <label htmlFor="doctor-photo" className="relative cursor-pointer group">
                                    <div className="w-28 h-28 rounded-2xl overflow-hidden bg-gradient-to-br from-rose-600 to-rose-800 flex items-center justify-center text-white text-4xl font-bold shadow-lg">
                                        {formData.photo ? (
                                            <img src={formData.photo} alt={formData.name} className="w-full h-full object-cover" />
                                        ) : (
                                            formData.name?.charAt(0)?.toUpperCase() || 'D'
                                        )}
                                    </div>
                                    <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        {uploading ? (
                                            <Loader2 className="w-6 h-6 text-white animate-spin" />
                                        ) : (
                                            <Camera className="w-6 h-6 text-white" />
                                        )}
                                    </div>
                                </label>
                                <input
                                    id="doctor-photo"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className="hidden"
                                    disabled={uploading}
                                />
                                <p className="text-zinc-500 text-xs mt-2">
                                    {uploading ? 'Uploading...' : 'Click to change photo'}
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-white mb-2" style={{ color: '#ffffff' }}>
                                    <User className="w-4 h-4 inline mr-2" style={{ color: '#ffffff' }} />
                                    Full Name
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name || ''}
                                    onChange={handleChange}
                                    placeholder="Dr. John Doe"
                                    className={inputClasses}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-white mb-2" style={{ color: '#ffffff' }}>
                                    Phone Number
                                </label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone || ''}
                                    onChange={handleChange}
                                    placeholder="+91 9876543210"
                                    className={inputClasses}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-white mb-2" style={{ color: '#ffffff' }}>
                                    <Stethoscope className="w-4 h-4 inline mr-2" style={{ color: '#ffffff' }} />
                                    Specialization
                                </label>
                                <input
                                    type="text"
                                    name="specialization"
                                    value={formData.specialization || ''}
                                    onChange={handleChange}
                                    placeholder="e.g., Cardiologist, Dermatologist"
                                    className={inputClasses}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-white mb-2" style={{ color: '#ffffff' }}>
                                        <Clock className="w-4 h-4 inline mr-2" style={{ color: '#ffffff' }} />
                                        Experience (years)
                                    </label>
                                    <input
                                        type="number"
                                        name="experience"
                                        value={formData.experience}
                                        onChange={handleNumericChange}
                                        min="0"
                                        placeholder="5"
                                        className={inputClasses}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-white mb-2" style={{ color: '#ffffff' }}>
                                        <DollarSign className="w-4 h-4 inline mr-2" style={{ color: '#ffffff' }} />
                                        Consultation Fee (₹)
                                    </label>
                                    <input
                                        type="number"
                                        name="fees"
                                        value={formData.fees}
                                        onChange={handleNumericChange}
                                        min="0"
                                        placeholder="500"
                                        className={inputClasses}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-white mb-2" style={{ color: '#ffffff' }}>
                                    <MapPin className="w-4 h-4 inline mr-2" style={{ color: '#ffffff' }} />
                                    Hospital/Clinic Address
                                </label>
                                <textarea
                                    name="hospitalAddress"
                                    value={formData.hospitalAddress || ''}
                                    onChange={handleChange}
                                    rows="2"
                                    placeholder="123 Medical Center, City"
                                    className={`${inputClasses} resize-none`}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-white mb-2" style={{ color: '#ffffff' }}>
                                    <Award className="w-4 h-4 inline mr-2" style={{ color: '#ffffff' }} />
                                    Qualifications (comma separated)
                                </label>
                                <input
                                    type="text"
                                    name="qualifications"
                                    value={formData.qualifications || ''}
                                    onChange={handleChange}
                                    placeholder="MBBS, MD, Fellowship"
                                    className={inputClasses}
                                />
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4 pt-4">
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="flex-1 flex items-center justify-center space-x-2 bg-rose-600 hover:bg-rose-700 text-white px-6 py-3 rounded-xl transition-all disabled:opacity-50"
                                >
                                    {isSaving ? (
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <Save className="w-5 h-5" />
                                            <span>Save Changes</span>
                                        </>
                                    )}
                                </button>
                                <Link
                                    to="/doctor/profile"
                                    className="flex-1 flex items-center justify-center space-x-2 bg-white/[0.06] hover:bg-white/[0.1] text-zinc-300 px-6 py-3 rounded-xl transition-all border border-zinc-800"
                                >
                                    <X className="w-5 h-5" />
                                    <span>Cancel</span>
                                </Link>
                            </div>
                        </form>
                    </div>
                </div>
            </CurvedWrapper>
        </div>
    );
};

export default DoctorProfileEdit;

import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import {
    User,
    Camera,
    Mail,
    Phone,
    Save,
    CheckCircle,
    XCircle,
    RefreshCw,
    Calendar,
    MapPin,
    FileText,
    Plus,
    X,
    Loader2,
    ClipboardList,
    Edit3
} from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import CurvedWrapper from '../../components/CurvedWrapper';

const UserProfile = () => {
    const { user } = useSelector((state) => state.auth);

    const [activeTab, setActiveTab] = useState('profile');

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        photo: '',
        gender: '',
        dob: '',
        addressLine1: '',
        addressLine2: '',
    });

    const [medicalHistory, setMedicalHistory] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    const [showAddModal, setShowAddModal] = useState(false);
    const [newRecord, setNewRecord] = useState({ diagnosis: '', date: '', treatment: '', doctorName: '' });
    const [addingRecord, setAddingRecord] = useState(false);

    const CLOUDINARY_URL = 'https://api.cloudinary.com/v1_1/difkkqubw/image/upload';
    const UPLOAD_PRESET = 'healthconnect_preset';

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    setLoading(false);
                    return;
                }

                const response = await fetch('http://localhost:5000/api/users/profile', {
                    headers: { 'Authorization': `Bearer ${token}` },
                });

                const data = await response.json();
                if (data.success && data.user) {
                    setFormData({
                        name: data.user.name || '',
                        email: data.user.email || '',
                        phone: data.user.phone || '',
                        photo: data.user.photo || '',
                        gender: data.user.gender || '',
                        dob: data.user.dob || '',
                        addressLine1: data.user.address?.line1 || '',
                        addressLine2: data.user.address?.line2 || '',
                    });
                    setMedicalHistory(data.user.medicalHistory || []);
                }
            } catch (err) {
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
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
                throw new Error('Upload failed');
            }
        } catch (err) {
            setError('Failed to upload image');
        } finally {
            setUploading(false);
        }
    };

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        setSuccess('');

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5000/api/users/update-profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    name: formData.name,
                    phone: formData.phone,
                    photo: formData.photo,
                    gender: formData.gender,
                    dob: formData.dob,
                    address: { line1: formData.addressLine1, line2: formData.addressLine2 },
                }),
            });

            const data = await response.json();
            if (data.success) {
                setSuccess('Profile updated successfully!');
                const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
                localStorage.setItem('user', JSON.stringify({ ...storedUser, ...data.user }));
                setTimeout(() => setSuccess(''), 3000);
            } else {
                throw new Error(data.message);
            }
        } catch (err) {
            setError(err.message || 'Failed to save profile');
        } finally {
            setSaving(false);
        }
    };

    const handleAddMedicalHistory = async (e) => {
        e.preventDefault();
        if (!newRecord.diagnosis || !newRecord.date) {
            setError('Diagnosis and date are required');
            return;
        }

        setAddingRecord(true);
        setError('');

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5000/api/users/medical-history', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(newRecord),
            });

            const data = await response.json();
            if (data.success) {
                setMedicalHistory(data.medicalHistory);
                setNewRecord({ diagnosis: '', date: '', treatment: '', doctorName: '' });
                setShowAddModal(false);
                setSuccess('Medical record added!');
                setTimeout(() => setSuccess(''), 3000);
            } else {
                throw new Error(data.message);
            }
        } catch (err) {
            setError(err.message || 'Failed to add record');
        } finally {
            setAddingRecord(false);
        }
    };

    if (!user) {
        return (
            <div className="min-h-screen bg-[#09090b]">
                <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
                    <div className="text-center rounded-2xl p-8 max-w-md" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', boxShadow: 'var(--card-shadow)' }}>
                        <XCircle className="w-16 h-16 text-rose-500 mx-auto mb-4" />
                        <h2 className="text-xl font-bold text-white mb-2">Not Logged In</h2>
                        <Link to="/login" className="inline-block bg-rose-600 hover:bg-rose-700 text-white px-6 py-3 rounded-xl">Go to Login</Link>
                    </div>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-[#09090b]">
                <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-rose-500 animate-spin" />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#09090b]">
            <PageHeader title="My Profile" subtitle="Manage your account and medical history" />
            <CurvedWrapper>
                <div className="max-w-5xl mx-auto">
                    <div className="grid md:grid-cols-4 gap-6">
                        <div className="md:col-span-1">
                            <div className="rounded-2xl p-6 sticky top-24" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', boxShadow: 'var(--card-shadow)' }}>
                                <div className="relative mx-auto mb-4">
                                    {formData.photo && formData.photo.length > 0 ? (
                                        <div className="relative w-36 h-36 mx-auto">
                                            <div className="w-36 h-36 rounded-2xl overflow-hidden border border-zinc-700">
                                                <img src={formData.photo} alt={formData.name} className="w-full h-full object-cover" />
                                            </div>
                                            <label className="absolute bottom-0 right-0 w-8 h-8 bg-rose-500 hover:bg-rose-600 rounded-full flex items-center justify-center cursor-pointer shadow-lg">
                                                {uploading ? <RefreshCw className="w-4 h-4 text-white animate-spin" /> : <Camera className="w-4 h-4 text-white" />}
                                                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploading} />
                                            </label>
                                        </div>
                                    ) : (
                                        <label className="flex flex-col items-center justify-center w-36 h-36 mx-auto bg-zinc-800 border-2 border-dashed border-zinc-500 hover:border-rose-500 rounded-2xl cursor-pointer transition-colors duration-200">
                                            {uploading ? (
                                                <RefreshCw className="w-8 h-8 text-rose-400 animate-spin" />
                                            ) : (
                                                <Camera className="w-8 h-8 text-rose-400" />
                                            )}
                                            <span className="text-xs font-medium text-zinc-300 mt-2">Upload Picture</span>
                                            <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploading} />
                                        </label>
                                    )}
                                </div>

                                <h2 className="text-lg font-bold text-white text-center">{formData.name || 'User'}</h2>
                                <p className="text-sm text-zinc-500 text-center mb-6">{formData.email}</p>

                                <nav className="space-y-2">
                                    <button onClick={() => setActiveTab('profile')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${activeTab === 'profile' ? 'bg-rose-600/20 text-rose-400' : 'hover:bg-white/[0.06] text-zinc-500'}`}>
                                        <Edit3 className="w-4 h-4" />
                                        Edit Profile
                                    </button>
                                    <button onClick={() => setActiveTab('medical')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${activeTab === 'medical' ? 'bg-rose-600/20 text-rose-400' : 'hover:bg-white/[0.06] text-zinc-500'}`}>
                                        <ClipboardList className="w-4 h-4" />
                                        Medical History
                                    </button>
                                </nav>
                            </div>
                        </div>

                        <div className="md:col-span-3">
                            {success && (
                                <div className="mb-4 p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center gap-3">
                                    <CheckCircle className="w-5 h-5 text-green-400" />
                                    <span className="text-green-400">{success}</span>
                                </div>
                            )}
                            {error && (
                                <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3">
                                    <XCircle className="w-5 h-5 text-red-400" />
                                    <span className="text-red-400">{error}</span>
                                </div>
                            )}

                            {activeTab === 'profile' && (
                                <div className="rounded-2xl p-6" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', boxShadow: 'var(--card-shadow)' }}>
                                    <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                        <User className="w-5 h-5 text-rose-500" />
                                        Edit Profile
                                    </h2>

                                    <form onSubmit={handleSaveProfile} className="grid md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="profile-label block text-sm font-medium text-white mb-2">Full Name</label>
                                            <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full px-4 py-3 bg-black/50 border border-zinc-800 rounded-xl focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 outline-none text-white placeholder-zinc-600" />
                                        </div>
                                        <div>
                                            <label className="profile-label block text-sm font-medium text-white mb-2">Email</label>
                                            <input type="email" value={formData.email} disabled className="w-full px-4 py-3 bg-black/30 border border-zinc-800 rounded-xl text-zinc-500" />
                                        </div>
                                        <div>
                                            <label className="profile-label block text-sm font-medium text-white mb-2">Phone</label>
                                            <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="+91 12345 67890" className="w-full px-4 py-3 bg-black/50 border border-zinc-800 rounded-xl focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 outline-none text-white placeholder-zinc-600" />
                                        </div>
                                        <div>
                                            <label className="profile-label block text-sm font-medium text-white mb-2">Gender</label>
                                            <select name="gender" value={formData.gender} onChange={handleChange} className="w-full px-4 py-3 bg-black border border-zinc-800 rounded-xl focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 outline-none text-white">
                                                <option value="" className="bg-black text-white">Select</option>
                                                <option value="male" className="bg-black text-white">Male</option>
                                                <option value="female" className="bg-black text-white">Female</option>
                                                <option value="other" className="bg-black text-white">Other</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="profile-label block text-sm font-medium text-white mb-2">Date of Birth</label>
                                            <input type="date" name="dob" value={formData.dob} onChange={handleChange} className="w-full px-4 py-3 bg-black/50 border border-zinc-800 rounded-xl focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 outline-none text-white" />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="profile-label block text-sm font-medium text-white mb-2">Address Line 1</label>
                                            <input type="text" name="addressLine1" value={formData.addressLine1} onChange={handleChange} placeholder="Street address" className="w-full px-4 py-3 bg-black/50 border border-zinc-800 rounded-xl focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 outline-none text-white placeholder-zinc-600" />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="profile-label block text-sm font-medium text-white mb-2">Address Line 2</label>
                                            <input type="text" name="addressLine2" value={formData.addressLine2} onChange={handleChange} placeholder="City, State, PIN" className="w-full px-4 py-3 bg-black/50 border border-zinc-800 rounded-xl focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 outline-none text-white placeholder-zinc-600" />
                                        </div>
                                        <div className="md:col-span-2">
                                            <button type="submit" disabled={saving} className="w-full bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50">
                                                {saving ? <><RefreshCw className="w-5 h-5 animate-spin" /> Saving...</> : <><Save className="w-5 h-5" /> Save Changes</>}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}

                            {activeTab === 'medical' && (
                                <div className="rounded-2xl p-6" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', boxShadow: 'var(--card-shadow)' }}>
                                    <div className="flex items-center justify-between mb-6">
                                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                            <ClipboardList className="w-5 h-5 text-rose-500" />
                                            Medical History
                                        </h2>
                                        <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 rounded-xl text-sm">
                                            <Plus className="w-4 h-4" /> Add Record
                                        </button>
                                    </div>

                                    {medicalHistory.length === 0 ? (
                                        <div className="text-center py-12 text-zinc-500">
                                            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                            <p>No medical records yet</p>
                                            <p className="text-sm">Click "Add Record" to add your first entry</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {medicalHistory.map((record, index) => (
                                                <div key={index} className="border border-zinc-800 rounded-xl p-4 hover:border-zinc-600 transition-all">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <h3 className="font-semibold text-white">{record.diagnosis}</h3>
                                                        <span className="text-sm text-zinc-500 flex items-center gap-1">
                                                            <Calendar className="w-3 h-3" />
                                                            {new Date(record.date).toLocaleDateString('en-IN')}
                                                        </span>
                                                    </div>
                                                    {record.treatment && <p className="text-sm text-zinc-400 mb-1"><span className="font-medium text-zinc-300">Treatment:</span> {record.treatment}</p>}
                                                    {record.doctorName && <p className="text-sm text-zinc-500"><span className="font-medium text-zinc-300">Doctor:</span> {record.doctorName}</p>}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </CurvedWrapper >

            {
                showAddModal && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="rounded-2xl shadow-2xl max-w-md w-full p-6" style={{ background: '#18181b', border: '1px solid var(--card-border)' }}>
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-bold text-white">Add Medical Record</h3>
                                <button onClick={() => setShowAddModal(false)} className="text-zinc-400 hover:text-zinc-200">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleAddMedicalHistory} className="space-y-4">
                                <div>
                                    <label className="profile-label block text-sm font-medium text-white mb-2">Diagnosis *</label>
                                    <input type="text" value={newRecord.diagnosis} onChange={(e) => setNewRecord({ ...newRecord, diagnosis: e.target.value })} placeholder="e.g. Flu, Migraine" className="w-full px-4 py-3 bg-black/50 border border-zinc-700 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none text-white placeholder-zinc-600" required />
                                </div>
                                <div>
                                    <label className="profile-label block text-sm font-medium text-white mb-2">Date *</label>
                                    <input type="date" value={newRecord.date} onChange={(e) => setNewRecord({ ...newRecord, date: e.target.value })} className="w-full px-4 py-3 bg-black/50 border border-zinc-700 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none text-white" required />
                                </div>
                                <div>
                                    <label className="profile-label block text-sm font-medium text-white mb-2">Treatment</label>
                                    <input type="text" value={newRecord.treatment} onChange={(e) => setNewRecord({ ...newRecord, treatment: e.target.value })} placeholder="Prescribed medications" className="w-full px-4 py-3 bg-black/50 border border-zinc-700 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none text-white placeholder-zinc-600" />
                                </div>
                                <div>
                                    <label className="profile-label block text-sm font-medium text-white mb-2">Doctor Name</label>
                                    <input type="text" value={newRecord.doctorName} onChange={(e) => setNewRecord({ ...newRecord, doctorName: e.target.value })} placeholder="Dr. Name" className="w-full px-4 py-3 bg-black/50 border border-zinc-700 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none text-white placeholder-zinc-600" />
                                </div>
                                <button type="submit" disabled={addingRecord} className="w-full bg-rose-500 hover:bg-rose-600 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50">
                                    {addingRecord ? <><Loader2 className="w-5 h-5 animate-spin" /> Adding...</> : <><Plus className="w-5 h-5" /> Add Record</>}
                                </button>
                            </form>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default UserProfile;

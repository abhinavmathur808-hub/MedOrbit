import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Stethoscope, Search } from 'lucide-react';
import DoctorCard from '../../components/DoctorCard';
import CurvedWrapper from '../../components/CurvedWrapper';

const Doctors = () => {
    const location = useLocation();
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (location.state?.speciality) {
            setSearchTerm(location.state.speciality);
        }
    }, [location.state]);

    useEffect(() => {
        const fetchDoctors = async () => {

            try {
                const response = await fetch('http://localhost:5000/api/doctor', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });

                const data = await response.json();

                if (data.success) {
                    setDoctors(data.doctors || []);
                } else {
                    setError(data.message || 'Failed to fetch doctors');
                }
            } catch (err) {
                setError('Failed to connect to server');
            } finally {
                setLoading(false);
            }
        };

        fetchDoctors();
    }, []);

    const filteredDoctors = doctors.filter((doctor) => {
        const name = doctor.userId?.name?.toLowerCase() || '';
        const specialization = doctor.specialization?.toLowerCase() || '';
        const search = searchTerm.toLowerCase();
        return name.includes(search) || specialization.includes(search);
    });

    if (loading) {
        return (
            <div className="min-h-screen bg-[#09090b]">
                <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
                    <div className="text-center">
                        <div className="w-12 h-12 border-4 border-rose-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-zinc-400">Finding doctors near you...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#09090b]">
            <div className="bg-[#09090b] pt-32 pb-20 text-center px-6">
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-3">
                    Find Doctors
                </h1>
                <p className="text-zinc-400 text-lg">
                    Book appointments with verified healthcare professionals
                </p>
            </div>
            <CurvedWrapper>
                <div className="max-w-7xl mx-auto">

                    {location.state?.speciality && (
                        <div className="max-w-xl mx-auto mb-6">
                            <div
                                className="flex items-center justify-between rounded-xl px-5 py-4 border-l-4 bg-white/[0.03] border-white/[0.06]"
                                style={{ borderLeftColor: '#e11d48' }}
                            >
                                <div>
                                    <p className="text-sm font-semibold text-white">
                                        🩺 Showing results for: <span className="text-rose-500">{location.state.speciality}</span>
                                    </p>
                                    <p className="text-xs mt-0.5 text-zinc-500">
                                        Based on your symptom search
                                    </p>
                                </div>
                                <button
                                    onClick={() => { setSearchTerm(''); window.history.replaceState({}, ''); }}
                                    className="text-sm font-medium px-4 py-2 rounded-full bg-white/[0.05] border border-zinc-700 text-zinc-300 hover:bg-white/[0.1] hover:text-white transition-all cursor-pointer"
                                >
                                    Clear filter
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="max-w-xl mx-auto mb-8">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-zinc-600" />
                            <input
                                type="text"
                                placeholder="Search by name or specialization..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-black/50 border border-zinc-800 rounded-xl focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition-all outline-none text-white placeholder-zinc-600"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="text-center py-12">
                            <div className="bg-red-500/10 text-red-400 px-6 py-4 rounded-xl inline-block border border-red-500/20">
                                {error}
                            </div>
                        </div>
                    )}

                    {!error && filteredDoctors.length === 0 && (
                        <div className="text-center py-16">
                            <Stethoscope className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-zinc-400 mb-2">
                                No doctors found
                            </h3>
                            <p className="text-zinc-600">
                                {searchTerm
                                    ? 'Try adjusting your search criteria'
                                    : 'Check back later for available doctors'}
                            </p>
                        </div>
                    )}

                    {filteredDoctors.length > 0 && (
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filteredDoctors.map((doctor) => (
                                <DoctorCard key={doctor._id} doctor={doctor} />
                            ))}
                        </div>
                    )}
                </div>
            </CurvedWrapper>
        </div>
    );
};

export default Doctors;

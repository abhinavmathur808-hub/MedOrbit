const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Stethoscope, Search, Loader2 } from 'lucide-react';
import DoctorCard from '../../components/DoctorCard';
import CurvedWrapper from '../../components/CurvedWrapper';

const LIMIT = 10;

const Doctors = () => {
    const location = useLocation();
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState('');
    // Server-side specialty filter (from the AI "Browse all X" link or the
    // specialty menu). Kept separate from the manual text box so pagination
    // works over the FILTERED set instead of just the first unfiltered page.
    const [specialtyFilter, setSpecialtyFilter] = useState((location.state?.speciality || '').trim());
    const [searchTerm, setSearchTerm] = useState(''); // manual name refinement, client-side
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);

    // Pick up a new specialty whenever we're navigated here with one
    useEffect(() => {
        setSpecialtyFilter((location.state?.speciality || '').trim());
    }, [location.state]);

    const fetchDoctors = useCallback(async (targetPage, specialty) => {
        if (targetPage === 1) {
            setLoading(true);
        } else {
            setLoadingMore(true);
        }

        try {
            const specParam = specialty ? `&specialization=${encodeURIComponent(specialty)}` : '';
            const response = await fetch(
                `${API_BASE}/api/doctor?page=${targetPage}&limit=${LIMIT}${specParam}`,
                {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                }
            );

            const data = await response.json();

            if (data.success) {
                if (targetPage === 1) {
                    setDoctors(data.doctors || []);
                } else {
                    setDoctors((prev) => [...prev, ...(data.doctors || [])]);
                }
                setHasMore(data.hasMore ?? false);
            } else {
                setError(data.message || 'Failed to fetch doctors');
            }
        } catch (err) {
            setError('Failed to connect to server');
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, []);

    // Reset to the first page whenever the specialty filter changes
    useEffect(() => {
        setPage(1);
    }, [specialtyFilter]);

    useEffect(() => {
        fetchDoctors(page, specialtyFilter);
    }, [page, specialtyFilter, fetchDoctors]);

    const observer = useRef(null);

    const sentinelRef = useCallback(
        (node) => {
            if (observer.current) observer.current.disconnect();
            if (!node) return;

            observer.current = new IntersectionObserver(
                (entries) => {
                    if (entries[0].isIntersecting && hasMore && !loadingMore) {
                        setPage((prev) => prev + 1);
                    }
                },
                { rootMargin: '200px' }
            );

            observer.current.observe(node);
        },
        [hasMore, loadingMore]
    );

    const filteredDoctors = doctors.filter((doctor) => {
        const name = doctor.userId?.name?.toLowerCase() || '';
        const specialization = doctor.specialization?.toLowerCase() || '';
        const search = searchTerm.toLowerCase();
        return name.includes(search) || specialization.includes(search);
    });

    if (loading) {
        return (
            <div className="min-h-screen bg-neutral-950">
                <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
                    <div className="text-center">
                        <div className="w-12 h-12 border-4 border-burgundy-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-neutral-400">Finding doctors near you...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <motion.div
            className="min-h-screen bg-neutral-950"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
        >
            <div className="bg-neutral-950 pt-32 pb-20 text-center px-6">
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-3">
                    Find Doctors
                </h1>
                <p className="text-neutral-400 text-lg">
                    Book appointments with verified healthcare professionals
                </p>
            </div>
            <CurvedWrapper>
                <div className="max-w-7xl mx-auto">

                    {specialtyFilter && (
                        <div className="max-w-xl mx-auto mb-6">
                            <div
                                className="flex items-center justify-between rounded-xl px-5 py-4 border-l-4 bg-white/[0.03] border-white/[0.06]"
                                style={{ borderLeftColor: '#9b1b30' }}
                            >
                                <div>
                                    <p className="text-sm font-semibold text-white">
                                        🩺 Showing results for: <span className="text-burgundy-500">{specialtyFilter}</span>
                                    </p>
                                    <p className="text-xs mt-0.5 text-neutral-500">
                                        Based on your symptom search
                                    </p>
                                </div>
                                <button
                                    onClick={() => { setSpecialtyFilter(''); window.history.replaceState({}, ''); }}
                                    className="text-sm font-medium px-4 py-2 rounded-full bg-white/[0.05] border border-neutral-700 text-neutral-300 hover:bg-white/[0.1] hover:text-white transition-all cursor-pointer"
                                >
                                    Clear filter
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="max-w-xl mx-auto mb-8">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-600" />
                            <input
                                type="text"
                                placeholder="Search by name or specialization..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-black/50 border border-neutral-800 rounded-xl focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500 transition-all outline-none text-white placeholder-neutral-600"
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
                            <Stethoscope className="w-16 h-16 text-neutral-700 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-neutral-400 mb-2">
                                No doctors found
                            </h3>
                            <p className="text-neutral-600">
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

                    {!searchTerm && hasMore && (
                        <div ref={sentinelRef} style={{ height: '1px' }} />
                    )}

                    {loadingMore && (
                        <div className="flex flex-col items-center justify-center py-10 gap-3">
                            <Loader2 className="w-6 h-6 animate-spin text-burgundy-500" />
                            <p className="text-sm text-neutral-500 tracking-wide">Loading more doctors...</p>
                        </div>
                    )}
                </div>
            </CurvedWrapper>
        </motion.div>
    );
};

export default Doctors;


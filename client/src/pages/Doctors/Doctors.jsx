const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Stethoscope, Search } from 'lucide-react';
import DoctorCard from '../../components/DoctorCard';
import CurvedWrapper from '../../components/CurvedWrapper';
import { useToast } from '../../components/ui/Toast';
import Skeleton from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';

const LIMIT = 10;

// Content-shaped placeholder mirroring DoctorCard's layout (avatar, name,
// specialization, 3-column stats strip, book button) so the grid doesn't
// jump when real cards arrive.
const DoctorCardSkeleton = () => (
    <div className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-lg shadow-black/30">
        <div className="flex flex-col items-center text-center">
            <Skeleton className="w-24 h-24 rounded-full" />
            <Skeleton className="h-5 w-32 mt-4" />
            <Skeleton className="h-4 w-24 mt-2" />
        </div>
        <div className="grid grid-cols-3 gap-2 bg-zinc-950 border border-zinc-800 rounded-xl p-3 mt-4">
            {[0, 1, 2].map((i) => (
                <div key={i} className="flex flex-col items-center gap-1.5">
                    <Skeleton className="w-4 h-4 rounded" />
                    <Skeleton className="h-4 w-10" />
                    <Skeleton className="h-2 w-8" />
                </div>
            ))}
        </div>
        <Skeleton className="h-12 w-full mt-4 rounded-xl" />
    </div>
);

const Doctors = () => {
    const location = useLocation();
    const toast = useToast();
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
                if (targetPage > 1) {
                    toast.error('Could not load more doctors — please try again');
                }
            }
        } catch (err) {
            setError('Failed to connect to server');
            if (targetPage > 1) {
                toast.error('Could not load more doctors — please try again');
            }
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [toast]);

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
            <div className="min-h-screen bg-zinc-950">
                <div className="bg-zinc-950 pt-32 pb-20 text-center px-6">
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-3">
                        Find Doctors
                    </h1>
                    <p className="text-zinc-400 text-lg">
                        Book appointments with verified healthcare professionals
                    </p>
                </div>
                <CurvedWrapper>
                    <div className="max-w-7xl mx-auto">
                        <div className="max-w-xl mx-auto mb-8">
                            <Skeleton className="h-[50px] w-full rounded-xl" />
                        </div>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {Array.from({ length: 8 }).map((_, i) => (
                                <DoctorCardSkeleton key={i} />
                            ))}
                        </div>
                    </div>
                </CurvedWrapper>
            </div>
        );
    }

    return (
        <motion.div
            className="min-h-screen bg-zinc-950"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
        >
            <div className="bg-zinc-950 pt-32 pb-20 text-center px-6">
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-3">
                    Find Doctors
                </h1>
                <p className="text-zinc-400 text-lg">
                    Book appointments with verified healthcare professionals
                </p>
            </div>
            <CurvedWrapper>
                <div className="max-w-7xl mx-auto">

                    {specialtyFilter && (
                        <div className="max-w-xl mx-auto mb-6">
                            <div
                                className="flex items-center justify-between rounded-xl px-5 py-4 border-l-4 bg-white/[0.03] border-white/[0.06]"
                                style={{ borderLeftColor: '#e11d48' }}
                            >
                                <div>
                                    <p className="text-sm font-semibold text-white">
                                        🩺 Showing results for: <span className="text-rose-500">{specialtyFilter}</span>
                                    </p>
                                    <p className="text-xs mt-0.5 text-zinc-500">
                                        Based on your symptom search
                                    </p>
                                </div>
                                <button
                                    onClick={() => { setSpecialtyFilter(''); window.history.replaceState({}, ''); }}
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
                                className="w-full pl-12 pr-4 py-3 bg-zinc-950/50 border border-zinc-800 rounded-xl focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition-all outline-none text-white placeholder-zinc-600"
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
                        <EmptyState
                            card={false}
                            icon={Stethoscope}
                            title="No doctors found"
                            subtitle={searchTerm
                                ? 'Try adjusting your search criteria'
                                : 'Check back later for available doctors'}
                        />
                    )}

                    {filteredDoctors.length > 0 && (
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filteredDoctors.map((doctor) => (
                                <DoctorCard key={doctor._id} doctor={doctor} />
                            ))}
                            {loadingMore &&
                                Array.from({ length: 4 }).map((_, i) => (
                                    <DoctorCardSkeleton key={`loading-more-${i}`} />
                                ))}
                        </div>
                    )}

                    {!searchTerm && hasMore && (
                        <div ref={sentinelRef} style={{ height: '1px' }} />
                    )}
                </div>
            </CurvedWrapper>
        </motion.div>
    );
};

export default Doctors;


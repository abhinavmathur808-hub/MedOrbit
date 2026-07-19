const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Search,
    Stethoscope,
    SlidersHorizontal,
    Check,
    X,
    Heart,
    Brain,
    BrainCircuit,
    Fingerprint,
    Bone,
} from 'lucide-react';
import DoctorCard from '../../components/DoctorCard';
import CurvedWrapper from '../../components/CurvedWrapper';
import { useToast } from '../../components/ui/Toast';
import Skeleton from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';

const LIMIT = 12;

// Specialty facets are fetched live from the DB (see the effect in the
// component); this map only decorates the known ones with an icon. Anything
// without an entry — a specialty added later — falls back to a neutral
// stethoscope, so the sidebar never breaks on an unmapped value.
const SPECIALTY_ICONS = {
    Cardiologist: Heart,
    Neurologist: Brain,
    Psychiatrist: BrainCircuit,
    Dermatologist: Fingerprint,
    'General Physician': Stethoscope,
    Orthopedic: Bone,
};

// Content-shaped placeholder mirroring the redesigned DoctorCard (circular
// avatar, centered name/specialty, boxed stat stack, bottom-pinned button) so
// the grid doesn't jump when real cards arrive.
const DoctorCardSkeleton = () => (
    <div className="flex flex-col h-full bg-zinc-900/40 backdrop-blur-md border border-zinc-800/50 rounded-2xl p-5">
        <Skeleton className="w-24 h-24 rounded-full mx-auto mt-2 mb-4" />
        <div className="flex flex-col items-center gap-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-24" />
        </div>
        <div className="flex flex-col gap-2 w-full mt-4 bg-zinc-950/50 rounded-lg p-3">
            <div className="flex justify-between">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-12" />
            </div>
            <div className="border-t border-zinc-800/50 pt-2 mt-1">
                <Skeleton className="h-3 w-3/4" />
            </div>
        </div>
        <div className="mt-auto pt-4">
            <Skeleton className="h-11 w-full rounded-xl" />
        </div>
    </div>
);

const Doctors = () => {
    const location = useLocation();
    const toast = useToast();
    const [searchParams, setSearchParams] = useSearchParams();

    // The URL is the single source of truth for every filter, so a filtered
    // view is shareable / bookmarkable and the browser back button restores it.
    const searchTerm = searchParams.get('q') || '';
    const selectedSpecialties = searchParams.getAll('specialty');
    const availableToday = searchParams.get('available') === 'true';
    // Stable primitive for hook deps (getAll() returns a fresh array each render)
    const specialtyKey = selectedSpecialties.join('|');

    // The specialty facet is resolved entirely server-side: the endpoint takes
    // the whole selected set ($in) and paginates the union, so multi-select
    // stays complete instead of collapsing to whatever landed on page 1. Search
    // and availability then refine that loaded set on the client (below).

    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState('');
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    // Total docs matching the current server-side query (specialty + verified),
    // independent of pagination — drives an accurate header count before the
    // user scrolls through the pages.
    const [totalDoctors, setTotalDoctors] = useState(0);

    // Specialty facets, loaded from the DB so the sidebar reflects the doctors
    // that actually exist (Option B) rather than a hardcoded list.
    const [specialtyOptions, setSpecialtyOptions] = useState([]);
    const [specialtiesLoading, setSpecialtiesLoading] = useState(true);

    // ---- URL writers ------------------------------------------------------
    const setParam = useCallback((key, value) => {
        setSearchParams((prev) => {
            const next = new URLSearchParams(prev);
            if (!value) next.delete(key);
            else next.set(key, value);
            return next;
        }, { replace: true });
    }, [setSearchParams]);

    const toggleSpecialty = useCallback((value) => {
        setSearchParams((prev) => {
            const next = new URLSearchParams(prev);
            const current = next.getAll('specialty');
            next.delete('specialty');
            const updated = current.includes(value)
                ? current.filter((s) => s !== value)
                : [...current, value];
            updated.forEach((s) => next.append('specialty', s));
            return next;
        }, { replace: true });
    }, [setSearchParams]);

    const clearAll = useCallback(
        () => setSearchParams({}, { replace: true }),
        [setSearchParams]
    );

    // A specialty arriving via navigation state (AI triage / specialty menu) is
    // migrated into the URL so it flows through the same code path as a
    // hand-typed ?specialty= — and becomes shareable in the process.
    useEffect(() => {
        const navSpec = (location.state?.speciality || '').trim();
        if (!navSpec) return;
        setSearchParams((prev) => {
            const next = new URLSearchParams(prev);
            next.delete('specialty');
            next.append('specialty', navSpec);
            return next;
        }, { replace: true });
    }, [location.state, setSearchParams]);

    // Populate the specialty facets from the DB on mount. Non-fatal: if it
    // fails the sidebar simply shows no specialty checkboxes; search and
    // availability still work.
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const res = await fetch(`${API_BASE}/api/doctor/specialties`);
                const data = await res.json();
                if (!cancelled && data.success && Array.isArray(data.specialties)) {
                    setSpecialtyOptions(data.specialties);
                }
            } catch {
                /* leave the list empty */
            } finally {
                if (!cancelled) setSpecialtiesLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, []);

    // ---- data fetching (server-side specialty + pagination preserved) -----
    const fetchDoctors = useCallback(async (targetPage, specialties) => {
        if (targetPage === 1) setLoading(true);
        else setLoadingMore(true);

        try {
            const params = new URLSearchParams({ page: targetPage, limit: LIMIT });
            specialties.forEach((s) => params.append('specialization', s));
            const response = await fetch(
                `${API_BASE}/api/doctor?${params.toString()}`,
                { method: 'GET', headers: { 'Content-Type': 'application/json' } }
            );

            const data = await response.json();

            if (data.success) {
                setDoctors((prev) => {
                    if (targetPage === 1) return data.doctors || [];
                    // Dedupe on append — guards against any page overlap or a
                    // fetch that raced a filter change re-adding the same doctor.
                    const seen = new Set(prev.map((d) => d._id));
                    return [...prev, ...(data.doctors || []).filter((d) => !seen.has(d._id))];
                });
                setHasMore(data.hasMore ?? false);
                if (typeof data.totalCount === 'number') setTotalDoctors(data.totalCount);
                setError('');
            } else {
                setError(data.message || 'Failed to fetch doctors');
                if (targetPage > 1) toast.error('Could not load more doctors — please try again');
            }
        } catch (err) {
            setError('Failed to connect to server');
            if (targetPage > 1) toast.error('Could not load more doctors — please try again');
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [toast]);

    // Reset to the first page whenever the selected specialty set changes
    useEffect(() => {
        setPage(1);
    }, [specialtyKey]);

    useEffect(() => {
        fetchDoctors(page, specialtyKey ? specialtyKey.split('|') : []);
    }, [page, specialtyKey, fetchDoctors]);

    // A free-text search or the availability toggle refines the loaded set on
    // the client, so that set must be COMPLETE — otherwise we'd only ever match
    // page 1 (there are many more doctors than fit on one page). Eagerly pull
    // the remaining pages of the current, already-specialty-filtered set: it's
    // bounded and the pages are cached server-side. Plain browsing keeps lazy
    // infinite scroll instead (see the sentinel below).
    const needsFullSet = Boolean(searchTerm) || availableToday;
    useEffect(() => {
        if (needsFullSet && hasMore && !loading && !loadingMore) {
            setPage((p) => p + 1);
        }
    }, [needsFullSet, hasMore, loading, loadingMore]);

    // ---- infinite scroll --------------------------------------------------
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

    // ---- client refine layer (search + multi-specialty + availability) ----
    const today = useMemo(
        () => new Date().toLocaleDateString('en-US', { weekday: 'long' }),
        []
    );

    // Search and availability refine the server-filtered set on the client.
    // (Specialty is already applied server-side, so it isn't repeated here.)
    const filteredDoctors = useMemo(() => {
        const q = searchTerm.trim().toLowerCase();
        return doctors.filter((doctor) => {
            const name = doctor.userId?.name?.toLowerCase() || '';
            const specialization = (doctor.specialization || '').toLowerCase();
            const matchesSearch = !q || name.includes(q) || specialization.includes(q);
            const matchesAvailability = !availableToday
                || (Array.isArray(doctor.availability)
                    && doctor.availability.some((slot) => slot.day === today));
            return matchesSearch && matchesAvailability;
        });
    }, [doctors, searchTerm, availableToday, today]);

    const hasActiveFilters = Boolean(searchTerm) || selectedSpecialties.length > 0 || availableToday;

    // Header count. Specialty is filtered server-side, so totalDoctors is the
    // accurate full count without loading every page. Search/availability refine
    // on the client over the eager-loaded set, so there filteredDoctors.length is
    // the true match count.
    const displayCount = needsFullSet ? filteredDoctors.length : totalDoctors;

    // Lazy infinite scroll only while plain-browsing server-driven pages. When a
    // client-side refinement is active the full set is eager-loaded above, so
    // the sentinel would race that — hide it there.
    const showSentinel = !needsFullSet && hasMore;

    // ---- filter chip ------------------------------------------------------
    const FilterChip = ({ label, onRemove }) => (
        <button
            onClick={onRemove}
            className="inline-flex items-center gap-1.5 rounded-full border border-zinc-700 bg-zinc-800/50 px-3 py-1 text-xs font-medium text-zinc-300 transition-colors hover:border-rose-500/50 hover:text-white cursor-pointer"
        >
            {label}
            <X className="h-3 w-3" />
        </button>
    );

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
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 max-w-7xl mx-auto px-6">

                    {/* ---- Left column: sticky faceted filter sidebar ---- */}
                    <aside className="lg:col-span-1 lg:sticky lg:top-24 h-fit">
                        {/* On lg the panel is sticky, so cap it to the viewport and
                            let it scroll internally (sleek bar) when the specialty
                            list runs long. On mobile it flows in the page normally. */}
                        <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/50 rounded-2xl p-6 flex flex-col gap-6 lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto scrollbar-sleek">

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <SlidersHorizontal className="h-4 w-4 text-rose-500" />
                                    <h2 className="text-sm font-semibold text-white">Filters</h2>
                                </div>
                                {hasActiveFilters && (
                                    <button
                                        onClick={clearAll}
                                        className="text-xs font-medium text-zinc-500 hover:text-rose-400 transition-colors cursor-pointer"
                                    >
                                        Clear all
                                    </button>
                                )}
                            </div>

                            {/* Search */}
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">
                                    Search
                                </label>
                                <div className="relative">
                                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                                    <input
                                        type="text"
                                        placeholder="Name or specialization"
                                        value={searchTerm}
                                        onChange={(e) => setParam('q', e.target.value)}
                                        className="w-full pl-10 pr-3 py-2.5 bg-zinc-950/50 border border-zinc-800 rounded-xl focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition-all outline-none text-sm text-white placeholder-zinc-600"
                                    />
                                </div>
                            </div>

                            {/* Specialties */}
                            <div className="border-t border-zinc-800/50 pt-6">
                                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3">
                                    Specialties
                                </label>
                                {specialtiesLoading ? (
                                    <div className="flex flex-col gap-2.5 px-2 py-1">
                                        {Array.from({ length: 6 }).map((_, i) => (
                                            <Skeleton key={i} className="h-5 w-full" />
                                        ))}
                                    </div>
                                ) : specialtyOptions.length === 0 ? (
                                    <p className="px-2 text-sm text-zinc-500">No specialties available</p>
                                ) : (
                                    <div className="flex flex-col gap-0.5">
                                        {specialtyOptions.map((value) => {
                                            const Icon = SPECIALTY_ICONS[value] || Stethoscope;
                                            const checked = selectedSpecialties.some(
                                                (s) => s.toLowerCase() === value.toLowerCase()
                                            );
                                            return (
                                                <button
                                                    key={value}
                                                    onClick={() => toggleSpecialty(value)}
                                                    className="group flex items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-zinc-800/40 cursor-pointer"
                                                >
                                                    <span
                                                        className={`grid h-[18px] w-[18px] flex-shrink-0 place-items-center rounded-[5px] border transition-colors ${
                                                            checked
                                                                ? 'border-rose-500 bg-rose-600'
                                                                : 'border-zinc-700 bg-zinc-900 group-hover:border-zinc-600'
                                                        }`}
                                                    >
                                                        {checked && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                                                    </span>
                                                    <Icon
                                                        className={`h-4 w-4 flex-shrink-0 transition-colors ${
                                                            checked ? 'text-rose-400' : 'text-zinc-500'
                                                        }`}
                                                        strokeWidth={1.75}
                                                    />
                                                    <span
                                                        className={`text-sm transition-colors ${
                                                            checked ? 'text-white' : 'text-zinc-400 group-hover:text-zinc-200'
                                                        }`}
                                                    >
                                                        {value}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Availability */}
                            <div className="border-t border-zinc-800/50 pt-6">
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <span className="text-sm font-medium text-zinc-200">Available today</span>
                                        <p className="text-xs text-zinc-500 mt-0.5">{today}</p>
                                    </div>
                                    <button
                                        role="switch"
                                        aria-checked={availableToday}
                                        aria-label="Filter to doctors available today"
                                        onClick={() => setParam('available', availableToday ? '' : 'true')}
                                        className={`relative h-6 w-11 flex-shrink-0 rounded-full transition-colors cursor-pointer ${
                                            availableToday ? 'bg-rose-600' : 'bg-zinc-700'
                                        }`}
                                    >
                                        <span
                                            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-all ${
                                                availableToday ? 'left-[22px]' : 'left-0.5'
                                            }`}
                                        />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </aside>

                    {/* ---- Right column: results ---- */}
                    <section className="lg:col-span-3">

                        {/* Results toolbar */}
                        <div className="mb-6 flex flex-col gap-3">
                            <p className="text-sm text-zinc-400">
                                {loading ? (
                                    'Loading doctors…'
                                ) : (
                                    <>
                                        <span className="font-semibold text-white">{displayCount}</span>
                                        {displayCount === 1 ? ' doctor' : ' doctors'}
                                        {hasActiveFilters ? ' match your filters' : ' available'}
                                    </>
                                )}
                            </p>

                            {hasActiveFilters && (
                                <div className="flex flex-wrap items-center gap-2">
                                    {searchTerm && (
                                        <FilterChip
                                            label={`“${searchTerm}”`}
                                            onRemove={() => setParam('q', '')}
                                        />
                                    )}
                                    {selectedSpecialties.map((s) => (
                                        <FilterChip key={s} label={s} onRemove={() => toggleSpecialty(s)} />
                                    ))}
                                    {availableToday && (
                                        <FilterChip
                                            label="Available today"
                                            onRemove={() => setParam('available', '')}
                                        />
                                    )}
                                </div>
                            )}
                        </div>

                        {loading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                {Array.from({ length: 6 }).map((_, i) => (
                                    <DoctorCardSkeleton key={i} />
                                ))}
                            </div>
                        ) : error ? (
                            <div className="text-center py-12">
                                <div className="bg-red-500/10 text-red-400 px-6 py-4 rounded-xl inline-block border border-red-500/20">
                                    {error}
                                </div>
                            </div>
                        ) : filteredDoctors.length === 0 ? (
                            <EmptyState
                                card={false}
                                icon={Stethoscope}
                                title="No doctors found"
                                subtitle={
                                    hasActiveFilters
                                        ? 'Try adjusting or clearing your filters'
                                        : 'Check back later for available doctors'
                                }
                            />
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                {filteredDoctors.map((doctor) => (
                                    <DoctorCard key={doctor._id} doctor={doctor} />
                                ))}
                                {loadingMore &&
                                    Array.from({ length: 3 }).map((_, i) => (
                                        <DoctorCardSkeleton key={`loading-more-${i}`} />
                                    ))}
                            </div>
                        )}

                        {showSentinel && <div ref={sentinelRef} style={{ height: '1px' }} />}
                    </section>
                </div>
            </CurvedWrapper>
        </motion.div>
    );
};

export default Doctors;

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import {
    Search,
    Zap,
    Lock,
    Loader2,
    BadgeCheck,
    ArrowRight,
    Sparkles,
    X,
    Stethoscope,
} from 'lucide-react';
import { getRandomHealthQuote } from '../utils/healthQuotes';
import { preloadLocalTriage, matchSpecialty, getTriageStatus } from '../utils/localTriage';
import Footer from '../components/Footer';
import SpecialityMenu from '../components/SpecialityMenu';
import TopArticles from '../components/TopArticles';
import UserReviews from '../components/UserReviews';
import FAQ from '../components/FAQ';
import CurvedWrapper from '../components/CurvedWrapper';

// Keyword fallback used only if the on-device model fails to load, so the
// search still routes to a sensible specialty. Restricted to specialties that
// actually have doctors in the platform.
const SYMPTOM_MAP = {
    Neurologist: ['headache', 'migraine', 'seizure', 'dizziness', 'numbness', 'memory', 'brain'],
    Dermatologist: ['skin', 'rash', 'acne', 'eczema', 'itching', 'allergy', 'hair loss'],
    Cardiologist: ['chest pain', 'heart', 'palpitation', 'blood pressure', 'bp', 'cholesterol'],
    Orthopedic: ['bone', 'fracture', 'joint', 'knee', 'back pain', 'spine', 'shoulder'],
    Psychiatrist: ['anxiety', 'depression', 'stress', 'insomnia', 'sleep', 'panic', 'mental'],
    'General Physician': ['cold', 'flu', 'fever', 'fatigue', 'weakness', 'body pain', 'stomach', 'nausea'],
};

const keywordSpecialty = (query) => {
    const q = query.toLowerCase();
    for (const [specialty, keywords] of Object.entries(SYMPTOM_MAP)) {
        if (keywords.some((kw) => q.includes(kw))) return specialty;
    }
    return 'General Physician';
};

const Home = () => {
    const { user } = useSelector((state) => state.auth);
    const [healthQuote, setHealthQuote] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const navigate = useNavigate();

    // On-device model lifecycle: 'idle' | 'loading' | 'ready' | 'unavailable'
    const [triageStatus, setTriageStatus] = useState(getTriageStatus());
    const [modelProgress, setModelProgress] = useState(0);

    // Result state for the inline AI panel
    const [hasSearched, setHasSearched] = useState(false);
    const [triage, setTriage] = useState(null);
    const [refining, setRefining] = useState(false); // on-device match upgrading a keyword result
    const [doctors, setDoctors] = useState([]);
    const [doctorsLoading, setDoctorsLoading] = useState(false);
    const [advice, setAdvice] = useState('');
    const [adviceLoading, setAdviceLoading] = useState(false);
    const [adviceError, setAdviceError] = useState('');
    const lastSpecRef = useRef(null); // avoid refetching doctors if the specialty is unchanged

    useEffect(() => {
        setHealthQuote(getRandomHealthQuote());

        // Preload the model during idle time so the first search is instant,
        // unless the visitor is on a metered or very slow connection. The 23 MB
        // download then happens in the background while they read the page and
        // is cached for every later visit.
        const conn = navigator.connection;
        const cheapToLoad = !conn || (!conn.saveData && !/(^|-)2g/.test(conn.effectiveType || ''));
        if (cheapToLoad) {
            const schedule = window.requestIdleCallback || ((fn) => setTimeout(fn, 1500));
            const cancel = window.cancelIdleCallback || clearTimeout;
            const id = schedule(() => warmUpModel());
            return () => cancel(id);
        }
    }, []);

    // Warm up the on-device model when the user engages the search box, so the
    // instant tier is usually ready by the time they submit
    const warmUpModel = () => {
        if (getTriageStatus() !== 'idle') return;
        setTriageStatus('loading');
        preloadLocalTriage((p) => setModelProgress(p))
            .then(() => setTriageStatus('ready'))
            .catch(() => setTriageStatus('unavailable'));
    };

    const fetchRelatedDoctors = async (specialization) => {
        setDoctorsLoading(true);
        try {
            const res = await fetch(
                `${API_BASE}/api/doctor/related?specialization=${encodeURIComponent(specialization)}`
            );
            const data = await res.json();
            setDoctors(data.success ? (data.doctors || []).slice(0, 3) : []);
        } catch {
            setDoctors([]);
        } finally {
            setDoctorsLoading(false);
        }
    };

    // Tier 2: full Gemini guidance (server also falls back to keyword advice).
    // Requires auth; logged-out users still get the instant on-device match.
    const runCloudAdvice = async (text) => {
        const token = localStorage.getItem('token');
        if (!token) return;
        setAdviceLoading(true);
        setAdviceError('');
        try {
            const res = await fetch(`${API_BASE}/api/ai/analyze`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ symptoms: text }),
            });
            const data = await res.json();
            if (data.success) setAdvice(data.advice);
            else setAdviceError('Could not generate detailed guidance right now.');
        } catch {
            setAdviceError('Could not connect for detailed guidance.');
        } finally {
            setAdviceLoading(false);
        }
    };

    // Sets the shown specialty and fetches its doctors, skipping the refetch if
    // the specialty hasn't changed from what's already displayed.
    const applySpecialty = (specialty) => {
        if (specialty === lastSpecRef.current) return;
        lastSpecRef.current = specialty;
        fetchRelatedDoctors(specialty);
    };

    // Runs the on-device semantic match. When it's an upgrade over an instant
    // keyword result, it only replaces the UI if the model actually loaded.
    const runSemanticMatch = async (raw, { isUpgrade }) => {
        try {
            const result = await matchSpecialty(raw);
            setTriageStatus('ready');
            setTriage(result);
            applySpecialty(result.confidence === 'low' ? 'General Physician' : result.top.specialty);
        } catch {
            // Model unavailable — keep the instant keyword result already shown
            if (!isUpgrade) {
                const specialty = keywordSpecialty(raw);
                setTriage({ top: { specialty }, confidence: 'moderate', fallback: true });
                applySpecialty(specialty);
            }
        } finally {
            setRefining(false);
        }
    };

    const handleSymptomSearch = () => {
        const raw = searchQuery.trim();
        if (!raw) {
            navigate('/doctors');
            return;
        }

        setHasSearched(true);
        setAdvice('');
        setAdviceError('');
        setDoctors([]);
        lastSpecRef.current = null;

        // Gemini guidance never waits on the local model — fire it immediately
        runCloudAdvice(raw);

        if (getTriageStatus() === 'ready') {
            // Model is warm: the semantic match is itself near-instant
            setTriage(null);
            setRefining(false);
            runSemanticMatch(raw, { isUpgrade: false });
        } else {
            // Model is still downloading/cold: show an instant keyword match and
            // its doctors right away, then quietly upgrade to the on-device match
            // once the model is ready — the user never waits on the 23 MB load.
            const specialty = keywordSpecialty(raw);
            setTriage({ top: { specialty }, confidence: 'moderate', instant: true });
            applySpecialty(specialty);
            if (getTriageStatus() !== 'unavailable') {
                setRefining(true);
                runSemanticMatch(raw, { isUpgrade: true });
            }
        }
    };

    const handleSearchKeyDown = (e) => {
        if (e.key === 'Enter') handleSymptomSearch();
    };

    const clearSearch = () => {
        setSearchQuery('');
        setHasSearched(false);
        setTriage(null);
        setRefining(false);
        setAdvice('');
        setAdviceError('');
        setDoctors([]);
        lastSpecRef.current = null;
    };

    const matchedSpecialty = triage?.top?.specialty;
    const lowConfidence = triage?.confidence === 'low';

    return (
        <motion.div
            className="min-h-screen"
            style={{ backgroundColor: 'var(--bg-base)' }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
        >
            <section className="relative w-full min-h-[85vh] flex items-center justify-center overflow-hidden pb-20 pt-32">
                <div
                    style={{ backgroundImage: "url('/hero-medical-bg.webp')" }}
                    className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat z-0 scale-105"
                ></div>

                <div className="absolute inset-0 w-full h-full bg-zinc-950/85 z-10"></div>

                <div className="relative z-20 w-full max-w-6xl mx-auto flex flex-col items-center text-center px-4 md:px-8">

                    <h1 className="text-5xl sm:text-6xl lg:text-7xl font-semibold tracking-tight leading-none text-white mb-6">
                        Bring <span className="relative inline-block border border-rose-700/50 bg-rose-900/20 text-zinc-200 px-3 py-1 mx-2">
                            <span className="absolute -top-[3px] -left-[3px] w-1.5 h-1.5 bg-rose-600 border border-rose-700/50"></span>
                            <span className="absolute -top-[3px] -right-[3px] w-1.5 h-1.5 bg-rose-600 border border-rose-700/50"></span>
                            <span className="absolute -bottom-[3px] -left-[3px] w-1.5 h-1.5 bg-rose-600 border border-rose-700/50"></span>
                            <span className="absolute -bottom-[3px] -right-[3px] w-1.5 h-1.5 bg-rose-600 border border-rose-700/50"></span>
                            Doctors
                        </span><br />
                        Into Your Orbit!
                    </h1>

                    <p className="text-lg sm:text-xl leading-relaxed text-zinc-300 max-w-xl mx-auto mb-14">
                        Find the right doctor and book your appointment instantly. Scheduling made
                        simple, reliable and fast.
                    </p>

                    <div
                        className="w-full max-w-2xl mx-auto rounded-2xl p-6 border border-zinc-800"
                        style={{
                            background: 'rgba(0, 0, 0,0.6)',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                            backdropFilter: 'blur(12px)',
                        }}
                    >
                        <div className="flex items-center gap-3">
                            <div className="flex-1 flex items-center bg-zinc-950/50 rounded-xl p-4 border border-zinc-800 focus-within:border-zinc-500 transition-colors duration-200">
                                <Search className="w-6 h-6 text-zinc-600 mr-3 flex-shrink-0" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={handleSearchKeyDown}
                                    onFocus={warmUpModel}
                                    placeholder="Describe your symptoms... e.g. headache, skin rash"
                                    className="w-full outline-none text-lg bg-transparent text-white placeholder-zinc-600"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={clearSearch}
                                        className="text-zinc-600 hover:text-zinc-300 transition-colors flex-shrink-0 ml-2"
                                        aria-label="Clear"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                )}
                            </div>
                            <button
                                onClick={handleSymptomSearch}
                                className="bg-rose-600 text-white rounded-full px-8 py-4 font-medium text-lg hover:bg-rose-500 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex-shrink-0 cursor-pointer shadow-lg shadow-rose-900/40"
                            >
                                Search
                            </button>
                        </div>

                        {/* Model status line */}
                        {triageStatus === 'loading' && (
                            <p className="text-[11px] text-rose-400/80 mt-3 text-left flex items-center gap-1.5 pl-1">
                                <Loader2 className="w-3 h-3 animate-spin" />
                                Preparing on-device AI… {modelProgress}% (one-time, then instant)
                            </p>
                        )}
                        {triageStatus === 'ready' && !hasSearched && (
                            <p className="text-[11px] text-zinc-500 mt-3 text-left flex items-center gap-1.5 pl-1">
                                <Lock className="w-3 h-3 text-emerald-500" />
                                On-device AI ready — your symptoms are matched privately in your browser
                            </p>
                        )}

                        {/* Inline AI results */}
                        <AnimatePresence>
                            {hasSearched && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.25 }}
                                    className="overflow-hidden"
                                >
                                    <div className="mt-4 pt-4 border-t border-white/10 text-left">

                                        {/* Instant on-device match */}
                                        <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-400 mb-2">
                                            <Zap className="w-3.5 h-3.5" />
                                            Instant match — on your device
                                        </div>

                                        {!triage ? (
                                            <div className="flex items-center gap-2 text-zinc-400 text-sm">
                                                <Loader2 className="w-4 h-4 animate-spin text-rose-400" />
                                                Analyzing your symptoms…
                                            </div>
                                        ) : lowConfidence ? (
                                            <p className="text-zinc-300 text-sm">
                                                I couldn't pin that down confidently — starting you with a{' '}
                                                <strong className="font-semibold text-rose-400">General Physician</strong>{' '}
                                                is a safe bet. Add a little more detail for a sharper match.
                                            </p>
                                        ) : (
                                            <p className="text-zinc-300 text-sm">
                                                Your symptoms point to a{' '}
                                                <strong className="font-semibold text-rose-400">{matchedSpecialty}</strong>
                                                {triage.confidence === 'moderate' ? ' (possible match)' : ''}.
                                                {refining && (
                                                    <span className="text-zinc-500 inline-flex items-center gap-1 ml-1">
                                                        <Loader2 className="w-3 h-3 animate-spin" />
                                                        refining…
                                                    </span>
                                                )}
                                            </p>
                                        )}

                                        {/* Doctor recommendations */}
                                        {doctorsLoading && (
                                            <div className="flex items-center gap-2 text-zinc-500 text-xs mt-3">
                                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                Finding available specialists…
                                            </div>
                                        )}

                                        {!doctorsLoading && doctors.length > 0 && (
                                            <div className="mt-3 grid sm:grid-cols-3 gap-2">
                                                {doctors.map((doc) => (
                                                    <Link
                                                        key={doc._id}
                                                        to={`/book-appointment/${doc._id}`}
                                                        className="group flex flex-col gap-1 px-3 py-2.5 bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 hover:border-rose-500/40 rounded-xl transition-all"
                                                    >
                                                        <span className="flex items-center gap-1 font-medium text-zinc-100 text-sm truncate">
                                                            {doc.userId?.name || 'Doctor'}
                                                            {doc.userId?.isVerified && <BadgeCheck className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />}
                                                        </span>
                                                        <span className="flex items-center justify-between text-xs">
                                                            <span className="text-zinc-500">₹{doc.fees}</span>
                                                            <span className="text-rose-400 font-semibold flex items-center gap-0.5 group-hover:gap-1.5 transition-all">
                                                                Book <ArrowRight className="w-3 h-3" />
                                                            </span>
                                                        </span>
                                                    </Link>
                                                ))}
                                            </div>
                                        )}

                                        {!doctorsLoading && triage && doctors.length === 0 && (
                                            <p className="text-zinc-500 text-xs mt-3">
                                                No {matchedSpecialty} available right now.
                                            </p>
                                        )}

                                        {/* Browse-all link */}
                                        {triage && !lowConfidence && (
                                            <button
                                                onClick={() => navigate('/doctors', { state: { speciality: matchedSpecialty } })}
                                                className="mt-3 text-xs text-zinc-400 hover:text-rose-400 transition-colors inline-flex items-center gap-1"
                                            >
                                                Browse all {matchedSpecialty}s
                                                <ArrowRight className="w-3 h-3" />
                                            </button>
                                        )}

                                        {/* Tier 2: full Gemini guidance */}
                                        {(adviceLoading || advice || adviceError || !user) && (
                                            <div className="mt-4 pt-4 border-t border-white/10">
                                                <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-300 mb-2">
                                                    <Sparkles className="w-3.5 h-3.5" />
                                                    AI health guidance
                                                </div>

                                                {!user ? (
                                                    <p className="text-zinc-400 text-sm">
                                                        <Link to="/login" className="text-rose-400 font-medium hover:underline">Log in</Link>{' '}
                                                        for detailed AI guidance. The instant match above works without an account.
                                                    </p>
                                                ) : adviceLoading ? (
                                                    <div className="flex items-center gap-2 text-zinc-400 text-sm">
                                                        <Loader2 className="w-4 h-4 animate-spin text-rose-300" />
                                                        Generating detailed guidance…
                                                    </div>
                                                ) : adviceError ? (
                                                    <p className="text-zinc-500 text-sm">{adviceError}</p>
                                                ) : (
                                                    <div className="text-zinc-300 text-sm leading-relaxed">
                                                        <ReactMarkdown
                                                            components={{
                                                                strong: ({ children }) => <strong className="font-semibold text-rose-400">{children}</strong>,
                                                                em: ({ children }) => <em className="italic">{children}</em>,
                                                                p: ({ children }) => <p className="mb-1.5 last:mb-0">{children}</p>,
                                                            }}
                                                        >
                                                            {advice}
                                                        </ReactMarkdown>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Privacy + disclaimer */}
                                        <div className="flex items-center gap-1 text-[10px] text-zinc-600 mt-4">
                                            <Lock className="w-3 h-3" />
                                            Instant match runs locally — that text never leaves your browser. Not a medical diagnosis.
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {healthQuote && !hasSearched && (
                        <p className="mt-10 text-sm sm:text-base w-full leading-relaxed text-center text-zinc-200">
                            <span className="drop-shadow-[0_0_12px_rgba(253,224,71,0.9)] text-lg inline-block mr-2">💡</span>{healthQuote}
                        </p>
                    )}
                </div>

                <div className="absolute bottom-0 left-0 w-full h-48 bg-gradient-to-t from-[#09090b] to-transparent z-10 pointer-events-none"></div>
            </section>

            <div className="relative z-10 bg-zinc-950 pt-16 pb-24 px-6 md:px-12 w-full">

                <SpecialityMenu />

                <TopArticles />

                <UserReviews />

                <FAQ />

                <Footer />
            </div>
        </motion.div >
    );
};

export default Home;

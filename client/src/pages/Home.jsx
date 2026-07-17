const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Search, Loader2, X } from 'lucide-react';
import { getRandomHealthQuote } from '../utils/healthQuotes';
import { preloadLocalTriage, matchSpecialty, getTriageStatus } from '../utils/localTriage';
import Footer from '../components/Footer';
import SpecialityMenu from '../components/SpecialityMenu';
import TopArticles from '../components/TopArticles';
import UserReviews from '../components/UserReviews';
import FAQ from '../components/FAQ';
import HeroShowcase from '../components/HeroShowcase';
import HeroResultPanel from '../components/HeroResultPanel';
import SplashCursor from '../components/ui/SplashCursor';

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

// Reveal-on-scroll wrapper. Collapses to a plain fade under reduced-motion.
const Reveal = ({ children, delay = 0, className = '' }) => {
    const reduce = useReducedMotion();
    return (
        <motion.div
            className={className}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 48 }}
            whileInView={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
        >
            {children}
        </motion.div>
    );
};

const Home = () => {
    const [healthQuote, setHealthQuote] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const navigate = useNavigate();
    const searchInputRef = useRef(null);

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

    // Entry point for the specialties row's "Not sure?" tile: send the visitor
    // back to the one control that answers the question for them. preventScroll
    // keeps the focus from teleporting the viewport past the smooth scroll.
    const focusSymptomSearch = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        warmUpModel();
        searchInputRef.current?.focus({ preventScroll: true });
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

    return (
        <motion.div
            className="relative min-h-screen overflow-x-hidden"
            style={{ backgroundColor: 'var(--bg-base)' }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
        >
            {/* Trailing splash cursor (desktop, fine-pointer, motion-safe only) */}
            <SplashCursor />

            {/* ===================== HERO ===================== */}
            <section className="relative w-full min-h-[92vh] flex items-center overflow-hidden pt-32 pb-20 lg:pb-24">

                {/* Ambient rose depth glows + masked grid (generative, no photo) */}
                <div className="absolute inset-0 z-0" aria-hidden="true">
                    <div
                        className="absolute left-1/2 top-[16%] -translate-x-1/2 w-[900px] max-w-[150vw] aspect-square rounded-full blur-[100px]"
                        style={{ background: 'radial-gradient(circle, rgba(136,19,55,0.38), rgba(76,5,25,0.16) 40%, transparent 68%)' }}
                    />
                    <div
                        className="absolute left-1/2 bottom-[-10%] -translate-x-1/2 w-[720px] max-w-[130vw] aspect-square rounded-full blur-[120px]"
                        style={{ background: 'radial-gradient(circle, rgba(225,29,72,0.16), transparent 62%)' }}
                    />
                    <div
                        className="absolute inset-0 opacity-[0.05]"
                        style={{
                            backgroundImage:
                                'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)',
                            backgroundSize: '56px 56px',
                            WebkitMaskImage: 'radial-gradient(circle at 50% 38%, black, transparent 70%)',
                            maskImage: 'radial-gradient(circle at 50% 38%, black, transparent 70%)',
                        }}
                    />
                </div>

                {/* Hero content — pitch on the left, the product itself on the right */}
                <div className="relative z-20 w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,520px)] items-center gap-14 lg:gap-12 px-4 md:px-8">

                    {/* ---------- Left: pitch + search ----------
                        Indented off the container edge, and its blocks kept close
                        so the headline, promise, search and fact read as one unit
                        rather than four stacked elements. */}
                    <div className="flex flex-col items-center text-center lg:items-start lg:pl-10 lg:text-left">

                        <motion.h1
                            initial={{ opacity: 0, y: 26 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                            className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight leading-[1.05] text-white mb-4"
                        >
                            Bring{' '}
                            <span className="relative inline-block px-3 py-1 mx-1 align-middle">
                                <span className="absolute inset-0 rounded-md border border-rose-700/50 bg-rose-900/20" style={{ boxShadow: '0 0 48px -8px rgba(225,29,72,0.65)' }}></span>
                                <span className="absolute -top-[3px] -left-[3px] w-1.5 h-1.5 bg-rose-600 border border-rose-700/50"></span>
                                <span className="absolute -top-[3px] -right-[3px] w-1.5 h-1.5 bg-rose-600 border border-rose-700/50"></span>
                                <span className="absolute -bottom-[3px] -left-[3px] w-1.5 h-1.5 bg-rose-600 border border-rose-700/50"></span>
                                <span className="absolute -bottom-[3px] -right-[3px] w-1.5 h-1.5 bg-rose-600 border border-rose-700/50"></span>
                                <span className="relative bg-gradient-to-b from-white to-rose-200 bg-clip-text text-transparent">Doctors</span>
                            </span><br />
                            Into Your{' '}
                            <span className="bg-gradient-to-r from-rose-400 via-rose-500 to-rose-300 bg-clip-text text-transparent">Orbit!</span>
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                            className="text-lg sm:text-xl leading-relaxed text-zinc-300 max-w-xl mx-auto lg:mx-0 mb-6"
                        >
                            Find the right doctor and book your appointment instantly. Scheduling made
                            simple, reliable and fast.
                        </motion.p>

                        {/* AI symptom search — one pill: field and action share a
                            single surface rather than nesting a bordered box inside
                            a padded panel, which is what made it bulky. */}
                        <motion.div
                            initial={{ opacity: 0, y: 24, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                            role="search"
                            className="relative w-full max-w-xl mx-auto lg:mx-0"
                        >
                            <div
                                aria-hidden="true"
                                className="absolute -inset-[1.5px] rounded-full bg-gradient-to-r from-rose-600/40 via-rose-400/25 to-rose-600/40 blur-[6px]"
                            />
                            <div
                                className="relative flex items-center gap-2 rounded-full border border-rose-500/20 py-1.5 pl-4 pr-1.5 transition-colors duration-200 focus-within:border-rose-500/60"
                                style={{
                                    background: 'rgba(9, 9, 11, 0.72)',
                                    boxShadow: '0 18px 50px -22px rgba(225,29,72,0.4), 0 6px 24px rgba(0,0,0,0.6)',
                                    backdropFilter: 'blur(16px)',
                                    WebkitBackdropFilter: 'blur(16px)',
                                }}
                            >
                                <Search className="h-4 w-4 flex-shrink-0 text-zinc-500" />
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={handleSearchKeyDown}
                                    onFocus={warmUpModel}
                                    aria-label="Describe your symptoms"
                                    autoComplete="off"
                                    enterKeyHint="search"
                                    placeholder="Describe your symptoms… e.g. headache"
                                    className="min-w-0 flex-1 bg-transparent py-2 text-sm text-white outline-none placeholder:text-zinc-600"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={clearSearch}
                                        className="flex-shrink-0 cursor-pointer rounded-full p-1 text-zinc-600 transition-colors hover:bg-white/5 hover:text-zinc-300"
                                        aria-label="Clear search"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                )}
                                <button
                                    onClick={handleSymptomSearch}
                                    className="flex-shrink-0 cursor-pointer rounded-full bg-rose-600 px-5 py-2 text-sm font-medium text-white shadow-lg shadow-rose-900/40 transition-all duration-200 hover:bg-rose-500 active:scale-[0.97]"
                                >
                                    Search
                                </button>
                            </div>

                            {/* One-time model download — the only status worth the space */}
                            {triageStatus === 'loading' && (
                                <p className="mt-2.5 flex items-center gap-1.5 pl-4 text-left text-[11px] text-rose-400/80">
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                    Preparing on-device AI… {modelProgress}%
                                </p>
                            )}
                        </motion.div>

                        {healthQuote && (
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 1, delay: 0.5 }}
                                className="mt-5 max-w-xl text-sm sm:text-base leading-relaxed text-zinc-200"
                            >
                                <span className="drop-shadow-[0_0_12px_rgba(253,224,71,0.9)] text-lg inline-block mr-2">💡</span>{healthQuote}
                            </motion.p>
                        )}
                    </div>

                    {/* ---------- Right: the product, running ----------
                        Loops the real flows as mock scenes until the visitor
                        searches, then hands the panel over to their live result. */}
                    <motion.div
                        initial={{ opacity: 0, y: 24, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                        className="w-full"
                    >
                        <AnimatePresence mode="wait">
                            {hasSearched ? (
                                <motion.div
                                    key="result"
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -12 }}
                                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                                >
                                    <HeroResultPanel
                                        triage={triage}
                                        refining={refining}
                                        doctors={doctors}
                                        doctorsLoading={doctorsLoading}
                                        advice={advice}
                                        adviceLoading={adviceLoading}
                                        adviceError={adviceError}
                                    />
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="showcase"
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -12 }}
                                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                                    // art only — the mouse falls through to the page,
                                    // unlike the result branch, which stays clickable
                                    className="pointer-events-none"
                                >
                                    <HeroShowcase />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </div>

                {/* Bottom fade into the content sections */}
                <div className="absolute bottom-0 left-0 w-full h-56 bg-gradient-to-t from-[#09090b] to-transparent z-10 pointer-events-none"></div>
            </section>

            {/* ===================== CONTENT SECTIONS ===================== */}
            <div className="relative z-10 bg-zinc-950 pt-8 pb-24 px-6 md:px-12 w-full">
                {/* Localized rose glow that follows the content column */}
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute left-1/2 top-40 -translate-x-1/2 w-[600px] max-w-[120vw] aspect-square rounded-full blur-[120px] opacity-60"
                    style={{ background: 'radial-gradient(circle, rgba(136,19,55,0.18), transparent 65%)' }}
                />

                <div className="relative">
                    <Reveal>
                        <SpecialityMenu onAskAI={focusSymptomSearch} />
                    </Reveal>

                    <Reveal>
                        <TopArticles />
                    </Reveal>

                    <Reveal>
                        <UserReviews />
                    </Reveal>

                    <Reveal>
                        <FAQ />
                    </Reveal>

                    <Footer />
                </div>
            </div>
        </motion.div>
    );
};

export default Home;

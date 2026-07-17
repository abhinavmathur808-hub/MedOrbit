import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useAnimationControls, useReducedMotion } from 'framer-motion';
import {
    Search,
    Zap,
    Lock,
    BadgeCheck,
    ArrowRight,
    Star,
    Calendar,
    Check,
    Video,
    Mic,
    PhoneOff,
    Pill,
    Stethoscope,
    FileText,
} from 'lucide-react';

// Passive background art for the hero's right column: a flat card deck of three
// MedOrbit flows, matching the geometry measured off takeuforward.org's live
// hero — three cards on one anchor, back cards scaled down, dimmed and peeking
// out above, no rotation and no 3D anywhere. Every ~5s the deck rotates: the
// front card is sent to the back and the card behind is promoted, remounting
// its scene so the typing/stagger beats replay. Home swaps the whole deck out
// for the live AI result once a visitor searches.

const EASE = [0.22, 1, 0.36, 1];

const SCENE_BODY_HEIGHT = 340; // fixed so every card shares one box

// Deck geometry, indexed by depth: 0 = front. scale/opacity are takeuforward's
// inline values verbatim; y is their measured centre offsets (−40/−65 on a 293px
// card) scaled to our card so the peek reads the same proportionally.
const ROLES = [
    { y: 0, scale: 0.95, opacity: 1, z: 30 },     // front
    { y: -56, scale: 0.9, opacity: 0.8, z: 20 },  // mid
    { y: -92, scale: 0.85, opacity: 0.6, z: 10 }, // back
];

// The deck only ever shows three cards. Any scene deeper than that waits just
// behind the back card at zero opacity and fades up as it's promoted, so the
// number of scenes can grow without stacking more visible layers.
const QUEUED_ROLE = { y: -112, scale: 0.82, opacity: 0, z: 0 };

const ROLE_SWAP = { type: 'tween', duration: 0.55, ease: EASE };

// Staggered lists. Kept at module scope so their identity is stable across the
// typewriter's re-renders, which would otherwise re-trigger the orchestration.
const LIST_STAGGER = { hidden: {}, show: { transition: { delayChildren: 2.3, staggerChildren: 0.16 } } };
const ROW_RISE = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', damping: 24, stiffness: 240 } },
};

const BROWSE_STAGGER = { hidden: {}, show: { transition: { delayChildren: 0.45, staggerChildren: 0.16 } } };

const MEDS_STAGGER = { hidden: {}, show: { transition: { delayChildren: 0.7, staggerChildren: 0.18 } } };
const MED_SLIDE = {
    hidden: { opacity: 0, x: -10 },
    show: { opacity: 1, x: 0, transition: { type: 'spring', damping: 24, stiffness: 260 } },
};

// Reduced-motion counterparts: same beats, no travel.
const LIST_STAGGER_REDUCED = { hidden: {}, show: { transition: { delayChildren: 0.2, staggerChildren: 0.08 } } };
const FADE_ONLY = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { duration: 0.3 } } };

// Types `text` out one character at a time; returns it whole under reduced motion.
// Only the count is stored, and only ever from inside the interval — the visible
// string is derived, so the effect never sets state synchronously to catch up.
const useTypewriter = (text, { speed = 55, startDelay = 350 } = {}) => {
    const reduce = useReducedMotion();
    const [count, setCount] = useState(0);

    useEffect(() => {
        if (reduce) return;
        let i = 0;
        let interval;
        const start = setTimeout(() => {
            interval = setInterval(() => {
                i += 1;
                setCount(i);
                if (i >= text.length) clearInterval(interval);
            }, speed);
        }, startDelay);
        return () => {
            clearTimeout(start);
            clearInterval(interval);
        };
    }, [text, speed, startDelay, reduce]);

    return reduce ? text : text.slice(0, count);
};

const Caret = () => (
    <motion.span
        aria-hidden="true"
        className="ml-[1px] -mb-[0.15em] inline-block h-[1.05em] w-[2px] bg-rose-400 align-middle"
        animate={{ opacity: [1, 1, 0, 0] }}
        transition={{ duration: 1, repeat: Infinity, times: [0, 0.5, 0.5, 1] }}
    />
);

// One beat of a scene. Scenes remount when their card is promoted, so these replay.
const Step = ({ children, delay = 0, className = '' }) => {
    const reduce = useReducedMotion();
    return (
        <motion.div
            className={className}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: reduce ? 0 : delay, ease: EASE }}
        >
            {children}
        </motion.div>
    );
};

const MockAvatar = ({ name, className = 'h-8 w-8 text-xs' }) => (
    <div
        className={`grid flex-shrink-0 place-items-center rounded-full bg-gradient-to-br from-rose-500 to-rose-800 font-bold text-white ${className}`}
    >
        {name.replace(/^Dr\.?\s*/, '').charAt(0)}
    </div>
);

const MockDoctorRow = ({ name, spec, fee }) => (
    <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
        <MockAvatar name={name} />
        <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1 truncate text-sm font-medium text-zinc-100">
                {name}
                <BadgeCheck className="h-3.5 w-3.5 flex-shrink-0 text-rose-400" />
            </p>
            <p className="truncate text-[11px] text-zinc-500">
                {spec} · ₹{fee}
            </p>
        </div>
        <span className="flex flex-shrink-0 items-center gap-1 text-xs font-semibold text-rose-400">
            Book <ArrowRight className="h-3 w-3" />
        </span>
    </div>
);

/* ─────────────────── Scene 1 — AI symptom triage ─────────────────── */

const TriageScene = () => {
    const reduce = useReducedMotion();
    const typed = useTypewriter('sharp headache for 3 days');

    return (
        <div className="flex h-full flex-col gap-3">
            <div className="flex items-center gap-2.5 rounded-xl border border-zinc-800 bg-zinc-950/60 px-3.5 py-3">
                <Search className="h-4 w-4 flex-shrink-0 text-zinc-600" />
                <span className="text-sm text-zinc-200">
                    {typed}
                    <Caret />
                </span>
            </div>

            <Step delay={1.85} className="flex items-center gap-1.5 text-[11px] font-semibold text-rose-400">
                <Zap className="h-3.5 w-3.5" />
                Instant match — on your device
            </Step>

            <Step delay={2.05}>
                <p className="text-sm text-zinc-300">
                    Your symptoms point to a{' '}
                    <strong className="font-semibold text-rose-400">Neurologist</strong>.
                </p>
            </Step>

            <motion.div
                className="mt-auto flex flex-col gap-2"
                variants={reduce ? LIST_STAGGER_REDUCED : LIST_STAGGER}
                initial="hidden"
                animate="show"
            >
                <motion.div variants={reduce ? FADE_ONLY : ROW_RISE}>
                    <MockDoctorRow name="Dr. Anaya Rao" spec="Neurologist" fee="500" />
                </motion.div>
                <motion.div variants={reduce ? FADE_ONLY : ROW_RISE}>
                    <MockDoctorRow name="Dr. Imran Qureshi" spec="Neurologist" fee="650" />
                </motion.div>
                <motion.div
                    variants={reduce ? FADE_ONLY : ROW_RISE}
                    className="flex items-center gap-1.5 pt-1 text-[10px] text-zinc-600"
                >
                    <Lock className="h-3 w-3" />
                    That text never leaves your browser.
                </motion.div>
            </motion.div>
        </div>
    );
};

/* ─────────────────── Scene 2 — Browse doctors ─────────────────── */

const SPECIALITIES = ['General', 'Cardiologist', 'Neurologist', 'Dermatologist'];
const ACTIVE_SPECIALITY = 2;

const BROWSE_DOCTORS = [
    { name: 'Dr. Anaya Rao', spec: 'Neurologist', fee: '500', exp: '12 yrs', rating: '4.9' },
    { name: 'Dr. Imran Qureshi', spec: 'Neurologist', fee: '650', exp: '9 yrs', rating: '4.8' },
];

const BrowseScene = () => {
    const reduce = useReducedMotion();

    return (
        <div className="flex h-full flex-col gap-3">
            <Step delay={0.1} className="flex items-center justify-between">
                <p className="text-sm font-bold text-white">Find doctors</p>
                <span className="text-[10px] text-zinc-500">12 available</span>
            </Step>

            <Step delay={0.25} className="flex flex-wrap gap-1.5">
                {SPECIALITIES.map((spec, i) => (
                    <span
                        key={spec}
                        className={`rounded-full border px-2.5 py-1 text-[10px] font-medium ${
                            i === ACTIVE_SPECIALITY
                                ? 'border-rose-500/60 bg-rose-600/20 text-rose-300'
                                : 'border-zinc-800 bg-zinc-950/60 text-zinc-500'
                        }`}
                    >
                        {spec}
                    </span>
                ))}
            </Step>

            <motion.div
                className="mt-auto flex flex-col gap-2"
                variants={reduce ? LIST_STAGGER_REDUCED : BROWSE_STAGGER}
                initial="hidden"
                animate="show"
            >
                {BROWSE_DOCTORS.map((doc) => (
                    <motion.div
                        key={doc.name}
                        variants={reduce ? FADE_ONLY : ROW_RISE}
                        className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3"
                    >
                        <MockAvatar name={doc.name} className="h-10 w-10 text-sm" />
                        <div className="min-w-0 flex-1">
                            <p className="flex items-center gap-1 truncate text-sm font-medium text-zinc-100">
                                {doc.name}
                                <BadgeCheck className="h-3.5 w-3.5 flex-shrink-0 text-rose-400" />
                            </p>
                            <p className="flex items-center gap-1.5 truncate text-[11px] text-zinc-500">
                                <Star className="h-3 w-3 flex-shrink-0 fill-amber-400 text-amber-400" />
                                {doc.rating} · {doc.exp} · ₹{doc.fee}
                            </p>
                        </div>
                        <span className="flex-shrink-0 rounded-lg bg-rose-600/90 px-2.5 py-1.5 text-[10px] font-medium text-white">
                            Book
                        </span>
                    </motion.div>
                ))}
            </motion.div>
        </div>
    );
};

/* ─────────────────── Scene 3 — Book an appointment ─────────────────── */

const SLOTS = ['09:00', '10:30', '11:15', '02:00'];
const PICKED_SLOT = 1;

// Centre of `el` in `root`'s coordinate space, for pointing the ghost cursor at
// it. Walks the offsetParent chain instead of reading offsetLeft/offsetTop once:
// the chain stops at any *transformed* ancestor, not just a positioned one, and
// framer-motion transforms the Step wrappers the scenes are built from — so a
// single hop silently measures against the wrong origin. Offsets ignore
// transforms themselves, which is what we want: the settled layout position,
// unaffected by the deck's bend or a Step's in-flight entrance.
const centreWithin = (el, root) => {
    let x = el.offsetWidth / 2;
    let y = el.offsetHeight / 2;
    for (let node = el; node && node !== root; node = node.offsetParent) {
        x += node.offsetLeft;
        y += node.offsetTop;
    }
    return { x, y };
};

const BookScene = () => {
    const reduce = useReducedMotion();
    // 0: browsing · 1: cursor over the slot · 2: slot picked · 3: booked
    const [step, setStep] = useState(reduce ? 3 : 0);
    const ghost = useAnimationControls();
    const rootRef = useRef(null);
    const slotRef = useRef(null);
    const ctaRef = useRef(null);

    // One sequence drives both the ghost cursor and the UI state, so the hover and
    // the click always land on the element the cursor is actually over — rather
    // than two independent timers that only agree while the tuning holds.
    useEffect(() => {
        if (reduce) return;

        const root = rootRef.current;
        const slot = centreWithin(slotRef.current, root);
        const cta = centreWithin(ctaRef.current, root);
        const press = { scale: [1, 0.7, 1], transition: { duration: 0.24 } };

        let cancelled = false;
        const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

        (async () => {
            await ghost.start({ x: slot.x, y: slot.y, opacity: 1, transition: { type: 'spring', damping: 26, stiffness: 120 } });
            if (cancelled) return;
            setStep(1);
            await pause(320);
            if (cancelled) return;

            await ghost.start(press);
            if (cancelled) return;
            setStep(2);
            await pause(420);
            if (cancelled) return;

            await ghost.start({ x: cta.x, y: cta.y, transition: { type: 'spring', damping: 26, stiffness: 150 } });
            if (cancelled) return;
            await pause(200);
            await ghost.start(press);
            if (cancelled) return;
            setStep(3);
            await ghost.start({ opacity: 0, transition: { duration: 0.35 } });
        })();

        return () => {
            cancelled = true;
        };
    }, [ghost, reduce]);

    return (
        <div ref={rootRef} className="relative flex h-full flex-col gap-3">
            {/* Ghost cursor — its x/y are measured against this scene root, so the
                root must stay the ghost's nearest positioned ancestor. */}
            {!reduce && (
                <motion.div className="absolute left-0 top-0 z-20" initial={{ x: -30, y: 300, opacity: 0 }} animate={ghost}>
                    <span className="block h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/60 shadow-lg shadow-black/40 ring-2 ring-white/25" />
                </motion.div>
            )}

            <Step delay={0.1} className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-950/60 p-3">
                <MockAvatar name="Dr. Anaya Rao" className="h-11 w-11 text-base" />
                <div className="min-w-0">
                    <p className="flex items-center gap-1 text-sm font-semibold text-zinc-100">
                        Dr. Anaya Rao
                        <BadgeCheck className="h-3.5 w-3.5 text-rose-400" />
                    </p>
                    <p className="text-[11px] text-zinc-500">Neurologist · 12 yrs · ₹500</p>
                </div>
            </Step>

            <Step delay={0.25} className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-500">
                <Calendar className="h-3.5 w-3.5 text-rose-400/70" />
                Available today
            </Step>

            <Step delay={0.35} className="grid grid-cols-4 gap-2">
                {SLOTS.map((slot, i) => {
                    const isTarget = i === PICKED_SLOT;
                    const picked = step >= 2 && isTarget;
                    const hovered = step === 1 && isTarget; // ghost cursor is resting on it
                    return (
                        <motion.div
                            key={slot}
                            ref={isTarget ? slotRef : null}
                            animate={picked ? { scale: [1, 1.09, 1] } : { scale: 1 }}
                            transition={{ duration: 0.4, ease: EASE }}
                            className={`rounded-lg border py-2 text-center text-xs font-medium transition-colors duration-200 ${
                                picked
                                    ? 'border-rose-500/60 bg-rose-600/20 text-rose-300'
                                    : hovered
                                        ? 'border-zinc-700 bg-zinc-800/80 text-zinc-300'
                                        : 'border-zinc-800 bg-zinc-950/60 text-zinc-500'
                            }`}
                        >
                            {slot}
                        </motion.div>
                    );
                })}
            </Step>

            <div className="mt-auto">
                <AnimatePresence mode="wait">
                    {step < 3 ? (
                        <motion.div
                            key="cta"
                            ref={ctaRef}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            // exit carries its own transition — the entry delay would
                            // otherwise stall the hand-off to the confirmation
                            exit={{ opacity: 0, y: -6, transition: { duration: 0.2 } }}
                            transition={{ duration: 0.25, delay: reduce ? 0 : 0.5, ease: EASE }}
                            className="rounded-xl bg-rose-600 py-3 text-center text-sm font-medium text-white shadow-lg shadow-rose-900/40"
                        >
                            Confirm &amp; pay ₹500
                        </motion.div>
                    ) : (
                        <motion.div
                            key="done"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, ease: EASE }}
                            className="flex items-center gap-3 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3 py-2.5"
                        >
                            <motion.span
                                initial={reduce ? false : { scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 16 }}
                                className="grid h-7 w-7 flex-shrink-0 place-items-center rounded-full bg-emerald-500"
                            >
                                <Check className="h-4 w-4 text-white" strokeWidth={3} />
                            </motion.span>
                            <div className="min-w-0">
                                <p className="text-sm font-semibold text-emerald-300">Appointment confirmed</p>
                                <p className="truncate text-[11px] text-emerald-400/60">10:30 AM today · receipt emailed</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

/* ─────────────────── Scene 4 — Video consultation ─────────────────── */

const WAVE_BARS = [0.45, 1, 0.6, 0.9, 0.5];

const ControlBtn = ({ icon: Icon, danger = false }) => (
    <div
        className={`grid h-9 w-9 place-items-center rounded-full ${
            danger ? 'bg-rose-600 text-white' : 'border border-zinc-800 bg-zinc-900 text-zinc-400'
        }`}
    >
        <Icon className="h-4 w-4" />
    </div>
);

const VideoScene = () => {
    const reduce = useReducedMotion();
    const [secondsLeft, setSecondsLeft] = useState(34 * 60 + 58);

    useEffect(() => {
        if (reduce) return;
        const id = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
        return () => clearInterval(id);
    }, [reduce]);

    const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
    const ss = String(secondsLeft % 60).padStart(2, '0');

    return (
        <div className="flex h-full flex-col gap-3">
            <Step
                delay={0.1}
                className="relative flex-1 overflow-hidden rounded-xl border border-zinc-800 bg-gradient-to-br from-rose-950/60 via-zinc-900 to-zinc-950"
            >
                <div
                    aria-hidden="true"
                    className="absolute inset-0"
                    style={{ background: 'radial-gradient(circle at 50% 38%, rgba(225,29,72,0.18), transparent 62%)' }}
                />

                <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between p-3">
                    <span className="flex items-center gap-1.5 rounded-full bg-black/50 px-2 py-1 text-[10px] font-semibold text-white backdrop-blur-sm">
                        <motion.span
                            className="h-1.5 w-1.5 rounded-full bg-rose-500"
                            animate={reduce ? {} : { opacity: [1, 0.25, 1] }}
                            transition={{ duration: 1.6, repeat: Infinity }}
                        />
                        LIVE
                    </span>
                    <span className="rounded-full bg-black/50 px-2 py-1 font-mono text-[10px] text-zinc-300 backdrop-blur-sm">
                        {mm}:{ss} left
                    </span>
                </div>

                <div className="flex h-full flex-col items-center justify-center gap-3">
                    <MockAvatar name="Dr. Anaya Rao" className="h-16 w-16 text-xl" />
                    {/* Oscillating levels: scaleY off a bottom origin, so each bar
                        grows upward without laying out a new height every frame. */}
                    <div className="flex h-4 items-end gap-[3px]">
                        {WAVE_BARS.map((peak, i) => (
                            <motion.span
                                key={i}
                                className="h-4 w-[3px] origin-bottom rounded-full bg-rose-400/70"
                                style={{ scaleY: 0.25 }}
                                animate={reduce ? {} : { scaleY: [0.25, peak] }}
                                transition={{
                                    duration: 0.5 + i * 0.09,
                                    repeat: Infinity,
                                    repeatType: 'mirror',
                                    ease: 'easeInOut',
                                    delay: i * 0.08,
                                }}
                            />
                        ))}
                    </div>
                </div>

                <span className="absolute bottom-3 left-3 rounded-md bg-black/50 px-2 py-1 text-[10px] font-medium text-white backdrop-blur-sm">
                    Dr. Anaya Rao
                </span>
                <div className="absolute bottom-3 right-3 grid h-14 w-20 place-items-center rounded-lg border border-white/15 bg-zinc-900/90 text-[10px] text-zinc-500 backdrop-blur-sm">
                    You
                </div>
            </Step>

            <Step delay={0.3} className="flex items-center justify-center gap-2.5">
                <ControlBtn icon={Mic} />
                <ControlBtn icon={Video} />
                <ControlBtn icon={PhoneOff} danger />
            </Step>
        </div>
    );
};

/* ─────────────────── Scene 3 — Prescription & records ─────────────────── */

const MEDS = [
    { name: 'Sumatriptan 50mg', detail: '1 tablet · at onset' },
    { name: 'Propranolol 20mg', detail: '1 tablet · twice daily' },
    { name: 'Riboflavin 400mg', detail: '1 capsule · once daily' },
];

const RxScene = () => {
    const reduce = useReducedMotion();

    return (
        <div className="flex h-full flex-col gap-3">
            <Step delay={0.1} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="grid h-7 w-7 place-items-center rounded-lg bg-rose-600/15">
                        <Stethoscope className="h-3.5 w-3.5 text-rose-500" />
                    </div>
                    <div>
                        <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-rose-500/80">MedOrbit</p>
                        <p className="text-sm font-bold text-white">Prescription</p>
                    </div>
                </div>
                <span className="font-mono text-[10px] text-zinc-600">#8F2A41C7</span>
            </Step>

            <Step delay={0.3}>
                <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                    <FileText className="h-3 w-3 text-rose-500/60" />
                    Diagnosis
                </p>
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-xs text-zinc-200">
                    Episodic migraine without aura
                </div>
            </Step>

            <div>
                <Step delay={0.5}>
                    <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                        <Pill className="h-3 w-3 text-rose-400/60" />
                        Medicines
                    </p>
                </Step>
                <motion.div
                    className="overflow-hidden rounded-xl border border-white/[0.06]"
                    variants={reduce ? LIST_STAGGER_REDUCED : MEDS_STAGGER}
                    initial="hidden"
                    animate="show"
                >
                    {MEDS.map((med, i) => (
                        <motion.div
                            key={med.name}
                            variants={reduce ? FADE_ONLY : MED_SLIDE}
                            className={i > 0 ? 'border-t border-white/[0.04]' : ''}
                        >
                            <div className="flex items-center justify-between gap-2 bg-white/[0.02] px-3 py-2">
                                <span className="truncate text-xs font-medium text-white">{med.name}</span>
                                <span className="flex-shrink-0 text-[10px] text-zinc-500">{med.detail}</span>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            </div>

            {/* Seal — lands like a stamp once the last medicine has written in */}
            <motion.div
                className="mt-auto flex items-center gap-1.5 self-start rounded-md border border-rose-500/25 bg-rose-950/20 px-2 py-1 text-[10px] text-zinc-500"
                initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 1.5, rotate: -8 }}
                animate={reduce ? { opacity: 1 } : { opacity: 1, scale: 1, rotate: -3 }}
                transition={
                    reduce
                        ? { duration: 0.3, delay: 0.5 }
                        : { type: 'spring', damping: 11, stiffness: 520, delay: 1.55 }
                }
            >
                <BadgeCheck className="h-3 w-3 flex-shrink-0 text-rose-400/70" />
                Digitally issued by Dr. Anaya Rao
            </motion.div>
        </div>
    );
};

/* ─────────────────── The deck ─────────────────── */

// Durations leave ~1s of rest after each scene's last beat (triage's stagger
// ends ≈3.2s in, the rx stamp ≈2s) before the deck rotates.
// The patient journey, in order: describe symptoms, browse the matched
// specialists, book one, meet them, get the prescription. Durations leave ~1s of
// rest after each scene's last beat (booking's cursor sequence runs longest,
// ≈3.4s) before the deck rotates.
const SCENES = [
    { id: 'triage', url: 'medorbit.live', duration: 4200, Scene: TriageScene },
    { id: 'browse', url: 'medorbit.live/doctors', duration: 3400, Scene: BrowseScene },
    { id: 'book', url: 'medorbit.live/book-appointment', duration: 4600, Scene: BookScene },
    { id: 'consult', url: 'medorbit.live/room/8f2a41', duration: 3600, Scene: VideoScene },
    { id: 'rx', url: 'medorbit.live/appointments', duration: 4000, Scene: RxScene },
];

const HeroShowcase = () => {
    const reduce = useReducedMotion();
    // Counts total advances rather than wrapping, so each card can tell how many
    // times it has held the front — see the scene key below.
    const [step, setStep] = useState(0);
    const active = step % SCENES.length;

    // Advance on a rAF clock rather than a timer: rAF suspends while the tab is
    // hidden, so the deck doesn't rotate unseen and framer's own frameloop — also
    // rAF-driven — stays in step. Under reduced motion the deck holds still.
    useEffect(() => {
        if (reduce) return;

        const { duration } = SCENES[active];
        let raf;
        let elapsed = 0;
        let last = performance.now();

        const tick = (now) => {
            // Clamp the delta: rAF is suspended while the tab is hidden, so an
            // unclamped one would return from a background tab with a multi-second
            // jump and skip a rotation the moment the visitor looks back at it.
            elapsed += Math.min(now - last, 100);
            last = now;
            if (elapsed >= duration) {
                setStep((s) => s + 1);
                return;
            }
            raf = requestAnimationFrame(tick);
        };

        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [step, active, reduce]);

    return (
        // Passive background art: mock data throughout, so it's hidden from
        // assistive tech and the mouse passes straight through to the page.
        // pt gives the back cards headroom to peek above the front one.
        <div
            aria-hidden="true"
            className="pointer-events-none relative mx-auto w-full max-w-[520px] select-none pt-24 lg:mx-0 lg:ml-auto"
        >
            {/* The bend gets its own element: framer-motion writes transform on
                the cards it animates, and would overwrite a tilt set on them.
                It is written as one arbitrary transform rather than Tailwind's
                rotate-* utilities so it stays byte-identical to the reference —
                and note perspective is a transform *function* here, not the
                parent's perspective property, which is how theirs is authored.
                transform-gpu is deliberately absent: it also writes `transform`
                and would fight this declaration.
                RIGHT EDGE COMES FORWARD, left recedes — that is what negative
                rotate-y does, and it is what takeuforward actually ships.
                Values decomposed from their live .hero-image-container matrix3d.

                Scale steps with the viewport instead of sitting at one value, so
                the deck stays proportionate on a 1024 laptop and still fills a
                wide desktop. origin-left grows it rightwards into the page's
                margin, so it never reaches back toward the search console. */}
            <div
                className="relative origin-left lg:scale-[1.25] lg:[transform-style:preserve-3d] lg:[transform:perspective(1000px)_rotateX(10deg)_rotateY(-5deg)_rotateZ(6deg)] xl:scale-[1.45] 2xl:scale-[1.6]"
                style={{ height: SCENE_BODY_HEIGHT + 81 }}
            >
                {SCENES.map(({ id, url, Scene }, idx) => {
                    // Deck rotation: 0 = front, 1 = mid, 2 = back, deeper = queued
                    // out of sight. Each tick the front card dives to the bottom of
                    // the deck and everything else steps forward one place.
                    const depth = (idx - active + SCENES.length) % SCENES.length;
                    const role = ROLES[depth] ?? QUEUED_ROLE;

                    // How many times this card has held the front. It ticks over on
                    // promotion and at no other moment, so keying the scene to it
                    // replays the beats exactly once per turn — keying to `depth`
                    // instead would also remount on demotion, restarting the typing
                    // in full view at the mid position.
                    const turnsHeld = Math.floor((step - idx + SCENES.length) / SCENES.length);

                    return (
                        <motion.div
                            key={id}
                            className="absolute inset-0"
                            style={{ zIndex: role.z, willChange: 'transform, opacity' }}
                            initial={false}
                            animate={{ y: role.y, scale: role.scale, opacity: role.opacity }}
                            transition={ROLE_SWAP}
                        >
                            <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-zinc-700 bg-zinc-900 shadow-2xl">
                                {/* Browser chrome — reads the card as the product, not a widget */}
                                <div className="flex items-center gap-2 border-b border-white/[0.06] px-3 py-2.5">
                                    <span className="flex flex-shrink-0 gap-1.5">
                                        <span className="h-2 w-2 rounded-full bg-zinc-700" />
                                        <span className="h-2 w-2 rounded-full bg-zinc-700" />
                                        <span className="h-2 w-2 rounded-full bg-zinc-700" />
                                    </span>
                                    <div className="ml-1 min-w-0 flex-1 rounded-md bg-zinc-950/60 px-2 py-1">
                                        <span className="block truncate text-center font-mono text-[10px] text-zinc-500">
                                            {url}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex-1 p-5">
                                    <Scene key={turnsHeld} />
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
};

export default HeroShowcase;

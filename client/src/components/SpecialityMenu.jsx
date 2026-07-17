import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Heart, Brain, BrainCircuit, Fingerprint, Stethoscope, Bone, Sparkles, ArrowRight } from 'lucide-react';

// Each specialty carries its own tint so the row is scannable at a glance. The
// classes are written out in full rather than composed from the colour name —
// Tailwind only ships classes it can find as literal strings in the source.
const SPECIALITIES = [
    {
        speciality: 'Cardiologist',
        plural: 'Cardiologists',
        Icon: Heart,
        iconClass: 'text-rose-400',
        borderClass: 'border-rose-500/50',
        glow: 'rgba(244,63,94,0.30)',
    },
    {
        speciality: 'Neurologist',
        plural: 'Neurologists',
        Icon: Brain,
        iconClass: 'text-sky-400',
        borderClass: 'border-sky-500/50',
        glow: 'rgba(56,189,248,0.30)',
    },
    {
        speciality: 'Psychiatrist',
        plural: 'Psychiatrists',
        Icon: BrainCircuit,
        iconClass: 'text-violet-400',
        borderClass: 'border-violet-500/50',
        glow: 'rgba(167,139,250,0.30)',
    },
    {
        speciality: 'Dermatologist',
        plural: 'Dermatologists',
        Icon: Fingerprint,
        iconClass: 'text-amber-400',
        borderClass: 'border-amber-500/50',
        glow: 'rgba(251,191,36,0.30)',
    },
    {
        speciality: 'General Physician',
        plural: 'General Physicians',
        Icon: Stethoscope,
        iconClass: 'text-emerald-400',
        borderClass: 'border-emerald-500/50',
        glow: 'rgba(52,211,153,0.30)',
    },
    {
        speciality: 'Orthopedic',
        plural: 'Orthopedics',
        Icon: Bone,
        iconClass: 'text-orange-400',
        borderClass: 'border-orange-500/50',
        glow: 'rgba(251,146,60,0.30)',
    },
];

const IDLE_HEADING = 'Specialists';

// Steps the rendered text one character toward `target`: backspaces while the
// text isn't a prefix of the target, then types forward. The interval clears
// itself once settled, so an idle row costs nothing. Under reduced motion the
// target is returned whole — derived rather than set, so the effect never has to
// setState synchronously to catch up.
const useTypewriter = (target, speed = 45) => {
    const reduce = useReducedMotion();
    const [text, setText] = useState(target);
    const textRef = useRef(target);

    useEffect(() => {
        if (reduce) return;
        const id = setInterval(() => {
            const cur = textRef.current;
            if (cur === target) {
                clearInterval(id);
                return;
            }
            const next = target.startsWith(cur) ? target.slice(0, cur.length + 1) : cur.slice(0, -1);
            textRef.current = next;
            setText(next);
        }, speed);
        return () => clearInterval(id);
    }, [target, speed, reduce]);

    return reduce ? target : text;
};

const TILE = {
    rest: { scale: 1, y: 0 },
    hover: { scale: 1.05, y: -6, transition: { type: 'spring', damping: 18, stiffness: 320 } },
};
const TILE_REDUCED = { rest: {}, hover: {} };

const SpecialityMenu = ({ onAskAI }) => {
    const navigate = useNavigate();
    const reduce = useReducedMotion();

    // One hover index drives the tile art and the heading, so they can never
    // disagree. Focus counts as hover, which is what makes the heading follow a
    // keyboard user through the row too.
    const [active, setActive] = useState(null);

    const hovered = active !== null ? SPECIALITIES[active] : null;
    const typed = useTypewriter(hovered ? hovered.plural : IDLE_HEADING);
    const settled = typed === (hovered ? hovered.plural : IDLE_HEADING);

    const tileVariants = reduce ? TILE_REDUCED : TILE;

    return (
        <div className="max-w-6xl mx-auto w-full py-24 px-6 md:px-12">
            {/* Heading and the catch-all link share a row: the link sits at the
                end of the hierarchy rather than competing with the tiles for the
                centre of the section. */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-12">
                <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-white">
                    Connect to{' '}
                    <span className="text-rose-500">
                        {typed}
                        {/* Caret only exists while the heading is actually being
                            driven — a blinking bar over idle copy reads as a bug. */}
                        {!reduce && (hovered || !settled) && (
                            <motion.span
                                aria-hidden="true"
                                className="ml-[2px] -mb-[0.12em] inline-block h-[0.95em] w-[2px] bg-rose-500 align-middle"
                                animate={{ opacity: [1, 1, 0, 0] }}
                                transition={{ duration: 1, repeat: Infinity, times: [0, 0.5, 0.5, 1] }}
                            />
                        )}
                    </span>
                </h2>

                <button
                    onClick={() => navigate('/doctors')}
                    className="group/all inline-flex flex-shrink-0 items-center gap-1.5 self-start rounded-full border border-zinc-800 bg-zinc-900/40 px-4 py-2 text-sm font-medium text-zinc-400 backdrop-blur-md transition-colors duration-200 hover:border-rose-500/40 hover:text-white sm:self-auto cursor-pointer"
                >
                    View all specialities
                    <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover/all:translate-x-0.5" />
                </button>
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-9 sm:grid-cols-4 lg:grid-cols-7">
                {SPECIALITIES.map((item, i) => {
                    const { speciality, Icon, iconClass, borderClass, glow } = item;
                    const isActive = active === i;
                    return (
                        <motion.button
                            key={speciality}
                            onClick={() => navigate('/doctors', { state: { speciality } })}
                            onMouseEnter={() => setActive(i)}
                            onMouseLeave={() => setActive(null)}
                            onFocus={() => setActive(i)}
                            onBlur={() => setActive(null)}
                            variants={tileVariants}
                            initial="rest"
                            animate={isActive ? 'hover' : 'rest'}
                            className="flex cursor-pointer flex-col items-center gap-3 rounded-2xl p-2 outline-none"
                        >
                            {/* The top-lit gradient fakes a light source above the
                                row, so the circle reads as a volume rather than a
                                flat hole punched in the page. */}
                            <motion.span
                                className={`grid h-20 w-20 place-items-center rounded-full border bg-gradient-to-b from-zinc-800/50 to-zinc-900/10 backdrop-blur-md transition-colors duration-300 ${
                                    isActive ? borderClass : 'border-zinc-700/50'
                                }`}
                                animate={{ boxShadow: isActive ? `0 0 34px -4px ${glow}` : '0 0 0px 0px rgba(0,0,0,0)' }}
                                transition={{ duration: 0.3 }}
                            >
                                <Icon
                                    className={`h-8 w-8 transition-colors duration-300 ${
                                        isActive ? iconClass : 'text-zinc-400'
                                    }`}
                                    strokeWidth={1.5}
                                />
                            </motion.span>
                            <span
                                className={`text-center text-sm font-medium transition-colors duration-200 ${
                                    isActive ? 'text-white' : 'text-zinc-500'
                                }`}
                            >
                                {speciality}
                            </span>
                        </motion.button>
                    );
                })}

                {/* Closes the loop: anyone who can't self-select a specialty gets
                    handed back to the triage search instead of a dead end. */}
                <motion.button
                    onClick={onAskAI}
                    onMouseEnter={() => setActive(null)}
                    variants={tileVariants}
                    initial="rest"
                    animate="rest"
                    whileHover="hover"
                    whileFocus="hover"
                    className="flex cursor-pointer flex-col items-center gap-3 rounded-2xl p-2 outline-none group/ai"
                >
                    <motion.span
                        className="grid h-20 w-20 place-items-center rounded-full border border-dashed border-rose-900/50 bg-gradient-to-b from-rose-950/30 to-transparent backdrop-blur-md transition-colors duration-300 group-hover/ai:border-rose-500/70"
                        variants={{
                            rest: { boxShadow: '0 0 0px 0px rgba(0,0,0,0)' },
                            hover: { boxShadow: '0 0 34px -4px rgba(225,29,72,0.40)' },
                        }}
                        transition={{ duration: 0.3 }}
                    >
                        {/* Breathes on its own clock so the tile stays alive at
                            rest — the one thing on the row that asks to be used.
                            Its explicit `animate` also detaches it from the
                            parent's rest/hover variants, which is what keeps the
                            breath from being cancelled on hover. */}
                        <motion.div
                            animate={reduce ? {} : { opacity: [0.6, 1, 0.6], scale: [0.95, 1.05, 0.95] }}
                            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                        >
                            <Sparkles className="h-8 w-8 text-rose-400/70 transition-colors duration-300 group-hover/ai:text-rose-400" strokeWidth={1.5} />
                        </motion.div>
                    </motion.span>
                    <span className="text-center text-sm font-medium text-zinc-500 transition-colors duration-200 group-hover/ai:text-white">
                        Not sure?
                    </span>
                </motion.button>
            </div>
        </div>
    );
};

export default SpecialityMenu;

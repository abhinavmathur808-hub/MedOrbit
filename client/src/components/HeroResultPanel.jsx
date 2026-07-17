import { motion } from 'framer-motion';
import { useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { Zap, Lock, Loader2, BadgeCheck, ArrowRight, Sparkles } from 'lucide-react';

// The live half of the hero's right column. HeroShowcase loops product demos
// there until a visitor searches; from then on this panel holds the real
// result — on-device specialty match, its doctors, and Gemini's guidance.
//
// props mirror Home's search state:
//   triage         — { top: { specialty }, confidence, … } or null while matching
//   refining       — an instant keyword match is being upgraded on-device
//   doctors        — specialists for the matched specialty
//   advice*        — tier-2 Gemini guidance (logged-in only)
const HeroResultPanel = ({
    triage,
    refining,
    doctors,
    doctorsLoading,
    advice,
    adviceLoading,
    adviceError,
}) => {
    const { user } = useSelector((state) => state.auth);
    const navigate = useNavigate();

    const matchedSpecialty = triage?.top?.specialty;
    const lowConfidence = triage?.confidence === 'low';

    return (
        <div className="relative mx-auto w-full max-w-[520px] lg:mx-0 lg:ml-auto">
            <div
                aria-hidden="true"
                className="absolute -inset-[1.5px] rounded-2xl bg-gradient-to-r from-rose-600/40 via-rose-400/25 to-rose-600/40 blur-[6px]"
            />

            <div
                className="relative overflow-hidden rounded-2xl border border-rose-500/20"
                style={{
                    background: 'rgba(9, 9, 11, 0.72)',
                    boxShadow: '0 24px 70px -24px rgba(225,29,72,0.4), 0 8px 32px rgba(0,0,0,0.6)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                }}
            >
                <div className="flex items-center gap-1.5 border-b border-white/[0.06] px-5 py-3 text-xs font-semibold text-rose-400">
                    <Zap className="h-3.5 w-3.5" />
                    Instant match — on your device
                </div>

                <div className="max-h-[420px] min-h-[340px] overflow-y-auto p-5 text-left">

                    {/* On-device specialty match */}
                    {!triage ? (
                        <div className="flex items-center gap-2 text-sm text-zinc-400">
                            <Loader2 className="h-4 w-4 animate-spin text-rose-400" />
                            Analyzing your symptoms…
                        </div>
                    ) : lowConfidence ? (
                        <p className="text-sm text-zinc-300">
                            I couldn't pin that down confidently — starting you with a{' '}
                            <strong className="font-semibold text-rose-400">General Physician</strong> is a safe bet.
                            Add a little more detail for a sharper match.
                        </p>
                    ) : (
                        <p className="text-sm text-zinc-300">
                            Your symptoms point to a{' '}
                            <strong className="font-semibold text-rose-400">{matchedSpecialty}</strong>
                            {triage.confidence === 'moderate' ? ' (possible match)' : ''}.
                            {refining && (
                                <span className="ml-1 inline-flex items-center gap-1 text-zinc-500">
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                    refining…
                                </span>
                            )}
                        </p>
                    )}

                    {/* Doctors for the matched specialty */}
                    {doctorsLoading && (
                        <div className="mt-3 flex items-center gap-2 text-xs text-zinc-500">
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            Finding available specialists…
                        </div>
                    )}

                    {!doctorsLoading && doctors.length > 0 && (
                        <div className="mt-3 flex flex-col gap-2">
                            {doctors.map((doc) => (
                                <motion.div
                                    key={doc._id}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                                >
                                    <Link
                                        to={`/book-appointment/${doc._id}`}
                                        className="group flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 transition-all hover:border-rose-500/40 hover:bg-white/[0.06]"
                                    >
                                        <div className="grid h-8 w-8 flex-shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-rose-500 to-rose-800 text-xs font-bold text-white">
                                            {(doc.userId?.name || 'D').charAt(0).toUpperCase()}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <span className="flex items-center gap-1 truncate text-sm font-medium text-zinc-100">
                                                {doc.userId?.name || 'Doctor'}
                                                {doc.userId?.isVerified && (
                                                    <BadgeCheck className="h-3.5 w-3.5 flex-shrink-0 text-rose-400" />
                                                )}
                                            </span>
                                            <span className="truncate text-[11px] text-zinc-500">
                                                {doc.specialization || matchedSpecialty} · ₹{doc.fees}
                                            </span>
                                        </div>
                                        <span className="flex flex-shrink-0 items-center gap-0.5 text-xs font-semibold text-rose-400 transition-all group-hover:gap-1.5">
                                            Book <ArrowRight className="h-3 w-3" />
                                        </span>
                                    </Link>
                                </motion.div>
                            ))}
                        </div>
                    )}

                    {!doctorsLoading && triage && doctors.length === 0 && (
                        <p className="mt-3 text-xs text-zinc-500">No {matchedSpecialty} available right now.</p>
                    )}

                    {triage && !lowConfidence && (
                        <button
                            onClick={() => navigate('/doctors', { state: { speciality: matchedSpecialty } })}
                            className="mt-3 inline-flex cursor-pointer items-center gap-1 text-xs text-zinc-400 transition-colors hover:text-rose-400"
                        >
                            Browse all {matchedSpecialty}s
                            <ArrowRight className="h-3 w-3" />
                        </button>
                    )}

                    {/* Tier 2 — full Gemini guidance */}
                    {(adviceLoading || advice || adviceError || !user) && (
                        <div className="mt-4 border-t border-white/10 pt-4">
                            <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-rose-300">
                                <Sparkles className="h-3.5 w-3.5" />
                                AI health guidance
                            </div>

                            {!user ? (
                                <p className="text-sm text-zinc-400">
                                    <Link to="/login" className="font-medium text-rose-400 hover:underline">
                                        Log in
                                    </Link>{' '}
                                    for detailed AI guidance. The instant match above works without an account.
                                </p>
                            ) : adviceLoading ? (
                                <div className="flex items-center gap-2 text-sm text-zinc-400">
                                    <Loader2 className="h-4 w-4 animate-spin text-rose-300" />
                                    Generating detailed guidance…
                                </div>
                            ) : adviceError ? (
                                <p className="text-sm text-zinc-500">{adviceError}</p>
                            ) : (
                                <div className="text-sm leading-relaxed text-zinc-300">
                                    <ReactMarkdown
                                        components={{
                                            strong: ({ children }) => (
                                                <strong className="font-semibold text-rose-400">{children}</strong>
                                            ),
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

                    <div className="mt-4 flex items-center gap-1 text-[10px] text-zinc-600">
                        <Lock className="h-3 w-3" />
                        Instant match runs locally — that text never leaves your browser. Not a medical diagnosis.
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HeroResultPanel;

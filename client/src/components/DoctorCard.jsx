import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { optimizeCloudinaryUrl } from '../utils/cloudinaryUrl';
import {
    Clock,
    IndianRupee,
    MapPin,
    Calendar,
    CheckCircle,
    Star,
} from 'lucide-react';

const DoctorCard = ({ doctor }) => {
    const name = doctor.userId?.name || 'Doctor';
    const photo = doctor.userId?.photo || '';
    const specialization = doctor.specialization || 'General Practice';
    const experience = doctor.experience || 0;
    const fees = doctor.fees || 0;
    const hospitalAddress = doctor.hospitalAddress || '';
    const isVerified = doctor.userId?.isVerified || false;
    const averageRating = doctor.averageRating || 0;
    const totalRatings = doctor.totalRatings || 0;
    const qualifications = doctor.qualifications || '';

    const tags = Array.isArray(qualifications)
        ? qualifications.filter(Boolean).slice(0, 3)
        : qualifications
            ? qualifications.split(',').map((q) => q.trim()).filter(Boolean).slice(0, 3)
            : [];

    return (
        <Link to={`/book-appointment/${doctor._id}`} className="group block h-full">
            {/* flex-col + h-full lets the CTA sit at the card's bottom edge
                (mt-auto), so buttons line up across a row regardless of content. */}
            <div className="flex flex-col h-full bg-zinc-900/40 backdrop-blur-md border border-zinc-800/50 rounded-2xl p-5 transition-all hover:border-zinc-700 hover:-translate-y-1">
                {/* Compact circular avatar. The overflow-hidden ring is split from
                    the positioning wrapper so the verified badge can sit on the
                    edge without being clipped. */}
                <div className="relative w-24 h-24 mx-auto mt-2 mb-4 shrink-0">
                    <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-zinc-800/80">
                        {photo ? (
                            <motion.img
                                layoutId={`doctor-img-${doctor._id}`}
                                src={optimizeCloudinaryUrl(photo)}
                                alt={name}
                                className="w-full h-full object-cover"
                                loading="lazy"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-rose-950/30">
                                <span className="text-3xl font-bold text-rose-500">
                                    {name.charAt(0).toUpperCase()}
                                </span>
                            </div>
                        )}
                    </div>
                    {isVerified && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center border-2 border-zinc-900">
                            <CheckCircle className="w-4 h-4 text-white" />
                        </div>
                    )}
                </div>

                <div className="text-center min-w-0">
                    <h3 className="text-lg font-bold text-zinc-100 truncate">
                        {name}
                    </h3>
                    <p className="text-sm text-rose-500 font-medium mt-0.5 truncate">
                        {specialization}
                    </p>

                    {totalRatings > 0 && (
                        <div className="flex items-center justify-center gap-1 mt-2">
                            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                            <span className="text-sm font-semibold text-zinc-200">
                                {averageRating.toFixed(1)}
                            </span>
                            <span className="text-xs text-zinc-500">
                                ({totalRatings})
                            </span>
                        </div>
                    )}

                    {tags.length > 0 && (
                        <div className="flex flex-wrap items-center justify-center gap-1.5 mt-3">
                            {tags.map((tag, i) => (
                                <span
                                    key={i}
                                    className="bg-zinc-800/60 text-zinc-300 text-xs font-medium px-2.5 py-1 rounded-full border border-zinc-700/60"
                                >
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                {/* Strict vertical stat stack — Exp/Fees on one row, address on
                    its own truncating line, so it never wraps unpredictably. */}
                <div className="flex flex-col gap-2 w-full mt-4 bg-zinc-950/50 rounded-lg p-3">
                    <div className="flex justify-between items-center text-xs text-zinc-400">
                        <span className="inline-flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-zinc-500" />
                            {experience} {experience === 1 ? 'yr' : 'yrs'} exp
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                            <IndianRupee className="w-3.5 h-3.5 text-zinc-500" />
                            {fees} fee
                        </span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-zinc-400 border-t border-zinc-800/50 pt-2 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                        <span className="truncate">{hospitalAddress || 'N/A'}</span>
                    </div>
                </div>

                {/* Pinned to the bottom for cross-card button alignment */}
                <div className="mt-auto pt-4">
                    <span className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800/50 py-2.5 font-medium text-zinc-300 transition-all duration-300 group-hover:border-rose-500 group-hover:bg-rose-600 group-hover:text-white">
                        <Calendar className="w-4 h-4" />
                        Book Appointment
                    </span>
                </div>
            </div>
        </Link>
    );
};

export default DoctorCard;

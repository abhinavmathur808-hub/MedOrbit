import { useRef, useState } from 'react';
import { optimizeCloudinaryUrl } from '../utils/cloudinaryUrl';
import { Link } from 'react-router-dom';
import {
    Clock,
    DollarSign,
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

    const shortLocation = hospitalAddress
        ? hospitalAddress.split(',').slice(-2).join(',').trim() || hospitalAddress
        : 'N/A';

    const cardRef = useRef(null);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [opacity, setOpacity] = useState(0);
    const [cardTransform, setCardTransform] = useState('perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)');

    const handleMouseMove = (e) => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setPosition({ x, y });

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = ((y - centerY) / centerY) * -8;
        const rotateY = ((x - centerX) / centerX) * 8;

        setCardTransform(`perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`);
    };

    const handleMouseEnter = () => setOpacity(1);

    const handleMouseLeave = () => {
        setOpacity(0);
        setCardTransform('perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)');
    };

    return (
        <Link
            to={`/book-appointment/${doctor._id}`}
            className="block group"
        >
            <div
                ref={cardRef}
                onMouseMove={handleMouseMove}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                className="w-full relative overflow-hidden bg-[#09090b] border border-zinc-800/80 rounded-2xl p-5 hover:border-zinc-700"
                style={{ transform: cardTransform, transition: opacity === 0 ? 'transform 0.5s ease-out' : 'none' }}
            >
                <div
                    className="pointer-events-none absolute -inset-px transition-opacity duration-300 rounded-2xl"
                    style={{
                        opacity,
                        background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, rgba(225, 29, 72, 0.15), transparent 40%)`,
                    }}
                />

                <div className="relative z-10">

                    <div className="flex flex-col items-center text-center">
                        <div className="relative">
                            <div className="w-24 h-24 rounded-full border-2 border-zinc-800 overflow-hidden bg-rose-950/30 flex items-center justify-center">
                                {photo ? (
                                    <img
                                        src={optimizeCloudinaryUrl(photo)}
                                        alt={name}
                                        className="w-full h-full object-cover"
                                        loading="lazy"
                                    />
                                ) : (
                                    <span className="text-3xl font-bold text-rose-500">
                                        {name.charAt(0).toUpperCase()}
                                    </span>
                                )}
                            </div>
                            {isVerified && (
                                <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-rose-500 rounded-full flex items-center justify-center border-2 border-[#09090b]">
                                    <CheckCircle className="w-4 h-4 text-white" />
                                </div>
                            )}
                        </div>

                        <h3 className="text-lg font-bold text-zinc-100 mt-4">
                            {name}
                        </h3>

                        <p className="text-sm text-rose-500 font-medium mt-0.5">
                            {specialization}
                        </p>

                        {totalRatings > 0 && (
                            <div className="flex items-center gap-1 mt-2">
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
                                        className="bg-zinc-800 text-zinc-300 text-xs font-medium px-2.5 py-1 rounded-full border border-zinc-700"
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-3 gap-2 bg-[#121212] border border-zinc-800/80 rounded-xl p-3 mt-4">
                        <div className="flex flex-col items-center text-center">
                            <Clock className="w-4 h-4 text-rose-500 mb-1" />
                            <span className="text-sm font-semibold text-zinc-200">
                                {experience} {experience === 1 ? 'Year' : 'Years'}
                            </span>
                            <span className="text-[10px] text-zinc-500 uppercase tracking-wider">
                                Exp.
                            </span>
                        </div>

                        <div className="flex flex-col items-center text-center border-x border-zinc-800">
                            <DollarSign className="w-4 h-4 text-rose-500 mb-1" />
                            <span className="text-sm font-semibold text-zinc-200">
                                ₹{fees}
                            </span>
                            <span className="text-[10px] text-zinc-500 uppercase tracking-wider">
                                Fees
                            </span>
                        </div>

                        <div className="flex flex-col items-center text-center">
                            <MapPin className="w-4 h-4 text-rose-500 mb-1" />
                            <span className="text-sm font-semibold text-zinc-200 truncate max-w-[80px]">
                                {shortLocation}
                            </span>
                            <span className="text-[10px] text-zinc-500 uppercase tracking-wider">
                                Location
                            </span>
                        </div>
                    </div>

                    <button className="w-full mt-4 bg-rose-700 hover:bg-rose-600 text-white font-medium py-3 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer">
                        <Calendar className="w-4 h-4" />
                        Book Appointment
                    </button>
                </div>
            </div>
        </Link>
    );
};

export default DoctorCard;

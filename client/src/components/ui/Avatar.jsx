import { optimizeCloudinaryUrl } from '../../utils/cloudinaryUrl';

// Photo-or-initial avatar. Replaces the near-identical circle/rounded blocks
// hand-rolled in DoctorDashboard, MyAppointments, PatientProfile, etc.
// The fallback is a rose gradient with the first initial.
//
// props:
//   src   — image URL (Cloudinary-optimized automatically)
//   name  — used for the initial + alt text
//   size  — pixel size (number), default 40
//   shape — 'circle' (default) | 'rounded'
const Avatar = ({ src, name = '', size = 40, shape = 'circle', className = '' }) => {
    const radius = shape === 'circle' ? 'rounded-full' : 'rounded-xl';
    const initial = (name || '?').charAt(0).toUpperCase();
    // Scale the initial with the avatar (roughly 40% of the box)
    const fontSize = Math.max(12, Math.round(size * 0.4));
    const dim = { width: size, height: size };

    return (
        <div
            className={`flex-shrink-0 overflow-hidden flex items-center justify-center bg-gradient-to-br from-rose-500 to-rose-800 text-white font-bold ${radius} ${className}`}
            style={dim}
        >
            {src ? (
                <img
                    src={optimizeCloudinaryUrl(src)}
                    alt={name || 'Avatar'}
                    className="w-full h-full object-cover"
                    loading="lazy"
                />
            ) : (
                <span style={{ fontSize }}>{initial}</span>
            )}
        </div>
    );
};

export default Avatar;

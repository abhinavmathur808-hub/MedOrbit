// Base skeleton primitive for content-shaped loading states.
// Compose per-page shapes from this block, e.g.:
//   <Skeleton className="h-4 w-32" />          — a text line
//   <Skeleton className="w-12 h-12 rounded-full" /> — an avatar
const Skeleton = ({ className = '' }) => (
    <div
        aria-hidden="true"
        className={`animate-pulse bg-zinc-800/80 rounded-lg ${className}`}
    />
);

export default Skeleton;

// Shared empty state. Replaces the five hand-rolled empty blocks (several of
// which dead-ended with no next action). Pass an optional `action` node (a
// Link or button) so an empty screen always offers a way forward.
//
// props:
//   icon     — a lucide icon component (e.g. Calendar)
//   title    — headline
//   subtitle — supporting line (optional)
//   action   — CTA node (optional)
//   card     — wrap in an elevated surface (default true); false = bare centered block
const EmptyState = ({ icon: Icon, title, subtitle, action, card = true, className = '' }) => {
    const content = (
        <>
            {Icon && (
                <div className="mx-auto mb-4 w-16 h-16 rounded-2xl bg-zinc-800/60 border border-zinc-800 flex items-center justify-center">
                    <Icon className="w-8 h-8 text-zinc-500" />
                </div>
            )}
            <h3 className="text-xl font-semibold text-zinc-200 mb-1.5">{title}</h3>
            {subtitle && <p className="text-zinc-500 max-w-sm mx-auto">{subtitle}</p>}
            {action && <div className="mt-6 flex justify-center">{action}</div>}
        </>
    );

    if (!card) {
        return <div className={`text-center py-16 ${className}`}>{content}</div>;
    }

    return (
        <div
            className={`text-center py-16 px-6 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-lg shadow-black/30 ${className}`}
        >
            {content}
        </div>
    );
};

export default EmptyState;

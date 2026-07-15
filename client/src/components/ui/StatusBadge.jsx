import { CheckCircle, AlertCircle, XCircle, Clock } from 'lucide-react';

// Single source of truth for appointment status pills. Previously each screen
// (MyAppointments / DoctorDashboard / AdminDashboard) reimplemented this map
// with drifting colors, and "completed" fell through to a Clock icon (which
// reads as pending). Every status now has a definite color + icon.
const STATUS = {
    pending: { label: 'Pending', cls: 'bg-amber-500/10 text-amber-400 border-amber-500/20', Icon: AlertCircle },
    confirmed: { label: 'Confirmed', cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', Icon: CheckCircle },
    completed: { label: 'Completed', cls: 'bg-rose-500/10 text-rose-300 border-rose-500/20', Icon: CheckCircle },
    cancelled: { label: 'Cancelled', cls: 'bg-red-500/10 text-red-400 border-red-500/20', Icon: XCircle },
};

const FALLBACK = { cls: 'bg-zinc-800 text-zinc-300 border-zinc-700', Icon: Clock };

// size: 'sm' (dashboards) | 'md' (appointment cards). showIcon defaults on.
const StatusBadge = ({ status, size = 'md', showIcon = true, className = '' }) => {
    const cfg = STATUS[status] || { ...FALLBACK, label: status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown' };
    const { cls, Icon, label } = cfg;

    const sizing = size === 'sm'
        ? 'px-2.5 py-1 text-xs gap-1'
        : 'px-3 py-1 text-sm gap-1.5';
    const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';

    return (
        <span className={`inline-flex items-center rounded-full font-medium border ${cls} ${sizing} ${className}`}>
            {showIcon && <Icon className={iconSize} />}
            <span className="capitalize">{label}</span>
        </span>
    );
};

export default StatusBadge;

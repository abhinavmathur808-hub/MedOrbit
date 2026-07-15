import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

// App-wide toast layer (no external dependency — rides on framer-motion).
// Usage:
//   const toast = useToast();
//   toast.success('Appointment approved');
//   toast.error('Could not cancel — try again');
//   toast.info('Payment window closed');

const ToastContext = createContext(null);

const TOAST_TTL_MS = 4500;

const TYPE_STYLES = {
    success: { icon: CheckCircle, accent: 'text-emerald-400', bar: 'bg-emerald-500' },
    error: { icon: AlertCircle, accent: 'text-red-400', bar: 'bg-red-500' },
    info: { icon: Info, accent: 'text-rose-400', bar: 'bg-rose-500' },
};

let nextId = 1;

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);
    const timersRef = useRef(new Map());

    const dismiss = useCallback((id) => {
        const timer = timersRef.current.get(id);
        if (timer) {
            clearTimeout(timer);
            timersRef.current.delete(id);
        }
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const push = useCallback((type, message) => {
        const id = nextId++;
        setToasts((prev) => [...prev.slice(-3), { id, type, message }]); // keep at most 4
        timersRef.current.set(id, setTimeout(() => dismiss(id), TOAST_TTL_MS));
        return id;
    }, [dismiss]);

    const api = useMemo(() => ({
        success: (msg) => push('success', msg),
        error: (msg) => push('error', msg),
        info: (msg) => push('info', msg),
        dismiss,
    }), [push, dismiss]);

    return (
        <ToastContext.Provider value={api}>
            {children}
            <ToastViewport toasts={toasts} onDismiss={dismiss} />
        </ToastContext.Provider>
    );
};

const ToastViewport = ({ toasts, onDismiss }) => {
    const reduceMotion = useReducedMotion();

    return (
        <div
            role="status"
            aria-live="polite"
            className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 w-[min(92vw,380px)] pointer-events-none"
        >
            <AnimatePresence initial={false}>
                {toasts.map(({ id, type, message }) => {
                    const { icon: Icon, accent, bar } = TYPE_STYLES[type] || TYPE_STYLES.info;
                    return (
                        <motion.div
                            key={id}
                            layout={!reduceMotion}
                            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.97 }}
                            animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
                            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.97 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                            className="pointer-events-auto relative overflow-hidden flex items-start gap-3 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 shadow-2xl shadow-black/60"
                        >
                            <span className={`absolute left-0 top-0 bottom-0 w-1 ${bar}`} />
                            <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${accent}`} />
                            <p className="flex-1 text-sm text-zinc-200 leading-snug">{message}</p>
                            <button
                                onClick={() => onDismiss(id)}
                                aria-label="Dismiss notification"
                                className="text-zinc-600 hover:text-zinc-300 transition-colors flex-shrink-0"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>
    );
};

export const useToast = () => {
    const ctx = useContext(ToastContext);
    if (!ctx) {
        throw new Error('useToast must be used inside <ToastProvider>');
    }
    return ctx;
};

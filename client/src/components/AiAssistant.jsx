const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import {
    MessageCircle,
    X,
    Send,
    Bot,
    User,
    Loader2,
    Sparkles,
    Stethoscope,
    Zap,
    Lock,
    BadgeCheck,
} from 'lucide-react';
import { preloadLocalTriage, matchSpecialty, getTriageStatus } from '../utils/localTriage';

const AiAssistant = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            content: "👋 Hi! I'm your AI Health Assistant. Describe your symptoms and I'll suggest which specialist you might need to see.",
        },
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    // On-device model lifecycle: 'idle' | 'loading' | 'ready' | 'unavailable'
    const [triageStatus, setTriageStatus] = useState(getTriageStatus());
    const [modelProgress, setModelProgress] = useState(0);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        const handleOpen = () => setIsOpen(true);
        window.addEventListener('open-ai-assistant', handleOpen);
        return () => window.removeEventListener('open-ai-assistant', handleOpen);
    }, []);

    // Warm up the on-device model the first time the panel opens, so the
    // instant tier is usually ready before the user finishes typing
    useEffect(() => {
        if (!isOpen || getTriageStatus() !== 'idle') return;
        setTriageStatus('loading');
        preloadLocalTriage((p) => setModelProgress(p))
            .then(() => setTriageStatus('ready'))
            .catch(() => setTriageStatus('unavailable'));
    }, [isOpen]);

    // Tier 1: on-device match. Appends its own 'triage' message when it
    // resolves — usually in a few milliseconds once the model is warm.
    const runLocalTriage = async (text) => {
        if (getTriageStatus() === 'unavailable') return;
        try {
            const result = await matchSpecialty(text);
            setTriageStatus('ready');

            let doctors = [];
            if (result.confidence !== 'low') {
                try {
                    const res = await fetch(
                        `${API_BASE}/api/doctor/related?specialization=${encodeURIComponent(result.top.specialty)}`
                    );
                    const data = await res.json();
                    if (data.success) doctors = (data.doctors || []).slice(0, 3);
                } catch {
                    // doctor lookup is a bonus; the match itself still renders
                }
            }

            setMessages((prev) => [
                ...prev,
                { role: 'assistant', type: 'triage', triage: result, doctors },
            ]);
        } catch {
            setTriageStatus(getTriageStatus());
        }
    };

    // Tier 2: Gemini via the server (which itself falls back to tier 3,
    // a keyword matcher, when the AI is unavailable)
    const runCloudAdvice = async (text) => {
        const token = localStorage.getItem('token');
        if (!token) {
            setMessages((prev) => [
                ...prev,
                {
                    role: 'assistant',
                    content: '🔐 **Log in** to get full AI-powered advice. Instant on-device matching works without an account.',
                },
            ]);
            return;
        }

        try {
            const response = await fetch(`${API_BASE}/api/ai/analyze`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ symptoms: text }),
            });

            const data = await response.json();

            if (data.success) {
                setMessages((prev) => [
                    ...prev,
                    { role: 'assistant', content: data.advice },
                ]);
            } else {
                setMessages((prev) => [
                    ...prev,
                    {
                        role: 'assistant',
                        content: '❌ Sorry, I had trouble analyzing that. Please try again.',
                    },
                ]);
            }
        } catch (error) {
            setMessages((prev) => [
                ...prev,
                {
                    role: 'assistant',
                    content: '❌ Connection error. Please check your internet and try again.',
                },
            ]);
        }
    };

    const handleSend = async () => {
        if (!input.trim() || loading) return;

        const userMessage = input.trim();
        setInput('');
        setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
        setLoading(true);

        // Both tiers run in parallel; each appends its message when it resolves
        const localPromise = runLocalTriage(userMessage);
        const cloudPromise = runCloudAdvice(userMessage);
        await Promise.allSettled([localPromise, cloudPromise]);

        setLoading(false);
    };

    // onKeyDown, not the deprecated onKeyPress — keypress doesn't fire for
    // synthesized events and is unreliable across browsers
    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <>

            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 ${isOpen
                    ? 'bg-gray-600 hover:bg-gray-700 rotate-90'
                    : 'bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-600 hover:to-purple-700'
                    }`}
            >
                {isOpen ? (
                    <X className="w-6 h-6 text-white" />
                ) : (
                    <div className="relative">
                        <MessageCircle className="w-6 h-6 text-white" />
                        <Sparkles className="w-3 h-3 text-yellow-300 absolute -top-1 -right-1" />
                    </div>
                )}
            </button>

            {isOpen && (
                <div className="fixed bottom-24 right-6 z-50 w-96 max-w-[calc(100vw-48px)] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-in slide-in-from-bottom-4">

                    <div className="bg-gradient-to-r from-rose-500 to-purple-600 px-4 py-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                                <Stethoscope className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h3 className="text-white font-semibold">AI Health Assistant</h3>
                                <p className="text-white/80 text-xs">Gemini + on-device AI</p>
                            </div>
                        </div>
                    </div>

                    <div className="h-80 overflow-y-auto p-4 space-y-4 bg-gray-50">
                        {messages.map((msg, idx) => (
                            <div
                                key={idx}
                                className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'
                                    }`}
                            >
                                {msg.role === 'assistant' && (
                                    <div className="w-8 h-8 bg-gradient-to-br from-rose-400 to-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <Bot className="w-4 h-4 text-white" />
                                    </div>
                                )}
                                <div
                                    className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm ${msg.role === 'user'
                                        ? 'bg-rose-500 text-white rounded-br-md'
                                        : 'bg-white text-gray-700 border border-gray-200 rounded-bl-md shadow-sm'
                                        }`}
                                >
                                    {msg.type === 'triage' ? (
                                        <div>
                                            <div className="flex items-center gap-1.5 text-xs font-semibold text-purple-600 mb-1.5">
                                                <Zap className="w-3.5 h-3.5" />
                                                Instant match — on your device
                                            </div>
                                            {msg.triage.confidence === 'low' ? (
                                                <p>
                                                    I'm not sure from that description — a{' '}
                                                    <strong className="font-bold text-rose-600">General Physician</strong>{' '}
                                                    is a good place to start. Try adding more detail for a better match.
                                                </p>
                                            ) : (
                                                <p>
                                                    Your symptoms point to a{' '}
                                                    <strong className="font-bold text-rose-600">{msg.triage.top.specialty}</strong>
                                                    {msg.triage.confidence === 'moderate' ? ' (possible match)' : ''}.
                                                </p>
                                            )}
                                            {msg.doctors?.length > 0 && (
                                                <div className="mt-2 space-y-1.5">
                                                    {msg.doctors.map((doc) => (
                                                        <Link
                                                            key={doc._id}
                                                            to={`/book-appointment/${doc._id}`}
                                                            onClick={() => setIsOpen(false)}
                                                            className="flex items-center justify-between gap-2 px-3 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-100 rounded-lg transition-colors"
                                                        >
                                                            <span className="flex items-center gap-1 font-medium text-gray-800 truncate">
                                                                {doc.userId?.name || 'Doctor'}
                                                                {doc.userId?.isVerified && <BadgeCheck className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />}
                                                            </span>
                                                            <span className="text-xs text-rose-600 font-semibold flex-shrink-0">
                                                                ₹{doc.fees} · Book
                                                            </span>
                                                        </Link>
                                                    ))}
                                                </div>
                                            )}
                                            <div className="flex items-center gap-1 text-[10px] text-gray-400 mt-2">
                                                <Lock className="w-3 h-3" />
                                                Matched locally — this text never left your browser
                                            </div>
                                        </div>
                                    ) : msg.role === 'assistant' ? (
                                        <ReactMarkdown
                                            components={{
                                                strong: ({ children }) => <strong className="font-bold text-rose-600">{children}</strong>,
                                                em: ({ children }) => <em className="italic">{children}</em>,
                                                p: ({ children }) => <p className="mb-1 last:mb-0">{children}</p>,
                                            }}
                                        >
                                            {msg.content}
                                        </ReactMarkdown>
                                    ) : (
                                        msg.content
                                    )}
                                </div>
                                {msg.role === 'user' && (
                                    <div className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <User className="w-4 h-4 text-gray-600" />
                                    </div>
                                )}
                            </div>
                        ))}

                        {loading && (
                            <div className="flex gap-2 justify-start">
                                <div className="w-8 h-8 bg-gradient-to-br from-rose-400 to-purple-500 rounded-lg flex items-center justify-center">
                                    <Bot className="w-4 h-4 text-white" />
                                </div>
                                <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-md border border-gray-200 shadow-sm">
                                    <div className="flex items-center gap-2 text-gray-500 text-sm">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Analyzing...
                                    </div>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    <div className="p-4 border-t border-gray-200 bg-white">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Describe your symptoms..."
                                disabled={loading}
                                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                            <button
                                onClick={handleSend}
                                disabled={!input.trim() || loading}
                                className="w-10 h-10 bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-600 hover:to-purple-700 rounded-xl flex items-center justify-center text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </div>
                        <p className="text-xs text-gray-400 mt-2 text-center">
                            ⚠️ This is not a medical diagnosis. Please consult a doctor.
                        </p>
                        {triageStatus === 'loading' && (
                            <p className="text-[10px] text-purple-500 mt-1 text-center flex items-center justify-center gap-1">
                                <Loader2 className="w-3 h-3 animate-spin" />
                                Setting up on-device AI… {modelProgress}% (one-time download)
                            </p>
                        )}
                        {triageStatus === 'ready' && (
                            <p className="text-[10px] text-gray-400 mt-1 text-center flex items-center justify-center gap-1">
                                <Lock className="w-3 h-3 text-green-500" />
                                On-device triage active — instant matches never leave your browser
                            </p>
                        )}
                    </div>
                </div>
            )}
        </>
    );
};

export default AiAssistant;

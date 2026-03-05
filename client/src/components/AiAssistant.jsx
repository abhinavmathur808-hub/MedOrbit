const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

import { useState, useRef, useEffect } from 'react';
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
} from 'lucide-react';

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
    const messagesEndRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        const handleOpen = () => setIsOpen(true);
        window.addEventListener('open-ai-assistant', handleOpen);
        return () => window.removeEventListener('open-ai-assistant', handleOpen);
    }, []);

    const handleSend = async () => {
        if (!input.trim() || loading) return;

        const userMessage = input.trim();
        setInput('');
        setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
        setLoading(true);

        try {
            const response = await fetch(`${API_BASE}/api/ai/analyze`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ symptoms: userMessage }),
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
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e) => {
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
                                <p className="text-white/80 text-xs">Powered by Gemini AI</p>
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
                                    {msg.role === 'assistant' ? (
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
                                onKeyPress={handleKeyPress}
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
                    </div>
                </div>
            )}
        </>
    );
};

export default AiAssistant;

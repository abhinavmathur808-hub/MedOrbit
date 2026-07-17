import { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

const faqData = [
    {
        question: 'How do I book an appointment?',
        answer:
            'Simply <strong>log in</strong> to your account, browse our list of verified doctors using specialty filters, select your preferred doctor and a convenient time slot, then complete the booking with the integrated payment gateway.',
    },
    {
        question: 'Who built this?',
        answer:
            'MedOrbit was architected and developed by <strong>Abhinav Mathur</strong> as a comprehensive fullstack healthcare portfolio project.',
    },
    {
        question: 'What technologies are used?',
        answer: `<ul class="list-disc pl-5 space-y-1.5 mt-1">
            <li><strong>Frontend:</strong> React 19, Redux Toolkit, Tailwind CSS 4, Lucide Icons</li>
            <li><strong>Backend:</strong> Express 4, Mongoose 8, JWT</li>
            <li><strong>Database:</strong> MongoDB Atlas (TLS)</li>
            <li><strong>Cloud / AI:</strong> Google Gemini Pro, Cloudinary, Razorpay, ZegoCloud</li>
        </ul>`,
    },
    {
        question: 'Do I need to pay?',
        answer:
            'No — payments are in <strong>demo mode</strong>. When the Razorpay gateway opens, use the ID <code class="bg-white/[0.04] px-1.5 py-0.5 rounded text-zinc-300 font-mono text-sm border border-zinc-800">success@razorpay</code> to simulate a successful transaction.',
    },
    {
        question: 'Is this a real medical service?',
        answer:
            'No. MedOrbit is a <strong>portfolio / demonstration project</strong>. All listed doctors and health data are for illustrative purposes only.',
    },
];

const FAQ = () => {
    const [activeIndex, setActiveIndex] = useState(null);
    const reduce = useReducedMotion();

    const toggle = (index) => {
        setActiveIndex(activeIndex === index ? null : index);
    };

    return (
        <section className="py-32 px-6 md:px-12">
            <div className="max-w-6xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8">

                    {/* ── Left: the hook ── */}
                    <div className="lg:col-span-4 lg:sticky lg:top-24 lg:self-start">
                        <h2 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight text-zinc-100">
                            Frequently Asked Questions
                        </h2>
                    </div>

                    {/* ── Right: the accordion ── */}
                    <div className="lg:col-span-8 space-y-4">
                        {faqData.map((item, index) => {
                            const isOpen = activeIndex === index;
                            return (
                                <div
                                    key={index}
                                    className={`backdrop-blur-md border rounded-2xl overflow-hidden transition-colors duration-300 ${
                                        isOpen
                                            ? 'border-rose-500/50 bg-zinc-800/40'
                                            : 'border-zinc-800/50 bg-zinc-900/40'
                                    }`}
                                >
                                    <button
                                        onClick={() => toggle(index)}
                                        className="w-full px-6 py-5 flex justify-between items-center cursor-pointer text-left gap-4"
                                        aria-expanded={isOpen}
                                    >
                                        <span className="text-zinc-100 font-medium">
                                            {item.question}
                                        </span>
                                        <ChevronDown
                                            className={`flex-shrink-0 text-zinc-400 transition-transform duration-300 ${
                                                isOpen ? 'rotate-180' : ''
                                            }`}
                                        />
                                    </button>

                                    <AnimatePresence initial={false}>
                                        {isOpen && (
                                            <motion.div
                                                key="answer"
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{
                                                    duration: reduce ? 0 : 0.3,
                                                    ease: [0.22, 1, 0.36, 1],
                                                }}
                                                // clip the body while its height animates
                                                className="overflow-hidden"
                                            >
                                                <div
                                                    className="px-6 pb-5 text-zinc-400 leading-relaxed [&_strong]:text-zinc-200 [&_strong]:font-semibold"
                                                    dangerouslySetInnerHTML={{ __html: item.answer }}
                                                />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            );
                        })}
                    </div>

                </div>
            </div>
        </section>
    );
};

export default FAQ;

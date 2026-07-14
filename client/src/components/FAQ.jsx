import { useState } from 'react';
import { Plus, Minus } from 'lucide-react';

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

    const toggle = (index) => {
        setActiveIndex(activeIndex === index ? null : index);
    };

    return (
        <section className="py-32 px-6 md:px-12">
            <div className="max-w-6xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8">

                    <div className="lg:col-span-4 lg:sticky lg:top-24 lg:self-start">

                        <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight leading-tight mb-4 text-white">
                            Frequently Asked Questions
                        </h2>
                        <p className="text-zinc-500 leading-relaxed">
                            Can't find the answer you're looking for? Reach out to our support team.
                        </p>
                    </div>

                    <div className="lg:col-span-8">
                        <div className="border-t border-zinc-800/60">
                            {faqData.map((item, index) => {
                                const isOpen = activeIndex === index;
                                return (
                                    <div
                                        key={index}
                                        className="border-b border-zinc-800/60"
                                    >
                                        <button
                                            onClick={() => toggle(index)}
                                            className="w-full flex items-center justify-between text-left py-6 group cursor-pointer"
                                            aria-expanded={isOpen}
                                        >
                                            <span
                                                className={`text-lg font-medium transition-colors duration-200 pr-6 ${isOpen
                                                    ? 'text-white'
                                                    : 'text-zinc-400 group-hover:text-white'
                                                    }`}
                                            >
                                                {item.question}
                                            </span>
                                            <span
                                                className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${isOpen
                                                    ? 'bg-rose-600 text-white'
                                                    : 'bg-white/[0.03] group-hover:bg-white/[0.06]'
                                                    }`}
                                            >
                                                {isOpen ? (
                                                    <Minus className="w-4 h-4" />
                                                ) : (
                                                    <Plus className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                                                )}
                                            </span>
                                        </button>

                                        <div
                                            className={`grid transition-all duration-300 ease-in-out ${isOpen
                                                ? 'grid-rows-[1fr] opacity-100'
                                                : 'grid-rows-[0fr] opacity-0'
                                                }`}
                                        >
                                            <div className="overflow-hidden">
                                                <div
                                                    className="pb-6 pr-14 text-zinc-500 leading-relaxed [&_strong]:text-zinc-300 [&_strong]:font-semibold"
                                                    dangerouslySetInnerHTML={{ __html: item.answer }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
};

export default FAQ;
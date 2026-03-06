const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Loader2 } from 'lucide-react';

const TopArticles = () => {
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchArticles = async () => {
            try {
                const response = await fetch(`${API_BASE}/api/articles/list`);
                const data = await response.json();
                if (data.success) {
                    setArticles(data.articles);
                }
            } catch (error) {
            } finally {
                setLoading(false);
            }
        };

        fetchArticles();
    }, []);

    const getCategoryColor = (category) => {
        const colors = {
            Nutrition: '#34d399',
            Cardiology: '#fb7185',
            'Mental Health': '#a78bfa',
            Neurology: '#94a3b8',
            Dermatology: '#fbbf24',
            'General Physician': '#60a5fa',
            Pediatrician: '#f472b6',
            Orthopedic: '#4ade80',
        };
        return colors[category] || '#71717a';
    };

    if (!loading && articles.length === 0) return null;

    return (
        <section className="py-24 px-6 md:px-12">
            <div className="max-w-6xl mx-auto">
                <div className="mb-14 flex flex-col items-center text-center">

                    <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-white mb-3">
                        Read top articles from our<br />health experts
                    </h2>
                    <p className="text-base sm:text-lg max-w-xl mx-auto text-zinc-400 leading-relaxed">
                        Health articles that keep you informed about good health practices
                        and achieving your goals.
                    </p>
                </div>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-rose-600" />
                    </div>
                ) : (
                    /* Cards Grid */
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {articles.slice(0, 3).map((article) => (
                            <div
                                key={article._id}
                                onClick={() => navigate(`/article/${article._id}`)}
                                className="group rounded-2xl overflow-hidden cursor-pointer hover:-translate-y-1 transition-all duration-300 ease-out"
                                style={{
                                    background: 'var(--card-bg)',
                                    border: '1px solid var(--card-border)',
                                    boxShadow: 'var(--card-shadow)',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'var(--card-hover-bg)';
                                    e.currentTarget.style.borderColor = 'var(--card-hover-border)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'var(--card-bg)';
                                    e.currentTarget.style.borderColor = 'var(--card-border)';
                                }}
                            >
                                <div className="overflow-hidden">
                                    <img
                                        src={article.image}
                                        alt={article.title}
                                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-700 ease-out opacity-70 group-hover:opacity-90"
                                        loading="lazy"
                                    />
                                </div>

                                <div className="p-6">
                                    <span
                                        className="text-xs font-semibold uppercase tracking-widest"
                                        style={{ color: getCategoryColor(article.category) }}
                                    >
                                        {article.category}
                                    </span>

                                    <h3 className="font-medium text-lg mt-2 mb-3 leading-snug text-white">
                                        {article.title}
                                    </h3>

                                    <div className="flex items-center justify-between">
                                        <p className="text-sm text-zinc-600">
                                            {article.author}
                                            {article.readTime && (
                                                <>
                                                    {' '}<span className="text-zinc-700">·</span>{' '}
                                                    <span className="text-zinc-600">{article.readTime}</span>
                                                </>
                                            )}
                                        </p>
                                        <ArrowRight
                                            className="w-4 h-4 text-zinc-700 group-hover:text-rose-500 group-hover:translate-x-1 transition-all duration-200"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
};

export default TopArticles;

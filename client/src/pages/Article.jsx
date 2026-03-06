const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, User, Clock, Loader2 } from 'lucide-react';

const Article = () => {
    const { id } = useParams();
    const [article, setArticle] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const imageRef = useRef(null);

    useEffect(() => {
        const fetchArticle = async () => {
            try {
                const response = await fetch(`${API_BASE}/api/articles/${id}`);
                const data = await response.json();

                if (data.success) {
                    setArticle(data.article);
                } else {
                    setError('Article not found');
                }
            } catch (err) {
                setError('Failed to load article');
            } finally {
                setLoading(false);
            }
        };

        fetchArticle();
    }, [id]);

    useEffect(() => {
        const navbar = document.querySelector('nav');
        if (!navbar) return;

        const handleScroll = () => {
            if (imageRef.current) {
                const imageBottom = imageRef.current.getBoundingClientRect().bottom;
                if (imageBottom < 0) {
                    navbar.style.transform = 'translateY(-200%)';
                    navbar.style.opacity = '0';
                } else {
                    navbar.style.transform = 'translateY(0)';
                    navbar.style.opacity = '1';
                }
            }
        };

        navbar.style.transition = 'transform 0.4s ease, opacity 0.4s ease';

        window.addEventListener('scroll', handleScroll, { passive: true });

        return () => {
            window.removeEventListener('scroll', handleScroll);
            navbar.style.transform = 'translateY(0)';
            navbar.style.opacity = '1';
        };
    }, [article]); // Re-run when article loads (so imageRef is available)

    if (loading) {
        return (
            <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-[#09090b]">
                <Loader2 className="w-10 h-10 animate-spin text-rose-500" />
            </div>
        );
    }

    if (error || !article) {
        return (
            <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-[#09090b]">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-zinc-200 mb-2">Article Not Found</h2>
                    <p className="text-zinc-500 mb-6">{error || 'The article you are looking for does not exist.'}</p>
                    <Link
                        to="/"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-rose-500 text-white rounded-xl hover:bg-rose-600 transition-all"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Home
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-[calc(100vh-64px)] bg-[#09090b] pt-28 py-12 px-4">
            <div className="max-w-3xl mx-auto">
                <Link
                    to="/"
                    className="inline-flex items-center gap-2 text-zinc-500 hover:text-zinc-200 transition-colors mb-8"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Home
                </Link>

                <img
                    ref={imageRef}
                    src={article.image}
                    alt={article.title}
                    className="w-full h-80 object-cover rounded-xl mb-8"
                    loading="lazy"
                />

                <span className="text-xs font-semibold uppercase tracking-wider text-rose-500">
                    {article.category}
                </span>

                <h1 className="text-3xl sm:text-4xl font-bold mt-2 mb-4 text-zinc-50">
                    {article.title}
                </h1>

                <div className="flex flex-wrap items-center gap-4 text-zinc-500 text-sm mb-10 pb-8 border-b border-zinc-800">
                    <span className="flex items-center gap-1.5">
                        <User className="w-4 h-4" />
                        {article.author}
                    </span>
                    {article.date && (
                        <span className="flex items-center gap-1.5">
                            <Calendar className="w-4 h-4" />
                            {article.date}
                        </span>
                    )}
                    {article.readTime && (
                        <span className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4" />
                            {article.readTime}
                        </span>
                    )}
                </div>

                <div
                    className="flex flex-col gap-4 text-zinc-300 leading-relaxed text-base sm:text-lg [&_h1]:text-zinc-50 [&_h2]:text-zinc-50 [&_h3]:text-zinc-100 [&_h4]:text-zinc-100 [&_strong]:text-zinc-200 [&_a]:text-rose-400 [&_a:hover]:text-rose-300 [&_blockquote]:border-l-rose-500 [&_blockquote]:text-zinc-400 [&_code]:text-rose-300 [&_code]:bg-zinc-800 [&_code]:px-1 [&_code]:rounded [&_li]:text-zinc-300"
                    dangerouslySetInnerHTML={{ __html: article.content }}
                />
            </div>
        </div>
    );
};

export default Article;

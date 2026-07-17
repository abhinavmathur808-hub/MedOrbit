const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Loader2, Sparkles } from 'lucide-react';

const ArticleCard = ({ article }) => {
    const navigate = useNavigate();

    // /api/articles/list returns aiSummary on each document, so an article whose
    // summary was already generated arrives with it — this card never fetches.
    // Only the not-yet-generated ones pay for a round trip, and only on hover.
    const [localSummary, setLocalSummary] = useState(article.aiSummary || []);
    const [isGenerating, setIsGenerating] = useState(false);
    const [failed, setFailed] = useState(false);

    const handleMouseEnter = async () => {
        if (localSummary.length > 0 || isGenerating) return;

        setIsGenerating(true);
        setFailed(false);
        try {
            const res = await fetch(`${API_BASE}/api/articles/${article._id}/summary`);
            const data = await res.json();
            if (data.success && Array.isArray(data.summary) && data.summary.length > 0) {
                setLocalSummary(data.summary);
            } else {
                setFailed(true);
            }
        } catch (error) {
            console.error(`Failed to generate summary for ${article._id}:`, error.message);
            setFailed(true);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div
            onClick={() => navigate(`/article/${article._id}`)}
            onMouseEnter={handleMouseEnter}
            className="group cursor-pointer overflow-hidden rounded-2xl border border-zinc-800/50 bg-zinc-900/40 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-zinc-600 hover:bg-zinc-800/40"
        >
            {/* relative: anchors the blend gradient, the summary overlay and the
                AI pill. overflow-hidden clips the image's zoom. */}
            <div className="relative overflow-hidden">
                <img
                    src={article.image}
                    alt={article.title}
                    className="h-48 w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                />

                {/* Softens the hard edge where the photo meets the card body.
                    Non-interactive, so it never eats a click meant for the card. */}
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-zinc-900/80 to-transparent"
                />

                {/* Summary overlay — sits above the image, below the pill.
                    `safe center` rather than plain `justify-center`: centring an
                    overflowing flex child spills it past BOTH edges, and scrollTop
                    cannot go negative, so the top of a long summary becomes
                    unreachable even with overflow-y-auto. `safe` falls back to
                    start-alignment the moment it would overflow, keeping every
                    bullet scrollable. */}
                <div className="absolute inset-0 z-10 flex flex-col [justify-content:safe_center] overflow-y-auto bg-zinc-950/80 p-4 opacity-0 backdrop-blur-sm transition-opacity duration-300 group-hover:opacity-100">
                    {isGenerating ? (
                        <p className="flex items-center gap-2 text-sm text-zinc-300">
                            <Sparkles className="h-4 w-4 flex-shrink-0 animate-pulse text-rose-400" />
                            Generating AI TL;DR…
                        </p>
                    ) : localSummary.length > 0 ? (
                        // text-xs, not text-sm: Gemini's bullets run ~110 chars and
                        // three of them at text-sm measure 240px against this box's
                        // 192px.
                        <ul className="list-disc space-y-1.5 pl-4 text-xs text-zinc-200">
                            {localSummary.map((point, i) => (
                                <li key={i}>{point}</li>
                            ))}
                        </ul>
                    ) : failed ? (
                        <p className="text-sm text-zinc-400">Summary unavailable right now.</p>
                    ) : null}
                </div>

                {/* z-20 keeps the pill legible on top of the overlay, so the
                    reader knows what the bullets underneath actually are. */}
                <div className="pointer-events-none absolute right-3 top-3 z-20 flex translate-y-2 items-center gap-1.5 rounded-full border border-zinc-700/50 bg-black/60 px-2.5 py-1 text-xs text-zinc-300 opacity-0 backdrop-blur-md transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                    <Sparkles className="h-3 w-3 text-rose-400" />
                    <span>AI TL;DR</span>
                </div>
            </div>

            <div className="p-6">
                <span className="inline-block rounded-full border border-zinc-700/50 bg-zinc-800/50 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-zinc-300">
                    {article.category}
                </span>

                <h3 className="mt-3 mb-3 text-lg font-semibold leading-snug text-zinc-100 transition-colors group-hover:text-rose-400">
                    {article.title}
                </h3>

                <div className="flex items-center justify-between">
                    <p className="text-sm text-zinc-500">
                        {article.author}
                        {article.readTime && (
                            <>
                                {' '}<span className="text-zinc-700">·</span>{' '}
                                <span className="text-zinc-500">{article.readTime}</span>
                            </>
                        )}
                    </p>
                    <ArrowRight className="h-4 w-4 text-zinc-600 transition-transform group-hover:translate-x-1" />
                </div>
            </div>
        </div>
    );
};

const TopArticles = () => {
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchArticles = async () => {
            try {
                const response = await fetch(`${API_BASE}/api/articles/list`);
                const data = await response.json();
                if (data.success) {
                    setArticles(data.articles);
                }
            } catch (error) {
                // Never swallow this: an empty catch here once hid a CORS block
                // for as long as it took someone to notice the whole section had
                // gone missing.
                console.error(`Failed to fetch articles from ${API_BASE}:`, error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchArticles();
    }, []);

    return (
        <section className="py-24 px-6 md:px-12">
            <div className="max-w-6xl mx-auto">
                {/* Left-aligned to match the specialties section rather than
                    centring the block. */}
                <div className="mb-10 flex items-end justify-between gap-6">
                    <div className="max-w-xl">
                        <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-white">
                            Read top articles from our health experts
                        </h2>
                        <p className="mt-3 text-base leading-relaxed text-zinc-400 sm:text-lg">
                            Health articles that keep you informed about good health practices
                            and achieving your goals.
                        </p>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-rose-600" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {articles.slice(0, 3).map((article) => (
                            <ArticleCard key={article._id} article={article} />
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
};

export default TopArticles;

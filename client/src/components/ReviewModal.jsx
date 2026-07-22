const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

import { useState } from 'react';
import { Star, X, Send, Loader2 } from 'lucide-react';

const ReviewModal = ({ isOpen, onClose, appointment, onReviewSubmitted }) => {
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async () => {
        if (rating === 0) {
            setError('Please select a rating');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const token = localStorage.getItem('token');
            const url = `${API_BASE}/api/doctor/add-review`;

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    appointmentId: appointment._id,
                    rating,
                    comment,
                }),
            });

            const data = await response.json();

            if (data.success) {
                setSuccess(true);
                if (onReviewSubmitted) {
                    onReviewSubmitted(appointment._id, data.review);
                }
                setTimeout(() => {
                    onClose();
                    setRating(0);
                    setComment('');
                    setSuccess(false);
                }, 1500);
            } else {
                setError(data.message || 'Failed to submit review');
            }
        } catch {
            setError('Failed to connect to server');
        } finally {
            setLoading(false);
        }
    };

    const doctorName = appointment?.doctorName || 'Doctor';

    return (
        <div className="fixed inset-0 bg-zinc-950/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl shadow-black/60 max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="bg-zinc-900 border-b border-zinc-800 px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-rose-600/15 border border-rose-600/30 rounded-lg flex items-center justify-center">
                                <Star className="w-4 h-4 text-rose-400" />
                            </div>
                            <h2 className="text-xl font-bold text-zinc-100">Leave a Review</h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-zinc-500 hover:text-zinc-300 transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                    <p className="text-zinc-400 text-sm mt-1">Rate your experience with {doctorName}</p>
                </div>

                <div className="p-6">
                    {success ? (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Star className="w-8 h-8 text-emerald-400 fill-emerald-400" />
                            </div>
                            <h3 className="text-xl font-bold text-zinc-100 mb-2">Thank You!</h3>
                            <p className="text-zinc-400">Your review has been submitted successfully.</p>
                        </div>
                    ) : (
                        <>
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-zinc-300 mb-3 text-center">
                                    How was your experience?
                                </label>
                                <div className="flex justify-center space-x-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            type="button"
                                            onClick={() => setRating(star)}
                                            onMouseEnter={() => setHoverRating(star)}
                                            onMouseLeave={() => setHoverRating(0)}
                                            className="transition-transform hover:scale-110 focus:outline-none"
                                        >
                                            <Star
                                                className={`w-10 h-10 transition-colors ${star <= (hoverRating || rating)
                                                    ? 'text-amber-400 fill-amber-400'
                                                    : 'text-zinc-700'
                                                    }`}
                                            />
                                        </button>
                                    ))}
                                </div>
                                {rating > 0 && (
                                    <p className="text-center text-sm text-zinc-400 mt-2">
                                        {rating === 1 && 'Poor'}
                                        {rating === 2 && 'Fair'}
                                        {rating === 3 && 'Good'}
                                        {rating === 4 && 'Very Good'}
                                        {rating === 5 && 'Excellent'}
                                    </p>
                                )}
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm font-medium text-zinc-300 mb-2">
                                    Write a review (optional)
                                </label>
                                <textarea
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    placeholder="Share your experience with this doctor..."
                                    rows={4}
                                    maxLength={500}
                                    className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 placeholder-zinc-600 focus:ring-2 focus:ring-rose-600/60 focus:border-transparent transition-all outline-none resize-none"
                                />
                                <p className="text-xs text-zinc-500 text-right mt-1">
                                    {comment.length}/500
                                </p>
                            </div>

                            {error && (
                                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm">
                                    {error}
                                </div>
                            )}

                            <button
                                onClick={handleSubmit}
                                disabled={loading || rating === 0}
                                className="w-full bg-rose-600 hover:bg-rose-500 text-white py-3 rounded-xl font-medium transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-rose-900/40"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span>Submitting...</span>
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-5 h-5" />
                                        <span>Submit Review</span>
                                    </>
                                )}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ReviewModal;

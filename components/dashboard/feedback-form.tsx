'use client';

import { useState } from 'react';
import { Star, Loader2, Send } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function FeedbackForm({ eventId, userId, existingFeedback }: { eventId: string, userId: string, existingFeedback?: any }) {
    const router = useRouter();
    const [rating, setRating] = useState(existingFeedback?.rating || 0);
    const [comment, setComment] = useState(existingFeedback?.comment || '');
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(!!existingFeedback);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (rating === 0) return;

        setLoading(true);
        try {
            const res = await fetch('/api/feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    eventId,
                    userId,
                    rating,
                    comment,
                    sentiment: rating >= 4 ? 'POSITIVE' : rating <= 2 ? 'NEGATIVE' : 'NEUTRAL'
                })
            });

            if (res.ok) {
                setSubmitted(true);
                router.refresh();
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <div className="bg-white/5 rounded-xl p-4 mt-4 border border-white/10">
                <div className="flex items-center gap-2 mb-2 text-green-400">
                    <span className="font-semibold">Feedback Submitted</span>
                </div>
                <div className="flex gap-1 mb-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                            key={star}
                            className={`w-4 h-4 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-600'}`}
                        />
                    ))}
                </div>
                <p className="text-gray-400 text-sm italic">"{comment}"</p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="mt-4 pt-4 border-t border-white/10">
            <h4 className="text-sm font-semibold text-gray-300 mb-3">Rate this event</h4>

            <div className="flex gap-2 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className="focus:outline-none transition-transform hover:scale-110"
                    >
                        <Star
                            className={`w-6 h-6 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-600 hover:text-yellow-400'}`}
                        />
                    </button>
                ))}
            </div>

            <div className="flex gap-2">
                <input
                    type="text"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Share your experience..."
                    className="flex-1 bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                    required
                />
                <button
                    type="submit"
                    disabled={loading || rating === 0}
                    className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
            </div>
        </form>
    );
}

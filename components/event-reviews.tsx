import { Star, User } from 'lucide-react';

interface Feedback {
    id: string;
    rating: number;
    comment: string;
    createdAt: Date;
    user: {
        name: string | null;
    };
}

export function EventReviews({ feedbacks }: { feedbacks: Feedback[] }) {
    if (feedbacks.length === 0) {
        return null;
    }

    const averageRating = feedbacks.reduce((acc, f) => acc + f.rating, 0) / feedbacks.length;

    return (
        <div className="mt-12 pt-12 border-t border-white/10">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-3xl font-bold mb-2">User Reviews</h2>
                    <div className="flex items-center gap-4 text-gray-400">
                        <div className="flex gap-1 text-yellow-400">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                    key={star}
                                    className={`w-5 h-5 ${star <= Math.round(averageRating) ? 'fill-current' : 'text-gray-600'}`}
                                />
                            ))}
                        </div>
                        <span className="text-lg font-semibold">{averageRating.toFixed(1)} / 5.0</span>
                        <span>•</span>
                        <span>{feedbacks.length} {feedbacks.length === 1 ? 'review' : 'reviews'}</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {feedbacks.map((feedback) => (
                    <div key={feedback.id} className="glass p-6 rounded-2xl bg-white/5 border border-white/10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                                <User className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <div className="font-semibold text-white">{feedback.user.name || 'Anonymous'}</div>
                                <div className="text-xs text-gray-500">{new Date(feedback.createdAt).toLocaleDateString()}</div>
                            </div>
                            <div className="ml-auto flex gap-0.5">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                        key={star}
                                        className={`w-3 h-3 ${star <= feedback.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-600'}`}
                                    />
                                ))}
                            </div>
                        </div>
                        <p className="text-gray-300 italic leading-relaxed">
                            "{feedback.comment}"
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}

import { Star, MessageSquare, Calendar } from 'lucide-react';

interface Review {
    id: string;
    rating: number;
    comment: string;
    createdAt: Date;
    event: {
        title: string;
    };
}

export function UserReviewsList({ reviews }: { reviews: Review[] }) {
    if (reviews.length === 0) {
        return (
            <div className="glass p-8 rounded-2xl text-center">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-500" />
                <h3 className="text-xl font-semibold mb-2">No reviews yet</h3>
                <p className="text-gray-400">Share your experiences from events you've attended!</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reviews.map((review) => (
                <div key={review.id} className="glass p-6 rounded-2xl">
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="font-bold text-lg">{review.event.title}</h4>
                        <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                    key={star}
                                    className={`w-4 h-4 ${star <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-600'}`}
                                />
                            ))}
                        </div>
                    </div>
                    <p className="text-gray-300 mb-4 italic">"{review.comment}"</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Calendar className="w-3 h-3" />
                        {new Date(review.createdAt).toLocaleDateString()}
                    </div>
                </div>
            ))}
        </div>
    );
}

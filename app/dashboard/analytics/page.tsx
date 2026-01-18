'use client';

import { useEffect, useState } from 'react';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { useSearchParams, useRouter } from 'next/navigation';
import { TrendingUp, Users, DollarSign, Brain, Loader2, ArrowLeft, Target, Lightbulb } from 'lucide-react';

interface AnalyticsData {
    metrics: {
        totalBookings: number;
        revenue: number;
        averagePrice: number;
        occupancyRate: number;
        cancellationRate: number;
    };
    demographics: {
        cities: Record<string, number>;
        interests: Record<string, number>;
    };
    recommendations: string[];
    sentimentSummary: {
        positive: number;
        neutral: number;
        negative: number;
        averageRating: number;
    };
}

// ... imports

export const dynamic = 'force-dynamic';

export default function AnalyticsPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const eventId = searchParams.get('eventId');

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);

    useEffect(() => {
        if (!eventId) {
            router.push('/');
            return;
        }

        fetchAnalytics();
    }, [eventId]);

    const fetchAnalytics = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/organizer/insights', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ eventId }),
            });
            const data = await res.json();

            if (data.success) {
                setAnalytics(data.insights);
            } else {
                setError(data.error || 'Failed to load analytics');
            }
        } catch (err) {
            console.error(err);
            setError('Failed to load analytics. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Navbar />
            <div className="min-h-screen pt-20 pb-10 px-4 max-w-7xl mx-auto">
                <div className="mb-8">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Dashboard
                    </button>
                    <div className="flex items-center gap-3">
                        <Brain className="w-10 h-10 text-purple-400" />
                        <div>
                            <h1 className="text-4xl font-bold">AI Analytics</h1>
                            <p className="text-gray-400">Powered by Groq LLaMA 3.3</p>
                        </div>
                    </div>
                </div>

                {loading && (
                    <div className="glass p-12 rounded-2xl flex flex-col items-center justify-center">
                        <Loader2 className="w-12 h-12 animate-spin text-purple-400 mb-4" />
                        <p className="text-gray-400">AI is analyzing your event data...</p>
                    </div>
                )}

                {error && (
                    <div className="glass p-8 rounded-2xl border border-red-500/50">
                        <p className="text-red-400">{error}</p>
                        <button
                            onClick={fetchAnalytics}
                            className="mt-4 px-4 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 transition-colors"
                        >
                            Retry
                        </button>
                    </div>
                )}

                {!loading && !error && analytics && (
                    <div className="space-y-6">
                        {/* Performance Metrics */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div className="glass p-6 rounded-2xl">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="text-sm text-gray-400">Total Bookings</div>
                                    <Users className="w-5 h-5 text-green-400" />
                                </div>
                                <div className="text-3xl font-bold text-green-400">
                                    {analytics.metrics.totalBookings}
                                </div>
                            </div>
                            <div className="glass p-6 rounded-2xl">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="text-sm text-gray-400">Total Revenue</div>
                                    <DollarSign className="w-5 h-5 text-purple-400" />
                                </div>
                                <div className="text-3xl font-bold text-purple-400">
                                    ${analytics.metrics.revenue.toLocaleString()}
                                </div>
                            </div>
                            <div className="glass p-6 rounded-2xl">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="text-sm text-gray-400">Avg Ticket Price</div>
                                    <TrendingUp className="w-5 h-5 text-blue-400" />
                                </div>
                                <div className="text-3xl font-bold text-blue-400">
                                    ${analytics.metrics.averagePrice.toFixed(0)}
                                </div>
                            </div>
                            <div className="glass p-6 rounded-2xl">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="text-sm text-gray-400">Occupancy Rate</div>
                                    <Target className="w-5 h-5 text-yellow-400" />
                                </div>
                                <div className="text-3xl font-bold text-yellow-400">
                                    {analytics.metrics.occupancyRate.toFixed(1)}%
                                </div>
                            </div>
                        </div>

                        {/* Sentiment Summary */}
                        <div className="glass p-8 rounded-2xl">
                            <div className="flex items-center gap-2 mb-4">
                                <Brain className="w-6 h-6 text-purple-400" />
                                <h2 className="text-2xl font-bold">Feedback Summary</h2>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                    <div className="text-sm text-gray-400">Average Rating</div>
                                    <div className="text-2xl font-bold text-yellow-400">
                                        {analytics.sentimentSummary.averageRating.toFixed(1)}/5
                                    </div>
                                </div>
                                <div>
                                    <div className="text-sm text-gray-400">Positive</div>
                                    <div className="text-2xl font-bold text-green-400">
                                        {analytics.sentimentSummary.positive}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-sm text-gray-400">Neutral</div>
                                    <div className="text-2xl font-bold text-gray-400">
                                        {analytics.sentimentSummary.neutral}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-sm text-gray-400">Negative</div>
                                    <div className="text-2xl font-bold text-red-400">
                                        {analytics.sentimentSummary.negative}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Demographics */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="glass p-6 rounded-2xl">
                                <h3 className="text-xl font-bold mb-4">Top Cities</h3>
                                <div className="space-y-3">
                                    {Object.entries(analytics.demographics.cities)
                                        .sort(([, a], [, b]) => b - a)
                                        .slice(0, 5)
                                        .map(([city, count], i) => (
                                            <div key={i} className="flex items-center justify-between">
                                                <span className="text-gray-300">{city}</span>
                                                <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-sm font-semibold">
                                                    {count} attendees
                                                </span>
                                            </div>
                                        ))}
                                </div>
                            </div>
                            <div className="glass p-6 rounded-2xl">
                                <h3 className="text-xl font-bold mb-4">Top Interests</h3>
                                <div className="space-y-3">
                                    {Object.entries(analytics.demographics.interests)
                                        .sort(([, a], [, b]) => b - a)
                                        .slice(0, 5)
                                        .map(([interest, count], i) => (
                                            <div key={i} className="flex items-center justify-between">
                                                <span className="text-gray-300">{interest}</span>
                                                <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-sm font-semibold">
                                                    {count} attendees
                                                </span>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        </div>

                        {/* AI Recommendations */}
                        <div className="glass p-8 rounded-2xl border-2 border-purple-500/30">
                            <div className="flex items-center gap-2 mb-6">
                                <Lightbulb className="w-6 h-6 text-purple-400" />
                                <h2 className="text-2xl font-bold">AI Strategic Recommendations</h2>
                            </div>
                            <div className="space-y-4">
                                {analytics.recommendations.map((rec, i) => (
                                    <div key={i} className="p-4 bg-purple-500/10 rounded-lg border border-purple-500/20">
                                        <div className="flex items-start gap-3">
                                            <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                                                <span className="text-purple-300 font-bold">{i + 1}</span>
                                            </div>
                                            <p className="text-gray-200 text-lg">{rec}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <Footer />
        </>
    );
}

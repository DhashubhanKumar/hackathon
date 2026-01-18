'use client';

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { useRouter } from 'next/navigation';
import { Loader2, Sparkles, Calendar, MapPin, Ticket, ArrowRight, Brain, Zap } from 'lucide-react';
import { GlassCard } from '@/components/ui/glass-card';
import Link from 'next/link';
import { useAuth } from '@/components/auth-provider';

interface RecommendedEvent {
    id: string;
    title: string;
    description: string;
    startDate: string;
    location: string;
    basePrice: number;
    imageUrl?: string;
    matchScore: number;
    matchReason: string;
}

export const dynamic = 'force-dynamic';

export default function RecommendationsPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [events, setEvents] = useState<RecommendedEvent[]>([]);
    const [error, setError] = useState('');

    useEffect(() => {
        let isMounted = true;
        const checkAuthAndFetch = async () => {
            // Try to get user ID from various sources
            let userId = user?.id;

            if (!userId) {
                // Fallback to local storage if context isn't ready
                const storedData = localStorage.getItem('user_data');
                if (storedData) {
                    try {
                        const parsed = JSON.parse(storedData);
                        userId = parsed.id;
                    } catch (e) {
                        console.error('Error parsing stored user data', e);
                    }
                }
            }

            if (!userId) {
                // Determine if we should wait or redirect
                // For now, let's give a small grace period or just redirect if absolutely nothing found
                // But since we are likely client-side navigating, if useAuth is null and localstorage is null, we are logged out.

                // One final check: URL param?
                const params = new URLSearchParams(window.location.search);
                const paramId = params.get('userId');
                if (paramId) userId = paramId;
            }

            if (userId) {
                console.log("Found userId:", userId);
                await fetchRecommendations(userId);
            } else {
                console.log("No userId found, attempting redirect...");
                // If we really can't find a user, redirect to login
                // but wait a moment to ensure hydration isn't just slow
                const timer = setTimeout(() => {
                    if (!isMounted) return;

                    const freshUser = localStorage.getItem('user_data');
                    if (!freshUser) {
                        setLoading(false); // Stop loading before redirecting so user doesn't see broken state
                        router.push('/login?redirect=/recommendations');
                    } else {
                        // recovered
                        const p = JSON.parse(freshUser);
                        if (p.id) fetchRecommendations(p.id);
                    }
                }, 1000);
                return () => clearTimeout(timer);
            }
        };

        checkAuthAndFetch();

        return () => { isMounted = false; };
    }, [user, router]); // Re-run if user context updates

    const fetchRecommendations = async (userId: string) => {
        setLoading(true);
        setError('');

        try {
            // Safety timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

            const res = await fetch('/api/recommendations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!res.ok) {
                throw new Error(`Server responded with ${res.status}`);
            }

            const data = await res.json();

            if (data.success) {
                setEvents(data.recommendations);
            } else {
                setError(data.error || 'Failed to load recommendations');
            }
        } catch (err: any) {
            console.error(err);
            if (err.name === 'AbortError') {
                setError('Request timed out. The AI is taking longer than expected.');
            } else {
                setError('Unable to fetch recommendations. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleRetry = () => {
        const userData = localStorage.getItem('user_data');
        if (userData) {
            try {
                const parsed = JSON.parse(userData);
                if (parsed.id) fetchRecommendations(parsed.id);
            } catch (e) { }
        } else {
            window.location.reload();
        }
    };

    return (
        <>
            <Navbar />

            <div className="relative min-h-screen pt-20 pb-10 px-4">
                {/* Background Ambient */}
                <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-purple-900/20 to-transparent pointer-events-none" />

                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="text-center mb-12">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 mb-6 animate-pulse">
                            <Brain className="w-4 h-4" />
                            <span className="text-sm font-semibold">Powered by Groq AI</span>
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black mb-6 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400">
                            Curated For You
                        </h1>
                        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                            Events you are most likely to love based on your unique interests.
                        </p>
                    </div>

                    {loading && (
                        <div className="flex flex-col items-center justify-center py-20">
                            <div className="relative">
                                <div className="absolute inset-0 bg-purple-500 blur-xl opacity-20 animate-pulse" />
                                <Loader2 className="w-16 h-16 animate-spin text-purple-400 relative z-10" />
                            </div>
                            <p className="mt-8 text-lg text-gray-400 animate-pulse">
                                AI is analyzing 1,000+ data points...
                            </p>
                        </div>
                    )}

                    {error && (
                        <div className="flex flex-col items-center justify-center py-10">
                            <div className="p-6 bg-red-500/10 border border-red-500/30 rounded-xl max-w-md text-center">
                                <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                                <h3 className="text-xl font-bold text-red-400 mb-2">Oops! Something went wrong</h3>
                                <p className="text-gray-300 mb-6">{error}</p>
                                <button
                                    onClick={handleRetry}
                                    className="px-6 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-200 rounded-lg transition-colors flex items-center gap-2 mx-auto"
                                >
                                    <RefreshCcw className="w-4 h-4" />
                                    Try Again
                                </button>
                            </div>
                        </div>
                    )}

                    {!loading && !error && events.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {events.map((event, index) => (
                                <Link href={`/events/${event.id}`} key={event.id} className="group block h-full">
                                    <GlassCard hoverEffect className="h-full flex flex-col overflow-hidden p-0 border-purple-500/20 relative">

                                        {/* Highlighted Match Badge - 65% more likely logic */}
                                        <div className="absolute top-0 left-0 w-full z-20 bg-gradient-to-r from-purple-600 to-blue-600 py-1 flex items-center justify-center shadow-lg transform -translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                                            <span className="text-xs font-bold text-white flex items-center gap-1">
                                                <Zap className="w-3 h-3 text-yellow-300" />
                                                {event.matchScore}% More Likely to Match Your Interests
                                            </span>
                                        </div>

                                        {/* Standard Badge */}
                                        <div className="absolute top-4 right-4 z-20">
                                            <div className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-purple-500/50 flex items-center gap-2 shadow-lg shadow-purple-500/20 group-hover:border-purple-400 transition-colors">
                                                <Sparkles className="w-3 h-3 text-purple-400" />
                                                <span className="text-xs font-bold text-white">
                                                    {event.matchScore}% Match
                                                </span>
                                            </div>
                                        </div>

                                        <div className="relative h-48 overflow-hidden">
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent z-10" />
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={event.imageUrl || 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30'}
                                                alt={event.title}
                                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                            />
                                        </div>

                                        <div className="p-6 flex-1 flex flex-col">
                                            {/* AI Reasoning - Highlighted */}
                                            <div className="mb-4 p-3 rounded-lg bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30 group-hover:border-purple-500/50 transition-colors">
                                                <p className="text-xs text-purple-100 font-medium italic leading-relaxed">
                                                    "{event.matchReason}"
                                                </p>
                                            </div>

                                            <h3 className="text-xl font-bold mb-2 group-hover:text-purple-400 transition-colors">
                                                {event.title}
                                            </h3>

                                            <div className="mt-auto space-y-3 pt-4">
                                                <div className="flex items-center text-sm text-gray-400">
                                                    <Calendar className="w-4 h-4 mr-2 text-purple-400" />
                                                    {new Date(event.startDate).toLocaleDateString()}
                                                </div>
                                                <div className="flex items-center text-sm text-gray-400">
                                                    <MapPin className="w-4 h-4 mr-2 text-pink-400" />
                                                    {event.location}
                                                </div>

                                                <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-2">
                                                    <div className="flex items-center text-green-400 font-bold">
                                                        <Ticket className="w-4 h-4 mr-2" />
                                                        ${event.basePrice}
                                                    </div>
                                                    <span className="text-xs flex items-center text-white/40 group-hover:text-white transition-colors">
                                                        View Details <ArrowRight className="w-3 h-3 ml-1" />
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </GlassCard>
                                </Link>
                            ))}
                        </div>
                    )}

                    {!loading && !error && events.length === 0 && (
                        <div className="text-center py-20">
                            <p className="text-2xl text-gray-500 mb-4">No recommendations found just yet.</p>
                            <Link href="/dashboard/profile" className="text-purple-400 hover:text-purple-300 underline">
                                Update your interests to get better matches matches!
                            </Link>
                        </div>
                    )}
                </div>
            </div>
            <Footer />
        </>
    );
}

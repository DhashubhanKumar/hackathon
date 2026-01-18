'use client';

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { useRouter } from 'next/navigation';
import { Loader2, Sparkles, Calendar, MapPin, Ticket, ArrowRight, Brain } from 'lucide-react';
import { GlassCard } from '@/components/ui/glass-card';
import Link from 'next/link';

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

export default function RecommendationsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [events, setEvents] = useState<RecommendedEvent[]>([]);

    useEffect(() => {
        // Simple auth check
        const userData = localStorage.getItem('user_data');
        if (!userData) {
            router.push('/login?redirect=/recommendations');
            return;
        }

        const user = JSON.parse(userData);
        // We assume we have a way to get ID, if not in localStorage try to fetch by email or use a dummy flow.
        // For this demo, let's assume the user object in localStorage has an ID or we fetch it.
        // Actually, the previous 'Edit Profile' used searchParams userId. 
        // We should try to get userId from url or localStorage.

        // Let's rely on the URL param if present, or localStorage if stored there.
        // For robustness, I'll fetch recommendations using the user's ID if available. 
        // If the localStorage user object doesn't have ID, we might need to fetch it first.
        // But let's assume one is available for now. 
        // Ideally: window.location.search has userId or we stored it.

        const storedUserId = localStorage.getItem('user_id') || user.id;

        if (storedUserId) {
            fetchRecommendations(storedUserId);
        } else {
            // Fallback: If we only have email, usually we'd need to look it up.
            // For now, let's redirect to login if no ID found.
            router.push('/login');
        }

    }, []);

    const fetchRecommendations = async (userId: string) => {
        try {
            const res = await fetch('/api/recommendations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId }),
            });
            const data = await res.json();

            if (data.success) {
                setEvents(data.recommendations);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
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
                            We've analyzed your interests and history to find these perfect matches.
                        </p>
                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <div className="relative">
                                <div className="absolute inset-0 bg-purple-500 blur-xl opacity-20 animate-pulse" />
                                <Loader2 className="w-16 h-16 animate-spin text-purple-400 relative z-10" />
                            </div>
                            <p className="mt-8 text-lg text-gray-400 animate-pulse">
                                AI is analyzing 1,000+ data points...
                            </p>
                        </div>
                    ) : events.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {events.map((event, index) => (
                                <Link href={`/events/${event.id}`} key={event.id} className="group block h-full">
                                    <GlassCard hoverEffect className="h-full flex flex-col overflow-hidden p-0 border-purple-500/20">
                                        {/* AI Match Badge */}
                                        <div className="absolute top-4 right-4 z-20">
                                            <div className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-purple-500/50 flex items-center gap-2 shadow-lg shadow-purple-500/20">
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
                                            {/* AI Reasoning */}
                                            <div className="mb-4 p-3 rounded-lg bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20">
                                                <p className="text-xs text-purple-200 italic leading-relaxed">
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
                    ) : (
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

'use client';

import { useState } from 'react';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { GlassCard } from '@/components/ui/glass-card';
import { Search, Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function AISearchPage() {
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [results, setResults] = useState<any[]>([]);
    const [searched, setSearched] = useState(false);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        setLoading(true);
        setSearched(true);

        try {
            const res = await fetch('/api/ai-search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query }),
            });
            const data = await res.json();
            setResults(data.events || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Navbar />
            <div className="min-h-screen pt-24 px-4 max-w-5xl mx-auto">
                <div className="text-center mb-12">
                    <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400 mb-4">
                        Find Your Vibe
                    </h1>
                    <p className="text-lg text-gray-400">
                        Tell our AI what you're looking for (e.g., "Something chill with simplified music this weekend")
                    </p>
                </div>

                <GlassCard className="mb-12">
                    <form onSubmit={handleSearch} className="relative">
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Describe your perfect event..."
                            className="w-full bg-black/20 border border-white/10 rounded-full py-4 pl-6 pr-14 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                        />
                        <button
                            type="submit"
                            disabled={loading}
                            className="absolute right-2 top-2 p-2 bg-indigo-600 rounded-full hover:bg-indigo-500 transition-colors disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                        </button>
                    </form>
                </GlassCard>

                {loading && (
                    <div className="glass p-12 rounded-2xl flex flex-col items-center justify-center">
                        <Loader2 className="w-12 h-12 animate-spin text-indigo-400 mb-4" />
                        <p className="text-gray-400">AI is searching for perfect matches...</p>
                    </div>
                )}

                {!loading && searched && (
                    <div className="space-y-6">
                        {results.length > 0 ? (
                            <>
                                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                                    <span className="text-indigo-400">✨</span> AI Recommendations
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {results.map((event) => (
                                        <Link
                                            key={event.id}
                                            href={`/events/${event.id}`}
                                            className="group relative block"
                                        >
                                            <GlassCard hoverEffect className="h-full border-l-4 border-l-indigo-500 transition-all group-hover:border-l-indigo-400">
                                                <h3 className="text-xl font-bold mb-2 group-hover:text-indigo-400 transition-colors">{event.title}</h3>
                                                <p className="text-gray-400 text-sm mb-4 line-clamp-2">{event.description}</p>
                                                <div className="text-xs text-indigo-300 font-mono uppercase tracking-widest mb-3">
                                                    ✨ {event.matchReason}
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-indigo-400 font-semibold">
                                                    View Event
                                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                                </div>
                                            </GlassCard>
                                        </Link>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <div className="glass p-12 rounded-2xl text-center">
                                <div className="text-6xl mb-4">🔍</div>
                                <h2 className="text-2xl font-bold mb-2">NO MATCHES FOUND</h2>
                                <p className="text-gray-400 mb-6">
                                    We couldn't find any events matching "{query}"
                                </p>
                                <p className="text-sm text-gray-500">
                                    Try different keywords or browse all events on the homepage
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>
            <Footer />
        </>
    );
}

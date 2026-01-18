'use client';

import { useEffect, useState, Suspense } from 'react';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { useSearchParams, useRouter } from 'next/navigation';
import { DollarSign, TrendingUp, Brain, Loader2, ArrowLeft, Save } from 'lucide-react';

interface PricingSuggestion {
    currentPrice: number;
    suggestedPrice: number;
    reasoning: string;
    confidence: number;
    shouldAdjust: boolean;
}

export const dynamic = 'force-dynamic';

function PricingContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const eventId = searchParams.get('eventId');

    const [loading, setLoading] = useState(true); // Initial page loading
    const [aiLoading, setAiLoading] = useState(false); // AI specific loading
    const [suggestion, setSuggestion] = useState<PricingSuggestion | null>(null);
    const [currentPrice, setCurrentPrice] = useState(0);
    const [manualPrice, setManualPrice] = useState('');
    const [message, setMessage] = useState('');
    const [pricingMode, setPricingMode] = useState<'MANUAL' | 'AUTOMATIC'>('MANUAL');
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');

    useEffect(() => {
        if (!eventId) {
            router.push('/dashboard/organizer');
            return;
        }

        // Fetch initial data immediately
        const initData = async () => {
            setLoading(true);
            await fetchEventData();
            setLoading(false);

            // Then fetch AI in background
            fetchSuggestion();
        };

        initData();
    }, [eventId]);

    const fetchEventData = async () => {
        try {
            const res = await fetch(`/api/events/${eventId}`);
            const data = await res.json();

            if (data.event) {
                const price = data.event.basePrice || 0;
                setCurrentPrice(price);
                setManualPrice(price.toString());
                setPricingMode(data.event.pricingMode || 'MANUAL');
                setMinPrice(data.event.minPrice?.toString() || '');
                setMaxPrice(data.event.maxPrice?.toString() || '');
            }
        } catch (err) {
            console.error('Failed to fetch event data:', err);
        }
    };

    const fetchSuggestion = async () => {
        setAiLoading(true);
        try {
            const res = await fetch('/api/pricing/suggest', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ eventId }),
            });
            const data = await res.json();

            if (data.success) {
                setSuggestion(data.suggestion);
                // Only update min/max if not already set
                if (!minPrice && !maxPrice) {
                    setMinPrice((data.suggestion.suggestedPrice * 0.9).toFixed(0));
                    setMaxPrice((data.suggestion.suggestedPrice * 1.1).toFixed(0));
                }
            }
        } catch (err) {
            console.error(err);
        } finally {
            setAiLoading(false);
        }
    };

    const handleManualUpdate = async () => {
        const newPrice = parseFloat(manualPrice);
        if (isNaN(newPrice) || newPrice <= 0) {
            setMessage('❌ Please enter a valid price');
            return;
        }

        setLoading(true);
        setMessage('');
        try {
            const res = await fetch('/api/pricing/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    eventId,
                    newPrice,
                    reason: 'Manual price update by organizer',
                }),
            });
            const data = await res.json();

            if (data.success) {
                setCurrentPrice(newPrice);
                setMessage('✅ Price updated successfully!');
                fetchSuggestion();
            } else {
                setMessage('❌ Failed to update price');
            }
        } catch (err) {
            console.error(err);
            setMessage('❌ Failed to update price');
        } finally {
            setLoading(false);
        }
    };

    const handleAutomaticMode = async () => {
        const min = parseFloat(minPrice);
        const max = parseFloat(maxPrice);

        if (isNaN(min) || min <= 0 || isNaN(max) || max <= 0) {
            setMessage('❌ Please enter valid min and max prices');
            return;
        }

        if (min >= max) {
            setMessage('❌ Minimum price must be less than maximum price');
            return;
        }

        setLoading(true);
        setMessage('');
        try {
            // First update mode and range
            const res = await fetch('/api/pricing/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    eventId,
                    pricingMode: 'AUTOMATIC',
                    minPrice: min,
                    maxPrice: max,
                    reason: 'Enabled automatic pricing with range',
                }),
            });
            const data = await res.json();

            if (data.success) {
                setPricingMode('AUTOMATIC');

                // Calculate and apply immediate price update
                const aiPrice = suggestion?.suggestedPrice || currentPrice;
                const clampedPrice = Math.max(min, Math.min(max, aiPrice));

                // Only update price if it's different
                if (clampedPrice !== currentPrice) {
                    const priceRes = await fetch('/api/pricing/update', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            eventId,
                            newPrice: clampedPrice,
                            reason: 'Automatic adjustment to stay within range',
                        }),
                    });

                    if (priceRes.ok) {
                        setCurrentPrice(clampedPrice);
                        setManualPrice(clampedPrice.toString());
                        setMessage(`✅ Automatic pricing active! Adjusted to $${clampedPrice.toFixed(0)}`);
                    } else {
                        setMessage('✅ Automatic pricing enabled, but failed to update price.');
                    }
                } else {
                    setMessage('✅ Automatic pricing enabled! Price is within range.');
                }
            } else {
                setMessage('❌ Failed to enable automatic pricing');
            }
        } catch (err) {
            console.error(err);
            setMessage('❌ Failed to enable automatic pricing');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Navbar />
            <div className="min-h-screen pt-20 pb-10 px-4 max-w-5xl mx-auto">
                <div className="mb-8">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Dashboard
                    </button>
                    <h1 className="text-4xl font-bold mb-2">💡 AI Pricing Insights</h1>
                    <p className="text-gray-400">Smart recommendations to optimize your ticket pricing</p>
                </div>

                {/* Current Price */}
                <div className="glass p-8 rounded-2xl mb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm text-gray-400 mb-2">Your Current Ticket Price</div>
                            <div className="text-5xl font-bold text-green-400">${currentPrice.toFixed(0)}</div>
                        </div>
                        <DollarSign className="w-16 h-16 text-green-400/50" />
                    </div>
                </div>

                {aiLoading && (
                    <div className="glass p-12 rounded-2xl flex flex-col items-center justify-center">
                        <Loader2 className="w-12 h-12 animate-spin text-purple-400 mb-4" />
                        <p className="text-gray-400">AI is analyzing your event...</p>
                    </div>
                )}

                {/* AI Insights */}
                {!aiLoading && suggestion && (
                    <div className="space-y-6">
                        {/* Main Recommendation */}
                        <div className="glass p-8 rounded-2xl border-2 border-purple-500/30">
                            <div className="flex items-center gap-3 mb-6">
                                <Brain className="w-10 h-10 text-purple-400" />
                                <div>
                                    <h2 className="text-3xl font-bold">AI Recommendation</h2>
                                    <p className="text-sm text-gray-400">Based on market analysis</p>
                                </div>
                            </div>

                            {/* Simple Price Comparison */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                <div className="text-center p-8 bg-gradient-to-br from-blue-500/20 to-blue-600/10 rounded-2xl border border-blue-500/30">
                                    <div className="text-sm text-blue-300 mb-2">Current Price</div>
                                    <div className="text-5xl font-bold text-white mb-2">
                                        ${currentPrice.toFixed(0)}
                                    </div>
                                    <div className="text-xs text-gray-400">What you're charging now</div>
                                </div>
                                <div className="text-center p-8 bg-gradient-to-br from-purple-500/20 to-purple-600/10 rounded-2xl border border-purple-500/30">
                                    <div className="text-sm text-purple-300 mb-2">AI Suggests</div>
                                    <div className="text-5xl font-bold text-purple-400 mb-2">
                                        ${suggestion.suggestedPrice.toFixed(0)}
                                    </div>
                                    <div className={`text-lg font-semibold ${suggestion.suggestedPrice > currentPrice ? 'text-green-400' : 'text-red-400'
                                        }`}>
                                        {suggestion.suggestedPrice > currentPrice ? '↗' : '↘'}
                                        {suggestion.suggestedPrice > currentPrice ? ' Increase by ' : ' Decrease by '}
                                        ${Math.abs(suggestion.suggestedPrice - currentPrice).toFixed(0)}
                                    </div>
                                </div>
                            </div>

                            {/* Suggested Range */}
                            <div className="p-6 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-xl mb-6 border border-purple-500/20">
                                <h3 className="text-lg font-bold mb-4 text-center">📊 Recommended Price Range</h3>
                                <div className="flex items-center justify-center gap-6">
                                    <div className="text-center">
                                        <div className="text-xs text-gray-400 mb-1">Low</div>
                                        <div className="text-2xl font-bold text-blue-400">
                                            ${(suggestion.suggestedPrice * 0.9).toFixed(0)}
                                        </div>
                                    </div>
                                    <div className="text-gray-500 text-2xl">→</div>
                                    <div className="text-center">
                                        <div className="text-xs text-purple-300 mb-1">Sweet Spot</div>
                                        <div className="text-3xl font-bold text-purple-400">
                                            ${suggestion.suggestedPrice.toFixed(0)}
                                        </div>
                                    </div>
                                    <div className="text-gray-500 text-2xl">→</div>
                                    <div className="text-center">
                                        <div className="text-xs text-gray-400 mb-1">High</div>
                                        <div className="text-2xl font-bold text-green-400">
                                            ${(suggestion.suggestedPrice * 1.1).toFixed(0)}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Why This Price? */}
                            <div className="p-6 bg-black/30 rounded-xl border border-white/10">
                                <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
                                    <span className="text-2xl">🤔</span>
                                    Why This Price?
                                </h3>
                                <p className="text-gray-300 text-lg leading-relaxed mb-4">
                                    {suggestion.reasoning}
                                </p>
                                <div className="flex items-center gap-2 text-sm">
                                    <div className="px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
                                        {(suggestion.confidence * 100).toFixed(0)}% Confidence
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* What Affects Price */}
                        <div className="glass p-6 rounded-2xl">
                            <h2 className="text-2xl font-bold mb-4">🎯 What We Look At</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 bg-blue-500/10 rounded-lg">
                                    <div className="font-semibold text-blue-300 mb-1">📈 Demand</div>
                                    <p className="text-sm text-gray-400">How fast tickets are selling</p>
                                </div>
                                <div className="p-4 bg-green-500/10 rounded-lg">
                                    <div className="font-semibold text-green-300 mb-1">🎟️ Seats Left</div>
                                    <p className="text-sm text-gray-400">How many tickets remain</p>
                                </div>
                                <div className="p-4 bg-yellow-500/10 rounded-lg">
                                    <div className="font-semibold text-yellow-300 mb-1">⏰ Time Left</div>
                                    <p className="text-sm text-gray-400">Days until your event</p>
                                </div>
                                <div className="p-4 bg-purple-500/10 rounded-lg">
                                    <div className="font-semibold text-purple-300 mb-1">📊 History</div>
                                    <p className="text-sm text-gray-400">Past booking patterns</p>
                                </div>
                            </div>
                        </div>

                        {/* Simple Tip */}
                        <div className="glass p-6 rounded-xl border border-green-500/30 bg-green-500/5">
                            <div className="flex items-start gap-3">
                                <div className="text-3xl">💡</div>
                                <div>
                                    <h3 className="font-bold text-green-300 mb-2 text-lg">Quick Tip</h3>
                                    <p className="text-gray-300">
                                        {suggestion.suggestedPrice > currentPrice
                                            ? "Demand is high! Consider raising your price to maximize revenue."
                                            : "Demand is steady. Current pricing looks good, or you could lower slightly to boost sales."}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Pricing Mode Tabs */}
                        <div className="glass p-8 rounded-2xl border-2 border-blue-500/30">
                            <h2 className="text-2xl font-bold mb-6">⚙️ Pricing Control</h2>

                            {/* Tab Buttons */}
                            <div className="flex gap-4 mb-6">
                                <button
                                    onClick={() => setPricingMode('MANUAL')}
                                    className={`flex-1 px-6 py-4 rounded-lg font-semibold transition-all ${pricingMode === 'MANUAL'
                                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                                        : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                        }`}
                                >
                                    ✏️ Manual Mode
                                </button>
                                <button
                                    onClick={() => setPricingMode('AUTOMATIC')}
                                    className={`flex-1 px-6 py-4 rounded-lg font-semibold transition-all ${pricingMode === 'AUTOMATIC'
                                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                                        : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                        }`}
                                >
                                    🤖 Automatic Mode
                                </button>
                            </div>

                            {message && (
                                <div className={`p-4 rounded-lg mb-4 ${message.includes('✅')
                                    ? 'bg-green-500/20 border border-green-500/50 text-green-300'
                                    : 'bg-red-500/20 border border-red-500/50 text-red-300'
                                    }`}>
                                    {message}
                                </div>
                            )}

                            {/* Manual Mode Content */}
                            {pricingMode === 'MANUAL' && (
                                <div>
                                    <p className="text-gray-400 mb-6">
                                        You have full control. Set any price you want.
                                    </p>

                                    <div className="flex gap-4 mb-6">
                                        <div className="flex-1">
                                            <label className="block text-sm text-gray-400 mb-2">New Price ($)</label>
                                            <input
                                                type="number"
                                                value={manualPrice}
                                                onChange={(e) => setManualPrice(e.target.value)}
                                                step="1"
                                                min="0"
                                                className="w-full bg-black/30 border border-white/20 rounded-lg px-6 py-4 text-white text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder="2500"
                                            />
                                        </div>
                                        <div className="flex items-end">
                                            <button
                                                onClick={handleManualUpdate}
                                                disabled={loading}
                                                className="px-8 py-4 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 font-bold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {loading ? (
                                                    <Loader2 className="w-6 h-6 animate-spin" />
                                                ) : (
                                                    'Update Price'
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Quick Price Buttons */}
                                    <div>
                                        <div className="text-sm text-gray-400 mb-3">Quick Actions:</div>
                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => setManualPrice((suggestion?.suggestedPrice * 0.9).toFixed(0))}
                                                className="px-4 py-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 text-sm transition-all"
                                            >
                                                Set to Low (${(suggestion?.suggestedPrice || 0) * 0.9 && (suggestion!.suggestedPrice * 0.9).toFixed(0)})
                                            </button>
                                            <button
                                                onClick={() => setManualPrice(suggestion?.suggestedPrice.toFixed(0) || '')}
                                                className="px-4 py-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 text-sm transition-all"
                                            >
                                                Use AI Suggestion (${suggestion?.suggestedPrice.toFixed(0)})
                                            </button>
                                            <button
                                                onClick={() => setManualPrice((suggestion?.suggestedPrice * 1.1).toFixed(0))}
                                                className="px-4 py-2 rounded-lg bg-green-500/20 hover:bg-green-500/30 text-green-300 text-sm transition-all"
                                            >
                                                Set to High (${(suggestion?.suggestedPrice || 0) * 1.1 && (suggestion!.suggestedPrice * 1.1).toFixed(0)})
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Automatic Mode Content */}
                            {pricingMode === 'AUTOMATIC' && (
                                <div>
                                    <p className="text-gray-400 mb-4">
                                        AI will automatically adjust pricing based on demand. Set your price limits below.
                                    </p>

                                    {/* AI Suggested Range */}
                                    <div className="p-4 bg-purple-500/10 rounded-lg border border-purple-500/30 mb-6">
                                        <div className="flex items-start gap-2">
                                            <span className="text-xl">💡</span>
                                            <div className="text-sm">
                                                <strong className="text-purple-300">AI Suggests:</strong>
                                                <span className="text-gray-300"> Min: ${(suggestion?.suggestedPrice || 0) * 0.9 && (suggestion!.suggestedPrice * 0.9).toFixed(0)} - Max: ${(suggestion?.suggestedPrice || 0) * 1.1 && (suggestion!.suggestedPrice * 1.1).toFixed(0)}</span>
                                                <p className="text-gray-400 mt-1">You can adjust these values to your preference.</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                        <div>
                                            <label className="block text-sm text-gray-400 mb-2">Minimum Price ($)</label>
                                            <input
                                                type="number"
                                                value={minPrice}
                                                onChange={(e) => setMinPrice(e.target.value)}
                                                step="1"
                                                min="0"
                                                className="w-full bg-black/30 border border-white/20 rounded-lg px-6 py-4 text-white text-xl font-bold focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                placeholder="1500"
                                            />
                                            <p className="text-xs text-gray-500 mt-2">Lowest price AI can set</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm text-gray-400 mb-2">Maximum Price ($)</label>
                                            <input
                                                type="number"
                                                value={maxPrice}
                                                onChange={(e) => setMaxPrice(e.target.value)}
                                                step="1"
                                                min="0"
                                                className="w-full bg-black/30 border border-white/20 rounded-lg px-6 py-4 text-white text-xl font-bold focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                placeholder="3000"
                                            />
                                            <p className="text-xs text-gray-500 mt-2">Highest price AI can set</p>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleAutomaticMode}
                                        disabled={loading}
                                        className="w-full px-8 py-4 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 font-bold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {loading ? (
                                            <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                                        ) : (
                                            '🚀 Enable Automatic Pricing'
                                        )}
                                    </button>

                                    <div className="mt-6 p-4 bg-purple-500/10 rounded-lg border border-purple-500/30">
                                        <div className="flex items-start gap-2">
                                            <span className="text-xl">ℹ️</span>
                                            <div className="text-sm text-gray-300">
                                                <strong className="text-purple-300">How it works:</strong> AI monitors demand in real-time and adjusts your price automatically within your set range to maximize revenue.
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
            <Footer />
        </>
    );
}

export default function PricingInsightsPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-black"><Loader2 className="w-8 h-8 animate-spin text-purple-400" /></div>}>
            <PricingContent />
        </Suspense>
    );
}

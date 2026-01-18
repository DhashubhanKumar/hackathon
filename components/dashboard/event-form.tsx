'use client';

import { useState } from 'react';
import { GlassCard } from '@/components/ui/glass-card';
import { Loader2, DollarSign, Calendar, MapPin, Type, Image as ImageIcon, Sparkles, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { UploadButton } from '@/lib/uploadthing';

interface AdvisorReport {
    viabilityScore: number;
    pricingAdvice: string;
    timingAdvice: string;
    overallRecommendation: string;
}

export function EventForm() {
    const router = useRouter();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
    const [advice, setAdvice] = useState<AdvisorReport | null>(null);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        date: '',
        location: '',
        city: '',
        price: '',
        totalTickets: '',
        category: '',
        imageUrl: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user || !user.id) {
            alert('You must be logged in to create an event');
            return;
        }

        setLoading(true);

        try {
            const res = await fetch('/api/events', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    price: parseFloat(formData.price),
                    totalTickets: parseInt(formData.totalTickets),
                    organizerId: user.id, // Add the organizer ID
                }),
            });

            if (res.ok) {
                router.push('/dashboard');
                router.refresh();
            } else {
                const error = await res.json();
                alert(`Failed to create event: ${error.error || 'Unknown error'}`);
            }
        } catch (err) {
            console.error(err);
            alert('An error occurred while creating the event');
        } finally {
            setLoading(false);
        }
    };

    return (
        <GlassCard className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-6">Create New Event</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Event Title</label>
                    <div className="relative">
                        <Type className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                        <input
                            type="text"
                            name="title"
                            required
                            className="w-full bg-black/20 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            placeholder="e.g. Neon Nights Festival"
                            onChange={handleChange}
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Description</label>
                    <textarea
                        name="description"
                        required
                        rows={4}
                        className="w-full bg-black/20 border border-white/10 rounded-xl p-4 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        placeholder="Describe the experience..."
                        onChange={handleChange}
                    />
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Date & Time</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                            <input
                                type="datetime-local"
                                name="date"
                                required
                                min={new Date().toISOString().slice(0, 16)} // Set min date to now
                                className="w-full bg-black/20 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                onChange={(e) => {
                                    handleChange(e);
                                    if (new Date(e.target.value) <= new Date()) {
                                        e.target.setCustomValidity('Event date must be in the future');
                                    } else {
                                        e.target.setCustomValidity('');
                                    }
                                }}
                            />
                            {/* Visual Hint */}
                            <p className="text-xs text-gray-500 mt-1 ml-1">Must be a future date</p>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Location</label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                            <input
                                type="text"
                                name="location"
                                required
                                className="w-full bg-black/20 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                placeholder="Venue Name"
                                onChange={handleChange}
                            />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">City</label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                            <input
                                type="text"
                                name="city"
                                required
                                className="w-full bg-black/20 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                placeholder="e.g. New York"
                                onChange={handleChange}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Category</label>
                        <div className="relative">
                            <Type className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                            <select
                                name="category"
                                required
                                className="w-full bg-black/20 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 focus:ring-2 focus:ring-indigo-500 focus:outline-none appearance-none"
                                onChange={handleChange}
                                defaultValue=""
                            >
                                <option value="" disabled>Select Category</option>
                                <option value="Technology">Technology</option>
                                <option value="Music">Music</option>
                                <option value="Business">Business</option>
                                <option value="Sports">Sports</option>
                                <option value="Art">Art</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Price ($)</label>
                        <div className="relative">
                            <DollarSign className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                            <input
                                type="number"
                                name="price"
                                min="0"
                                step="0.01"
                                required
                                className="w-full bg-black/20 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                placeholder="0.00"
                                onChange={handleChange}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Total Tickets</label>
                        <input
                            type="number"
                            name="totalTickets"
                            min="1"
                            required
                            className="w-full bg-black/20 border border-white/10 rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            placeholder="e.g. 100"
                            onChange={handleChange}
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Event Image</label>
                    {formData.imageUrl ? (
                        <div className="relative rounded-xl overflow-hidden aspect-video mb-4 border border-white/10 group">
                            <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, imageUrl: '' })}
                                    className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="bg-black/20 border border-white/10 rounded-xl p-8 flex flex-col items-center justify-center hover:border-indigo-500/50 transition-colors">
                                <UploadButton
                                    endpoint="eventImage"
                                    onClientUploadComplete={(res) => {
                                        if (res && res[0]) {
                                            setFormData({ ...formData, imageUrl: res[0].url });
                                        }
                                    }}
                                    onUploadError={(error: Error) => {
                                        alert(`Upload failed: ${error.message}`);
                                    }}
                                    appearance={{
                                        button: "bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-4 py-2 rounded-lg transition-colors",
                                        allowedContent: "text-gray-400 text-sm"
                                    }}
                                />
                            </div>
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-white/10"></div>
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-2 bg-black text-gray-500">Or paste image URL</span>
                                </div>
                            </div>
                            <input
                                type="url"
                                placeholder="https://..."
                                className="w-full bg-black/20 border border-white/10 rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                value={formData.imageUrl}
                                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                            />
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-between gap-4 pt-4 border-t border-white/10">
                    <button
                        type="button"
                        onClick={async () => {
                            if (!formData.city || !formData.category || !formData.price) {
                                alert('Please fill in City, Category, and Price first');
                                return;
                            }
                            setAnalyzing(true);
                            try {
                                const res = await fetch('/api/events/advise', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify(formData)
                                });
                                const data = await res.json();
                                if (data.success) {
                                    setAdvice(data.advice);
                                }
                            } catch (e) {
                                console.error(e);
                            } finally {
                                setAnalyzing(false);
                            }
                        }}
                        disabled={analyzing}
                        className="flex-1 py-3 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 font-bold transition-all border border-purple-500/30 flex items-center justify-center gap-2"
                    >
                        {analyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                        Analyze Viability
                    </button>

                    <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Publish Event'}
                    </button>
                </div>

                {advice && (
                    <div className="mt-6 p-6 rounded-xl bg-gradient-to-br from-purple-900/40 to-blue-900/40 border border-purple-500/30 animate-in fade-in slide-in-from-bottom-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-yellow-400" /> AI Advisor Report
                            </h3>
                            <div className={`px-3 py-1 rounded-full text-sm font-bold ${advice.viabilityScore >= 80 ? 'bg-green-500/20 text-green-300' :
                                advice.viabilityScore >= 50 ? 'bg-yellow-500/20 text-yellow-300' : 'bg-red-500/20 text-red-300'
                                }`}>
                                Score: {advice.viabilityScore}/100
                            </div>
                        </div>

                        <div className="grid md:grid-cols-3 gap-6">
                            <div className="space-y-1">
                                <div className="text-xs text-purple-300 font-bold uppercase tracking-wider">Pricing</div>
                                <p className="text-sm text-gray-300 leading-relaxed">{advice.pricingAdvice}</p>
                            </div>
                            <div className="space-y-1">
                                <div className="text-xs text-purple-300 font-bold uppercase tracking-wider">Timing</div>
                                <p className="text-sm text-gray-300 leading-relaxed">{advice.timingAdvice}</p>
                            </div>
                            <div className="space-y-1">
                                <div className="text-xs text-purple-300 font-bold uppercase tracking-wider">Strategy</div>
                                <p className="text-sm text-gray-300 leading-relaxed">{advice.overallRecommendation}</p>
                            </div>
                        </div>
                    </div>
                )}
            </form>
        </GlassCard>
    );
}

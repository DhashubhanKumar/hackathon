'use client';

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { useRouter, useSearchParams } from 'next/navigation';
import { User, Save, Loader2, Plus, X, Tag } from 'lucide-react';

const COMMON_INTERESTS = [
    "Technology", "Music", "Art", "Business",
    "Startups", "AI", "Networking", "Food",
    "Sports", "Health", "Education", "Crypto"
];

// ... imports

export const dynamic = 'force-dynamic';

export default function ProfilePage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const userId = searchParams.get('userId');

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const [customInterest, setCustomInterest] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        city: '',
        interests: [] as string[],
    });

    useEffect(() => {
        if (!userId) {
            router.push('/login');
            return;
        }
        fetchUserData();
    }, [userId]);

    const fetchUserData = async () => {
        try {
            const res = await fetch(`/api/user/${userId}`);
            const data = await res.json();

            if (data.user) {
                setFormData({
                    name: data.user.name || '',
                    email: data.user.email || '',
                    city: data.user.city || '',
                    interests: data.user.interests || [],
                });
            }
        } catch (err) {
            console.error('Failed to fetch user data', err);
            setError('Failed to load profile data');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        setSuccess(false);

        try {
            const res = await fetch('/api/user/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    name: formData.name,
                    city: formData.city,
                    interests: formData.interests,
                }),
            });
            const data = await res.json();

            if (data.success) {
                setSuccess(true);
                // Also update local storage for legacy compatibility if needed
                localStorage.setItem('user_data', JSON.stringify({
                    email: formData.email,
                    name: formData.name,
                    city: formData.city,
                    interests: formData.interests,
                    role: 'ATTENDEE' // Default/Fallback
                }));

                setTimeout(() => {
                    setSuccess(false);
                }, 3000);
            } else {
                setError(data.error || 'Failed to update profile');
            }
        } catch (err) {
            console.error(err);
            setError('Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    const addInterest = (interest: string) => {
        const timmed = interest.trim();
        if (timmed && !formData.interests.includes(timmed)) {
            setFormData({
                ...formData,
                interests: [...formData.interests, timmed],
            });
        }
        setCustomInterest('');
    };

    const removeInterest = (interest: string) => {
        setFormData({
            ...formData,
            interests: formData.interests.filter(i => i !== interest),
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <>
            <Navbar />
            <div className="min-h-screen pt-20 pb-10 px-4 max-w-3xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold mb-2">Edit Profile</h1>
                    <p className="text-gray-400">Update your interests to get better AI recommendations</p>
                </div>

                <div className="glass p-8 rounded-2xl">
                    {success && (
                        <div className="mb-6 p-4 bg-green-500/10 border border-green-500/50 rounded-lg text-green-400 flex items-center gap-2">
                            <span>✅</span> Profile updated successfully!
                        </div>
                    )}

                    {error && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium mb-2 text-gray-300">
                                    Full Name
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-lg focus:border-blue-500 focus:outline-none text-white transition-colors focus:bg-black/40"
                                    placeholder="Your name"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2 text-gray-300">
                                    City
                                </label>
                                <input
                                    type="text"
                                    value={formData.city}
                                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                    className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-lg focus:border-blue-500 focus:outline-none text-white transition-colors focus:bg-black/40"
                                    placeholder="e.g. New York"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2 text-gray-300">
                                Email Address
                            </label>
                            <input
                                type="email"
                                value={formData.email}
                                disabled
                                className="w-full px-4 py-3 bg-white/5 border border-white/5 rounded-lg text-gray-500 cursor-not-allowed"
                            />
                        </div>

                        <div className="pt-4 border-t border-white/10">
                            <label className="block text-lg font-bold mb-4 flex items-center gap-2">
                                <Tag className="w-5 h-5 text-purple-400" />
                                Your Interests
                                <span className="text-sm font-normal text-gray-400 ml-2">
                                    (Used for AI recommendations)
                                </span>
                            </label>

                            {/* Active Tags */}
                            <div className="flex flex-wrap gap-2 mb-6">
                                {formData.interests.length === 0 && (
                                    <span className="text-gray-500 italic text-sm">No interests selected yet. Add some below!</span>
                                )}
                                {formData.interests.map((interest, i) => (
                                    <span
                                        key={i}
                                        className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-600/30 to-purple-600/30 border border-blue-500/30 text-blue-200 text-sm flex items-center gap-2 animate-in fade-in zoom-in duration-200"
                                    >
                                        {interest}
                                        <button
                                            type="button"
                                            onClick={() => removeInterest(interest)}
                                            className="hover:text-white transition-colors rounded-full hover:bg-white/10 p-0.5"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </span>
                                ))}
                            </div>

                            {/* Add New Interest */}
                            <div className="mb-6">
                                <label className="block text-sm text-gray-400 mb-2">Add custom interest</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={customInterest}
                                        onChange={(e) => setCustomInterest(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                addInterest(customInterest);
                                            }
                                        }}
                                        className="flex-1 px-4 py-2 bg-black/20 border border-white/10 rounded-lg focus:border-purple-500 focus:outline-none text-white"
                                        placeholder="Type and press Enter..."
                                    />
                                    <button
                                        type="button"
                                        onClick={() => addInterest(customInterest)}
                                        disabled={!customInterest.trim()}
                                        className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors disabled:opacity-50"
                                    >
                                        <Plus className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Common Interests */}
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">Popular tags</label>
                                <div className="flex flex-wrap gap-2">
                                    {COMMON_INTERESTS.map((interest) => (
                                        <button
                                            key={interest}
                                            type="button"
                                            onClick={() => addInterest(interest)}
                                            disabled={formData.interests.includes(interest)}
                                            className={`px-3 py-1 rounded-full text-xs border transition-all ${formData.interests.includes(interest)
                                                ? 'bg-green-500/20 border-green-500/50 text-green-400 opacity-50 cursor-default'
                                                : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:border-white/30'
                                                }`}
                                        >
                                            {formData.interests.includes(interest) ? '✓ ' : '+ '}
                                            {interest}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4 pt-6 border-t border-white/10">
                            <button
                                type="submit"
                                disabled={saving}
                                className="flex-1 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 font-bold text-lg shadow-lg hover:shadow-purple-500/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {saving ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-5 h-5" />
                                        Save Profile
                                    </>
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={() => router.back()}
                                className="px-6 py-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors font-semibold"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
            <Footer />
        </>
    );
}

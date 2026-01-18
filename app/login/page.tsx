'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { GlassCard } from '@/components/ui/glass-card';
import { User, Briefcase, Mail, Lock, Phone } from 'lucide-react';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { registerUser, loginUser } from '@/app/actions';

export default function LoginPage() {
    const router = useRouter();
    const { login } = useAuth();
    const [mode, setMode] = useState<'login' | 'register'>('login');
    const [role, setRole] = useState<'ATTENDEE' | 'ORGANIZER'>('ATTENDEE');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        name: '',
        city: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Simple password validation
            if (formData.password !== 'dhashu') {
                setError('Invalid password');
                setLoading(false);
                return;
            }

            if (mode === 'register') {
                const result = await registerUser({
                    email: formData.email,
                    name: formData.name || undefined,
                    city: formData.city || undefined,
                    role: role,
                    interests: [] // Can be updated later
                });

                if (!result.success) {
                    setError(result.error || 'Registration failed');
                    setLoading(false);
                    return;
                }

                // Auto-login after registration
                if (result.user) {
                    login(role, {
                        id: result.user.id,
                        name: result.user.name || '',
                        email: result.user.email,
                        phone: null,
                        role: role
                    });

                    if (role === 'ORGANIZER') {
                        router.push(`/dashboard/organizer?userId=${result.user.id}`);
                    } else {
                        router.push(`/dashboard/attendee?userId=${result.user.id}`);
                    }
                } else {
                    setError('Registration succeeded but user data missing');
                    setLoading(false);
                }
            } else {
                const result = await loginUser({
                    email: formData.email
                });

                if (!result.success || !result.user) {
                    setError(result.error || 'Login failed');
                    setLoading(false);
                    return;
                }

                login(result.user.role as 'ATTENDEE' | 'ORGANIZER', {
                    id: result.user.id,
                    name: result.user.name || '',
                    email: result.user.email,
                    phone: null,
                    role: result.user.role as 'ATTENDEE' | 'ORGANIZER'
                });

                if (result.user.role === 'ORGANIZER') {
                    router.push(`/dashboard/organizer?userId=${result.user.id}`);
                } else {
                    router.push(`/dashboard/attendee?userId=${result.user.id}`);
                }
            }
        } catch (err) {
            setError('An unexpected error occurred');
            setLoading(false);
        }
    };

    return (
        <>
            <Navbar />
            <div className="min-h-screen flex items-center justify-center px-4 pt-16">
                <GlassCard className="max-w-md w-full p-8">
                    <h1 className="text-3xl font-bold mb-2 text-center">
                        {mode === 'login' ? 'Welcome Back' : 'Create Account'}
                    </h1>
                    <p className="text-gray-400 mb-8 text-center">
                        {mode === 'login' ? 'Sign in to continue' : 'Join EventHorizon today'}
                    </p>

                    {/* Role Selection */}
                    <div className="flex gap-2 mb-6">
                        <button
                            type="button"
                            onClick={() => setRole('ATTENDEE')}
                            className={`flex-1 p-3 rounded-lg border transition-all ${role === 'ATTENDEE'
                                ? 'bg-blue-500/20 border-blue-500'
                                : 'border-gray-700 hover:border-gray-600'
                                }`}
                        >
                            <User className="w-5 h-5 mx-auto mb-1" />
                            <div className="text-sm">Attendee</div>
                        </button>
                        <button
                            type="button"
                            onClick={() => setRole('ORGANIZER')}
                            className={`flex-1 p-3 rounded-lg border transition-all ${role === 'ORGANIZER'
                                ? 'bg-purple-500/20 border-purple-500'
                                : 'border-gray-700 hover:border-gray-600'
                                }`}
                        >
                            <Briefcase className="w-5 h-5 mx-auto mb-1" />
                            <div className="text-sm">Organizer</div>
                        </button>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                <Mail className="w-4 h-4 inline mr-2" />
                                Email
                            </label>
                            <input
                                type="email"
                                required
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full px-4 py-2 bg-black/20 border border-gray-700 rounded-lg focus:border-blue-500 focus:outline-none"
                                placeholder="you@example.com"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">
                                <Lock className="w-4 h-4 inline mr-2" />
                                Password
                            </label>
                            <input
                                type="password"
                                required
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                className="w-full px-4 py-2 bg-black/20 border border-gray-700 rounded-lg focus:border-blue-500 focus:outline-none"
                                placeholder="••••••••"
                            />
                        </div>

                        {mode === 'register' && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        <User className="w-4 h-4 inline mr-2" />
                                        Name (Optional)
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-4 py-2 bg-black/20 border border-gray-700 rounded-lg focus:border-blue-500 focus:outline-none"
                                        placeholder="Your name"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        <Mail className="w-4 h-4 inline mr-2" />
                                        City (Optional)
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.city}
                                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                        className="w-full px-4 py-2 bg-black/20 border border-gray-700 rounded-lg focus:border-blue-500 focus:outline-none"
                                        placeholder="Mumbai, Delhi, etc."
                                    />
                                </div>
                            </>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Processing...' : mode === 'login' ? 'Sign In' : 'Create Account'}
                        </button>
                    </form>

                    <div className="mt-6 text-center text-sm">
                        <button
                            type="button"
                            onClick={() => {
                                setMode(mode === 'login' ? 'register' : 'login');
                                setError('');
                            }}
                            className="text-blue-400 hover:text-blue-300"
                        >
                            {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
                        </button>
                    </div>
                </GlassCard>
            </div>
            <Footer />
        </>
    );
}

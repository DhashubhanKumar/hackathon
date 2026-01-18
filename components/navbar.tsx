'use client';

import Link from 'next/link';
import { Calendar, Search, User, PlusCircle, LayoutDashboard, LogOut } from 'lucide-react';
import { useAuth } from '@/components/auth-provider';

export function Navbar() {
    const { user, logout } = useAuth();

    return (
        <nav className="fixed top-0 w-full z-50 glass-nav">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center">
                        <Link href="/" className="flex-shrink-0">
                            <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">
                                EventHorizon
                            </span>
                        </Link>
                        <div className="hidden md:block">
                            <div className="ml-10 flex items-baseline space-x-4">
                                <Link href="/" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">
                                    Discover
                                </Link>
                                <Link href="/ai-search" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">
                                    AI Search
                                </Link>

                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        {user?.role === 'ORGANIZER' && (
                            <Link href="/dashboard/create" className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-600/20 text-blue-300 border border-blue-500/30 text-sm font-medium hover:bg-blue-600/30 transition-colors">
                                <PlusCircle className="w-4 h-4" />
                                Post Event
                            </Link>
                        )}

                        {!user ? (
                            <Link href="/login" className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 transition-all border border-white/10 backdrop-blur-md">
                                <User className="w-4 h-4" />
                                <span className="text-sm font-medium">Sign In</span>
                            </Link>
                        ) : (
                            <div className="flex items-center gap-4">
                                <Link
                                    href={user.role === 'ORGANIZER' ? `/dashboard/organizer?userId=${user.id}` : `/dashboard/attendee?userId=${user.id}`}
                                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 hover:bg-blue-500/20 transition-all border border-blue-500/10 backdrop-blur-md text-blue-300"
                                >
                                    <LayoutDashboard className="w-4 h-4" />
                                    <span className="text-sm font-medium hidden sm:inline">Dashboard</span>
                                </Link>
                                <div className="text-sm text-gray-400 hidden sm:block">
                                    Hi, {user.name}
                                </div>
                                <button
                                    onClick={logout}
                                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 hover:bg-red-500/20 transition-all border border-red-500/10 backdrop-blur-md text-red-300"
                                >
                                    <LogOut className="w-4 h-4" />
                                    <span className="text-sm font-medium">Logout</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}

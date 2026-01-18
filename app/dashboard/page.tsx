'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function DashboardRedirect() {
    const router = useRouter();
    const [verifying, setVerifying] = useState(true);

    useEffect(() => {
        // Simple client-side check for role to redirect immediately.
        // In a real app, middleware or server-side session check is better.
        // But since we are using Client Side 'user_data' in parts of the app:
        const checkRole = () => {
            try {
                // Try to get from localStorage (set by Login page)
                const storedUser = localStorage.getItem('user_data');

                if (storedUser) {
                    const user = JSON.parse(storedUser);
                    if (user.role === 'ORGANIZER') {
                        router.replace(`/dashboard/organizer?userId=${user.id}`);
                        return;
                    } else if (user.role === 'ATTENDEE') {
                        // The user specifically requested /dashboard/attendee
                        router.replace(`/dashboard/attendee?userId=${user.id}`);
                        return;
                    }
                }

                // Fallback: If verifying with API is needed or no local data
                // For now, redirect to login if nothing found
                router.replace('/login');

            } catch (e) {
                console.error("Dashboard redirect error:", e);
                router.replace('/login');
            }
        };

        checkRole();
    }, [router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-black text-white">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-purple-500" />
                <p className="text-gray-400">Redirecting to your dashboard...</p>
            </div>
        </div>
    );
}

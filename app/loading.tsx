import { Loader2 } from 'lucide-react';
import { GlassCard } from '@/components/ui/glass-card';

export default function Loading() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-black/90">
            <div className="relative">
                {/* Ambient Background */}
                <div className="absolute inset-0 bg-indigo-500/20 blur-3xl animate-pulse rounded-full" />

                <GlassCard className="relative z-10 p-8 flex flex-col items-center gap-6 border-white/10">
                    <div className="relative">
                        <div className="absolute inset-0 bg-indigo-500 blur-xl opacity-20 animate-pulse" />
                        <Loader2 className="w-12 h-12 text-indigo-400 animate-spin relative z-10" />
                    </div>

                    <div className="text-center">
                        <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 to-purple-300">
                            Loading Experience
                        </h3>
                        <p className="text-sm text-gray-500 mt-2">
                            Preparing your event horizon...
                        </p>
                    </div>
                </GlassCard>
            </div>
        </div>
    );
}

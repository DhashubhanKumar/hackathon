import React from 'react';
import { cn } from '@/lib/utils'; // Need to create lib/utils for clsx/tailwind-merge

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    className?: string;
    hoverEffect?: boolean;
}

export function GlassCard({ children, className, hoverEffect = false, ...props }: GlassCardProps) {
    return (
        <div
            className={cn(
                "glass rounded-xl p-6 transition-all duration-300",
                hoverEffect && "hover:bg-white/10 hover:scale-[1.02]",
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
}

'use client';

import React from 'react';
import QRCodeDisplay from '@/components/qr-code-display';
import { MapPin, Calendar, Ticket, ShieldCheck } from 'lucide-react';

interface TicketPosterProps {
    booking: {
        id: string;
        event: {
            title: string;
            description: string;
            location: string;
            startDate: Date;
            imageUrl: string | null;
            category: string | null;
        };
        ticket: {
            qrToken: string;
        };
    };
}

export const TicketPoster = React.forwardRef<HTMLDivElement, TicketPosterProps>(({ booking }, ref) => {
    return (
        <div
            ref={ref}
            id={`ticket-poster-${booking.id}`}
            className="fixed -left-[2000px] top-0 w-[800px] h-[1132px] bg-black text-white font-sans overflow-hidden"
            style={{
                backgroundImage: 'radial-gradient(circle at 50% 50%, #1a1a1a 0%, #000000 100%)',
            }}
        >
            {/* Background Decoration */}
            <div className="absolute top-0 left-0 w-full h-[60%] opacity-40">
                {booking.event.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={booking.event.imageUrl}
                        alt=""
                        className="w-full h-full object-cover filter blur-sm"
                    />
                )}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black" />
            </div>

            {/* Content Container */}
            <div className="relative z-10 p-12 h-full flex flex-col">
                {/* Header */}
                <div className="flex justify-between items-start mb-12">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl shadow-lg">
                            <Ticket className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black tracking-tighter uppercase italic">EventPass</h2>
                            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Secure Ticket</p>
                        </div>
                    </div>
                    {booking.event.category && (
                        <span className="px-4 py-1.5 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-400 text-sm font-bold uppercase tracking-wider">
                            {booking.event.category}
                        </span>
                    )}
                </div>

                {/* Main Visual */}
                <div className="relative mb-12 rounded-3xl overflow-hidden shadow-2xl border border-white/10 h-80">
                    {booking.event.imageUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={booking.event.imageUrl}
                            alt={booking.event.title}
                            className="w-full h-full object-cover"
                        />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />
                    <div className="absolute bottom-6 left-8">
                        <h1 className="text-5xl font-black mb-2 text-white drop-shadow-md leading-tight">
                            {booking.event.title}
                        </h1>
                    </div>
                </div>

                {/* Details Section */}
                <div className="grid grid-cols-2 gap-12 mb-12 flex-1">
                    <div className="space-y-8">
                        <div>
                            <h3 className="text-gray-500 uppercase text-xs font-bold tracking-widest mb-3">When</h3>
                            <div className="flex items-center gap-4">
                                <Calendar className="w-6 h-6 text-purple-400" />
                                <div className="text-xl font-bold">
                                    {new Date(booking.event.startDate).toLocaleDateString('en-US', {
                                        weekday: 'long',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                    <br />
                                    <span className="text-gray-400 text-base font-normal">
                                        At {new Date(booking.event.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-gray-500 uppercase text-xs font-bold tracking-widest mb-3">Where</h3>
                            <div className="flex items-center gap-4">
                                <MapPin className="w-6 h-6 text-pink-400" />
                                <div className="text-xl font-bold leading-tight">
                                    {booking.event.location}
                                </div>
                            </div>
                        </div>

                        <div className="pt-8 border-t border-white/5">
                            <div className="flex items-center gap-3 text-green-400 bg-green-400/5 p-4 rounded-2xl border border-green-400/20">
                                <ShieldCheck className="w-6 h-6" />
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-wider">Verified Ticket</p>
                                    <p className="text-[10px] text-green-300 opacity-70">Authenticity Guaranteed</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col items-center justify-center p-8 bg-white/5 rounded-3xl border border-white/10 relative">
                        <div className="absolute top-0 -translate-y-1/2 px-4 py-1 bg-white text-black text-[10px] font-black uppercase tracking-[0.2em] rounded">
                            Scan to Enter
                        </div>
                        <div className="bg-white p-4 rounded-2xl shadow-2xl mb-6">
                            <QRCodeDisplay value={booking.ticket.qrToken} />
                        </div>
                        <div className="text-center">
                            <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Booking ID</p>
                            <p className="font-mono text-sm text-white opacity-80">{booking.id}</p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-auto pt-8 border-t border-white/10 flex justify-between items-end">
                    <div>
                        <p className="text-[10px] text-gray-500 italic max-w-sm mb-2">
                            This ticket is issued subject to the rules and regulations of the venue and event organizer.
                        </p>
                        <p className="text-[12px] text-gray-400 font-bold tracking-widest uppercase">
                            Generated by Antigravity AI
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Signature</p>
                        <div className="font-serif italic text-2xl text-white/50 opacity-40">EventPass Secure</div>
                    </div>
                </div>
            </div>
        </div>
    );
});

TicketPoster.displayName = 'TicketPoster';

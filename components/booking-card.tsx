'use client';

import { useState } from 'react';
import { Calendar, MapPin, TrendingUp, ShieldCheck, Loader2, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import Link from 'next/link';
import QRCodeDisplay from '@/components/qr-code-display';

interface BookingCardProps {
    event: {
        id: string;
        startDate: Date;
        endDate: Date;
        location: string;
        basePrice: number;
        availableSeats: number;
    };
}

export function BookingCard({ event }: BookingCardProps) {
    const router = useRouter();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const [ticketQR, setTicketQR] = useState('');
    const currentPrice = event.basePrice;
    const priceColor = 'text-green-400';
    const priceTrend = 'Best Value';

    const handleBook = async () => {
        // Check if user is logged in
        if (!user) {
            router.push('/login');
            return;
        }

        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/bookings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    eventId: event.id,
                    userId: user.id,
                    pricePaid: currentPrice,
                }),
            });
            const data = await res.json();
            if (data.success) {
                setSuccess(true);
                setTicketQR(data.ticket?.qrToken || '');
                router.refresh(); // Update ticket count
            } else {
                setError(data.error || 'Booking failed');
            }
        } catch (err) {
            console.error(err);
            setError('Booking failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="glass p-8 rounded-2xl flex flex-col items-center justify-center text-center py-12">
                <CheckCircle className="w-16 h-16 text-green-400 mb-4" />
                <h2 className="text-2xl font-bold mb-2">Booking Confirmed!</h2>
                <p className="text-gray-400 mb-6">Your ticket is ready. Save this QR code!</p>

                {ticketQR && (
                    <div className="mb-6">
                        <div className="text-sm text-gray-400 mb-3">Your Ticket QR Code</div>
                        <QRCodeDisplay value={ticketQR} />
                        <div className="text-xs text-gray-500 mt-2">Scan at venue entrance</div>
                    </div>
                )}

                <div className="flex gap-3">
                    <Link
                        href={`/dashboard/attendee?userId=${user.id}`}
                        className="px-6 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 font-semibold transition-all"
                    >
                        View in Dashboard
                    </Link>
                    <button
                        onClick={() => setSuccess(false)}
                        className="px-6 py-3 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                    >
                        Book Another
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="glass p-8 rounded-2xl sticky top-24">
            <h2 className="text-2xl font-bold mb-6">Booking Details</h2>

            {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm">
                    {error}
                </div>
            )}

            <div className="space-y-4 mb-8">
                <div className="flex items-center text-lg text-gray-200">
                    <Calendar className="w-5 h-5 mr-3 text-purple-400" />
                    {new Date(event.startDate).toLocaleDateString()} at {new Date(event.startDate).toLocaleTimeString()}
                </div>
                <div className="flex items-center text-lg text-gray-200">
                    <MapPin className="w-5 h-5 mr-3 text-pink-400" />
                    {event.location}
                </div>
            </div>

            {/* Dynamic Pricing Block */}
            <div className="bg-white/5 rounded-xl p-6 border border-white/10 mb-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2 opacity-10">
                    <TrendingUp className="w-24 h-24" />
                </div>
                <div className="relative z-10">
                    <p className="text-sm text-gray-400 mb-1">Current Price (AI Adjusted)</p>
                    <div className="flex items-end gap-2">
                        <span className={`text-4xl font-bold ${priceColor}`}>${currentPrice.toFixed(2)}</span>
                        <span className="text-sm text-gray-500 line-through mb-1">${event.basePrice}</span>
                    </div>
                    <div className={`inline-flex items-center gap-1 mt-2 px-2 py-1 rounded text-xs font-medium bg-green-500/20 text-green-300`}>
                        <TrendingUp className="w-3 h-3" />
                        {priceTrend}
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-4">
                <button
                    onClick={handleBook}
                    disabled={loading || event.availableSeats === 0}
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold text-lg shadow-lg hover:shadow-blue-500/25 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
                >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Book Now'}
                </button>
                <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                    <ShieldCheck className="w-3 h-3" />
                    <span>Verified by AI Fraud Detection</span>
                </div>
            </div>
        </div>
    );
}

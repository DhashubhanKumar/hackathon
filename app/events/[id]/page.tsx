import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';
import { Calendar, MapPin, Ticket, TrendingUp, ShieldCheck } from 'lucide-react';
import { BookingCard } from '@/components/booking-card';
import Link from 'next/link';

export const revalidate = 0;

export default async function EventPage({ params }: { params: { id: string } }) {
    const event = await prisma.event.findUnique({
        where: { id: params.id },
    });

    if (!event) {
        notFound();
    }

    // Simulate Dynamic Pricing Logic (using basePrice since we don't have demandFactor)
    const currentPrice = event.basePrice;
    const priceColor = 'text-green-400';
    const priceTrend = 'Best Value';

    return (
        <>
            <Navbar />
            <div className="min-h-screen pt-20 pb-10 px-4 max-w-7xl mx-auto">

                {/* Breadcrumb / Back */}
                <div className="mb-6">
                    <Link href="/" className="text-gray-400 hover:text-white transition-colors">
                        ← Back to Events
                    </Link>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {/* Left Column: Image & Info */}
                    <div className="space-y-8">
                        <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/10 h-[500px]">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={event.imageUrl || ''}
                                alt={event.title}
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 text-white font-bold flex items-center gap-2">
                                <Ticket className="w-4 h-4 text-green-400" />
                                {event.availableSeats} tickets left
                            </div>
                        </div>

                        <div className="prose prose-invert max-w-none">
                            <h1 className="text-4xl md:text-5xl font-bold mb-4">{event.title}</h1>
                            <p className="text-xl text-gray-300 leading-relaxed">{event.description}</p>
                        </div>
                    </div>

                    {/* Right Column: Booking Card */}
                    <div className="space-y-6">
                        <BookingCard event={event} />
                    </div>
                </div>
            </div>
            <Footer />
        </>
    );
}

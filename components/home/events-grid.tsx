import { prisma } from '@/lib/db';
import Link from 'next/link';
import { GlassCard } from '@/components/ui/glass-card';
import { Calendar, MapPin, Ticket } from 'lucide-react';

async function getEvents() {
    try {
        // Add a timeout to prevent hanging forever
        const events = await Promise.race([
            prisma.event.findMany({
                where: {
                    status: 'PUBLISHED',
                },
                orderBy: { startDate: 'asc' },
                take: 20,
            }),
            new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error('Database timeout')), 8000)
            )
        ]) as any[];

        return events;
    } catch (error) {
        console.error("Failed to fetch events:", error);
        return [];
    }
}

export async function EventsGrid() {
    const events = await getEvents();

    if (events.length === 0) {
        return (
            <div className="text-center py-20 bg-white/5 rounded-2xl border border-white/10">
                <p className="text-xl text-gray-400">No upcoming events found.</p>
                <p className="text-sm text-gray-500 mt-2">Please check back later.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {events.map((event) => (
                <Link href={`/events/${event.id}`} key={event.id} className="block group">
                    <GlassCard hoverEffect className="h-full flex flex-col overflow-hidden p-0 border-white/5">
                        <div className="relative h-48 w-full overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10" />
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={event.imageUrl || 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4'}
                                alt={event.title}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            />
                            <div className="absolute bottom-4 left-4 z-20">
                                <span className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold border border-white/20">
                                    {event.category || 'Event'}
                                </span>
                            </div>
                        </div>

                        <div className="p-6 flex-1 flex flex-col">
                            <h3 className="text-xl font-bold mb-2 group-hover:text-blue-400 transition-colors line-clamp-1">
                                {event.title}
                            </h3>
                            <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                                {event.description}
                            </p>

                            <div className="mt-auto space-y-2">
                                <div className="flex items-center text-sm text-gray-300">
                                    <Calendar className="w-4 h-4 mr-2 text-purple-400" />
                                    {new Date(event.startDate).toLocaleDateString()}
                                </div>
                                <div className="flex items-center text-sm text-gray-300">
                                    <MapPin className="w-4 h-4 mr-2 text-pink-400" />
                                    {event.location}
                                </div>
                                <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
                                    <div className="flex items-center text-green-400 font-bold">
                                        <Ticket className="w-4 h-4 mr-2" />
                                        ${event.basePrice}
                                    </div>
                                    <span className="text-xs text-gray-500">
                                        {event.availableSeats} left
                                    </span>
                                </div>
                            </div>
                        </div>
                    </GlassCard>
                </Link>
            ))}
        </div>
    );
}

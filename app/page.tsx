import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { GlassCard } from '@/components/ui/glass-card';
import { prisma } from '@/lib/db';
import Link from 'next/link';
import { Calendar, MapPin, Ticket } from 'lucide-react';

export const revalidate = 0; // Dynamic data

async function getEvents() {
  return await prisma.event.findMany({
    where: {
      status: 'PUBLISHED',
    },
    orderBy: { startDate: 'asc' },
    take: 20,
  });
}

export default async function Home() {
  const events = await getEvents();

  return (
    <>
      <Navbar />

      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse" />
        </div>

        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <h1 className="text-6xl md:text-8xl font-black mb-6 tracking-tighter bg-clip-text text-transparent bg-gradient-to-br from-white via-white/80 to-white/40 drop-shadow-[0_0_30px_rgba(255,255,255,0.3)] animate-float">
            Experience<br />The Future
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-2xl mx-auto font-light leading-relaxed">
            Discover and book exclusive events with an AI-powered platform that understands your vibe.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/#events" className="px-8 py-4 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white font-semibold transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(255,255,255,0.2)]">
              Explore Events
            </Link>
            <Link href="/recommendations" className="px-8 py-4 rounded-full bg-indigo-600/80 hover:bg-indigo-600 backdrop-blur-md text-white font-semibold transition-all hover:scale-105 shadow-lg shadow-indigo-600/40">
              AI Recommendations
            </Link>
          </div>
        </div>
      </section>

      {/* Events Grid */}
      <section id="events" className="py-20 px-4 max-w-7xl mx-auto">
        <h2 className="text-4xl font-bold mb-12 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
          Events Happening
        </h2>

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
      </section>

      <Footer />
    </>
  );
}

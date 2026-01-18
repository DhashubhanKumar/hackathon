import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import Link from 'next/link';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { EventsGrid } from '@/components/home/events-grid';

export const revalidate = 0; // Dynamic data

export default function Home() {
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

        <Suspense fallback={
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 animate-spin text-indigo-500 mb-4" />
            <p className="text-gray-400">Loading events...</p>
          </div>
        }>
          <EventsGrid />
        </Suspense>
      </section>

      <Footer />
    </>
  );
}

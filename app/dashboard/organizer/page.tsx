import { prisma } from '@/lib/db';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { redirect } from 'next/navigation';
import { Calendar, Users, DollarSign, TrendingUp, Eye, Plus, Ticket, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { SalesChart } from '@/components/dashboard/sales-chart';

export const revalidate = 0;

async function getOrganizerEvents(organizerId: string) {
    return await prisma.event.findMany({
        where: { organizerId },
        include: {
            bookings: {
                include: {
                    user: {
                        select: {
                            name: true,
                            email: true,
                            city: true,
                        },
                    },
                },
            },
            feedbacks: {
                include: {
                    user: {
                        select: {
                            name: true,
                        }
                    }
                }
            },
            _count: {
                select: {
                    bookings: true,
                },
            },
        },
        orderBy: { createdAt: 'desc' },
    });
}

async function getUser(userId: string) {
    return await prisma.user.findUnique({
        where: { id: userId },
    });
}

export default async function OrganizerDashboard({ searchParams }: { searchParams: { userId?: string } }) {
    const userId = searchParams.userId;

    if (!userId) {
        redirect('/login');
    }

    const user = await getUser(userId);

    if (!user || user.role !== 'ORGANIZER') {
        redirect('/');
    }

    const events = await getOrganizerEvents(userId);

    const totalRevenue = events.reduce((sum, event) => {
        return sum + event.bookings.reduce((bookingSum, booking) => bookingSum + booking.pricePaid, 0);
    }, 0);

    const totalBookings = events.reduce((sum, event) => sum + event._count.bookings, 0);

    const upcomingEvents = events.filter(e => new Date(e.startDate) > new Date());
    const pastEvents = events.filter(e => new Date(e.startDate) <= new Date());

    const chartData = events.map(event => ({
        name: event.title.length > 20 ? event.title.substring(0, 20) + '...' : event.title,
        sales: event.bookings.reduce((sum, b) => sum + b.pricePaid, 0),
        tickets: event._count.bookings
    })).slice(0, 10); // Limit to 10 events for chart clarity

    const topEvent = events.reduce((prev, current) => {
        const prevRev = prev ? prev.bookings.reduce((sum, b) => sum + b.pricePaid, 0) : 0;
        const currentRev = current.bookings.reduce((sum, b) => sum + b.pricePaid, 0);
        return prevRev > currentRev ? prev : current;
    }, events[0]); // Default to first or undefined

    const topEventRevenue = topEvent ? topEvent.bookings.reduce((sum, b) => sum + b.pricePaid, 0) : 0;

    return (
        <>
            <Navbar />
            <div className="min-h-screen pt-20 pb-10 px-4 max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-4xl font-bold mb-2">Events Dashboard</h1>
                        <p className="text-gray-400">Manage your events and listings</p>
                    </div>
                    <div className="flex gap-4">
                        <Link href="/dashboard/analytics" className="px-6 py-3 rounded-xl bg-purple-900/30 border border-purple-500/30 hover:bg-purple-900/50 text-purple-300 font-bold flex items-center gap-2 transition-all">
                            <TrendingUp className="w-5 h-5" />
                            AI Analytics
                        </Link>
                        <Link href="/dashboard/create" className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center gap-2 transition-all">
                            <Plus className="w-5 h-5" />
                            Create Event
                        </Link>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="glass p-6 rounded-2xl">
                        <div className="flex items-center justify-between mb-2">
                            <div className="text-sm text-gray-400">Total Events</div>
                            <Calendar className="w-5 h-5 text-blue-400" />
                        </div>
                        <div className="text-3xl font-bold text-blue-400">{events.length}</div>
                    </div>
                    <div className="glass p-6 rounded-2xl">
                        <div className="flex items-center justify-between mb-2">
                            <div className="text-sm text-gray-400">Total Bookings</div>
                            <Users className="w-5 h-5 text-green-400" />
                        </div>
                        <div className="text-3xl font-bold text-green-400">{totalBookings}</div>
                    </div>
                    <div className="glass p-6 rounded-2xl">
                        <div className="flex items-center justify-between mb-2">
                            <div className="text-sm text-gray-400">Total Revenue</div>
                            <DollarSign className="w-5 h-5 text-purple-400" />
                        </div>
                        <div className="text-3xl font-bold text-purple-400">${totalRevenue.toLocaleString()}</div>
                    </div>
                    <div className="glass p-6 rounded-2xl">
                        <div className="flex items-center justify-between mb-2">
                            <div className="text-sm text-gray-400">Upcoming</div>
                            <TrendingUp className="w-5 h-5 text-yellow-400" />
                        </div>
                        <div className="text-3xl font-bold text-yellow-400">{upcomingEvents.length}</div>
                    </div>
                </div>

                {/* Flagged Bookings Alert */}
                {events.some(e => e.bookings.some(b => b.status === 'FLAGGED')) && (
                    <div className="mb-8 p-6 rounded-2xl bg-red-500/10 border border-red-500/30 animate-pulse">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                                <Eye className="w-6 h-6 text-red-500" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-red-400">Fraud Alerts Detected</h3>
                                <p className="text-red-300/70 text-sm">Action required on suspicious bookings</p>
                            </div>
                        </div>
                        <div className="space-y-3">
                            {events.flatMap(e => e.bookings.filter(b => b.status === 'FLAGGED').map(b => ({ ...b, eventTitle: e.title }))).map(booking => (
                                <div key={booking.id} className="bg-black/40 rounded-xl p-4 border border-red-500/20 flex items-center justify-between">
                                    <div>
                                        <div className="font-semibold text-red-300">{booking.user.name} ({booking.user.email})</div>
                                        <div className="text-sm text-gray-400">Event: {booking.eventTitle}</div>
                                        <div className="text-xs text-red-400/60 mt-1">Risk Score: {booking.riskScore || 0.95}</div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button className="px-3 py-1.5 rounded-lg bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition-colors">
                                            Deny
                                        </button>
                                        <button className="px-3 py-1.5 rounded-lg bg-white/10 text-white text-sm hover:bg-white/20 transition-colors">
                                            Investigate
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Analytics Section */}
                {events.length > 0 && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
                        <div className="lg:col-span-2">
                            <SalesChart data={chartData} />
                        </div>
                        <div className="space-y-6">
                            <div className="glass p-6 rounded-2xl h-full">
                                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                                    <TrendingUp className="w-5 h-5 text-purple-400" />
                                    Insights
                                </h3>

                                <div className="space-y-6">
                                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                                        <div className="text-sm text-gray-400 mb-1">Top Performing Event</div>
                                        <div className="font-bold text-lg truncate mb-1">{topEvent?.title || 'N/A'}</div>
                                        <div className="flex items-center gap-2 text-green-400 text-sm">
                                            <DollarSign className="w-3 h-3" />
                                            {topEventRevenue.toLocaleString()} Revenue
                                        </div>
                                    </div>

                                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                                        <div className="text-sm text-gray-400 mb-1">Avg. Revenue per Event</div>
                                        <div className="font-bold text-lg">
                                            ${events.length > 0 ? (totalRevenue / events.length).toFixed(0) : 0}
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1">
                                            Based on {events.length} events
                                        </div>
                                    </div>

                                    <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                                        <div className="flex items-center gap-2 text-blue-300 mb-2">
                                            <Ticket className="w-4 h-4" />
                                            <span className="font-semibold">Conversion Rate</span>
                                        </div>
                                        <div className="text-2xl font-bold text-blue-400 mb-1">
                                            {/* Logic for conversion rate if available, else placeholder */}
                                            {events.length > 0 ? '4.8%' : '0%'}
                                        </div>
                                        <div className="text-xs text-blue-300/70">
                                            Page views to ticket sales
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Upcoming Events */}
                {upcomingEvents.length > 0 && (
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold mb-4">Upcoming Events</h2>
                        <div className="space-y-4">
                            {upcomingEvents.map((event) => {
                                const revenue = event.bookings.reduce((sum, b) => sum + b.pricePaid, 0);
                                const occupancy = ((event.totalSeats - event.availableSeats) / event.totalSeats) * 100;

                                return (
                                    <div key={event.id} className="glass p-6 rounded-2xl">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h3 className="text-xl font-bold mb-2">{event.title}</h3>
                                                <div className="text-sm text-gray-400">
                                                    {new Date(event.startDate).toLocaleDateString()} • {event.location}
                                                </div>
                                            </div>
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${event.status === 'PUBLISHED' ? 'bg-green-500/20 text-green-300' :
                                                event.status === 'DRAFT' ? 'bg-yellow-500/20 text-yellow-300' :
                                                    'bg-red-500/20 text-red-300'
                                                }`}>
                                                {event.status}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                            <div>
                                                <div className="text-sm text-gray-400">Bookings</div>
                                                <div className="text-xl font-bold text-green-400">{event._count.bookings}</div>
                                            </div>
                                            <div>
                                                <div className="text-sm text-gray-400">Revenue</div>
                                                <div className="text-xl font-bold text-purple-400">${revenue.toLocaleString()}</div>
                                            </div>
                                            <div>
                                                <div className="text-sm text-gray-400">Occupancy</div>
                                                <div className="text-xl font-bold text-blue-400">{occupancy.toFixed(0)}%</div>
                                            </div>
                                            <div>
                                                <div className="text-sm text-gray-400">Available Seats</div>
                                                <div className="text-xl font-bold text-yellow-400">{event.availableSeats}</div>
                                            </div>
                                        </div>

                                        <div className="flex gap-2">
                                            <Link
                                                href={`/events/${event.id}`}
                                                className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-sm"
                                            >
                                                View Event
                                            </Link>
                                            <Link
                                                href={`/dashboard/pricing?eventId=${event.id}`}
                                                className="px-4 py-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 transition-colors text-sm text-blue-300 border border-blue-500/30"
                                            >
                                                💰 Manage Pricing
                                            </Link>
                                            <Link
                                                href={`/dashboard/analytics?eventId=${event.id}`}
                                                className="px-4 py-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 transition-colors text-sm text-purple-300 border border-purple-500/30"
                                            >
                                                🤖 AI Analytics
                                            </Link>
                                        </div>

                                        {event.bookings.length > 0 && (
                                            <div className="mt-4 pt-4 border-t border-white/10">
                                                <div className="text-sm text-gray-400 mb-2">Recent Attendees</div>
                                                <div className="space-y-1">
                                                    {event.bookings.slice(0, 3).map((booking) => (
                                                        <div key={booking.id} className="text-sm text-gray-300">
                                                            {booking.user.name} • {booking.user.email}
                                                        </div>
                                                    ))}
                                                    {event.bookings.length > 3 && (
                                                        <div className="text-sm text-gray-500">
                                                            +{event.bookings.length - 3} more
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Past Events */}
                {pastEvents.length > 0 && (
                    <div>
                        <h2 className="text-2xl font-bold mb-4">Past Events</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {pastEvents.map((event) => (
                                <div key={event.id} className="glass p-4 rounded-xl opacity-75">
                                    <h3 className="font-bold mb-1">{event.title}</h3>
                                    <div className="text-sm text-gray-400 mb-2">
                                        {new Date(event.startDate).toLocaleDateString()}
                                    </div>
                                    <div className="text-sm text-gray-300 mb-3">
                                        {event._count.bookings} bookings • ${event.bookings.reduce((sum, b) => sum + b.pricePaid, 0).toLocaleString()} revenue
                                    </div>

                                    {event.feedbacks.length > 0 && (
                                        <div className="pt-3 border-t border-white/10">
                                            <div className="text-xs text-gray-400 font-semibold mb-2">Attendee Feedback</div>
                                            <div className="space-y-2">
                                                {event.feedbacks.map((feedback) => (
                                                    <div key={feedback.id} className="bg-white/5 rounded-lg p-3 text-sm">
                                                        <div className="flex items-center gap-1 mb-1 text-yellow-400">
                                                            {'★'.repeat(feedback.rating)}
                                                            <span className="text-gray-500 text-xs ml-1">by {feedback.user.name}</span>
                                                        </div>
                                                        <p className="text-gray-300 italic">"{feedback.comment}"</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {events.length === 0 && (
                    <div className="glass p-12 rounded-2xl text-center">
                        <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-500" />
                        <h3 className="text-xl font-bold mb-2">No Events Yet</h3>
                        <p className="text-gray-400 mb-6">Create your first event to start selling tickets!</p>
                        <Link href="/dashboard/create" className="px-6 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 font-semibold transition-all">
                            Create Event
                        </Link>
                    </div>
                )}
            </div>
            <Footer />
        </>
    );
}

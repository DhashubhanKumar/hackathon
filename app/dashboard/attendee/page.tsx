import { prisma } from '@/lib/db';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { redirect } from 'next/navigation';
import { Calendar, MapPin, Ticket, QrCode, User as UserIcon, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import QRCodeDisplay from '@/components/qr-code-display';
import { FeedbackForm } from '@/components/dashboard/feedback-form';
import { UserReviewsList } from '@/components/dashboard/user-reviews-list';
import { TicketDownloadButton } from '@/components/dashboard/ticket-download-button';

export const revalidate = 0;

async function getUserBookings(userId: string) {
    return await prisma.booking.findMany({
        where: { userId },
        include: {
            event: true,
            ticket: true,
        },
        orderBy: { createdAt: 'desc' },
    });
}

// Separate function to fetch bookings with feedbacks for finished events
async function getUserBookingsWithFeedbacks(userId: string) {
    return await prisma.booking.findMany({
        where: { userId },
        include: {
            event: {
                include: {
                    feedbacks: {
                        where: { userId },
                    },
                },
            },
            ticket: true,
        },
        orderBy: { createdAt: 'desc' },
    });
}

async function getUserFeedbacks(userId: string) {
    return await prisma.feedback.findMany({
        where: { userId },
        include: {
            event: {
                select: { title: true }
            }
        },
        orderBy: { createdAt: 'desc' },
    });
}

async function getUser(userId: string) {
    return await prisma.user.findUnique({
        where: { id: userId },
    });
}

export default async function AttendeeDashboard({ searchParams }: { searchParams: { userId?: string } }) {
    const userId = searchParams.userId;

    if (!userId) {
        redirect('/login');
    }

    const [user, bookings, bookingsWithFeedbacks, reviews] = await Promise.all([
        getUser(userId),
        getUserBookings(userId),
        getUserBookingsWithFeedbacks(userId),
        getUserFeedbacks(userId),
    ]);

    if (!user) {
        redirect('/login');
    }

    const now = new Date();
    const upcomingBookings = bookings.filter(b => new Date(b.event.startDate) > now);
    const finishedEvents = bookingsWithFeedbacks.filter(b => b.event.endDate && new Date(b.event.endDate) <= now);

    return (
        <>
            <Navbar />
            <div className="min-h-screen pt-20 pb-10 px-4 max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold mb-2">My Dashboard</h1>
                    <p className="text-gray-400">Welcome back, {user.name}!</p>
                </div>

                {/* Profile Card */}
                <div className="glass p-6 rounded-2xl mb-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                                <UserIcon className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold">{user.name}</h2>
                                <p className="text-gray-400">{user.email}</p>
                                {user.city && <p className="text-sm text-gray-500">📍 {user.city}</p>}
                            </div>
                        </div>
                        <Link
                            href={`/dashboard/profile?userId=${userId}`}
                            className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                        >
                            Edit Profile
                        </Link>
                    </div>
                    {user.interests && user.interests.length > 0 && (
                        <div className="mt-4 flex gap-2 flex-wrap">
                            {user.interests.map((interest, i) => (
                                <span key={i} className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-sm">
                                    {interest}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    <div className="glass p-6 rounded-2xl">
                        <div className="text-3xl font-bold text-blue-400">{bookings.length}</div>
                        <div className="text-gray-400">Total Bookings</div>
                    </div>
                    <div className="glass p-6 rounded-2xl">
                        <div className="text-3xl font-bold text-green-400">{upcomingBookings.length}</div>
                        <div className="text-gray-400">Upcoming Events</div>
                    </div>
                    <div className="glass p-6 rounded-2xl">
                        <div className="text-3xl font-bold text-purple-400">{finishedEvents.length}</div>
                        <div className="text-gray-400">Finished Events</div>
                    </div>
                </div>

                {/* Upcoming Bookings */}
                {upcomingBookings.length > 0 && (
                    <div className="mb-12">
                        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                            <Calendar className="w-6 h-6 text-blue-400" />
                            Upcoming Events
                        </h2>
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                            {upcomingBookings.map((booking) => (
                                <div key={booking.id} className="glass p-6 rounded-3xl">
                                    <div className="flex flex-col gap-6">
                                        <div className="flex flex-col md:flex-row gap-6">
                                            {/* Event Info */}
                                            <div className="flex-1">
                                                <h3 className="text-2xl font-black mb-4 tracking-tight">{booking.event.title}</h3>
                                                <div className="space-y-3 text-sm text-gray-300">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                                                            <Calendar className="w-4 h-4 text-purple-400" />
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold">{new Date(booking.event.startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                                                            <p className="text-xs text-gray-500">{new Date(booking.event.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-pink-500/10 flex items-center justify-center">
                                                            <MapPin className="w-4 h-4 text-pink-400" />
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold truncate max-w-[200px]">{booking.event.location}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                                                            <Ticket className="w-4 h-4 text-green-400" />
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold">{booking.status}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Ticket Preview */}
                                            {booking.ticket && (
                                                <div className="flex flex-col items-center gap-4 p-6 bg-white/5 rounded-2xl border border-white/10 min-w-[180px]">
                                                    <div className="w-32 h-32 bg-white rounded-xl p-2 shadow-2xl">
                                                        <QRCodeDisplay value={booking.ticket.qrToken} />
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-1">Ticket Code</p>
                                                        <p className="text-xs font-mono text-white/70">{booking.ticket.qrToken.slice(0, 15)}...</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        <div className="pt-6 border-t border-white/5 flex gap-4">
                                            <TicketDownloadButton
                                                booking={{
                                                    id: booking.id,
                                                    event: {
                                                        title: booking.event.title,
                                                        description: booking.event.description,
                                                        location: booking.event.location,
                                                        startDate: booking.event.startDate,
                                                        imageUrl: booking.event.imageUrl,
                                                        category: booking.event.category
                                                    },
                                                    ticket: {
                                                        qrToken: booking.ticket?.qrToken || ''
                                                    }
                                                }}
                                            />
                                            <Link
                                                href={`/events/${booking.event.id}`}
                                                className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white text-sm font-semibold transition-colors"
                                            >
                                                View Event
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Finished Events */}
                {finishedEvents.length > 0 && (
                    <div className="mb-12">
                        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                            <Ticket className="w-6 h-6 text-purple-400" />
                            Finished Events
                        </h2>
                        <div className="space-y-4">
                            {finishedEvents.map((booking) => (
                                <div key={booking.id} className="glass p-6 rounded-2xl border-l-4 border-purple-500/50">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div>
                                            <h3 className="text-xl font-bold mb-1">{booking.event.title}</h3>
                                            <p className="text-sm text-gray-400">
                                                Finished on {booking.event.endDate ? new Date(booking.event.endDate).toLocaleDateString() : 'N/A'}
                                            </p>
                                        </div>
                                        <div className="flex-1 md:max-w-md">
                                            <FeedbackForm
                                                eventId={booking.event.id}
                                                userId={userId}
                                                existingFeedback={booking.event.feedbacks[0]}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* My Reviews Section */}
                <div className="mb-12">
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                        <MessageSquare className="w-6 h-6 text-pink-400" />
                        My Reviews
                    </h2>
                    <UserReviewsList reviews={reviews} />
                </div>

                {bookings.length === 0 && (
                    <div className="glass p-12 rounded-2xl text-center">
                        <Ticket className="w-16 h-16 mx-auto mb-4 text-gray-500" />
                        <h3 className="text-xl font-bold mb-2">No Bookings Yet</h3>
                        <p className="text-gray-400 mb-6">Start exploring events and book your first ticket!</p>
                        <Link
                            href="/"
                            className="inline-block px-6 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 font-semibold transition-all"
                        >
                            Browse Events
                        </Link>
                    </div>
                )}
            </div>
            <Footer />
        </>
    );
}

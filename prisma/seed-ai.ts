import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting seed...');

    // Clear existing data
    await prisma.feedback.deleteMany();
    await prisma.pricingLog.deleteMany();
    await prisma.booking.deleteMany();
    await prisma.ticket.deleteMany();
    await prisma.event.deleteMany();
    await prisma.user.deleteMany();

    console.log('✅ Cleared existing data');

    // Create Requested User (a@gmail.com) and Organizer (b@gmail.com)
    const user = await prisma.user.create({
        data: {
            email: 'a@gmail.com',
            name: 'Alice A.',
            role: 'ATTENDEE',
            city: 'New York',
            interests: ['Technology', 'Music'],
        },
    });

    const organizer = await prisma.user.create({
        data: {
            email: 'b@gmail.com',
            name: 'Bob Events B.',
            role: 'ORGANIZER',
            city: 'New York',
            interests: ['Business', 'Events'],
        },
    });

    console.log(`✅ Created User: ${user.email} and Organizer: ${organizer.email}`);

    // Create 10 Events (5 Past, 5 Future)
    const events = [];
    const categories = ['Technology', 'Music', 'Business', 'Art', 'Health', 'Sports', 'Food', 'Travel', 'Education', 'Fashion'];

    for (let i = 1; i <= 10; i++) {
        const isPast = i <= 5; // First 5 are past
        const daysOffset = isPast ? -((6 - i) * 10) : ((i - 5) * 5); // Past: older to newer... actually just simple math

        // Let's make Past Events: -50 days, -40 days, -30, -20, -10
        // Future Events: +10, +20, +30, +40, +50

        let startDisplay = new Date();
        if (isPast) {
            startDisplay = new Date(Date.now() - (1000 * 60 * 60 * 24 * (10 + (5 - i) * 10))); // 1 -> 50 days ago, 5 -> 10 days ago
        } else {
            startDisplay = new Date(Date.now() + (1000 * 60 * 60 * 24 * ((i - 5) * 10)));
        }

        const event = await prisma.event.create({
            data: {
                title: `${categories[i - 1]} Extravaganza ${i}`,
                description: `A wonderful event showcasing the best of ${categories[i - 1]}. Don't miss out!`,
                category: categories[i - 1],
                location: `Venue ${i} - center of city`,
                city: 'New York',
                startDate: startDisplay,
                endDate: new Date(startDisplay.getTime() + 1000 * 60 * 60 * 4),
                basePrice: 50 + (i * 10),
                totalSeats: 100 + (i * 10),
                availableSeats: 50 + (i * 5), // Partial availability
                status: isPast ? 'COMPLETED' : 'PUBLISHED',
                organizerId: organizer.id,
                imageUrl: `https://source.unsplash.com/random/800x600/?${categories[i - 1]}`, // Random placeholder
            },
        });
        events.push(event);
    }
    console.log(`✅ Created ${events.length} events`);

    // Create Bookings for User 'a@gmail.com'
    // Book 3 Past Events (Indices 0, 1, 2)
    // Book 2 Future Events (Indices 5, 6)
    // Booking past events allows feedback. Booking future events shows in "Upcoming".
    const eventsToBook = [events[0], events[1], events[2], events[5], events[6]];

    for (const event of eventsToBook) {
        const ticket = await prisma.ticket.create({
            data: {
                eventId: event.id,
                qrToken: `QR-${event.id}-${user.id}-${Date.now()}`,
            }
        });

        await prisma.booking.create({
            data: {
                userId: user.id,
                eventId: event.id,
                ticketId: ticket.id,
                pricePaid: event.basePrice,
                status: 'CONFIRMED',
                ipAddress: '127.0.0.1',
                riskScore: 0.1,
            }
        });
    }
    console.log(`✅ Created ${eventsToBook.length} bookings for ${user.email}`);

    // Create Feedback for the 3 Past Booked Events
    const comments = [
        "Amazing experience! Loved every bit of it.",
        "It was okay, but the venue was too crowded.",
        "Great speakers, very informative session."
    ];
    const ratings = [5, 3, 4];

    for (let i = 0; i < 3; i++) {
        await prisma.feedback.create({
            data: {
                userId: user.id,
                eventId: events[i].id,
                rating: ratings[i],
                comment: comments[i],
                sentiment: ratings[i] >= 4 ? 'positive' : 'neutral',
            }
        });
    }
    console.log(`✅ Created feedback for past events`);

    console.log('\n🎉 Seed completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   User: ${user.email} (Attendee)`);
    console.log(`   Organizer: ${organizer.email}`);
    console.log(`   Events: ${events.length} (5 Past, 5 Future)`);
    console.log(`   Bookings: ${eventsToBook.length}`);
    console.log('\n🚀 Login with these emails to test!');
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

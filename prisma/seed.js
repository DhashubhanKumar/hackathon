const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    // Clear existing
    await prisma.booking.deleteMany({});
    await prisma.event.deleteMany({});
    await prisma.user.deleteMany({});

    console.log('Seeding data...');

    // Create Users
    const user = await prisma.user.create({
        data: {
            email: 'user@demo.com',
            name: 'Demo User',
            role: 'ATTENDEE',
        },
    });

    const organizer = await prisma.user.create({
        data: {
            email: 'organizer@demo.com',
            name: 'Event Organizer',
            role: 'ORGANIZER',
        },
    });

    // Create Events
    const events = [
        {
            title: 'Neon Nights Music Festival',
            description: 'Experience the future of sound in a glassmorphic wonderland.',
            date: new Date('2026-06-15T18:00:00Z'),
            location: 'Cyber City Arena',
            price: 150.0,
            totalTickets: 5000,
            availableTickets: 4500,
            category: 'Music',
            imageUrl: 'https://images.unsplash.com/photo-1470229722913-7ea9959fa7e3?w=800&auto=format&fit=crop&q=60',
            organizerId: organizer.id,
            demandFactor: 1.2,
        },
        {
            title: 'AI Tech Summit 2026',
            description: 'The global gathering of artificial intelligence pioneers.',
            date: new Date('2026-09-20T09:00:00Z'),
            location: 'Silicon Valley Convention Center',
            price: 299.0,
            totalTickets: 1000,
            availableTickets: 800,
            category: 'Tech',
            imageUrl: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&auto=format&fit=crop&q=60',
            organizerId: organizer.id,
            demandFactor: 1.5,
        },
        {
            title: 'Abstract Art Gallery Opening',
            description: 'A visual journey through modern abstract expressionism.',
            date: new Date('2026-04-10T19:00:00Z'),
            location: 'Modern Art Museum',
            price: 50.0,
            totalTickets: 200,
            availableTickets: 50,
            category: 'Art',
            imageUrl: 'https://images.unsplash.com/photo-1547891654-e66ed7ebb968?w=800&auto=format&fit=crop&q=60',
            organizerId: organizer.id,
            demandFactor: 0.8,
        },
        {
            title: 'Culinary Masterclass: Fusion',
            description: 'Learn from the top chefs in the world.',
            date: new Date('2026-05-05T10:00:00Z'),
            location: 'Grand Kitchen Studio',
            price: 120.0,
            totalTickets: 50,
            availableTickets: 10,
            category: 'Food',
            imageUrl: 'https://images.unsplash.com/photo-1514326640560-7d063ef2aed5?w=800&auto=format&fit=crop&q=60',
            organizerId: organizer.id,
            demandFactor: 1.1,
        }
    ];

    for (const event of events) {
        await prisma.event.create({
            data: event
        });
    }

    console.log('Seeding finished.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

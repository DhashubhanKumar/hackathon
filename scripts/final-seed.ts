import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function main() {
    console.log('🧼 Resetting database...');

    // Clear all existing data in correct order
    await prisma.feedback.deleteMany();
    await prisma.pricingLog.deleteMany();
    await prisma.booking.deleteMany();
    await prisma.ticket.deleteMany();
    await prisma.event.deleteMany();
    await prisma.user.deleteMany();

    console.log('✅ Database cleared.');

    // 1. Create Users
    console.log('👤 Creating users...');
    const attendees = await Promise.all([
        prisma.user.create({
            data: {
                email: 'a@gmail.com',
                name: 'Alice Attendee',
                role: 'ATTENDEE',
                password: 'dhashu',
                city: 'Mumbai',
                interests: ['Technology', 'AI', 'Startups']
            }
        }),
        prisma.user.create({
            data: {
                email: 'b@gmail.com',
                name: 'Bob Booking',
                role: 'ATTENDEE',
                password: 'dhashu',
                city: 'Bangalore',
                interests: ['Music', 'Networking', 'Food']
            }
        })
    ]);

    const organizers = await Promise.all([
        prisma.user.create({
            data: {
                email: 'c@gmail.com',
                name: 'Charlie Creator',
                role: 'ORGANIZER',
                password: 'dhashu',
                city: 'Delhi',
                interests: ['Business', 'Events']
            }
        }),
        prisma.user.create({
            data: {
                email: 'd@gmail.com',
                name: 'David Director',
                role: 'ORGANIZER',
                password: 'dhashu',
                city: 'Pune',
                interests: ['Art', 'Education']
            }
        })
    ]);

    const organizerC = organizers[0];
    const organizerD = organizers[1];
    const attendeeA = attendees[0];
    const attendeeB = attendees[1];

    // 2. Create Events
    console.log('📅 Creating events...');
    const eventData = [
        {
            title: 'Global AI Summit 2026',
            description: 'The world\'s most influential AI conference is back! Join industry leaders, researchers, and innovators for three days of deep technical sessions and high-level networking.',
            category: 'Technology',
            location: 'Convention Center, Mumbai',
            city: 'Mumbai',
            basePrice: 299,
            totalSeats: 500,
            imageUrl: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e',
            status: 'PUBLISHED',
            daysOffset: 30,
            organizerId: organizerC.id
        },
        {
            title: 'Electric Nights Music Festival',
            description: 'Experience the ultimate electronic dance music festival. Featuring world-class DJs, immersive visual experiences, and a vibrant community of music lovers.',
            category: 'Music',
            location: 'Shoreline Arena, Goa',
            city: 'Goa',
            basePrice: 150,
            totalSeats: 2000,
            imageUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745',
            status: 'PUBLISHED',
            daysOffset: 45,
            organizerId: organizerD.id
        },
        {
            title: 'Startup Pitch Day',
            description: 'Watch the hottest new startups pitch to a panel of top-tier investors. A great event for entrepreneurs looking for funding and inspiration.',
            category: 'Startups',
            location: 'WeWork Galaxy, Bangalore',
            city: 'Bangalore',
            basePrice: 50,
            totalSeats: 100,
            imageUrl: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd',
            status: 'PUBLISHED',
            daysOffset: 15,
            organizerId: organizerC.id
        },
        {
            title: 'Modern Art Exhibition',
            description: 'Explore the latest trends in contemporary art. This exhibition features works from emerging local artists and established masters alike.',
            category: 'Art',
            location: 'National Gallery of Modern Art, Delhi',
            city: 'Delhi',
            basePrice: 20,
            totalSeats: 300,
            imageUrl: 'https://images.unsplash.com/photo-1541963463532-d68292c34b19',
            status: 'PUBLISHED',
            daysOffset: -10, // Past event
            organizerId: organizerD.id
        },
        {
            title: 'FinTech Revolution 2026',
            description: 'Deep dive into the future of digital banking, cryptocurrency, and decentralized finance. Network with the top minds in FinTech.',
            category: 'Business',
            location: 'Taj Lands End, Mumbai',
            city: 'Mumbai',
            basePrice: 500,
            totalSeats: 250,
            imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71',
            status: 'PUBLISHED',
            daysOffset: 60,
            organizerId: organizerC.id
        },
        {
            title: 'Gourmet Food Fair',
            description: 'Taste the best flavors from around the world. From street food to fine dining, this fair is a paradise for foodies.',
            category: 'Food',
            location: 'Exhibition Grounds, Pune',
            city: 'Pune',
            basePrice: 30,
            totalSeats: 1000,
            imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836',
            status: 'PUBLISHED',
            daysOffset: 5,
            organizerId: organizerC.id
        },
        {
            title: 'Yoga and Mindfulness retreat',
            description: 'A weekend of rejuvenation and peace. Join expert instructors for guided meditation, sunrise yoga, and holistic wellness workshops.',
            category: 'Health',
            location: 'Rishikesh Valley Resort',
            city: 'Rishikesh',
            basePrice: 400,
            totalSeats: 50,
            imageUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b',
            status: 'PUBLISHED',
            daysOffset: 20,
            organizerId: organizerD.id
        },
        {
            title: 'Cloud Native Lab',
            description: 'A hands-on workshop on Kubernetes, Docker, and Microservices. Perfect for developers looking to upgrade their cloud skills.',
            category: 'Technology',
            location: 'Tech Hub, Bangalore',
            city: 'Bangalore',
            basePrice: 120,
            totalSeats: 40,
            imageUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc48',
            status: 'PUBLISHED',
            daysOffset: 25,
            organizerId: organizerC.id
        },
        {
            title: 'Indie Film Festival',
            description: 'Celebrating the best of independent cinema. Screenings, Q&A sessions with directors, and workshops on screenwriting.',
            category: 'Art',
            location: 'Liberty Cinema, Mumbai',
            city: 'Mumbai',
            basePrice: 25,
            totalSeats: 400,
            imageUrl: 'https://images.unsplash.com/photo-1485846234645-a62644f84728',
            status: 'PUBLISHED',
            daysOffset: -5, // Past event
            organizerId: organizerD.id
        },
        {
            title: 'Marathon for Hope 2026',
            description: 'Run for a cause. Join thousands of runners in this annual marathon to raise awareness and funds for local charities.',
            category: 'Sports',
            location: 'Marine Drive, Mumbai',
            city: 'Mumbai',
            basePrice: 15,
            totalSeats: 5000,
            imageUrl: 'https://images.unsplash.com/photo-1452626038306-9aae5e071dd3',
            status: 'PUBLISHED',
            daysOffset: 12,
            organizerId: organizerC.id
        },
        {
            title: 'Crypto Connect Bengaluru',
            description: 'The premiere networking event for the Web3 and Blockchain community in India. Discuss the latest in DeFi, NFTs, and DAOs.',
            category: 'Technology',
            location: 'The Leela, Bangalore',
            city: 'Bangalore',
            basePrice: 80,
            totalSeats: 200,
            imageUrl: 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d',
            status: 'PUBLISHED',
            daysOffset: 35,
            organizerId: organizerC.id
        },
        {
            title: 'Symphony Under the Stars',
            description: 'A magical evening of classical music performed by the National Philharmonic Orchestra in an open-air setting.',
            category: 'Music',
            location: 'Nehru Park, Delhi',
            city: 'Delhi',
            basePrice: 100,
            totalSeats: 600,
            imageUrl: 'https://images.unsplash.com/photo-1514328537441-bd50fb288927',
            status: 'PUBLISHED',
            daysOffset: 50,
            organizerId: organizerD.id
        }
    ];

    const createdEvents = [];
    for (const data of eventData) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() + data.daysOffset);
        const endDate = new Date(startDate);
        endDate.setHours(endDate.getHours() + 4);

        const event = await prisma.event.create({
            data: {
                title: data.title,
                description: data.description,
                category: data.category,
                location: data.location,
                city: data.city,
                basePrice: data.basePrice,
                totalSeats: data.totalSeats,
                availableSeats: data.totalSeats - 5, // Reserve some for bookings
                imageUrl: data.imageUrl,
                status: data.status as any,
                startDate,
                endDate,
                organizerId: data.organizerId
            }
        });
        createdEvents.push(event);
    }

    // 3. Create Bookings & Tickets
    console.log('🎟️ Creating bookings...');

    // Normal bookings for Attendee A
    for (let i = 0; i < 3; i++) {
        const event = createdEvents[i];
        const ticket = await prisma.ticket.create({
            data: {
                eventId: event.id,
                qrToken: `ticket-${uuidv4().slice(0, 8)}`,
                isUsed: i === 3 // Make past ones used if needed
            }
        });

        await prisma.booking.create({
            data: {
                userId: attendeeA.id,
                eventId: event.id,
                ticketId: ticket.id,
                pricePaid: event.basePrice,
                status: 'CONFIRMED'
            }
        });
    }

    // Past bookings for Attendee B (for feedback)
    const pastEvents = createdEvents.filter(e => e.startDate < new Date());
    for (const event of pastEvents) {
        const ticket = await prisma.ticket.create({
            data: {
                eventId: event.id,
                qrToken: `ticket-past-${uuidv4().slice(0, 8)}`,
                isUsed: true
            }
        });

        await prisma.booking.create({
            data: {
                userId: attendeeB.id,
                eventId: event.id,
                ticketId: ticket.id,
                pricePaid: event.basePrice,
                status: 'CONFIRMED'
            }
        });

        // Add feedback
        await prisma.feedback.create({
            data: {
                userId: attendeeB.id,
                eventId: event.id,
                rating: 5,
                comment: 'Amazing experience! Well organized and informative.',
                sentiment: 'positive'
            }
        });
    }

    // 4. Create Fraud Attempt (Attendee B bookings one event multiple times quickly)
    console.log('🚨 Simulating fraud attempt...');
    const targetEvent = createdEvents[0]; // Global AI Summit

    // Create a FLAGGED booking
    const fraudTicket = await prisma.ticket.create({
        data: {
            eventId: targetEvent.id,
            qrToken: `fraud-${uuidv4().slice(0, 8)}`,
        }
    });

    await prisma.booking.create({
        data: {
            userId: attendeeB.id,
            eventId: targetEvent.id,
            ticketId: fraudTicket.id,
            pricePaid: targetEvent.basePrice,
            status: 'FLAGGED',
            riskScore: 0.98,
            ipAddress: '192.168.1.100',
            userAgent: 'Mozilla/5.0 (Bot; Rapid-Booking)'
        }
    });

    console.log('✨ Seed complete!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

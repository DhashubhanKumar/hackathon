import { prisma } from "../lib/db";

async function main() {
    console.log("Seeding realistic scenario...");

    // 1. Create Attendee (a@gmail.com)
    const attendeeEmail = "a@gmail.com";
    const attendee = await prisma.user.upsert({
        where: { email: attendeeEmail },
        update: {},
        create: {
            name: "Alice Attendee",
            email: attendeeEmail,
            role: "ATTENDEE",
            city: "New York",
            interests: ["Music", "Food"],
        },
    });
    console.log(`Created Attendee: ${attendeeEmail} (${attendee.id})`);

    // 2. Create Organizer (b@gmail.com)
    const organizerEmail = "b@gmail.com";
    const organizer = await prisma.user.upsert({
        where: { email: organizerEmail },
        update: {},
        create: {
            name: "Bob Events",
            email: organizerEmail,
            role: "ORGANIZER",
            city: "New York",
            interests: ["Business"],
        },
    });
    console.log(`Created Organizer: ${organizerEmail} (${organizer.id})`);

    // Data for events
    const eventsList = [
        {
            title: "Summer Music Festival 2024",
            description: "Blast from the past.",
            image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=2670&auto=format&fit=crop",
            category: "Music",
            price: 100,
            isPast: true,
            rating: 5,
            comment: "Best festival ever! Loved the vibe."
        },
        {
            title: "Tech Conference 2024",
            description: "Old tech meetup.",
            image: "https://images.unsplash.com/photo-1544531586-fde5298cdd40?q=80&w=2670&auto=format&fit=crop",
            category: "Technology",
            price: 250,
            isPast: true,
            rating: 4,
            comment: "Great speakers, food was okay."
        },
        {
            title: "Future Gala 2026",
            description: "Upcoming gala dinner.",
            image: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?q=80&w=2670&auto=format&fit=crop",
            category: "Business",
            price: 150,
            isPast: false
        },
        {
            title: "Neon Art Exhibit",
            description: "Modern art showcase.",
            image: "https://images.unsplash.com/photo-1536924940846-227afb31e2a5?q=80&w=2666&auto=format&fit=crop",
            category: "Art",
            price: 45,
            isPast: false
        },
        {
            title: "Global Food Market",
            description: "Tasting event.",
            image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=2574&auto=format&fit=crop",
            category: "Food",
            price: 30,
            isPast: false
        }
    ];

    for (let i = 0; i < eventsList.length; i++) {
        const eData = eventsList[i];

        // Calculate dates
        let start = new Date();
        let end = new Date();

        if (eData.isPast) {
            start.setFullYear(start.getFullYear() - 1); // Last year
            end.setFullYear(end.getFullYear() - 1);
        } else {
            start.setDate(start.getDate() + (i + 1) * 7); // Future dates staggered
            end.setDate(end.getDate() + (i + 1) * 7);
        }

        const event = await prisma.event.create({
            data: {
                title: eData.title,
                description: eData.description,
                imageUrl: eData.image,
                startDate: start,
                endDate: end,
                location: "Grand Hall",
                city: "New York",
                basePrice: eData.price,
                totalSeats: 200,
                availableSeats: 195,
                organizerId: organizer.id,
                status: eData.isPast ? "COMPLETED" : "PUBLISHED",
                category: eData.category
            }
        });

        // Create Booking for Attendee A
        const ticket = await prisma.ticket.create({
            data: {
                eventId: event.id,
                qrToken: `QR_${event.id}_A`,
                isUsed: eData.isPast
            }
        });

        await prisma.booking.create({
            data: {
                userId: attendee.id,
                eventId: event.id,
                ticketId: ticket.id,
                pricePaid: eData.price,
                status: "CONFIRMED"
            }
        });

        // If past event, add feedback
        if (eData.isPast && eData.rating) {
            await prisma.feedback.create({
                data: {
                    userId: attendee.id,
                    eventId: event.id,
                    rating: eData.rating,
                    comment: eData.comment || "Good event",
                    sentiment: "POSITIVE"
                }
            });
        }
    }

    console.log("Seeding complete.");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

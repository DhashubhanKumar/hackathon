
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Simulating scam booking...');

    const attendeeEmail = 'a@gmail.com';
    const organizerEmail = 'b@gmail.com';

    // 1. Get Attendee
    const attendee = await prisma.user.findUnique({ where: { email: attendeeEmail } });
    if (!attendee) throw new Error(`Attendee ${attendeeEmail} not found`);

    // 2. Get Organizer and their Event
    const organizer = await prisma.user.findUnique({
        where: { email: organizerEmail },
        include: { eventsCreated: true }
    });
    if (!organizer || organizer.eventsCreated.length === 0) {
        throw new Error(`Organizer ${organizerEmail} has no events`);
    }

    const event = organizer.eventsCreated[0]; // Pick the first event

    // 3. Create Ticket
    const ticket = await prisma.ticket.create({
        data: {
            eventId: event.id,
            qrToken: `SCAM-${Date.now()}`
        }
    });

    // 4. Create Flagged Booking
    const booking = await prisma.booking.create({
        data: {
            userId: attendee.id,
            eventId: event.id,
            ticketId: ticket.id,
            pricePaid: event.basePrice,
            status: 'FLAGGED',
            riskScore: 0.98,
            ipAddress: '192.168.1.1 (Suspicious Proxy)',
            userAgent: 'Bot/1.0',
        }
    });

    console.log(`✅ Fraud simulation successful!`);
    console.log(`Booking ID: ${booking.id}`);
    console.log(`Status: ${booking.status}`);
    console.log(`Risk Score: ${booking.riskScore}`);
    console.log(`Check dashboard at: http://localhost:3000/dashboard/organizer?userId=${organizer.id}`);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

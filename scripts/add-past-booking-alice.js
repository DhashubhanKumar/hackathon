const { PrismaClient } = require('@prisma/client');
const { v4: uuidv4 } = require('uuid');

const prisma = new PrismaClient();

async function main() {
    const alice = await prisma.user.findUnique({
        where: { email: 'a@gmail.com' }
    });

    if (!alice) {
        console.error('Alice not found!');
        return;
    }

    const pastEvent = await prisma.event.findFirst({
        where: {
            startDate: {
                lt: new Date()
            }
        }
    });

    if (!pastEvent) {
        console.log('No past events found to book.');
        return;
    }

    const ticket = await prisma.ticket.create({
        data: {
            eventId: pastEvent.id,
            qrToken: `ticket-past-alice-${uuidv4().slice(0, 8)}`,
            isUsed: true
        }
    });

    await prisma.booking.create({
        data: {
            userId: alice.id,
            eventId: pastEvent.id,
            ticketId: ticket.id,
            pricePaid: pastEvent.basePrice,
            status: 'CONFIRMED'
        }
    });

    console.log(`Added past event booking for Alice: ${pastEvent.title}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

import { prisma } from "../lib/db";
import { createUser, createEvent, bookEvent, getOrganizerDashboard } from "../app/actions";

async function main() {
    console.log("Starting DB Verification...");

    // 1. Create Organizer
    console.log("Creating Organizer...");
    const organizer = await createUser({
        name: "Alice Organizer",
        email: `alice_${Date.now()}@test.com`,
        phone: "123-456-7890",
        role: "ORGANIZER",
    });
    if (!organizer.success || !organizer.user) throw new Error("Failed to create organizer");
    console.log("Organizer created:", organizer.user.id);

    // 2. Create Event
    console.log("Creating Event...");
    const event = await createEvent({
        title: "Test Event",
        description: "This is a test event",
        date: new Date(),
        location: "Test Location",
        price: 100,
        totalTickets: 10,
        organizerId: organizer.user.id,
    });
    if (!event.success || !event.event) throw new Error("Failed to create event");
    console.log("Event created:", event.event.id);

    // 3. Create Attendee
    console.log("Creating Attendee...");
    const attendee = await createUser({
        name: "Bob Attendee",
        email: `bob_${Date.now()}@test.com`,
        phone: "987-654-3210",
        role: "ATTENDEE",
    });
    if (!attendee.success || !attendee.user) throw new Error("Failed to create attendee");
    console.log("Attendee created:", attendee.user.id);

    // 4. Book Event
    console.log("Booking Event...");
    const booking = await bookEvent({
        userId: attendee.user.id,
        eventId: event.event.id,
        tickets: 2,
        totalPrice: 200,
    });
    if (!booking.success || !booking.booking) throw new Error("Failed to book event");
    console.log("Booking created:", booking.booking.id);

    // 5. Verify Dashboard
    console.log("Verifying Dashboard...");
    const dashboard = await getOrganizerDashboard(organizer.user.id);
    if (!dashboard.success || !dashboard.events) throw new Error("Failed to fetch dashboard");

    const dashboardEvent = dashboard.events.find(e => e.id === event.event.id);
    if (!dashboardEvent) throw new Error("Event not found in dashboard");

    const bookingEntry = dashboardEvent.bookings.find(b => b.id === booking.booking.id);
    if (!bookingEntry) throw new Error("Booking not found in dashboard event");

    console.log("Dashboard verification successful!");
    console.log("Attendee Name in Dashboard:", bookingEntry.user.name);
    console.log("Attendee Phone in Dashboard:", bookingEntry.user.phone);

    console.log("ALL TESTS PASSED");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

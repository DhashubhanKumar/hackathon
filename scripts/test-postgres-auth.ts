import { registerUser, loginUser, createEvent, bookEvent, getLatestEvents, getUserBookings, getOrganizerDashboard } from "../app/actions";
import { prisma } from "../lib/db";

async function main() {
    console.log("🚀 Starting PostgreSQL + Auth Verification...\n");

    // 1. Register an Organizer
    console.log("1️⃣  Registering Organizer...");
    const organizer = await registerUser({
        email: `organizer_${Date.now()}@test.com`,
        password: "password123",
        phone: "123-456-7890",
        role: "ORGANIZER",
    });

    if (!organizer.success || !organizer.user) {
        throw new Error("Failed to register organizer");
    }
    console.log(`✅ Organizer registered: ${organizer.user.name} (${organizer.user.email})`);

    // 2. Login as Organizer
    console.log("\n2️⃣  Testing Login...");
    const loginResult = await loginUser({
        email: organizer.user.email,
        password: "password123",
    });

    if (!loginResult.success || !loginResult.user) {
        throw new Error("Login failed");
    }
    console.log(`✅ Login successful: ${loginResult.user.name}`);

    // 3. Create Event
    console.log("\n3️⃣  Creating Event...");
    const event = await createEvent({
        title: "Tech Conference 2026",
        description: "Annual tech conference",
        date: new Date("2026-06-15"),
        location: "San Francisco, CA",
        price: 299.99,
        totalTickets: 100,
        organizerId: organizer.user.id,
        category: "Technology",
    });

    if (!event.success || !event.event) {
        throw new Error("Failed to create event");
    }
    console.log(`✅ Event created: ${event.event.title}`);

    // 4. Register Attendee
    console.log("\n4️⃣  Registering Attendee...");
    const attendee = await registerUser({
        email: `attendee_${Date.now()}@test.com`,
        password: "password456",
        phone: "987-654-3210",
        role: "ATTENDEE",
    });

    if (!attendee.success || !attendee.user) {
        throw new Error("Failed to register attendee");
    }
    console.log(`✅ Attendee registered: ${attendee.user.name} (${attendee.user.email})`);

    // 5. Book Event
    console.log("\n5️⃣  Booking Event...");
    const booking = await bookEvent({
        userId: attendee.user.id,
        eventId: event.event.id,
        tickets: 2,
        totalPrice: 599.98,
    });

    if (!booking.success || !booking.booking) {
        throw new Error("Failed to book event");
    }
    console.log(`✅ Booking created: ${booking.booking.tickets} tickets`);

    // 6. Test getLatestEvents
    console.log("\n6️⃣  Fetching Latest Events...");
    const latestEvents = await getLatestEvents(5);

    if (!latestEvents.success || !latestEvents.events) {
        throw new Error("Failed to fetch latest events");
    }
    console.log(`✅ Found ${latestEvents.events.length} events`);

    // 7. Test getUserBookings
    console.log("\n7️⃣  Fetching User Bookings...");
    const userBookings = await getUserBookings(attendee.user.id);

    if (!userBookings.success || !userBookings.bookings) {
        throw new Error("Failed to fetch user bookings");
    }
    console.log(`✅ Found ${userBookings.bookings.length} bookings for attendee`);

    // 8. Test getOrganizerDashboard
    console.log("\n8️⃣  Fetching Organizer Dashboard...");
    const dashboard = await getOrganizerDashboard(organizer.user.id);

    if (!dashboard.success || !dashboard.events) {
        throw new Error("Failed to fetch organizer dashboard");
    }
    console.log(`✅ Organizer has ${dashboard.events.length} events`);

    if (dashboard.events.length > 0) {
        const firstEvent = dashboard.events[0];
        console.log(`   Event: ${firstEvent.title}`);
        console.log(`   Bookings: ${firstEvent.bookings.length}`);
        if (firstEvent.bookings.length > 0) {
            const firstBooking = firstEvent.bookings[0];
            console.log(`   Attendee: ${firstBooking.user.name} (${firstBooking.user.phone})`);
        }
    }

    console.log("\n✨ ALL TESTS PASSED! ✨");
}

main()
    .catch((e) => {
        console.error("\n❌ Test failed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

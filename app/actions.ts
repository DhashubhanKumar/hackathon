"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

// --- Authentication Actions ---

export async function registerUser(data: {
    email: string;
    name?: string;
    role: "ATTENDEE" | "ORGANIZER";
    city?: string;
    interests?: string[];
    password?: string;
}) {
    try {
        // Check if user already exists
        const existing = await prisma.user.findUnique({
            where: { email: data.email }
        });

        if (existing) {
            return { success: false, error: "User already exists" };
        }

        const user = await prisma.user.create({
            data: {
                email: data.email,
                name: data.name || data.email.split('@')[0], // Use email prefix as default name
                role: data.role,
                city: data.city,
                interests: data.interests || [],
                password: data.password || 'dhashu', // Default to dhashu if not provided
            },
        });

        return { success: true, user };
    } catch (error) {
        console.error("Error registering user:", error);
        return { success: false, error: error instanceof Error ? error.message : "Failed to register user" };
    }
}

export async function loginUser(data: { email: string; password?: string }) {
    try {
        const user = await prisma.user.findUnique({
            where: { email: data.email }
        });

        if (!user) {
            return { success: false, error: "User not found. Please register first." };
        }

        // Simple password check (plain text as requested)
        if (data.password && user.password && user.password !== data.password) {
            return { success: false, error: "Invalid password" };
        }

        return { success: true, user };
    } catch (error) {
        console.error("Error logging in:", error);
        return { success: false, error: error instanceof Error ? error.message : "Login failed" };
    }
}

export async function getUserByEmail(email: string) {
    try {
        const user = await prisma.user.findUnique({
            where: { email }
        });
        return { success: true, user };
    } catch (error) {
        return { success: false, error: "Failed to fetch user" };
    }
}



// --- Event Actions ---

export async function createEvent(data: {
    title: string;
    description: string;
    startDate: Date;
    endDate: Date;
    location: string;
    price: number;
    totalTickets: number;
    organizerId: string;
    imageUrl?: string;
    category?: string;
}) {
    try {
        const event = await prisma.event.create({
            data: {
                title: data.title,
                description: data.description,
                startDate: data.startDate,
                endDate: data.endDate,
                location: data.location,
                basePrice: data.price,
                totalSeats: data.totalTickets,
                availableSeats: data.totalTickets, // Initially same as total
                organizerId: data.organizerId,
                imageUrl: data.imageUrl,
                category: data.category,
            },
        });
        try {
            revalidatePath("/");
            revalidatePath("/dashboard");
        } catch (e) {
            // Ignored for test scripts
        }
        return { success: true, event };
    } catch (error) {
        console.error("Error creating event:", error);
        return { success: false, error: "Failed to create event" };
    }
}

export async function getOrganizerDashboard(organizerId: string) {
    try {
        const events = await prisma.event.findMany({
            where: { organizerId },
            include: {
                bookings: {
                    include: {
                        user: true, // Include user details (name, phone)
                    },
                },
            },
            orderBy: { createdAt: 'desc' }
        });
        return { success: true, events };
    } catch (error) {
        console.error("Error fetching dashboard:", error);
        return { success: false, error: "Failed to fetch dashboard data" };
    }
}

// --- Booking Actions ---

export async function bookEvent(data: { userId: string; eventId: string; tickets: number; totalPrice: number }) {
    try {
        // 1. Check availability
        const event = await prisma.event.findUnique({
            where: { id: data.eventId },
        });

        if (!event) return { success: false, error: "Event not found" };
        if (event.availableSeats < data.tickets) {
            return { success: false, error: "Not enough tickets available" };
        }

        // 2. Create Booking and Update Event in a transaction
        const result = await prisma.$transaction(async (tx) => {
            // Create a Ticket first
            const ticket = await tx.ticket.create({
                data: {
                    eventId: data.eventId,
                    qrToken: Math.random().toString(36).substring(7),
                }
            });

            const booking = await tx.booking.create({
                data: {
                    userId: data.userId,
                    eventId: data.eventId,
                    pricePaid: data.totalPrice,
                    ticketId: ticket.id,
                    status: "CONFIRMED",
                },
            });

            await tx.event.update({
                where: { id: data.eventId },
                data: {
                    availableSeats: {
                        decrement: 1, // Simple case: 1 ticket per booking for now to match schema
                    },
                },
            });

            return { booking };
        });

        try {
            revalidatePath(`/events/${data.eventId}`);
            revalidatePath("/dashboard");
        } catch (e) {
            // Ignored for test scripts
        }

        return { success: true, booking: result.booking };
    } catch (error) {
        console.error("Error booking event:", error);
        return { success: false, error: "Booking failed" };
    }
}

// --- Home Page Actions ---

export async function getLatestEvents(limit: number = 5) {
    try {
        const events = await prisma.event.findMany({
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
                organizer: {
                    select: {
                        name: true,
                        email: true
                    }
                }
            }
        });
        return { success: true, events };
    } catch (error) {
        console.error("Error fetching latest events:", error);
        return { success: false, error: "Failed to fetch events" };
    }
}

// --- Dashboard Actions ---

export async function getUserBookings(userId: string) {
    try {
        const bookings = await prisma.booking.findMany({
            where: { userId },
            include: {
                event: {
                    include: {
                        organizer: {
                            select: {
                                name: true,
                                email: true
                            }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        return { success: true, bookings };
    } catch (error) {
        console.error("Error fetching user bookings:", error);
        return { success: false, error: "Failed to fetch bookings" };
    }
}

import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        console.log('Creating event with body:', body);

        // In real app, verify user is ORGANIZER here via session/cookie

        if (!body.organizerId) {
            return NextResponse.json({ error: 'organizerId is required' }, { status: 400 });
        }

        const eventDate = new Date(body.date);

        // Validation: Date must be in the future
        if (eventDate <= new Date()) {
            return NextResponse.json({ error: 'Event date must be in the future' }, { status: 400 });
        }

        // Calculate end date (default to 3 hours later)
        const endDate = new Date(eventDate.getTime() + 3 * 60 * 60 * 1000);

        const event = await prisma.event.create({
            data: {
                title: body.title,
                description: body.description,
                startDate: eventDate,
                endDate: endDate,
                location: body.location,
                basePrice: parseFloat(body.price),
                totalSeats: parseInt(body.totalTickets),
                availableSeats: parseInt(body.totalTickets),
                organizerId: body.organizerId,
                imageUrl: (typeof body.imageUrl === 'string' && body.imageUrl.length > 0) ? body.imageUrl : null,
                category: body.category || null,
                city: body.city || null,
                status: 'PUBLISHED',
            },
        });

        return NextResponse.json({ success: true, event });
    } catch (error: any) {
        console.error('Event creation error:', error);
        return NextResponse.json({ error: error.message || 'Failed to create event' }, { status: 500 });
    }
}

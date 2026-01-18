import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const event = await prisma.event.findUnique({
            where: { id: params.id },
            select: {
                id: true,
                title: true,
                basePrice: true,
                pricingMode: true,
                autoPricingEnabled: true,
                minPrice: true,
                maxPrice: true,
                lastPriceUpdate: true,
            },
        });

        if (!event) {
            return NextResponse.json(
                { error: 'Event not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ event });
    } catch (error: any) {
        console.error('Error fetching event:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch event' },
            { status: 500 }
        );
    }
}

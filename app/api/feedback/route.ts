import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { eventId, userId, rating, comment, sentiment } = body;

        const feedback = await prisma.feedback.create({
            data: {
                eventId,
                userId,
                rating,
                comment,
                sentiment
            }
        });

        return NextResponse.json({ success: true, feedback });
    } catch (error) {
        console.error('Error creating feedback:', error);
        return NextResponse.json({ error: 'Failed to submit feedback' }, { status: 500 });
    }
}

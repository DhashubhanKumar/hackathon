import { prisma } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { calculateRiskScore } from '@/lib/ai/fraud-detection';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { eventId, userId, pricePaid } = body;

        if (!eventId || !userId || !pricePaid) {
            return NextResponse.json(
                { error: 'eventId, userId, and pricePaid are required' },
                { status: 400 }
            );
        }

        // Get event details
        const event = await prisma.event.findUnique({
            where: { id: eventId },
        });

        if (!event) {
            return NextResponse.json(
                { error: 'Event not found' },
                { status: 404 }
            );
        }

        // Check seat availability
        if (event.availableSeats <= 0) {
            return NextResponse.json(
                { error: 'No seats available' },
                { status: 400 }
            );
        }

        // Extract request metadata
        const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || null;
        const userAgent = req.headers.get('user-agent') || null;

        // AI Fraud Detection
        const riskAssessment = await calculateRiskScore(
            userId,
            eventId,
            ipAddress,
            userAgent,
            pricePaid
        );

        // Create ticket
        const ticket = await prisma.ticket.create({
            data: {
                eventId,
                qrToken: `QR-${Date.now()}-${Math.random().toString(36).substring(7)}`,
            },
        });

        // Create booking with risk score
        const booking = await prisma.booking.create({
            data: {
                userId,
                eventId,
                ticketId: ticket.id,
                pricePaid,
                ipAddress,
                userAgent,
                riskScore: riskAssessment.riskScore,
                status: riskAssessment.shouldFlag ? 'FLAGGED' : 'CONFIRMED',
            },
            include: {
                ticket: true,
                event: true,
                user: true,
            },
        });

        // Update event availability
        await prisma.event.update({
            where: { id: eventId },
            data: {
                availableSeats: {
                    decrement: 1,
                },
            },
        });

        return NextResponse.json({
            success: true,
            booking: {
                id: booking.id,
                status: booking.status,
                pricePaid: booking.pricePaid,
            },
            ticket: {
                id: ticket.id,
                qrToken: ticket.qrToken,
            },
            message: 'Booking successful',
        });
    } catch (error) {
        console.error('Booking error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}

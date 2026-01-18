import { NextRequest, NextResponse } from 'next/server';
import { suggestPrice } from '@/lib/ai/pricing-engine';

/**
 * POST /api/pricing/suggest
 * Get AI price suggestion without applying it
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { eventId } = body;

        if (!eventId) {
            return NextResponse.json(
                { error: 'eventId is required' },
                { status: 400 }
            );
        }

        const suggestion = await suggestPrice(eventId);

        return NextResponse.json({
            success: true,
            suggestion,
        });
    } catch (error: any) {
        console.error('Error getting price suggestion:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to get price suggestion' },
            { status: 500 }
        );
    }
}

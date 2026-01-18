import { NextRequest, NextResponse } from 'next/server';
import { suggestPrice, applyPricingSuggestion } from '@/lib/ai/pricing-engine';

/**
 * POST /api/pricing/optimize
 * Get dynamic pricing suggestion for an event
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { eventId, autoApply = false } = body;

        if (!eventId) {
            return NextResponse.json(
                { error: 'eventId is required' },
                { status: 400 }
            );
        }

        const suggestion = await suggestPrice(eventId);
        const result = await applyPricingSuggestion(eventId, suggestion, autoApply);

        return NextResponse.json({
            success: true,
            eventId,
            ...result,
        });
    } catch (error: any) {
        console.error('Error in pricing optimization API:', error);
        return NextResponse.json(
            {
                success: false,
                error: error.message || 'Failed to optimize pricing',
            },
            { status: 500 }
        );
    }
}

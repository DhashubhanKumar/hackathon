import { NextRequest, NextResponse } from 'next/server';
import { analyzeFeedbackForEvent } from '@/lib/ai/sentiment-analysis';

/**
 * POST /api/feedback/analyze
 * Analyze feedback sentiment for an event
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

        const analysis = await analyzeFeedbackForEvent(eventId);

        return NextResponse.json({
            success: true,
            analysis,
        });
    } catch (error: any) {
        console.error('Error in feedback analysis API:', error);
        return NextResponse.json(
            {
                success: false,
                error: error.message || 'Failed to analyze feedback',
            },
            { status: 500 }
        );
    }
}

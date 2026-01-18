import { NextRequest, NextResponse } from 'next/server';
import { analyzeEventPerformance } from '@/lib/ai/analytics-engine';

/**
 * POST /api/organizer/insights
 * Get AI-powered insights for event organizers
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

        const insights = await analyzeEventPerformance(eventId);

        return NextResponse.json({
            success: true,
            insights,
        });
    } catch (error: any) {
        console.error('Error in organizer insights API:', error);
        return NextResponse.json(
            {
                success: false,
                error: error.message || 'Failed to generate insights',
            },
            { status: 500 }
        );
    }
}

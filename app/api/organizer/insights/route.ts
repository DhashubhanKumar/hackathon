import { NextRequest, NextResponse } from 'next/server';
import { analyzeEventPerformance, analyzeOrganizerPerformance } from '@/lib/ai/analytics-engine';

export const dynamic = 'force-dynamic';

/**
 * POST /api/organizer/insights
 * Get AI-powered insights for event organizers
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { eventId, userId } = body;

        if (!eventId && !userId) {
            return NextResponse.json(
                { error: 'Either eventId or userId is required' },
                { status: 400 }
            );
        }

        let insights;
        if (eventId) {
            insights = await analyzeEventPerformance(eventId);
        } else if (userId) {
            insights = await analyzeOrganizerPerformance(userId);
        }

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

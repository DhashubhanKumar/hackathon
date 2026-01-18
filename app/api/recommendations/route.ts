import { NextRequest, NextResponse } from 'next/server';
import { generateRecommendations } from '@/lib/ai/recommendation-engine';
import { prisma } from '@/lib/db';

/**
 * POST /api/recommendations
 * Get personalized, enriched event recommendations
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { userId } = body;

        if (!userId) {
            return NextResponse.json(
                { error: 'User ID is required' },
                { status: 400 }
            );
        }

        // 1. Get Recommendations (Ids, Scores, Explanations)
        const recommendations = await generateRecommendations(userId);

        if (recommendations.length === 0) {
            return NextResponse.json({
                success: true,
                recommendations: []
            });
        }

        // 2. Fetch Full Event Data
        const eventIds = recommendations.map(rec => rec.eventId);
        const events = await prisma.event.findMany({
            where: { id: { in: eventIds } }
        });

        // 3. Combine Data and sort by score
        const enrichedRecommendations = recommendations.map(rec => {
            const event = events.find(e => e.id === rec.eventId);
            if (!event) return null;
            return {
                ...event,
                matchScore: rec.score,
                matchReason: rec.explanation
            };
        })
            .filter(Boolean)
            .filter(rec => (rec?.matchScore || 0) > 60)
            .sort((a, b) => (b?.matchScore || 0) - (a?.matchScore || 0));

        return NextResponse.json({
            success: true,
            recommendations: enrichedRecommendations
        });

    } catch (error: any) {
        console.error('Error getting recommendations:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to get recommendations' },
            { status: 500 }
        );
    }
}

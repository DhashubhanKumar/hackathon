import { NextRequest, NextResponse } from 'next/server';
import { semanticSearch } from '@/lib/ai/semantic-search';

/**
 * POST /api/search/semantic
 * Perform semantic search on events using natural language
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { query } = body;

        if (!query) {
            return NextResponse.json(
                { error: 'query is required' },
                { status: 400 }
            );
        }

        const result = await semanticSearch(query);

        return NextResponse.json({
            success: true,
            query,
            intent: result.intent,
            events: result.events,
            totalResults: result.totalResults,
        });
    } catch (error: any) {
        console.error('Error in semantic search API:', error);
        return NextResponse.json(
            {
                success: false,
                error: error.message || 'Failed to perform semantic search',
            },
            { status: 500 }
        );
    }
}

import { NextRequest, NextResponse } from 'next/server';
import { getEventAdvice } from '@/lib/ai/advisor-engine';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // Basic validation
        if (!body.city || !body.category) {
            return NextResponse.json({ error: 'City and Category are required for analysis' }, { status: 400 });
        }

        const advice = await getEventAdvice({
            title: body.title || 'Untitled Event',
            description: body.description || '',
            city: body.city,
            category: body.category || 'General',
            date: body.date || new Date().toISOString(),
            price: parseFloat(body.price) || 0
        });

        return NextResponse.json({ success: true, advice });

    } catch (error) {
        console.error('Advisor API Error:', error);
        return NextResponse.json({ error: 'Failed to generate advice' }, { status: 500 });
    }
}

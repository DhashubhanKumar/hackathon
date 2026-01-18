import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY || 'mock-key',
    dangerouslyAllowBrowser: true,
});

export async function POST(req: Request) {
    try {
        const { query } = await req.json();
        const allEvents = await prisma.event.findMany();

        // If no key, basic keyword filter mock
        if (!process.env.GROQ_API_KEY) {
            const lowerQ = query.toLowerCase();
            const matches = allEvents.filter(e =>
                e.title.toLowerCase().includes(lowerQ) ||
                e.description.toLowerCase().includes(lowerQ) ||
                e.category?.toLowerCase().includes(lowerQ)
            ).map(e => ({ ...e, matchReason: 'Keyword match' }));
            return NextResponse.json({ events: matches });
        }

        // Use Groq to filter/rank
        const eventsContext = allEvents.map(e => ({ id: e.id, title: e.title, description: e.description, category: e.category }));

        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: 'system',
                    content: `You are an event search assistant. Given a user query and a list of events, return a valid JSON object with a single key "matches". "matches" should be an array of objects, each containing "id" (from the event list) and "matchReason" (short string explaining why it fits). Only include events that are relevant. \n\nEvents: ${JSON.stringify(eventsContext)}`
                },
                {
                    role: 'user',
                    content: query
                }
            ],
            model: 'llama-3.3-70b-versatile',
            response_format: { type: 'json_object' }
        });

        const aiRes = JSON.parse(completion.choices[0]?.message?.content || '{}');
        const matchedIds = aiRes.matches?.map((m: any) => m.id) || [];

        const finalResults = allEvents
            .filter(e => matchedIds.includes(e.id))
            .map(e => {
                const match = aiRes.matches.find((m: any) => m.id === e.id);
                return { ...e, matchReason: match?.matchReason || 'AI Recommended' };
            });

        return NextResponse.json({ events: finalResults });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Internal Server Error', events: [] }, { status: 500 });
    }
}

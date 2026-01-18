import { groq, AI_MODEL } from './groq-client';
import { aiLogger } from './logger';
import { SearchIntent } from './types';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Parse natural language query into structured search intent using Groq AI
 */
export async function parseQuery(query: string): Promise<SearchIntent> {
    const prompt = `You are a semantic search intent extraction AI.

USER QUERY: "${query}"

Extract structured search intent from this query. Identify:
1. Event category (e.g., "technology", "music", "sports", "art", "business")
2. Date range (if mentioned, extract start and end dates)
3. City/location (if mentioned)
4. Keywords (important terms that describe what user wants)

Return ONLY valid JSON in this exact format:
{
  "category": "technology" or null,
  "dateRange": {
    "start": "2026-01-20",
    "end": "2026-01-25"
  } or null,
  "city": "Mumbai" or null,
  "keywords": ["AI", "conference"],
  "confidence": 0.85
}

Current date for reference: ${new Date().toISOString().split('T')[0]}`;

    try {
        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: 'system',
                    content: 'You are a semantic search engine. Always return valid JSON only, no additional text.',
                },
                {
                    role: 'user',
                    content: prompt,
                },
            ],
            model: AI_MODEL,
            temperature: 0.3,
            max_tokens: 500,
        });

        const response = completion.choices[0]?.message?.content || '{}';

        // Log AI decision
        aiLogger.log({
            system: 'semantic-search',
            prompt,
            response,
            context: { query },
            model: AI_MODEL,
        });

        const intent = JSON.parse(response);

        // Convert date strings to Date objects
        if (intent.dateRange) {
            intent.dateRange.start = new Date(intent.dateRange.start);
            intent.dateRange.end = new Date(intent.dateRange.end);
        }

        return intent;
    } catch (error) {
        console.error('Error parsing query:', error);
        aiLogger.log({
            system: 'semantic-search',
            prompt,
            response: `ERROR: ${error}`,
            context: { error: String(error) },
            model: AI_MODEL,
        });

        // Return default intent
        return {
            keywords: query.split(' '),
            confidence: 0.1,
        };
    }
}

/**
 * Match events based on extracted search intent
 */
export async function matchEvents(intent: SearchIntent) {
    const whereConditions: any = {
        status: 'PUBLISHED',
        startDate: {
            gte: new Date(),
        },
        availableSeats: {
            gt: 0,
        },
    };

    // Apply category filter
    if (intent.category) {
        whereConditions.category = {
            contains: intent.category,
            mode: 'insensitive',
        };
    }

    // Apply city filter
    if (intent.city) {
        whereConditions.city = {
            contains: intent.city,
            mode: 'insensitive',
        };
    }

    // Apply date range filter
    if (intent.dateRange) {
        whereConditions.startDate = {
            gte: intent.dateRange.start,
            lte: intent.dateRange.end,
        };
    }

    // Fetch matching events
    let events = await prisma.event.findMany({
        where: whereConditions,
        include: {
            organizer: {
                select: {
                    name: true,
                    email: true,
                },
            },
        },
        orderBy: {
            startDate: 'asc',
        },
        take: 20,
    });

    // Apply keyword filtering if keywords exist
    if (intent.keywords && intent.keywords.length > 0) {
        events = events.filter(event => {
            const searchText = `${event.title} ${event.description} ${event.category}`.toLowerCase();
            return intent.keywords.some(keyword =>
                searchText.includes(keyword.toLowerCase())
            );
        });
    }

    return events;
}

/**
 * Perform semantic search on events
 */
export async function semanticSearch(query: string) {
    const intent = await parseQuery(query);
    const events = await matchEvents(intent);

    return {
        intent,
        events,
        totalResults: events.length,
    };
}

import { groq, AI_MODEL } from './groq-client';
import { aiLogger } from './logger';
import { RecommendationResult } from './types';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface UserProfile {
    id: string;
    interests: string[];
    city: string | null;
    pastBookings: Array<{
        eventId: string;
        eventCategory: string;
        eventCity: string;
    }>;
    feedbackSentiment: {
        positive: number;
        neutral: number;
        negative: number;
    };
}

interface EventData {
    id: string;
    title: string;
    description: string;
    category: string;
    city: string;
    startDate: Date;
    basePrice: number;
    availableSeats: number;
}

/**
 * Analyze user profile to extract preferences
 */
export async function analyzeUserProfile(userId: string): Promise<UserProfile> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            bookings: {
                include: {
                    event: true,
                },
            },
            feedbacks: true,
        },
    });

    if (!user) {
        throw new Error('User not found');
    }

    // Calculate sentiment distribution
    const sentimentCounts = { positive: 0, neutral: 0, negative: 0 };
    user.feedbacks.forEach(feedback => {
        if (feedback.sentiment === 'positive') sentimentCounts.positive++;
        else if (feedback.sentiment === 'negative') sentimentCounts.negative++;
        else sentimentCounts.neutral++;
    });

    return {
        id: user.id,
        interests: user.interests,
        city: user.city,
        pastBookings: user.bookings.map(booking => ({
            eventId: booking.event.id,
            eventCategory: booking.event.category,
            eventCity: booking.event.city,
        })),
        feedbackSentiment: sentimentCounts,
    };
}

/**
 * Get active events for recommendation
 */
export async function getActiveEvents(): Promise<EventData[]> {
    const events = await prisma.event.findMany({
        where: {
            status: 'PUBLISHED',
            startDate: {
                gte: new Date(),
            },
            availableSeats: {
                gt: 0,
            },
        },
        orderBy: {
            startDate: 'asc',
        },
    });

    return events.map(event => ({
        id: event.id,
        title: event.title,
        description: event.description,
        category: event.category,
        city: event.city,
        startDate: event.startDate,
        basePrice: event.basePrice,
        availableSeats: event.availableSeats,
    }));
}

/**
 * Use Groq AI to rank events based on user profile
 */
export async function rankEvents(
    userProfile: UserProfile,
    events: EventData[]
): Promise<RecommendationResult[]> {
    const prompt = `You are an intelligent event recommendation AI.

USER PROFILE:
- Interests: ${userProfile.interests.join(', ') || 'None specified'}
- City: ${userProfile.city || 'Not specified'}
- Past Bookings: ${userProfile.pastBookings.length} events (categories: ${[...new Set(userProfile.pastBookings.map(b => b.eventCategory))].join(', ')})
- Feedback Sentiment: ${userProfile.feedbackSentiment.positive} positive, ${userProfile.feedbackSentiment.neutral} neutral, ${userProfile.feedbackSentiment.negative} negative

AVAILABLE EVENTS:
${events.map((e, i) => `${i + 1}. "${e.title}" - ${e.category} in ${e.city} on ${e.startDate.toLocaleDateString()} ($${e.basePrice})`).join('\n')}

TASK:
Analyze the user profile and rank the top 5 most relevant events for this user.
For each recommendation, provide:
1. Event number (from the list above)
2. Relevance score (0-100)
3. Brief explanation (one sentence)

Return ONLY valid JSON in this exact format:
[
  {
    "eventNumber": 1,
    "score": 95,
    "explanation": "Matches your interest in technology and is in your city"
  }
]`;

    try {
        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: 'system',
                    content: 'You are an event recommendation engine. Always return valid JSON arrays only, no additional text.',
                },
                {
                    role: 'user',
                    content: prompt,
                },
            ],
            model: AI_MODEL,
            temperature: 0.7,
            max_tokens: 1000,
        });

        const response = completion.choices[0]?.message?.content || '[]';

        // Log AI decision
        aiLogger.log({
            system: 'recommendation-engine',
            prompt,
            response,
            context: {
                userId: userProfile.id,
                eventCount: events.length,
                userInterests: userProfile.interests,
            },
            model: AI_MODEL,
        });

        // Parse response
        const recommendations = JSON.parse(response);

        // Map event numbers to actual event IDs
        return recommendations
            .slice(0, 5)
            .map((rec: any) => ({
                eventId: events[rec.eventNumber - 1]?.id || '',
                score: rec.score,
                explanation: rec.explanation,
            }))
            .filter((rec: RecommendationResult) => rec.eventId);
    } catch (error) {
        console.error('Error in rankEvents:', error);
        aiLogger.log({
            system: 'recommendation-engine',
            prompt,
            response: `ERROR: ${error}`,
            context: { error: String(error) },
            model: AI_MODEL,
        });
        return [];
    }
}

/**
 * Generate personalized event recommendations
 */
export async function generateRecommendations(
    userId: string
): Promise<RecommendationResult[]> {
    const userProfile = await analyzeUserProfile(userId);
    const events = await getActiveEvents();

    if (events.length === 0) {
        return [];
    }

    return await rankEvents(userProfile, events);
}

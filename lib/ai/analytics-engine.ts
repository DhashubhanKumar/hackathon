import { groq, AI_MODEL } from './groq-client';
import { aiLogger } from './logger';
import { OrganizerInsights } from './types';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Analyze event performance and generate insights
 */
export async function analyzeEventPerformance(
    eventId: string
): Promise<OrganizerInsights> {
    const event = await prisma.event.findUnique({
        where: { id: eventId },
        include: {
            bookings: {
                include: {
                    user: true,
                },
            },
            pricingLogs: {
                orderBy: {
                    createdAt: 'desc',
                },
            },
            feedbacks: {
                include: {
                    user: true,
                },
            },
        },
    });

    if (!event) {
        throw new Error('Event not found');
    }

    // Calculate metrics
    const confirmedBookings = event.bookings.filter(b => b.status === 'CONFIRMED');
    const cancelledBookings = event.bookings.filter(b => b.status === 'CANCELLED');
    const totalRevenue = confirmedBookings.reduce((sum, b) => sum + b.pricePaid, 0);
    const averagePrice =
        confirmedBookings.length > 0
            ? totalRevenue / confirmedBookings.length
            : event.basePrice;
    const occupancyRate =
        ((event.totalSeats - event.availableSeats) / event.totalSeats) * 100;
    const cancellationRate =
        event.bookings.length > 0
            ? (cancelledBookings.length / event.bookings.length) * 100
            : 0;

    // Analyze demographics
    const cities: Record<string, number> = {};
    const interests: Record<string, number> = {};

    confirmedBookings.forEach(booking => {
        if (booking.user.city) {
            cities[booking.user.city] = (cities[booking.user.city] || 0) + 1;
        }
        booking.user.interests.forEach(interest => {
            interests[interest] = (interests[interest] || 0) + 1;
        });
    });

    // Analyze sentiment
    const sentimentCounts = { positive: 0, neutral: 0, negative: 0 };
    let totalRating = 0;

    event.feedbacks.forEach(feedback => {
        totalRating += feedback.rating;
        if (feedback.sentiment === 'positive') sentimentCounts.positive++;
        else if (feedback.sentiment === 'negative') sentimentCounts.negative++;
        else sentimentCounts.neutral++;
    });

    const averageRating =
        event.feedbacks.length > 0 ? totalRating / event.feedbacks.length : 0;

    // Prepare data for AI analysis
    const analyticsData = {
        metrics: {
            totalBookings: confirmedBookings.length,
            revenue: totalRevenue,
            averagePrice,
            occupancyRate,
            cancellationRate,
        },
        demographics: {
            cities,
            interests,
        },
        pricingHistory: event.pricingLogs.map(log => ({
            date: log.createdAt,
            price: log.newPrice,
            reason: log.reason,
        })),
        sentimentSummary: {
            positive: sentimentCounts.positive,
            neutral: sentimentCounts.neutral,
            negative: sentimentCounts.negative,
            averageRating,
        },
        eventDetails: {
            category: event.category,
            city: event.city,
            basePrice: event.basePrice,
            totalSeats: event.totalSeats,
            daysUntilEvent: Math.ceil(
                (event.startDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
            ),
        },
    };

    // Generate AI recommendations
    const recommendations = await generateRecommendations(analyticsData);

    return {
        eventId,
        metrics: analyticsData.metrics,
        demographics: analyticsData.demographics,
        recommendations,
        pricingHistory: analyticsData.pricingHistory,
        sentimentSummary: analyticsData.sentimentSummary,
    };
}

/**
 * Generate strategic recommendations using Groq AI
 */
async function generateRecommendations(analyticsData: any): Promise<string[]> {
    const prompt = `You are an event analytics AI providing strategic insights to event organizers.

EVENT PERFORMANCE DATA:
- Total Bookings: ${analyticsData.metrics.totalBookings}
- Revenue: $${analyticsData.metrics.revenue.toFixed(2)}
- Average Price: $${analyticsData.metrics.averagePrice.toFixed(2)}
- Occupancy Rate: ${analyticsData.metrics.occupancyRate.toFixed(1)}%
- Cancellation Rate: ${analyticsData.metrics.cancellationRate.toFixed(1)}%

DEMOGRAPHICS:
- Top Cities: ${Object.entries(analyticsData.demographics.cities)
            .sort(([, a]: any, [, b]: any) => b - a)
            .slice(0, 3)
            .map(([city, count]) => `${city} (${count})`)
            .join(', ') || 'No data'}
- Top Interests: ${Object.entries(analyticsData.demographics.interests)
            .sort(([, a]: any, [, b]: any) => b - a)
            .slice(0, 5)
            .map(([interest, count]) => `${interest} (${count})`)
            .join(', ') || 'No data'}

FEEDBACK:
- Average Rating: ${analyticsData.sentimentSummary.averageRating.toFixed(1)}/5
- Sentiment: ${analyticsData.sentimentSummary.positive} positive, ${analyticsData.sentimentSummary.neutral} neutral, ${analyticsData.sentimentSummary.negative} negative

EVENT DETAILS:
- Category: ${analyticsData.eventDetails.category}
- City: ${analyticsData.eventDetails.city}
- Days Until Event: ${analyticsData.eventDetails.daysUntilEvent}

PRICING HISTORY:
${analyticsData.pricingHistory.length > 0
            ? analyticsData.pricingHistory
                .slice(0, 3)
                .map((p: any) => `- $${p.price}: ${p.reason}`)
                .join('\n')
            : '- No price changes yet'}

TASK:
Analyze this event performance and provide 3-5 actionable strategic recommendations.
Focus on:
1. Marketing and audience targeting
2. Pricing optimization
3. Attendee engagement
4. Future event planning

Return ONLY valid JSON array of recommendation strings:
["Recommendation 1", "Recommendation 2", "Recommendation 3"]`;

    try {
        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: 'system',
                    content: 'You are an event analytics AI. Always return valid JSON arrays only, no additional text.',
                },
                {
                    role: 'user',
                    content: prompt,
                },
            ],
            model: AI_MODEL,
            temperature: 0.7,
            max_tokens: 800,
        });

        const response = completion.choices[0]?.message?.content || '[]';

        // Log AI decision
        aiLogger.log({
            system: 'analytics-engine',
            prompt,
            response,
            context: {
                eventId: analyticsData.eventDetails.category,
                occupancyRate: analyticsData.metrics.occupancyRate,
            },
            model: AI_MODEL,
        });

        return JSON.parse(response);
    } catch (error) {
        console.error('Error generating recommendations:', error);
        aiLogger.log({
            system: 'analytics-engine',
            prompt,
            response: `ERROR: ${error}`,
            context: { error: String(error) },
            model: AI_MODEL,
        });

        return [
            'Unable to generate AI recommendations at this time',
            'Please review your event metrics manually',
        ];
    }
}

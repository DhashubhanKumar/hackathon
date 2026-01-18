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
/**
 * Analyze overall organizer performance across all events
 */
export async function analyzeOrganizerPerformance(
    userId: string
): Promise<OrganizerInsights> {
    const events = await prisma.event.findMany({
        where: { organizerId: userId },
        include: {
            bookings: {
                include: {
                    user: true,
                },
            },
            feedbacks: {
                include: {
                    user: true,
                },
            },
        },
    });

    if (events.length === 0) {
        return {
            metrics: {
                totalBookings: 0,
                revenue: 0,
                averagePrice: 0,
                occupancyRate: 0,
                cancellationRate: 0,
            },
            demographics: {
                cities: {},
                interests: {},
            },
            recommendations: ["Create your first event to start seeing AI insights!"],
            pricingHistory: [],
            sentimentSummary: {
                positive: 0,
                neutral: 0,
                negative: 0,
                averageRating: 0,
            },
        };
    }

    // Aggregate metrics across all events
    let totalConfirmedBookings = 0;
    let totalRevenue = 0;
    let totalSeats = 0;
    let totalAvailableSeats = 0;
    let totalAllBookings = 0;
    let totalCancelledBookings = 0;

    const cities: Record<string, number> = {};
    const interests: Record<string, number> = {};
    const sentimentCounts = { positive: 0, neutral: 0, negative: 0 };
    let totalRating = 0;
    let totalFeedbackCount = 0;

    events.forEach(event => {
        const confirmed = event.bookings.filter(b => b.status === 'CONFIRMED');
        const cancelled = event.bookings.filter(b => b.status === 'CANCELLED');

        totalConfirmedBookings += confirmed.length;
        totalCancelledBookings += cancelled.length;
        totalAllBookings += event.bookings.length;
        totalRevenue += confirmed.reduce((sum, b) => sum + b.pricePaid, 0);
        totalSeats += event.totalSeats;
        totalAvailableSeats += event.availableSeats;

        confirmed.forEach(booking => {
            if (booking.user.city) {
                cities[booking.user.city] = (cities[booking.user.city] || 0) + 1;
            }
            booking.user.interests.forEach(interest => {
                interests[interest] = (interests[interest] || 0) + 1;
            });
        });

        event.feedbacks.forEach(feedback => {
            totalRating += feedback.rating;
            totalFeedbackCount++;
            if (feedback.sentiment === 'positive') sentimentCounts.positive++;
            else if (feedback.sentiment === 'negative') sentimentCounts.negative++;
            else sentimentCounts.neutral++;
        });
    });

    const averagePrice = totalConfirmedBookings > 0 ? totalRevenue / totalConfirmedBookings : 0;
    const occupancyRate = totalSeats > 0 ? ((totalSeats - totalAvailableSeats) / totalSeats) * 100 : 0;
    const cancellationRate = totalAllBookings > 0 ? (totalCancelledBookings / totalAllBookings) * 100 : 0;
    const averageRating = totalFeedbackCount > 0 ? totalRating / totalFeedbackCount : 0;

    const aggregateData = {
        metrics: {
            totalBookings: totalConfirmedBookings,
            revenue: totalRevenue,
            averagePrice,
            occupancyRate,
            cancellationRate,
        },
        demographics: { cities, interests },
        sentimentSummary: {
            positive: sentimentCounts.positive,
            neutral: sentimentCounts.neutral,
            negative: sentimentCounts.negative,
            averageRating,
        },
        isOverall: true
    };

    // Generate recommendations using aggregate data
    const prompt = `You are an event analytics AI providing strategic insights to an event organizer based on their OVERALL portfolio of events.

ORGANIZER PORTFOLIO PERFORMANCE:
- Total Events: ${events.length}
- Total Confirmed Bookings: ${aggregateData.metrics.totalBookings}
- Total Portfolio Revenue: $${aggregateData.metrics.revenue.toFixed(2)}
- Portfolio Occupancy Rate: ${aggregateData.metrics.occupancyRate.toFixed(1)}%
- Portfolio Cancellation Rate: ${aggregateData.metrics.cancellationRate.toFixed(1)}%

DEMOGRAPHICS:
- Top Cities: ${Object.entries(cities).sort(([, a], [, b]) => b - a).slice(0, 3).map(([c, count]) => `${c} (${count})`).join(', ') || 'No data'}
- Top Interests: ${Object.entries(interests).sort(([, a], [, b]) => b - a).slice(0, 5).map(([i, count]) => `${i} (${count})`).join(', ') || 'No data'}

FEEDBACK:
- Portfolio Average Rating: ${averageRating.toFixed(1)}/5
- Sentiment Breakdown: ${sentimentCounts.positive} positive, ${sentimentCounts.neutral} neutral, ${sentimentCounts.negative} negative

TASK:
Analyze the overall performance of this organizer's portfolio and provide 3-5 strategic recommendations to grow their business.
Focus on:
1. Identifying high-growth categories or cities
2. Overall pricing strategy
3. Portfolio-wide engagement improvements
4. Brand development

Return ONLY valid JSON array of recommendation strings:
["Recommendation 1", "Recommendation 2", "Recommendation 3"]`;

    let recommendations: string[] = [];
    try {
        const completion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: 'You are an event analytics AI. Return ONLY JSON arrays.' },
                { role: 'user', content: prompt },
            ],
            model: AI_MODEL,
        });
        recommendations = JSON.parse(completion.choices[0]?.message?.content || '[]');
    } catch (error) {
        console.error('Error generating aggregate recommendations:', error);
        recommendations = ['Focus on expanding your event portfolio in high-demand cities.', 'Review pricing across events for better consistency.'];
    }

    return {
        metrics: aggregateData.metrics,
        demographics: aggregateData.demographics,
        recommendations,
        pricingHistory: [],
        sentimentSummary: aggregateData.sentimentSummary,
    };
}

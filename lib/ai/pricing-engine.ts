import { groq, AI_MODEL } from './groq-client';
import { aiLogger } from './logger';
import { PricingSuggestion } from './types';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Analyze demand signals for an event
 */
export async function analyzeDemand(eventId: string) {
    const event = await prisma.event.findUnique({
        where: { id: eventId },
        include: {
            bookings: {
                where: {
                    status: 'CONFIRMED',
                },
                orderBy: {
                    createdAt: 'desc',
                },
            },
            pricingLogs: {
                orderBy: {
                    createdAt: 'desc',
                },
                take: 5,
            },
        },
    });

    if (!event) {
        throw new Error('Event not found');
    }

    const now = new Date();
    const timeRemaining = event.startDate.getTime() - now.getTime();
    const daysRemaining = timeRemaining / (1000 * 60 * 60 * 24);

    // Calculate booking velocity (bookings in last 24 hours)
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const recentBookings = event.bookings.filter(
        booking => booking.createdAt >= oneDayAgo
    ).length;

    // Calculate booking velocity (bookings per day)
    const eventAge = now.getTime() - event.createdAt.getTime();
    const eventAgeDays = eventAge / (1000 * 60 * 60 * 24);
    const bookingVelocity = event.bookings.length / Math.max(eventAgeDays, 1);

    return {
        currentPrice: event.basePrice,
        totalSeats: event.totalSeats,
        availableSeats: event.availableSeats,
        bookedSeats: event.totalSeats - event.availableSeats,
        occupancyRate: ((event.totalSeats - event.availableSeats) / event.totalSeats) * 100,
        bookingVelocity,
        recentBookings,
        daysRemaining,
        timeRemaining,
        pricingHistory: event.pricingLogs,
    };
}

/**
 * Use Groq AI to suggest optimal pricing
 */
export async function suggestPrice(eventId: string): Promise<PricingSuggestion> {
    const demandData = await analyzeDemand(eventId);

    const prompt = `You are a dynamic pricing optimization AI for event tickets.

CURRENT SITUATION:
- Current Price: $${demandData.currentPrice}
- Total Seats: ${demandData.totalSeats}
- Available Seats: ${demandData.availableSeats}
- Occupancy Rate: ${demandData.occupancyRate.toFixed(1)}%
- Booking Velocity: ${demandData.bookingVelocity.toFixed(2)} bookings/day
- Recent Bookings (24h): ${demandData.recentBookings}
- Days Until Event: ${demandData.daysRemaining.toFixed(1)}

PRICING HISTORY:
${demandData.pricingHistory.length > 0
            ? demandData.pricingHistory.map(log => `- $${log.oldPrice} → $${log.newPrice}: ${log.reason}`).join('\n')
            : '- No previous price changes'}

TASK:
Analyze the demand signals and suggest an optimal ticket price.
Consider:
1. High occupancy + high velocity = increase price
2. Low occupancy + event approaching = decrease price
3. Steady demand = maintain price
4. Last-minute surge = increase price

Return ONLY valid JSON in this exact format:
{
  "suggestedPrice": 150.00,
  "confidence": 0.85,
  "reasoning": "High booking velocity and 75% occupancy suggest strong demand. Recommend 15% price increase to maximize revenue."
}`;

    try {
        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: 'system',
                    content: 'You are a pricing optimization AI. Always return valid JSON only, no additional text.',
                },
                {
                    role: 'user',
                    content: prompt,
                },
            ],
            model: AI_MODEL,
            temperature: 0.5,
            max_tokens: 500,
        });

        const response = completion.choices[0]?.message?.content || '{}';

        // Log AI decision
        aiLogger.log({
            system: 'pricing-engine',
            prompt,
            response,
            context: {
                eventId,
                currentPrice: demandData.currentPrice,
                occupancyRate: demandData.occupancyRate,
            },
            model: AI_MODEL,
        });

        const suggestion = JSON.parse(response);

        return {
            currentPrice: demandData.currentPrice,
            suggestedPrice: suggestion.suggestedPrice,
            confidence: suggestion.confidence,
            reasoning: suggestion.reasoning,
            demandSignals: {
                bookingVelocity: demandData.bookingVelocity,
                availableSeats: demandData.availableSeats,
                totalSeats: demandData.totalSeats,
                timeRemaining: demandData.timeRemaining,
                recentBookings: demandData.recentBookings,
            },
        };
    } catch (error) {
        console.error('Error in suggestPrice:', error);
        aiLogger.log({
            system: 'pricing-engine',
            prompt,
            response: `ERROR: ${error}`,
            context: { error: String(error) },
            model: AI_MODEL,
        });

        // Return conservative suggestion
        return {
            currentPrice: demandData.currentPrice,
            suggestedPrice: demandData.currentPrice,
            confidence: 0.1,
            reasoning: 'Error in AI analysis, maintaining current price',
            demandSignals: {
                bookingVelocity: demandData.bookingVelocity,
                availableSeats: demandData.availableSeats,
                totalSeats: demandData.totalSeats,
                timeRemaining: demandData.timeRemaining,
                recentBookings: demandData.recentBookings,
            },
        };
    }
}

/**
 * Apply pricing suggestion and log the change
 */
export async function applyPricingSuggestion(
    eventId: string,
    suggestion: PricingSuggestion,
    autoApply: boolean = false
) {
    if (!autoApply) {
        // Just return the suggestion without applying
        return {
            applied: false,
            suggestion,
        };
    }

    // Apply the price change
    const event = await prisma.event.findUnique({
        where: { id: eventId },
    });

    if (!event) {
        throw new Error('Event not found');
    }

    // Create pricing log
    await prisma.pricingLog.create({
        data: {
            eventId,
            oldPrice: event.basePrice,
            newPrice: suggestion.suggestedPrice,
            reason: suggestion.reasoning,
        },
    });

    // Update event price
    await prisma.event.update({
        where: { id: eventId },
        data: {
            basePrice: suggestion.suggestedPrice,
        },
    });

    return {
        applied: true,
        suggestion,
        oldPrice: event.basePrice,
        newPrice: suggestion.suggestedPrice,
    };
}

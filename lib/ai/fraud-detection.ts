import { groq, AI_MODEL } from './groq-client';
import { aiLogger } from './logger';
import { RiskAssessment } from './types';
import { prisma } from '@/lib/db';
import { getOrganizerTrustScore } from './trust-score';

/**
 * Analyze booking patterns for fraud detection
 */
export async function analyzeBookingPattern(
    userId: string,
    eventId: string,
    ipAddress: string | null,
    userAgent: string | null,
    pricePaid: number
) {
    // Get user's booking history
    const userBookings = await prisma.booking.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 10,
    });

    // Check for IP address repetition
    const ipBookings = ipAddress
        ? await prisma.booking.findMany({
            where: {
                ipAddress,
                createdAt: {
                    gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
                },
            },
        })
        : [];

    // Get event details
    const event = await prisma.event.findUnique({
        where: { id: eventId },
    });

    if (!event) {
        throw new Error('Event not found');
    }

    // Check for rapid booking (multiple bookings in short time - stricter)
    const recentUserBookings = userBookings.filter(
        booking =>
            booking.createdAt >= new Date(Date.now() - 5 * 60 * 1000) // Last 5 minutes
    );

    // Check for price anomaly
    const priceAnomaly = Math.abs(pricePaid - event.basePrice) / event.basePrice > 0.5;

    // Check if user is new
    const user = await prisma.user.findUnique({
        where: { id: userId },
    });

    const isNewUser = user
        ? new Date().getTime() - user.createdAt.getTime() < 24 * 60 * 60 * 1000
        : true;

    return {
        ipRepeat: ipBookings.length > 2, // More than 2 per IP is suspicious
        rapidBooking: recentUserBookings.length > 0, // Even 1 previous booking in last 5 mins is noteworthy
        priceAnomaly,
        newUser: isNewUser,
        totalUserBookings: userBookings.length,
        ipBookingsCount: ipBookings.length,
        recentBookingsCount: recentUserBookings.length,
        priceDifference: pricePaid - event.basePrice,
        organizerId: event.organizerId,
    };
}

/**
 * Calculate risk score using Groq AI
 */
export async function calculateRiskScore(
    userId: string,
    eventId: string,
    ipAddress: string | null,
    userAgent: string | null,
    pricePaid: number
): Promise<RiskAssessment> {
    const pattern = await analyzeBookingPattern(
        userId,
        eventId,
        ipAddress,
        userAgent,
        pricePaid
    );

    const organizerTrustScore = await getOrganizerTrustScore(pattern.organizerId);

    const prompt = `You are a fraud detection AI for event ticket bookings.

BOOKING ANALYSIS:
- IP Address Repeated: ${pattern.ipRepeat ? 'YES' : 'NO'} (${pattern.ipBookingsCount} bookings from this IP in 24h)
- Rapid Booking Pattern: ${pattern.rapidBooking ? 'YES' : 'NO'} (bookings last 5m: ${pattern.recentBookingsCount})
- Price Anomaly: ${pattern.priceAnomaly ? 'YES' : 'NO'} (difference: $${pattern.priceDifference})
- New User: ${pattern.newUser ? 'YES' : 'NO'}
- Total User Bookings: ${pattern.totalUserBookings}
- Organizer Trust Score: ${organizerTrustScore}/100 (Lower is worse)
- IP Address: ${ipAddress || 'Not provided'}

RISK INDICATORS:
- LOW ORGANIZER TRUST (< 40): Consider this a risky transaction or potential scam event.
- Multiple bookings from same IP in short time = High Risk
- Rapid successive bookings = High Risk
- Significant price difference = Medium Risk
- New user with multiple bookings = Medium Risk
- Combination of factors = Very High Risk

TASK:
Analyze this booking and assign a risk score between 0 and 1 (0 = no risk, 1 = definite fraud).
Provide clear reasoning for your assessment.

Return ONLY valid JSON in this exact format:
{
  "riskScore": 0.75,
  "reasoning": "Multiple red flags: same IP used 5 times in 24h, rapid booking pattern, and new user account. High probability of automated bot or scalper.",
  "shouldFlag": true
}`;

    try {
        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: 'system',
                    content: 'You are a fraud detection AI. Always return valid JSON only, no additional text.',
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
            system: 'fraud-detection',
            prompt,
            response,
            context: {
                userId,
                eventId,
                ipAddress,
                pattern,
            },
            model: AI_MODEL,
        });

        const assessment = JSON.parse(response);

        return {
            riskScore: assessment.riskScore,
            reasoning: assessment.reasoning,
            shouldFlag: assessment.shouldFlag || assessment.riskScore > 0.7,
            factors: {
                ipRepeat: pattern.ipRepeat,
                rapidBooking: pattern.rapidBooking,
                priceAnomaly: pattern.priceAnomaly,
                newUser: pattern.newUser,
            },
        };
    } catch (error) {
        console.error('Error in calculateRiskScore:', error);
        aiLogger.log({
            system: 'fraud-detection',
            prompt,
            response: `ERROR: ${error}`,
            context: { error: String(error) },
            model: AI_MODEL,
        });

        // Return conservative assessment
        return {
            riskScore: 0.5,
            reasoning: 'Error in AI analysis, flagging for manual review',
            shouldFlag: true,
            factors: {
                ipRepeat: pattern.ipRepeat,
                rapidBooking: pattern.rapidBooking,
                priceAnomaly: pattern.priceAnomaly,
                newUser: pattern.newUser,
            },
        };
    }
}

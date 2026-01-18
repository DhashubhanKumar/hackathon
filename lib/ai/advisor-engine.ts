import { groq, AI_MODEL } from './groq-client';
import { prisma } from '@/lib/db';

interface EventContext {
    title: string;
    description: string;
    city: string;
    category: string;
    date: string;
    price: number;
}

export async function getEventAdvice(context: EventContext) {
    // 1. Fetch Historical Data
    // Find similar events in the same city/category
    const similarEvents = await prisma.event.findMany({
        where: {
            city: context.city,
            category: context.category,
            startDate: { lt: new Date() } // Past events
        },
        include: {
            bookings: true,
        },
        take: 10,
        orderBy: { startDate: 'desc' }
    });

    // Calculate aggregated stats
    let totalRevenue = 0;
    let totalBookings = 0;
    let totalSeats = 0;

    similarEvents.forEach(e => {
        const eventRevenue = e.bookings.reduce((sum, b) => sum + b.pricePaid, 0);
        totalRevenue += eventRevenue;
        totalBookings += e.bookings.length;
        totalSeats += e.totalSeats;
    });

    const avgOccupancy = totalSeats > 0 ? (totalBookings / totalSeats) * 100 : 0;
    const avgPrice = similarEvents.length > 0 ? totalRevenue / totalBookings : 0;

    const historicalSummary = similarEvents.length > 0
        ? `Found ${similarEvents.length} past events in ${context.city} (${context.category}). Avg Occupancy: ${avgOccupancy.toFixed(1)}%. Avg Ticket Price: $${avgPrice.toFixed(2)}.`
        : `No direct past data found for ${context.category} in ${context.city}.`;

    // 2. Generate Prompt
    const prompt = `
    You are an expert Event Strategy Advisor. Analyze this proposed event and provide strategic advice.
    
    PROPOSED EVENT:
    - Title: "${context.title}"
    - Description: "${context.description}"
    - City: ${context.city}
    - Category: ${context.category}
    - Proposed Date: ${context.date}
    - Proposed Price: $${context.price}

    MARKET CONTEXT:
    ${historicalSummary}

    TASK:
    Provide a concise assessment (max 3 sentences per point) covering:
    1. **Viability Score** (0-100) based on market fit.
    2. **Pricing Advice**: Is the price too high/low compared to history?
    3. **Timing**: Is the date/time optimal?
    4. **Recommendation**: "Go for it", "Adjust Strategy", or "High Risk".

    RETURN JSON ONLY:
    {
        "viabilityScore": 85,
        "pricingAdvice": "Your price is slightly above average ($50 vs $45). Consider lowering early bird tickets.",
        "timingAdvice": "Weekend timing is perfect for this category.",
        "overallRecommendation": "Go for it! Strong demand expected."
    }
    `;

    // 3. Call AI
    try {
        const completion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: 'You are an Event Strategy Advisor. Return JSON only.' },
                { role: 'user', content: prompt }
            ],
            model: AI_MODEL,
        });

        const response = completion.choices[0]?.message?.content || '{}';
        return JSON.parse(response);

    } catch (error) {
        console.error("AI Advisor Error:", error);
        return {
            viabilityScore: 0,
            pricingAdvice: "Could not analyze at this time.",
            timingAdvice: "Check local holidays.",
            overallRecommendation: "Proceed with caution."
        };
    }
}

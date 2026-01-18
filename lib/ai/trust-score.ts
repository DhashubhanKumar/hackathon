import { prisma } from '@/lib/db';

export async function getOrganizerTrustScore(organizerId: string) {
    // 1. Get all events by this organizer
    const events = await prisma.event.findMany({
        where: { organizerId },
        include: { feedbacks: true } // Assuming feedback is linked to event
    });

    if (events.length === 0) return 50; // Neutral start

    // 2. Aggregate all feedback
    let totalRating = 0;
    let feedbackCount = 0;

    for (const event of events) {
        for (const fb of event.feedbacks) {
            totalRating += fb.rating;
            feedbackCount++;
        }
    }

    if (feedbackCount === 0) return 50; // Neutral if no feedback

    // 3. Calculate Score (0-100) based on 5-star system
    // Average Rating (1-5) maps to 20-100
    const averageRating = totalRating / feedbackCount;
    const trustScore = (averageRating / 5) * 100;

    return Math.round(trustScore);
}

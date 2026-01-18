import { groq, AI_MODEL } from './groq-client';
import { aiLogger } from './logger';
import { SentimentAnalysis, FeedbackAnalysisResult } from './types';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Analyze sentiment of a single feedback
 */
export async function analyzeSentiment(
    feedbackId: string,
    rating: number,
    comment: string
): Promise<SentimentAnalysis> {
    const prompt = `You are a sentiment analysis AI for event feedback.

FEEDBACK:
- Rating: ${rating}/5
- Comment: "${comment}"

TASK:
Analyze this feedback and:
1. Classify sentiment (positive/neutral/negative)
2. Assign confidence score (0-1)
3. Extract key themes (2-4 topics mentioned)
4. Suggest specific improvements based on feedback

Return ONLY valid JSON in this exact format:
{
  "sentiment": "positive",
  "confidence": 0.9,
  "themes": ["venue quality", "organization"],
  "improvements": ["Consider adding more seating", "Improve check-in process"]
}`;

    try {
        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: 'system',
                    content: 'You are a sentiment analysis AI. Always return valid JSON only, no additional text.',
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
            system: 'sentiment-analysis',
            prompt,
            response,
            context: {
                feedbackId,
                rating,
            },
            model: AI_MODEL,
        });

        const analysis = JSON.parse(response);

        return {
            feedbackId,
            sentiment: analysis.sentiment,
            confidence: analysis.confidence,
            themes: analysis.themes,
            improvements: analysis.improvements,
        };
    } catch (error) {
        console.error('Error in analyzeSentiment:', error);
        aiLogger.log({
            system: 'sentiment-analysis',
            prompt,
            response: `ERROR: ${error}`,
            context: { error: String(error) },
            model: AI_MODEL,
        });

        // Fallback to rating-based sentiment
        let sentiment: 'positive' | 'neutral' | 'negative' = 'neutral';
        if (rating >= 4) sentiment = 'positive';
        else if (rating <= 2) sentiment = 'negative';

        return {
            feedbackId,
            sentiment,
            confidence: 0.5,
            themes: ['general feedback'],
            improvements: ['Unable to extract specific improvements'],
        };
    }
}

/**
 * Analyze all feedback for an event
 */
export async function analyzeFeedbackForEvent(
    eventId: string
): Promise<FeedbackAnalysisResult> {
    const feedbacks = await prisma.feedback.findMany({
        where: { eventId },
        include: {
            user: true,
        },
    });

    if (feedbacks.length === 0) {
        return {
            eventId,
            totalFeedback: 0,
            sentimentBreakdown: {
                positive: 0,
                neutral: 0,
                negative: 0,
            },
            averageRating: 0,
            keyThemes: [],
            topImprovements: [],
            individualAnalyses: [],
        };
    }

    // Analyze each feedback
    const analyses: SentimentAnalysis[] = [];
    const sentimentCounts = { positive: 0, neutral: 0, negative: 0 };
    const allThemes: string[] = [];
    const allImprovements: string[] = [];
    let totalRating = 0;

    for (const feedback of feedbacks) {
        const analysis = await analyzeSentiment(
            feedback.id,
            feedback.rating,
            feedback.comment
        );

        analyses.push(analysis);
        sentimentCounts[analysis.sentiment]++;
        allThemes.push(...analysis.themes);
        allImprovements.push(...analysis.improvements);
        totalRating += feedback.rating;

        // Update feedback record with sentiment
        await prisma.feedback.update({
            where: { id: feedback.id },
            data: { sentiment: analysis.sentiment },
        });
    }

    // Count theme frequencies
    const themeCounts: Record<string, number> = {};
    allThemes.forEach(theme => {
        themeCounts[theme] = (themeCounts[theme] || 0) + 1;
    });

    // Get top themes
    const keyThemes = Object.entries(themeCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([theme]) => theme);

    // Count improvement frequencies
    const improvementCounts: Record<string, number> = {};
    allImprovements.forEach(improvement => {
        improvementCounts[improvement] = (improvementCounts[improvement] || 0) + 1;
    });

    // Get top improvements
    const topImprovements = Object.entries(improvementCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([improvement]) => improvement);

    return {
        eventId,
        totalFeedback: feedbacks.length,
        sentimentBreakdown: sentimentCounts,
        averageRating: totalRating / feedbacks.length,
        keyThemes,
        topImprovements,
        individualAnalyses: analyses,
    };
}

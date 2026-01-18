/**
 * TypeScript types for AI-driven systems
 */

export interface AIDecisionLog {
    timestamp: Date;
    system: string;
    prompt: string;
    response: string;
    context: Record<string, any>;
    model: string;
}

export interface RecommendationResult {
    eventId: string;
    score: number;
    explanation: string;
}

export interface SearchIntent {
    category?: string;
    dateRange?: {
        start: Date;
        end: Date;
    };
    city?: string;
    keywords: string[];
    confidence: number;
}

export interface PricingSuggestion {
    currentPrice: number;
    suggestedPrice: number;
    confidence: number;
    reasoning: string;
    demandSignals: {
        bookingVelocity: number;
        availableSeats: number;
        totalSeats: number;
        timeRemaining: number;
        recentBookings: number;
    };
}

export interface RiskAssessment {
    riskScore: number; // 0-1
    reasoning: string;
    shouldFlag: boolean;
    factors: {
        ipRepeat: boolean;
        rapidBooking: boolean;
        priceAnomaly: boolean;
        newUser: boolean;
    };
}

export interface OrganizerInsights {
    eventId?: string;
    metrics: {
        totalBookings: number;
        revenue: number;
        averagePrice: number;
        occupancyRate: number;
        cancellationRate: number;
    };
    demographics: {
        cities: Record<string, number>;
        interests: Record<string, number>;
    };
    recommendations: string[];
    pricingHistory: Array<{
        date: Date;
        price: number;
        reason: string;
    }>;
    sentimentSummary: {
        positive: number;
        neutral: number;
        negative: number;
        averageRating: number;
    };
}

export interface SentimentAnalysis {
    feedbackId: string;
    sentiment: 'positive' | 'neutral' | 'negative';
    confidence: number;
    themes: string[];
    improvements: string[];
}

export interface FeedbackAnalysisResult {
    eventId: string;
    totalFeedback: number;
    sentimentBreakdown: {
        positive: number;
        neutral: number;
        negative: number;
    };
    averageRating: number;
    keyThemes: string[];
    topImprovements: string[];
    individualAnalyses: SentimentAnalysis[];
}

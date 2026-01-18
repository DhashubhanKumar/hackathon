import Groq from 'groq-sdk';

if (!process.env.GROQ_API_KEY) {
    console.error('❌ GROQ_API_KEY is not set in environment variables');
    console.error('Please add GROQ_API_KEY to your .env file');
}

export const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY || 'mock-key',
});

export const AI_MODEL = 'llama-3.3-70b-versatile';

/**
 * Validate that Groq client is properly configured
 */
export function validateGroqConfig(): boolean {
    if (!process.env.GROQ_API_KEY) {
        throw new Error('GROQ_API_KEY is required but not set in environment variables');
    }
    return true;
}

import Groq from 'groq-sdk';

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY || 'mock-key',
    dangerouslyAllowBrowser: true, // For demo/client-side if needed, but better server-side
});

export async function getRecommendations(userInterests: string[]) {
    if (!process.env.GROQ_API_KEY) {
        console.warn('Groq API Key missing, returning mock recommendations');
        return [
            { id: '1', reason: 'Matches your love for Techno music.' },
            { id: '2', reason: 'High energy event similar to your past bookings.' }
        ];
    }

    try {
        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: 'system',
                    content: 'You are an event recommendation engine. Return JSON array of event IDs and reasons based on user interests.'
                },
                {
                    role: 'user',
                    content: `User likes: ${userInterests.join(', ')}. Recommend 2 events from the pool.`
                }
            ],
            model: 'llama-3.3-70b-versatile',
        });

        return completion.choices[0]?.message?.content;
    } catch (error) {
        console.error('AI Error:', error);
        return [];
    }
}

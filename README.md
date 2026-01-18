# AI-Driven Event Intelligence & Smart Ticketing Platform

A complete backend-only AI-powered event management system built with Next.js, Prisma, PostgreSQL, and Groq's LLaMA models.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL database (Prisma Accelerate configured)
- Groq API key

### Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Add Groq API key** to `.env`:
   ```bash
   GROQ_API_KEY=your_groq_api_key_here
   ```
   Get your key from: https://console.groq.com/keys

3. **Database is already migrated**. If you need to reset:
   ```bash
   npx prisma migrate reset
   npx tsx prisma/seed-ai.ts
   ```

4. **Start development server**:
   ```bash
   npm run dev
   ```

## 🤖 AI Systems

### 1. Intelligent Event Discovery
**Endpoint**: `POST /api/recommendations`

Analyzes user profiles and recommends events using AI reasoning.

```bash
curl -X POST http://localhost:3000/api/recommendations \
  -H "Content-Type: application/json" \
  -d '{"userId": "user-id"}'
```

### 2. Semantic Search
**Endpoint**: `POST /api/search/semantic`

Converts natural language queries into structured event searches.

```bash
curl -X POST http://localhost:3000/api/search/semantic \
  -H "Content-Type: application/json" \
  -d '{"query": "AI conference this weekend in Mumbai"}'
```

### 3. Dynamic Pricing
**Endpoint**: `POST /api/pricing/optimize`

Optimizes ticket prices based on demand signals using AI.

```bash
curl -X POST http://localhost:3000/api/pricing/optimize \
  -H "Content-Type: application/json" \
  -d '{"eventId": "event-id", "autoApply": false}'
```

### 4. Fraud Detection
**Integrated in**: `POST /api/bookings`

Automatically detects suspicious bookings and calculates risk scores.

```bash
curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -d '{"userId": "user-id", "eventId": "event-id", "pricePaid": 2500}'
```

### 5. Organizer Analytics
**Endpoint**: `POST /api/organizer/insights`

Generates strategic insights and recommendations for event organizers.

```bash
curl -X POST http://localhost:3000/api/organizer/insights \
  -H "Content-Type: application/json" \
  -d '{"eventId": "event-id"}'
```

### 6. Sentiment Analysis
**Endpoint**: `POST /api/feedback/analyze`

Analyzes feedback sentiment and extracts actionable insights.

```bash
curl -X POST http://localhost:3000/api/feedback/analyze \
  -H "Content-Type: application/json" \
  -d '{"eventId": "event-id"}'
```

## 📊 Database Schema

- **User**: Attendees and organizers with interests and preferences
- **Event**: Events with dynamic pricing and status tracking
- **Ticket**: QR-coded tickets with usage tracking
- **Booking**: Bookings with fraud detection metadata
- **PricingLog**: Historical price changes with AI reasoning
- **Feedback**: User feedback with AI-analyzed sentiment

## 🧪 Test Data

The database is pre-seeded with:
- 5 users (3 attendees, 2 organizers)
- 5 events across different categories
- 7 bookings (including suspicious patterns)
- 5 feedback entries
- 2 pricing logs

## 🏗️ Architecture

```
lib/ai/
├── groq-client.ts          # Groq SDK configuration
├── types.ts                # TypeScript interfaces
├── logger.ts               # AI decision logging
├── recommendation-engine.ts
├── semantic-search.ts
├── pricing-engine.ts
├── fraud-detection.ts
├── analytics-engine.ts
└── sentiment-analysis.ts

app/api/
├── recommendations/route.ts
├── search/semantic/route.ts
├── pricing/optimize/route.ts
├── bookings/route.ts
├── organizer/insights/route.ts
└── feedback/analyze/route.ts
```

## 🔑 Key Features

- ✅ **100% Real AI Logic** - No placeholders or mocks
- ✅ **Explainable AI** - Every decision logged with reasoning
- ✅ **Modular Design** - Independent, reusable AI modules
- ✅ **Type-Safe** - Full TypeScript coverage
- ✅ **Production-Ready** - Error handling and validation
- ✅ **Groq LLaMA** - Powered by state-of-the-art language models

## 📖 Documentation

See [walkthrough.md](file:///home/dhashu/.gemini/antigravity/brain/74a130cb-da2f-4a85-a68c-b266bebe54e4/walkthrough.md) for detailed implementation documentation and testing instructions.

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: PostgreSQL with Prisma ORM
- **AI**: Groq (LLaMA 3.3 70B)
- **Language**: TypeScript
- **Deployment**: Prisma Accelerate

## 📝 License

MIT
# hackathon

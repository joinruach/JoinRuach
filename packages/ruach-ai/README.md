# @ruach/ai

AI utilities package for Ruach Ministries monorepo. Provides reusable AI features including embeddings generation, chat prompts, and recommendation algorithms.

## Features

- **🔍 Embeddings**: Generate vector embeddings using OpenAI for semantic search
- **💬 Chat**: System prompts and context formatting for AI assistant
- **📊 Recommendations**: Content-based and collaborative filtering algorithms

## Installation

This package is part of the Ruach monorepo and used as a workspace dependency:

```json
{
  "dependencies": {
    "@ruach/ai": "workspace:*"
  }
}
```

## Usage

### Embeddings

Generate vector embeddings for content:

```typescript
import { generateEmbeddings, generateQueryEmbedding } from '@ruach/ai/embeddings';

// Generate embeddings for content items
const items = [
  { id: 1, title: 'Prayer Teaching', description: '...', transcript: '...' }
];

const results = await generateEmbeddings(items, 'media', {
  apiKey: process.env.OPENAI_API_KEY!,
  batchSize: 50,
});

// Generate embedding for a search query
const queryEmbedding = await generateQueryEmbedding('prayer', {
  apiKey: process.env.OPENAI_API_KEY!,
});
```

### Chat

Use system prompts for AI assistant:

```typescript
import { SYSTEM_PROMPT, formatContextForPrompt } from '@ruach/ai/chat';

const context = formatContextForPrompt(
  [/* search results */],
  [/* user history */]
);

const systemPrompt = SYSTEM_PROMPT + '\n\n' + context;
```

### Recommendations

Generate personalized content recommendations:

```typescript
import {
  mergeRecommendations,
  generateRecommendationReason,
  calculateUserInterest
} from '@ruach/ai/recommendations';

const merged = mergeRecommendations(
  contentBasedResults,
  collaborativeResults,
  { contentWeight: 0.6, collaborativeWeight: 0.4 }
);
```

## API

### Embeddings

#### `generateEmbeddings(items, contentType, options)`

Generate embeddings for a batch of content items.

**Parameters:**
- `items`: Array of content items with `id`, `title`, `description`, etc.
- `contentType`: Type of content ('media', 'lesson', 'blog', etc.)
- `options.apiKey`: OpenAI API key
- `options.model`: Embedding model (default: 'text-embedding-3-small')
- `options.batchSize`: Batch size for API calls (default: 100)

**Returns:** Array of `EmbeddingResult` objects

#### `generateQueryEmbedding(query, options)`

Generate embedding for a single query string.

**Parameters:**
- `query`: Search query string
- `options.apiKey`: OpenAI API key
- `options.model`: Embedding model

**Returns:** Array of numbers (embedding vector)

### Chat

#### `SYSTEM_PROMPT`

Complete system prompt for the Ruach AI Assistant. Includes:
- Role definition
- Knowledge base description
- Tone and style guidelines
- Content recommendation format
- Important limitations

#### `formatContextForPrompt(searchResults, userHistory)`

Format search results and user history for inclusion in chat context.

**Parameters:**
- `searchResults`: Array of semantically similar content
- `userHistory`: Array of user's recent interactions

**Returns:** Formatted string for LLM context

### Recommendations

#### `calculateUserInterest(interactions)`

Calculate weighted score indicating user interest level.

**Parameters:**
- `interactions`: Array of user interactions with weights

**Returns:** Normalized interest score

#### `generateRecommendationReason(item, basis)`

Generate human-readable explanation for recommendation.

**Parameters:**
- `item`: Content item being recommended
- `basis`: Reason basis (similarTo, basedOnHistory, popular, tags)

**Returns:** Explanation string

#### `mergeRecommendations(contentBased, collaborative, options)`

Merge and rank recommendations from multiple sources.

**Parameters:**
- `contentBased`: Content-based recommendations
- `collaborative`: Collaborative filtering recommendations
- `options.contentWeight`: Weight for content-based (default: 0.6)
- `options.collaborativeWeight`: Weight for collaborative (default: 0.4)
- `options.diversify`: Ensure content type diversity

**Returns:** Merged and sorted recommendations

## Development

```bash
# Install dependencies
pnpm install

# Build package
pnpm build

# Watch mode
pnpm dev

# Type check
pnpm typecheck

# Run tests
pnpm test
```

## Package Structure

```
@ruach/ai/
├── src/
│   ├── embeddings/
│   │   ├── generator.ts    # Embedding generation
│   │   └── index.ts
│   ├── chat/
│   │   ├── prompts.ts      # System prompts
│   │   └── index.ts
│   ├── recommendations/
│   │   ├── engine.ts       # Recommendation algorithms
│   │   └── index.ts
│   └── index.ts            # Main exports
├── package.json
├── tsconfig.json
└── tsup.config.ts
```

## Environment Variables

Required for functionality:

```bash
# OpenAI (for embeddings)
OPENAI_API_KEY=sk-proj-...

# Anthropic (for chat - used in apps, not this package)
ANTHROPIC_API_KEY=sk-ant-...
```

## Dependencies

- `openai` - Official OpenAI SDK
- `zod` - Type-safe validation

## Used By

- `apps/ruach-next` - Main Next.js application
- Future packages and applications in monorepo

## License

Private - Ruach Ministries

## Contributing

This package is part of the Ruach monorepo. All contributions should follow the monorepo conventions.

1. Make changes in `packages/ruach-ai/src`
2. Run `pnpm build` to compile
3. Test changes in dependent apps
4. Commit and push

## Related

- [Phase 4 AI Architecture](/PHASE_4_AI_ARCHITECTURE.md) - Complete AI system design
- [Phase 4 Complete](/PHASE_4_COMPLETE.md) - Deployment guide
- [@ruach/components](/packages/ruach-components) - UI components
- [@ruach/addons](/packages/ruach-addons) - Utility functions

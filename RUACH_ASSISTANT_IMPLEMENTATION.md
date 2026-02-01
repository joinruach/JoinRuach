# Ruach AI Assistant - Implementation Guide

Complete documentation for the Ruach AI Assistant frontend implementation for the Next.js application.

## Overview

The Ruach AI Assistant is a comprehensive conversational interface providing biblical and theological guidance through AI-powered responses. It includes:

- Floating chat widget with modal experience
- Full-page dedicated chat interface
- Multiple conversation modes (Q&A, Study Guide, Sermon Prep)
- Citation display with Scripture and library references
- Quality scoring metrics
- Session management and history
- Responsive design with dark mode support

## Files Created

### 1. Component Files

#### `/src/components/ai/RuachAssistant.tsx`
**Entry point component** - Manages the floating chat button and panel toggle
- Floating action button (bottom-right corner)
- Keyboard shortcut: `Cmd/Ctrl + /` to toggle
- Dynamic imports to prevent SSR issues
- ~52 lines of code

#### `/src/components/ai/RuachAssistantPanel.tsx`
**Floating panel component** - Compact chat interface for embedding or floating display
- 420px width × 600px height responsive design
- Three conversation modes with settings panel
- Message streaming with loading animations
- Citation expansion toggles
- Quality score indicators
- Session history tracking
- Error handling with toast notifications
- Keyboard shortcuts (Escape to close)
- ~391 lines of code

#### `/src/components/ai/RuachAssistantFullPage.tsx`
**Full-page component** - Complete chat experience for dedicated assistant page
- Responsive layout with toggleable sidebar
- Session management and saving
- Saved conversation history display
- All RuachAssistantPanel features
- Professional header and footer
- Better mobile experience
- ~470 lines of code

#### `/src/components/ai/CitationCard.tsx`
**Citation display component** - Shows Scripture and library references
- Type-specific styling (amber for Scripture, blue for Library)
- Scripture: Book, chapter:verse, text, translation
- Library: Title, author, page/pages, excerpt, URL
- Copy-to-clipboard functionality
- Expandable excerpts for library citations
- External link indicators
- ~180 lines of code

### 2. Page Files

#### `/src/app/[locale]/assistant/page.tsx`
**Dedicated assistant page** - Full-screen chat interface
- Server component with async session verification
- Imports full-page assistant component
- Metadata configuration for SEO
- Optional authentication requirement (can be toggled)
- Clean minimalist structure
- ~30 lines of code

### 3. API Route Files

#### `/src/app/api/assistant/route.ts`
**Assistant API endpoint** - Proxies to Strapi ruach-generation backend
- POST: Handle chat messages
- GET: Return assistant capabilities and metadata
- Authentication via NextAuth session
- Request/response validation
- Streaming response handling
- Error handling with appropriate HTTP status codes
- Strapi token-based authentication support
- User context preservation
- ~230 lines of code

### 4. Type Definition Files

#### `/src/components/ai/types.ts`
**TypeScript type definitions** - Comprehensive type system
- `AssistantMode`: Q&A, Study Guide, Sermon Prep
- `ScriptureCitation`: Bible verse references
- `LibraryCitation`: Book/resource references
- `QualityScore`: Citation coverage and guardrail metrics
- `AssistantMessage`: Message data structure
- `AssistantSession`: Conversation session state
- `AssistantRequest`/`AssistantResponse`: API contracts
- ~190 lines of code

### 5. Documentation Files

#### `/src/components/ai/README.md`
**Component documentation** - Usage guide and API reference
- Component overview and features
- API integration details
- Installation and configuration
- Feature descriptions
- Styling system documentation
- Error handling guide
- Performance optimizations
- Future enhancement suggestions
- Accessibility information
- Testing guidance
- Troubleshooting guide

## File Statistics

```
Total Files Created: 9
Total Lines of Code: ~1,800 (excluding documentation)

Components:
  - RuachAssistant.tsx: 52 lines
  - RuachAssistantPanel.tsx: 391 lines
  - RuachAssistantFullPage.tsx: 470 lines
  - CitationCard.tsx: 180 lines
  Subtotal: 1,093 lines

Pages:
  - assistant/page.tsx: 30 lines

APIs:
  - api/assistant/route.ts: 230 lines

Types:
  - types.ts: 190 lines

Documentation:
  - README.md: ~500 lines
  - IMPLEMENTATION.md: ~400 lines (this file)
```

## Integration Steps

### 1. Environment Configuration

Add to `.env.local`:

```env
# Strapi Configuration (required)
NEXT_PUBLIC_STRAPI_URL=http://localhost:1337
STRAPI_URL=http://localhost:1337
STRAPI_API_TOKEN=your_api_token_here

# NextAuth (ensure these exist)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_secret_here

# Optional Feature Flags
NEXT_PUBLIC_AI_ASSISTANT_ENABLED=true
AI_ASSISTANT_MAX_HISTORY=20
```

### 2. Update Root Layout

Update `/src/app/layout.tsx` or `/src/app/[locale]/layout.tsx`:

```tsx
import { RuachAssistant } from '@/components/ai/RuachAssistant';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <RuachAssistant />
      </body>
    </html>
  );
}
```

### 3. Verify Toast System

Ensure ToastProvider is in your app providers:

```tsx
// Should already exist in apps/ruach-next/src/app/[locale]/providers.tsx
import { ToastProvider } from "@ruach/components/components/ruach/toast/ToastProvider";

export function Providers({ children }) {
  return (
    <ToastProvider>
      {children}
    </ToastProvider>
  );
}
```

### 4. Strapi Backend Setup

Ensure Strapi has the following endpoint:

```
POST /api/ruach-generation/chat

Request body:
{
  "messages": [...],
  "mode": "Q&A" | "Study Guide" | "Sermon Prep",
  "userId": string,
  "userEmail": string,
  "streaming": boolean
}

Response (streaming):
Content-Type: text/event-stream

data: {message content}
data: {citation data}
```

## Architecture

### Request Flow

```
User Input
    ↓
RuachAssistantPanel/RuachAssistantFullPage
    ↓
useChat hook (@ai-sdk/react)
    ↓
POST /api/assistant
    ↓
NextAuth Session Verification
    ↓
Request Validation
    ↓
Strapi Backend (/api/ruach-generation/chat)
    ↓
Streaming Response
    ↓
Display in Chat Interface
    ↓
Parse Citations & Quality Scores
    ↓
Render with CitationCard components
```

### Component Hierarchy

```
RuachAssistant (Entry)
├── RuachAssistantPanel (Widget)
│   ├── Messages Display
│   ├── CitationCard (Multiple)
│   ├── Quality Score Badge
│   └── Input Form
└── [In root layout]

[locale]/assistant (Page)
└── RuachAssistantFullPage (Full Page)
    ├── Header
    ├── Sidebar (Toggleable)
    │   ├── New Session Button
    │   ├── Saved Sessions
    │   └── Session History
    ├── Messages Area
    │   └── CitationCard (Multiple)
    └── Input Footer
```

## Feature Breakdown

### Chat Modes

1. **Q&A Mode**
   - Quick answers to theological questions
   - Scripture-focused responses
   - Shorter, concise format
   - Suggestions:
     - "What is the biblical view on prayer?"
     - "Explain the Gospel message"
     - "What does the Bible say about faith?"

2. **Study Guide Mode**
   - Comprehensive study materials
   - Discussion questions included
   - Suitable for Bible studies and small groups
   - Suggestions:
     - "Create a study guide on Romans 8"
     - "Explain the Beatitudes with study questions"
     - "Design a small group study on discipleship"

3. **Sermon Prep Mode**
   - Sermon outline development
   - Teaching content generation
   - Devotional material creation
   - Suggestions:
     - "Outline a sermon on John 3:16"
     - "Create a devotional message on Psalm 23"
     - "Develop a teaching series on the Fruit of the Spirit"

### Citation Display

**Scripture Citations:**
- Book name (Romans, John, Psalm, etc.)
- Chapter and verse numbers
- Full verse text
- Translation name
- Styled with amber accent
- Verse indicator dot
- Copy button

**Library Citations:**
- Book title
- Author name
- Page or page range reference
- Optional excerpt preview
- External link support
- Styled with blue accent
- Book indicator dot
- Copy button
- Expandable excerpts

### Quality Metrics

Each AI response includes:
- **Citation Coverage**: 0-100% - How well claims are backed by sources
- **Guardrail Compliance**: 0-100% - Adherence to theological guardrails

Visual indicators:
- Blue dot + percentage for citation coverage
- Green dot + percentage for guardrail compliance
- Displayed below message bubble

### Session Management

**In Full-Page Component:**
- Save current conversation
- View previous saved sessions
- Load past sessions
- Session list shows:
  - Conversation title (first question)
  - Creation date
  - Conversation mode badge
- Quick access to start new session
- Session history during active conversation

## Keyboard Shortcuts

| Shortcut | Action | Where |
|----------|--------|-------|
| `Cmd/Ctrl + /` | Toggle assistant panel | Everywhere |
| `Escape` | Close assistant panel | In panel |
| `Enter` | Send message | In input field |
| `Ctrl/Cmd + Enter` | Send message | Anywhere in panel |

## Styling Details

### Color Palette

- **Primary Brand**: Amber-500/600 (action buttons, user messages)
- **Scripture**: Amber-300/400 (accent for Bible verses)
- **Library**: Blue-400/500 (accent for books)
- **Success**: Emerald-600 (positive feedback)
- **Error**: Red-600 (error messages)
- **Background**: Zinc-950 (dark), White (light)
- **Text**: White (dark), Zinc-900 (light)
- **Borders**: White/10 opacity (dark), Zinc-200 (light)

### Responsive Design

- **Desktop (1024px+)**: Full-featured experience
  - Sidebar visible by default
  - 420px panel width
  - Full-page component shows everything

- **Tablet (768px-1023px)**: Optimized layout
  - Sidebar collapses by default
  - Touch-friendly button sizes
  - Full-page component adapts

- **Mobile (< 768px)**: Mobile-first
  - Full-width panel on pages
  - Sidebar hidden by default
  - Bottom input area sticky
  - Larger touch targets

### Dark Mode

All components include full `dark:` class support:
- Automatic detection via OS preference
- Toggle support (if implemented)
- High contrast for accessibility
- Consistent color scheme

## API Details

### POST /api/assistant

**Authentication Required**: Yes (NextAuth session)

**Request:**
```json
{
  "messages": [
    { "role": "user", "content": "Your question" },
    { "role": "assistant", "content": "Previous response" }
  ],
  "mode": "Q&A",
  "streaming": true
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {...},
  "metadata": {
    "userId": "user-123",
    "timestamp": "2024-02-01T12:00:00Z"
  }
}
```

**Error Responses:**
- `400`: Invalid request (missing fields, invalid mode)
- `401`: Authentication required
- `429`: Too many requests
- `500`: Server error

### GET /api/assistant

**Returns:**
```json
{
  "success": true,
  "capabilities": {
    "modes": ["Q&A", "Study Guide", "Sermon Prep"],
    "maxMessageLength": 4000,
    "streaming": true,
    "features": {
      "citations": true,
      "scriptureLookup": true,
      "qualityScoring": true
    }
  },
  "userInfo": {
    "email": "user@example.com",
    "authenticated": true
  }
}
```

## Performance Considerations

### Optimizations Implemented

1. **Code Splitting**
   - Components use dynamic imports
   - No SSR for widget to prevent hydration mismatches
   - Lazy loading of full-page component

2. **Memoization**
   - `useMemo` for message processing
   - `useCallback` for all event handlers
   - Prevents unnecessary re-renders

3. **Streaming**
   - Native streaming response support
   - No buffering of complete responses
   - Real-time display of content

4. **Virtual Scrolling Ready**
   - Can be added for very long conversations
   - Auto-scroll to bottom optimized

### Optimization Opportunities

Future enhancements:
- Session persistence to IndexedDB for offline support
- Message caching with SWR
- Citation preloading
- Virtual scrolling for 100+ messages
- Image optimization for citation previews
- Debounced typing indicators

## Security Considerations

### Implemented Security Measures

1. **Authentication**
   - All API endpoints require NextAuth session
   - User email and ID passed to backend for auditing

2. **Request Validation**
   - Message content validation
   - Mode validation against allowed list
   - Content length limits enforced

3. **Error Handling**
   - No stack traces exposed to client
   - Generic error messages for production
   - Detailed logging on server side

4. **Token Management**
   - STRAPI_API_TOKEN in .env (not exposed)
   - Secrets never sent to frontend
   - NextAuth CSRF protection

### Recommendations

1. Implement rate limiting on `/api/assistant`
2. Add request size limits
3. Validate citation URLs before displaying
4. Implement content moderation
5. Add audit logging for all requests
6. Monitor for abuse patterns
7. Implement session timeout

## Testing Guide

### Unit Tests Example

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RuachAssistant } from '@/components/ai/RuachAssistant';

describe('RuachAssistant', () => {
  it('renders button when closed', () => {
    render(<RuachAssistant />);
    expect(screen.getByRole('button', { name: /open ruach/i })).toBeInTheDocument();
  });

  it('opens panel on button click', async () => {
    const user = userEvent.setup();
    render(<RuachAssistant />);
    await user.click(screen.getByRole('button', { name: /open ruach/i }));
    expect(screen.getByText(/how can i help/i)).toBeInTheDocument();
  });

  it('closes on escape key', async () => {
    const user = userEvent.setup();
    render(<RuachAssistant />);
    await user.click(screen.getByRole('button', { name: /open ruach/i }));
    await user.keyboard('{Escape}');
    expect(screen.queryByText(/how can i help/i)).not.toBeInTheDocument();
  });
});
```

### Integration Tests

Test with actual Strapi backend or mock:

```typescript
import { server } from './mocks/server'; // MSW setup

describe('Assistant API Integration', () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('sends message and receives response', async () => {
    // Test full flow
  });

  it('handles streaming responses', async () => {
    // Test streaming
  });

  it('displays citations correctly', async () => {
    // Test citation rendering
  });
});
```

## Troubleshooting

### Common Issues

1. **Panel not appearing**
   - Check if RuachAssistant is in layout
   - Verify `z-50` isn't overridden
   - Check browser console for errors

2. **Messages not sending**
   - Verify STRAPI_URL is correct
   - Check STRAPI_API_TOKEN is valid
   - Verify NextAuth session exists
   - Check network tab for API errors

3. **Styling looks broken**
   - Ensure Tailwind is configured
   - Check dark mode is enabled
   - Look for CSS conflicts
   - Clear Next.js cache: `rm -rf .next`

4. **Streaming not working**
   - Verify Strapi returns `text/event-stream`
   - Check CORS headers
   - Look at network response headers
   - Verify response chunking is enabled

5. **Citations not displaying**
   - Check API response includes citations
   - Verify metadata parsing works
   - Check CitationCard props
   - Inspect browser console

## Maintenance

### Regular Tasks

- Monitor API error rates
- Review performance metrics
- Update dependencies monthly
- Test with latest Next.js version
- Review Strapi compatibility
- Check accessibility compliance

### Update Procedures

When updating:
1. Update dependencies in `package.json`
2. Run tests to verify compatibility
3. Test in development environment
4. Update documentation if needed
5. Deploy to staging first
6. Monitor error rates after deployment

## Future Enhancements

Planned features:
1. Session persistence to database
2. Advanced search across conversations
3. Export to PDF/Markdown
4. Conversation branching
5. Custom prompt templates
6. Integration with Bible API
7. Audio response support
8. Citation formatting options
9. Social sharing features
10. Usage analytics

## Support and Contact

For issues or questions:
1. Check `/src/components/ai/README.md`
2. Review component comments
3. Check TypeScript types for API contracts
4. Review Strapi backend documentation
5. Check browser console for errors

## Version History

- **v1.0.0** (2024-02-01) - Initial implementation
  - Floating chat widget
  - Full-page assistant
  - Three conversation modes
  - Citation display
  - Quality scoring
  - Session management

---

**Last Updated**: 2024-02-01
**Status**: Production Ready
**Maintained By**: Ruach Development Team

# Ruach AI Assistant Components

This directory contains the complete implementation of the Ruach AI Assistant - a conversational chat interface integrated with the Strapi ruach-generation API.

## Components Overview

### 1. RuachAssistant.tsx (Entry Point)
The main component that manages the floating chat button and panel toggle.

**Features:**
- Floating action button (FAB) at bottom-right
- Keyboard shortcut: `Cmd/Ctrl + /` to toggle open/close
- Dynamic import with no SSR to prevent hydration mismatches
- Accessible ARIA labels and keyboard navigation

**Usage:**
```tsx
import { RuachAssistant } from '@/components/ai/RuachAssistant';

export default function Layout() {
  return (
    <>
      <YourContent />
      <RuachAssistant />
    </>
  );
}
```

### 2. RuachAssistantPanel.tsx (Chat Widget)
A compact chat interface suitable for embedding in pages or displaying as a floating panel.

**Features:**
- Streaming message display with loading states
- Three conversation modes: Q&A, Study Guide, Sermon Prep
- Expandable citation display
- Quality score indicators
- Settings panel for mode selection
- Session history tracking
- Mobile-responsive design
- Dark mode support
- Error handling with toast notifications
- Keyboard shortcuts (Escape to close)

**Props:**
```typescript
interface Props {
  onClose: () => void; // Called when user clicks close button
}
```

### 3. RuachAssistantFullPage.tsx (Full-Page Experience)
A complete, full-screen chat experience with advanced features.

**Features:**
- All RuachAssistantPanel features
- Toggleable sidebar with session management
- Saved conversations history
- Session persistence
- Mode-specific suggestions
- Citation saving functionality
- Better use of screen real estate
- Professional layout with header and input footer

**Used By:**
- `/[locale]/assistant` page for dedicated assistant experience

### 4. CitationCard.tsx (Citation Display)
Reusable component for displaying Scripture and library citations.

**Citation Types:**
```typescript
// Scripture Citation
interface ScriptureCitation {
  type: 'scripture';
  book: string;
  chapter: number;
  verse: number;
  text: string;
  translation?: string;
}

// Library Citation
interface LibraryCitation {
  type: 'library';
  title: string;
  author: string;
  page?: number;
  pages?: string;
  excerpt?: string;
  url?: string;
}
```

**Features:**
- Type-specific styling (amber for Scripture, blue for Library)
- Copy-to-clipboard functionality
- Expandable excerpts
- Source links with external link indicator
- Page/verse references
- Styled distinctively with visual indicators

## API Integration

### `/api/assistant` Route

**Authentication:**
- Requires NextAuth session
- User email passed to backend

**Request Format:**
```typescript
POST /api/assistant
Content-Type: application/json

{
  "messages": [
    { "role": "user", "content": "Your question here" },
    { "role": "assistant", "content": "Previous response" }
  ],
  "mode": "Q&A" | "Study Guide" | "Sermon Prep",
  "streaming": true
}
```

**Endpoint Features:**
- Request validation
- Streaming response proxying
- Error handling with appropriate HTTP status codes
- User context preservation (email, ID)
- Rate limiting ready
- Strapi authentication token support

**Proxies to:**
- `${STRAPI_URL}/api/ruach-generation/chat`

### Response Format

**Metadata Support:**
- `citations`: Array of Citation objects
- `qualityScore`: Object with citation coverage and guardrail compliance percentages

## Installation & Configuration

### 1. Environment Variables

Add to `.env.local`:
```env
# Strapi Configuration
NEXT_PUBLIC_STRAPI_URL=http://localhost:1337
STRAPI_URL=http://localhost:1337
STRAPI_API_TOKEN=your_api_token_here

# NextAuth (existing)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_secret_here

# Feature Flags
NEXT_PUBLIC_AI_ASSISTANT_ENABLED=true
```

### 2. Integration Points

**Add to your root layout:**
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

**Create dedicated assistant page:**
Already included at `/[locale]/assistant`

### 3. Toast System

The components use the existing toast system:
```tsx
import { useToast } from '@/components/ruach/toast/useToast';

const { toast } = useToast();

toast({
  title: 'Success',
  description: 'Message sent',
  variant: 'success' | 'error' | 'default'
});
```

## Features Detailed

### Chat Modes

Each mode provides different suggestions and tailor responses:

#### Q&A Mode
- Quick answers to theological questions
- Scripture references
- Doctrinal explanations
- Suggestions:
  - "What is the biblical view on prayer?"
  - "Explain the Gospel message"
  - "What does the Bible say about faith?"

#### Study Guide Mode
- Creates comprehensive study materials
- Includes discussion questions
- Suitable for small groups
- Suggestions:
  - "Create a study guide on Romans 8"
  - "Explain the Beatitudes with study questions"
  - "Design a small group study on discipleship"

#### Sermon Prep Mode
- Develops sermon outlines
- Creates teaching content
- Provides devotional material
- Suggestions:
  - "Outline a sermon on John 3:16"
  - "Create a devotional message on Psalm 23"
  - "Develop a teaching series on the Fruit of the Spirit"

### Quality Indicators

Each response includes quality metrics:
- **Citation Coverage** (0-100%): How thoroughly the response is backed by sources
- **Guardrail Compliance** (0-100%): Adherence to theological guardrails

### Mobile Responsiveness

Components adapt to screen sizes:
- Desktop: Full-featured experience
- Tablet: Collapsed sidebar by default
- Mobile: Full-width panel or fullscreen on dedicated page

### Dark Mode Support

All components include full dark mode styling using Tailwind's `dark:` prefix classes.

### Keyboard Shortcuts

- `Cmd/Ctrl + /`: Toggle assistant (in widget mode)
- `Escape`: Close assistant panel
- `Cmd/Ctrl + Enter`: Send message (future enhancement)

## Styling System

### Color Scheme

- **Primary**: Amber-500/600 for actions (theme color)
- **Scripture**: Amber-300/400 accent with gold styling
- **Library**: Blue accent for citations
- **Success**: Emerald-600 for positive feedback
- **Error**: Red-600 for errors
- **Background**: Dark mode uses zinc-950, light mode uses white

### Tailwind Classes Used

- Flexbox layout system
- Responsive utilities (`dark:`, `hover:`)
- Animate utilities for loading states
- Border and shadow utilities for depth
- Gradient utilities for visual interest

## Error Handling

Components handle various error scenarios:

1. **Network Errors**: Displayed in error banner
2. **Invalid Input**: Form validation with visual feedback
3. **Session Errors**: Handled at API level, prompt to re-authenticate
4. **Strapi Connection**: Graceful error messages
5. **Rate Limiting**: Displays "too many requests" message

All errors use the toast notification system for visibility.

## Performance Optimizations

- **Code Splitting**: Components use `dynamic()` import with `ssr: false`
- **Message Memoization**: `useMemo` for message processing
- **Callback Optimization**: `useCallback` for handlers to prevent unnecessary renders
- **Virtual Scrolling Ready**: Can be added for very long conversations
- **Streaming Support**: Native streaming response handling

## Future Enhancements

Potential additions:

1. **Session Persistence**: Save conversations to database
2. **Advanced Search**: Search across saved sessions
3. **Export Options**: Download conversations as PDF/Markdown
4. **Conversation Branching**: Create alternative response paths
5. **Custom Prompts**: User-created prompt templates
6. **Integration with Bible API**: Direct scripture lookup
7. **Audio Responses**: Text-to-speech for responses
8. **Cite-to-Doc**: Export citations in specific formats
9. **Sharing**: Share conversations with other users
10. **Analytics**: Track popular questions and usage patterns

## Accessibility

- All buttons have `aria-label` and `title` attributes
- Keyboard navigation fully supported
- High contrast colors in both light and dark modes
- Toast notifications use `role="status"` and `aria-live="polite"`
- Semantic HTML structure
- Focus states clearly visible

## Testing

Components can be tested with:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RuachAssistant } from '@/components/ai/RuachAssistant';

describe('RuachAssistant', () => {
  it('opens when button is clicked', async () => {
    render(<RuachAssistant />);
    const button = screen.getByRole('button', { name: /open ruach/i });
    await userEvent.click(button);
    expect(screen.getByText(/how can i help/i)).toBeInTheDocument();
  });
});
```

## Troubleshooting

### Panel Not Opening
- Check `NEXTAUTH_SESSION_CALLBACK_URL` configuration
- Verify ToastProvider is in root layout
- Check browser console for errors

### Messages Not Sending
- Verify `STRAPI_URL` is correct
- Check `STRAPI_API_TOKEN` is valid
- Verify NextAuth session is active
- Check network tab for API call details

### Styling Issues
- Ensure Tailwind CSS is properly configured
- Check that dark mode is enabled in `tailwind.config.ts`
- Verify no CSS conflicts with existing styles

### Streaming Not Working
- Verify Strapi endpoint returns `text/event-stream`
- Check CORS headers if using remote Strapi
- Ensure response chunking is properly configured

## Contributing

When adding features:

1. Maintain existing component interfaces
2. Add TypeScript types for new features
3. Update this README with documentation
4. Test dark mode support
5. Ensure mobile responsiveness
6. Add accessibility features
7. Handle error cases gracefully

## License

Part of the Ruach Ministry codebase - Proprietary

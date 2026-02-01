# Ruach AI Assistant - Quick Start Guide

Get the Ruach AI Assistant up and running in 5 minutes.

## Prerequisites

- [ ] Next.js app is running
- [ ] NextAuth is configured
- [ ] Strapi backend is running
- [ ] Toast system is set up

## Installation

### Step 1: Environment Variables

Add to `.env.local`:

```env
# Required
STRAPI_URL=http://localhost:1337
STRAPI_API_TOKEN=your_token_here

# Already exist
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_secret
```

### Step 2: Add to Root Layout

In `/src/app/[locale]/layout.tsx` or `/src/app/layout.tsx`:

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

That's it! The floating chat button will appear in the bottom-right corner.

## Usage

### For End Users

1. **Open Chat**: Click the floating "AI" button or press `Cmd/Ctrl + /`
2. **Select Mode**: Click the settings icon to choose Q&A, Study Guide, or Sermon Prep
3. **Ask Question**: Type your question and press Enter
4. **View Citations**: Click "Show citations" to see sources
5. **Copy Citation**: Click the copy button on any citation
6. **Close**: Press Escape or click the X button

### For Developers

#### Use the Widget Component

```tsx
import { RuachAssistant } from '@/components/ai/RuachAssistant';

// In any page or layout
<RuachAssistant />
```

#### Use the Panel Component

```tsx
import RuachAssistantPanel from '@/components/ai/RuachAssistantPanel';
import { useState } from 'react';

export default function MyPage() {
  const [open, setOpen] = useState(true);

  if (!open) return null;

  return <RuachAssistantPanel onClose={() => setOpen(false)} />;
}
```

#### Use the Full-Page Component

Navigate to `/[locale]/assistant` - it's pre-configured!

## What You Get

### Floating Widget
- Compact 420x600px chat interface
- Three conversation modes
- Citation display
- Quality indicators
- Mobile responsive
- Dark mode support

### Full-Page Experience
- `/[locale]/assistant` route
- Session sidebar
- Saved conversations
- Full-screen chat
- Professional layout

### Features
- Real-time streaming responses
- Scripture and library citations
- Quality scoring metrics
- Session history tracking
- Error handling
- Toast notifications

## Configuration

### Change Colors

Edit the Tailwind classes in components:
- Replace `bg-amber-500` with your primary color
- Replace `text-blue-400` with your citation color
- All colors in `/src/components/ai/*.tsx`

### Require Authentication

In `/src/app/[locale]/assistant/page.tsx`:

```tsx
export default async function AssistantPage() {
  const session = await auth();

  if (!session?.user) {
    redirect(`/login`);
  }

  // ...rest of component
}
```

### Adjust Panel Size

In `RuachAssistant.tsx`, modify the `w-[420px]` and `h-[600px]` classes:

```tsx
<div className="... w-[500px] h-[700px] ...">
  {/* Panel content */}
</div>
```

### Change API Endpoint

In `RuachAssistantPanel.tsx`, modify the hook:

```tsx
const { messages, sendMessage } = useChat({
  api: '/api/custom-endpoint', // Change this
});
```

## Testing Locally

### 1. Start Development Server

```bash
cd apps/ruach-next
npm run dev
```

### 2. Open in Browser

Visit `http://localhost:3000/en/assistant` for full-page experience.

Or use floating button on any page with `Cmd/Ctrl + /`.

### 3. Test Message

Try: "What does the Bible say about love?"

Expected response:
- AI-generated answer
- Scripture citations
- Quality score
- Copy buttons on citations

### 4. Test Modes

1. Click settings icon
2. Select "Study Guide" mode
3. Ask: "Create a study guide on John 3:16"
4. See expanded response with questions

## Backend Setup

The API route expects Strapi endpoint:

```
POST http://localhost:1337/api/ruach-generation/chat

Request body:
{
  "messages": [
    { "role": "user", "content": "Hello" }
  ],
  "mode": "Q&A",
  "streaming": true,
  "userId": "user123",
  "userEmail": "user@example.com"
}

Response (streaming):
Content-Type: text/event-stream

data: {"type":"message","content":"...response text..."}
data: {"type":"citation","citation":{...}}
data: {"type":"score","score":{"citationCoverage":85,"guardrailCompliance":92}}
```

If Strapi is not ready, you can mock it:

```typescript
// In tests or development
const mockResponse = {
  messages: [
    {
      role: 'assistant',
      content: 'Lorem ipsum dolor sit amet...',
      citations: [
        {
          type: 'scripture',
          book: 'Romans',
          chapter: 3,
          verse: 23,
          text: 'For all have sinned and fall short of the glory of God'
        }
      ],
      qualityScore: {
        citationCoverage: 85,
        guardrailCompliance: 92
      }
    }
  ]
};
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + /` | Toggle assistant panel |
| `Escape` | Close assistant |
| `Enter` | Send message |

## Troubleshooting

### Button not showing?
```bash
# Clear cache and rebuild
rm -rf .next
npm run dev
```

### Messages not sending?
1. Check browser console for errors
2. Check network tab for `/api/assistant` call
3. Verify `STRAPI_URL` in .env.local
4. Verify NextAuth session exists
5. Check Strapi is running

### Styling looks wrong?
1. Ensure Tailwind CSS is configured
2. Check for CSS conflicts
3. Verify `tailwind.config.ts` includes component paths
4. Clear cache: `rm -rf .next`

### Dark mode not working?
1. Check `tailwind.config.ts` has `darkMode: 'class'`
2. Verify `dark:` classes in components
3. Toggle dark mode in browser DevTools

## Next Steps

1. **Customize appearance**
   - Change colors in `CitationCard.tsx`
   - Adjust panel size in `RuachAssistant.tsx`
   - Modify suggestions in mode definitions

2. **Add to more pages**
   - The floating widget appears everywhere once in layout
   - Can customize per page if needed

3. **Integrate with your design**
   - Match your brand colors
   - Adjust spacing to fit your layout
   - Customize fonts in Tailwind config

4. **Monitor usage**
   - Add analytics to track questions
   - Monitor error rates
   - Gather user feedback

5. **Expand features**
   - Add conversation persistence
   - Implement session export
   - Add custom prompts
   - Integrate with other APIs

## Documentation

- **Full Guide**: `/src/components/ai/README.md`
- **Implementation Details**: `/RUACH_ASSISTANT_IMPLEMENTATION.md`
- **Type Definitions**: `/src/components/ai/types.ts`
- **API Reference**: `/src/app/api/assistant/route.ts`

## Support

### Check These First
1. Component README in `/src/components/ai/README.md`
2. Implementation guide in `/RUACH_ASSISTANT_IMPLEMENTATION.md`
3. TypeScript types in `/src/components/ai/types.ts`
4. Browser console for JavaScript errors

### Review Code
- Look for comments in component files
- Check error messages in API route
- Review Strapi integration details

## File Locations

```
/src/
├── components/ai/
│   ├── RuachAssistant.tsx           # Main entry point
│   ├── RuachAssistantPanel.tsx      # Floating widget
│   ├── RuachAssistantFullPage.tsx   # Full page
│   ├── CitationCard.tsx             # Citation display
│   ├── types.ts                     # Type definitions
│   └── README.md                    # Full documentation
├── app/
│   ├── api/assistant/
│   │   └── route.ts                 # API endpoint
│   └── [locale]/
│       └── assistant/
│           └── page.tsx             # Full-page route
└── ...
```

## Performance Tips

1. Keep message history under 50 messages
2. Close panel when not in use to free memory
3. Use streaming for faster perceived speed
4. Cache citations locally if needed
5. Optimize images in library citations

## Common Customizations

### Change Primary Color
Replace `amber-500` with your color:
```tsx
// In CitationCard.tsx
<div className="h-2 w-2 rounded-full bg-red-500" />

// In RuachAssistantPanel.tsx
className="bg-red-500 text-white"
```

### Change Panel Width
In `RuachAssistant.tsx`:
```tsx
<div className="... w-[500px] ...">  {/* was 420px */}
```

### Add Custom Mode
In `RuachAssistantPanel.tsx`:
```tsx
type AssistantMode = 'Q&A' | 'Study Guide' | 'Sermon Prep' | 'Your Mode';

// Add to suggestions
'Your Mode': [
  'Your suggestion 1',
  'Your suggestion 2',
  'Your suggestion 3',
]
```

### Change API Endpoint
In `RuachAssistantPanel.tsx`:
```tsx
const { messages, sendMessage } = useChat({
  api: '/api/custom-endpoint',
});
```

## Ready to Go!

You now have a fully functional AI assistant. Users can:
- ✅ Ask biblical questions
- ✅ Get cited responses
- ✅ View source materials
- ✅ See quality metrics
- ✅ Save conversations
- ✅ Choose response types

Happy chatting! 🚀

---

**Need help?** Check the README files or implementation guide.

# 🎨 Ruach Component Library Documentation

**Version:** 1.0
**Last Updated:** 2025-11-12

Complete reference for all React components in the Ruach Ministries platform.

---

## 📑 Table of Contents

1. [Layout Components](#layout-components)
2. [Media Components](#media-components)
3. [Social Components](#social-components)
4. [Scripture Components](#scripture-components)
5. [Livestream Components](#livestream-components)
6. [Theme Components](#theme-components)
7. [Form Components](#form-components)
8. [Utility Components](#utility-components)

---

## 🏗️ Layout Components

### Header

Main site header with navigation and responsive mobile menu.

**Location:** `src/components/layout/Header.tsx`

**Props:**
```typescript
interface HeaderProps {
  className?: string;
}
```

**Usage:**
```tsx
import Header from '@/components/layout/Header';

<Header />
```

**Features:**
- Responsive navigation
- Mobile hamburger menu
- Theme toggle integration
- Sticky positioning
- Dark mode support

---

### Footer

Site footer with links and social media.

**Location:** `src/components/layout/Footer.tsx`

**Usage:**
```tsx
import Footer from '@/components/layout/Footer';

<Footer />
```

**Features:**
- Multi-column layout
- Social media links
- Copyright notice
- Newsletter signup (optional)

---

## 🎬 Media Components

### MediaPlayer

Video/audio player with controls.

**Location:** `src/components/ruach/MediaPlayer.tsx`

**Props:**
```typescript
interface MediaPlayerProps {
  mediaId: number;
  videoUrl?: string;
  isFileVideo?: boolean;
  poster?: string;
  title?: string;
}
```

**Usage:**
```tsx
import MediaPlayer from '@/components/ruach/MediaPlayer';

<MediaPlayer
  mediaId={123}
  videoUrl="https://youtube.com/watch?v=..."
  poster="/thumbnail.jpg"
  title="Sunday Service"
/>
```

**Features:**
- YouTube embed support
- Direct video file playback
- Poster image
- Responsive aspect ratio
- Accessibility controls

---

### MediaCard

Card component for displaying media items.

**Location:** `src/components/ruach/MediaCard.tsx`

**Props:**
```typescript
interface MediaCardProps {
  title: string;
  href: string;
  excerpt?: string;
  category?: string;
  thumbnail?: { src?: string; alt?: string };
  views?: number;
  durationSec?: number;
  speakers?: string[];
  likes?: number;
  contentId?: string | number;
  isLive?: boolean;
}
```

**Usage:**
```tsx
import MediaCard from '@/components/ruach/MediaCard';

<MediaCard
  title="Sunday Service - Faith"
  href="/media/sunday-service-faith"
  thumbnail={{ src: "/thumb.jpg" }}
  category="Sermons"
  views={1234}
  durationSec={1800}
  speakers={["Pastor John"]}
  likes={56}
  isLive={false}
/>
```

**Features:**
- Thumbnail with hover effect
- Metadata (views, duration, speakers)
- Like count display
- Live indicator badge
- Responsive grid layout

---

### MediaGrid

Responsive grid layout for media cards.

**Location:** `@ruach/components/components/ruach/MediaGrid.tsx`

**Props:**
```typescript
interface MediaGridProps {
  items: MediaCardProps[];
}
```

**Usage:**
```tsx
import MediaGrid from '@ruach/components/components/ruach/MediaGrid';

<MediaGrid items={mediaItems} />
```

**Features:**
- Responsive grid (1-4 columns)
- Gap spacing
- Auto-sizing cards

---

## 💙 Social Components

### LikeButton

Interactive like button with heart animation.

**Location:** `src/components/social/LikeButton.tsx`

**Props:**
```typescript
interface LikeButtonProps {
  contentType: "media" | "course" | "series" | "event";
  contentId: string | number;
  initialLikes?: number;
  onLike?: (liked: boolean, newCount: number) => void;
  showCount?: boolean;
  size?: "sm" | "md" | "lg";
}
```

**Usage:**
```tsx
import LikeButton from '@/components/social/LikeButton';

<LikeButton
  contentType="media"
  contentId={123}
  initialLikes={42}
  onLike={(liked, count) => console.log(liked, count)}
  size="md"
/>
```

**Features:**
- Heart animation on click
- Like count display
- localStorage persistence
- Optimistic UI updates
- Three size variants
- Analytics tracking

---

### ShareButton

Multi-platform share button.

**Location:** `src/components/social/ShareButton.tsx`

**Props:**
```typescript
interface ShareButtonProps {
  url: string;
  title: string;
  description?: string;
  hashtags?: string[];
  onShare?: (platform: string) => void;
}
```

**Usage:**
```tsx
import ShareButton from '@/components/social/ShareButton';

<ShareButton
  url="https://ruach.org/media/sermon"
  title="Sunday Service"
  description="Join us for worship"
  hashtags={["faith", "worship"]}
  onShare={(platform) => trackShare(platform)}
/>
```

**Features:**
- Twitter, Facebook, LinkedIn, Email
- Copy link to clipboard
- Web Share API on mobile
- Dropdown menu UI
- Analytics tracking

---

### LikeCount

Display-only like count.

**Location:** `src/components/social/LikeCount.tsx`

**Props:**
```typescript
interface LikeCountProps {
  count: number;
  showIcon?: boolean;
  className?: string;
}
```

**Usage:**
```tsx
import LikeCount from '@/components/social/LikeCount';

<LikeCount count={247} showIcon={true} />
```

**Features:**
- Compact display
- Heart icon
- Formatted numbers (k/M)

---

## 📖 Scripture Components

### ScriptureLookup

Combined scripture reference and modal (recommended).

**Location:** `src/components/scripture/ScriptureLookup.tsx`

**Props:**
```typescript
interface ScriptureLookupProps {
  reference: string;
  variant?: "inline" | "badge" | "button";
  className?: string;
}
```

**Usage:**
```tsx
import { ScriptureLookup } from '@/components/scripture';

<ScriptureLookup reference="John 3:16" variant="inline" />
```

**Features:**
- Click to view verse
- Auto-fetches from Bible API
- Modal with verse text
- Three style variants
- Copy and share options

---

### ScriptureReference

Clickable scripture reference.

**Location:** `src/components/scripture/ScriptureReference.tsx`

**Props:**
```typescript
interface ScriptureReferenceProps {
  reference: string;
  onClick?: () => void;
  className?: string;
  variant?: "inline" | "badge" | "button";
}
```

**Usage:**
```tsx
import { ScriptureReference } from '@/components/scripture';

<ScriptureReference
  reference="John 3:16"
  onClick={() => handleClick()}
  variant="badge"
/>
```

**Features:**
- Three style variants
- Keyboard navigation
- ARIA accessible
- Hover states

**Variants:**
- **inline** - Underlined link
- **badge** - Rounded pill with icon
- **button** - Filled button

---

### ScriptureModal

Modal for viewing scripture.

**Location:** `src/components/scripture/ScriptureModal.tsx`

**Props:**
```typescript
interface ScriptureModalProps {
  reference: string;
  isOpen: boolean;
  onClose: () => void;
}
```

**Usage:**
```tsx
import { ScriptureModal } from '@/components/scripture';

const [open, setOpen] = useState(false);

<ScriptureModal
  reference="John 3:16"
  isOpen={open}
  onClose={() => setOpen(false)}
/>
```

**Features:**
- Fetches from bible-api.com
- Loading and error states
- Copy to clipboard
- Web Share API
- Keyboard navigation (Esc to close)

---

### ScriptureHighlight

Display scripture text inline.

**Location:** `src/components/scripture/ScriptureHighlight.tsx`

**Props:**
```typescript
interface ScriptureHighlightProps {
  reference: string;
  showReference?: boolean;
  className?: string;
  variant?: "card" | "quote" | "inline";
}
```

**Usage:**
```tsx
import { ScriptureHighlight } from '@/components/scripture';

<ScriptureHighlight
  reference="John 3:16"
  variant="card"
  showReference={true}
/>
```

**Features:**
- Auto-fetches verse text
- Three display variants
- Loading states
- Theme-aware

**Variants:**
- **card** - Gradient card with icon
- **quote** - Left border quote
- **inline** - Compact highlight

---

### ScriptureList

Display multiple scripture references.

**Location:** `src/components/scripture/ScriptureList.tsx`

**Props:**
```typescript
interface ScriptureListProps {
  references: string[];
  title?: string;
  variant?: "inline" | "badge" | "button";
  className?: string;
}
```

**Usage:**
```tsx
import { ScriptureList } from '@/components/scripture';

<ScriptureList
  title="Key Verses"
  references={["John 3:16", "Romans 8:28", "Philippians 4:13"]}
  variant="badge"
/>
```

**Features:**
- Multiple clickable references
- Optional title
- Responsive layout
- All references open in modal

---

## 🔴 Livestream Components

### LiveIndicator

Pulsing LIVE badge.

**Location:** `src/components/livestream/LiveIndicator.tsx`

**Props:**
```typescript
interface LiveIndicatorProps {
  isLive?: boolean;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  pulse?: boolean;
  className?: string;
}
```

**Usage:**
```tsx
import { LiveIndicator } from '@/components/livestream';

<LiveIndicator
  isLive={true}
  size="md"
  pulse={true}
/>
```

**Features:**
- Pulsing animation
- Three sizes
- Optional label
- Red background with white text

---

### LivestreamPlayer

YouTube player with optional chat.

**Location:** `src/components/livestream/LivestreamPlayer.tsx`

**Props:**
```typescript
interface LivestreamPlayerProps {
  videoId: string;
  isLive?: boolean;
  showChat?: boolean;
  title?: string;
  autoplay?: boolean;
  className?: string;
}
```

**Usage:**
```tsx
import { LivestreamPlayer } from '@/components/livestream';

<LivestreamPlayer
  videoId="dQw4w9WgXcQ"
  isLive={true}
  showChat={true}
  title="Sunday Service"
/>
```

**Features:**
- YouTube embed
- Side-by-side chat (desktop)
- Tabbed view (mobile)
- Live indicator
- Responsive layout

---

### CountdownTimer

Real-time countdown timer.

**Location:** `src/components/livestream/CountdownTimer.tsx`

**Props:**
```typescript
interface CountdownTimerProps {
  targetDate: Date | string;
  onComplete?: () => void;
  className?: string;
  showLabels?: boolean;
}
```

**Usage:**
```tsx
import { CountdownTimer } from '@/components/livestream';

<CountdownTimer
  targetDate="2025-12-25T10:00:00Z"
  onComplete={() => console.log('Started!')}
  showLabels={true}
/>
```

**Features:**
- Updates every second
- Days, hours, minutes, seconds
- onComplete callback
- Completion message
- SSR-safe

---

### UpcomingStream

Stream preview card with countdown.

**Location:** `src/components/livestream/UpcomingStream.tsx`

**Props:**
```typescript
interface UpcomingStreamProps {
  title: string;
  description?: string;
  scheduledTime: Date | string;
  thumbnail?: string;
  onStreamStart?: () => void;
  className?: string;
}
```

**Usage:**
```tsx
import { UpcomingStream } from '@/components/livestream';

<UpcomingStream
  title="Sunday Service"
  description="Join us for worship"
  scheduledTime="2025-12-25T10:00:00Z"
  thumbnail="/thumb.jpg"
/>
```

**Features:**
- Countdown timer
- Date/time display
- Thumbnail preview
- Call-to-action when live
- Responsive grid

---

### StreamNotification

Floating notification for upcoming streams.

**Location:** `src/components/livestream/StreamNotification.tsx`

**Props:**
```typescript
interface StreamNotificationProps {
  streamId: string | number;
  title: string;
  scheduledStart: Date | string;
  streamUrl: string;
  notificationWindowMinutes?: number;
}
```

**Usage:**
```tsx
import { StreamNotification } from '@/components/livestream';

<StreamNotification
  streamId={123}
  title="Sunday Service"
  scheduledStart="2025-12-25T10:00:00Z"
  streamUrl="/events/sunday-service"
  notificationWindowMinutes={30}
/>
```

**Features:**
- Auto-shows 30 min before
- Dismissible
- localStorage persistence
- Real-time countdown
- Fixed bottom-right position

---

## 🎨 Theme Components

### ThemeProvider

Context provider for theme management.

**Location:** `src/contexts/ThemeContext.tsx`

**Usage:**
```tsx
import { ThemeProvider } from '@/contexts/ThemeContext';

function App() {
  return (
    <ThemeProvider>
      <YourApp />
    </ThemeProvider>
  );
}
```

**Features:**
- Three modes: light, dark, system
- localStorage persistence
- System preference detection
- No flash on load

---

### ThemeToggle

Toggle button for theme switching.

**Location:** `src/components/theme/ThemeToggle.tsx`

**Usage:**
```tsx
import ThemeToggle from '@/components/theme/ThemeToggle';

<ThemeToggle />
```

**Features:**
- Animated sun/moon icons
- Cycles through themes
- Amber indicator for system mode
- Smooth transitions

---

### useTheme Hook

Access theme state and controls.

**Usage:**
```tsx
import { useTheme } from '@/contexts/ThemeContext';

function MyComponent() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  return (
    <div>
      Current: {resolvedTheme}
      <button onClick={() => setTheme('dark')}>Dark</button>
    </div>
  );
}
```

**Returns:**
- `theme` - Current theme setting
- `setTheme(theme)` - Change theme
- `resolvedTheme` - Actual theme ("light" or "dark")

---

## 📝 Form Components

### Button

Standard button component.

**Props:**
```typescript
interface ButtonProps {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}
```

**Usage:**
```tsx
<Button variant="primary" size="md">
  Click Me
</Button>
```

**Variants:**
- **primary** - Amber filled
- **secondary** - Neutral outline
- **ghost** - Transparent

---

### Input

Text input field.

**Props:**
```typescript
interface InputProps {
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: ChangeEvent) => void;
  error?: string;
}
```

**Usage:**
```tsx
<Input
  type="email"
  placeholder="Enter email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  error={errors.email}
/>
```

---

## 🔧 Utility Components

### SEOHead

SEO meta tags and structured data.

**Location:** `src/components/ruach/SEOHead.tsx`

**Props:**
```typescript
interface SEOHeadProps {
  jsonLd?: Record<string, unknown>;
}
```

**Usage:**
```tsx
import SEOHead from '@/components/ruach/SEOHead';

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "VideoObject",
  "name": "Sunday Service",
  "description": "Join us for worship",
};

<SEOHead jsonLd={jsonLd} />
```

**Features:**
- Schema.org structured data
- JSON-LD injection
- SEO optimization

---

### LoadingSpinner

Loading indicator.

**Usage:**
```tsx
<div className="flex justify-center">
  <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
</div>
```

---

## 🎨 Styling Guidelines

### Color System

**Primary (Amber):**
```tsx
// Light mode
bg-amber-500 text-white

// Dark mode
bg-amber-400 text-black

// Hover states
hover:bg-amber-600 dark:hover:bg-amber-300
```

**Neutral:**
```tsx
// Backgrounds
bg-neutral-50 dark:bg-neutral-950

// Text
text-neutral-900 dark:text-white

// Borders
border-neutral-200 dark:border-white/10
```

### Responsive Design

**Breakpoints:**
```tsx
// Mobile first
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
```

**Tailwind Breakpoints:**
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

### Dark Mode

**Always add dark variants:**
```tsx
<div className="bg-white text-neutral-900 dark:bg-neutral-900 dark:text-white">
```

### Accessibility

**ARIA Labels:**
```tsx
<button aria-label="Like this content" aria-pressed={isLiked}>
  <HeartIcon />
</button>
```

**Keyboard Navigation:**
```tsx
<div
  role="button"
  tabIndex={0}
  onKeyDown={(e) => e.key === 'Enter' && handleClick()}
>
```

---

## 📦 Package Organization

### @ruach/components

Shared React components used across apps.

**Export Pattern:**
```tsx
// src/index.ts
export { default as Button } from './Button';
export { default as Card } from './Card';
export type { ButtonProps, CardProps } from './types';
```

**Usage in Apps:**
```tsx
import { Button, Card } from '@ruach/components';
```

### Import Aliases

**Configured in tsconfig.json:**
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@ruach/components": ["../../packages/ruach-components/src"]
    }
  }
}
```

**Usage:**
```tsx
// Internal imports
import Header from '@/components/layout/Header';

// Package imports
import { MediaGrid } from '@ruach/components';
```

---

## 🧪 Testing Components

### Unit Tests

**Example:**
```tsx
import { render, screen } from '@testing-library/react';
import { LikeButton } from '@/components/social/LikeButton';

test('renders like button', () => {
  render(<LikeButton contentType="media" contentId={1} />);
  expect(screen.getByRole('button')).toBeInTheDocument();
});
```

### Component Tests

```tsx
import { userEvent } from '@testing-library/user-event';

test('like button toggles', async () => {
  const user = userEvent.setup();
  render(<LikeButton contentType="media" contentId={1} />);

  const button = screen.getByRole('button');
  await user.click(button);

  expect(button).toHaveAttribute('aria-pressed', 'true');
});
```

---

## 📚 Additional Resources

- **Tailwind Docs:** https://tailwindcss.com/docs
- **Next.js Docs:** https://nextjs.org/docs
- **React Docs:** https://react.dev
- **Accessibility:** https://www.w3.org/WAI/ARIA/apg/

---

**Need help?** Check the [Developer Guide](./DEVELOPER_GUIDE.md) or open an issue on GitHub.

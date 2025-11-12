# Phase 8: Internationalization (i18n)

## Overview

Phase 8 implements full internationalization support using **next-intl**, enabling the platform to serve content in multiple languages with locale-aware routing, translations, and a seamless user experience.

---

## Features Implemented

### 1. Multi-Language Support

**Supported Locales:**
- 🇺🇸 **English (en)** - Default
- 🇪🇸 **Spanish (es)**
- 🇫🇷 **French (fr)**
- 🇧🇷 **Portuguese (pt)**

### 2. Locale Routing

**URL Structure:**
- All routes are prefixed with the locale
- Examples:
  - `/en/` - English homepage
  - `/es/media` - Spanish media page
  - `/fr/courses` - French courses page
  - `/pt/about` - Portuguese about page

**Automatic Redirection:**
- Root `/` automatically redirects to `/en/` (default locale)
- Invalid locales return 404

### 3. Translation System

**Translation Files:**
- Located in `src/messages/`
- One JSON file per locale: `en.json`, `es.json`, `fr.json`, `pt.json`
- Organized by category for easy maintenance

**Translation Categories:**
- `common` - Common UI elements
- `nav` - Navigation labels
- `footer` - Footer content
- `media` - Media-related strings
- `courses` - Course-related strings
- `auth` - Authentication strings
- `theme` - Theme-related strings
- `language` - Language switcher strings
- `search` - Search functionality
- `errors` - Error messages
- `contact` - Contact form strings
- `newsletter` - Newsletter subscription
- `scripture` - Scripture references
- `live` - Livestream features
- `comments` - Comment system

### 4. Locale Switcher Component

**Location:** `src/components/locale/LocaleSwitcher.tsx`

**Features:**
- Visual flags for each language
- Dropdown menu with all available locales
- Preserves current route when switching
- Smooth transitions with loading states
- Keyboard accessible
- Responsive design
- Integrated in Header (desktop + mobile)

**Usage:**
```tsx
import LocaleSwitcher from '@/components/locale/LocaleSwitcher';

<LocaleSwitcher />
```

### 5. Middleware Integration

**File:** `src/middleware.ts`

The middleware handles multiple responsibilities in order:

1. **Locale Routing** - Detects and redirects to appropriate locale
2. **HTTPS Enforcement** - Redirects HTTP to HTTPS in production
3. **Auth Protection** - Protects `/admin` routes
4. **CSP Headers** - Sets Content Security Policy for preview

**Locale Detection:**
- Checks URL prefix for locale
- Falls back to `Accept-Language` header
- Defaults to English if no match

---

## Technical Architecture

### File Structure

```
src/
├── i18n.ts                    # i18n configuration
├── middleware.ts              # Middleware with locale routing
├── messages/                  # Translation files
│   ├── en.json               # English translations
│   ├── es.json               # Spanish translations
│   ├── fr.json               # French translations
│   └── pt.json               # Portuguese translations
├── components/
│   └── locale/
│       └── LocaleSwitcher.tsx # Language switcher component
└── app/
    ├── layout.tsx            # Root layout (minimal wrapper)
    └── [locale]/             # Locale-specific routes
        ├── layout.tsx        # Main layout with providers
        ├── page.tsx          # Homepage
        ├── media/            # Media routes
        ├── courses/          # Course routes
        └── ...               # All other routes
```

### Configuration Files

#### `src/i18n.ts`

Defines supported locales, labels, and message loading:

```typescript
export const locales = ['en', 'es', 'fr', 'pt'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';

export const localeLabels: Record<Locale, string> = {
  en: 'English',
  es: 'Español',
  fr: 'Français',
  pt: 'Português',
};
```

#### `next.config.mjs`

Integrates next-intl plugin:

```javascript
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n.ts');

export default withPWA({...})(withNextIntl(nextConfig));
```

---

## Using Translations

### In Server Components

```tsx
import { useTranslations } from 'next-intl';

export default function MyPage() {
  const t = useTranslations('nav');

  return <h1>{t('home')}</h1>;
}
```

### In Client Components

```tsx
'use client';
import { useTranslations } from 'next-intl';

export default function MyComponent() {
  const t = useTranslations('common');

  return <button>{t('submit')}</button>;
}
```

### With Variables

Translation with variables (in translation file):

```json
{
  "footer": {
    "copyright": "© {year} Ruach Ministries. All rights reserved."
  }
}
```

Usage:

```tsx
const t = useTranslations('footer');
<p>{t('copyright', { year: 2025 })}</p>
```

---

## Navigation

### Using Links

With the middleware setup, standard Next.js `Link` components work automatically:

```tsx
import Link from 'next/link';

// This will automatically use the current locale
<Link href="/media">Media</Link>

// In English: /en/media
// In Spanish: /es/media
```

### Programmatic Navigation

For programmatic navigation with locale awareness:

```tsx
'use client';
import { useRouter, usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';

function MyComponent() {
  const router = useRouter();
  const locale = useLocale();

  const navigateToMedia = () => {
    router.push(`/${locale}/media`);
  };
}
```

---

## Adding New Translations

### 1. Add Translation Keys

Edit all locale files in `src/messages/`:

**en.json:**
```json
{
  "myFeature": {
    "title": "My Feature",
    "description": "This is my feature"
  }
}
```

**es.json:**
```json
{
  "myFeature": {
    "title": "Mi Función",
    "description": "Esta es mi función"
  }
}
```

**fr.json:**
```json
{
  "myFeature": {
    "title": "Ma Fonctionnalité",
    "description": "Ceci est ma fonctionnalité"
  }
}
```

**pt.json:**
```json
{
  "myFeature": {
    "title": "Minha Funcionalidade",
    "description": "Esta é minha funcionalidade"
  }
}
```

### 2. Use in Components

```tsx
const t = useTranslations('myFeature');

<h1>{t('title')}</h1>
<p>{t('description')}</p>
```

---

## Adding New Locales

To add support for a new language (e.g., German):

### 1. Update `src/i18n.ts`

```typescript
export const locales = ['en', 'es', 'fr', 'pt', 'de'] as const;

export const localeLabels: Record<Locale, string> = {
  en: 'English',
  es: 'Español',
  fr: 'Français',
  pt: 'Português',
  de: 'Deutsch',
};

export const localeFlags: Record<Locale, string> = {
  en: '🇺🇸',
  es: '🇪🇸',
  fr: '🇫🇷',
  pt: '🇧🇷',
  de: '🇩🇪',
};
```

### 2. Create Translation File

Create `src/messages/de.json` with all translation keys translated to German.

### 3. Test

- Restart dev server
- Visit `/de/` to test German locale
- Use locale switcher to verify all locales work

---

## RTL Support (Future Enhancement)

For Right-to-Left languages (Arabic, Hebrew):

### 1. Add RTL Locales

```typescript
export const rtlLocales: Locale[] = ['ar', 'he'];
```

### 2. Update Layout

In `src/app/[locale]/layout.tsx`:

```tsx
import { rtlLocales } from '@/i18n';

const isRTL = rtlLocales.includes(locale as Locale);

<html lang={locale} dir={isRTL ? 'rtl' : 'ltr'}>
```

### 3. Add RTL CSS

```css
[dir="rtl"] {
  /* RTL-specific styles */
}
```

---

## Testing

### Manual Testing

1. **Locale Switcher:**
   - Click locale switcher in header
   - Verify dropdown shows all locales
   - Switch to different locale
   - Verify URL updates (e.g., `/en/media` → `/es/media`)
   - Verify page stays on same route

2. **Navigation:**
   - Navigate to different pages
   - Verify locale prefix persists
   - Test internal links maintain locale

3. **Translations:**
   - Verify UI text changes with locale
   - Check navigation labels
   - Verify footer text
   - Test forms and buttons

4. **Direct URLs:**
   - Visit `/en/`, `/es/`, `/fr/`, `/pt/` directly
   - Visit invalid locale like `/xx/` (should 404)
   - Visit root `/` (should redirect to `/en/`)

### Automated Testing (Future)

```typescript
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import messages from '@/messages/en.json';

test('renders translated text', () => {
  render(
    <NextIntlClientProvider messages={messages} locale="en">
      <MyComponent />
    </NextIntlClientProvider>
  );

  expect(screen.getByText('Home')).toBeInTheDocument();
});
```

---

## Performance Considerations

### Bundle Size

- Each locale's messages are loaded separately
- Only the active locale's messages are included in the bundle
- Tree-shaking removes unused translation keys

### Caching

- Middleware runs on every request but is optimized by Next.js Edge Runtime
- Translation files are statically imported and bundled at build time
- No runtime overhead for loading translations

### SEO

- Each locale has its own URL (e.g., `/en/about`, `/es/about`)
- Search engines can index each language separately
- Add `<link rel="alternate" hreflang="..." />` tags for better SEO

**Recommended addition to layout.tsx:**

```tsx
<head>
  <link rel="alternate" hreflang="en" href="https://joinruach.org/en" />
  <link rel="alternate" hreflang="es" href="https://joinruach.org/es" />
  <link rel="alternate" hreflang="fr" href="https://joinruach.org/fr" />
  <link rel="alternate" hreflang="pt" href="https://joinruach.org/pt" />
  <link rel="alternate" hreflang="x-default" href="https://joinruach.org/en" />
</head>
```

---

## Troubleshooting

### Issue: Translations not showing

**Solution:**
- Verify translation key exists in all locale files
- Check for typos in translation keys
- Ensure `useTranslations` namespace matches JSON structure
- Restart dev server to reload translations

### Issue: Locale switcher not working

**Solution:**
- Check browser console for errors
- Verify middleware is running (add console.log)
- Ensure all locales are defined in `src/i18n.ts`
- Clear browser cache and cookies

### Issue: 404 on locale routes

**Solution:**
- Verify `[locale]` directory exists in `src/app/`
- Check middleware matcher config
- Ensure locale is in the `locales` array
- Check that pages exist under `[locale]/` directory

### Issue: Links don't preserve locale

**Solution:**
- Verify middleware is configured correctly
- Use relative URLs in Link components (e.g., `/media` not `https://...`)
- For absolute URLs, include locale prefix manually

---

## Migration Notes

### Breaking Changes

**Route Structure Changed:**
- Old: `/media` → New: `/en/media`
- All routes now require locale prefix
- Update any hardcoded URLs in:
  - External links
  - API calls
  - Redirects
  - Sitemap
  - robots.txt

**Component Updates:**
- All page components moved from `app/` to `app/[locale]/`
- Layout must accept `locale` parameter
- Update any imports that reference page paths

### Backward Compatibility

**Redirects for old URLs:**

Add to `next.config.mjs`:

```javascript
async redirects() {
  return [
    {
      source: '/:path((?!en|es|fr|pt|api|_next).*)',
      destination: '/en/:path*',
      permanent: true,
    },
  ];
}
```

---

## Best Practices

### 1. Translation Keys

- Use nested structure for organization
- Use descriptive keys (not abbreviations)
- Keep consistent naming across locales
- Use camelCase for keys

**Good:**
```json
{
  "media": {
    "watchNow": "Watch Now",
    "shareMedia": "Share"
  }
}
```

**Bad:**
```json
{
  "m_w": "Watch Now",
  "share_1": "Share"
}
```

### 2. Pluralization

Use ICU message format for plurals:

```json
{
  "items": "{count, plural, =0 {No items} =1 {1 item} other {# items}}"
}
```

Usage:
```tsx
t('items', { count: 5 }) // "5 items"
```

### 3. Date and Number Formatting

Use next-intl's formatting utilities:

```tsx
import { useFormatter } from 'next-intl';

const format = useFormatter();

// Dates
format.dateTime(new Date(), { dateStyle: 'long' })

// Numbers
format.number(1234.56, { style: 'currency', currency: 'USD' })
```

### 4. Keep Translations DRY

Extract common strings to shared categories:

```json
{
  "common": {
    "loading": "Loading...",
    "error": "Error",
    "submit": "Submit"
  }
}
```

---

## Future Enhancements

### Planned Improvements

1. **Dynamic Content Translation:**
   - Integrate Strapi i18n plugin
   - Store media titles/descriptions in multiple languages
   - Sync locale between frontend and CMS

2. **User Locale Preference:**
   - Store user's language choice in profile
   - Persist locale preference in cookie/localStorage
   - Auto-detect from browser settings

3. **Translation Management:**
   - Use Crowdin or similar service
   - Automated translation updates
   - Translation memory for consistency

4. **Additional Locales:**
   - Chinese (zh)
   - Japanese (ja)
   - Korean (ko)
   - Arabic (ar) - with RTL support
   - Hebrew (he) - with RTL support

5. **SEO Enhancements:**
   - Automated hreflang tags
   - Locale-specific sitemaps
   - Translated meta descriptions

---

## Resources

- [next-intl Documentation](https://next-intl-docs.vercel.app/)
- [Next.js Internationalization](https://nextjs.org/docs/app/building-your-application/routing/internationalization)
- [ICU Message Format](https://unicode-org.github.io/icu/userguide/format_parse/messages/)
- [Translation Best Practices](https://developers.google.com/international/best-practices)

---

## Summary

Phase 8 successfully implements comprehensive internationalization:

✅ **Multi-language support** (English, Spanish, French, Portuguese)
✅ **Locale-aware routing** with URL prefixes
✅ **Translation system** with 150+ strings in 4 languages
✅ **Locale switcher** component in header
✅ **Middleware integration** for seamless routing
✅ **Developer-friendly** translation workflow

The platform is now ready to serve a global audience with a localized experience! 🌍

import { getRequestConfig} from 'next-intl/server';
import { notFound } from 'next/navigation';

// Supported locales
export const locales = ['en', 'es', 'fr', 'pt'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

// Locale labels for display
export const localeLabels: Record<Locale, string> = {
  en: 'English',
  es: 'Español',
  fr: 'Français',
  pt: 'Português',
};

// Locale flags (emoji)
export const localeFlags: Record<Locale, string> = {
  en: '🇺🇸',
  es: '🇪🇸',
  fr: '🇫🇷',
  pt: '🇧🇷',
};

// Static imports to ensure messages are included in production build
// Dynamic imports with template literals get tree-shaken in standalone builds
import enMessages from './messages/en.json';
import esMessages from './messages/es.json';
import frMessages from './messages/fr.json';
import ptMessages from './messages/pt.json';

const messages = {
  en: enMessages,
  es: esMessages,
  fr: frMessages,
  pt: ptMessages,
} as const;

export default getRequestConfig(async (params) => {
  const locale = params.locale;

  // Validate that the incoming `locale` parameter is valid
  if (!locale || !locales.includes(locale as Locale)) {
    notFound();
  }

  return {
    locale: locale as string,
    messages: messages[locale as Locale],
    // Provide default message for missing keys instead of throwing error
    getMessageFallback({ namespace, key, error }) {
      const path = [namespace, key].filter((part) => part != null).join('.');
      console.warn(`Missing translation: ${path}`);
      return `${path}`;
    },
  };
});

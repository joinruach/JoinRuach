/**
 * Scripture Utilities
 *
 * Functions for Bible verse lookup, parsing, and formatting
 */

// Bible API response types
interface BibleApiVerse {
  book_id: string;
  book_name: string;
  chapter: number;
  verse: number;
  text: string;
}

interface BibleApiResponse {
  reference: string;
  verses: BibleApiVerse[];
  text: string;
  translation_id: string;
  translation_name: string;
  translation_note: string;
}

// Window globals for analytics
declare global {
  interface Window {
    plausible?: (event: string, options?: { props?: Record<string, string> }) => void;
    gtag?: (command: string, action: string, params?: Record<string, string>) => void;
  }
}

export interface ScriptureReference {
  book: string;
  chapter: number;
  verse?: number;
  endVerse?: number;
}

export interface ScriptureVerse {
  reference: string;
  text: string;
  book: string;
  chapter: number;
  verse: number;
}

export interface ScripturePassage {
  reference: string;
  verses: ScriptureVerse[];
  copyright?: string;
}

/**
 * Parse a scripture reference string
 * Examples: "John 3:16", "Romans 8:28-30", "Psalm 23"
 */
export function parseScriptureReference(ref: string): ScriptureReference | null {
  if (!ref || typeof ref !== "string") return null;

  // Remove extra whitespace
  const cleaned = ref.trim();

  // Pattern: Book Chapter:Verse or Book Chapter:Verse-EndVerse or Book Chapter
  const pattern = /^([1-3]?\s*[A-Za-z]+(?:\s+[A-Za-z]+)?)\s+(\d+)(?::(\d+)(?:-(\d+))?)?$/;
  const match = cleaned.match(pattern);

  if (!match) return null;

  const [, book, chapterStr, verseStr, endVerseStr] = match;

  return {
    book: book.trim(),
    chapter: parseInt(chapterStr, 10),
    verse: verseStr ? parseInt(verseStr, 10) : undefined,
    endVerse: endVerseStr ? parseInt(endVerseStr, 10) : undefined,
  };
}

/**
 * Format a scripture reference for display
 */
export function formatScriptureReference(ref: ScriptureReference): string {
  let result = `${ref.book} ${ref.chapter}`;

  if (ref.verse !== undefined) {
    result += `:${ref.verse}`;

    if (ref.endVerse !== undefined && ref.endVerse !== ref.verse) {
      result += `-${ref.endVerse}`;
    }
  }

  return result;
}

/**
 * Fetch scripture from Bible API (using bible-api.com - free, no auth required)
 */
export async function fetchScripture(
  reference: string
): Promise<ScripturePassage | null> {
  try {
    const parsed = parseScriptureReference(reference);
    if (!parsed) return null;

    // bible-api.com endpoint
    const encodedRef = encodeURIComponent(reference);
    const response = await fetch(`https://bible-api.com/${encodedRef}?translation=kjv`);

    if (!response.ok) return null;

    const data: BibleApiResponse = await response.json();

    // Parse verses from response
    const verses: ScriptureVerse[] = data.verses?.map((v) => ({
      reference: `${v.book_name} ${v.chapter}:${v.verse}`,
      text: v.text.trim(),
      book: v.book_name,
      chapter: v.chapter,
      verse: v.verse,
    })) || [];

    return {
      reference: data.reference || reference,
      verses,
      copyright: "King James Version (KJV) - Public Domain",
    };
  } catch (error) {
    console.error("Failed to fetch scripture:", error);
    return null;
  }
}

/**
 * Get scripture from cache or fetch from API
 */
const scriptureCache = new Map<string, ScripturePassage>();

export async function getScripture(
  reference: string,
  useCache: boolean = true
): Promise<ScripturePassage | null> {
  const cacheKey = reference.toLowerCase().trim();

  // Check cache
  if (useCache && scriptureCache.has(cacheKey)) {
    return scriptureCache.get(cacheKey) || null;
  }

  // Fetch from API
  const passage = await fetchScripture(reference);

  // Cache result
  if (passage && useCache) {
    scriptureCache.set(cacheKey, passage);
  }

  return passage;
}

/**
 * Clear scripture cache (for testing)
 */
export function clearScriptureCache(): void {
  scriptureCache.clear();
}

/**
 * Validate if a string looks like a scripture reference
 */
export function isScriptureReference(text: string): boolean {
  return parseScriptureReference(text) !== null;
}

/**
 * Extract scripture references from text
 * Example: "As it says in John 3:16 and Romans 8:28, we are loved."
 */
export function extractScriptureReferences(text: string): string[] {
  if (!text) return [];

  const references: string[] = [];

  // Pattern to match scripture references in text
  const pattern = /\b([1-3]?\s*[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(\d+)(?::(\d+)(?:-(\d+))?)?\b/g;

  let match;
  while ((match = pattern.exec(text)) !== null) {
    const ref = match[0];
    if (isScriptureReference(ref)) {
      references.push(ref);
    }
  }

  return references;
}

/**
 * Popular Bible books for autocomplete/suggestions
 */
export const BIBLE_BOOKS = [
  // Old Testament
  "Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy",
  "Joshua", "Judges", "Ruth", "1 Samuel", "2 Samuel",
  "1 Kings", "2 Kings", "1 Chronicles", "2 Chronicles", "Ezra",
  "Nehemiah", "Esther", "Job", "Psalms", "Proverbs",
  "Ecclesiastes", "Song of Solomon", "Isaiah", "Jeremiah", "Lamentations",
  "Ezekiel", "Daniel", "Hosea", "Joel", "Amos",
  "Obadiah", "Jonah", "Micah", "Nahum", "Habakkuk",
  "Zephaniah", "Haggai", "Zechariah", "Malachi",
  // New Testament
  "Matthew", "Mark", "Luke", "John", "Acts",
  "Romans", "1 Corinthians", "2 Corinthians", "Galatians", "Ephesians",
  "Philippians", "Colossians", "1 Thessalonians", "2 Thessalonians",
  "1 Timothy", "2 Timothy", "Titus", "Philemon", "Hebrews",
  "James", "1 Peter", "2 Peter", "1 John", "2 John",
  "3 John", "Jude", "Revelation",
];

/**
 * Get book suggestions based on partial input
 */
export function getBookSuggestions(partial: string): string[] {
  if (!partial) return BIBLE_BOOKS.slice(0, 10);

  const search = partial.toLowerCase();
  return BIBLE_BOOKS.filter(book =>
    book.toLowerCase().startsWith(search)
  ).slice(0, 10);
}

/**
 * Copy scripture to clipboard
 */
export async function copyScriptureToClipboard(
  passage: ScripturePassage
): Promise<boolean> {
  if (!passage || passage.verses.length === 0) return false;

  try {
    const text = passage.verses.map(v => `${v.text}`).join("\n");
    const citation = `\n\n— ${passage.reference} (${passage.copyright || "KJV"})`;
    const fullText = text + citation;

    await navigator.clipboard.writeText(fullText);
    return true;
  } catch (error) {
    console.error("Failed to copy scripture:", error);
    return false;
  }
}

/**
 * Share scripture via Web Share API
 */
export async function shareScripture(
  passage: ScripturePassage
): Promise<boolean> {
  if (!passage || passage.verses.length === 0) return false;

  if (!navigator.share) return false;

  try {
    const text = passage.verses.map(v => v.text).join("\n");
    const citation = `\n\n— ${passage.reference}`;

    await navigator.share({
      title: passage.reference,
      text: text + citation,
    });

    return true;
  } catch (error) {
    // User cancelled or error occurred
    return false;
  }
}

/**
 * Track scripture interaction with analytics
 */
export function trackScriptureEvent(
  action: "view" | "copy" | "share" | "lookup",
  reference: string
): void {
  // Plausible Analytics
  if (typeof window !== "undefined" && window.plausible) {
    window.plausible(`Scripture ${action}`, {
      props: { reference },
    });
  }

  // Google Analytics
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", `scripture_${action}`, {
      event_category: "scripture",
      event_label: reference,
    });
  }

  // Console log in development
  if (process.env.NODE_ENV === "development") {
    console.log(`[Scripture] ${action}:`, reference);
  }
}

/**
 * Format verse text for display (remove extra whitespace, newlines)
 */
export function formatVerseText(text: string): string {
  return text
    .replace(/\s+/g, " ")
    .replace(/\n+/g, " ")
    .trim();
}

/**
 * Get verse count in a passage
 */
export function getVerseCount(ref: ScriptureReference): number {
  if (ref.verse === undefined) {
    // Whole chapter, estimate 30 verses average
    return 30;
  }

  if (ref.endVerse === undefined) {
    return 1;
  }

  return ref.endVerse - ref.verse + 1;
}

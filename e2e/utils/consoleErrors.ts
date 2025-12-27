const KNOWN_CONSOLE_ERROR_PATTERNS = [
  /Failed to fetch/i,
  /Strapi request failed/i,
  /ResizeObserver loop limit exceeded/i,
  /Network request failed/i,
  /Failed to load resource/i,
  /The request was aborted/i,
  /NetworkError when attempting to fetch resource/i,
];

function normalizeError(error: string) {
  return error.replace(/\s+/g, ' ').trim();
}

export function filterConsoleErrors(errors: string[]) {
  const normalized = errors.map(normalizeError);
  const isKnown = (error: string) => KNOWN_CONSOLE_ERROR_PATTERNS.some((pattern) => pattern.test(error));
  const blocking = normalized.filter((error) => !isKnown(error));
  const ignored = normalized.filter((error) => isKnown(error));
  return { blocking, ignored };
}

const KNOWN_CONSOLE_ERROR_PATTERNS = [
  /Failed to fetch/i,
  /Strapi request failed/i,
  /ResizeObserver loop limit exceeded/i,
  /Network request failed/i,
  /Failed to load resource/i,
  /The request was aborted/i,
];

export function filterConsoleErrors(errors: string[]) {
  const isKnown = (error: string) => KNOWN_CONSOLE_ERROR_PATTERNS.some((pattern) => pattern.test(error));
  const blocking = errors.filter((error) => !isKnown(error));
  const ignored = errors.filter((error) => isKnown(error));
  return { blocking, ignored };
}

/**
 * URL utilities
 */

/**
 * Build URL with query parameters
 * @param base - Base URL
 * @param params - Query parameters
 * @returns Full URL with query string
 */
export function buildUrl(base: string, params: Record<string, string | number | boolean | undefined>): string {
  const url = new URL(base);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      url.searchParams.set(key, String(value));
    }
  });

  return url.toString();
}

/**
 * Parse query string into object
 * @param queryString - Query string (with or without leading '?')
 * @returns Object with query parameters
 */
export function parseQueryString(queryString: string): Record<string, string> {
  const params = new URLSearchParams(queryString.replace(/^\?/, ''));
  const result: Record<string, string> = {};

  params.forEach((value, key) => {
    result[key] = value;
  });

  return result;
}

/**
 * Get domain from URL
 * @param url - URL to parse
 * @returns Domain name
 */
export function getDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return '';
  }
}

/**
 * Check if URL is external
 * @param url - URL to check
 * @param currentDomain - Current domain (default: window.location.hostname)
 * @returns True if external URL
 */
export function isExternalUrl(url: string, currentDomain?: string): boolean {
  try {
    const urlObj = new URL(url);
    const domain = currentDomain || (typeof window !== 'undefined' ? window.location.hostname : '');
    return urlObj.hostname !== domain;
  } catch {
    return false; // Relative URL
  }
}

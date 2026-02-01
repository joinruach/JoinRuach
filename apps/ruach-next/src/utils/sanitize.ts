/**
 * HTML Sanitization Utility
 *
 * Provides functions to sanitize untrusted HTML content before rendering.
 * This prevents XSS attacks by removing potentially dangerous elements and attributes.
 */

/**
 * Allowed HTML tags for sanitization
 * Only includes safe, semantic tags that don't support scripts or event handlers
 */
const ALLOWED_TAGS = new Set([
  'p', 'br', 'span', 'strong', 'em', 'b', 'i', 'u',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'blockquote', 'pre', 'code',
  'ul', 'ol', 'li',
  'table', 'thead', 'tbody', 'tfoot', 'tr', 'td', 'th',
  'div', 'section', 'article', 'aside', 'header', 'footer', 'main',
  'a', 'img', 'video', 'audio', 'source', 'figure', 'figcaption',
  'hr', 'sub', 'sup', 'mark', 'small', 'del', 'ins',
]);

/**
 * Allowed attributes per tag
 * Only includes safe attributes that don't support script execution
 */
const ALLOWED_ATTRIBUTES: Record<string, Set<string>> = {
  'a': new Set(['href', 'title', 'target', 'rel']),
  'img': new Set(['src', 'alt', 'title', 'width', 'height', 'loading']),
  'video': new Set(['src', 'controls', 'width', 'height', 'poster', 'preload']),
  'audio': new Set(['src', 'controls', 'preload']),
  'source': new Set(['src', 'type']),
  '*': new Set(['id', 'class', 'data-test']), // Global safe attributes
};

/**
 * Dangerous URL protocols that could execute scripts
 */
const DANGEROUS_PROTOCOLS = ['javascript:', 'data:', 'vbscript:', 'file:'];

/**
 * Check if a URL uses a dangerous protocol
 */
function isDangerousUrl(url: string): boolean {
  const trimmed = url.trim().toLowerCase();
  return DANGEROUS_PROTOCOLS.some(protocol => trimmed.startsWith(protocol));
}

/**
 * Create a safe attribute value
 */
function createSafeAttributeValue(attr: string, value: string): string {
  if (attr === 'href' || attr === 'src' || attr === 'data') {
    if (isDangerousUrl(value)) {
      return '';
    }
  }
  // Escape quotes in attribute values
  return value.replace(/"/g, '&quot;');
}

/**
 * Sanitize HTML by parsing and reconstructing with only safe elements
 */
function sanitizeHtmlContent(html: string): string {
  if (!html || typeof html !== 'string') {
    return '';
  }

  // Create a temporary container to parse HTML
  const container = typeof document !== 'undefined' ? document.createElement('div') : null;

  if (!container) {
    // Fallback for SSR - use regex-based sanitization
    return sanitizeHtmlSSR(html);
  }

  container.innerHTML = html;

  /**
   * Recursively process and sanitize nodes
   */
  function processNode(node: Node): string {
    if (node.nodeType === Node.TEXT_NODE) {
      // Escape special characters in text content
      return (node.textContent || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as Element;
      const tagName = element.tagName.toLowerCase();

      // Skip disallowed tags
      if (!ALLOWED_TAGS.has(tagName)) {
        // Process children of disallowed tags
        let childrenHTML = '';
        for (const child of element.childNodes) {
          childrenHTML += processNode(child);
        }
        return childrenHTML;
      }

      // Build safe attributes
      let attributesHTML = '';
      const allowedAttrs = new Set([
        ...(ALLOWED_ATTRIBUTES[tagName] || []),
        ...(ALLOWED_ATTRIBUTES['*'] || []),
      ]);

      for (const attr of element.attributes) {
        if (allowedAttrs.has(attr.name) && !attr.name.toLowerCase().startsWith('on')) {
          const safeValue = createSafeAttributeValue(attr.name, attr.value);
          if (safeValue !== '') {
            attributesHTML += ` ${attr.name}="${safeValue}"`;
          }
        }
      }

      // Self-closing tags
      const selfClosingTags = new Set(['br', 'hr', 'img', 'input', 'source']);
      if (selfClosingTags.has(tagName)) {
        return `<${tagName}${attributesHTML} />`;
      }

      // Process children
      let childrenHTML = '';
      for (const child of element.childNodes) {
        childrenHTML += processNode(child);
      }

      return `<${tagName}${attributesHTML}>${childrenHTML}</${tagName}>`;
    }

    // Skip other node types (comments, etc.)
    return '';
  }

  return processNode(container);
}

/**
 * Server-side rendering fallback - basic regex-based sanitization
 */
function sanitizeHtmlSSR(html: string): string {
  let result = html;

  // Remove script tags and their content
  result = result.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // Remove event handlers
  result = result.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
  result = result.replace(/\s*on\w+\s*=\s*[^\s>]*/gi, '');

  // Remove style tags
  result = result.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

  // Remove dangerous protocols from href/src
  result = result.replace(
    /\b(href|src)\s*=\s*["']?(javascript|data|vbscript|file):/gi,
    '$1='
  );

  return result;
}

/**
 * Sanitize HTML content for safe rendering with dangerouslySetInnerHTML
 *
 * @param html - The HTML string to sanitize
 * @returns The sanitized HTML string
 *
 * @example
 * const sanitized = sanitizeHtml('<p>Hello <script>alert("xss")</script></p>');
 * // Returns: '<p>Hello </p>'
 */
export function sanitizeHtml(html: string): string {
  return sanitizeHtmlContent(html);
}

/**
 * Sanitize HTML and return in React's dangerouslySetInnerHTML format
 *
 * @param html - The HTML string to sanitize
 * @returns An object with __html property containing sanitized HTML
 *
 * @example
 * <div dangerouslySetInnerHTML={sanitizeForReact(content)} />
 */
export function sanitizeForReact(html: string): { __html: string } {
  return {
    __html: sanitizeHtml(html),
  };
}

/**
 * Check if HTML content appears to be safe (no scripts, dangerous protocols, etc.)
 * This is a quick check, not a guarantee of safety - always sanitize before rendering
 *
 * @param html - The HTML string to check
 * @returns true if the HTML appears safe, false otherwise
 */
export function isHtmlSafe(html: string): boolean {
  if (!html || typeof html !== 'string') {
    return true;
  }

  const lowerHtml = html.toLowerCase();

  // Check for dangerous patterns
  return !(
    lowerHtml.includes('<script') ||
    lowerHtml.includes('javascript:') ||
    lowerHtml.includes('onerror=') ||
    lowerHtml.includes('onload=') ||
    lowerHtml.includes('onclick=') ||
    lowerHtml.includes('onmouse') ||
    lowerHtml.includes('onkey') ||
    lowerHtml.includes('on' + 'error') ||
    /<[^>]*\bon\w+\s*=/i.test(html)
  );
}

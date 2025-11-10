import DOMPurify from 'isomorphic-dompurify';

export function sanitizeHtml(html: string, options?: {
  allowedTags?: string[];
  allowedAttributes?: Record<string, string[]>;
}): string {
  const config: any = {
    ALLOWED_TAGS: options?.allowedTags || ['p', 'br', 'strong', 'em', 'a'],
    ALLOWED_ATTR: options?.allowedAttributes || { a: ['href', 'target'] },
  };
  return String(DOMPurify.sanitize(html, config));
}

export function sanitizeScript(scriptHtml: string): string {
  const config: any = {
    ALLOWED_TAGS: ['script'],
    ALLOWED_ATTR: ['src', 'type', 'async', 'defer'],
  };
  return String(DOMPurify.sanitize(scriptHtml, config));
}

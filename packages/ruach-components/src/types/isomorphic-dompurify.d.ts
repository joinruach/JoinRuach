declare module 'isomorphic-dompurify' {
  interface Config {
    ALLOWED_TAGS?: string[];
    ALLOWED_ATTR?: string[];
    ALLOW_DATA_ATTR?: boolean;
    ALLOW_UNKNOWN_PROTOCOLS?: boolean;
    RETURN_DOM?: boolean;
    RETURN_DOM_FRAGMENT?: boolean;
    RETURN_TRUSTED_TYPE?: boolean;
    FORCE_BODY?: boolean;
    SANITIZE_DOM?: boolean;
    KEEP_CONTENT?: boolean;
    IN_PLACE?: boolean;
    USE_PROFILES?: { html?: boolean; svg?: boolean; svgFilters?: boolean; mathMl?: boolean };
    [key: string]: unknown;
  }

  const DOMPurify: {
    sanitize(dirty: string | Node, config?: Config): string;
  };

  export default DOMPurify;
}

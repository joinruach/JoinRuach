const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: `
      default-src 'self';
      img-src 'self' https://cdn.joinruach.org https://*.r2.cloudflarestorage.com https://img.youtube.com https://i.ytimg.com data:;
      media-src 'self' https://cdn.joinruach.org https://*.r2.cloudflarestorage.com data:;
      script-src 'self' 'unsafe-inline' https://plausible.io;
      style-src 'self' 'unsafe-inline';
      frame-src https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com https://www.tiktok.com;
      connect-src 'self'
        https://cdn.joinruach.org
        https://*.r2.cloudflarestorage.com
        https://api.convertkit.com
        https://plausible.io
        https://*.upstash.io
        https://apparent-caribou-35103.upstash.io
        https://givebutter.com
        https://*.givebutter.com;
    `
      .replace(/\s{2,}/g, " ")
      .trim(),
  },
];
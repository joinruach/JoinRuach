import { sanitizeScript } from '../../../lib/sanitize';

export default function EmbedScript({ html }: { html: string }) {
  const cleanHtml = sanitizeScript(html);
  return <div dangerouslySetInnerHTML={{ __html: cleanHtml }} />;
}

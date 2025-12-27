/**
 * Prose Component
 *
 * Simple markdown-like content renderer using Tailwind Typography.
 * For MVP, renders raw markdown with preserved formatting.
 * TODO: Replace with proper markdown parser (e.g., react-markdown) in production.
 */

interface ProseProps {
  content: string;
  className?: string;
}

export function Prose({ content, className = "" }: ProseProps) {
  // Simple markdown-to-HTML conversion for MVP
  // This handles basic formatting like headers, paragraphs, blockquotes, lists
  const htmlContent = content
    // Headers
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    // Blockquotes
    .replace(/^> \*(.+?)\*$/gm, '<blockquote><em>$1</em></blockquote>')
    .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Horizontal rule
    .replace(/^---$/gm, '<hr />')
    // Lists (basic support)
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    // Paragraphs (double line breaks)
    .split('\n\n')
    .map((block) => {
      if (
        block.startsWith('<h') ||
        block.startsWith('<blockquote') ||
        block.startsWith('<hr') ||
        block.startsWith('<li')
      ) {
        return block;
      }
      if (block.trim()) {
        return `<p>${block.trim()}</p>`;
      }
      return '';
    })
    .join('\n')
    // Wrap list items in ul
    .replace(/(<li>.*<\/li>\n?)+/g, (match) => `<ul>${match}</ul>`);

  return (
    <div
      className={`prose-neutral dark:prose-invert max-w-none ${className}`}
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
}

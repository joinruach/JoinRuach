import { ParsedSection, SectionMeta } from './types';

export function parseSections(
  content: string,
  sectionMetadata: Record<string, SectionMeta>
): ParsedSection[] {
  const lines = content.split('\n');
  const sections: ParsedSection[] = [];

  let current: Partial<ParsedSection> | null = null;

  const normalizeKey = (raw: string) =>
    raw
      .toLowerCase()
      .replace(/^\d+\s*/, '')
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, '-')
      .trim();

  lines.forEach((line, index) => {
    const match = line.match(/^##\s+(.+)/);

    if (match) {
      if (current) {
        current.endLine = index - 1;
        current.content = lines
          .slice(current.startLine! + 1, index)
          .join('\n')
          .trim();
        sections.push(current as ParsedSection);
      }

      const title = match[1].trim();
      const key = normalizeKey(title);
      const meta = sectionMetadata[key] ?? {
        mutability: 'contextual',
        confidence: 'suggestive',
      };

      current = {
        key,
        title,
        startLine: index,
        mutability: meta.mutability,
        confidence: meta.confidence,
      };
    }
  });

  if (current) {
    current.endLine = lines.length - 1;
    current.content = lines
      .slice(current.startLine! + 1)
      .join('\n')
      .trim();
    sections.push(current as ParsedSection);
  }

  return sections;
}

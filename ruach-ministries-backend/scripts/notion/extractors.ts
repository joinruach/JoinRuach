import type { NotionProperty } from './notionTypes';

function extractPlainText(blocks?: any[]): string {
  if (!Array.isArray(blocks)) return '';
  return blocks.map((entry) => entry?.plain_text ?? '').join('');
}

export function text(prop?: NotionProperty): string | undefined {
  if (!prop) return undefined;

  if (prop.type === 'title' || prop.type === 'rich_text') {
    return extractPlainText(prop[prop.type]).trim() || undefined;
  }

  if (prop.type === 'paragraph' || prop.type === 'text') {
    return extractPlainText(prop[prop.type]).trim() || undefined;
  }

  if (typeof prop?.plain_text === 'string' && prop.plain_text.length > 0) {
    return prop.plain_text;
  }

  return undefined;
}

export function select(prop?: NotionProperty): string | undefined {
  return prop?.select?.name ?? undefined;
}

export function multiSelect(prop?: NotionProperty): string[] | undefined {
  if (!prop?.multi_select) return undefined;
  return prop.multi_select.map((entry: any) => entry?.name).filter(Boolean);
}

export function number(prop?: NotionProperty): number | undefined {
  return typeof prop?.number === 'number' ? prop.number : undefined;
}

export function checkbox(prop?: NotionProperty): boolean | undefined {
  return typeof prop?.checkbox === 'boolean' ? prop.checkbox : undefined;
}

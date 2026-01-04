import { NotionPage } from './notionTypes';
import { fieldMap } from './fieldMap';

export function transformEntity(entity: keyof typeof fieldMap, page: NotionPage) {
  const map = fieldMap[entity];
  if (!map) {
    throw new Error(`No field map defined for entity "${entity}"`);
  }

  const output: Record<string, any> = {};
  if (entity === 'Course') {
    output.notionPageId = page.id;
  }

  for (const [field, extractor] of Object.entries(map)) {
    const value = extractor(page.properties);
    if (value !== undefined) {
      output[field] = value;
    }
  }

  return output;
}

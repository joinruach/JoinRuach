/**
 * Notion Canon Export
 * Exports canonical content from Notion database for audit
 */

import { Client } from '@notionhq/client';
import type { NotionNode, FormationPhase } from './types';
import * as fs from 'fs';
import * as path from 'path';

interface NotionDatabaseQueryResponse {
  results: any[];
  has_more: boolean;
  next_cursor: string | null;
}

/**
 * Initialize Notion client
 */
export function initNotionClient(apiKey: string): Client {
  return new Client({ auth: apiKey });
}

/**
 * Format database ID to UUID format with dashes
 * Notion URLs have IDs without dashes, but API expects UUID format
 * Example: "2d73628788f380a39159cc21034ff065" → "2d736287-88f3-80a3-9159-cc21034ff065"
 */
function formatDatabaseId(id: string): string {
  // Remove any existing dashes
  const clean = id.replace(/-/g, '');

  // Insert dashes in UUID format: 8-4-4-4-12
  if (clean.length === 32) {
    return `${clean.slice(0, 8)}-${clean.slice(8, 12)}-${clean.slice(12, 16)}-${clean.slice(16, 20)}-${clean.slice(20)}`;
  }

  // If already formatted or invalid length, return as-is
  return id;
}

/**
 * Fetch all pages from a Notion database
 */
export async function fetchNotionDatabase(
  client: Client,
  databaseId: string,
  apiKey?: string
): Promise<NotionNode[]> {
  const nodes: NotionNode[] = [];

  // Format database ID to UUID format
  const formattedId = formatDatabaseId(databaseId);

  // Get API key from client or parameter
  const authToken = apiKey || (client as any).auth;

  try {
    let hasMore = true;
    let startCursor: string | undefined;

    while (hasMore) {
      console.log(`Querying database ${formattedId}${startCursor ? ` (cursor: ${startCursor})` : ''}`);

      // Query database using fetch API directly
      const requestBody: any = {};
      if (startCursor) {
        requestBody.start_cursor = startCursor;
      }

      const apiResponse = await fetch(`https://api.notion.com/v1/databases/${formattedId}/query`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!apiResponse.ok) {
        const error = await apiResponse.text();
        throw new Error(`Notion API error (${apiResponse.status}): ${error}`);
      }

      const response = await apiResponse.json() as NotionDatabaseQueryResponse;

      for (const page of response.results) {
        const node = await parseNotionPage(client, page);
        if (node) {
          nodes.push(node);
        }
      }

      hasMore = response.has_more;
      startCursor = response.next_cursor ?? undefined;
    }

    console.log(`✅ Fetched ${nodes.length} nodes from Notion database`);
    return nodes;
  } catch (error) {
    console.error('❌ Error fetching Notion database:', error);
    throw error;
  }
}

/**
 * Parse a Notion page into a NotionNode
 */
async function parseNotionPage(client: Client, page: any): Promise<NotionNode | null> {
  try {
    const properties = page.properties;

    // Extract title
    const titleProp = properties.Title || properties.title || properties.Name || properties.name;
    const title = titleProp?.title?.[0]?.plain_text || 'Untitled';

    // Extract phase
    const phaseProp = properties.Phase || properties.phase || properties['Formation Phase'];
    let phase: FormationPhase | undefined;
    if (phaseProp?.select?.name) {
      phase = phaseProp.select.name.toLowerCase() as FormationPhase;
    }

    // Extract order
    const orderProp = properties.Order || properties.order;
    const order = orderProp?.number;

    // Extract axioms (multi-select or relation)
    const axiomsProp = properties.Axioms || properties.axioms || properties['Related Axioms'];
    let axioms: string[] = [];
    if (axiomsProp?.multi_select) {
      axioms = axiomsProp.multi_select.map((item: any) => item.name);
    } else if (axiomsProp?.relation) {
      axioms = axiomsProp.relation.map((item: any) => item.id);
    }

    // Fetch page content (blocks)
    const content = await fetchPageContent(client, page.id);

    return {
      id: page.id,
      title,
      phase,
      content,
      axioms,
      order,
      properties
    };
  } catch (error) {
    console.error(`Error parsing page ${page.id}:`, error);
    return null;
  }
}

/**
 * Fetch all content blocks from a Notion page
 */
async function fetchPageContent(client: Client, pageId: string): Promise<string> {
  try {
    const blocks: any[] = [];
    let hasMore = true;
    let startCursor: string | undefined;

    while (hasMore) {
      const response: any = await client.blocks.children.list({
        block_id: pageId,
        start_cursor: startCursor,
      });

      blocks.push(...response.results);
      hasMore = response.has_more;
      startCursor = response.next_cursor ?? undefined;
    }

    // Convert blocks to plain text
    const content = blocks.map(block => extractTextFromBlock(block)).join('\n\n');
    return content;
  } catch (error) {
    console.error(`Error fetching content for page ${pageId}:`, error);
    return '';
  }
}

/**
 * Extract plain text from a Notion block
 */
function extractTextFromBlock(block: any): string {
  const type = block.type;

  // Handle different block types
  switch (type) {
    case 'paragraph':
      return extractRichText(block.paragraph?.rich_text);
    case 'heading_1':
      return `# ${extractRichText(block.heading_1?.rich_text)}`;
    case 'heading_2':
      return `## ${extractRichText(block.heading_2?.rich_text)}`;
    case 'heading_3':
      return `### ${extractRichText(block.heading_3?.rich_text)}`;
    case 'bulleted_list_item':
      return `- ${extractRichText(block.bulleted_list_item?.rich_text)}`;
    case 'numbered_list_item':
      return `1. ${extractRichText(block.numbered_list_item?.rich_text)}`;
    case 'quote':
      return `> ${extractRichText(block.quote?.rich_text)}`;
    case 'code':
      return `\`\`\`\n${extractRichText(block.code?.rich_text)}\n\`\`\``;
    case 'callout':
      return extractRichText(block.callout?.rich_text);
    case 'toggle':
      return extractRichText(block.toggle?.rich_text);
    default:
      return '';
  }
}

/**
 * Extract plain text from Notion rich text array
 */
function extractRichText(richText: any[]): string {
  if (!richText || !Array.isArray(richText)) {
    return '';
  }
  return richText.map(text => text.plain_text || '').join('');
}

/**
 * Export nodes to JSON file
 */
export function exportToJSON(nodes: NotionNode[], outputPath: string): void {
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(outputPath, JSON.stringify(nodes, null, 2), 'utf-8');
  console.log(`✅ Exported ${nodes.length} nodes to ${outputPath}`);
}

/**
 * Main export function
 */
export async function exportNotionCanon(
  apiKey: string,
  databaseId: string,
  outputPath: string
): Promise<NotionNode[]> {
  console.log('🔄 Starting Notion canon export...');
  console.log(`Database ID: ${databaseId}`);
  console.log(`API Key: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 4)}`);

  const client = initNotionClient(apiKey);
  const nodes = await fetchNotionDatabase(client, databaseId, apiKey);

  exportToJSON(nodes, outputPath);

  console.log('✅ Notion export complete!');
  return nodes;
}

#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { renderMarkdown } from '@ruach/guidebook-renderer';

async function main() {
  const target = process.argv[2];
  if (!target) {
    console.error('Usage: render-node <path-to-node-json>');
    process.exit(1);
  }

  const filePath = resolve(process.cwd(), target);
  const data = await readFile(filePath, 'utf8');
  const node = JSON.parse(data);
  const markdown = renderMarkdown(node);
  process.stdout.write(markdown);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});

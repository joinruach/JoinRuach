import assert from 'node:assert/strict';

import { parseSections } from './parseSections';

const content = `
# Guidebook

## 1 Intro!
Hello world

## Second Section
Line one
Line two
`.trim();

const lines = content.split('\n');
const introHeadingLine = lines.findIndex((line) => line.startsWith('## 1 Intro!'));
const secondHeadingLine = lines.findIndex((line) => line.startsWith('## Second Section'));

const sections = parseSections(content, {
  intro: { mutability: 'fixed', confidence: 'certain' },
  'second-section': { mutability: 'contextual', confidence: 'suggestive' },
});

assert.equal(sections.length, 2);

assert.deepEqual(
  sections[0],
  {
    key: 'intro',
    title: '1 Intro!',
    startLine: introHeadingLine,
    endLine: secondHeadingLine - 1,
    content: 'Hello world',
    mutability: 'fixed',
    confidence: 'certain',
  },
  'First section should parse and normalize key + apply metadata.'
);

assert.deepEqual(
  sections[1],
  {
    key: 'second-section',
    title: 'Second Section',
    startLine: secondHeadingLine,
    endLine: lines.length - 1,
    content: 'Line one\nLine two',
    mutability: 'contextual',
    confidence: 'suggestive',
  },
  'Second section should parse remaining content.'
);

console.log('[guidebook-parser] parseSections tests passed.');

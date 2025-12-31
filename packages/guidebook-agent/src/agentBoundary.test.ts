import assert from 'node:assert';
import { buildGuidebookContext } from './buildGuidebookContext';

const sampleNode = {
  title: 'Immutable Focus',
  content: '## Scripture Anchors\nPsalm 23\n\n## Operational Protocol\nDo the next step',
  sectionMetadata: {
    'scripture-anchors': { mutability: 'immutable', confidence: 'authoritative' },
    'operational-protocol': { mutability: 'contextual', confidence: 'illustrative' }
  }
};

function run() {
  const context = buildGuidebookContext(sampleNode as any);
  assert(context.includes('IMMUTABLE SECTIONS'));
  assert(context.includes('CONTEXTUAL SECTIONS'));
  assert(context.includes('Rules:'));
  assert(context.includes('Immutable Authority'));
  assert(context.includes('Contextual / Adaptable'));
  console.log('Guidebook agent boundary test passed');
}

run();

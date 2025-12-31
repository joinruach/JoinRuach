import assert from 'node:assert/strict';
import { renderMarkdown } from './renderMarkdown';

const sampleNode = {
  title: 'Sample Node',
  nodeType: 'Formation',
  formationStage: 'Mid',
  formationScope: 'Individual',
  formationFocus: 'Align heart before obedience.',
  content: '## Scripture Anchors\n- Psalm 1:1\n\n## Operational Protocol\n- Example step',
  sectionMetadata: {
    'scripture-anchors': { mutability: 'immutable', confidence: 'authoritative' },
    'operational-protocol': { mutability: 'contextual', confidence: 'illustrative' }
  }
};

const output = renderMarkdown(sampleNode as any);

assert.ok(output.includes('Immutable Authority'));
assert.ok(output.includes('Contextual / Adaptable'));
assert.ok(output.includes('Psalm 1:1'));

console.log('[guidebook-renderer] renderMarkdown tests passed.');

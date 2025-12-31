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

test('renders identity header plus sections', () => {
  const output = renderMarkdown(sampleNode as any);
  expect(output).toContain('Immutable Authority');
  expect(output).toContain('Contextual / Adaptable');
  expect(output).toContain('Psalm 1:1');
});

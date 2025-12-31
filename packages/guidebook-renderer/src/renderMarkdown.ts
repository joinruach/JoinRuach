import { parseSections } from '@ruach/guidebook-parser';
import type { GuidebookNode } from './types';

export function renderMarkdown(node: GuidebookNode): string {
  const sections = parseSections(node.content, node.sectionMetadata ?? {});

  const header = `# ${node.title}

---

## 1. Node Identity

**Name:** ${node.title}  
**Type:** ${node.nodeType}  
**Stage:** ${node.formationStage}  
**Scope:** ${node.formationScope}

**Formation Focus:**  
${node.formationFocus}

---`;

  const body = sections
    .map(section => {
      const tag = section.mutability === 'immutable' ? '_Immutable Authority_' : '_Contextual / Adaptable_';
      return `## ${section.title}

${tag}

${section.content}`.trim();
    })
    .join('\n\n');

  return `${header}\n\n${body}`.trim();
}

import { parseSections } from '@ruach/guidebook-parser';
import type { GuidebookNode } from './types';

const IMMUTABLE_RULES = `Rules:
- Quote verbatim.
- Do NOT paraphrase.
- Do NOT summarize.
- Preserve Scripture references exactly.
- Treat contradictions as errors.`;

const CONTEXTUAL_RULES = `Rules:
- You may summarize or adapt.
- Always state adaptations are contextual.
- Anchor all guidance back to immutable truth.`;

const REFUSAL_TEMPLATE = `If a request asks you to alter, simplify, or reinterpret immutable sections, refuse:
I can’t rephrase or simplify that section because it is marked as immutable doctrine. I can explain its meaning or apply it to a situation, but the wording itself must remain intact.`;

function formatSectionList(sections: GuideSection[]): string {
  if (sections.length === 0) {
    return '  (none)';
  }
  return sections.map(s => `• ${s.title} (${s.confidence})`).join('\n');
}

interface GuideSection {
  title: string;
  confidence: string;
}

export function buildGuidebookContext(node: GuidebookNode): string {
  const sections = parseSections(node.content, node.sectionMetadata ?? {});
  const immutable = sections.filter(s => s.mutability === 'immutable').map(s => ({ title: s.title, confidence: s.confidence }));
  const contextual = sections.filter(s => s.mutability === 'contextual').map(s => ({ title: s.title, confidence: s.confidence }));

  return `You are reasoning about the guidebook node titled: "${node.title}"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
IMMUTABLE SECTIONS (NON-NEGOTIABLE)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
The following sections contain binding doctrine.

${IMMUTABLE_RULES}

${formatSectionList(immutable)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONTEXTUAL SECTIONS (ADAPTABLE)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
The following sections are illustrative examples.

${CONTEXTUAL_RULES}

${formatSectionList(contextual)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONTENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${node.content}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REFUSAL TEMPLATE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${REFUSAL_TEMPLATE}`;
}

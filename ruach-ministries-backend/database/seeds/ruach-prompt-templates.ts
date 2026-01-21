/**
 * Seed script for Ruach Prompt Templates
 * Run with: node -r ts-node/register database/seeds/ruach-prompt-templates.ts
 */

import type { Core } from '@strapi/strapi';
import { randomUUID } from 'crypto';

interface PromptTemplate {
  templateId: string;
  templateName: string;
  outputType: 'sermon' | 'study' | 'qa_answer' | 'doctrine_page';
  generationMode: 'scripture_library';
  systemPrompt: string;
  userPromptTemplate: string;
  citationRequirements: {
    minScripture: number;
    minLibrary: number;
    coverage: number;
  };
  responseFormat: any;
  maxTokens: number;
  temperature: number;
  isDefault: boolean;
}

const QA_ASSISTANT_TEMPLATE: PromptTemplate = {
  templateId: randomUUID(),
  templateName: 'Q&A Assistant - Scripture + Library',
  outputType: 'qa_answer',
  generationMode: 'scripture_library',
  systemPrompt: `You are a Ruach-aligned teaching assistant for Q&A responses.

AUTHORITY HIERARCHY:
1. Scripture (inerrant, final authority)
2. Approved theological works (library sources)
3. Synthesis (clearly labeled)

CITATION REQUIREMENTS:
- Minimum 2 scripture citations
- Minimum 1 library citation (when applicable)
- Coverage: 70% of sentences must have citations
- Format: [Scripture: Book Chapter:Verse] or [Source: Title, Author, Page]

GUARDRAILS (enforced):
{guardrail_list}

OUTPUT FORMAT:
{format_schema}

CRITICAL: Do NOT make claims unsupported by provided sources.`,
  userPromptTemplate: `USER QUERY: {query}

RETRIEVED CONTEXT (authoritative sources):
{formatted_citations}

TASK: Generate a {outputType} that:
1. Directly addresses the query
2. Cites all claims to provided sources
3. Prioritizes scripture over library sources
4. Labels synthesis clearly ("Based on these passages...")

Output as JSON following this schema:
{response_schema}`,
  citationRequirements: {
    minScripture: 2,
    minLibrary: 1,
    coverage: 0.7,
  },
  responseFormat: {
    question: 'string',
    directAnswer: {
      text: 'string',
      citations: [{ sourceId: 'string', locator: 'string' }],
    },
    explanation: {
      text: 'string',
      citations: [],
    },
    relatedQuestions: ['string'],
  },
  maxTokens: 2048,
  temperature: 0.7,
  isDefault: true,
};

const SERMON_OUTLINE_TEMPLATE: PromptTemplate = {
  templateId: randomUUID(),
  templateName: 'Sermon Outline - Scripture + Library',
  outputType: 'sermon',
  generationMode: 'scripture_library',
  systemPrompt: `You are a Ruach-aligned teaching assistant for sermon outlines.

AUTHORITY HIERARCHY:
1. Scripture (inerrant, final authority)
2. Approved theological works (library sources)
3. Synthesis (clearly labeled)

CITATION REQUIREMENTS:
- Minimum 5 scripture citations
- Minimum 2 library citations
- Coverage: 80% of content must have citations
- Format: [Scripture: Book Chapter:Verse] or [Source: Title, Author, Page]

GUARDRAILS (enforced):
{guardrail_list}

OUTPUT FORMAT:
{format_schema}

CRITICAL: Do NOT make claims unsupported by provided sources. Every point must be grounded in scripture.`,
  userPromptTemplate: `USER QUERY: {query}

RETRIEVED CONTEXT (authoritative sources):
{formatted_citations}

TASK: Generate a sermon outline that:
1. Is rooted in the main scripture text
2. Has 3 clear, applicable points
3. Cites all doctrinal claims to scripture
4. Includes practical application
5. Labels synthesis clearly ("This passage teaches...")

Output as JSON following this schema:
{response_schema}`,
  citationRequirements: {
    minScripture: 5,
    minLibrary: 2,
    coverage: 0.8,
  },
  responseFormat: {
    title: 'string',
    mainText: 'scripture reference',
    introduction: {
      text: 'string',
      citations: [],
    },
    points: [
      {
        heading: 'string',
        content: 'string',
        citations: [],
        application: 'string',
      },
    ],
    conclusion: {
      text: 'string',
      citations: [],
    },
  },
  maxTokens: 4096,
  temperature: 0.7,
  isDefault: true,
};

const DOCTRINE_PAGE_TEMPLATE: PromptTemplate = {
  templateId: randomUUID(),
  templateName: 'Doctrine Page - Scripture + Library',
  outputType: 'doctrine_page',
  generationMode: 'scripture_library',
  systemPrompt: `You are a Ruach-aligned teaching assistant for doctrinal content.

AUTHORITY HIERARCHY:
1. Scripture (inerrant, final authority)
2. Approved theological works (library sources)
3. Synthesis (clearly labeled)

CITATION REQUIREMENTS:
- Minimum 8 scripture citations
- Minimum 3 library citations
- Coverage: 90% of content must have citations
- Format: [Scripture: Book Chapter:Verse] or [Source: Title, Author, Page]

GUARDRAILS (enforced):
{guardrail_list}

OUTPUT FORMAT:
{format_schema}

CRITICAL: Doctrine pages require the HIGHEST citation standard. Every claim must be anchored in scripture with supporting theological sources.`,
  userPromptTemplate: `USER QUERY: {query}

RETRIEVED CONTEXT (authoritative sources):
{formatted_citations}

TASK: Generate a doctrinal reference page that:
1. Defines the doctrine clearly from scripture
2. Provides comprehensive scriptural foundation
3. Addresses common distortions
4. Cites approved theological works for support
5. Labels all synthesis ("Based on these passages...")

Output as JSON following this schema:
{response_schema}`,
  citationRequirements: {
    minScripture: 8,
    minLibrary: 3,
    coverage: 0.9,
  },
  responseFormat: {
    topic: 'string',
    definition: {
      text: 'string',
      citations: [],
    },
    scripturalFoundation: {
      text: 'string',
      keyCitations: [],
    },
    application: {
      text: 'string',
      citations: [],
    },
    commonDistortions: {
      text: 'string',
      citations: [],
    },
  },
  maxTokens: 6144,
  temperature: 0.6,
  isDefault: true,
};

const BIBLE_STUDY_TEMPLATE: PromptTemplate = {
  templateId: randomUUID(),
  templateName: 'Bible Study - Scripture + Library',
  outputType: 'study',
  generationMode: 'scripture_library',
  systemPrompt: `You are a Ruach-aligned teaching assistant for Bible studies.

AUTHORITY HIERARCHY:
1. Scripture (inerrant, final authority)
2. Approved theological works (library sources)
3. Synthesis (clearly labeled)

CITATION REQUIREMENTS:
- Minimum 6 scripture citations
- Minimum 2 library citations
- Coverage: 75% of content must have citations
- Format: [Scripture: Book Chapter:Verse] or [Source: Title, Author, Page]

GUARDRAILS (enforced):
{guardrail_list}

OUTPUT FORMAT:
{format_schema}

CRITICAL: Bible studies must be interactive and application-focused while maintaining citation integrity.`,
  userPromptTemplate: `USER QUERY: {query}

RETRIEVED CONTEXT (authoritative sources):
{formatted_citations}

TASK: Generate a Bible study that:
1. Focuses on a main passage
2. Has engaging discussion questions
3. Includes practical application
4. Cites all teaching to scripture
5. Labels synthesis ("These verses suggest...")

Output as JSON following this schema:
{response_schema}`,
  citationRequirements: {
    minScripture: 6,
    minLibrary: 2,
    coverage: 0.75,
  },
  responseFormat: {
    title: 'string',
    mainPassage: 'scripture reference',
    sessions: [
      {
        sessionNumber: 1,
        title: 'string',
        openingQuestion: 'string',
        teaching: {
          text: 'string',
          citations: [],
        },
        discussionQuestions: ['string'],
        application: 'string',
      },
    ],
  },
  maxTokens: 4096,
  temperature: 0.7,
  isDefault: true,
};

const TEMPLATES = [
  QA_ASSISTANT_TEMPLATE,
  SERMON_OUTLINE_TEMPLATE,
  DOCTRINE_PAGE_TEMPLATE,
  BIBLE_STUDY_TEMPLATE,
];

export async function seedPromptTemplates(strapi: Core.Strapi) {
  const entityService = strapi.entityService as any;

  strapi.log.info('🌱 Seeding Ruach Prompt Templates...');

  for (const template of TEMPLATES) {
    try {
      // Check if template already exists
      const existing = await entityService.findMany('api::ruach-prompt-template.ruach-prompt-template', {
        filters: {
          templateName: template.templateName,
        },
      });

      if (existing && existing.length > 0) {
        strapi.log.info(`  ⏭️  Skipping existing template: ${template.templateName}`);
        continue;
      }

      // Create template
      await entityService.create('api::ruach-prompt-template.ruach-prompt-template', {
        data: {
          ...template,
          publishedAt: new Date(),
        },
      });

      strapi.log.info(`  ✅ Created template: ${template.templateName}`);
    } catch (error) {
      strapi.log.error(`  ❌ Failed to create template: ${template.templateName}`, error);
    }
  }

  strapi.log.info('✨ Prompt template seeding complete!\n');
}

// Export for use in bootstrap
export default seedPromptTemplates;

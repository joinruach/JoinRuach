/**
 * Ruach Generation Service
 * Scripture-anchored content generation with mandatory citation tracking
 * Pattern: Retrieve → Ground → Generate → Verify
 */

import type { Core } from '@strapi/strapi';
import { hybridSearch, type SearchRequest, type ChunkResult } from './library';

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY || '';
const CLAUDE_MODEL = 'claude-sonnet-4-20250514';
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';

type OutputType = 'sermon' | 'study' | 'qa_answer' | 'doctrine_page';
type GenerationMode = 'scripture_library' | 'scripture_only' | 'teaching_voice';

export interface GenerateRequest {
  query: string;
  outputType: OutputType;
  mode: GenerationMode;
  templateId?: string;
  filters?: {
    categories?: string[];
    authorRestrictions?: string[];
  };
  retrievalLimit?: number;
  relevanceThreshold?: number;
  strictMode?: boolean;
}

export interface Citation {
  sourceId: string;
  locator: string;
  text: string;
  isScripture: boolean;
  usageType: 'foundation' | 'support' | 'illustration';
}

export interface QualityMetrics {
  citationCoverage: number;
  scriptureCitationCount: number;
  libraryCitationCount: number;
  guardrailScore: number;
  citationAccuracy: number;
  overallQuality: number;
}

export interface Warning {
  type: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
}

export interface GenerateResponse {
  nodeId: string;
  status: 'success' | 'partial' | 'failed';
  content: string;
  citations: Citation[];
  qualityMetrics: QualityMetrics;
  warnings: Warning[];
  errors: string[];
  metadata: {
    generationTimeMs: number;
    model: string;
    tokensUsed: number;
  };
}

interface RetrievedContext {
  chunks: ChunkResult[];
  scriptureChunks: ChunkResult[];
  libraryChunks: ChunkResult[];
}

interface GroundedContext {
  chunks: ChunkResult[];
  filteredCount: number;
  guardrailWarnings: Warning[];
}

interface ClaudeGeneration {
  content: string;
  citations: Citation[];
  tokensUsed: number;
}

export default ({ strapi }: { strapi: Core.Strapi }) => ({
  /**
   * Main orchestrator: Retrieve → Ground → Generate → Verify
   */
  async generateContent(request: GenerateRequest): Promise<GenerateResponse> {
    const startTime = Date.now();

    try {
      // Load template
      const template = await this.loadTemplate(request.outputType, request.templateId);

      // 1. RETRIEVE: Get relevant chunks
      const retrievedContext = await this.retrieveRelevantChunks(request);

      // 2. GROUND: Filter by authority and check guardrails
      const groundedContext = await this.groundChunks(
        retrievedContext,
        request.mode,
        template.guardrails
      );

      // 3. GENERATE: Call Claude with structured prompt
      const generation = await this.generateWithClaude(
        request,
        groundedContext.chunks,
        template
      );

      // 4. VERIFY: Validate citations and quality
      const verification = await this.verifyGeneration(
        generation,
        request,
        template
      );

      // 5. SAVE: Persist to database if quality passes
      let nodeId = '';
      if (verification.qualityMetrics.overallQuality >= 0.7 || !request.strictMode) {
        nodeId = await this.saveGeneratedNode(generation, verification, request);
      }

      const generationTimeMs = Date.now() - startTime;

      return {
        nodeId,
        status: verification.qualityMetrics.overallQuality >= 0.7 ? 'success' : 'partial',
        content: generation.content,
        citations: generation.citations,
        qualityMetrics: verification.qualityMetrics,
        warnings: [...groundedContext.guardrailWarnings, ...verification.warnings],
        errors: verification.errors,
        metadata: {
          generationTimeMs,
          model: CLAUDE_MODEL,
          tokensUsed: generation.tokensUsed,
        },
      };
    } catch (error) {
      strapi.log.error('Error generating content:', error);
      throw error;
    }
  },

  /**
   * Load prompt template by output type
   */
  async loadTemplate(outputType: OutputType, templateId?: string) {
    const entityService = strapi.entityService as any;

    let template;
    if (templateId) {
      // Load specific template
      template = await entityService.findMany('api::ruach-prompt-template.ruach-prompt-template', {
        filters: { templateId },
        populate: ['guardrails'],
      });
      template = template?.[0];
    } else {
      // Load default template for output type
      template = await entityService.findMany('api::ruach-prompt-template.ruach-prompt-template', {
        filters: {
          outputType,
          isDefault: true,
        },
        populate: ['guardrails'],
      });
      template = template?.[0];
    }

    if (!template) {
      throw new Error(`No template found for output type: ${outputType}`);
    }

    return template;
  },

  /**
   * Retrieve relevant chunks via hybrid search + scripture-specific retrieval
   */
  async retrieveRelevantChunks(request: GenerateRequest): Promise<RetrievedContext> {
    // Use existing hybridSearch for library content
    const searchRequest: SearchRequest = {
      query: request.query,
      filters: request.filters,
      limit: request.retrievalLimit || 20,
      threshold: request.relevanceThreshold || 0.7,
    };

    const libraryResults = await hybridSearch(strapi, searchRequest);

    // Scripture-specific retrieval (will be implemented in Phase 6)
    const scriptureChunks = await this.retrieveScriptureChunks(request.query);

    // Merge and rank by authority
    const mergedChunks = this.mergeAndRankChunks(
      libraryResults.results,
      scriptureChunks
    );

    return {
      chunks: mergedChunks,
      scriptureChunks,
      libraryChunks: libraryResults.results,
    };
  },

  /**
   * Retrieve scripture-specific chunks
   */
  async retrieveScriptureChunks(query: string): Promise<ChunkResult[]> {
    // Import scripture search functions from library service
    const { searchScripture, getScriptureByReference } = await import('./library');

    // Try exact reference match first (e.g., "Matthew 6:25-34")
    const referenceMatch = query.match(/([A-Za-z\s]+)\s+(\d+):(\d+)(?:-(\d+))?/);
    if (referenceMatch) {
      const exactMatches = await getScriptureByReference(strapi, query);
      if (exactMatches.length > 0) {
        return exactMatches;
      }
    }

    // Fall back to semantic search
    const results = await searchScripture(strapi, query, 10);
    return results;
  },

  /**
   * Merge library and scripture chunks, ranking by authority
   * Priority: Scripture > Ministry books > General theology books
   */
  mergeAndRankChunks(
    libraryChunks: ChunkResult[],
    scriptureChunks: ChunkResult[]
  ): ChunkResult[] {
    // Scripture chunks get highest priority (score boost)
    const rankedScripture = scriptureChunks.map(chunk => ({
      ...chunk,
      score: chunk.score * 1.5, // 50% score boost
    }));

    // Merge and sort by adjusted score
    const merged = [...rankedScripture, ...libraryChunks];
    return merged.sort((a, b) => b.score - a.score);
  },

  /**
   * Filter chunks by authority and check guardrails
   */
  async groundChunks(
    context: RetrievedContext,
    mode: GenerationMode,
    guardrails: any[]
  ): Promise<GroundedContext> {
    let filteredChunks = context.chunks;

    // Filter by mode
    if (mode === 'scripture_only') {
      filteredChunks = context.scriptureChunks;
    }

    // Check guardrails (will use ruach-guardrail-engine in next task)
    const guardrailWarnings: Warning[] = [];

    return {
      chunks: filteredChunks,
      filteredCount: context.chunks.length - filteredChunks.length,
      guardrailWarnings,
    };
  },

  /**
   * Generate content with Claude, enforcing citation format
   */
  async generateWithClaude(
    request: GenerateRequest,
    chunks: ChunkResult[],
    template: any
  ): Promise<ClaudeGeneration> {
    if (!CLAUDE_API_KEY) {
      throw new Error('CLAUDE_API_KEY not configured');
    }

    // Format chunks for prompt
    const formattedContext = this.formatChunksForPrompt(chunks);

    // Build prompts using template
    const systemPrompt = this.buildSystemPrompt(template, request.outputType);
    const userPrompt = this.buildUserPrompt(
      template,
      request.query,
      formattedContext,
      request.outputType
    );

    // Call Claude API
    const response = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: template.maxTokens || 4096,
        temperature: template.temperature || 0.7,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userPrompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Claude API error: ${response.status} ${errorText}`);
    }

    const result = (await response.json()) as {
      content?: Array<{ text?: string }>;
      usage?: { input_tokens: number; output_tokens: number };
    };

    const generatedText = result.content?.[0]?.text;
    if (!generatedText) {
      throw new Error('Unexpected Claude response');
    }

    // Parse citations from generated content
    const citations = this.parseCitations(generatedText, chunks);

    return {
      content: generatedText,
      citations,
      tokensUsed: (result.usage?.input_tokens || 0) + (result.usage?.output_tokens || 0),
    };
  },

  /**
   * Format chunks for Claude prompt
   */
  formatChunksForPrompt(chunks: ChunkResult[]): string {
    return chunks
      .map((chunk, index) => {
        const sourceType = chunk.citation.sourceTitle.includes('Bible') ? 'Scripture' : 'Library';
        return `[${index + 1}] ${sourceType}: ${chunk.citation.sourceTitle}
${chunk.citation.author ? `Author: ${chunk.citation.author}` : ''}
${chunk.citation.chapter ? `Chapter: ${chunk.citation.chapter}` : ''}
${chunk.citation.pageRange ? `Pages: ${chunk.citation.pageRange}` : ''}

${chunk.textContent}

---`;
      })
      .join('\n\n');
  },

  /**
   * Build system prompt from template
   */
  buildSystemPrompt(template: any, outputType: OutputType): string {
    const guardrailList = template.guardrails
      ?.map((g: any) => `- ${g.title}: ${g.description}`)
      .join('\n') || 'None';

    return template.systemPrompt
      .replace('{outputType}', outputType)
      .replace('{guardrail_list}', guardrailList)
      .replace('{format_schema}', JSON.stringify(template.responseFormat, null, 2));
  },

  /**
   * Build user prompt from template
   */
  buildUserPrompt(
    template: any,
    query: string,
    formattedContext: string,
    outputType: OutputType
  ): string {
    return template.userPromptTemplate
      .replace('{query}', query)
      .replace('{formatted_citations}', formattedContext)
      .replace('{outputType}', outputType)
      .replace('{response_schema}', JSON.stringify(template.responseFormat, null, 2));
  },

  /**
   * Parse citations from generated content
   * Format: [Scripture: Book Chapter:Verse] or [Source: Title, Author, Page]
   */
  parseCitations(content: string, chunks: ChunkResult[]): Citation[] {
    const citations: Citation[] = [];

    // Regex for scripture citations: [Scripture: Book Chapter:Verse]
    const scriptureRegex = /\[Scripture:\s*([^\]]+)\]/g;
    let match;

    while ((match = scriptureRegex.exec(content)) !== null) {
      citations.push({
        sourceId: '', // Will be resolved in verification
        locator: match[1],
        text: match[0],
        isScripture: true,
        usageType: 'foundation',
      });
    }

    // Regex for library citations: [Source: Title, Author, Page]
    const libraryRegex = /\[Source:\s*([^\]]+)\]/g;

    while ((match = libraryRegex.exec(content)) !== null) {
      citations.push({
        sourceId: '', // Will be resolved in verification
        locator: match[1],
        text: match[0],
        isScripture: false,
        usageType: 'support',
      });
    }

    return citations;
  },

  /**
   * Verify generation quality and citations
   */
  async verifyGeneration(
    generation: ClaudeGeneration,
    request: GenerateRequest,
    template: any
  ): Promise<{
    qualityMetrics: QualityMetrics;
    warnings: Warning[];
    errors: string[];
  }> {
    const warnings: Warning[] = [];
    const errors: string[] = [];

    // Calculate citation coverage
    const citationCoverage = await strapi
      .plugin('library')
      .service('ruach-citation-validator')
      .calculateCitationCoverage(generation.content, generation.citations);

    // Count scripture vs library citations
    const scriptureCitationCount = generation.citations.filter(c => c.isScripture).length;
    const libraryCitationCount = generation.citations.filter(c => !c.isScripture).length;

    // Check citation minimums from template
    const requirements = template.citationRequirements;
    if (scriptureCitationCount < (requirements.minScripture || 2)) {
      errors.push(
        `Insufficient scripture citations: ${scriptureCitationCount} < ${requirements.minScripture || 2}`
      );
    }

    if (libraryCitationCount < (requirements.minLibrary || 1)) {
      warnings.push({
        type: 'citation_minimum',
        message: `Low library citations: ${libraryCitationCount} < ${requirements.minLibrary || 1}`,
        severity: 'medium',
      });
    }

    // Check coverage threshold
    const coverageThreshold = requirements.coverage || 0.7;
    if (citationCoverage < coverageThreshold) {
      errors.push(
        `Citation coverage too low: ${citationCoverage.toFixed(2)} < ${coverageThreshold}`
      );
    }

    // Placeholder for citation accuracy (will be implemented in Phase 5)
    const citationAccuracy = 1.0;

    // Placeholder for guardrail score (will be implemented with guardrail engine)
    const guardrailScore = 1.0;

    // Calculate overall quality score
    const qualityMetrics: QualityMetrics = {
      citationCoverage,
      scriptureCitationCount,
      libraryCitationCount,
      guardrailScore,
      citationAccuracy,
      overallQuality: this.calculateQualityScore({
        citationCoverage,
        scriptureCitationCount,
        guardrailScore,
        citationAccuracy,
      }),
    };

    return {
      qualityMetrics,
      warnings,
      errors,
    };
  },

  /**
   * Calculate overall quality score
   */
  calculateQualityScore(metrics: {
    citationCoverage: number;
    scriptureCitationCount: number;
    guardrailScore: number;
    citationAccuracy: number;
  }): number {
    const weights = {
      citationCoverage: 0.35,
      scriptureRatio: 0.3,
      guardrailCompliance: 0.25,
      accuracy: 0.1,
    };

    const scores = {
      citationCoverage: metrics.citationCoverage,
      scriptureRatio: Math.min(metrics.scriptureCitationCount / 3, 1.0),
      guardrailCompliance: metrics.guardrailScore,
      accuracy: metrics.citationAccuracy,
    };

    return (
      weights.citationCoverage * scores.citationCoverage +
      weights.scriptureRatio * scores.scriptureRatio +
      weights.guardrailCompliance * scores.guardrailCompliance +
      weights.accuracy * scores.accuracy
    );
  },

  /**
   * Save generated node to database
   */
  async saveGeneratedNode(
    generation: ClaudeGeneration,
    verification: any,
    request: GenerateRequest
  ): Promise<string> {
    const entityService = strapi.entityService as any;
    const crypto = await import('crypto');
    const nodeId = crypto.randomUUID();

    const node = await entityService.create('api::library-generated-node.library-generated-node', {
      data: {
        nodeId,
        nodeType: this.mapOutputTypeToNodeType(request.outputType),
        title: this.extractTitle(generation.content, request.outputType),
        content: generation.content,
        generationMethod: 'ai_generated',
        aiModel: CLAUDE_MODEL,
        citationCount: generation.citations.length,
        citationCoverage: verification.qualityMetrics.citationCoverage,
        scriptureCitationCount: verification.qualityMetrics.scriptureCitationCount,
        libraryCitationCount: verification.qualityMetrics.libraryCitationCount,
        guardrailViolations: verification.errors,
        verificationLog: verification,
        sourceQuery: request.query,
        qualityScore: verification.qualityMetrics.overallQuality,
        reviewStatus: 'pending_review',
        publishedAt: null,
      },
    });

    // Save citations
    for (const citation of generation.citations) {
      await this.saveCitation(nodeId, citation);
    }

    return nodeId;
  },

  /**
   * Map output type to node type
   */
  mapOutputTypeToNodeType(outputType: OutputType): string {
    const mapping: Record<OutputType, string> = {
      qa_answer: 'answer',
      sermon: 'teaching',
      study: 'study_note',
      doctrine_page: 'teaching',
    };
    return mapping[outputType] || 'teaching';
  },

  /**
   * Extract title from generated content
   */
  extractTitle(content: string, outputType: OutputType): string {
    // Try to parse JSON response
    try {
      const parsed = JSON.parse(content);
      return parsed.title || parsed.topic || `Generated ${outputType}`;
    } catch {
      // Fallback: use first line or default
      const firstLine = content.split('\n')[0];
      return firstLine.substring(0, 100) || `Generated ${outputType}`;
    }
  },

  /**
   * Save citation to database
   */
  async saveCitation(nodeId: string, citation: Citation): Promise<void> {
    const entityService = strapi.entityService as any;
    const crypto = await import('crypto');

    await entityService.create('api::library-citation.library-citation', {
      data: {
        citationId: crypto.randomUUID(),
        citationType: 'reference',
        relevanceScore: 1.0,
        retrievalMethod: 'manual_selection',
        attributionText: citation.text,
        isScripture: citation.isScripture,
        usageType: citation.usageType,
        verificationStatus: 'pending',
        citationWeight: 1.0,
        citationMetadata: {
          locator: citation.locator,
        },
        generatedNode: nodeId,
      },
    });
  },
});

/**
 * Ruach Discernment Service
 * Analyzes external content for biblical alignment using Claude API
 * Generates concern scores and identifies theological issues
 */

import type { Core } from '@strapi/strapi';

interface AnalysisCategory {
  category:
    | 'theology'
    | 'ethics'
    | 'eschatology'
    | 'anthropology'
    | 'soteriology'
    | 'pneumatology'
    | 'ecclesiology'
    | 'cultural_trends';
  severity: 'low' | 'medium' | 'high';
  description: string;
}

interface TheologicalIssue {
  issueId: string;
  category: AnalysisCategory['category'];
  title: string;
  description: string;
  biblicalCounterposition: string;
  scriptureCites: string[];
  severity: 'low' | 'medium' | 'high';
  detectionMethod: 'keyword' | 'pattern' | 'semantic' | 'context';
}

interface DiscernmentResult {
  analysisId: string;
  sourceTitle: string;
  sourceUrl?: string;
  concernScore: number;
  categories: AnalysisCategory[];
  issues: TheologicalIssue[];
  biblicalResponse: string;
  scriptureReferences: {
    reference: string;
    passage: string;
    relevance: string;
  }[];
  trendPatterns?: {
    pattern: string;
    frequency: number;
    context: string;
  }[];
  confidenceLevel: number;
  analysisDate: Date;
  executiveSummary: string;
}

interface TrendReport {
  period: string;
  averageConcernScore: number;
  highestConcernCategory: string;
  trendDirection: 'increasing' | 'stable' | 'decreasing';
  keyThemes: string[];
  analysisSummary: string;
}

export default ({ strapi }: { strapi: Core.Strapi }) => ({
  /**
   * Analyze external content for biblical alignment
   */
  async analyzeContent(
    sourceTitle: string,
    sourceUrl: string | undefined,
    sourceContent: string,
    useClaudeAPI: boolean = true
  ): Promise<DiscernmentResult> {
    const analysisId = this.generateAnalysisId();
    let result: DiscernmentResult;

    if (useClaudeAPI) {
      result = await this.analyzeWithClaude(analysisId, sourceTitle, sourceUrl, sourceContent);
    } else {
      result = await this.analyzeWithPatterns(analysisId, sourceTitle, sourceUrl, sourceContent);
    }

    // Store analysis in database
    await this.storeAnalysis(result);

    // Track trend patterns
    await this.updateTrendPatterns(result);

    return result;
  },

  /**
   * Analyze content using Claude API for deep semantic understanding
   */
  async analyzeWithClaude(
    analysisId: string,
    sourceTitle: string,
    sourceUrl: string | undefined,
    sourceContent: string
  ): Promise<DiscernmentResult> {
    const apiKey = process.env.CLAUDE_API_KEY;

    if (!apiKey) {
      strapi.log.warn('Claude API key not configured, falling back to pattern analysis');
      return this.analyzeWithPatterns(analysisId, sourceTitle, sourceUrl, sourceContent);
    }

    try {
      const prompt = this.buildAnalysisPrompt(sourceTitle, sourceContent);

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 2000,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`Claude API error: ${response.statusText}`);
      }

      const data = (await response.json()) as any;
      const analysisText = data.content?.[0]?.text;

      if (!analysisText) {
        throw new Error('No analysis response from Claude');
      }

      // Parse Claude's response
      return this.parseClaudeAnalysis(analysisId, sourceTitle, sourceUrl, analysisText);
    } catch (error) {
      strapi.log.error('Claude API analysis failed:', error);
      // Fall back to pattern-based analysis
      return this.analyzeWithPatterns(analysisId, sourceTitle, sourceUrl, sourceContent);
    }
  },

  /**
   * Build structured prompt for Claude analysis
   */
  buildAnalysisPrompt(sourceTitle: string, sourceContent: string): string {
    return `You are a biblical discernment expert analyzing content for theological alignment with evangelical Christian doctrine.

Analyze the following content and provide a detailed discernment analysis:

TITLE: ${sourceTitle}

CONTENT:
${sourceContent.substring(0, 3000)}

Please provide your analysis in JSON format with the following structure:
{
  "concernScore": <number 0-1>,
  "confidenceLevel": <number 0-1>,
  "executiveSummary": "<brief summary>",
  "categories": [
    {
      "category": "<theology|ethics|eschatology|anthropology|soteriology|pneumatology|ecclesiology|cultural_trends>",
      "severity": "<low|medium|high>",
      "description": "<description>"
    }
  ],
  "issues": [
    {
      "title": "<issue title>",
      "category": "<category>",
      "description": "<detailed description>",
      "biblicalCounterposition": "<biblical position>",
      "scriptureCites": ["<reference>"],
      "severity": "<low|medium|high>"
    }
  ],
  "scriptureReferences": [
    {
      "reference": "<book chapter:verse>",
      "passage": "<quoted text>",
      "relevance": "<how it relates>"
    }
  ],
  "biblicalResponse": "<comprehensive biblical response>"
}

Focus on:
1. Doctrinal alignment with evangelical/reformed theology
2. Ethical implications from a Christian worldview
3. Eschatological assumptions and claims
4. Anthropological claims about human nature
5. Soteriology (doctrine of salvation)
6. Pneumatology (doctrine of the Holy Spirit)
7. Ecclesiology (doctrine of the church)
8. Cultural trend analysis

Be fair but discerning. Distinguish between secondary issues and primary doctrinal concerns.`;
  },

  /**
   * Parse Claude's JSON analysis response
   */
  parseClaudeAnalysis(
    analysisId: string,
    sourceTitle: string,
    sourceUrl: string | undefined,
    analysisText: string
  ): DiscernmentResult {
    try {
      // Extract JSON from response (Claude sometimes adds text before/after)
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in Claude response');
      }

      const analysis = JSON.parse(jsonMatch[0]);

      return {
        analysisId,
        sourceTitle,
        sourceUrl,
        concernScore: Math.max(0, Math.min(1, analysis.concernScore || 0.5)),
        confidenceLevel: Math.max(0, Math.min(1, analysis.confidenceLevel || 0.8)),
        categories: (analysis.categories || []).map((cat: any) => ({
          category: cat.category,
          severity: cat.severity,
          description: cat.description,
        })),
        issues: (analysis.issues || []).map((issue: any) => ({
          issueId: this.generateIssueId(),
          category: issue.category,
          title: issue.title,
          description: issue.description,
          biblicalCounterposition: issue.biblicalCounterposition,
          scriptureCites: issue.scriptureCites || [],
          severity: issue.severity || 'medium',
          detectionMethod: 'semantic' as const,
        })),
        scriptureReferences: (analysis.scriptureReferences || []).map((ref: any) => ({
          reference: ref.reference,
          passage: ref.passage,
          relevance: ref.relevance,
        })),
        biblicalResponse: analysis.biblicalResponse || '',
        trendPatterns: [],
        executiveSummary: analysis.executiveSummary || '',
        analysisDate: new Date(),
      };
    } catch (error) {
      strapi.log.error('Error parsing Claude analysis:', error);
      throw error;
    }
  },

  /**
   * Fallback pattern-based analysis when Claude API unavailable
   */
  async analyzeWithPatterns(
    analysisId: string,
    sourceTitle: string,
    sourceUrl: string | undefined,
    sourceContent: string
  ): Promise<DiscernmentResult> {
    const issues: TheologicalIssue[] = [];
    const categories: AnalysisCategory[] = [];
    let concernScore = 0;

    // Check for concerning patterns
    const patterns = this.getTheologicalPatterns();

    for (const [key, pattern] of Object.entries(patterns)) {
      const matches = this.findPatternMatches(sourceContent, pattern);

      if (matches.length > 0) {
        const issue: TheologicalIssue = {
          issueId: this.generateIssueId(),
          category: pattern.category,
          title: pattern.title,
          description: pattern.description,
          biblicalCounterposition: pattern.biblicalCounterposition,
          scriptureCites: pattern.scriptureCites,
          severity: pattern.severity,
          detectionMethod: 'pattern',
        };

        issues.push(issue);
        concernScore += pattern.weight;

        // Add category if not already present
        if (!categories.find(c => c.category === pattern.category)) {
          categories.push({
            category: pattern.category,
            severity: pattern.severity,
            description: pattern.description,
          });
        }
      }
    }

    // Normalize concern score
    concernScore = Math.min(1, concernScore * 0.2);

    return {
      analysisId,
      sourceTitle,
      sourceUrl,
      concernScore,
      confidenceLevel: 0.6,
      categories,
      issues,
      biblicalResponse: this.generateBiblicalResponse(issues),
      scriptureReferences: this.compileScriptureReferences(issues),
      trendPatterns: [],
      executiveSummary: `Pattern-based analysis identified ${issues.length} potential concern(s) with concern score ${(concernScore * 100).toFixed(1)}%.`,
      analysisDate: new Date(),
    };
  },

  /**
   * Define theological patterns to detect
   */
  getTheologicalPatterns(): Record<
    string,
    {
      category: AnalysisCategory['category'];
      title: string;
      description: string;
      biblicalCounterposition: string;
      scriptureCites: string[];
      severity: 'low' | 'medium' | 'high';
      weight: number;
      patterns: RegExp[];
    }
  > {
    return {
      universalReconciliation: {
        category: 'soteriology',
        title: 'Universal Reconciliation Claims',
        description: 'Suggests all will be saved regardless of faith in Christ',
        biblicalCounterposition: 'Scripture clearly teaches the reality of eternal separation from God',
        scriptureCites: ['Matthew 25:46', 'Revelation 20:14-15', 'John 3:36'],
        severity: 'high',
        weight: 3,
        patterns: [
          /universal\s+reconciliation/gi,
          /all\s+will\s+be\s+saved/gi,
          /everyone\s+eventually\s+reconciled/gi,
        ],
      },
      christologyDenial: {
        category: 'theology',
        title: 'Denial of Christ\'s Deity',
        description: 'Denies the eternal deity of Jesus Christ',
        biblicalCounterposition: 'Jesus is God the Son, eternally existent and worthy of worship',
        scriptureCites: ['John 1:1', 'Colossians 1:15-17', 'Hebrews 1:3'],
        severity: 'high',
        weight: 3,
        patterns: [
          /Jesus\s+was\s+just\s+a\s+good\s+teacher/gi,
          /Christ\s+was\s+merely\s+human/gi,
          /deny.*?Christ.*?deity/gi,
        ],
      },
      salvationWorks: {
        category: 'soteriology',
        title: 'Works-Based Salvation',
        description: 'Suggests salvation depends on human works rather than grace',
        biblicalCounterposition: 'Salvation is by grace through faith, not by works',
        scriptureCites: ['Ephesians 2:8-9', 'Romans 3:28', 'Titus 3:5'],
        severity: 'high',
        weight: 2,
        patterns: [
          /earn.*?salvation/gi,
          /deserve.*?eternal\s+life/gi,
          /works\s+determine\s+salvation/gi,
        ],
      },
      spiritismOccult: {
        category: 'pneumatology',
        title: 'Spiritism or Occult Promotion',
        description: 'Promotes communication with spirits or occult practices',
        biblicalCounterposition: 'God forbids divination and communication through mediums',
        scriptureCites: ['Deuteronomy 18:10-12', 'Leviticus 19:31', '1 Chronicles 10:13-14'],
        severity: 'high',
        weight: 3,
        patterns: [
          /spiritualism/gi,
          /channeling|medium|séance/gi,
          /contact.*?deceased/gi,
        ],
      },
      moralisticGodcrafting: {
        category: 'theology',
        title: 'Moralistic Therapeutic Deism',
        description: 'God exists to make you happy and healthy; faith is self-help',
        biblicalCounterposition: 'God is sovereign and calls believers to sacrifice and holiness',
        scriptureCites: ['Matthew 16:24-26', 'Romans 12:1-2', '1 Peter 1:13-16'],
        severity: 'medium',
        weight: 2,
        patterns: [
          /God\s+wants\s+you\s+to\s+be\s+happy/gi,
          /prosperity\s+gospel/gi,
          /faith\s+for\s+wealth/gi,
        ],
      },
      biblicalInfallibility: {
        category: 'theology',
        title: 'Denial of Scripture Authority',
        description: 'Denies the authority or reliability of Scripture',
        biblicalCounterposition: 'Scripture is God\'s authoritative, inerrant Word',
        scriptureCites: ['2 Timothy 3:16-17', '2 Peter 1:20-21', 'Matthew 5:17-18'],
        severity: 'high',
        weight: 2,
        patterns: [
          /Bible\s+is\s+just\s+a\s+book/gi,
          /Scripture\s+is\s+outdated/gi,
          /contradictions\s+in\s+the\s+Bible/gi,
        ],
      },
      genderConfusion: {
        category: 'anthropology',
        title: 'Gender Identity Confusion',
        description: 'Promotes rejection of biblical sexual differentiation',
        biblicalCounterposition: 'God created humanity male and female as image-bearers',
        scriptureCites: ['Genesis 1:27', 'Genesis 5:2', '1 Corinthians 11:3'],
        severity: 'medium',
        weight: 1,
        patterns: [
          /gender\s+is\s+a\s+spectrum/gi,
          /biological\s+sex\s+doesn.*?t\s+matter/gi,
        ],
      },
    };
  },

  /**
   * Find pattern matches in content
   */
  findPatternMatches(content: string, pattern: any): string[] {
    const matches: string[] = [];

    for (const regex of pattern.patterns) {
      const found = content.match(regex);
      if (found) {
        matches.push(...found);
      }
    }

    return matches;
  },

  /**
   * Generate biblical response to identified issues
   */
  generateBiblicalResponse(issues: TheologicalIssue[]): string {
    if (issues.length === 0) {
      return 'This content appears to align well with biblical doctrine. No significant theological concerns were identified.';
    }

    const lines: string[] = [
      'Biblical Response to Identified Issues:\n',
    ];

    for (const issue of issues) {
      lines.push(`${issue.title}:`);
      lines.push(`Biblical Position: ${issue.biblicalCounterposition}`);

      if (issue.scriptureCites.length > 0) {
        lines.push(`Scripture References: ${issue.scriptureCites.join(', ')}`);
      }

      lines.push('');
    }

    return lines.join('\n');
  },

  /**
   * Compile scripture references
   */
  compileScriptureReferences(
    issues: TheologicalIssue[]
  ): DiscernmentResult['scriptureReferences'] {
    const references: DiscernmentResult['scriptureReferences'] = [];
    const citedRefs = new Set<string>();

    for (const issue of issues) {
      for (const cite of issue.scriptureCites) {
        if (!citedRefs.has(cite)) {
          citedRefs.add(cite);
          references.push({
            reference: cite,
            passage: `See ${cite} for biblical perspective on ${issue.category}`,
            relevance: issue.biblicalCounterposition,
          });
        }
      }
    }

    return references;
  },

  /**
   * Store analysis in database
   */
  async storeAnalysis(result: DiscernmentResult): Promise<void> {
    try {
      const entityService = strapi.entityService as any;

      await entityService.create('api::discernment-analysis.discernment-analysis', {
        data: {
          analysisId: result.analysisId,
          sourceTitle: result.sourceTitle,
          sourceUrl: result.sourceUrl,
          sourceContent: result.executiveSummary,
          analysisDate: result.analysisDate,
          concernScore: result.concernScore,
          categories: result.categories,
          issues: result.issues,
          biblicalResponse: result.biblicalResponse,
          scriptureReferences: result.scriptureReferences,
          status: 'analyzed',
          trendPatterns: result.trendPatterns,
          confidenceLevel: result.confidenceLevel,
          publishedAt: null,
        },
      });

      strapi.log.info(`Stored analysis ${result.analysisId}`);
    } catch (error) {
      strapi.log.error('Error storing analysis:', error);
      throw error;
    }
  },

  /**
   * Update trend patterns based on analysis
   */
  async updateTrendPatterns(result: DiscernmentResult): Promise<void> {
    try {
      const categories = result.categories.map(c => c.category);
      const trendPatterns = {
        categories,
        topIssue: result.issues[0]?.title,
        avgConcern: result.concernScore,
        timestamp: result.analysisDate,
      };

      // Pattern tracking would be stored for trend reporting
      strapi.log.info('Updated trend patterns', trendPatterns);
    } catch (error) {
      strapi.log.warn('Error updating trend patterns:', error);
    }
  },

  /**
   * Generate trend report across multiple analyses
   */
  async generateTrendReport(startDate: Date, endDate: Date): Promise<TrendReport> {
    try {
      const entityService = strapi.entityService as any;

      const analyses = await entityService.findMany('api::discernment-analysis.discernment-analysis', {
        filters: {
          analysisDate: {
            $gte: startDate,
            $lte: endDate,
          },
        },
        sort: { analysisDate: 'asc' },
      });

      if (analyses.length === 0) {
        return {
          period: `${startDate.toISOString()} to ${endDate.toISOString()}`,
          averageConcernScore: 0,
          highestConcernCategory: 'N/A',
          trendDirection: 'stable',
          keyThemes: [],
          analysisSummary: 'No analyses found for this period.',
        };
      }

      // Calculate metrics
      const avgConcern =
        analyses.reduce((sum: number, a: any) => sum + (a.concernScore || 0), 0) /
        analyses.length;

      // Find most common category
      const categoryCount: Record<string, number> = {};
      for (const analysis of analyses) {
        for (const category of analysis.categories || []) {
          categoryCount[category.category] =
            (categoryCount[category.category] || 0) + 1;
        }
      }

      const highestCategory = Object.entries(categoryCount).sort(
        ([, a], [, b]) => b - a
      )[0]?.[0] || 'theology';

      // Detect trend direction
      const firstHalf = analyses.slice(0, Math.floor(analyses.length / 2));
      const secondHalf = analyses.slice(Math.floor(analyses.length / 2));

      const firstAvg =
        firstHalf.reduce((sum: number, a: any) => sum + (a.concernScore || 0), 0) /
        firstHalf.length;
      const secondAvg =
        secondHalf.reduce((sum: number, a: any) => sum + (a.concernScore || 0), 0) /
        secondHalf.length;

      let trendDirection: TrendReport['trendDirection'] = 'stable';
      if (secondAvg > firstAvg * 1.1) {
        trendDirection = 'increasing';
      } else if (secondAvg < firstAvg * 0.9) {
        trendDirection = 'decreasing';
      }

      return {
        period: `${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`,
        averageConcernScore: avgConcern,
        highestConcernCategory: highestCategory,
        trendDirection,
        keyThemes: Object.keys(categoryCount)
          .sort((a, b) => (categoryCount[b] || 0) - (categoryCount[a] || 0))
          .slice(0, 5),
        analysisSummary: `Analyzed ${analyses.length} items over the period. Average concern score: ${(avgConcern * 100).toFixed(1)}%. Highest concern area: ${highestCategory}. Trend: ${trendDirection}.`,
      };
    } catch (error) {
      strapi.log.error('Error generating trend report:', error);
      throw error;
    }
  },

  /**
   * Generate unique analysis ID
   */
  generateAnalysisId(): string {
    const crypto = require('crypto');
    return `analysis_${crypto.randomUUID().substring(0, 12)}`;
  },

  /**
   * Generate unique issue ID
   */
  generateIssueId(): string {
    const crypto = require('crypto');
    return `issue_${crypto.randomUUID().substring(0, 8)}`;
  },

  /**
   * Retrieve analysis by ID
   */
  async getAnalysisById(analysisId: string): Promise<DiscernmentResult | null> {
    try {
      const entityService = strapi.entityService as any;

      const analyses = await entityService.findMany('api::discernment-analysis.discernment-analysis', {
        filters: { analysisId },
      });

      if (!analyses || analyses.length === 0) {
        return null;
      }

      const analysis = analyses[0];
      return {
        analysisId: analysis.analysisId,
        sourceTitle: analysis.sourceTitle,
        sourceUrl: analysis.sourceUrl,
        concernScore: analysis.concernScore,
        confidenceLevel: analysis.confidenceLevel,
        categories: analysis.categories,
        issues: analysis.issues,
        biblicalResponse: analysis.biblicalResponse,
        scriptureReferences: analysis.scriptureReferences,
        trendPatterns: analysis.trendPatterns,
        executiveSummary: analysis.sourceContent,
        analysisDate: new Date(analysis.analysisDate),
      };
    } catch (error) {
      strapi.log.error('Error retrieving analysis:', error);
      return null;
    }
  },

  /**
   * List analyses with filtering
   */
  async listAnalyses(
    filters?: {
      status?: string;
      categoryFilter?: string;
      minConcern?: number;
      maxConcern?: number;
      startDate?: Date;
      endDate?: Date;
    },
    sort?: string,
    pagination?: { page: number; pageSize: number }
  ): Promise<{ data: any[]; total: number }> {
    try {
      const entityService = strapi.entityService as any;
      const queryFilters: any = {};

      if (filters?.status) {
        queryFilters.status = filters.status;
      }

      if (filters?.minConcern !== undefined || filters?.maxConcern !== undefined) {
        queryFilters.concernScore = {};
        if (filters.minConcern !== undefined) {
          queryFilters.concernScore.$gte = filters.minConcern;
        }
        if (filters.maxConcern !== undefined) {
          queryFilters.concernScore.$lte = filters.maxConcern;
        }
      }

      if (filters?.startDate || filters?.endDate) {
        queryFilters.analysisDate = {};
        if (filters.startDate) {
          queryFilters.analysisDate.$gte = filters.startDate;
        }
        if (filters.endDate) {
          queryFilters.analysisDate.$lte = filters.endDate;
        }
      }

      const result = await entityService.findMany('api::discernment-analysis.discernment-analysis', {
        filters: queryFilters,
        sort: sort ? { [sort.split(':')[0]]: sort.split(':')[1] || 'asc' } : { analysisDate: 'desc' },
        pagination: pagination || { page: 1, pageSize: 25 },
      });

      return {
        data: result || [],
        total: (result?.length || 0),
      };
    } catch (error) {
      strapi.log.error('Error listing analyses:', error);
      return { data: [], total: 0 };
    }
  },
});

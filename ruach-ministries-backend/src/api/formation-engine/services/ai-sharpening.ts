/**
 * AI Sharpening Service
 * Uses Claude API to analyze reflections and sharpen insights for the Iron Chamber
 */

import type { Strapi } from '@strapi/strapi';

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY || '';
const CLAUDE_MODEL = 'claude-sonnet-4-20250514';
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';

type ReadinessLevel = 'emerging' | 'forming' | 'maturing' | 'established';
type RoutingDecision = 'publish' | 'journal' | 'thread' | 'review';

interface ReflectionAnalysis {
  depthScore: number;
  readinessLevel: ReadinessLevel;
  sharpenedInsight: string;
  routing: RoutingDecision;
  routingReason: string;
  teachingMoment: string | null;
  detectedThemes: string[];
  indicators: {
    usesScripture: boolean;
    showsNuance: boolean;
    personalIntegration: boolean;
    theologicalDepth: boolean;
    practicalApplication: boolean;
  };
}

export default ({ strapi }: { strapi: Strapi }) => ({
  /**
   * Analyze a reflection and sharpen insight using Claude
   */
  async analyzeReflection(
    reflectionId: string,
    reflectionContent: string,
    userPhase: string,
    checkpointPrompt: string
  ): Promise<ReflectionAnalysis> {
    try {
      if (!CLAUDE_API_KEY) {
        throw new Error('CLAUDE_API_KEY not configured');
      }

      const systemPrompt = this.buildSystemPrompt(userPhase);
      const userPrompt = this.buildAnalysisPrompt(reflectionContent, checkpointPrompt);

      const response = await fetch(CLAUDE_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': CLAUDE_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: CLAUDE_MODEL,
          max_tokens: 2000,
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

      const result = await response.json();
      const analysisText = result.content[0].text;

      // Parse structured response
      const analysis = this.parseAnalysisResponse(analysisText);

      // Save analysis to database
      await this.saveAnalysis(reflectionId, analysis);

      return analysis;
    } catch (error) {
      strapi.log.error('Error analyzing reflection:', error);
      throw error;
    }
  },

  /**
   * Build formation-aware system prompt
   */
  buildSystemPrompt(userPhase: string): string {
    const basePrompt = `You are an AI assistant for the Ruach Formation Platform, analyzing spiritual reflections submitted by users at formation checkpoints.

Your role is to:
1. **Sharpen** insights (not judge or reject)
2. **Route** reflections to appropriate channels
3. **Provide** teaching moments when gaps are detected
4. **Preserve** the user's authentic voice

You are NOT a gatekeeper. You are a sharpener—refining raw ore into useful metal.`;

    const phaseContext: Record<string, string> = {
      awakening: `User is in AWAKENING phase - earliest stage. Expect:
- Basic engagement with covenant concepts
- Emerging personal connections to scripture
- Simple but sincere observations
- Foundation building

Be encouraging. Look for seeds of insight, not fully formed theology.`,

      separation: `User is in SEPARATION phase - growing discernment. Expect:
- Awareness of worldly vs. Kingdom thinking
- Beginning to question cultural assumptions
- Deeper personal wrestling with truth
- Emerging conviction

Sharpen their discernment. Help them articulate what they're sensing.`,

      discernment: `User is in DISCERNMENT phase - maturing wisdom. Expect:
- Nuanced theological thinking
- Integration of scripture across contexts
- Ability to spot subtle errors
- Practical application of principles

Refine their insights. They're ready for deeper challenges.`,

      commission: `User is in COMMISSION phase - active ministry formation. Expect:
- Teaching-ready insights
- Cross-scriptural synthesis
- Burden for others' formation
- Strategic kingdom thinking

Polish their insights for public ministry. They're becoming teachers.`,

      stewardship: `User is in STEWARDSHIP phase - established maturity. Expect:
- Profound theological depth
- Prophetic insight
- Generational wisdom
- Kingdom strategy

Collaborate as peer. Their insights may be publishable with minimal editing.`,
    };

    return `${basePrompt}\n\n${phaseContext[userPhase] || phaseContext.awakening}`;
  },

  /**
   * Build analysis prompt for specific reflection
   */
  buildAnalysisPrompt(reflectionContent: string, checkpointPrompt: string): string {
    return `Analyze this reflection and respond in JSON format.

**Checkpoint Prompt:**
${checkpointPrompt}

**User's Reflection:**
${reflectionContent}

**Response Format (JSON):**
{
  "depthScore": <float 0-10>,
  "readinessLevel": "<emerging|forming|maturing|established>",
  "sharpenedInsight": "<refined version preserving user's voice>",
  "routing": "<publish|journal|thread|review>",
  "routingReason": "<1-2 sentence explanation>",
  "teachingMoment": "<guidance if gaps detected, or null>",
  "detectedThemes": ["<theme1>", "<theme2>"],
  "indicators": {
    "usesScripture": <boolean>,
    "showsNuance": <boolean>,
    "personalIntegration": <boolean>,
    "theologicalDepth": <boolean>,
    "practicalApplication": <boolean>
  }
}

**Routing Rules:**
- **publish**: Depth ≥ 7, ready for public Living Commentary
- **thread**: Depth 5-7, good for community discussion
- **journal**: Depth 3-5, personal growth, not ready for public
- **review**: Depth < 3 OR theological concerns, needs human review

**Sharpening Guidelines:**
1. Preserve their authentic voice
2. Clarify vague points
3. Add scriptural precision if they referenced concepts loosely
4. Don't add content they didn't express
5. Keep it concise (1-3 paragraphs max)

Respond with ONLY the JSON object, no other text.`;
  },

  /**
   * Parse Claude's analysis response
   */
  parseAnalysisResponse(analysisText: string): ReflectionAnalysis {
    try {
      // Extract JSON from response (handle if Claude adds explanation)
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      return {
        depthScore: parsed.depthScore,
        readinessLevel: parsed.readinessLevel,
        sharpenedInsight: parsed.sharpenedInsight,
        routing: parsed.routing,
        routingReason: parsed.routingReason,
        teachingMoment: parsed.teachingMoment || null,
        detectedThemes: parsed.detectedThemes || [],
        indicators: parsed.indicators || {},
      };
    } catch (error) {
      strapi.log.error('Error parsing analysis response:', error);
      throw new Error('Failed to parse AI analysis');
    }
  },

  /**
   * Save analysis results to database
   */
  async saveAnalysis(reflectionId: string, analysis: ReflectionAnalysis): Promise<any> {
    try {
      // Get reflection data
      const reflection = await strapi.entityService.findMany('api::formation-reflection.formation-reflection', {
        filters: { reflectionId: { $eq: reflectionId } },
      });

      if (!Array.isArray(reflection) || reflection.length === 0) {
        throw new Error(`Reflection not found: ${reflectionId}`);
      }

      const reflectionData = reflection[0];

      // Update reflection with depth score
      await strapi.entityService.update('api::formation-reflection.formation-reflection', reflectionData.id, {
        data: {
          depthScore: analysis.depthScore,
          indicators: analysis.indicators,
        },
      });

      // Create iron insight if routing is publish, thread, or review
      if (analysis.routing !== 'journal') {
        const insightData = {
          insightId: `insight-${reflectionId}-${Date.now()}`,
          reflection: reflectionData.id,
          originalContent: reflectionData.content,
          sharpenedInsight: analysis.sharpenedInsight,
          depthScore: analysis.depthScore,
          readinessLevel: analysis.readinessLevel,
          aiAnalysis: {
            themes: analysis.detectedThemes,
            indicators: analysis.indicators,
          },
          routing: analysis.routing,
          routingReason: analysis.routingReason,
          teachingMoment: analysis.teachingMoment,
          verse: reflectionData.verse || null,
          user: reflectionData.user || null,
          status: analysis.routing === 'publish' ? 'published' : 'pending',
          publishedAt: analysis.routing === 'publish' ? new Date() : null,
        };

        const insight = await strapi.entityService.create('api::iron-insight.iron-insight', {
          data: insightData,
        });

        return insight;
      }

      return null;
    } catch (error) {
      strapi.log.error('Error saving analysis:', error);
      throw error;
    }
  },

  /**
   * Batch analyze multiple reflections
   */
  async batchAnalyze(reflectionIds: string[]): Promise<void> {
    strapi.log.info(`Starting batch analysis of ${reflectionIds.length} reflections`);

    for (const reflectionId of reflectionIds) {
      try {
        // Get reflection
        const reflections = await strapi.entityService.findMany('api::formation-reflection.formation-reflection', {
          filters: { reflectionId: { $eq: reflectionId } },
          populate: ['user'],
        });

        if (!Array.isArray(reflections) || reflections.length === 0) {
          strapi.log.warn(`Reflection not found: ${reflectionId}`);
          continue;
        }

        const reflection = reflections[0];

        // Get user's current phase
        const userId = reflection.user?.id || reflection.anonymousUserId;
        const journeyFilters: any = reflection.user
          ? { user: { id: userId } }
          : { anonymousUserId: { $eq: userId } };

        const journey = await strapi.entityService.findMany('api::formation-journey.formation-journey', {
          filters: journeyFilters,
        });

        const userPhase = Array.isArray(journey) && journey.length > 0
          ? journey[0].currentPhase
          : 'awakening';

        // Analyze reflection
        await this.analyzeReflection(
          reflectionId,
          reflection.content,
          userPhase,
          reflection.checkpointId
        );

        strapi.log.info(`✅ Analyzed reflection: ${reflectionId}`);

        // Rate limit: wait 1 second between requests
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        strapi.log.error(`Error analyzing reflection ${reflectionId}:`, error);
      }
    }

    strapi.log.info('Batch analysis complete');
  },
});

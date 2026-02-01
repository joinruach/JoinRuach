/**
 * Teaching Voice Controller
 * Handles API requests for teaching voice profiles
 */

import type { Core } from '@strapi/strapi';

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY || '';
const CLAUDE_MODEL = 'claude-sonnet-4-20250514';
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';

export default ({ strapi }: { strapi: Core.Strapi }) => ({
  /**
   * Get all active teaching voices
   */
  async getActiveVoices(ctx: any) {
    try {
      const teachingVoiceService = strapi.service('api::library.ruach-teaching-voice') as any;
      const voices = await teachingVoiceService.getActiveVoices();

      // Return simplified view for frontend
      const voicesSimple = voices.map((voice: any) => ({
        voiceId: voice.voiceId,
        name: voice.name,
        description: voice.description,
        sourceAuthor: voice.sourceAuthor,
        toneDescriptors: voice.toneDescriptors,
        approvedOutputTypes: voice.approvedOutputTypes,
        usageCount: voice.usageCount,
        averageQualityScore: voice.averageQualityScore,
      }));

      ctx.body = {
        data: voicesSimple,
        meta: {
          total: voicesSimple.length,
        },
      };
    } catch (error) {
      strapi.log.error('Error fetching teaching voices:', error);
      ctx.throw(500, 'Failed to fetch teaching voices');
    }
  },

  /**
   * Get a specific teaching voice by ID
   */
  async getVoice(ctx: any) {
    const { voiceId } = ctx.params;

    try {
      const teachingVoiceService = strapi.service('api::library.ruach-teaching-voice') as any;
      const voice = await teachingVoiceService.getVoice(voiceId);

      if (!voice) {
        return ctx.notFound('Teaching voice not found');
      }

      ctx.body = {
        data: {
          voiceId: voice.voiceId,
          name: voice.name,
          description: voice.description,
          sourceAuthor: voice.sourceAuthor,
          sourceWorks: voice.sourceWorks,
          styleCharacteristics: voice.styleCharacteristics,
          toneDescriptors: voice.toneDescriptors,
          commonPhrases: voice.commonPhrases,
          approvedOutputTypes: voice.approvedOutputTypes,
          exampleOutputs: voice.exampleOutputs,
        },
      };
    } catch (error) {
      strapi.log.error('Error fetching teaching voice:', error);
      ctx.throw(500, 'Failed to fetch teaching voice');
    }
  },

  /**
   * Preview a teaching voice with sample content
   */
  async previewVoice(ctx: any) {
    const { voiceId } = ctx.params;
    const { topic, outputType = 'qa_answer' } = ctx.request.body;

    if (!topic) {
      return ctx.badRequest('Topic is required');
    }

    if (!CLAUDE_API_KEY) {
      return ctx.throw(500, 'AI service not configured');
    }

    try {
      const teachingVoiceService = strapi.service('api::library.ruach-teaching-voice') as any;
      const voice = await teachingVoiceService.getVoice(voiceId);

      if (!voice) {
        return ctx.notFound('Teaching voice not found');
      }

      // Build voice-specific prompt
      const voicePrompt = teachingVoiceService.buildVoicePrompt(voice, outputType);

      // Generate preview content
      const systemPrompt = `You are generating a brief preview of content in a specific teaching voice.
Generate 2-3 paragraphs demonstrating this voice style on the given topic.

${voicePrompt.systemPromptAddition}

Keep the response concise and focused on demonstrating the voice style.`;

      const response = await fetch(CLAUDE_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': CLAUDE_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: CLAUDE_MODEL,
          max_tokens: 500,
          temperature: 0.7,
          system: systemPrompt,
          messages: [
            {
              role: 'user',
              content: `Write a brief passage about: ${topic}`,
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`Claude API error: ${response.status}`);
      }

      const result = (await response.json()) as {
        content?: Array<{ text?: string }>;
        usage?: { input_tokens: number; output_tokens: number };
      };

      const previewText = result.content?.[0]?.text || '';

      ctx.body = {
        data: {
          voiceId: voice.voiceId,
          voiceName: voice.name,
          topic,
          preview: previewText,
          tokensUsed: (result.usage?.input_tokens || 0) + (result.usage?.output_tokens || 0),
        },
      };
    } catch (error) {
      strapi.log.error('Error generating voice preview:', error);
      ctx.throw(500, 'Failed to generate voice preview');
    }
  },

  /**
   * Initialize starter teaching voices (admin only)
   */
  async initializeVoices(ctx: any) {
    try {
      const teachingVoiceService = strapi.service('api::library.ruach-teaching-voice') as any;
      await teachingVoiceService.initializeStarterVoices();

      ctx.body = {
        message: 'Starter teaching voices initialized successfully',
      };
    } catch (error) {
      strapi.log.error('Error initializing teaching voices:', error);
      ctx.throw(500, 'Failed to initialize teaching voices');
    }
  },
});

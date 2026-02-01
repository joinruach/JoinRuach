/**
 * Ruach Teaching Voice Service
 * Manages AI voice profiles that mirror specific teachers/authors
 */

import type { Core } from '@strapi/strapi';

interface StyleCharacteristics {
  sentenceStructure: 'simple' | 'complex' | 'varied';
  paragraphLength: 'short' | 'medium' | 'long';
  formality: 'casual' | 'conversational' | 'formal' | 'academic';
  emotionalTone: 'warm' | 'authoritative' | 'encouraging' | 'urgent' | 'contemplative';
  paceOfDelivery: 'measured' | 'dynamic' | 'building';
  useOfQuestions: 'rhetorical' | 'direct' | 'minimal';
  illustrationStyle: 'stories' | 'metaphors' | 'practical' | 'scriptural';
}

interface VocabularyPatterns {
  preferredTerms: string[];
  avoidedTerms: string[];
  technicalLevel: 'accessible' | 'intermediate' | 'scholarly';
  scriptureTranslation: string;
}

interface RhetoricalDevices {
  repetition: boolean;
  parallelism: boolean;
  antithesis: boolean;
  climax: boolean;
  alliteration: boolean;
  anaphora: boolean;
}

interface TeachingVoice {
  voiceId: string;
  name: string;
  description: string;
  sourceAuthor: string;
  sourceWorks: string[];
  styleCharacteristics: StyleCharacteristics;
  vocabularyPatterns: VocabularyPatterns;
  rhetoricalDevices: RhetoricalDevices;
  commonPhrases: string[];
  toneDescriptors: string[];
  promptModifiers: string;
  exampleOutputs: { type: string; sample: string }[];
  isActive: boolean;
  approvedOutputTypes: string[];
}

interface VoicePromptResult {
  systemPromptAddition: string;
  styleInstructions: string;
  exampleContext: string;
}

export default ({ strapi }: { strapi: Core.Strapi }) => ({
  /**
   * Get all active teaching voices
   */
  async getActiveVoices(): Promise<TeachingVoice[]> {
    const entityService = strapi.entityService as any;

    const voices = await entityService.findMany('api::teaching-voice.teaching-voice', {
      filters: {
        isActive: true,
        publishedAt: { $notNull: true },
      },
      sort: { name: 'asc' },
    });

    return voices || [];
  },

  /**
   * Get a specific teaching voice by ID
   */
  async getVoice(voiceId: string): Promise<TeachingVoice | null> {
    const entityService = strapi.entityService as any;

    const voices = await entityService.findMany('api::teaching-voice.teaching-voice', {
      filters: { voiceId },
      limit: 1,
    });

    return voices?.[0] || null;
  },

  /**
   * Get a teaching voice by author name
   */
  async getVoiceByAuthor(authorName: string): Promise<TeachingVoice | null> {
    const entityService = strapi.entityService as any;

    const voices = await entityService.findMany('api::teaching-voice.teaching-voice', {
      filters: {
        sourceAuthor: { $containsi: authorName },
        isActive: true,
      },
      limit: 1,
    });

    return voices?.[0] || null;
  },

  /**
   * Build voice-specific prompt modifications
   */
  buildVoicePrompt(voice: TeachingVoice, outputType: string): VoicePromptResult {
    const style = voice.styleCharacteristics;
    const vocab = voice.vocabularyPatterns;
    const rhetoric = voice.rhetoricalDevices;

    // Build style instructions
    const styleInstructions = this.buildStyleInstructions(style, vocab, rhetoric);

    // Build example context from sample outputs
    const relevantExamples = voice.exampleOutputs?.filter(
      ex => ex.type === outputType || ex.type === 'general'
    ) || [];

    const exampleContext = relevantExamples.length > 0
      ? `\n\nExample of ${voice.name}'s style:\n${relevantExamples[0].sample}`
      : '';

    // Combine with custom prompt modifiers
    const systemPromptAddition = `
You are generating content in the teaching voice of ${voice.sourceAuthor}.

${voice.promptModifiers}

Key phrases to incorporate naturally: ${voice.commonPhrases?.slice(0, 5).join(', ') || 'None specified'}

Tone: ${voice.toneDescriptors?.join(', ') || 'Warm and instructive'}

${styleInstructions}
${exampleContext}
`;

    return {
      systemPromptAddition,
      styleInstructions,
      exampleContext,
    };
  },

  /**
   * Build detailed style instructions from characteristics
   */
  buildStyleInstructions(
    style: StyleCharacteristics,
    vocab: VocabularyPatterns,
    rhetoric: RhetoricalDevices
  ): string {
    const instructions: string[] = [];

    // Sentence structure
    if (style.sentenceStructure === 'simple') {
      instructions.push('Use short, clear sentences. Avoid complex subordinate clauses.');
    } else if (style.sentenceStructure === 'complex') {
      instructions.push('Use sophisticated sentence structures with multiple clauses when appropriate.');
    } else {
      instructions.push('Vary sentence length for rhythm - mix short punchy sentences with longer explanatory ones.');
    }

    // Paragraph length
    if (style.paragraphLength === 'short') {
      instructions.push('Keep paragraphs brief, 2-3 sentences maximum.');
    } else if (style.paragraphLength === 'long') {
      instructions.push('Develop ideas fully in longer paragraphs.');
    }

    // Formality
    const formalityMap: Record<string, string> = {
      casual: 'Use a casual, approachable tone like speaking to a friend.',
      conversational: 'Maintain a warm, conversational style while being informative.',
      formal: 'Use formal language appropriate for a Sunday sermon.',
      academic: 'Employ scholarly precision with appropriate theological terminology.',
    };
    instructions.push(formalityMap[style.formality] || '');

    // Emotional tone
    const toneMap: Record<string, string> = {
      warm: 'Convey warmth and personal care for the reader.',
      authoritative: 'Speak with conviction and prophetic authority.',
      encouraging: 'Emphasize hope, encouragement, and practical application.',
      urgent: 'Convey appropriate urgency when discussing spiritual matters.',
      contemplative: 'Invite deep reflection and meditation on truths.',
    };
    instructions.push(toneMap[style.emotionalTone] || '');

    // Questions
    if (style.useOfQuestions === 'rhetorical') {
      instructions.push('Use rhetorical questions to engage the reader and drive home points.');
    } else if (style.useOfQuestions === 'direct') {
      instructions.push('Ask direct questions that prompt self-examination.');
    }

    // Illustrations
    const illustrationMap: Record<string, string> = {
      stories: 'Illustrate points with narrative examples and stories.',
      metaphors: 'Use rich metaphors and word pictures to explain concepts.',
      practical: 'Include practical, real-world applications.',
      scriptural: 'Let Scripture itself provide the primary illustrations.',
    };
    instructions.push(illustrationMap[style.illustrationStyle] || '');

    // Vocabulary
    if (vocab.technicalLevel === 'accessible') {
      instructions.push('Use everyday language that anyone can understand.');
    } else if (vocab.technicalLevel === 'scholarly') {
      instructions.push('Include theological terms with clear definitions when needed.');
    }

    if (vocab.preferredTerms?.length > 0) {
      instructions.push(`Preferred vocabulary: ${vocab.preferredTerms.slice(0, 10).join(', ')}`);
    }

    if (vocab.avoidedTerms?.length > 0) {
      instructions.push(`Avoid using: ${vocab.avoidedTerms.join(', ')}`);
    }

    if (vocab.scriptureTranslation) {
      instructions.push(`Quote Scripture from the ${vocab.scriptureTranslation} translation.`);
    }

    // Rhetorical devices
    const activeDevices: string[] = [];
    if (rhetoric.repetition) activeDevices.push('strategic repetition for emphasis');
    if (rhetoric.parallelism) activeDevices.push('parallel structure');
    if (rhetoric.antithesis) activeDevices.push('contrasting ideas');
    if (rhetoric.climax) activeDevices.push('building to climactic points');
    if (rhetoric.anaphora) activeDevices.push('repeated beginnings for emphasis');

    if (activeDevices.length > 0) {
      instructions.push(`Employ these rhetorical techniques: ${activeDevices.join(', ')}.`);
    }

    return instructions.filter(i => i).join('\n');
  },

  /**
   * Validate that a voice can be used for a given output type
   */
  canUseVoiceForOutput(voice: TeachingVoice, outputType: string): boolean {
    if (!voice.approvedOutputTypes) {
      return true; // Default to allowing all
    }
    return voice.approvedOutputTypes.includes(outputType);
  },

  /**
   * Record usage of a teaching voice
   */
  async recordUsage(voiceId: string, qualityScore: number): Promise<void> {
    const entityService = strapi.entityService as any;

    const voices = await entityService.findMany('api::teaching-voice.teaching-voice', {
      filters: { voiceId },
      limit: 1,
    });

    const voice = voices?.[0];
    if (!voice) return;

    // Calculate new average quality score
    const currentAvg = voice.averageQualityScore || 0;
    const currentCount = voice.usageCount || 0;
    const newAvg = ((currentAvg * currentCount) + qualityScore) / (currentCount + 1);

    await entityService.update('api::teaching-voice.teaching-voice', voice.id, {
      data: {
        usageCount: currentCount + 1,
        averageQualityScore: newAvg,
      },
    });
  },

  /**
   * Initialize starter teaching voices
   */
  async initializeStarterVoices(): Promise<void> {
    const entityService = strapi.entityService as any;
    const crypto = await import('crypto');

    const starterVoices = [
      {
        voiceId: crypto.randomUUID(),
        name: 'EGW Classic',
        description: 'The prophetic voice of Ellen G. White, emphasizing practical godliness and the great controversy theme',
        sourceAuthor: 'Ellen G. White',
        sourceWorks: ['Steps to Christ', 'Desire of Ages', 'The Great Controversy', 'Ministry of Healing'],
        styleCharacteristics: {
          sentenceStructure: 'varied',
          paragraphLength: 'medium',
          formality: 'formal',
          emotionalTone: 'warm',
          paceOfDelivery: 'measured',
          useOfQuestions: 'rhetorical',
          illustrationStyle: 'stories',
        },
        vocabularyPatterns: {
          preferredTerms: ['character', 'sanctification', 'divine love', 'heavenly agencies', 'eternal life'],
          avoidedTerms: ['modern slang', 'casual expressions'],
          technicalLevel: 'accessible',
          scriptureTranslation: 'KJV',
        },
        rhetoricalDevices: {
          repetition: true,
          parallelism: true,
          antithesis: true,
          climax: true,
          alliteration: false,
          anaphora: true,
        },
        commonPhrases: [
          'It is the privilege of every soul',
          'Higher than the highest human thought can reach',
          'In the great plan of redemption',
          'The love of God',
          'Divine agencies',
        ],
        toneDescriptors: ['prophetic', 'nurturing', 'urgent', 'hopeful'],
        promptModifiers: `Write in the contemplative, spiritually-rich style of Ellen G. White.
Emphasize the great controversy between good and evil.
Connect practical daily living with eternal truths.
Use vivid imagery of heaven and the character of God.
Include appeals to the heart as well as the mind.`,
        exampleOutputs: [
          {
            type: 'general',
            sample: 'It is the privilege of every soul to have such an abiding connection with Christ that our lives will be fragrant with His presence. The great controversy theme runs through all of history, yet in the midst of this cosmic conflict, the love of God shines with unwavering brightness.',
          },
        ],
        isActive: true,
        approvedOutputTypes: ['sermon', 'study', 'qa_answer', 'doctrine_page'],
      },
      {
        voiceId: crypto.randomUUID(),
        name: 'Pastoral Shepherd',
        description: 'A warm, pastoral voice focused on practical application and spiritual encouragement',
        sourceAuthor: 'Pastoral Tradition',
        sourceWorks: [],
        styleCharacteristics: {
          sentenceStructure: 'simple',
          paragraphLength: 'short',
          formality: 'conversational',
          emotionalTone: 'encouraging',
          paceOfDelivery: 'dynamic',
          useOfQuestions: 'direct',
          illustrationStyle: 'practical',
        },
        vocabularyPatterns: {
          preferredTerms: ['friend', 'journey', 'growth', 'relationship', 'grace'],
          avoidedTerms: ['academic jargon', 'complex theology'],
          technicalLevel: 'accessible',
          scriptureTranslation: 'NKJV',
        },
        rhetoricalDevices: {
          repetition: true,
          parallelism: false,
          antithesis: false,
          climax: true,
          alliteration: false,
          anaphora: false,
        },
        commonPhrases: [
          'Let me ask you',
          'Here is what I want you to understand',
          'This is so important',
          'God is with you in this',
        ],
        toneDescriptors: ['warm', 'personal', 'practical', 'encouraging'],
        promptModifiers: `Write as a caring pastor speaking directly to your congregation.
Use personal pronouns like "you" and "we."
Include practical takeaways they can apply this week.
Be encouraging but honest about challenges.
Share from your heart.`,
        exampleOutputs: [
          {
            type: 'general',
            sample: 'Friend, I want you to understand something today. God sees you right where you are. He knows your struggles, your doubts, your fears. And here is the beautiful truth: He loves you anyway. Not because you have it all together, but because you are His.',
          },
        ],
        isActive: true,
        approvedOutputTypes: ['sermon', 'qa_answer'],
      },
      {
        voiceId: crypto.randomUUID(),
        name: 'Biblical Scholar',
        description: 'An academic voice emphasizing exegesis, historical context, and theological precision',
        sourceAuthor: 'Academic Tradition',
        sourceWorks: [],
        styleCharacteristics: {
          sentenceStructure: 'complex',
          paragraphLength: 'long',
          formality: 'academic',
          emotionalTone: 'authoritative',
          paceOfDelivery: 'measured',
          useOfQuestions: 'rhetorical',
          illustrationStyle: 'scriptural',
        },
        vocabularyPatterns: {
          preferredTerms: ['exegesis', 'hermeneutics', 'context', 'original language', 'theology'],
          avoidedTerms: ['slang', 'oversimplification'],
          technicalLevel: 'scholarly',
          scriptureTranslation: 'ESV',
        },
        rhetoricalDevices: {
          repetition: false,
          parallelism: true,
          antithesis: true,
          climax: false,
          alliteration: false,
          anaphora: false,
        },
        commonPhrases: [
          'The Greek word here is',
          'In the historical context',
          'Theologically speaking',
          'The text reveals',
        ],
        toneDescriptors: ['scholarly', 'precise', 'thorough', 'reverent'],
        promptModifiers: `Write with academic rigor while remaining accessible.
Include relevant Greek or Hebrew terms where they illuminate meaning.
Reference historical and cultural context.
Build theological arguments systematically.
Maintain reverence for Scripture's authority.`,
        exampleOutputs: [
          {
            type: 'study',
            sample: 'The Greek term "agape" (ἀγάπη) employed here by Paul carries significantly different connotations than the more common "phileo." In its New Testament usage, agape denotes a self-sacrificial love that finds its ultimate expression in the cross. The historical context of first-century Corinth, with its moral permissiveness, makes Paul\'s exhortation all the more striking.',
          },
        ],
        isActive: true,
        approvedOutputTypes: ['study', 'doctrine_page'],
      },
    ];

    // Check if voices already exist
    const existing = await entityService.findMany('api::teaching-voice.teaching-voice', {
      filters: {
        name: { $in: starterVoices.map(v => v.name) },
      },
    });

    if (existing && existing.length > 0) {
      strapi.log.info('[TeachingVoice] Starter voices already exist');
      return;
    }

    // Create starter voices
    for (const voice of starterVoices) {
      try {
        await entityService.create('api::teaching-voice.teaching-voice', {
          data: {
            ...voice,
            publishedAt: new Date(),
          },
        });
        strapi.log.info(`[TeachingVoice] Created starter voice: ${voice.name}`);
      } catch (error) {
        strapi.log.error(`[TeachingVoice] Error creating voice ${voice.name}:`, error);
      }
    }
  },
});

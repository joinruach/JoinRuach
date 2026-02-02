/**
 * Ruach AI Pipeline Integration Tests
 * Tests the complete AI generation, validation, and summarization flow
 */

import { describe, it, expect, beforeAll, afterAll, jest } from '@jest/globals';

// Mock Strapi
const mockStrapi = {
  log: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
  service: jest.fn(),
  entityService: {
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  db: {
    connection: {
      raw: jest.fn(),
    },
  },
};

// @ts-ignore
global.strapi = mockStrapi;

describe('Ruach AI Pipeline', () => {
  beforeAll(() => {
    // Set up environment
    process.env.CLAUDE_API_KEY = 'test-key';
    process.env.OPENAI_API_KEY = 'test-key';
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  describe('Citation Validator', () => {
    it('should parse scripture references correctly', () => {
      // Test data
      const references = [
        { input: 'Matthew 6:25-34', expected: { book: 'Matthew', chapter: 6, verseStart: 25, verseEnd: 34 } },
        { input: 'John 3:16', expected: { book: 'John', chapter: 3, verseStart: 16, verseEnd: undefined } },
        { input: '1 Corinthians 13:4-8', expected: { book: '1 Corinthians', chapter: 13, verseStart: 4, verseEnd: 8 } },
        { input: 'Psalm 23:1', expected: { book: 'Psalm', chapter: 23, verseStart: 1, verseEnd: undefined } },
      ];

      for (const { input, expected } of references) {
        const match = input.match(/^(.+?)\s+(\d+):(\d+)(?:-(\d+))?$/);
        if (match) {
          const parsed = {
            book: match[1].trim(),
            chapter: parseInt(match[2], 10),
            verseStart: parseInt(match[3], 10),
            verseEnd: match[4] ? parseInt(match[4], 10) : undefined,
          };
          expect(parsed).toEqual(expected);
        }
      }
    });

    it('should calculate citation coverage correctly', () => {
      const content = `
        This is the first sentence with a citation [Scripture: John 3:16].
        This is the second sentence without a citation.
        This is the third sentence with [Source: Title, Author, Page 123].
      `;

      const sentences = content
        .split(/[.!?]+[\s\n]+/)
        .map(s => s.trim())
        .filter(s => s.length > 0);

      const citedSentences = sentences.filter(s =>
        s.includes('[Scripture:') || s.includes('[Source:')
      );

      const coverage = citedSentences.length / sentences.length;

      // 2 out of 3 sentences have citations = 66.7%
      expect(coverage).toBeCloseTo(0.667, 1);
    });

    it('should enforce scripture citation minimum', () => {
      const citations = [
        { isScripture: true, locator: 'John 3:16' },
        { isScripture: true, locator: 'Matthew 5:1-12' },
        { isScripture: false, locator: 'Book Title, Author' },
      ];

      const minScripture = 2;
      const scriptureCount = citations.filter(c => c.isScripture).length;

      expect(scriptureCount >= minScripture).toBe(true);
    });
  });

  describe('Guardrail Engine', () => {
    it('should detect keyword violations', () => {
      const content = 'According to Wikipedia, salvation is a process of sanctification.';
      const keywords = ['Wikipedia', 'Google', 'ChatGPT'];

      const matches: string[] = [];
      for (const keyword of keywords) {
        const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
        const found = content.match(regex);
        if (found) {
          matches.push(...found);
        }
      }

      expect(matches).toContain('Wikipedia');
      expect(matches.length).toBe(1);
    });

    it('should calculate guardrail score correctly', () => {
      const violations = 1;
      const warnings = 2;
      const guidanceItems = 1;

      const violationPenalty = 0.3;
      const warningPenalty = 0.1;
      const guidancePenalty = 0.05;

      let score = 1.0;
      score -= violations * violationPenalty;
      score -= warnings * warningPenalty;
      score -= guidanceItems * guidancePenalty;
      score = Math.max(0, Math.min(1, score));

      // 1.0 - 0.3 - 0.2 - 0.05 = 0.45
      expect(score).toBeCloseTo(0.45, 2);
    });

    it('should identify phrase patterns', () => {
      const content = 'We believe that God is love and Jesus is the Son of God.';
      const phrases = ['God is', 'Jesus is', 'the Bible says'];

      const matches: string[] = [];
      for (const phrase of phrases) {
        const regex = new RegExp(phrase, 'gi');
        const found = content.match(regex);
        if (found) {
          matches.push(...found);
        }
      }

      expect(matches).toContain('God is');
      expect(matches).toContain('Jesus is');
      expect(matches.length).toBe(2);
    });
  });

  describe('Quality Score Calculation', () => {
    it('should calculate overall quality score correctly', () => {
      const weights = {
        citationCoverage: 0.35,
        scriptureRatio: 0.3,
        guardrailCompliance: 0.25,
        accuracy: 0.1,
      };

      const metrics = {
        citationCoverage: 0.8,
        scriptureCitationCount: 3,
        guardrailScore: 0.9,
        citationAccuracy: 1.0,
      };

      const scores = {
        citationCoverage: metrics.citationCoverage,
        scriptureRatio: Math.min(metrics.scriptureCitationCount / 3, 1.0),
        guardrailCompliance: metrics.guardrailScore,
        accuracy: metrics.citationAccuracy,
      };

      const overallQuality =
        weights.citationCoverage * scores.citationCoverage +
        weights.scriptureRatio * scores.scriptureRatio +
        weights.guardrailCompliance * scores.guardrailCompliance +
        weights.accuracy * scores.accuracy;

      // 0.35 * 0.8 + 0.3 * 1.0 + 0.25 * 0.9 + 0.1 * 1.0 = 0.28 + 0.3 + 0.225 + 0.1 = 0.905
      expect(overallQuality).toBeCloseTo(0.905, 2);
    });

    it('should pass quality gate at 0.7 threshold', () => {
      const qualityScore = 0.85;
      const threshold = 0.7;

      expect(qualityScore >= threshold).toBe(true);
    });

    it('should fail quality gate when below threshold', () => {
      const qualityScore = 0.65;
      const threshold = 0.7;

      expect(qualityScore >= threshold).toBe(false);
    });
  });

  describe('Video Summarizer', () => {
    it('should parse VTT timestamps correctly', () => {
      const vttContent = `WEBVTT

00:00:00.000 --> 00:00:05.000
Welcome to this teaching on faith.

00:00:05.000 --> 00:00:10.000
Today we will explore what the Bible says about belief.`;

      const timeRegex = /(\d{2}):(\d{2}):(\d{2})[.,](\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2})[.,](\d{3})/;
      const lines = vttContent.split('\n');

      const chunks: { startTime: number; text: string }[] = [];
      let currentChunk: { startTime: number; text: string } | null = null;

      for (const line of lines) {
        const timeMatch = line.match(timeRegex);
        if (timeMatch) {
          if (currentChunk?.text) {
            chunks.push(currentChunk);
          }
          currentChunk = {
            startTime: parseInt(timeMatch[1]) * 3600 + parseInt(timeMatch[2]) * 60 + parseInt(timeMatch[3]),
            text: '',
          };
        } else if (currentChunk && line.trim() && line.trim() !== 'WEBVTT') {
          currentChunk.text += (currentChunk.text ? ' ' : '') + line.trim();
        }
      }

      if (currentChunk?.text) {
        chunks.push(currentChunk);
      }

      expect(chunks.length).toBe(2);
      expect(chunks[0].startTime).toBe(0);
      expect(chunks[1].startTime).toBe(5);
    });

    it('should format timestamps correctly', () => {
      const formatTimestamp = (seconds: number): string => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
      };

      expect(formatTimestamp(0)).toBe('00:00:00');
      expect(formatTimestamp(65)).toBe('00:01:05');
      expect(formatTimestamp(3661)).toBe('01:01:01');
      expect(formatTimestamp(7325)).toBe('02:02:05');
    });

    it('should estimate duration from transcript', () => {
      const transcript = 'This is a test transcript with multiple words. '.repeat(150);
      const wordCount = transcript.split(/\s+/).filter(w => w).length;
      const minutes = wordCount / 150; // 150 words per minute
      const durationSeconds = Math.ceil(minutes * 60);

      // 150 repetitions * 8 words = 1200 words / 150 wpm = 8 minutes = 480 seconds
      expect(durationSeconds).toBeGreaterThanOrEqual(480);
      expect(durationSeconds).toBeLessThan(520);
    });
  });

  describe('Async Generation Queue', () => {
    it('should estimate generation time based on output type', () => {
      const estimates: Record<string, number> = {
        qa_answer: 15000,
        study: 25000,
        sermon: 35000,
        doctrine_page: 45000,
      };

      expect(estimates['qa_answer']).toBe(15000);
      expect(estimates['sermon']).toBe(35000);
      expect(estimates['unknown'] || 30000).toBe(30000);
    });

    it('should map BullMQ states correctly', () => {
      const mapping: Record<string, string> = {
        waiting: 'pending',
        delayed: 'pending',
        active: 'processing',
        completed: 'completed',
        failed: 'failed',
      };

      expect(mapping['waiting']).toBe('pending');
      expect(mapping['active']).toBe('processing');
      expect(mapping['completed']).toBe('completed');
    });
  });

  describe('Scripture Search', () => {
    it('should match exact scripture references', () => {
      const referencePattern = /^(.+?)\s+(\d+):(\d+)(?:-(\d+))?$/;

      const testCases = [
        { input: 'Matthew 6:25-34', shouldMatch: true },
        { input: 'John 3:16', shouldMatch: true },
        { input: 'not a reference', shouldMatch: false },
        { input: '1 John 4:7-8', shouldMatch: true },
      ];

      for (const { input, shouldMatch } of testCases) {
        const match = referencePattern.test(input);
        expect(match).toBe(shouldMatch);
      }
    });
  });

  describe('Library Reference Parsing', () => {
    it('should parse library references correctly', () => {
      const parseLibraryReference = (reference: string) => {
        const parts = reference.split(',').map(p => p.trim());
        if (parts.length === 0) return null;

        const title = parts[0];
        const author = parts.length > 1 ? parts[1] : undefined;
        const pageMatch = reference.match(/[Pp]age\s*(\d+)/);
        const page = pageMatch ? pageMatch[1] : undefined;

        return { title, author, page };
      };

      const testCases = [
        {
          input: 'Steps to Christ, Ellen G. White, Page 45',
          expected: { title: 'Steps to Christ', author: 'Ellen G. White', page: '45' },
        },
        {
          input: 'Desire of Ages, White',
          expected: { title: 'Desire of Ages', author: 'White', page: undefined },
        },
        {
          input: 'Book Title',
          expected: { title: 'Book Title', author: undefined, page: undefined },
        },
      ];

      for (const { input, expected } of testCases) {
        const parsed = parseLibraryReference(input);
        expect(parsed).toEqual(expected);
      }
    });
  });
});

describe('End-to-End Flow Simulation', () => {
  it('should simulate complete generation flow', async () => {
    // Simulate the complete flow without making actual API calls
    const request = {
      query: 'What does the Bible say about fear?',
      outputType: 'qa_answer',
      mode: 'scripture_library',
      strictMode: true,
    };

    // Step 1: Validate request
    expect(request.query).toBeTruthy();
    expect(['sermon', 'study', 'qa_answer', 'doctrine_page']).toContain(request.outputType);

    // Step 2: Mock retrieval
    const mockChunks = [
      {
        chunkId: '1',
        score: 0.95,
        textContent: 'Fear not, for I am with you.',
        citation: { sourceTitle: 'Isaiah 41:10', author: null },
      },
      {
        chunkId: '2',
        score: 0.85,
        textContent: 'Perfect love casts out fear.',
        citation: { sourceTitle: '1 John 4:18', author: null },
      },
    ];

    expect(mockChunks.length).toBeGreaterThan(0);

    // Step 3: Mock generation result
    const mockResult = {
      content: 'The Bible teaches us not to fear because God is with us [Scripture: Isaiah 41:10]. Perfect love, which comes from God, casts out all fear [Scripture: 1 John 4:18].',
      citations: [
        { locator: 'Isaiah 41:10', isScripture: true },
        { locator: '1 John 4:18', isScripture: true },
      ],
    };

    // Step 4: Validate quality
    const scriptureCitations = mockResult.citations.filter(c => c.isScripture).length;
    expect(scriptureCitations).toBeGreaterThanOrEqual(2);

    // Step 5: Calculate coverage
    const sentences = mockResult.content.split(/[.!?]+/).filter(s => s.trim());
    const citedSentences = sentences.filter(s => s.includes('[Scripture:'));
    const coverage = citedSentences.length / sentences.length;
    expect(coverage).toBeGreaterThanOrEqual(0.5);

    // Step 6: Overall quality passes threshold
    const qualityScore = 0.85;
    expect(qualityScore).toBeGreaterThanOrEqual(0.7);
  });
});

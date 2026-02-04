import Anthropic from '@anthropic-ai/sdk';
import type { Chapter } from '../types/canonical-edl';
import type { TranscriptSegment } from './transcription-service';

/**
 * Phase 11: Chapter Generator
 *
 * AI-powered chapter title generation from transcript segments
 */

export default class ChapterGenerator {
  private client: Anthropic;

  constructor(apiKey?: string) {
    const key = apiKey || process.env.ANTHROPIC_API_KEY;
    if (!key) {
      throw new Error('Anthropic API key is required. Set ANTHROPIC_API_KEY environment variable.');
    }
    this.client = new Anthropic({ apiKey: key });
  }

  /**
   * Generate chapter markers from transcript segments
   *
   * Groups transcript into logical sections and generates AI titles
   *
   * @param transcriptSegments - Master transcript segments
   * @param sessionId - Session identifier for logging
   * @returns Array of chapter markers with AI-generated titles
   */
  async generateChapters(
    transcriptSegments: TranscriptSegment[],
    sessionId: string
  ): Promise<Chapter[]> {
    try {
      if (!transcriptSegments || transcriptSegments.length === 0) {
        return [];
      }

      // Group transcript into logical sections (every 5-10 minutes)
      const sections = this.groupIntoSections(transcriptSegments);

      // Generate title for each section using AI
      const chapters: Chapter[] = [];
      for (let i = 0; i < sections.length; i++) {
        const section = sections[i];
        const title = await this.generateChapterTitle(section.text, i);

        chapters.push({
          startMs: section.startMs,
          title
        });
      }

      console.log(`[chapter-generator] Generated ${chapters.length} chapters for session ${sessionId}`);
      return chapters;
    } catch (error) {
      console.error(
        `[chapter-generator] Failed to generate chapters for session ${sessionId}:`,
        error instanceof Error ? error.message : error
      );

      // Graceful degradation: return generic chapter titles
      return this.generateGenericChapters(transcriptSegments);
    }
  }

  /**
   * Group transcript segments into logical sections
   *
   * Strategy: Create sections of ~5-10 minutes, breaking on speaker changes
   */
  private groupIntoSections(segments: TranscriptSegment[]): Array<{ startMs: number; text: string }> {
    const sections: Array<{ startMs: number; text: string }> = [];
    const targetSectionLength = 7 * 60 * 1000; // 7 minutes in ms
    const minSectionLength = 3 * 60 * 1000; // 3 minutes minimum

    let currentSectionStart = segments[0].start;
    let currentSectionText: string[] = [];
    let lastSpeaker: string | null = null;

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      const sectionLength = segment.end - currentSectionStart;

      currentSectionText.push(segment.text);

      // Check if we should close this section
      const shouldClose =
        sectionLength >= targetSectionLength || // Hit target length
        (sectionLength >= minSectionLength && segment.speaker !== lastSpeaker && i < segments.length - 1); // Speaker change after min length

      if (shouldClose || i === segments.length - 1) {
        sections.push({
          startMs: currentSectionStart,
          text: currentSectionText.join(' ')
        });

        // Start new section
        if (i < segments.length - 1) {
          currentSectionStart = segment.end;
          currentSectionText = [];
        }
      }

      lastSpeaker = segment.speaker;
    }

    return sections;
  }

  /**
   * Generate a chapter title using AI
   *
   * Uses Claude Haiku for fast, cost-effective generation
   */
  private async generateChapterTitle(transcriptText: string, sectionIndex: number): Promise<string> {
    // Truncate long transcripts (keep first 2000 chars)
    const truncatedText = transcriptText.length > 2000
      ? transcriptText.substring(0, 2000) + '...'
      : transcriptText;

    const prompt = `Generate a concise chapter title (3-5 words) for this section of a sermon or teaching:

Transcript:
${truncatedText}

Respond with only the chapter title, no explanation or punctuation.

Examples of good chapter titles:
- "Opening Prayer and Welcome"
- "The Power of Faith"
- "Responding to God's Call"
- "Closing Benediction"`;

    try {
      const response = await this.client.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 50,
        temperature: 0.7,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      const title = response.content[0].type === 'text'
        ? response.content[0].text.trim()
        : `Section ${sectionIndex + 1}`;

      // Clean up title (remove quotes, periods, etc.)
      return title.replace(/['"\.]/g, '').trim();
    } catch (error) {
      console.error('[chapter-generator] AI generation failed:', error);
      return `Section ${sectionIndex + 1}`;
    }
  }

  /**
   * Generate generic chapter titles as fallback
   *
   * Used when AI fails or is unavailable
   */
  private generateGenericChapters(segments: TranscriptSegment[]): Chapter[] {
    const sections = this.groupIntoSections(segments);

    return sections.map((section, i) => ({
      startMs: section.startMs,
      title: `Section ${i + 1}`
    }));
  }
}

/**
 * Ruach Citation Validator Service
 * Verifies citations meet requirements and calculates quality metrics
 */

import type { Core } from '@strapi/strapi';
import type { Citation } from './ruach-generation';

interface CitationRequirements {
  minScripture?: number;
  minLibrary?: number;
  coverage?: number;
}

interface VerificationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  metrics: {
    coverage: number;
    scriptureCount: number;
    libraryCount: number;
    accuracy: number;
  };
}

export default ({ strapi }: { strapi: Core.Strapi }) => ({
  /**
   * Verify citations meet template requirements
   */
  async verifyCitations(
    citations: Citation[],
    requirements: CitationRequirements
  ): Promise<VerificationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    const scriptureCount = citations.filter(c => c.isScripture).length;
    const libraryCount = citations.filter(c => !c.isScripture).length;

    // Check scripture minimum
    const minScripture = requirements.minScripture || 2;
    if (scriptureCount < minScripture) {
      errors.push(
        `Insufficient scripture citations: ${scriptureCount} < ${minScripture} required`
      );
    }

    // Check library minimum
    const minLibrary = requirements.minLibrary || 1;
    if (libraryCount < minLibrary) {
      warnings.push(
        `Low library citations: ${libraryCount} < ${minLibrary} recommended`
      );
    }

    // Validate accuracy (check each citation points to real chunk)
    const accuracy = await this.validateCitationAccuracy(citations);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      metrics: {
        coverage: 0, // Will be calculated separately
        scriptureCount,
        libraryCount,
        accuracy,
      },
    };
  },

  /**
   * Calculate percentage of content covered by citations
   * Algorithm: Count sentences with citations / total sentences
   */
  async calculateCitationCoverage(content: string, citations: Citation[]): Promise<number> {
    if (!content || citations.length === 0) {
      return 0;
    }

    // Parse content into sentences
    const sentences = this.parseSentences(content);

    if (sentences.length === 0) {
      return 0;
    }

    // Count sentences with citations
    let coveredSentences = 0;

    for (const sentence of sentences) {
      const hasCitation = citations.some(citation =>
        this.sentenceHasCitation(sentence, citation)
      );

      if (hasCitation) {
        coveredSentences++;
      }
    }

    // Return ratio
    return coveredSentences / sentences.length;
  },

  /**
   * Parse content into sentences
   */
  parseSentences(content: string): string[] {
    // Remove JSON formatting if present
    let text = content;
    try {
      const parsed = JSON.parse(content);
      // Extract text from all fields
      text = this.extractTextFromJSON(parsed);
    } catch {
      // Not JSON, use as-is
    }

    // Split on sentence-ending punctuation followed by space or newline
    const sentences = text
      .split(/[.!?]+[\s\n]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);

    return sentences;
  },

  /**
   * Extract text from JSON object recursively
   */
  extractTextFromJSON(obj: any): string {
    if (typeof obj === 'string') {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.extractTextFromJSON(item)).join(' ');
    }

    if (typeof obj === 'object' && obj !== null) {
      return Object.values(obj)
        .map(value => this.extractTextFromJSON(value))
        .join(' ');
    }

    return '';
  },

  /**
   * Check if a sentence contains a citation
   */
  sentenceHasCitation(sentence: string, citation: Citation): boolean {
    // Check if citation text appears in sentence
    if (sentence.includes(citation.text)) {
      return true;
    }

    // Check if citation locator appears in sentence
    // (e.g., "Matthew 6:25-34" or "Title, Author, Page")
    if (sentence.includes(citation.locator)) {
      return true;
    }

    // Check for proximity (citation within 100 characters)
    // This handles cases where citation is at end of sentence
    const citationIndex = sentence.indexOf(citation.locator);
    if (citationIndex !== -1) {
      return true;
    }

    return false;
  },

  /**
   * Enforce scripture citation minimum
   */
  async enforceScriptureMinimum(citations: Citation[], min: number): Promise<boolean> {
    const scriptureCount = citations.filter(c => c.isScripture).length;
    return scriptureCount >= min;
  },

  /**
   * Validate citation accuracy - ensure citations point to real chunks
   */
  async validateCitationAccuracy(citations: Citation[]): Promise<number> {
    if (citations.length === 0) {
      return 1.0;
    }

    let validCount = 0;
    const entityService = strapi.entityService as any;

    for (const citation of citations) {
      try {
        // For scripture citations, verify against scripture-verse table
        if (citation.isScripture) {
          const isValid = await this.validateScriptureCitation(citation);
          if (isValid) validCount++;
        } else {
          // For library citations, verify against library-chunk table
          const isValid = await this.validateLibraryCitation(citation);
          if (isValid) validCount++;
        }
      } catch (error) {
        strapi.log.warn(`Error validating citation: ${citation.locator}`, error);
        // Don't count as valid
      }
    }

    return validCount / citations.length;
  },

  /**
   * Validate scripture citation against scripture-verse table
   */
  async validateScriptureCitation(citation: Citation): Promise<boolean> {
    // Parse citation locator (e.g., "Matthew 6:25-34" or "John 3:16")
    const parsed = this.parseScriptureReference(citation.locator);
    if (!parsed) {
      return false;
    }

    const { book, chapter, verseStart, verseEnd } = parsed;

    // Query scripture-verse table
    const db = strapi.db.connection;

    const result = await db.raw(
      `
      SELECT COUNT(*) as count
      FROM scripture_verses sv
      JOIN scripture_works sw ON sv.work_id = sw.id
      WHERE sw.title ILIKE $1
        AND sv.chapter = $2
        AND sv.verse_number >= $3
        AND sv.verse_number <= $4
      LIMIT 1
    `,
      [book, chapter, verseStart, verseEnd || verseStart]
    );

    return result.rows?.[0]?.count > 0;
  },

  /**
   * Parse scripture reference into components
   * Format: "Book Chapter:Verse" or "Book Chapter:VerseStart-VerseEnd"
   */
  parseScriptureReference(reference: string): {
    book: string;
    chapter: number;
    verseStart: number;
    verseEnd?: number;
  } | null {
    // Pattern: "Matthew 6:25-34" or "John 3:16"
    const match = reference.match(/^(.+?)\s+(\d+):(\d+)(?:-(\d+))?$/);
    if (!match) {
      return null;
    }

    return {
      book: match[1].trim(),
      chapter: parseInt(match[2], 10),
      verseStart: parseInt(match[3], 10),
      verseEnd: match[4] ? parseInt(match[4], 10) : undefined,
    };
  },

  /**
   * Validate library citation against library-chunk table
   */
  async validateLibraryCitation(citation: Citation): Promise<boolean> {
    // Parse citation locator (e.g., "Title, Author, Page 123")
    const parsed = this.parseLibraryReference(citation.locator);
    if (!parsed) {
      return false;
    }

    const { title, author, page } = parsed;

    // Query library-chunk table via section → document
    const db = strapi.db.connection;

    const result = await db.raw(
      `
      SELECT COUNT(*) as count
      FROM library_chunks lc
      JOIN library_sections ls ON lc.section_id = ls.id
      JOIN library_documents ld ON ls.document_id = ld.id
      WHERE ld.title ILIKE $1
        ${author ? `AND ld.author ILIKE $2` : ''}
        ${page ? `AND ls.page_range ILIKE $${author ? 3 : 2}` : ''}
      LIMIT 1
    `,
      [
        `%${title}%`,
        ...(author ? [`%${author}%`] : []),
        ...(page ? [`%${page}%`] : []),
      ]
    );

    return result.rows?.[0]?.count > 0;
  },

  /**
   * Parse library reference into components
   * Format: "Title, Author, Page 123" or "Title, Author" or just "Title"
   */
  parseLibraryReference(reference: string): {
    title: string;
    author?: string;
    page?: string;
  } | null {
    const parts = reference.split(',').map(p => p.trim());

    if (parts.length === 0) {
      return null;
    }

    const title = parts[0];
    const author = parts.length > 1 ? parts[1] : undefined;

    // Extract page number if present
    const pageMatch = reference.match(/[Pp]age\s*(\d+)/);
    const page = pageMatch ? pageMatch[1] : undefined;

    return {
      title,
      author,
      page,
    };
  },

  /**
   * Calculate citation quality score
   * Factors: coverage, accuracy, scripture ratio, diversity
   */
  calculateCitationQuality(metrics: {
    coverage: number;
    scriptureCount: number;
    libraryCount: number;
    accuracy: number;
  }): number {
    const totalCitations = metrics.scriptureCount + metrics.libraryCount;

    if (totalCitations === 0) {
      return 0;
    }

    // Weights
    const coverageWeight = 0.4;
    const accuracyWeight = 0.3;
    const scriptureRatioWeight = 0.2;
    const diversityWeight = 0.1;

    // Scripture ratio score (ideal: 50-75% scripture)
    const scriptureRatio = metrics.scriptureCount / totalCitations;
    const scriptureRatioScore =
      scriptureRatio >= 0.5 && scriptureRatio <= 0.75
        ? 1.0
        : Math.max(0, 1 - Math.abs(0.625 - scriptureRatio) * 2);

    // Diversity score (both scripture and library present)
    const diversityScore = metrics.scriptureCount > 0 && metrics.libraryCount > 0 ? 1.0 : 0.5;

    return (
      coverageWeight * metrics.coverage +
      accuracyWeight * metrics.accuracy +
      scriptureRatioWeight * scriptureRatioScore +
      diversityWeight * diversityScore
    );
  },

  /**
   * Generate citation quality report
   */
  async generateQualityReport(
    content: string,
    citations: Citation[],
    requirements: CitationRequirements
  ): Promise<{
    coverage: number;
    accuracy: number;
    qualityScore: number;
    errors: string[];
    warnings: string[];
    recommendations: string[];
  }> {
    // Calculate coverage
    const coverage = await this.calculateCitationCoverage(content, citations);

    // Validate citations
    const verification = await this.verifyCitations(citations, requirements);

    // Calculate quality score
    const qualityScore = this.calculateCitationQuality({
      coverage,
      scriptureCount: verification.metrics.scriptureCount,
      libraryCount: verification.metrics.libraryCount,
      accuracy: verification.metrics.accuracy,
    });

    // Generate recommendations
    const recommendations: string[] = [];

    if (coverage < 0.7) {
      recommendations.push('Increase citation coverage to at least 70%');
    }

    if (verification.metrics.scriptureCount < 3) {
      recommendations.push('Add more scripture citations for stronger biblical foundation');
    }

    if (verification.metrics.libraryCount === 0) {
      recommendations.push('Consider adding supporting citations from approved theological works');
    }

    if (verification.metrics.accuracy < 0.9) {
      recommendations.push('Review citations for accuracy - some may not match source material');
    }

    return {
      coverage,
      accuracy: verification.metrics.accuracy,
      qualityScore,
      errors: verification.errors,
      warnings: verification.warnings,
      recommendations,
    };
  },
});

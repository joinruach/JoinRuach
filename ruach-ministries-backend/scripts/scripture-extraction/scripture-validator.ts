#!/usr/bin/env tsx
/**
 * Scripture Extraction Validator
 * Validates extracted scripture data against canonical structure
 * Extends the contract validation system for scripture-specific validation
 */

import { readFile } from 'fs/promises';
import { join } from 'path';
import { ContractError } from '../contract/errors';

interface CanonicalBook {
  name: string;
  chapters: number;
  verses: Record<string, number>;
  totalVerses: number;
  testament: string;
  genre: string;
  canonicalOrder: number;
}

interface CanonicalStructure {
  [shortCode: string]: CanonicalBook | any;
}

interface ExtractedWork {
  workId: string;
  canonicalName: string;
  translatedTitle: string;
  shortCode: string;
  testament: string;
  canonicalOrder: number;
  genre: string;
  totalChapters: number;
  totalVerses: number;
  verses?: string[];
}

interface ExtractedVerse {
  verseId: string;
  work: string;
  chapter: number;
  verse: number;
  text: string;
  paleoHebrewDivineNames?: boolean;
  hasFootnotes?: boolean;
  footnotes?: any;
}

interface ValidationError {
  type: 'error' | 'warning';
  book: string;
  message: string;
  expected?: any;
  actual?: any;
}

interface ValidationReport {
  passed: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  summary: {
    totalBooks: number;
    validated: number;
    failed: number;
    totalErrors: number;
    totalWarnings: number;
  };
}

export class ScriptureValidationError extends ContractError {
  constructor(message: string, public details?: any) {
    super(message);
    this.name = 'ScriptureValidationError';
  }
}

export class ScriptureValidator {
  private canonical: CanonicalStructure;

  constructor(private canonicalPath: string) {}

  async init(): Promise<void> {
    const data = await readFile(this.canonicalPath, 'utf-8');
    this.canonical = JSON.parse(data);
  }

  /**
   * Validate a single work/book against canonical structure
   */
  validateWork(work: ExtractedWork): ValidationError[] {
    const errors: ValidationError[] = [];
    const shortCode = work.shortCode;
    const canonical = this.canonical[shortCode];

    if (!canonical) {
      errors.push({
        type: 'error',
        book: work.canonicalName,
        message: `Unknown book code: ${shortCode}`,
      });
      return errors;
    }

    // Skip metadata entries
    if (shortCode.startsWith('_')) {
      return errors;
    }

    // Validate chapter count
    if (work.totalChapters !== canonical.chapters) {
      errors.push({
        type: 'error',
        book: work.canonicalName,
        message: `Chapter count mismatch`,
        expected: canonical.chapters,
        actual: work.totalChapters,
      });
    }

    // Validate total verse count
    if (work.totalVerses !== canonical.totalVerses) {
      errors.push({
        type: 'error',
        book: work.canonicalName,
        message: `Total verse count mismatch`,
        expected: canonical.totalVerses,
        actual: work.totalVerses,
      });
    }

    // Validate testament
    if (work.testament !== canonical.testament) {
      errors.push({
        type: 'warning',
        book: work.canonicalName,
        message: `Testament mismatch`,
        expected: canonical.testament,
        actual: work.testament,
      });
    }

    return errors;
  }

  /**
   * Validate verses for a specific book
   */
  validateVerses(
    workId: string,
    verses: ExtractedVerse[],
    work: ExtractedWork
  ): ValidationError[] {
    const errors: ValidationError[] = [];
    const shortCode = work.shortCode;
    const canonical = this.canonical[shortCode];

    if (!canonical || shortCode.startsWith('_')) {
      return errors;
    }

    // Group verses by chapter
    const byChapter = new Map<number, ExtractedVerse[]>();
    for (const verse of verses) {
      if (verse.work === workId) {
        if (!byChapter.has(verse.chapter)) {
          byChapter.set(verse.chapter, []);
        }
        byChapter.get(verse.chapter)!.push(verse);
      }
    }

    // Validate each chapter
    for (const [chapterNum, expectedCount] of Object.entries(canonical.verses)) {
      const chNum = parseInt(chapterNum, 10);
      const chapterVerses = byChapter.get(chNum) || [];

      // Missing chapter
      if (chapterVerses.length === 0) {
        errors.push({
          type: 'error',
          book: work.canonicalName,
          message: `Missing chapter ${chNum} (expected ${expectedCount} verses)`,
          expected: expectedCount,
          actual: 0,
        });
        continue;
      }

      // Wrong verse count
      if (chapterVerses.length !== expectedCount) {
        errors.push({
          type: 'error',
          book: work.canonicalName,
          message: `Chapter ${chNum}: verse count mismatch`,
          expected: expectedCount,
          actual: chapterVerses.length,
        });
      }

      // Check for duplicates
      const verseNumbers = chapterVerses.map((v) => v.verse);
      const uniqueVerses = new Set(verseNumbers);
      if (uniqueVerses.size !== verseNumbers.length) {
        const duplicates = verseNumbers.filter(
          (v, i) => verseNumbers.indexOf(v) !== i
        );
        errors.push({
          type: 'error',
          book: work.canonicalName,
          message: `Chapter ${chNum}: duplicate verses found`,
          actual: Array.from(new Set(duplicates)),
        });
      }

      // Check for gaps
      const expectedRange = Array.from(
        { length: expectedCount as number },
        (_, i) => i + 1
      );
      const actualSet = new Set(verseNumbers);
      const missing = expectedRange.filter((v) => !actualSet.has(v));
      if (missing.length > 0) {
        errors.push({
          type: 'error',
          book: work.canonicalName,
          message: `Chapter ${chNum}: missing verses`,
          expected: expectedRange,
          actual: missing,
        });
      }

      // Check for out-of-range verses
      const outOfRange = verseNumbers.filter((v) => v > (expectedCount as number) || v < 1);
      if (outOfRange.length > 0) {
        errors.push({
          type: 'error',
          book: work.canonicalName,
          message: `Chapter ${chNum}: verse numbers out of range (1-${expectedCount})`,
          actual: outOfRange,
        });
      }

      // Validate verse text quality
      for (const verse of chapterVerses) {
        const text = verse.text || '';
        const textLen = text.trim().length;

        // Empty verse
        if (textLen === 0) {
          errors.push({
            type: 'error',
            book: work.canonicalName,
            message: `${verse.verseId}: Empty verse text`,
          });
        }

        // Suspiciously short
        if (textLen > 0 && textLen < 5) {
          errors.push({
            type: 'warning',
            book: work.canonicalName,
            message: `${verse.verseId}: Very short verse (${textLen} chars): "${text}"`,
          });
        }

        // Suspiciously long (likely extraction error)
        if (textLen > 5000) {
          errors.push({
            type: 'error',
            book: work.canonicalName,
            message: `${verse.verseId}: Extremely long verse (${textLen} chars) - likely extraction error`,
          });
        }
      }
    }

    // Check for extra chapters not in canonical structure
    const canonicalChapters = new Set(
      Object.keys(canonical.verses).map((c) => parseInt(c, 10))
    );
    const extractedChapters = new Set(byChapter.keys());
    const extraChapters = Array.from(extractedChapters).filter(
      (ch) => !canonicalChapters.has(ch)
    );

    if (extraChapters.length > 0) {
      errors.push({
        type: 'error',
        book: work.canonicalName,
        message: `Extra chapters found that don't exist in canonical structure`,
        actual: extraChapters,
      });
    }

    return errors;
  }

  /**
   * Validate complete extraction (works + verses)
   */
  async validateExtraction(
    worksPath: string,
    versesDir: string
  ): Promise<ValidationReport> {
    // Load works
    const worksData = await readFile(worksPath, 'utf-8');
    const works: ExtractedWork[] = JSON.parse(worksData);

    // Load all verse chunks
    const { readdir } = await import('fs/promises');
    const files = await readdir(versesDir);
    const verseFiles = files.filter(
      (f) => f.startsWith('verses_chunk_') && f.endsWith('.json')
    );

    let allVerses: ExtractedVerse[] = [];
    for (const file of verseFiles) {
      const versesData = await readFile(join(versesDir, file), 'utf-8');
      const verses: ExtractedVerse[] = JSON.parse(versesData);
      allVerses = allVerses.concat(verses);
    }

    // Validate each work
    const allErrors: ValidationError[] = [];
    const allWarnings: ValidationError[] = [];

    for (const work of works) {
      // Validate work metadata
      const workErrors = this.validateWork(work);
      workErrors.forEach((err) => {
        if (err.type === 'error') {
          allErrors.push(err);
        } else {
          allWarnings.push(err);
        }
      });

      // Validate verses
      const verseErrors = this.validateVerses(work.workId, allVerses, work);
      verseErrors.forEach((err) => {
        if (err.type === 'error') {
          allErrors.push(err);
        } else {
          allWarnings.push(err);
        }
      });
    }

    const report: ValidationReport = {
      passed: allErrors.length === 0,
      errors: allErrors,
      warnings: allWarnings,
      summary: {
        totalBooks: works.length,
        validated: works.length,
        failed: new Set(allErrors.map((e) => e.book)).size,
        totalErrors: allErrors.length,
        totalWarnings: allWarnings.length,
      },
    };

    return report;
  }

  /**
   * Format validation report for console output
   */
  formatReport(report: ValidationReport): string {
    const lines: string[] = [];

    lines.push('\n');
    lines.push('='.repeat(80));
    lines.push('SCRIPTURE EXTRACTION VALIDATION REPORT');
    lines.push('='.repeat(80));
    lines.push('');

    // Summary
    lines.push(`Total Books: ${report.summary.totalBooks}`);
    lines.push(`Validated: ${report.summary.validated}`);
    lines.push(`Failed: ${report.summary.failed}`);
    lines.push(`Total Errors: ${report.summary.totalErrors}`);
    lines.push(`Total Warnings: ${report.summary.totalWarnings}`);
    lines.push('');

    // Group errors by book
    const errorsByBook = new Map<string, ValidationError[]>();
    for (const error of report.errors) {
      if (!errorsByBook.has(error.book)) {
        errorsByBook.set(error.book, []);
      }
      errorsByBook.get(error.book)!.push(error);
    }

    // Display errors
    if (report.errors.length > 0) {
      lines.push('ERRORS:');
      lines.push('-'.repeat(80));

      for (const [book, errors] of errorsByBook.entries()) {
        lines.push(`\n${book}:`);
        for (const error of errors) {
          lines.push(`  ❌ ${error.message}`);
          if (error.expected !== undefined) {
            lines.push(`     Expected: ${JSON.stringify(error.expected)}`);
          }
          if (error.actual !== undefined) {
            lines.push(`     Actual: ${JSON.stringify(error.actual)}`);
          }
        }
      }
      lines.push('');
    }

    // Group warnings by book
    const warningsByBook = new Map<string, ValidationError[]>();
    for (const warning of report.warnings) {
      if (!warningsByBook.has(warning.book)) {
        warningsByBook.set(warning.book, []);
      }
      warningsByBook.get(warning.book)!.push(warning);
    }

    // Display warnings
    if (report.warnings.length > 0) {
      lines.push('WARNINGS:');
      lines.push('-'.repeat(80));

      for (const [book, warnings] of warningsByBook.entries()) {
        lines.push(`\n${book}:`);
        for (const warning of warnings) {
          lines.push(`  ⚠️  ${warning.message}`);
          if (warning.expected !== undefined) {
            lines.push(`     Expected: ${JSON.stringify(warning.expected)}`);
          }
          if (warning.actual !== undefined) {
            lines.push(`     Actual: ${JSON.stringify(warning.actual)}`);
          }
        }
      }
      lines.push('');
    }

    // Final status
    lines.push('='.repeat(80));
    if (report.passed) {
      lines.push('✅ VALIDATION PASSED');
    } else {
      lines.push('❌ VALIDATION FAILED');
      lines.push('');
      lines.push('DO NOT IMPORT TO DATABASE UNTIL ALL ERRORS ARE RESOLVED');
    }
    lines.push('='.repeat(80));
    lines.push('');

    return lines.join('\n');
  }
}

// CLI usage
if (require.main === module) {
  const main = async () => {
    const args = process.argv.slice(2);

    if (args.length < 2) {
      console.error('Usage: tsx scripture-validator.ts <works.json> <verses_dir>');
      console.error('');
      console.error('Example:');
      console.error(
        '  tsx scripture-validator.ts output/works.json output/'
      );
      process.exit(1);
    }

    const [worksPath, versesDir] = args;
    const canonicalPath = join(__dirname, 'canonical-structure.json');

    console.log('📖 Scripture Extraction Validator');
    console.log(`Canonical: ${canonicalPath}`);
    console.log(`Works: ${worksPath}`);
    console.log(`Verses: ${versesDir}`);
    console.log('');

    const validator = new ScriptureValidator(canonicalPath);
    await validator.init();

    const report = await validator.validateExtraction(worksPath, versesDir);

    console.log(validator.formatReport(report));

    // Exit with error code if validation failed
    process.exit(report.passed ? 0 : 1);
  };

  main().catch((error) => {
    console.error('❌ Validation error:', error);
    process.exit(1);
  });
}

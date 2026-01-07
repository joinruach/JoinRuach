#!/usr/bin/env node
/**
 * Analyze Genesis Extraction
 * Validates verse counts, checks for duplicates, missing verses, and generates review report
 */

const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, 'output/main');
const WORKS_FILE = path.join(OUTPUT_DIR, 'works.json');
const CANONICAL_STRUCTURE = path.join(__dirname, '../ruach-ministries-backend/scripts/scripture-extraction/canonical-structure.json');

// Expected canonical structure
const EXPECTED_GENESIS = {
  chapters: 50,
  totalVerses: 1533,
  chapter1: 31,
  chapter50: 26,
};

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function getAllGenesisVerses() {
  const verses = [];
  const files = fs.readdirSync(OUTPUT_DIR).filter(f => f.startsWith('verses_chunk_') && f.endsWith('.json'));
  
  for (const file of files) {
    const fileVerses = readJson(path.join(OUTPUT_DIR, file));
    verses.push(...fileVerses.filter(v => v.work === 'yah-gen'));
  }
  
  return verses;
}

function analyzeGenesis() {
  console.log('📖 Analyzing Genesis Extraction\n');
  console.log('=' .repeat(60));
  
  // Read works data
  const works = readJson(WORKS_FILE);
  const genesisWork = works.find(w => w.workId === 'yah-gen');
  
  if (!genesisWork) {
    console.error('❌ Genesis work not found in works.json');
    return;
  }
  
  console.log('\n📊 Work Metadata:');
  console.log(`  Work ID: ${genesisWork.workId}`);
  console.log(`  Canonical Name: ${genesisWork.canonicalName}`);
  console.log(`  Chapters Reported: ${genesisWork.totalChapters}`);
  console.log(`  Verses Reported: ${genesisWork.totalVerses}`);
  console.log(`  Expected Chapters: ${EXPECTED_GENESIS.chapters}`);
  console.log(`  Expected Verses: ${EXPECTED_GENESIS.totalVerses}`);
  
  // Get all actual verse records
  const allVerses = getAllGenesisVerses();
  const uniqueVerses = new Map();
  const versesByChapter = new Map();
  
  console.log(`\n📝 Verse Records Found: ${allVerses.length}`);
  
  // Analyze verses
  for (const verse of allVerses) {
    const key = `${verse.chapter}-${verse.verse}`;
    
    // Track unique verses
    if (!uniqueVerses.has(key)) {
      uniqueVerses.set(key, verse);
    }
    
    // Group by chapter
    if (!versesByChapter.has(verse.chapter)) {
      versesByChapter.set(verse.chapter, new Set());
    }
    versesByChapter.get(verse.chapter).add(verse.verse);
  }
  
  console.log(`  Unique Verses: ${uniqueVerses.size}`);
  console.log(`  Duplicates: ${allVerses.length - uniqueVerses.size}`);
  
  // Find missing verses
  const missingVerses = [];
  const foundVerses = new Set(Array.from(uniqueVerses.keys()));
  
  for (let chapter = 1; chapter <= 50; chapter++) {
    const chapterVerses = versesByChapter.get(chapter) || new Set();
    
    // Determine expected verse count for this chapter
    // (Simplified - in reality, would read from canonical structure)
    let maxVerse = 0;
    chapterVerses.forEach(v => {
      if (v > maxVerse) maxVerse = v;
    });
    
    // Check for gaps
    for (let verse = 1; verse <= maxVerse; verse++) {
      if (!chapterVerses.has(verse)) {
        missingVerses.push({ chapter, verse });
      }
    }
  }
  
  // Check first and last verses
  const firstVerse = Array.from(uniqueVerses.values()).find(v => v.chapter === 1 && v.verse === 1);
  const lastVerses = Array.from(uniqueVerses.values())
    .filter(v => v.chapter === 50)
    .sort((a, b) => b.verse - a.verse);
  const lastVerse = lastVerses[0];
  
  console.log('\n🔍 Quality Checks:');
  console.log(`  Chapter 1, Verse 1 present: ${firstVerse ? '✅' : '❌'}`);
  if (firstVerse) {
    console.log(`    Text preview: "${firstVerse.text.substring(0, 60)}..."`);
  }
  
  console.log(`  Chapter 50, Last verse present: ${lastVerse ? '✅' : '❌'}`);
  if (lastVerse) {
    console.log(`    Last verse: ${lastVerse.chapter}:${lastVerse.verse}`);
    console.log(`    Text preview: "${lastVerse.text.substring(0, 60)}..."`);
  }
  
  console.log(`  Missing verses: ${missingVerses.length}`);
  if (missingVerses.length > 0 && missingVerses.length <= 20) {
    console.log(`    Missing: ${missingVerses.map(v => `${v.chapter}:${v.verse}`).join(', ')}`);
  } else if (missingVerses.length > 20) {
    console.log(`    Missing (first 20): ${missingVerses.slice(0, 20).map(v => `${v.chapter}:${v.verse}`).join(', ')}...`);
  }
  
  // Check for duplicates in works.json verses array
  const versesArray = genesisWork.verses || [];
  const uniqueInArray = new Set(versesArray);
  const duplicatesInArray = versesArray.length - uniqueInArray.size;
  
  console.log(`\n📋 Works.json Array Analysis:`);
  console.log(`  Total verse IDs in array: ${versesArray.length}`);
  console.log(`  Unique verse IDs: ${uniqueInArray.size}`);
  console.log(`  Duplicates in array: ${duplicatesInArray}`);
  
  // Spot-check sample verses
  console.log('\n🔎 Spot-Check Sample Verses:');
  const sampleVerses = [
    { chapter: 1, verse: 1 },
    { chapter: 1, verse: 31 },
    { chapter: 2, verse: 1 },
    { chapter: 25, verse: 1 },
    { chapter: 50, verse: 26 },
  ];
  
  for (const sample of sampleVerses) {
    const verse = Array.from(uniqueVerses.values()).find(
      v => v.chapter === sample.chapter && v.verse === sample.verse
    );
    if (verse) {
      const preview = verse.text.substring(0, 80).replace(/\n/g, ' ');
      console.log(`  ✅ ${sample.chapter}:${sample.verse} - "${preview}..."`);
      console.log(`     Paleo-Hebrew: ${verse.paleoHebrewDivineNames ? '✅' : '❌'}`);
    } else {
      console.log(`  ❌ ${sample.chapter}:${sample.verse} - MISSING`);
    }
  }
  
  // Generate summary
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 SUMMARY:');
  
  const chapterCount = versesByChapter.size;
  const verseCount = uniqueVerses.size;
  
  const issues = [];
  if (chapterCount !== EXPECTED_GENESIS.chapters) {
    issues.push(`Chapter count mismatch: expected ${EXPECTED_GENESIS.chapters}, got ${chapterCount}`);
  }
  if (verseCount !== EXPECTED_GENESIS.totalVerses) {
    issues.push(`Verse count mismatch: expected ${EXPECTED_GENESIS.totalVerses}, got ${verseCount}`);
  }
  if (missingVerses.length > 0) {
    issues.push(`${missingVerses.length} missing verses detected`);
  }
  if (duplicatesInArray > 0) {
    issues.push(`${duplicatesInArray} duplicate verse IDs in works.json array`);
  }
  if (!firstVerse) {
    issues.push('Missing Genesis 1:1');
  }
  
  if (issues.length === 0) {
    console.log('✅ PASSED: All quality checks passed!');
  } else {
    console.log('⚠️  ISSUES FOUND:');
    issues.forEach(issue => console.log(`  - ${issue}`));
  }
  
  // Write detailed report
  const report = {
    analysisDate: new Date().toISOString(),
    workMetadata: {
      workId: genesisWork.workId,
      canonicalName: genesisWork.canonicalName,
      reportedChapters: genesisWork.totalChapters,
      reportedVerses: genesisWork.totalVerses,
    },
    expected: EXPECTED_GENESIS,
    actual: {
      chaptersFound: chapterCount,
      uniqueVerses: verseCount,
      totalVerseRecords: allVerses.length,
      duplicates: allVerses.length - uniqueVerses.size,
    },
    quality: {
      firstVersePresent: !!firstVerse,
      lastVersePresent: !!lastVerse,
      missingVerses: missingVerses.slice(0, 50), // Limit to first 50
      duplicatesInArray: duplicatesInArray,
    },
    sampleVerses: sampleVerses.map(s => {
      const v = Array.from(uniqueVerses.values()).find(
        v => v.chapter === s.chapter && v.verse === s.verse
      );
      return v ? {
        chapter: s.chapter,
        verse: s.verse,
        present: true,
        textPreview: v.text.substring(0, 100),
        paleoHebrew: v.paleoHebrewDivineNames,
      } : {
        chapter: s.chapter,
        verse: s.verse,
        present: false,
      };
    }),
  };
  
  const reportPath = path.join(OUTPUT_DIR, 'genesis-analysis-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📄 Detailed report saved to: ${reportPath}`);
  
  return report;
}

// Run analysis
try {
  analyzeGenesis();
} catch (error) {
  console.error('❌ Analysis failed:', error);
  process.exit(1);
}

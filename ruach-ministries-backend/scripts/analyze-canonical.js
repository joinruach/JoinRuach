const data = require('./scripture-extraction/canonical-structure.json');

let totalVerses = 0;
let bookCount = 0;
let invalid = [];
const testaments = { old: 0, new: 0, apocrypha: 0, deuterocanonical: 0, pseudepigrapha: 0 };

for (const [code, book] of Object.entries(data)) {
  bookCount++;

  if (!book.verses || typeof book.verses !== 'object') {
    invalid.push({ code, reason: 'no verses object' });
    continue;
  }

  const verses = Object.values(book.verses);
  const bookTotal = verses.reduce((sum, v) => sum + (parseInt(v) || 0), 0);
  totalVerses += bookTotal;

  if (book.testament) {
    testaments[book.testament] = (testaments[book.testament] || 0) + 1;
  }
}

console.log('=== Canonical Structure Analysis ===');
console.log('Total books:', bookCount);
console.log('Invalid entries:', invalid.length, invalid);
console.log('Total verses:', totalVerses.toLocaleString());
console.log('\nBy Testament:');
for (const [t, count] of Object.entries(testaments)) {
  console.log(`  ${t}: ${count} books`);
}

console.log('\nFirst 5 books:');
Object.entries(data).slice(0, 5).forEach(([code, book]) => {
  const vCount = Object.values(book.verses || {}).reduce((sum, v) => sum + v, 0);
  console.log(`  ${code}: ${book.name} (${book.chapters} chapters, ${vCount} verses)`);
});

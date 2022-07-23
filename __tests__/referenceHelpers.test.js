import deepEqual from 'deep-equal';
// helpers
import {
    cleanupReference,
    convertReferenceChunksToString,
    getVerses,
    parseReferenceToList,
} from '../src/helpers/referenceHelpers';

const tests = [
  { ref: 'front:intro', expectConverted: 'front:intro', expectedCleaned: { chapter: 'front', verse: 'intro' }, expectParsed: [{ chapter: 'front', verse: 'intro' }] },
  { ref: '1:intro', expectConverted: '1:intro', expectedCleaned: { chapter: 1, verse: 'intro' }, expectParsed: [{ chapter: 1, verse: 'intro' }] },
  { ref: '1:1', expectConverted: '1:1', expectedCleaned: { chapter: 1, verse: 1 }, expectParsed: [{ chapter: 1, verse: 1 }] },
  { ref: '1:1-2', expectConverted: '1:1-2', expectedCleaned: { chapter: 1, verse: '1-2', verseStr: '1-2' }, expectParsed: [{ chapter: 1, verse: 1, endVerse: 2 }] },
  { ref: '1:1\u20142', expectConverted: '1:1-2', expectedCleaned: { chapter: 1, verse: '1-2', verseStr: '1-2' }, expectParsed: [{ chapter: 1, verse: 1, endVerse: 2 }] }, // try with EM DASH
  { ref: '1:1\u20132', expectConverted: '1:1-2', expectedCleaned: { chapter: 1, verse: '1-2', verseStr: '1-2' }, expectParsed: [{ chapter: 1, verse: 1, endVerse: 2 }] }, // try with EN DASH
  { ref: '1:1\u20102', expectConverted: '1:1-2', expectedCleaned: { chapter: 1, verse: '1-2', verseStr: '1-2' }, expectParsed: [{ chapter: 1, verse: 1, endVerse: 2 }] }, // try with HYPHEN
  { ref: '1:1\u00AD2', expectConverted: '1:1-2', expectedCleaned: { chapter: 1, verse: '1-2', verseStr: '1-2' }, expectParsed: [{ chapter: 1, verse: 1, endVerse: 2 }] }, // try with SOFT HYPHEN
  { ref: '1:1\u20112', expectConverted: '1:1-2', expectedCleaned: { chapter: 1, verse: '1-2', verseStr: '1-2' }, expectParsed: [{ chapter: 1, verse: 1, endVerse: 2 }] }, // try with NON-BREAKING HYPHEN
  { ref: '1:1,3', expectConverted: '1:1,3', expectedCleaned: { chapter: 1, verse: '1,3', verseStr: '1,3' }, expectParsed: [{ chapter: 1, verse: 1 }, { chapter: 1, verse: 3 }] },
  { ref: '1:1-2,4', expectConverted: '1:1-2,4', expectedCleaned: { chapter: 1, verse: '1-2,4', verseStr: '1-2,4' }, expectParsed: [{ chapter: 1, verse: 1, endVerse: 2 }, { chapter: 1, verse: 4 }] },
  { ref: '1:1-2a,4', expectConverted: '1:1-2,4', expectedCleaned: { chapter: 1, verse: '1-2,4', verseStr: '1-2,4' }, expectParsed: [{ chapter: 1, verse: 1, endVerse: 2 }, { chapter: 1, verse: 4 }] },
  { ref: '1:1b-2a,4', expectConverted: '1:1-2,4', expectedCleaned: { chapter: 1, verse: '1-2,4', verseStr: '1-2,4' }, expectParsed: [{ chapter: 1, verse: 1, endVerse: 2 }, { chapter: 1, verse: 4 }] },
  { ref: '1:1-2,4b', expectConverted: '1:1-2,4', expectedCleaned: { chapter: 1, verse: '1-2,4', verseStr: '1-2,4' }, expectParsed: [{ chapter: 1, verse: 1, endVerse: 2 }, { chapter: 1, verse: 4 }] },
  { ref: '1:1-2,4b,5-7a', expectConverted: '1:1-2,4,5-7', expectedCleaned: { chapter: 1, verse: '1-2,4,5-7', verseStr: '1-2,4,5-7' }, expectParsed: [{ chapter: 1, verse: 1, endVerse: 2 }, { chapter: 1, verse: 4 }, { chapter: 1, verse: 5, endVerse: 7 }] },
  { ref: '1:1-2;2:4', expectConverted: '1:1-2;2:4', expectedCleaned: { chapter: 1, verse: '1-2;2:4', verseStr: '1-2;2:4' }, expectParsed: [{ chapter: 1, verse: 1, endVerse: 2 }, { chapter: 2, verse: 4 }] },
  { ref: '1:1-2b;2:4a', expectConverted: '1:1-2;2:4', expectedCleaned: { chapter: 1, verse: '1-2;2:4', verseStr: '1-2;2:4' }, expectParsed: [{ chapter: 1, verse: 1, endVerse: 2 }, { chapter: 2, verse: 4 }] },
  { ref: '1:1c-2b;2:4-5', expectConverted: '1:1-2;2:4-5', expectedCleaned: { chapter: 1, verse: '1-2;2:4-5', verseStr: '1-2;2:4-5' }, expectParsed: [{ chapter: 1, verse: 1, endVerse: 2 }, { chapter: 2, verse: 4, endVerse: 5 }] },
  { ref: '1:12-2:4', expectConverted: '1:12-2:4', expectedCleaned: { chapter: 1, verse: '12-2:4', verseStr: '12-2:4' }, expectParsed: [{ chapter: 1, verse: 12, endChapter: 2, endVerse: 4 }] },
  { ref: '1:12-2:4,6', expectConverted: '1:12-2:4;2:6', expectedCleaned: { chapter: 1, verse: '12-2:4;2:6', verseStr: '12-2:4;2:6' }, expectParsed: [{ chapter: 1, verse: 12, endChapter: 2, endVerse: 4 }, { chapter: 2, verse: 6 }] },
  { ref: '1:12-2:4;3:5-4:2', expectConverted: '1:12-2:4;3:5-4:2', expectedCleaned: { chapter: 1, verse: '12-2:4;3:5-4:2', verseStr: '12-2:4;3:5-4:2' }, expectParsed: [{ chapter: 1, verse: 12, endChapter: 2, endVerse: 4 }, { chapter: 3, verse: 5, endChapter: 4, endVerse: 2 }] },
  { ref: '1:1-2,2:4', expectConverted: '1:1-2;2:4', expectedCleaned: { chapter: 1, verse: '1-2;2:4', verseStr: '1-2;2:4' }, expectParsed: [{ chapter: 1, verse: 1, endVerse: 2 }, { chapter: 2, verse: 4 }] },
  { ref: '1:1-2b,2:4c', expectConverted: '1:1-2;2:4', expectedCleaned: { chapter: 1, verse: '1-2;2:4', verseStr: '1-2;2:4' }, expectParsed: [{ chapter: 1, verse: 1, endVerse: 2 }, { chapter: 2, verse: 4 }] },
];

describe('Tests parseReferenceToList', function () {
  it('Test parseReferenceToList for test cases', () => {
    for (const test of tests) {
      const ref = test.ref;
      const expect_ = test.expectParsed;
      const result = parseReferenceToList(ref);

      if (!deepEqual(result, expect_, { strict: true })) {
        console.log(`expect ${ref} to parse to ${JSON.stringify(expect_)}`);
        console.log(`  but got ${JSON.stringify(result)}`);
        expect(result).toEqual(expect_);
      }
    }
  });

  it('Test convertReferenceChunksToString for test cases', () => {
    for (const test of tests) {
      const ref = test.ref;
      const expect_ = test.expectConverted;
      const chunks = parseReferenceToList(ref);
      const cleanedRef = convertReferenceChunksToString(chunks);

      if (!deepEqual(cleanedRef, expect_, { strict: true })) {
        console.log(`expect "${ref}" to parse to ${JSON.stringify(expect_)}`);
        console.log(`  but got ${cleanedRef}`);
        expect(cleanedRef).toEqual(expect_);
      }
    }
  });

  it('Test cleanupReference for test cases', () => {
    for (const test of tests) {
      const ref = test.ref;
      const expect_ = test.expectedCleaned;
      expect_.cleanedRef = test.expectConverted;
      const results = cleanupReference(ref);

      if (!deepEqual(results, expect_, { strict: true })) {
        console.log(`expect "${ref}" to parse to ${JSON.stringify(expect_)}`);
        console.log(`  but got ${JSON.stringify(results)}`);
        expect(results).toEqual(expect_);
      }
    }
  });
});

const bookData = {
  '1': {
    'front': '1:Front;',
    '1': '1:1;',
    '2': '1:2;',
    '3-4': '1:3-4;',
    '5': '1:5;',
    '6': '1:6;',
    '7': '1:7;',
  },
  '2': {
    'front': '2:Front;',
    '1': '2:1;',
    '2': '2:2;',
    '3-4': '2:3-4;',
    '5': '2:5;',
    '6': '2:6;',
    '7': '2:7;',
  },
};

const checks = [
  { ref: '1:1', expectedVerses: [{ chapter: 1, verse: 1, verseData: '1:1;' }], expectedStr: '1:1;' },
  { ref: '1:8', expectedVerses: [{ chapter: 1, verse: 8, verseData: undefined }], expectedStr: '1:1;' },
  { ref: '3:1', expectedVerses: [{ chapter: 3, verse: 1, verseData: undefined }], expectedStr: '1:1;' },
  { ref: '1:front', expectedVerses: [{ chapter: 1, verse: 'front', verseData: '1:Front;' }], expectedStr: '1:Front;' },
  { ref: '1:intro', expectedVerses: [{ chapter: 1, verse: 'intro', verseData: undefined }], expectedStr: null },
  { ref: 'intro:intro', expectedVerses: [{ chapter: 'intro', verse: 'intro', verseData: undefined }], expectedStr: null },
  { ref: '1:1-2', expectedVerses: [{ chapter: 1, verse: 1, verseData: '1:1;' }, { chapter: 1, verse: 2, verseData: '1:2;' }], expectedStr: '1:1;1:2;' },
  { ref: '1:1,2', expectedVerses: [{ chapter: 1, verse: 1, verseData: '1:1;' }, { chapter: 1, verse: 2, verseData: '1:2;' }], expectedStr: '1:1;1:2;' },
  { ref: '3:1', expectedVerses: [{ chapter: 3, verse: 1, verseData: undefined }], expectedStr: null },
  { ref: '1:7-2:1', expectedVerses: [{ chapter: 1, verse: 7, verseData: '1:7;' }, { chapter: 2, verse: 1, verseData: '2:1;' }], expectedStr: '1:7;2:1;' },
  { ref: '1:2-3', expectedVerses: [{ chapter: 1, verse: 2, verseData: '1:2;' }, { chapter: 1, verse: '3-4', verseData: '1:3-4;' }], expectedStr: '1:2;1:3-4;' },
  { ref: '1:2-5', expectedVerses: [{ chapter: 1, verse: 2, verseData: '1:2;' }, { chapter: 1, verse: '3-4', verseData: '1:3-4;' }, { chapter: 1, verse: 5, verseData: '1:5;' }], expectedStr: '1:2;1:3-4;1:5;' },
  { ref: '1:3-4', expectedVerses: [{ chapter: 1, verse: '3-4', verseData: '1:3-4;' }], expectedStr: '1:3-4;' },
  { ref: '1:3', expectedVerses: [{ chapter: 1, verse: '3-4', verseData: '1:3-4;' }], expectedStr: '1:3-4;' },
  { ref: '1:4', expectedVerses: [{ chapter: 1, verse: '3-4', verseData: '1:3-4;' }], expectedStr: '1:3-4;' },
  { ref: '2:4-5', expectedVerses: [{ chapter: 2, verse: '3-4', verseData: '2:3-4;' }, { chapter: 2, verse: 5, verseData: '2:5;' } ], expectedStr: '2:3-4;2:5;' },
  { ref: '2:7-3:1', expectedVerses: [{ chapter: 2, verse: 7, verseData: '2:7;' }], expectedStr: '2:7;' },
  { ref: '2:7;3:1', expectedVerses: [{ chapter: 2, verse: 7, verseData: '2:7;' }, { chapter: 3, verse: 1, verseData: undefined }], expectedStr: null },
];

describe('test references', () => {
  test('getVerses() tests should pass', () => {
    checks.forEach(check => {
      const expected = check.expectedVerses;
      const ref = check.ref;
      const result = getVerses(bookData, ref);

      if (!deepEqual(result, expected)) {
        console.log(`Failing test "${ref}": Expected "${JSON.stringify(expected)}"\nBut got "${JSON.stringify(result)}"`);
      }
      expect(expected).toEqual(result);
    });
  });
});

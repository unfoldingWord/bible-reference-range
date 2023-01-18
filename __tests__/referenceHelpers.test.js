import deepEqual from 'deep-equal';
// helpers
import {
    cleanupReference,
    convertReferenceChunksToString,
    doesReferenceContain,
    getVerses,
    parseReferenceToList,
} from '../src/helpers/referenceHelpers';

const tests = [
  { ref: '1:3ff', expectConverted: '1:3ff', expectedCleaned: {chapter: 1, verse: '3ff', verseStr: '3ff'}, expectParsed: [{chapter: 1, verse: 3, endVerse: 'ff'}]},
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
  { ref: '1-3', expectConverted: '1-3', expectedCleaned: {chapter: 1}, expectParsed: [{ chapter: 1, endChapter: 3 }] },
  { ref: '3', expectConverted: '3', expectedCleaned: {chapter: 3}, expectParsed: [{ chapter: 3 }] },
  { ref: '1:1-2;3-4', expectConverted: '1:1-2;3-4', expectedCleaned: { chapter: 1, verse: '1-2;3-4', verseStr: '1-2;3-4' }, expectParsed: [{ chapter: 1, verse: 1, endVerse: 2 },{ chapter: 3, endChapter: 4 }] },
  { ref: '1:3ff', expectConverted: '1:3ff', expectedCleaned: {chapter: 1, verse: '3ff', verseStr: '3ff'}, expectParsed: [{chapter: 1, verse: 3, endVerse: 'ff'}]},
  { ref: '1:1-23;2:7ff', expectConverted: '1:1-23;2:7ff', expectedCleaned: {chapter: 1, verse: '1-23;2:7ff', verseStr: '1-23;2:7ff'}, expectParsed: [{chapter: 1, verse: 1, endVerse: 23}, {chapter: 2, verse: 7, endVerse: 'ff'}]},
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

const searchReferenceTests = [
  { ref: 'front:intro', containedRef: 'front:intro', nonContainedRef: '1:intro' },
  { ref: '1:intro', containedRef: '1:intro', nonContainedRef: '2:intro' },
  { ref: '1:1', containedRef: '1:1', nonContainedRef: '1:2', containedRangeLoose: '1:1-3', nonContainedRangeLoose: '1:2-4', nonContainedRangeStrict: '1:1-3' },
  { ref: '1:1-2', containedRef: '1:2', nonContainedRef: '1:3', containedRangeLoose: '1:2-5', containedRangeStrict: '1:1-2', nonContainedRangeLoose: '1:3-5', nonContainedRangeStrict: '1:2-5' },
  { ref: '1:1\u20142', containedRef: '1:2', nonContainedRef: '2:1', containedRangeLoose: '1:2-5', containedRangeStrict: '1:1-2', nonContainedRangeLoose: '1:3-5', nonContainedRangeStrict: '1:2-5' }, // try with EM DASH
  { ref: '1:1\u20132', containedRef: '1:1', nonContainedRef: '3:4', containedRangeLoose: '1:2-5', containedRangeStrict: '1:1-2', nonContainedRangeLoose: '1:3-5', nonContainedRangeStrict: '1:2-5' }, // try with EN DASH
  { ref: '1:1\u20102', containedRef: '1:2', nonContainedRef: '1:intro', containedRangeLoose: '1:2-5', containedRangeStrict: '1:1-2', nonContainedRangeLoose: '1:3-5', nonContainedRangeStrict: '1:2-5' }, // try with HYPHEN
  { ref: '1:1\u00AD2', containedRef: '1:1', nonContainedRef: '1:3', containedRangeLoose: '1:2-5', containedRangeStrict: '1:1-2', nonContainedRangeLoose: '1:3-5', nonContainedRangeStrict: '1:2-5' }, // try with SOFT HYPHEN
  { ref: '1:1\u20112', containedRef: '1:2', nonContainedRef: '1:12', containedRangeLoose: '1:2-5', containedRangeStrict: '1:1-2', nonContainedRangeLoose: '1:3-5', nonContainedRangeStrict: '1:2-5' }, // try with NON-BREAKING HYPHEN
  { ref: '1:1,3', containedRef: '1:3', nonContainedRef: '1:2', containedRangeLoose: '1:2-5', nonContainedRangeLoose: '1:4-6', nonContainedRangeStrict: '1:2-5' },
  { ref: '1:1-2,4', containedRef: '1:2', nonContainedRef: '1:3', containedRangeLoose: '1:3-7', containedRangeStrict: '1:1-2', nonContainedRangeLoose: '1:5-9', nonContainedRangeStrict: '1:3-7' },
  { ref: '1:1-2a,4', containedRef: '1:2', nonContainedRef: '1:3', containedRangeLoose: '1:2-6', containedRangeStrict: '1:1-2', nonContainedRangeLoose: '1:5-9', nonContainedRangeStrict: '1:2-6' },
  { ref: '1:1b-2a,4', containedRef: '1:2', nonContainedRef: '1:3', containedRangeLoose: '1:2-6', containedRangeStrict: '1:1-2', nonContainedRangeLoose: '1:5-9', nonContainedRangeStrict: '1:2-6' },
  { ref: '1:1-2,4b', containedRef: '1:4', nonContainedRef: '1:3', containedRangeLoose: '1:2-6', containedRangeStrict: '1:1-2', nonContainedRangeLoose: '1:5-9', nonContainedRangeStrict: '1:2-6' },
  { ref: '1:1-2,4b,5-7a', containedRef: '1:7', nonContainedRef: '1:3', containedRangeLoose: '1:1-9', containedRangeStrict: '1:5-7', nonContainedRangeLoose: '1:8-9', nonContainedRangeStrict: '1:1-9' },
  { ref: '1:1-2;2:4', containedRef: '2:4', nonContainedRef: '2:2', containedRangeLoose: '1:2-7', containedRangeStrict: '1:1-2', nonContainedRangeLoose: '2:1-3', nonContainedRangeStrict: '1:2-7' },
  { ref: '1:1-2b;2:4a', containedRef: '2:4', nonContainedRef: '2:3', containedRangeLoose: '2:2-6', containedRangeStrict: '1:1-2', nonContainedRangeLoose: '1:4-8', nonContainedRangeStrict: '2:2-6' },
  { ref: '1:1c-2b;2:4-5', containedRef: '1:1', nonContainedRef: '1:3', containedRangeLoose: '2:1-9', containedRangeStrict: '2:4-5', nonContainedRangeLoose: '2:8-20', nonContainedRangeStrict: '2:1-9' },
  { ref: '1:12-2:4', containedRef: '2:1', nonContainedRef: '1:11', containedRangeLoose: '2:1-7', containedRangeStrict: '1:14-2:3', nonContainedRangeLoose: '1:6-1:11', nonContainedRangeStrict: '2:1-7' },
  { ref: '1:12-2:4,6', containedRef: '1:99999', nonContainedRef: '2:5', containedRangeLoose: '2-3', containedRangeStrict: '2:1-4', nonContainedRangeLoose: '2:7-20', nonContainedRangeStrict: '2-3' },
  { ref: '1:12-2:4;3:5-4:2', containedRef: '3:9999', nonContainedRef: '4:3', containedRangeLoose: '4:1-5', containedRangeStrict: '3:5-4:1', nonContainedRangeLoose: '1:1-11', nonContainedRangeStrict: '4:1-5' },
  { ref: '1:1-2,2:4', containedRef: '2:4', nonContainedRef: '1:9999', containedRangeLoose: '1:2-7', containedRangeStrict: '1:1-2', nonContainedRangeLoose: '2:1-3', nonContainedRangeStrict: '1:2-7' },
  { ref: '1:1-2b,2:4c', containedRef: '1:2', nonContainedRef: '2:5', containedRangeLoose: '1:2-7', containedRangeStrict: '1:1-2', nonContainedRangeLoose: '2:1-3', nonContainedRangeStrict: '1:2-7' },
  { ref: '1-3', containedRef: '1:4', nonContainedRef: '4:1', containedRangeLoose: '2:5-4:9', containedRangeStrict: '2:7-3:9', nonContainedRangeLoose: '4:1-6:5', nonContainedRangeStrict: '2:5-4:9' },
  { ref: '1-3', containedRef: '3:9999', nonContainedRef: '4:1', containedRangeLoose: '3-5', containedRangeStrict: '1:6-3:9', nonContainedRangeLoose: '4-6', nonContainedRangeStrict: '3:2-5:9' },
  { ref: '3', containedRef: '3:9999', nonContainedRef: '2:9999', containedRangeLoose: '2:1-3:5', containedRangeStrict: '3:3-999', nonContainedRangeLoose: '4:1-9', nonContainedRangeStrict: '2:1-3:5' },
  { ref: '1:1-2;3-4', containedRef: '3:9999', nonContainedRef: '2:9999', containedRangeLoose: '3:999-5:1', containedRangeStrict: '3:22-4:8', nonContainedRangeLoose: '1:3-4', nonContainedRangeStrict: '3:999-5:1'},
  { ref: '1:1-2;3-4', containedRef: '1:1', nonContainedRef: '1:3', containedRangeLoose: '3:999-5:1', containedRangeStrict: '3:22-4:8', nonContainedRangeLoose: '1:3-4', nonContainedRangeStrict: '3:999-5:1'},
  { ref: '1:2ff', containedRef: '1:2', nonContainedRef: '2:5', containedRangeLoose: '1', containedRangeStrict: '1:2-9999', nonContainedRangeLoose: '2-3', nonContainedRangeStrict: '1:1-99' },
  { ref: '1:2ff', containedRef: '1:9999', nonContainedRef: '1:1', containedRangeLoose: '1:1-99', containedRangeStrict: '1:5-9', nonContainedRangeLoose: '2:1-3', nonContainedRangeStrict: '1:1-99' },
];

describe('Test doesReferenceContain', () => {
  for (const test of searchReferenceTests) {
    const refToSearch = test.ref;
    const refContainedSearchTerm = test.containedRef;
    const refNonContainedSearchTerm = test.nonContainedRef;
    
    it(`does ${refToSearch} contain ${refContainedSearchTerm} should return true`, () => {
      expect(doesReferenceContain(refToSearch, refContainedSearchTerm)).toEqual(true);
    }) 
  
    it(`does ${refToSearch} contain ${refNonContainedSearchTerm} should return false`, () => {
      expect(doesReferenceContain(refToSearch, refNonContainedSearchTerm)).toEqual(false);
    })

    if (test.containedRangeLoose) {
      it(`does reference '${refToSearch}' contain range '${test.containedRangeLoose}' in loose mode should return true`, () => {
        expect(doesReferenceContain(refToSearch, test.containedRangeLoose)).toEqual(true);
      })
    }

    if (test.containedRangeStrict) {
      it(`does reference '${refToSearch}' contain range '${test.containedRangeStrict}' in strict mode should return true`, () => {
        expect(doesReferenceContain(refToSearch, test.containedRangeStrict, true)).toEqual(true);
      })
    }

    if (test.nonContainedRangeLoose) {
      it(`does reference '${refToSearch}' contain range '${test.nonContainedRangeLoose}' in loose mode should return false`, () => {
        expect(doesReferenceContain(refToSearch, test.nonContainedRangeLoose)).toEqual(false);
      })
    }

    if (test.nonContainedRangeStrict) {
      it(`does reference '${refToSearch}' contain range '${test.nonContainedRangeStrict}' in strict mode should return false`, () => {
        expect(doesReferenceContain(refToSearch, test.nonContainedRangeStrict, true)).toEqual(false);
      })   
    }
  }
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

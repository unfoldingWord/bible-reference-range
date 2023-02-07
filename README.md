# bible-reference-range

[![CI Status](https://github.com/unfoldingWord/bible-reference-range/workflows/CI/badge.svg)](https://github.com/unfoldingWord/bible-reference-range/actions)
[![Current Verison](https://img.shields.io/github/tag/unfoldingWord/bible-reference-range.svg)](https://github.com/unfoldingWord/bible-reference-range/tags)
[![View this project on NPM](https://img.shields.io/npm/v/bible-reference-range)](https://www.npmjs.com/package/bible-reference-range)
[![Coverage Status](https://coveralls.io/repos/github/unfoldingWord/bible-reference-range/badge.svg?branch=main)](https://coveralls.io/github/unfoldingWord/bible-reference-range?branch=main)

A Library for handling bible reference ranges.

### API

These are the exposed end-points

- parseReferenceToList
  - Takes a reference and splits into individual verses or verse spans. Can handle reference in format such as: “2:4-5”, “2:3a”, “2-3b-4a”, “2:7,12”, “7:11-8:2”, "6:15-16;7:2". It returns a list of {chapter, verse}. Or in the case of a verse range it returns {chapter, verse, endChapter, endVerse}.
- getVerses
  - finds all verses from a bible contained in ref, returning an array of {chapter, verse, verseData}
- cleanupReference
  - takes a reference and splits into individual verses or verse spans for cleanup. Then recombines the cleaned up references to a string. Primarily it removes extra characters following the verse number (as in the case of `2:4b-5a`) to make it easier to iterate through the verses.
- referenceHelpers
  - contains all the lower level methods to allow external use.
- doesReferenceContain
  - Takes two references and determines if a reference is contained within another reference.

### INSTALL

- npm users : `nmp i`
- yarn users : `yarn`

### USING

- In your code add import:
  `import { parseReferenceToList, cleanupReference } from 'bible-reference-range';`
- or to use all the exports do:
  `import { referenceHelpers } from 'bible-reference-range';`

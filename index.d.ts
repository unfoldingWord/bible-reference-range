/**
 * A string in the format 'chapter:verse'.
 * 'chapter' can be a number or the word 'front'
 * 'verse'' can be a number, the word 'intro', or a verse range (verseStart-verseEnd)
 * Can be a reference range (i.e 1:2-3)
 * Can be multiple references (i.e 2:3;4:23)
 */
export type ReferenceString = string

/**
 * Object representing a chapter:verse reference or reference range.
 */
export interface VerseChunk {
  chapter: number;
  verse: number;
  endChapter: number;
  endVerse: number;
}

/**
 * Takes a reference and splits into individual verses or verse spans.
 */
export function parseReferenceToList(reference: string): VerseChunk[]; 
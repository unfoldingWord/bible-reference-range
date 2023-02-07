import { parseReferenceToList } from './referenceHelpers'

/**
 * Tests if a given reference is contained within another given reference.
 *
 *
 * @param {string} refToSearch - formats such as “2:4-5”, “2:3a”, “2-3b-4a”, “2:7,12”, “7:11-8:2”, "6:15-16;7:2", "2-3", "2:7ff"
 * @param {string} refSearchTerm - formats such as “2:4”, “2:3a”, "1:9999", "2:1-3", "2:12-4:1", 1:2-3:2 (supports verse ranges, not chapter range or 'ff')
 * @param {string} strict - flag to determine if entire range of refSearchTerm should be contained in refToSearch. Default false
 * @returns {boolean} - true if refSearchTerm exists within refToSearch, false if otherwise
 */
export function doesReferenceContain(refToSearch, refSearchTerm, strict = false) {
  const verseChunksToSearch = parseReferenceToList(refToSearch);
  const refSearchChunks = parseReferenceToList(refSearchTerm);

  for (const searchChunk of refSearchChunks) {
    if (doChunksContainChunk(verseChunksToSearch, searchChunk, strict)) {
      if (!strict) return true;
    } else {
      if (strict) return false;
    }
  }
  return strict ? true : false; 
}

function doChunksContainChunk(verseChunks, searchChunk, strict) {
  for (const verseChunk of verseChunks) {
    if (searchChunk.endVerse) {
      if (chunkContainsVerseRange(verseChunk, searchChunk, strict)) {
        return true;
      }
    } else {
      if (chunkContainsVerse( verseChunk,searchChunk.chapter,searchChunk.verse)) {
        return true;
      }
    }
  }
  return false; 
}

/**
 * @private
 * Tests if a specific verse chunk contains a specific verse
 *
 * @param {{chapter, verse, endChapter, endVerse}} verseChunk
 *
 * @param {string} searchChapter
 * @param {string} searchVerse
 * @returns {boolean} - true if verse chunk contains verse, false if otherwise
 */
function chunkContainsVerse(verseChunk, searchChapter, searchVerse) {
  if (!verseChunk.endChapter) {
    if (searchChapter === verseChunk.chapter) {
      if (verseChunk.verse) {
        if (!verseChunk.endVerse) {
          return searchVerse === verseChunk.verse
        } else {
          if (verseChunk.endVerse === 'ff') {
            return verseChunk.verse <= searchVerse
          } else {
            return (
              verseChunk.verse <= searchVerse &&
              searchVerse <= verseChunk.endVerse
            )
          }
        }
      } else return true
    } else return false
  } else {
    if (
      verseChunk.chapter <= searchChapter &&
      searchChapter <= verseChunk.endChapter
    ) {
      if (verseChunk.verse) {
        if (searchChapter === verseChunk.chapter) {
          return searchVerse >= verseChunk.verse
        } else if (searchChapter === verseChunk.endChapter) {
          return searchVerse <= verseChunk.endVerse
        } else return true
      } else return true
    } else return false
  }
}

/**
 * @private
 * Tests if a specific verse chunk contains a specific verse range
 *
 * @param {{chapter, verse, endChapter, endVerse}} verseChunkToSearch - Verse chunk that we will search for searchChunk within
 * @param {{chapter, verse, endChapter, endVerse}} searchChunk - Verse range chunk we are checking is to be contained within verseChunkToSearch
 * @param {boolean} strict - Flag to determine if search chunk should be FULLY contained verseChunkToSearch.
 * @returns {boolean} - true if verse range is contained within a reference, false otherwise.
 */
function chunkContainsVerseRange(verseChunk, searchChunk, strict) {
  if (!verseChunk.endChapter) {
    if (searchChunk.endChapter) {
      return chapterRangeContainedInChapter(verseChunk, searchChunk, strict)
    }
    return chapterVerseRangeContainedInChapter(verseChunk, searchChunk, strict)
  } else {
    if (searchChunk.endChapter) {
      return chapterRangeContainedInChapterRange(
        verseChunk,
        searchChunk,
        strict
      )
    } else if (
      verseChunk.chapter <= searchChunk.chapter &&
      searchChunk.chapter <= verseChunk.endChapter
    ) {
      return chapterVerseRangeContainedInChapterRange(
        verseChunk,
        searchChunk,
        strict
      )
    }
    return false
  }
}

/**
 * @private
 * Checks to see if chapter range (i.e 1:2-3:6 || 4:6-8:2) is contained within chapter verse range (i.e 1:3-7 || 3:7-12)
 *
 * @param {{chapter, verse, endVerse}} chapter - Verse chunk that represents a chapter verse range (i.e 1:3-7 || 3:7-12)
 * @param {{chapter, verse, endChapter, endVerse}} searchChapterRange - Verse chunk that represents a chapter range (i.e 1:2-3:6 || 4:6-8:2)
 * @param {boolean} strict - Flag to determine if chapter range should be FULLY contained within chapter verse range.
 * @returns {boolean} - true if chapter range is within chapter, false otherwise
 */
function chapterRangeContainedInChapter(
  chapter,
  searchChapterRange,
  strict = false
) {
  if (strict) {
    return false
  } else {
    if (
      searchChapterRange.endChapter < chapter.chapter ||
      searchChapterRange.chapter > chapter.chapter
    ) {
      return false
    }
    if (searchChapterRange.endChapter === chapter.chapter) {
      if (!chapter.verse) {
        return true
      }
      if (!chapter.endVerse && searchChapterRange.endVerse < chapter.verse) {
        return false
      }
      if (chapter.endVerse === 'ff') {
        return searchChapterRange.endVerse >= chapter.verse
      }
      if (searchChapterRange.endVerse < chapter.verse) {
        return false
      }
      return true
    }
    if (searchChapterRange.chapter === chapter.chapter) {
      if (!chapter.verse) {
        return true
      }
      if (!chapter.endVerse) {
        if (searchChapterRange.verse > chapter.verse) {
          return false
        }
        return true
      }
      if (chapter.endVerse === 'ff') {
        return true
      }
      if (searchChapterRange.verse > chapter.endVerse) {
        return false
      }
      return true
    } else return true
  }
}

/**
 * @private
 * Checks if chapter verse range (i.e 1:3-7 || 3:7-12) exists within another chapter verse range
 *
 * @param {{chapter, verse, endVerse}} chapterVerseRange - Verse chunk that represents a chapter verse range (i.e 1:3-7 || 3:7-12)
 * @param {{chapter, verse, endVerse}} searchRange - Verse chunk that represents a chapter verse range (i.e 1:3-7 || 3:7-12)
 * @param {boolean} strict - Flag to determine if chapter verse range should be FULLY contained within chapter verse range.
 * @returns {boolean} - true if chapter verse range is within chapter, false otherwise
 */
function chapterVerseRangeContainedInChapter(
  chapterVerseRange,
  searchRange,
  strict = false
) {
  if (searchRange.chapter === chapterVerseRange.chapter) {
    if (chapterVerseRange.verse) {
      if (!chapterVerseRange.endVerse) {
        if (strict) return false
        if (
          searchRange.endVerse < chapterVerseRange.verse ||
          searchRange.verse > chapterVerseRange.verse
        ) {
          return false
        }
        return true
      }
      if (chapterVerseRange.endVerse === 'ff') {
        if (strict) {
          return chapterVerseRange.verse <= searchRange.verse
        } else {
          return searchRange.endVerse >= chapterVerseRange.verse
        }
      } else {
        if (strict) {
          return (
            chapterVerseRange.verse <= searchRange.verse &&
            searchRange.endVerse <= chapterVerseRange.endVerse
          )
        } else {
          // Search range is completely before or completely after chapter range to search
          if (
            searchRange.endVerse < chapterVerseRange.verse ||
            searchRange.verse > chapterVerseRange.endVerse
          ) {
            return false
          } else return true
        }
      }
    } else return true
  } else return false
}

/**
 * @private
 * Checks if chapter range (i.e 1:2-3:6 || 4:6-8:2) exists within another chapter range
 *
 * @param {{chapter, verse, endChapter, endVerse}} chapterRange - Verse chunk that represents a chapter range (i.e 1:2-3:6 || 4:6-8:2)
 * @param {{chapter, verse, endChapter, endVerse}} rangeSearchChunk - Verse chunk that represents a chapter range (i.e 1:2-3:6 || 4:6-8:2)
 * @param {boolean} strict - Flag to determine if chapter range should be FULLY contained within chapter range.
 * @returns {boolean} - true if chapter range is within chapter range, false otherwise
 */
function chapterRangeContainedInChapterRange(
  chapterRange,
  rangeSearchChunk,
  strict = false
) {
  if (strict) {
    if (
      chapterRange.chapter <= rangeSearchChunk.chapter &&
      rangeSearchChunk.endChapter <= chapterRange.endChapter
    ) {
      if (chapterRange.verse) {
        if (
          rangeSearchChunk.chapter === chapterRange.chapter &&
          rangeSearchChunk.endChapter === chapterRange.endChapter
        ) {
          return (
            rangeSearchChunk.verse >= chapterRange.verse &&
            rangeSearchChunk.endVerse <= chapterRange.endVerse
          )
        }
        if (rangeSearchChunk.chapter === chapterRange.chapter) {
          return rangeSearchChunk.verse >= chapterRange.verse
        }
        if (rangeSearchChunk.endChapter === chapterRange.endChapter) {
          return rangeSearchChunk.endVerse <= chapterRange.endVerse
        }
        return true
      } else return true
    }
    return false
  } else {
    if (
      rangeSearchChunk.endChapter < chapterRange.chapter ||
      rangeSearchChunk.chapter > chapterRange.endChapter
    ) {
      return false
    }
    if (rangeSearchChunk.endChapter === chapterRange.chapter) {
      if (!chapterRange.verse) {
        return true
      }
      if (rangeSearchChunk.endVerse < chapterRange.verse) {
        return false
      }
    }
    if (rangeSearchChunk.chapter === chapterRange.endChapter) {
      if (!chapterRange.verse) {
        return true
      }
      if (rangeSearchChunk.verse > chapterRange.endVerse) {
        return false
      }
    }
    return true
  }
}

/**
 * @private
 * Checks if chapter verse range (i.e 1:3-7 || 3:7-12) exists within chapter range (i.e 1:2-3:6 || 4:6-8:2)
 *
 * @param {{chapter, verse, endChapter, endVerse}} chapterRange - Verse chunk that represents a chapter range (i.e 1:2-3:6 || 4:6-8:2)
 * @param {{chapter, verse, endVerse}} chapterSearchChunk - Verse chunk that represents a chapter verse range (i.e 1:3-7 || 3:7-12)
 * @param {boolean} strict - Flag to determine if chapter verse range should be FULLY contained within chapter range.
 * @returns {boolean} - true if chapter verse range is within chapter range, false otherwise
 */
function chapterVerseRangeContainedInChapterRange(
  chapterRange,
  chapterSearchChunk,
  strict
) {
  if (strict) {
    if (chapterSearchChunk.chapter === chapterRange.chapter) {
      return chapterSearchChunk.verse >= chapterRange.verse
    }
    if (chapterSearchChunk.chapter === chapterRange.endChapter) {
      return chapterSearchChunk.endVerse <= chapterRange.endVerse
    }
    return true
  } else {
    if (
      chapterSearchChunk.chapter > chapterRange.endChapter ||
      chapterSearchChunk.chapter < chapterRange.chapter
    ) {
      return false
    }
    if (chapterSearchChunk.chapter === chapterRange.endChapter) {
      if (!chapterRange.verse) {
        return true
      }
      if (chapterSearchChunk.verse > chapterRange.endVerse) {
        return false
      }
    }
    if (chapterSearchChunk.chapter === chapterRange.chapter) {
      if (!chapterRange.verse) {
        return true
      }
      if (chapterSearchChunk.endVerse < chapterRange.verse) {
        return false
      }
    }
    return true
  }
}

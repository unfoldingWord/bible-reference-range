// list of possible hyphen and dash characters used for range separator
const RANGE_SEPARATORS = [
    '-', // HYPHEN-MINUS
    '\u00AD', // SOFT HYPHEN
    '\u2010', // HYPHEN
    '\u2011', // NON-BREAKING HYPHEN
    '\u2012', // FIGURE DASH
    '\u2013', // EN DASH
    '\u2014', // EM DASH
  ];
  const ZERO_WIDTH_SPACE = '\u200B';
  const NO_BREAK_SPACE = '\u00A0';
  const ZERO_WIDTH_NO_BREAK_SPACE = '\uFEFF';

/**
 * takes a reference and splits into individual verses or verse spans.
 * @param {string} ref - reference in format such as:
 *   “2:4-5”, “2:3a”, “2-3b-4a”, “2:7,12”, “7:11-8:2”, "6:15-16;7:2"
 * @return {[{chapter, verse, endChapter, endVerse}]}
 */
 export function parseReferenceToList(ref) {
    try {
      let verseChunks = [];
      const refChunks = ref.split(';');
      let lastChapter = 1;
  
      for (const refChunk of refChunks) {
        // 1:1-23,32 ; 1-3
        if (!refChunk) {
          continue;
        }

        // If no semicolon (no verses), reference is either a chapter, chapter range, or invalid
        if (!refChunk.includes(':')) {
          verseChunks = addChapterReference(verseChunks, refChunk)
          continue;
        }
      
  
        const verseParts = refChunk.split(',');
        // get the object from the first chunk before the comma
        let {
          chapter,
          verse,
          foundChapterVerse,
        } = getChapterVerse(verseParts[0]);
  
        if (!foundChapterVerse) {
          chapter = verse;
          verse = null;
        }
  
        lastChapter = chapter;
  
        const range = getRange(verse);
  
        verseChunks.push({
          ...range,
          chapter,
        });
  
        if (range.endChapter) {
          lastChapter = range.endChapter;
        }
  
        // get the object from the rest of the chunks after the comma
        for (let i = 1; i < verseParts.length; i++) {
          const versePart = verseParts[i];
  
          if (!versePart) {
            continue;
          }
  
          let {
            chapter: chapter_,
            verse: verse_,
            foundChapterVerse,
          } = getChapterVerse(versePart);
  
          if (foundChapterVerse) {
            chapter = chapter_;
            verse = verse_;
            lastChapter = chapter;
          } else {
            chapter = lastChapter;
            verse = verse_;
          }
  
          const range = getRange(verse);
  
          if (range.endVerse) {
            verseChunks.push({
              ...range,
              chapter,
            });
  
            if (range.endChapter) {
              lastChapter = range.endChapter;
            }
          } else { // not range
            verseChunks.push({
              verse: range.verse,
              chapter,
            });
          }
        }
      }
      return verseChunks;
    } catch (e) {
      console.warn(`parseReferenceToList() - invalid ref: "${ref}"`, e);
    }
    return null;
  }

  /**
   * If valid chapter reference, add chapter object to verse chunks list
   * 
   * @param {[{chapter, verse, endChapter, endVerse}]} verseChunks 
   * @param {string} chapterRef 
   * @returns {[{chapter, verse, endChapter, endVerse}]} - Array copy with new chapter reference if valid, or input array if not
   */
  function addChapterReference(verseChunks, chapterRef) {
    const isRange = getRangeSeparator(chapterRef) >= 0
    
    if (isRange) {
      const pos = getRangeSeparator(chapterRef);
      const foundRange = pos >= 0;

      if (foundRange) {
        const start = toIntIfValid(chapterRef.substring(0, pos));
        const end = toIntIfValid(chapterRef.substring(pos + 1));

        return [...verseChunks, {chapter: start, endChapter: end}]
      } 
    } else {
      return [...verseChunks, {chapter: toIntIfValid(chapterRef)}]
    }

    return verseChunks
  }
  
  /**
   * conver array of Reference chunks to reference string
   * @param {array} chunks
   * @return {string}
   */
  export function convertReferenceChunksToString(chunks) {
    let result = '';
  
    try {
      let lastChapter = null;
      let lastChunk = null;
  
      if (Array.isArray(chunks)) {
        for (const chunk of chunks) {
          if (chunk.endChapter) {
            if (result) {
              result += ';';
            }
            // Check for chapter range without verses
            if (!chunk.verse) {
              result += `${chunk.chapter}-${chunk.endChapter}`
            } else {
              result += `${chunk.chapter}:${chunk.verse}-${chunk.endChapter}:${chunk.endVerse}`;
            }
            lastChapter = chunk.endChapter;
          } else {
            if ((lastChapter !== chunk.chapter) || (lastChunk && lastChunk.endChapter)) {
              if (result) {
                result += ';';
              }
              result += `${chunk.chapter}` + (chunk.verse ? ':' : '');
              lastChapter = chunk.chapter;
            } else { // same chapter
              if (result) {
                result += ',';
              }
            }
            // check for solo chapter
            if (chunk.verse) {
            result += `${chunk.verse}`;
            }
  
            if (chunk.endVerse) {
              if (chunk.endVerse === 'ff') {
                result += chunk.endVerse;
              } else {
                result += `-${chunk.endVerse}`
              }
            }
          }
          lastChunk = chunk;
        }
      }
    } catch (e) {
      console.warn(`convertReferenceChunksToString() - invalid chunks: "${JSON.stringify(chunks)}"`);
    }
    return result;
  }
  
  /**
   * check to see if single reference
   * @param {array} chunks
   * @param {string} refStr
   * @return {{chapter, verse, verseStr}}
   */
  export function characterizeReference(chunks, refStr) {
    const results = {};
  
    if (chunks && chunks.length && refStr) {
      let multiverse = false;
      let verseStr = null;
      results.chapter = chunks[0].chapter;
      results.verse = chunks[0].verse;
      const pos = refStr.indexOf(':');
  
      if (pos >= 0) {
        verseStr = refStr.substring(pos + 1);
      }
  
      if (chunks.length > 1) {
        multiverse = true;
      } else if (chunks[0].endVerse) {
        multiverse = true;
      }
  
      if (multiverse) {
        results.verseStr = verseStr;
        results.verse = verseStr;
      }
    }
    return results;
  }
  
  /**
   * takes a reference and splits into individual verses or verse spans for cleanup.  Then recombines the cleaned up references to a string.
   * @param {string} ref - reference in format such as:
   *   “2:4-5”, “2:3a”, “2-3b-4a”, “2:7,12”, “7:11-8:2”, "6:15-16;7:2"
   * @return {array|string}
   */
  export function cleanupReference(ref) {
    const chunks = parseReferenceToList(ref);
    const cleanedRef = convertReferenceChunksToString(chunks);
  
    let results = characterizeReference(chunks, cleanedRef);
    results.cleanedRef = cleanedRef;
    return results;
  }

  /**
 * splits verse list into individual verses
 * @param {string} verseStr
 * @return {[number]}
 */
export function getVerseList(verseStr) {
    const verses = verseStr.toString().split(',');
    return verses;
  }
  
  /**
   * test if verse is valid verse span string
   * @param {string|number} verse
   * @return {boolean}
   */
  export function isVerseSpan(verse) {
    const isSpan = (typeof verse === 'string') && verse.includes('-');
    return isSpan;
  }
  
  /**
   * test if verse is valid verse list (verse numbers separated by commas)
   * @param {string|number} verse
   * @return {boolean}
   */
  export function isVerseList(verse) {
    const isList = (typeof verse === 'string') && verse.includes(',');
    return isList;
  }
  
  /**
   * test if verse is valid verse span or verse list
   * @param {string|number} verse
   * @return {boolean}
   */
  export function isVerseSet(verse) {
    const isSet = isVerseSpan(verse) || isVerseList(verse);
    return isSet;
  }
  
  /**
   * get verse range from span
   * @param {string} verseSpan
   * @return {{high: number, low: number}}
   */
  export function getVerseSpanRange(verseSpan) {
    let [low, high] = verseSpan.split('-');
  
    if (low && high) {
      low = parseInt(low, 10);
      high = parseInt(high, 10);
  
      if ((low > 0) && (high >= low)) {
        return { low, high };
      }
    }
    return {};
  }
  
  /**
   * make sure that chapter and verse are lower than or equal to end chapter and verse
   * @param {int} chapter
   * @param {int} verse
   * @param {int} endChapter
   * @param {int} endVerse
   * @returns {boolean}
   */
  export function isVerseInRange(chapter, verse, endChapter, endVerse) {
    if (chapter < endChapter) {
      return true;
    }
  
    if (chapter === endChapter) {
      if (verse <= endVerse) {
        return true;
      }
    }
    return false;
  }




/**
 * check if verse range
 * @param ref
 * @returns {{verse}}
 */
function getRange(ref) {
    const refType = typeof(ref);
    const isNumber = refType === 'number';
  
    if (!isNumber) {
      const pos = getRangeSeparator(ref);
      const foundRange = pos >= 0;
  
      if (foundRange) {
        const start = toIntIfValid(ref.substring(0, pos));
        const endStr = ref.substring(pos + 1);
  
        let {
          chapter,
          verse,
          foundChapterVerse,
        } = getChapterVerse(endStr);
  
        if (foundChapterVerse) {
          return {
            verse: start,
            endChapter: chapter,
            endVerse: verse,
          };
        } else {
          return {
            verse: start,
            endVerse: toIntIfValid(endStr),
          };
        }
      } else if (ref.toLowerCase().includes('ff')) {
        const followingPos = ref.indexOf('ff')
        const start = toIntIfValid(ref.substring(0, followingPos));

        return {
          verse: start,
          endVerse: 'ff'
        }
      }
    }
  
    return { verse: ref };
  }
  
  /**
   * parse ref to see if chapter:verse
   * @param ref
   * @returns {{chapter: string, foundChapterVerse: boolean, verse: string}}
   */
  function getChapterVerse(ref) {
    if (typeof ref !== 'string') {
      return { verse: ref };
    }
  
    const pos = (ref || '').indexOf(':');
    const foundChapterVerse = pos >= 0;
    let chapter, verse;
  
    if (foundChapterVerse) {
      chapter = toIntIfValid(ref.substring(0, pos));
      verse = toIntIfValid(ref.substring(pos + 1));
    } else {
      verse = toIntIfValid(ref);
    }
    return {
      chapter,
      verse,
      foundChapterVerse,
    };
  }

/**
 * convert value to int if string, otherwise just return value
 * @param {string|int} value
 * @returns {int}
 */
export function toInt(value) {
    return (typeof value === 'string') ? parseInt(value, 10) : value;
  }
  
  /**
   * return integer of value (string or int) if valid, otherwise just return value
   * @param {string|int} value
   * @returns {int|int}
   */
  export function toIntIfValid(value) {
    if (typeof value === 'string') {
      const pos = getRangeSeparator(value);
  
      if (pos >= 0) {
        return value;
      }

      if (value.includes('ff')) {
        return value;
      }
  
      const intValue = toInt(value);
  
      if (!isNaN(intValue)) {
        return intValue;
      }
    }
  
    return value;
  }
  
  /**
   * look for possible dash and hyphen character to see if versePart is a verse range
   * @param {string} versePart
   * @return {number} position of dash or hyphen found, or -1 if not found
   */
  function getRangeSeparator(versePart) {
    for (const separator of RANGE_SEPARATORS) {
      const pos = versePart.indexOf(separator);
  
      if (pos >= 0) {
        return pos;
      }
    }
    return -1;
  }

/**
 * check if verse is within a verse range (e.g. 2-4)
 * @param {object} chapterData - indexed by verse ref
 * @param {number} verse - verse to match
 * @param {number} chapter - current chapter
 * @returns {{verseData, verse: number, foundVerseKey, nextVerse}}
 */
function findVerseInVerseRange(chapterData, verse, chapter) {
  const verseKeys = Object.keys(chapterData);
  let foundVerseKey, verseData, verseKey, nextVerse;

  for (verseKey of verseKeys) {
    if (isVerseSpan(verseKey)) {
      const {low, high} = getVerseSpanRange(verseKey);

      if ((verse >= low) && (verse <= high)) {
        verseData = chapterData[verseKey];
        foundVerseKey = verse;
        nextVerse = high + 1; // move to verse after range
        break;
      }
    }
  }
  return {
    foundVerseKey,
    verse: verseKey,
    verseData,
    nextVerse,
  };
}

/**
 * finds all verses from bookData contained in ref, then returns array of references and verse data
 * @param {object} bookData - indexed by chapter and then verse ref
 * @param {string} ref - formats such as “2:4-5”, “2:3a”, “2-3b-4a”, “2:7,12”, “7:11-8:2”, "6:15-16;7:2"
 * @returns {[{chapter, verse, verseData}]}
 */
export function getVerses(bookData, ref) {
  const verses = [];
  const chunks = parseReferenceToList(ref);
  let chapterData, verseData;

  for (const chunk of chunks) {
    if (!chunk.endVerse) {
      const chapter = chunk.chapter;
      chapterData = bookData[chapter];
      let verseKey = chunk.verse;
      verseData = chapterData && chapterData[verseKey];

      if (!verseData && chapterData) { // if verse doesn't exist, check for verse spans in chapter data
        const __ret = findVerseInVerseRange(chapterData, verseKey, chapter);

        if (__ret.foundVerseKey) {
          verseKey = __ret.verse;
          verseData = __ret.verseData;
        }
      }

      verses.push({
        chapter,
        verse: verseKey,
        verseData,
      });
    } else { // handle range
      let chapter = chunk.chapter;
      let verse = chunk.verse;
      const endVerse = chunk.endVerse;
      const endChapter = chunk.endChapter || chapter;

      while (isVerseInRange(chapter, verse, endChapter, endVerse)) {
        chapterData = bookData[chapter];
        verseData = chapterData && chapterData[verse];
        let verseKey = verse;

        if (!verseData && chapterData) { // if verse doesn't exist, check for verse spans in chapter data
          const __ret = findVerseInVerseRange(chapterData, verseKey, chapter);

          if (__ret.foundVerseKey) {
            verseKey = __ret.verse;
            verseData = __ret.verseData;
            verse = __ret.nextVerse - 1; // correct for autoincrement
          }
        }

        if (!verseData) { // if past end of chapter, skip to next
          chapter += 1;
          verse = 1;
          continue;
        }

        verses.push({
          chapter,
          verse: verseKey,
          verseData,
        });
        verse += 1;
      }
    }
  }

  return verses;
}

/**
 * Tests if a given reference is contained within another given reference.
 * 
 *
 * @param {string} refToSearch - formats such as “2:4-5”, “2:3a”, “2-3b-4a”, “2:7,12”, “7:11-8:2”, "6:15-16;7:2"
 * @param {string} refSearchTerm - formats such as “2:4”, “2:3a”, "1:9999", "2:1-3" (supports verse range, not chapter range or 'ff')
 * @param {string} strict - flag to determine if entire range of refSearchTerm should be contained in refToSearch. Default false
 * @returns {boolean} - true if refSearchTerm exists within refToSearch, false if otherwise
 */
export function doesReferenceContain(refToSearch, refSearchTerm, strict=false) {
  const verseChunksToSearch = parseReferenceToList(refToSearch);
  const refSearchChunk = parseReferenceToList(refSearchTerm)[0];

  for(const verseChunk of verseChunksToSearch) {
    if (refSearchChunk.endVerse) {
        if (chunkContainsVerseRange(verseChunk, refSearchChunk, strict)) {
          return true;
        }
    } else {
      if (chunkContainsVerse(verseChunk, refSearchChunk.chapter, refSearchChunk.verse)) {
        return true;
      }
    }
  }

  // Partial overlap (refToSearch: 1:1-2:3 refSearchTerm: 2:2-7) RETURNS TRUE
  // Pass in a flag for strict/loose containing

  return false;
}

/**
 * Tests if a specific verse chunk contains a specific verse
 * 
 * @param {[{chapter, verse, endChapter, endVerse}]} verseChunk 
 * @param {string} searchChapter 
 * @param {string} searchVerse 
 * @returns {boolean} - true if verse chunk contains verse, false if otherwise
 */
function chunkContainsVerse(verseChunk, searchChapter, searchVerse) {
  if (!verseChunk.endChapter) {
    if (searchChapter === verseChunk.chapter) {
      if (verseChunk.verse) {
        if (!verseChunk.endVerse) {
          return searchVerse === verseChunk.verse;
        } else {
          if (verseChunk.endVerse === 'ff') {
            return verseChunk.verse <= searchVerse;
          } else {
            return (verseChunk.verse <= searchVerse && searchVerse <= verseChunk.endVerse);
          }
        }
      } else return true;
    } else return false;
  } else {
    if (verseChunk.chapter <= searchChapter && searchChapter <= verseChunk.endChapter) {
      if (verseChunk.verse) {
        if (searchChapter === verseChunk.chapter) {
          return searchVerse >= verseChunk.verse; 
        } else if (searchChapter === verseChunk.endChapter) {
          return searchVerse <= verseChunk.endVerse;
        } else return true;
      } else return true;
    } else return false;
  }
}

/**
 * Tests if a specific verse chunk completely contains a specific verse range
 * 
 * @param {string} verseChunkToSearch 
 * @param {string} searchChunk 
 * @returns {boolean} - true if verse range is fully contained within a reference, false otherwise.
 */
function chunkContainsVerseRange(verseChunk, searchChunk, strict) {
  if (!verseChunk.endChapter) {
    if (searchChunk.endChapter) {
      return chapterRangeContainedInChapter(verseChunk, searchChunk, strict);
    }
    return chapterVerseRangeContainedInChapter(verseChunk, searchChunk, strict);
  } else {
    if (searchChunk.endChapter) {
      return chapterRangeContainedInChapterRange(verseChunk, searchChunk, strict)
    } else if (verseChunk.chapter <= searchChunk.chapter && searchChunk.chapter <= verseChunk.endChapter) {
      return chapterVerseRangeContainedInChapterRange(verseChunk, searchChunk, strict);
    } return false;
  }
}

function chapterRangeContainedInChapter(chapter, searchChapterRange, strict=false) {
  if (strict) {
    return false;
  } else {
    if (searchChapterRange.endChapter < chapter.chapter || searchChapterRange.chapter > chapter.chapter) {
      return false;
    } 
    if (searchChapterRange.endChapter === chapter.chapter) {
      if (!chapter.verse) {
        return true;
      } 
      if (chapter.endVerse === 'ff') {
        return searchChapterRange.endVerse >= chapter.verse;
      } 
      if (searchChapterRange.endVerse < chapter.verse) {
        return false;
      } 
      return true;
    } 
    if (searchChapterRange.chapter === chapter.chapter) {
      if (!chapter.verse) {
        return true;
      }
      if (chapter.endVerse === 'ff') {
        return true;
      }
      if (searchChapterRange.verse > chapter.endVerse) {
        return false;
      }
    } else return true;
  } 
}

function chapterVerseRangeContainedInChapter (singleChapterRange, searchRange, strict=false) {
  if (searchRange.chapter === singleChapterRange.chapter) {
    if (singleChapterRange.verse) {
      if (singleChapterRange.endVerse === 'ff') {
        if (strict) {
          return singleChapterRange.verse <= searchRange.verse;
        } else {
          return searchRange.endVerse <= singleChapterRange.verse; 
        } 
      } else {
        if (strict) {
          return singleChapterRange.verse <= searchRange.verse && searchRange.endVerse <= singleChapterRange.endVerse;
        } else {
          // Search range is completely before or completely after chapter range to search
          if (searchRange.endVerse <= singleChapterRange.verse || searchRange.verse >= singleChapterRange.endVerse) {
            return false;
          } else return true;
        }
      }
    } else return true; 
  } else return false;
}

function chapterRangeContainedInChapterRange (chapterRange, rangeSearchChunk, strict=false) {
  if (strict) {
    if (chapterRange.chapter <= rangeSearchChunk.chapter && rangeSearchChunk.endChapter <= chapterRange.endChapter) {
      if (chapterRange.verse) {
        if (rangeSearchChunk.chapter === chapterRange.chapter && rangeSearchChunk.endChapter === chapterRange.endChapter) {
          return (rangeSearchChunk.verse >= chapterRange.verse && rangeSearchChunk.endVerse <= chapterRange.endVerse);
        } 
        if (rangeSearchChunk.chapter === chapterRange.chapter) {
          return rangeSearchChunk.verse >= chapterRange.verse;
        } 
        if(rangeSearchChunk.endChapter === chapterRange.endChapter) {
          return rangeSearchChunk.endVerse <= chapterRange.endVerse;
        } 
        return true;
      } else return true;
    } return false;
  } else {
    if (rangeSearchChunk.endChapter < chapterRange.chapter || rangeSearchChunk.chapter > chapterRange.endChapter) {
      return false; 
    } 
    if (rangeSearchChunk.endChapter === chapterRange.chapter) {
      if (!chapterRange.verse) {
        return true;
      }
      if (rangeSearchChunk.endVerse < chapterRange.verse) {
        return false;
      }
    }
    if (rangeSearchChunk.chapter === chapterRange.endChapter) {
      if (!chapterRange.verse) {
        return true;
      }
      if (rangeSearchChunk.verse > chapterRange.endVerse) {
        return false;
      }
    } 
    return true;
  }
}

function chapterVerseRangeContainedInChapterRange (chapterRange, chapterSearchChunk, strict) {
  if (strict) {
    if (chapterSearchChunk.chapter === chapterRange.chapter) {
      return chapterSearchChunk.verse >= chapterRange.verse;
    }
    if(chapterSearchChunk.chapter === chapterRange.endChapter) {
      return chapterSearchChunk.endVerse <= chapterRange.endVerse;
    }
    return true;
  } else {
    if (chapterSearchChunk.chapter > chapterRange.endChapter || chapterSearchChunk.endChapter < chapterRange.chapter) {
      return false;
    }
    if (chapterSearchChunk.chapter === chapterRange.endChapter) {
      if (!chapterRange.verse) {
        return true;
      }
      if (chapterSearchChunk.verse > chapterRange.endVerse) {
        return false;
      }
    }
    if (chapterSearchChunk.endChapter === chapterRange.chapter) {
      if (!chapterRange.verse) {
        return true;
      }
      if (chapterSearchChunk.endVerse < chapterRange.verse) {
        return false;
      }
    }
    return true;
  }
}

// // This function is only called if verseChunkToSearch AND searchChunk are ranges!
// function chunkContainsVerseRange(verseChunkToSearch, searchChunk, strict=false) {
//   if (!verseChunk.endChapter) {
//     if (strict && searchChunk.endChapter) {
//       return false;
//     }
//     // If strict, object MUST at most look like ({chapter, verse, endVerse})
//     if (searchChunk.chapter === verseChunk.chapter) {
//       if (verseChunk.verse) {
//         if (verseChunk.endVerse === 'ff') {
//           if (strict) {
//             return verseChunk.verse <= searchChunk.verse;
//           } else {
//             return verseChunk.verse <= searchChunk.endVerse || !!searchChunk.endChapter
//           }
//         } else {
//           if (strict) {
//             return (verseChunk.verse <= searchChunk.verse && searchChunk.endVerse <= verseChunk.endVerse);
//           } else {

//           }
//         }
//       } else return true; // This should handle single chapters. This is good for strict mode too!
//     } else return false;
//   } else {
//     if (verseChunk.chapter <= searchChapter && searchChapter <= verseChunk.endChapter) {
//       if (verseChunk.verse) {
//         if (searchChapter === verseChunk.chapter) {
//           return searchVerse >= verseChunk.verse; 
//         } else if (searchChapter === verseChunk.endChapter) {
//           return searchVerse <= verseChunk.endVerse;
//         } else return true;
//       } else return true; // This should handle a chapter range!
//     } else return false;
//   }
// }

/* Brainstorming

given: {startChapter, endChapter, startVerse, endVerse}


3:2, 3:1-3

STRICT
  Check to make sure that every verse from startChapter, start Verse -> end Chapter, end Verse is contained
 
LOOSE
  Return true if ANY verse within shartChapter, startVerse -> endChapter, endVerse is contained

  */
/**
 * Basic profanity and bad words filter for Greek and English.
 * Normalizes Greek accents, whitespace, and case.
 */

// Greek and English vulgar/abusive words dictionary (lowercase normalized)
const BAD_WORDS: string[] = [
  // Greek vulgarities / slurs (normalized without accents)
  'μαλακας',
  'μαλακα',
  'μαλακες',
  'μαλακισμενο',
  'μαλακισμενη',
  'μαλακια',
  'μαλακιες',
  'πουστης',
  'πουστη',
  'πουσταρα',
  'γαμω',
  'γαμησε',
  'γαμιεσαι',
  'γαμησου',
  'γαμιολα',
  'γαμιολη',
  'καριολη',
  'καριολα',
  'πουτανα',
  'πουτανας',
  'πουτανες',
  'μουνι',
  'μουνια',
  'μπουρδελο',
  'αρχιδι',
  'αρχιδια',
  'αρχιδας',
  'σκατα',
  'ξεκωλιαρα',
  'ξεκωλιαρη',
  'τσουλα',
  'παπαρας',
  'παπαρια',

  // English common profanities
  'fuck',
  'fucking',
  'fucker',
  'shit',
  'bitch',
  'asshole',
  'dick',
  'cunt',
  'bastard',
  'whore',
  'slut',
  'nigger',
  'nigga',
  'faggot',
];

/**
 * Remove Greek diacritics / tones from text
 */
function stripGreekDiacritics(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

/**
 * Checks whether text contains any forbidden or abusive words.
 */
export function checkProfanity(text: string): { hasProfanity: boolean; matchedWord?: string } {
  if (!text) return { hasProfanity: false };

  // Normalize: lower case, remove accents, replace punctuation with space
  const normalized = stripGreekDiacritics(text)
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'’+@<>\[\]\\|]/g, ' ')
    .replace(/\s+/g, ' ');

  const words = normalized.split(' ');

  for (const word of words) {
    const cleanWord = word.trim();
    if (!cleanWord) continue;

    for (const badWord of BAD_WORDS) {
      if (cleanWord === badWord || (cleanWord.length > 4 && cleanWord.startsWith(badWord))) {
        return {
          hasProfanity: true,
          matchedWord: badWord,
        };
      }
    }
  }

  return { hasProfanity: false };
}

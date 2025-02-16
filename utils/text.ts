import { createHash } from 'crypto';

const charMap: { [key: string]: string } = {
  'À': 'A', 'Á': 'A', 'Â': 'A', 'Ã': 'A', 'Ä': 'A', 'Å': 'A', 'Æ': 'AE',
  'Ç': 'C', 'È': 'E', 'É': 'E', 'Ê': 'E', 'Ë': 'E', 'Ì': 'I', 'Í': 'I',
  'Î': 'I', 'Ï': 'I', 'Ð': 'D', 'Ñ': 'N', 'Ò': 'O', 'Ó': 'O', 'Ô': 'O',
  'Õ': 'O', 'Ö': 'O', 'Ø': 'O', 'Ù': 'U', 'Ú': 'U', 'Û': 'U', 'Ü': 'U',
  'Ý': 'Y', 'Þ': 'TH', 'ß': 'ss', 'à': 'a', 'á': 'a', 'â': 'a', 'ã': 'a',
  'ä': 'a', 'å': 'a', 'æ': 'ae', 'ç': 'c', 'è': 'e', 'é': 'e', 'ê': 'e',
  'ë': 'e', 'ì': 'i', 'í': 'i', 'î': 'i', 'ï': 'i', 'ð': 'd', 'ñ': 'n',
  'ò': 'o', 'ó': 'o', 'ô': 'o', 'õ': 'o', 'ö': 'o', 'ø': 'o', 'ù': 'u',
  'ú': 'u', 'û': 'u', 'ü': 'u', 'ý': 'y', 'þ': 'th', 'ÿ': 'y', 'œ': 'oe',
  'Œ': 'OE', 'Š': 'S', 'š': 's', 'Ÿ': 'Y', 'ƒ': 'f'
};

// Create a Set of all characters that can be transliterated
export const transliterableChars = new Set(Object.keys(charMap));

export function containsNonLatinCharacters(text: string): boolean {
  return text.split('').some(char => {
    // If it's a basic Latin char, number, space, or hyphen, it's fine
    if (/^[a-zA-Z0-9\s-]$/.test(char)) return false;
    // If it's in our transliteration map, it's also fine
    if (transliterableChars.has(char)) return true;
    // Everything else is considered non-Latin
    return true;
  });
}

export function generateMD5(content: string): string {
  return createHash('md5')
    .update(content)
    .digest('hex');
}

export function generateSlug(text: string, hash?: string): string {
  if (containsNonLatinCharacters(text)) {
    return hash || generateMD5(text);
  }

  // 1. Map characters using charMap
  const mappedText = text.split('').map(char => charMap[char] || char).join('');

  // 2. Convert to lowercase
  const lowercasedText = mappedText.toLowerCase();

  // 3. Remove all characters except a-z, 0-9, spaces, and hyphens
  const cleanedText = lowercasedText.replace(/[^a-z0-9\s-]/g, '');

  // 4. Replace multiple spaces or hyphens with a single hyphen
  const hyphenatedText = cleanedText.replace(/[\s_-]+/g, '-');

  // 5. Trim leading/trailing hyphens
  const trimmedText = hyphenatedText.replace(/^-+|-+$/g, '');

  // 6. Handle empty string case
  if (!trimmedText) return '';

  // 7. Limit length
  return trimmedText.substring(0, 50);
}
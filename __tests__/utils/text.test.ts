import { generateMD5, generateSlug } from '@/utils/text';

describe('generateMD5', () => {
  it('should generate consistent hashes for the same input', () => {
    const input = 'test message';
    expect(generateMD5(input)).toBe(generateMD5(input));
  });

  it('should generate different hashes for different inputs', () => {
    expect(generateMD5('message1')).not.toBe(generateMD5('message2'));
  });

  it('should handle empty strings', () => {
    expect(generateMD5('')).toBe('d41d8cd98f00b204e9800998ecf8427e');
  });

  it('should handle special characters', () => {
    const input = '!@#$%^&*()';
    expect(generateMD5(input)).toHaveLength(32);
  });
});

describe('generateSlug', () => {

  describe('Basic Functionality', () => {
    it('should convert spaces to hyphens', () => {
      expect(generateSlug('hello world')).toBe('hello-world');
    });

    it('should convert to lowercase', () => {
      expect(generateSlug('Hello World')).toBe('hello-world');
    });

    it('should handle multiple spaces and hyphens', () => {
      expect(generateSlug('hello   world---test')).toBe('hello-world-test');
    });

    it('should trim leading and trailing spaces and hyphens', () => {
      expect(generateSlug('  ---hello world---  ')).toBe('hello-world');
    });

    it('should limit length to 50 characters', () => {
      const longInput = 'a'.repeat(100);
      const expected = 'a'.repeat(50);
      expect(generateSlug(longInput)).toBe(expected);
    });

    it('should handle an empty string', () => {
      expect(generateSlug('')).toBe('');
    });

    it('should handle a string with only spaces', () => {
      expect(generateSlug('   ')).toBe('');
    });

    it('should handle string with only special chars (that are removed)', () => {
        expect(generateSlug('~!@#$%^')).toBe('');
    });
  });

  describe('Special Character Handling (Using Provided charMap)', () => {
    it('should replace accented characters with ASCII equivalents', () => {
      expect(generateSlug('Héllo Wørld')).toBe('hello-world');  //é -> e, ø -> o
      expect(generateSlug('àáâãäå')).toBe('aaaaaa');
      expect(generateSlug('èéêë')).toBe('eeee');
      expect(generateSlug('ìíîï')).toBe('iiii');
      expect(generateSlug('òóôõöø')).toBe('oooooo');
      expect(generateSlug('ùúûü')).toBe('uuuu');
      expect(generateSlug('çñ')).toBe('cn');
      expect(generateSlug('ÆæŒœß')).toBe('aeaeoeoess');
      expect(generateSlug('ŠšŸƒ')).toBe('ssyf');
    });

    it('should remove characters NOT in the provided charMap', () => {
      // These characters are NOT in the provided charMap
      expect(generateSlug('!@#$%^&*()_+={}[]|\\:;"\'<>,.?/')).toBe('');
      expect(generateSlug('你好世界')).toBe(''); // Non-Latin
      expect(generateSlug('©®™')).toBe(''); // Common symbols NOT in the map.
      expect(generateSlug('—–…')).toBe(''); // Dashes and ellipses
    });

    it('should handle mixed case and special characters', () => {
      expect(generateSlug('HÉllo Wørld! with 123')).toBe('hello-world-with-123');
    });

      it('should handle a mix of Latin and non-Latin characters (non-Latin removed)', () => {
        expect(generateSlug('Hello 你好 World')).toBe('hello-world');
    });

  });

  describe('Edge Cases', () => {
    it('should handle a string that is already a valid slug', () => {
      expect(generateSlug('hello-world-123')).toBe('hello-world-123');
    });

    it('should handle a string with leading/trailing hyphens after other processing', () => {
      expect(generateSlug('  -Hello World-  ')).toBe('hello-world');
    });

    it('should handle multiple hyphens in different positions', () => {
      expect(generateSlug("----hello---world----")).toBe("hello-world");
    });

    it('should handle combination of spaces, hyphens, and special characters (from charMap)', () => {
      expect(generateSlug("  -Héllo---wørld!  ")).toBe('hello-world'); // '!' is removed
    });

    it('should handle long string of characters mapped by charMap, then truncated', () => {
      const longSpecial = 'é'.repeat(60); // 'é' maps to 'e'
      const expected = 'e'.repeat(50); // Truncated to 50
      expect(generateSlug(longSpecial)).toBe(expected);
    });

      it('should handle string that becomes empty after charMap and regex', () => {
        expect(generateSlug('!@#$')).toBe('');
    });
  });
});

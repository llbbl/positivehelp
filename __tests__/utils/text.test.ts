import {
	containsNonLatinCharacters,
	generateMD5,
	generateSlug,
	transliterableChars,
} from "@/utils/text";

describe("generateMD5", () => {
	it("should generate consistent hashes for the same input", () => {
		const input = "test message";
		expect(generateMD5(input)).toBe(generateMD5(input));
	});

	it("should generate different hashes for different inputs", () => {
		expect(generateMD5("message1")).not.toBe(generateMD5("message2"));
	});

	it("should handle empty strings", () => {
		expect(generateMD5("")).toBe("d41d8cd98f00b204e9800998ecf8427e");
	});

	it("should handle special characters", () => {
		const input = "!@#$%^&*()";
		expect(generateMD5(input)).toHaveLength(32);
	});
});

describe("generateSlug", () => {
	describe("Basic Functionality", () => {
		it("should convert spaces to hyphens", () => {
			expect(generateSlug("hello world")).toBe("hello-world");
		});

		it("should convert to lowercase", () => {
			expect(generateSlug("Hello World")).toBe("hello-world");
		});

		it("should handle multiple spaces and hyphens", () => {
			expect(generateSlug("hello   world---test")).toBe("hello-world-test");
		});

		it("should trim leading and trailing spaces and hyphens", () => {
			expect(generateSlug("  ---hello world---  ")).toBe("hello-world");
		});

		it("should limit length to 50 characters", () => {
			const longInput = "a".repeat(100);
			const expected = "a".repeat(50);
			expect(generateSlug(longInput)).toBe(expected);
		});

		it("should handle an empty string", () => {
			expect(generateSlug("")).toBe("");
		});

		it("should handle a string with only spaces", () => {
			expect(generateSlug("   ")).toBe("");
		});

		it("should handle string with only special chars", () => {
			const input = "~!@#$%^";
			expect(generateSlug(input)).toBe(generateMD5(input));
		});
	});

	describe("Special Character Handling", () => {
		it("should transliterate accented characters", () => {
			const cases = [
				["Héllo Wørld", "hello-world"],
				["über straße", "uber-strasse"],
				["Ærøskøbing Œuvre Škoda", "aeroskobing-oeuvre-skoda"],
			] as const;

			for (const [input, readableSlug] of cases) {
				expect(generateSlug(input)).toBe(
					`${readableSlug}-${generateMD5(input).slice(0, 8)}`,
				);
			}
		});

		it.each([
			["Héllo Wørld", "Hello World"],
			["straße", "strasse"],
		])(
			"disambiguates transliterated %s from ASCII-equivalent %s",
			(accented, ascii) => {
				const accentedSlug = generateSlug(accented);
				const asciiSlug = generateSlug(ascii);

				expect(accentedSlug).not.toBe(asciiSlug);
				expect(accentedSlug).toBe(
					`${asciiSlug}-${generateMD5(accented).slice(0, 8)}`,
				);
			},
		);

		it("uses an explicit content hash for the transliteration suffix", () => {
			expect(generateSlug("café", "abcdef1234567890")).toBe("cafe-abcdef12");
		});

		it("should use hash for non-transliterable special characters", () => {
			const input = "!@#$%^&*()_+={}[]|\\:;\"'<>,.?/";
			expect(generateSlug(input)).toBe(generateMD5(input));
		});

		it("should use hash for non-Latin scripts", () => {
			expect(generateSlug("你好世界")).toBe(generateMD5("你好世界"));
			expect(generateSlug("Hello 世界")).toBe(generateMD5("Hello 世界"));
		});
	});

	describe("Edge Cases", () => {
		it("should handle a string that is already a valid slug", () => {
			expect(generateSlug("hello-world-123")).toBe("hello-world-123");
		});

		it("should handle a string with leading/trailing hyphens after other processing", () => {
			expect(generateSlug("  -Hello World-  ")).toBe("hello-world");
		});

		it("should handle multiple hyphens in different positions", () => {
			expect(generateSlug("----hello---world----")).toBe("hello-world");
		});

		it("should handle combination of spaces, hyphens, and special characters (from charMap)", () => {
			expect(generateSlug("  -Héllo---wørld!  ")).toBe(
				"5d09492d4c5826758d27211b9fc71402",
			); // Unsupported punctuation preserves the hash fallback.
		});

		it("should handle long string of characters mapped by charMap, then truncated", () => {
			const longSpecial = "é".repeat(60); // 'é' maps to 'e'

			const slug = generateSlug(longSpecial);
			expect(slug).toBe(
				`${"e".repeat(41)}-${generateMD5(longSpecial).slice(0, 8)}`,
			);
			expect(slug).toHaveLength(50);
		});

		it("should handle a long string of characters", () => {
			const longInput = "e".repeat(50); // Truncated to 50
			expect(generateSlug(longInput)).toBe(longInput);
		});

		it("should handle string that becomes empty after charMap and regex", () => {
			expect(generateSlug("!@#$")).toBe("3a4d92a1200aad406ac50377c7d863aa");
		});
	});
});

describe("containsNonLatinCharacters", () => {
	it("should return false for basic Latin text", () => {
		expect(containsNonLatinCharacters("Hello World")).toBe(false);
	});

	it("should return true for transliterable characters", () => {
		expect(containsNonLatinCharacters("über straße")).toBe(true);
		expect(containsNonLatinCharacters("café")).toBe(true);
	});

	it("should return true for special characters", () => {
		expect(containsNonLatinCharacters("Hello!")).toBe(true);
		expect(containsNonLatinCharacters("Hello@World")).toBe(true);
	});

	it("should return true for non-Latin scripts", () => {
		expect(containsNonLatinCharacters("你好世界")).toBe(true);
		expect(containsNonLatinCharacters("Hello 世界")).toBe(true);
	});

	it("should return true for Arabic text", () => {
		expect(containsNonLatinCharacters("مرحبا بالعالم")).toBe(true);
	});

	it("should return true for Hindi text", () => {
		expect(containsNonLatinCharacters("नमस्ते दुनिया")).toBe(true);
	});

	it("should return true for mixed Latin and non-Latin", () => {
		expect(containsNonLatinCharacters("Hello 世界")).toBe(true);
		expect(containsNonLatinCharacters("Café 咖啡")).toBe(true);
	});

	it("should return false for numbers and basic punctuation", () => {
		expect(containsNonLatinCharacters("Hello 123 - World!")).toBe(true);
	});
	it("should handle characters outside Latin-1 supplement", () => {
		expect(containsNonLatinCharacters("ÆæŒœß")).toBe(true);
	});
});

describe("generateSlug with non-Latin handling", () => {
	it("should use hash for Mandarin text", () => {
		const text = "你好世界";
		const hash = generateMD5(text);
		expect(generateSlug(text)).toBe(hash);
	});

	it("should use hash for Arabic text", () => {
		const text = "مرحبا بالعالم";
		const hash = generateMD5(text);
		expect(generateSlug(text)).toBe(hash);
	});

	it("should use hash for mixed Latin and non-Latin", () => {
		const text = "Hello 世界";
		const hash = generateMD5(text);
		expect(generateSlug(text)).toBe(hash);
	});

	it("should use provided hash if available", () => {
		const text = "你好世界";
		const hash = "custom-hash";
		expect(generateSlug(text, hash)).toBe(hash);
	});

	it("should transliterate supported accented Latin text", () => {
		const text1 = "Héllo World";
		expect(generateSlug(text1)).toBe(
			`hello-world-${generateMD5(text1).slice(0, 8)}`,
		);

		const text2 = "über straße";
		expect(generateSlug(text2)).toBe(
			`uber-strasse-${generateMD5(text2).slice(0, 8)}`,
		);
	});
});

describe("transliterableChars", () => {
	it("should contain expected transliterable characters", () => {
		const testCases = [
			"À",
			"Á",
			"Â",
			"Ã",
			"Ä",
			"Å",
			"Æ",
			"Ç",
			"È",
			"É",
			"Ê",
			"Ë",
			"Ì",
			"Í",
			"Î",
			"Ï",
			"Ð",
			"Ñ",
			"Ò",
			"Ó",
			"Ô",
			"Õ",
			"Ö",
			"Ø",
			"Ù",
			"Ú",
			"Û",
			"Ü",
			"Ý",
			"Þ",
			"ß",
			"à",
			"á",
			"â",
			"ã",
			"ä",
			"å",
			"æ",
			"ç",
			"è",
			"é",
			"ê",
			"ë",
			"ì",
			"í",
			"î",
			"ï",
			"ð",
			"ñ",
			"ò",
			"ó",
			"ô",
			"õ",
			"ö",
			"ø",
			"ù",
			"ú",
			"û",
			"ü",
			"ý",
			"þ",
			"ÿ",
			"œ",
			"Œ",
			"Š",
			"š",
			"Ÿ",
			"ƒ",
		];

		testCases.forEach((char) => {
			expect(transliterableChars.has(char)).toBe(true);
		});
	});

	it("should not contain non-transliterable characters", () => {
		const testCases = ["@", "#", "你", "好", "世", "界"];
		testCases.forEach((char) => {
			expect(transliterableChars.has(char)).toBe(false);
		});
	});
});

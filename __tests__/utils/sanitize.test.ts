import { sanitizeContent } from "@/utils/sanitize";

describe("sanitizeContent", () => {
	describe("HTML removal", () => {
		it("should remove basic HTML tags", () => {
			expect(sanitizeContent("<p>Hello</p>")).toBe("Hello");
			expect(sanitizeContent("<div>Test</div>")).toBe("Test");
		});

		it("should remove HTML tags with attributes", () => {
			expect(sanitizeContent('<p class="test">Hello</p>')).toBe("Hello");
			expect(sanitizeContent('<div id="main" class="content">Test</div>')).toBe(
				"Test",
			);
		});

		it("should remove nested HTML tags", () => {
			expect(sanitizeContent("<div><p>Hello</p></div>")).toBe("Hello");
		});
	});

	describe("URL removal", () => {
		it("should remove HTTP URLs", () => {
			expect(sanitizeContent("Visit http://example.com")).toBe("Visit");
			expect(sanitizeContent("Check http://test.com/page")).toBe("Check");
		});

		it("should remove HTTPS URLs", () => {
			expect(sanitizeContent("Visit https://example.com")).toBe("Visit");
		});

		it("should remove FTP URLs while preserving surrounding words", () => {
			expect(sanitizeContent("Download from ftp://files.example.com")).toBe(
				"Download from",
			);
		});
	});

	describe("Script tag removal", () => {
		it("should remove script tags and their contents", () => {
			expect(
				sanitizeContent('Hello <script>alert("test")</script> World'),
			).toBe("Hello World");
		});

		it("should remove script tags with attributes", () => {
			expect(
				sanitizeContent(
					'Hello <script type="text/javascript">alert("test")</script> World',
				),
			).toBe("Hello World");
		});
	});

	describe("Special character handling", () => {
		it("should keep basic punctuation", () => {
			expect(sanitizeContent("Hello, world! How are you?")).toBe(
				"Hello, world! How are you?",
			);
			expect(sanitizeContent("This is a test.")).toBe("This is a test.");
		});

		it("should remove special characters", () => {
			expect(sanitizeContent("Hello @#$% world")).toBe("Hello world");
			expect(sanitizeContent("Test *&^% case")).toBe("Test case");
		});

		it("should keep hyphens in words", () => {
			expect(sanitizeContent("well-known example")).toBe("well-known example");
		});
	});

	describe("SQL keyword preservation", () => {
		it("should preserve common English words that overlap with SQL keywords", () => {
			expect(sanitizeContent("A message from the heart")).toBe(
				"A message from the heart",
			);
			expect(sanitizeContent("Where there is love")).toBe(
				"Where there is love",
			);
			expect(sanitizeContent("Update your outlook and join us")).toBe(
				"Update your outlook and join us",
			);
		});

		it("should preserve words regardless of case (no SQL stripping)", () => {
			expect(sanitizeContent("Select From Where")).toBe("Select From Where");
			expect(sanitizeContent("INSERT into DELETE")).toBe("INSERT into DELETE");
		});

		it("should not provide injection protection (DB access is parameterized)", () => {
			// Words are preserved; only the non-word "*" is stripped as a special char
			expect(sanitizeContent("SELECT * FROM users")).toBe("SELECT FROM users");
			expect(sanitizeContent("DROP TABLE students")).toBe(
				"DROP TABLE students",
			);
		});
	});

	describe("Whitespace handling", () => {
		it("should trim leading and trailing whitespace", () => {
			expect(sanitizeContent("  hello  ")).toBe("hello");
		});

		it("should normalize multiple spaces", () => {
			expect(sanitizeContent("hello    world")).toBe("hello world");
		});

		it("should handle tabs and newlines", () => {
			expect(sanitizeContent("hello\n\nworld\t\ttest")).toBe(
				"hello world test",
			);
		});
	});

	describe("Combined scenarios", () => {
		it("should handle multiple types of content together", () => {
			const input = `
        <div>Hello, world!</div>
        <script>alert('test')</script>
        Check https://example.com
        SELECT * FROM users
        Special @#$% chars
        Multiple     spaces
      `;
			expect(sanitizeContent(input)).toBe(
				"Hello, world! Check SELECT FROM users Special chars Multiple spaces",
			);
		});
	});
});

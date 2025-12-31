import { formSchemas, messageSchemas } from "@/lib/validation/schemas";

describe("Validation Schemas with Sanitization", () => {
	describe("messageSchemas.create", () => {
		it("should sanitize XSS attacks in message text", () => {
			const maliciousInput = {
				text: '<script>alert("xss")</script>Hello World',
				author: "Test Author",
				clerkUserId: "user_123",
			};

			const result = messageSchemas.create.parse(maliciousInput);
			expect(result.text).toBe("Hello World");
			expect(result.text).not.toContain("<script>");
			expect(result.text).not.toContain("alert");
		});

		it("should sanitize HTML injection in message text", () => {
			const maliciousInput = {
				text: "<img src=x onerror=alert(1)>Innocent message",
				clerkUserId: "user_123",
			};

			const result = messageSchemas.create.parse(maliciousInput);
			expect(result.text).toBe("Innocent message");
			expect(result.text).not.toContain("<img");
			expect(result.text).not.toContain("onerror");
		});

		it("should sanitize SQL injection keywords", () => {
			const maliciousInput = {
				text: "Nice message'; DROP TABLE messages; SELECT * FROM users; --",
				clerkUserId: "user_123",
			};

			const result = messageSchemas.create.parse(maliciousInput);
			// The sanitizer removes dangerous SQL keywords (DROP, SELECT, FROM) but keeps common words (TABLE, messages)
			// Apostrophes are preserved to support contractions like "don't", "it's", etc.
			expect(result.text).toBe("Nice message' TABLE messages users --");
			expect(result.text).not.toContain("DROP");
			expect(result.text).not.toContain("SELECT");
			expect(result.text).not.toContain("FROM");
		});

		it("should remove malicious URLs", () => {
			const maliciousInput = {
				text: "Check out this site: https://malicious-site.com/steal-data",
				clerkUserId: "user_123",
			};

			const result = messageSchemas.create.parse(maliciousInput);
			expect(result.text).toBe("Check out this site");
			expect(result.text).not.toContain("https://");
			expect(result.text).not.toContain("malicious-site.com");
		});

		it("should sanitize author field as well", () => {
			const maliciousInput = {
				text: "Normal message",
				author: '<script>alert("author xss")</script>Evil Author',
				clerkUserId: "user_123",
			};

			const result = messageSchemas.create.parse(maliciousInput);
			expect(result.author).toBe("Evil Author");
			expect(result.author).not.toContain("<script>");
			expect(result.author).not.toContain("alert");
		});

		it("should handle empty author field correctly", () => {
			const input = {
				text: "Normal message",
				author: "",
				clerkUserId: "user_123",
			};

			const result = messageSchemas.create.parse(input);
			expect(result.author).toBeUndefined();
		});

		it("should preserve safe content while removing malicious parts", () => {
			const mixedInput = {
				text: "This is a <b>good</b> message with SELECT some bad keywords and <script>alert(1)</script>",
				clerkUserId: "user_123",
			};

			const result = messageSchemas.create.parse(mixedInput);
			expect(result.text).toBe(
				"This is a good message with some bad keywords and",
			);
			expect(result.text).not.toContain("<b>");
			expect(result.text).not.toContain("SELECT");
			expect(result.text).not.toContain("<script>");
		});

		it("should enforce length limits after sanitization", () => {
			const longMaliciousInput = {
				text: `${"<script>".repeat(200)}Short message`,
				clerkUserId: "user_123",
			};

			const result = messageSchemas.create.parse(longMaliciousInput);
			expect(result.text).toBe("Short message");
			expect(result.text.length).toBeLessThan(1000);
		});

		it("should reject messages that are too short after sanitization", () => {
			const shortAfterSanitization = {
				text: "<script>hi</script>", // Will become just 'hi' (2 chars)
				clerkUserId: "user_123",
			};

			expect(() => messageSchemas.create.parse(shortAfterSanitization)).toThrow(
				"Message must be at least 3 characters after sanitization",
			);
		});

		it("should reject messages that are empty after sanitization", () => {
			const emptyAfterSanitization = {
				text: "<script></script><div></div>", // Will become empty
				clerkUserId: "user_123",
			};

			expect(() => messageSchemas.create.parse(emptyAfterSanitization)).toThrow(
				"Message cannot be empty after sanitization",
			);
		});
	});

	describe("formSchemas.createMessage", () => {
		it("should apply same sanitization to form data", () => {
			const maliciousFormData = {
				content: '<script>alert("form xss")</script>Form message',
				author: "<b>Bold Author</b>",
				userId: "user_123",
			};

			const result = formSchemas.createMessage.parse(maliciousFormData);
			expect(result.content).toBe("Form message");
			expect(result.author).toBe("Bold Author");
			expect(result.content).not.toContain("<script>");
			expect(result.author).not.toContain("<b>");
		});
	});
});

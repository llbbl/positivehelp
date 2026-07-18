import { describe, expect, it } from "@jest/globals";
import { generateAPIToken, hashToken, verifyApiToken } from "@/lib/tokens";

describe("tokens", () => {
	describe("generateAPIToken", () => {
		it("returns a string starting with ph_", () => {
			const token = generateAPIToken();
			expect(token.startsWith("ph_")).toBe(true);
		});

		it("produces unique tokens on successive calls", () => {
			const a = generateAPIToken();
			const b = generateAPIToken();
			const c = generateAPIToken();
			expect(a).not.toBe(b);
			expect(b).not.toBe(c);
			expect(a).not.toBe(c);
		});
	});

	describe("hashToken", () => {
		it("produces a 64-character hex digest", () => {
			const hash = hashToken("ph_test-token");
			expect(hash).toMatch(/^[a-f0-9]{64}$/);
		});

		it("is deterministic for the same input", () => {
			const a = hashToken("ph_test-token");
			const b = hashToken("ph_test-token");
			expect(a).toBe(b);
		});

		it("produces different hashes for different inputs", () => {
			const a = hashToken("ph_token-one");
			const b = hashToken("ph_token-two");
			expect(a).not.toBe(b);
		});
	});

	describe("verifyApiToken", () => {
		it("returns true for a matching token/hash pair", () => {
			const token = "ph_match-me";
			const stored = hashToken(token);
			expect(verifyApiToken(token, stored)).toBe(true);
		});

		it("returns false for a mismatched token", () => {
			const stored = hashToken("ph_correct-token");
			expect(verifyApiToken("ph_wrong-token", stored)).toBe(false);
		});

		it("returns false for a too-short stored hash", () => {
			const token = "ph_some-token";
			expect(verifyApiToken(token, "abc123")).toBe(false);
		});

		it("returns false for a too-long stored hash", () => {
			const token = "ph_some-token";
			const tooLong = "a".repeat(65);
			expect(verifyApiToken(token, tooLong)).toBe(false);
		});

		it("returns false for an empty stored hash", () => {
			const token = "ph_some-token";
			expect(verifyApiToken(token, "")).toBe(false);
		});

		it("does not throw for valid inputs", () => {
			const token = "ph_smoke-test";
			const stored = hashToken(token);
			expect(() => verifyApiToken(token, stored)).not.toThrow();
		});
	});
});

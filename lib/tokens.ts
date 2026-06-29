import crypto from "node:crypto";

/**
 * Generates a secure API token for desktop app authentication.
 * The token is prefixed with "ph_" for easy identification.
 *
 * @returns A secure base64url-encoded token with "ph_" prefix
 */
export function generateAPIToken(): string {
	const randomBytes = crypto.randomBytes(32);
	const token = randomBytes.toString("base64url");
	return `ph_${token}`;
}

/**
 * Hashes a raw API token with SHA-256 for safe at-rest storage.
 * The returned hex digest is what gets persisted in the api_tokens.token column.
 *
 * @param token - The raw `ph_`-prefixed token presented by the client
 * @returns A 64-character lowercase hex SHA-256 digest
 */
export function hashToken(token: string): string {
	return crypto.createHash("sha256").update(token).digest("hex");
}

/**
 * Verifies a presented token against a stored SHA-256 hash using a
 * constant-time comparison to mitigate timing attacks.
 *
 * @param presentedToken - The raw `ph_`-prefixed token from the client
 * @param storedHash - The SHA-256 hex digest persisted in the database
 * @returns true if the presented token hashes to the stored hash
 */
export function verifyApiToken(
	presentedToken: string,
	storedHash: string,
): boolean {
	const presentedHash = hashToken(presentedToken);
	const a = Buffer.from(presentedHash, "utf8");
	const b = Buffer.from(storedHash, "utf8");
	if (a.length !== b.length) {
		return false;
	}
	return crypto.timingSafeEqual(a, b);
}

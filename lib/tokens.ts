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

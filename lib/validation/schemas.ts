import { z } from "zod";
import { sanitizeContent } from "@/utils/sanitize";

// Common validation patterns
const nonEmptyString = z.string().min(1, "This field is required");
const _positiveInteger = z
	.number()
	.int()
	.positive("Must be a positive integer");

// Message validation schemas
export const messageSchemas = {
	// For creating new messages
	create: z.object({
		text: z
			.string()
			.trim()
			.transform(sanitizeContent) // Apply content sanitization first
			.refine(
				(text) => text.length >= 3,
				"Message must be at least 3 characters after sanitization",
			)
			.refine(
				(text) => text.length <= 1000,
				"Message cannot exceed 1000 characters",
			)
			.refine(
				(text) => text.length > 0,
				"Message cannot be empty after sanitization",
			),
		author: z
			.string()
			.trim()
			.transform((val) => (val === "" ? undefined : sanitizeContent(val))) // Sanitize author too
			.optional()
			.refine(
				(val) => !val || val.length <= 100,
				"Author name cannot exceed 100 characters after sanitization",
			),
		clerkUserId: nonEmptyString,
	}),

	// For GET /api/messages query parameters
	query: z.object({
		lastId: z
			.string()
			.regex(/^\d+$/, "lastId must be a positive integer")
			.transform((val) => parseInt(val, 10))
			.refine((val) => val > 0, "lastId must be greater than 0")
			.optional(),
		t: z
			.string()
			.regex(/^\d+$/, "t must be a positive integer")
			.transform((val) => parseInt(val, 10))
			.optional(),
	}),
};

// Admin operation schemas
export const adminSchemas = {
	// For submission ID validation in URL params
	submissionId: z.object({
		id: z
			.string()
			.regex(/^\d+$/, "Submission ID must be a positive integer")
			.transform((val) => {
				const num = parseInt(val, 10);
				if (num <= 0) {
					throw new Error("Submission ID must be greater than 0");
				}
				return num;
			}),
	}),

	// For user ID validation in URL params
	userId: z.object({
		id: nonEmptyString.refine(
			(id) => id.startsWith("user_"),
			"User ID must be a valid Clerk user ID",
		),
	}),
};

// Server action schemas (for FormData)
export const formSchemas = {
	// For createMessage server action
	createMessage: z.object({
		content: z
			.string()
			.trim()
			.transform(sanitizeContent) // Apply content sanitization first
			.refine(
				(text) => text.length >= 3,
				"Message must be at least 3 characters after sanitization",
			)
			.refine(
				(text) => text.length <= 1000,
				"Message cannot exceed 1000 characters",
			)
			.refine(
				(text) => text.length > 0,
				"Message cannot be empty after sanitization",
			),
		author: z
			.string()
			.trim()
			.transform((val) => (val === "" ? undefined : sanitizeContent(val))) // Sanitize author too
			.optional()
			.refine(
				(val) => !val || val.length <= 100,
				"Author name cannot exceed 100 characters after sanitization",
			),
		userId: nonEmptyString,
	}),
};

// Type exports for use in components and API routes
export type MessageCreateInput = z.infer<typeof messageSchemas.create>;
export type MessageQueryInput = z.infer<typeof messageSchemas.query>;
export type SubmissionIdInput = z.infer<typeof adminSchemas.submissionId>;
export type UserIdInput = z.infer<typeof adminSchemas.userId>;
export type CreateMessageFormInput = z.infer<typeof formSchemas.createMessage>;

// Error formatting utility
export function formatZodError(error: z.ZodError): string {
	return error.issues
		.map((err: z.ZodIssue) => {
			const path = err.path.length > 0 ? `${err.path.join(".")}: ` : "";
			return `${path}${err.message}`;
		})
		.join(", ");
}

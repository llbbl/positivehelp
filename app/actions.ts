"use server";

import { auth } from "@clerk/nextjs/server";
import logger from "@/lib/logger";
import { formSchemas, validateFormData } from "@/lib/validation/types";

export async function createMessage(formData: FormData) {
	try {
		// Validate and sanitize form data using Zod
		const validatedData = validateFormData(formSchemas.createMessage)(formData);
		const { content: sanitizedContent, author, userId } = validatedData;

		// API call logic
		try {
			const apiUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/messages`;
			// console.log( 'Attempting to post to:', apiUrl );

			// Get the auth token
			const session = await auth();
			const token = await session.getToken();

			const response = await fetch(apiUrl, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({
					text: sanitizedContent,
					author: author && typeof author === "string" ? author : null,
					clerkUserId: userId,
				}),
			});

			if (!response.ok) {
				const errorText = await response.text();
				logger.error("API Error:", { status: response.status, errorText });
				throw new Error(
					`Failed to create message: ${response.status} ${errorText}`,
				);
			}

			return { success: true };
		} catch (error) {
			logger.error("Error details:", {
				error: error instanceof Error ? error.message : "Unknown error",
				stack: error instanceof Error ? error.stack : undefined,
			});
			return {
				error:
					error instanceof Error ? error.message : "Failed to create message",
			};
		}
	} catch (validationError) {
		// Handle validation errors from Zod
		return {
			error:
				validationError instanceof Error
					? validationError.message
					: "Invalid form data",
		};
	}
}
